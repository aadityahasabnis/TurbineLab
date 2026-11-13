import { DEFAULTS, PRESETS, computeAll, getQualityStatus } from "./physics.mjs";
import { SOURCE_DEFAULTS, SOURCES, clampSourceInputs, computeSource } from "./models/index.mjs";
import { renderCycleChart, renderEfficiencyChart, renderSankey, updateSankeyTooltip } from "./visualizations.mjs";
import { bindEvents } from "./events.mjs";
import { createTurbine } from "./turbine.mjs";
import { createShareHandler, readSharedState, updateShareUrl } from "./sharing.mjs";
import { initializeDashboardLayout } from "./dashboard-layout.mjs";
import { bindRenewableEvents, renderRenewable } from "./renewable-ui.mjs";
import { buildDaySeries, PROFILE_OPTIONS } from "./models/profiles.mjs";
import { simulateHybrid } from "./models/hybrid.mjs";
import { bindHybridEvents, renderHybrid } from "./hybrid-ui.mjs";

const state = {
  source: "steam",
  inputs: { ...DEFAULTS },
  sourceInputs: Object.fromEntries(Object.entries(SOURCE_DEFAULTS).map(([source, inputs]) => [source, { ...inputs }])),
  results: null,
  ui: { theme: "dark", chart: "ts", compare: null, renewablePins: {}, activeScenario: null, activePreset: null, dayProfile: "balanced", dayHour: 12, hybridHour: 12, hybridPlaying: false }
};

const dom = Object.fromEntries([
  "pressureMPa", "tempC", "flowKgS", "turbineEff", "condenserKPa"
].map((key) => [key, document.querySelector(`[name="${key}"]`)]));
const readouts = {
  pressureMPa: document.querySelector("#pressure-value"),
  tempC: document.querySelector("#temperature-value"),
  flowKgS: document.querySelector("#flow-value"),
  turbineEff: document.querySelector("#turbine-eff-value"),
  condenserKPa: document.querySelector("#condenser-value")
};
const units = { pressureMPa: "MPa", tempC: "°C", flowKgS: "kg/s", turbineEff: "%", condenserKPa: "kPa" };
const countTargets = { power: 0, efficiency: 0, quality: 0, rpm: 0, mobilePower: 0, mobileEfficiency: 0, heat: 0 };
const displayedCounts = { ...countTargets };
const countStarts = { ...countTargets };
const countElapsed = { ...countTargets };
const countElements = {
  power: document.querySelector("#power-value"),
  efficiency: document.querySelector("#efficiency-value"),
  quality: document.querySelector("#quality-value"),
  rpm: document.querySelector("#rpm-value"),
  mobilePower: document.querySelector("#mobile-power"),
  mobileEfficiency: document.querySelector("#mobile-efficiency"),
  heat: document.querySelector("#heat-value")
};
const counterDecimals = { power: 1, efficiency: 1, quality: 1, rpm: 0, mobilePower: 1, mobileEfficiency: 1, heat: 1 };
const COUNT_TWEEN_MS = 280;
const canvas = document.querySelector("#turbine-canvas");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const turbine = createTurbine(canvas, () => state, reduceMotion);
let animationFrame = 0;
let lastFrame = 0;
let toastTimer;
const shareSetup = createShareHandler(showToast);

function setTheme() {
  const savedTheme = localStorage.getItem("EnergyLab-theme") || localStorage.getItem("TurbineLab-theme");
  state.ui.theme = savedTheme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  document.documentElement.dataset.theme = state.ui.theme;
  document.querySelector("#theme-toggle").setAttribute("aria-label", `Switch to ${state.ui.theme === "dark" ? "light" : "dark"} theme`);
}

function toggleTheme() {
  state.ui.theme = state.ui.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = state.ui.theme;
  localStorage.setItem("EnergyLab-theme", state.ui.theme);
  document.querySelector("#theme-toggle").setAttribute("aria-label", `Switch to ${state.ui.theme === "dark" ? "light" : "dark"} theme`);
  render(state);
}

function setInputValues(inputs) {
  state.inputs = clampSourceInputs(state.source, inputs);
  state.sourceInputs[state.source] = { ...state.inputs };
  state.ui.activePreset = null;
  for (const [key, input] of Object.entries(dom)) {
    input.value = state.inputs[key];
    updateSlider(input);
  }
}

function updateSlider(input) {
  const progress = ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
  input.style.setProperty("--range-progress", `${progress}%`);
}

function updateInputLabels() {
  for (const [key, input] of Object.entries(dom)) {
    const value = Number(state.inputs[key]);
    const formatted = key === "pressureMPa" ? value.toFixed(1) : String(value);
    readouts[key].innerHTML = `${formatted} <small>${units[key]}</small>`;
    input.value = value;
    updateSlider(input);
  }
}

function updatePresetState() {
  document.querySelectorAll(".sim-grid .preset-card").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.preset === state.ui.activePreset);
  });
}

function setCounterTargets(results) {
  const targets = {
    power: results.powerMW,
    efficiency: results.efficiency * 100,
    quality: results.exitQuality === null ? 100 : results.exitQuality * 100,
    rpm: results.rpm,
    mobilePower: results.powerMW,
    mobileEfficiency: results.efficiency * 100,
    heat: results.heatInMW
  };
  for (const [key, value] of Object.entries(targets)) {
    countStarts[key] = displayedCounts[key];
    countTargets[key] = value;
    countElapsed[key] = 0;
  }
}

function render(state) {
  state.inputs = clampSourceInputs(state.source, state.inputs);
  state.sourceInputs[state.source] = { ...state.inputs };
  const isHybrid = state.source === "hybrid";
  const isRenewable = state.source === "wind" || state.source === "solar-pv";
  state.operatingInputs = { ...state.inputs };
  state.daySeries = null;
  if (isRenewable && state.ui.dayMode) {
    state.daySeries = buildDaySeries(state.source, state.inputs, state.ui.dayProfile, computeSource);
    const point = state.daySeries[state.ui.dayHour];
    if (state.source === "wind") state.operatingInputs.windSpeedMs = point.windSpeedMs;
    else Object.assign(state.operatingInputs, { irradianceWm2: point.irradianceWm2, ambientTempC: point.ambientTempC });
  }
  state.results = isHybrid ? simulateHybrid(state.inputs) : computeSource(state.source, state.operatingInputs);
  document.querySelector(".sim-grid").hidden = state.source !== "steam";
  document.querySelector("#renewable-workspace").hidden = !isRenewable;
  document.querySelector("#hybrid-workspace").hidden = !isHybrid;
  document.querySelector(".mobile-results").hidden = state.source !== "steam";
  document.querySelector("#layout-toggle").hidden = state.source !== "steam";
  document.body.classList.toggle("renewable-mode", isRenewable || isHybrid);
  document.querySelector("#source-select").value = state.source;
  if (isHybrid) {
    document.querySelector("#source-subtitle").textContent = "Explore a hybrid renewable system balancing generation, storage, load and grid flows.";
    document.querySelector("#source-model-tag").textContent = "WIND · SOLAR PV · STORAGE";
    renderHybrid(state);
    updateShareUrl(state.source, state.inputs, null, state.ui);
    return;
  }
  if (isRenewable) {
    renderRenewable(state);
    updateShareUrl(state.source, state.inputs, state.ui.renewablePins[state.source]?.inputs ?? null, state.ui);
    return;
  }
  document.querySelector("#source-subtitle").textContent = "Explore how steam conditions shape turbine output, cycle efficiency, and rejected heat.";
  document.querySelector("#source-model-tag").textContent = "RANKINE CYCLE · TEACHING APPROXIMATION";
  updateInputLabels();
  updatePresetState();
  setCounterTargets(state.results);
  renderEfficiencyChart(document.querySelector("#efficiency-chart"), state.inputs, state.results, state.ui.compare, computeAll);
  renderCycleChart(document.querySelector("#cycle-chart"), state.inputs, state.results, state.ui.chart, computeAll, state.ui.compare);
  renderSankey(document.querySelector("#sankey-chart"), state.results, matchMedia("(max-width: 639px)").matches);
  document.querySelector(".sim-grid").dataset.chartMobile = state.ui.chart;

  const status = getQualityStatus(state.results.exitQuality);
  const qualityPill = document.querySelector("#quality-status");
  const qualityUnit = document.querySelector("#quality-value + small");
  qualityUnit.hidden = state.results.exitQuality === null;
  if (state.results.exitQuality === null) countElements.quality.textContent = "DRY";
  qualityPill.className = `status-pill${status === "green" ? "" : ` is-${status}`}`;
  qualityPill.textContent = status === "red" ? "WET STEAM" : status === "amber" ? "CAUTION" : status === "superheated" ? "SUPERHEATED" : "HEALTHY";
  qualityPill.setAttribute("aria-label", `Steam quality status: ${status}`);

  const warning = document.querySelector("#warning-banner");
  const warnings = [];
  if (status === "red") warnings.push("Wet-steam risk: exit quality is below 85%. Turbine blade erosion risk increases.");
  if (state.results.powerMW < 5) warnings.push("Low output: turbine is near stall. Increase steam flow or inlet conditions.");
  if (state.inputs.tempC < state.results.saturationTempC) warnings.push(`Inlet temperature is below saturation at this pressure; the model uses ${state.results.saturationTempC.toFixed(0)} °C saturated steam.`);
  warning.textContent = warnings.join(" ");
  warning.hidden = warnings.length === 0;

  document.querySelector("#turbine-caption-rpm").textContent = `${Math.round(state.results.rpm).toLocaleString()} RPM`;
  document.querySelector("#flow-meter").value = state.inputs.flowKgS;
  document.querySelector("#mass-flow-readout").textContent = `${state.inputs.flowKgS} kg/s`;
  document.querySelector("#heat-value").setAttribute("aria-label", `${state.results.heatInMW.toFixed(1)} megawatts thermal input`);
  const workShare = state.results.heatInMW ? Math.max(0, state.results.workMW / state.results.heatInMW) : 0;
  const rejectedShare = state.results.heatInMW ? Math.max(0, state.results.wasteMW / state.results.heatInMW) : 0;
  const balanceDelta = Math.abs(state.results.heatInMW - state.results.workMW - state.results.wasteMW);
  const balanceStatus = document.querySelector("#balance-status");
  balanceStatus.textContent = balanceDelta < 0.001 ? `BALANCED · Δ ${balanceDelta.toFixed(2)} MW` : `IMBALANCE · Δ ${balanceDelta.toFixed(2)} MW`;
  balanceStatus.classList.toggle("is-invalid", balanceDelta >= 0.001);
  document.querySelector("#energy-input").textContent = `${state.results.heatInMW.toFixed(1)} MW`;
  document.querySelector("#energy-work").textContent = `${state.results.workMW.toFixed(1)} MW`;
  document.querySelector("#energy-rejected").textContent = `${state.results.wasteMW.toFixed(1)} MW`;
  document.querySelector("#energy-work-bar").style.width = `${workShare * 100}%`;
  document.querySelector("#energy-rejected-bar").style.width = `${rejectedShare * 100}%`;
  document.querySelector(".energy-split").setAttribute("aria-label", `${(workShare * 100).toFixed(1)}% net shaft work and ${(rejectedShare * 100).toFixed(1)}% rejected heat`);
  document.querySelector("#explanation").textContent = explainResults(state.inputs, state.results);
  document.querySelector("#curve-insight").textContent = state.inputs.pressureMPa < 15
    ? "Increasing boiler pressure can improve cycle efficiency and turbine work."
    : "Efficiency gains flatten at high pressure; watch the moisture in the exhaust.";
  document.querySelector("#compare-button").setAttribute("aria-pressed", String(Boolean(state.ui.compare)));
  document.querySelector("#compare-button").textContent = state.ui.compare ? "✓ Pinned" : "＋ Compare";
  document.querySelector("#compare-legend").hidden = !state.ui.compare;
  const captions = {
    ts: "T–s · model states; schematic saturation dome",
    pv: `Pressure-volume cycle · vₑ ≈ ${state.results.specificVolume.toFixed(2)} m³/kg`,
    efficiency: "Cycle efficiency as boiler pressure changes"
  };
  document.querySelector("#diagram-caption").textContent = captions[state.ui.chart];
  updateSankeyTooltip(document.querySelector("#sankey-tooltip"), "heat", state.results);
  updateShareUrl(state.source, state.inputs, null, state.ui);
}

function explainResults(inputs, results) {
  const qualityMessage = results.exitQuality === null
    ? "The exhaust is superheated, so steam quality is not defined at this state."
    : results.exitQuality < 0.85
    ? "Exhaust moisture is high, so blade erosion risk is elevated."
    : results.exitQuality < 0.9 ? "Exhaust moisture is approaching the caution range." : "Exhaust steam quality is within the healthy range.";
  return `At ${inputs.flowKgS} kg/s, ${inputs.pressureMPa.toFixed(1)} MPa and ${inputs.tempC} °C, the turbine produces ${results.powerMW.toFixed(1)} MW of electricity at ${(results.efficiency * 100).toFixed(1)}% thermal efficiency. ${qualityMessage}`;
}

function selectChart(chart) {
  state.ui.chart = chart;
  document.querySelectorAll(".chart-tab").forEach((tab) => {
    const active = tab.dataset.chart === chart;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  render(state);
}

function setSource(source, reset = false) {
  if (!SOURCES[source]) return;
  state.sourceInputs[state.source] = { ...state.inputs };
  state.source = source;
  state.inputs = reset ? { ...SOURCE_DEFAULTS[source] } : { ...(state.sourceInputs[source] ?? SOURCE_DEFAULTS[source]) };
  if (reset) state.sourceInputs[source] = { ...state.inputs };
  state.ui.compare = null;
  state.ui.activeScenario = null;
  if (reset && state.source !== "steam") delete state.ui.renewablePins[state.source];
  state.ui.activePreset = null;
  render(state);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function bindTopbarVisibility() {
  let previousScroll = window.scrollY;
  let scheduled = false;
  const topbar = document.querySelector(".topbar");
  window.addEventListener("scroll", () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const currentScroll = window.scrollY;
      if (currentScroll < 12) topbar.classList.remove("is-hidden");
      else if (currentScroll > previousScroll + 2) topbar.classList.add("is-hidden");
      previousScroll = currentScroll;
    });
  }, { passive: true });
}

function animate(timestamp) {
  animationFrame = 0;
  if (document.hidden) return;
  const delta = Math.min(48, timestamp - (lastFrame || timestamp));
  lastFrame = timestamp;
  for (const key of Object.keys(countTargets)) {
    countElapsed[key] = Math.min(COUNT_TWEEN_MS, countElapsed[key] + delta);
    const progress = countElapsed[key] / COUNT_TWEEN_MS;
    const eased = 1 - (1 - progress) ** 3;
    displayedCounts[key] = countStarts[key] + (countTargets[key] - countStarts[key]) * eased;
    countElements[key].textContent = displayedCounts[key].toFixed(counterDecimals[key]);
  }
  if (state.source === "steam" && turbine.isVisible()) turbine.draw(delta);
  animationFrame = requestAnimationFrame(animate);
}

setTheme();
initializeDashboardLayout();
bindTopbarVisibility();
const sharedState = readSharedState(location.search, SOURCE_DEFAULTS);
if (sharedState) {
  state.source = sharedState.source;
  state.inputs = clampSourceInputs(state.source, sharedState.inputs);
  state.sourceInputs[state.source] = { ...state.inputs };
  state.ui.dayMode = sharedState.ui?.dayMode ?? false;
  state.ui.dayProfile = PROFILE_OPTIONS.some((profile) => profile.id === sharedState.ui?.dayProfile) ? sharedState.ui.dayProfile : "balanced";
  state.ui.dayHour = Number.isFinite(sharedState.ui?.dayHour) ? Math.max(0, Math.min(23, sharedState.ui.dayHour)) : 12;
  state.ui.hybridHour = state.ui.dayHour;
  if (sharedState.pinInputs) state.ui.renewablePins[state.source] = { inputs: clampSourceInputs(state.source, sharedState.pinInputs), name: "Shared reference" };
}
render(state);
state.render = () => render(state);
bindEvents({
  state,
  dom,
  defaults: DEFAULTS,
  presets: PRESETS,
  setInputValues,
  render,
  shareSetup,
  toggleTheme,
  selectChart,
  updateSankeyTooltip
});
bindRenewableEvents({ state, render: state.render, setSource });
bindHybridEvents(state, state.render);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  } else if (!animationFrame) {
    lastFrame = 0;
    animationFrame = requestAnimationFrame(animate);
  }
});
animationFrame = requestAnimationFrame(animate);

import { computeSource, SOURCE_DEFAULTS } from "./models/index.mjs";

const SOURCE_COPY = {
  wind: {
    title: "Wind to electricity", controls: "Wind turbine controls", tag: "WIND TURBINE",
    subtitle: "Set hub-height wind and turbine characteristics to inspect an operating point.", resource: "WIND-STREAM POWER", scenarios: [
      { id: "calm", title: "Below cut-in", detail: "2 m/s · turbine stopped", patch: { windSpeedMs: 2 } },
      { id: "rated", title: "Rated point", detail: "12 m/s · rated output", patch: { windSpeedMs: 12 } },
      { id: "cutout", title: "Cut-out protection", detail: "26 m/s · shutdown", patch: { windSpeedMs: 26 } }
    ]
  },
  "solar-pv": {
    title: "Sunlight to electricity", controls: "Solar PV controls", tag: "PHOTOVOLTAIC ARRAY",
    subtitle: "Set plane-of-array irradiance, ambient temperature, and system assumptions.", resource: "PLANE-OF-ARRAY SUNLIGHT", scenarios: [
      { id: "low-sun", title: "Low irradiance", detail: "250 W/m² · reduced light", patch: { irradianceWm2: 250 } },
      { id: "reference", title: "Reference midday", detail: "1,000 W/m² · 25 °C ambient", patch: { irradianceWm2: 1000, ambientTempC: 25 } },
      { id: "hot-array", title: "Hot array", detail: "900 W/m² · 40 °C ambient", patch: { irradianceWm2: 900, ambientTempC: 40 } }
    ]
  }
};

const CONTROL_META = {
  windSpeedMs: { output: "wind-speed-value", decimals: 1, suffix: "m/s" }, rotorRadiusM: { output: "rotor-radius-value", decimals: 0, suffix: "m" },
  ratedPowerKW: { output: "rated-power-value", decimals: 0, suffix: "kW" }, cutInMs: { output: "cut-in-value", decimals: 1, suffix: "m/s" },
  ratedMs: { output: "rated-speed-value", decimals: 1, suffix: "m/s" }, cutOutMs: { output: "cut-out-value", decimals: 1, suffix: "m/s" },
  capacityKW: { output: "pv-capacity-value", decimals: 0, suffix: "kWp" }, irradianceWm2: { output: "irradiance-value", decimals: 0, suffix: "W/m²" },
  ambientTempC: { output: "ambient-temp-value", decimals: 0, suffix: "°C" }, systemLossPct: { output: "system-loss-value", decimals: 0, suffix: "%" }
};

function formatMW(value) { return (value / 1000).toFixed(2); }
function themeColor(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function matchingScenario(source, inputs) {
  return SOURCE_COPY[source].scenarios.find((scenario) => {
    const expected = { ...SOURCE_DEFAULTS[source], ...scenario.patch };
    return Object.entries(expected).every(([key, value]) => Number(inputs[key]) === Number(value));
  }) ?? null;
}

function renderScene(host, state, result) {
  const isWind = state.source === "wind";
  const theme = document.documentElement.dataset.theme;
  const needsBuild = host.dataset.sceneSource !== state.source || host.dataset.sceneTheme !== theme;
  const updateTheme = () => { host.dataset.sceneTheme = theme; };
  host.classList.toggle("is-wind", isWind);
  host.classList.toggle("is-solar", !isWind);
  if (isWind) {
    host.classList.remove("has-sunlight");
    const stopped = result.operatingState === "below cut-in" || result.operatingState === "at cut-in threshold" || result.operatingState === "above cut-out";
    const powerFraction = Math.min(1, result.powerKW / Math.max(1, state.inputs.ratedPowerKW));
    host.style.setProperty("--wind-flow-duration", `${Math.max(.55, 3.2 - state.inputs.windSpeedMs / 30 * 2.4)}s`);
    host.style.setProperty("--rotor-duration", `${(4.2 - powerFraction * 3.4).toFixed(2)}s`);
    host.style.setProperty("--electric-flow-duration", `${(2.1 - powerFraction * 1.2).toFixed(2)}s`);
    host.classList.toggle("has-wind", state.inputs.windSpeedMs > 0);
    host.classList.toggle("has-electricity", result.powerKW > 0);
    host.classList.toggle("is-stopped", stopped);
    host.setAttribute("aria-label", `Wind turbine diagram. Wind speed ${state.inputs.windSpeedMs} metres per second; ${result.operatingState}; electrical output ${formatMW(result.powerKW)} megawatts. Rotor animation is illustrative; rotor RPM is not modeled.`);
    if (!needsBuild) {
      host.querySelector(".scene-wind-value").textContent = `${state.inputs.windSpeedMs.toFixed(1)} m/s`;
      host.querySelector(".scene-rotor-label").textContent = `ROTOR RADIUS ${state.inputs.rotorRadiusM} m`;
      host.querySelector(".scene-status").textContent = `${result.operatingState.toUpperCase()} · RATED CAPACITY ${formatMW(state.inputs.ratedPowerKW)} MW`;
      host.querySelector(".scene-output").textContent = `${formatMW(result.powerKW)} MW`;
      host.querySelector(".wind-stream").setAttribute("opacity", `${Math.min(.75, state.inputs.windSpeedMs / 30)}`);
      return;
    }
    host.dataset.sceneSource = state.source;
    updateTheme();
    const color = themeColor("--cyan");
    host.innerHTML = `<svg viewBox="0 0 760 250" role="img" aria-labelledby="wind-title wind-desc"><title id="wind-title">Wind turbine resource and electrical output</title><desc id="wind-desc">Wind streak speed follows the selected wind input. Rotor rotation responds to estimated electrical output as an illustration; this model does not calculate rotor RPM. Rotor and tower drawing are not to scale.</desc><defs><linearGradient id="wind-sky" x2="0" y2="1"><stop stop-color="${color}" stop-opacity=".10"/><stop offset="1" stop-color="${themeColor("--surface-raised")}" stop-opacity=".18"/></linearGradient><marker id="wind-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="${color}"/></marker></defs><rect x="1" y="1" width="758" height="248" rx="14" fill="url(#wind-sky)"/><text x="28" y="35" class="scene-label">HUB-HEIGHT WIND</text><text x="28" y="62" class="scene-value scene-wind-value">${state.inputs.windSpeedMs.toFixed(1)} m/s</text><path class="wind-stream" d="M28 90H272 M28 111H272 M28 132H272" opacity="${Math.min(.75, state.inputs.windSpeedMs / 30)}"/><path d="M270 111H307" stroke="${color}" stroke-width="3" marker-end="url(#wind-arrow)"/><g class="wind-rotor"><path d="M326 78 Q333 34 342 14 Q349 6 352 23 L356 70Z"/><path d="M326 78 Q333 34 342 14 Q349 6 352 23 L356 70Z" transform="rotate(120 326 78)"/><path d="M326 78 Q333 34 342 14 Q349 6 352 23 L356 70Z" transform="rotate(240 326 78)"/><circle cx="326" cy="78" r="10"/></g><path d="M326 88L344 214H307Z" fill="${themeColor("--surface-raised")}" stroke="${color}" stroke-width="2"/><path d="M300 214h52" stroke="${themeColor("--border-strong")}" stroke-width="4"/><text x="326" y="232" text-anchor="middle" class="scene-label scene-rotor-label">ROTOR RADIUS ${state.inputs.rotorRadiusM} m</text><path d="M356 78H451" stroke="${color}" stroke-width="3"/><rect x="454" y="48" width="116" height="60" rx="8" fill="${themeColor("--surface-raised")}" stroke="${color}" stroke-width="2"/><path d="M508 61l-11 17h13l-7 16 22-24h-14l7-9z" fill="${themeColor("--amber")}"/><text x="512" y="130" text-anchor="middle" class="scene-label">TURBINE + GENERATOR</text><path d="M572 78H627" stroke="${color}" stroke-width="3" marker-end="url(#wind-arrow)" class="power-flow"/><text x="681" y="75" text-anchor="middle" class="scene-output">${formatMW(result.powerKW)} MW</text><text x="681" y="98" text-anchor="middle" class="scene-label">ELECTRIC OUTPUT</text><rect x="28" y="169" width="704" height="42" rx="7" fill="${themeColor("--surface-raised")}" stroke="${themeColor("--border")}"/><circle cx="47" cy="190" r="5" fill="${stopped ? themeColor("--amber") : color}"/><text x="62" y="194" class="scene-label scene-status">${result.operatingState.toUpperCase()} · RATED CAPACITY ${formatMW(state.inputs.ratedPowerKW)} MW</text><text x="28" y="235" class="scene-note">Rotor motion is illustrative; rotor RPM is not modeled</text></svg>`;
  } else {
    host.classList.remove("has-wind", "is-stopped");
    const irradiance = state.inputs.irradianceWm2;
    const sunlightOpacity = Math.min(.95, irradiance / 1000);
    const outputFraction = Math.min(1, result.powerKW / Math.max(1, state.inputs.capacityKW));
    host.style.setProperty("--sunlight-duration", `${Math.max(.6, 2.6 - irradiance / 1200 * 1.8)}s`);
    host.style.setProperty("--pv-flow-duration", `${(2.2 - outputFraction * 1.25).toFixed(2)}s`);
    host.style.setProperty("--sunlight", `${sunlightOpacity}`);
    host.classList.toggle("has-sunlight", irradiance > 0);
    host.classList.toggle("has-electricity", result.powerKW > 0);
    host.classList.remove("is-stopped");
    host.setAttribute("aria-label", `Solar PV diagram. Plane-of-array irradiance ${irradiance} watts per square metre; DC array output ${formatMW(result.dcPowerKW)} megawatts; AC electrical output ${formatMW(result.powerKW)} megawatts. Ray and flow motion is illustrative, not a physical velocity.`);
    if (!needsBuild) {
      host.querySelector(".scene-irradiance").textContent = `${irradiance} W/m²`;
      host.querySelector(".scene-array-output").textContent = `PV ARRAY · ${formatMW(result.dcPowerKW)} MW DC`;
      host.querySelector(".scene-output").textContent = `${formatMW(result.powerKW)} MW`;
      host.querySelectorAll(".solar-disc, .solar-rays, .sunlight-flow").forEach((element) => element.setAttribute("opacity", `${sunlightOpacity}`));
      return;
    }
    host.dataset.sceneSource = state.source;
    updateTheme();
    const color = themeColor("--cyan");
    host.innerHTML = `<svg viewBox="0 0 760 250" role="img" aria-labelledby="pv-title pv-desc"><title id="pv-title">Solar photovoltaic array and inverter output</title><desc id="pv-desc">Moving light dashes follow the irradiance setting, and electrical flow follows estimated DC and AC power. Motion is illustrative, not a physical photon or electron velocity.</desc><defs><linearGradient id="solar-sky" x2="0" y2="1"><stop stop-color="${themeColor("--amber")}" stop-opacity=".12"/><stop offset="1" stop-color="${themeColor("--surface-raised")}" stop-opacity=".2"/></linearGradient><marker id="pv-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="${color}"/></marker></defs><rect x="1" y="1" width="758" height="248" rx="14" fill="url(#solar-sky)"/><circle class="solar-disc" cx="91" cy="75" r="27" fill="${themeColor("--amber")}" opacity="${sunlightOpacity}"/><g class="solar-rays" stroke="${themeColor("--amber")}" stroke-width="3" stroke-linecap="round" opacity="${sunlightOpacity}"><path d="M91 34V22 M91 128v-12 M50 75H38 M144 75h-12 M62 46l-9-9 M129 112l-9-9 M120 46l9-9 M53 112l9-9"/></g><text x="30" y="155" class="scene-label">IRRADIANCE</text><text x="30" y="176" class="scene-value scene-irradiance">${irradiance} W/m²</text><path class="sunlight-flow" d="M153 88H258" stroke="${themeColor("--amber")}" stroke-width="3" opacity="${sunlightOpacity}" marker-end="url(#pv-arrow)"/><g transform="translate(275 83) skewY(-8)"><rect x="0" y="0" width="198" height="96" rx="5" fill="${themeColor("--surface-raised")}" stroke="${color}" stroke-width="3"/><path d="M49.5 0v96 M99 0v96 M148.5 0v96 M0 32h198 M0 64h198" stroke="${color}" stroke-opacity=".5" stroke-width="2"/><path d="M25 97v14 M173 97v14 M5 112h188" stroke="${themeColor("--border-strong")}" stroke-width="4"/></g><text x="374" y="207" text-anchor="middle" class="scene-label scene-array-output">PV ARRAY · ${formatMW(result.dcPowerKW)} MW DC</text><path class="pv-dc-flow" d="M478 130H526" stroke="${color}" stroke-width="3" marker-end="url(#pv-arrow)"/><rect x="530" y="84" width="82" height="74" rx="8" fill="${themeColor("--surface-raised")}" stroke="${themeColor("--border-strong")}" stroke-width="2"/><path d="M551 101h40v39h-40z M556 110h30 M556 119h30 M556 128h30" fill="none" stroke="${color}" stroke-width="2"/><text x="571" y="178" text-anchor="middle" class="scene-label">INVERTER</text><path class="pv-ac-flow" d="M613 130H647" stroke="${color}" stroke-width="3" marker-end="url(#pv-arrow)"/><text x="696" y="121" text-anchor="middle" class="scene-output">${formatMW(result.powerKW)} MW</text><text x="696" y="143" text-anchor="middle" class="scene-label">AC OUTPUT</text><text x="28" y="232" class="scene-note">Ray motion shows irradiance; electrical flow follows modeled output</text></svg>`;
  }
}

function renderCurve(svg, state, result) {
  const source = state.source;
  const isWind = source === "wind";
  const xKey = isWind ? "windSpeedMs" : "irradianceWm2";
  const xMax = isWind ? 30 : 1200;
  const count = 49;
  const samples = Array.from({ length: count }, (_, index) => {
    const x = xMax * index / (count - 1);
    return { x, power: computeSource(source, { ...state.inputs, [xKey]: x }).powerKW };
  });
  const pin = state.ui.renewablePins?.[source] ?? null;
  const pinnedResult = pin ? computeSource(source, pin.inputs) : null;
  const peak = Math.max(1, ...samples.map((point) => point.power), pinnedResult?.powerKW ?? 0);
  const X = (value) => 48 + value / xMax * 640;
  const Y = (value) => 184 - value / peak * 146;
  const path = samples.map((point, index) => `${index ? "L" : "M"}${X(point.x).toFixed(1)},${Y(point.power).toFixed(1)}`).join(" ");
  const accent = themeColor("--cyan");
  const amber = themeColor("--amber");
  const faint = themeColor("--text-faint");
  const grid = themeColor("--chart-grid");
  const currentX = X(state.inputs[xKey]);
  const currentY = Y(result.powerKW);
  const pinnedX = pin ? X(pin.inputs[xKey]) : 0;
  const pinnedY = pinnedResult ? Y(pinnedResult.powerKW) : 0;
  const title = isWind ? "SIMPLIFIED TURBINE POWER CURVE" : "PV OUTPUT AT DIFFERENT IRRADIANCE";
  const xLabel = isWind ? "HUB-HEIGHT WIND SPEED (m/s)" : "PLANE-OF-ARRAY IRRADIANCE (W/m²)";
  const xTicks = isWind ? [0, 5, 10, 15, 20, 25, 30] : [0, 200, 400, 600, 800, 1000, 1200];
  const pinMarkup = pin ? `<line x1="${pinnedX}" y1="${pinnedY}" x2="${pinnedX}" y2="184" stroke="${faint}" stroke-dasharray="3 4"/><circle cx="${pinnedX}" cy="${pinnedY}" r="7" fill="${themeColor("--surface")}" stroke="${accent}" stroke-width="3"/><text x="${Math.min(620, pinnedX + 9)}" y="${Math.max(45, pinnedY + 15)}" fill="${accent}" font-size="9">PIN</text>` : "";
  svg.setAttribute("aria-label", `${title}; current output ${(result.powerKW / 1000).toFixed(2)} megawatts${pin ? `; pinned reference output ${(pinnedResult.powerKW / 1000).toFixed(2)} megawatts` : ""}`);
  svg.innerHTML = `<text x="48" y="18" fill="${faint}" font-size="9" letter-spacing="1">${title}</text><g stroke="${grid}" stroke-dasharray="3 5"><line x1="48" y1="38" x2="48" y2="184"/><line x1="48" y1="184" x2="688" y2="184"/><line x1="48" y1="111" x2="688" y2="111"/><line x1="48" y1="38" x2="688" y2="38"/></g><path d="${path}" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${pinMarkup}<line x1="${currentX}" y1="${currentY}" x2="${currentX}" y2="184" stroke="${amber}" stroke-dasharray="3 4"/><circle cx="${currentX}" cy="${currentY}" r="6" fill="${amber}" stroke="${themeColor("--surface")}" stroke-width="2"/><text x="${Math.min(620, currentX + 8)}" y="${Math.max(34, currentY - 9)}" fill="${amber}" font-size="9">NOW ${(result.powerKW / 1000).toFixed(2)} MW</text>${xTicks.map((tick) => `<text x="${X(tick)}" y="201" text-anchor="middle" fill="${faint}" font-size="8">${tick}</text>`).join("")}<text x="368" y="222" text-anchor="middle" fill="${faint}" font-size="8">${xLabel}</text><text x="38" y="42" text-anchor="end" fill="${faint}" font-size="8">${(peak / 1000).toFixed(1)} MW</text><text x="38" y="187" text-anchor="end" fill="${faint}" font-size="8">0</text>`;
}

function renderScenarios(state) {
  const host = document.querySelector("#renewable-scenario-cards");
  const config = SOURCE_COPY[state.source];
  const activeScenario = matchingScenario(state.source, state.inputs);
  state.ui.activeScenario = activeScenario?.id ?? null;
  document.querySelector("#renewable-scenario-state").textContent = activeScenario
    ? `CURRENT SETUP · ${activeScenario.title}`
    : "CURRENT SETUP · Custom operating point";
  host.innerHTML = config.scenarios.map((scenario) => `<button class="preset-card renewable-scenario" type="button" data-scenario="${scenario.id}" aria-pressed="${activeScenario?.id === scenario.id}"><span class="preset-icon ${state.source === "wind" ? "preset-nuclear" : "preset-solar"}">${state.source === "wind" ? "↗" : "☼"}</span><span><strong>${scenario.title}</strong><small>${scenario.detail}</small></span><span class="scenario-selected" aria-hidden="true">SELECTED</span></button>`).join("");
}

export function renderRenewable(state) {
  const config = SOURCE_COPY[state.source];
  const result = state.results;
  document.querySelector("#source-subtitle").textContent = config.subtitle;
  document.querySelector("#source-model-tag").textContent = config.tag;
  document.querySelector("#renewable-controls-title").textContent = config.controls;
  document.querySelector("#renewable-title").textContent = config.title;
  document.querySelector("#resource-label").textContent = config.resource;
  document.querySelector("#source-select").value = state.source;
  document.querySelectorAll(".source-controls").forEach((panel) => { panel.hidden = panel.dataset.modelSource !== state.source; });
  for (const [key, meta] of Object.entries(CONTROL_META)) {
    const input = document.querySelector(`#renewable-form [name="${key}"]`);
    if (!input) continue;
    input.value = state.inputs[key];
    const value = Number(state.inputs[key]);
    document.querySelector(`#${meta.output}`).innerHTML = `${value.toLocaleString(undefined, { minimumFractionDigits: meta.decimals, maximumFractionDigits: meta.decimals })} <small>${meta.suffix}</small>`;
    input.style.setProperty("--range-progress", `${((value - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100}%`);
  }
  document.querySelector("#renewable-power").textContent = formatMW(result.powerKW);
  document.querySelector("#renewable-resource").textContent = formatMW(result.availablePowerKW);
  document.querySelector("#renewable-loss").textContent = formatMW(result.lossesKW);
  document.querySelector("#renewable-efficiency").textContent = (result.conversionEfficiency * 100).toFixed(1);
  document.querySelector("#renewable-state").textContent = state.source === "wind" ? result.operatingState : `${result.cellTempC.toFixed(0)} °C estimated cell temperature`;
  renderScene(document.querySelector("#renewable-scene"), state, result);
  document.querySelector("#renewable-explanation").textContent = result.explanation;
  document.querySelector("#renewable-input").textContent = `${formatMW(result.availablePowerKW)} MW`;
  document.querySelector("#renewable-electricity").textContent = `${formatMW(result.powerKW)} MW`;
  document.querySelector("#renewable-rejected").textContent = `${formatMW(result.lossesKW)} MW`;
  const outputShare = result.availablePowerKW ? result.powerKW / result.availablePowerKW : 0;
  document.querySelector("#renewable-output-bar").style.width = `${Math.max(0, Math.min(1, outputShare)) * 100}%`;
  document.querySelector("#renewable-loss-bar").style.width = `${Math.max(0, 1 - outputShare) * 100}%`;
  document.querySelector(".renewable-lower .energy-split").setAttribute("aria-label", `${(outputShare * 100).toFixed(1)}% electricity and ${(Math.max(0, 1 - outputShare) * 100).toFixed(1)}% not converted`);
  document.querySelector("#renewable-model-note").textContent = result.modelNote;
  document.querySelector("#renewable-details").textContent = state.source === "wind"
    ? "Wind-stream power is calculated from air density, rotor swept area, and the cube of wind speed. A fixed power coefficient and drivetrain efficiency estimate capture; output is capped at rated power and stops outside cut-in/cut-out limits. This is not a manufacturer-certified power curve."
    : "The model estimates cell temperature from ambient temperature and irradiance using a NOCT approximation, applies a temperature coefficient, system losses, and inverter efficiency, then caps output at installed capacity. It does not model sun position, shading, snow, degradation, or hourly weather.";
  document.querySelector("#renewable-balance").textContent = Math.abs(result.availablePowerKW - result.powerKW - result.lossesKW) < 1e-6 ? "BALANCED" : "CHECK BALANCE";
  document.querySelector("#renewable-chart").setAttribute("aria-label", state.source === "wind" ? "Simplified wind turbine power curve" : "Solar PV output by irradiance");
  renderCurve(document.querySelector("#renewable-chart"), state, result);
  renderScenarios(state);
  const pin = state.ui.renewablePins?.[state.source] ?? null;
  document.body.classList.toggle("renewable-has-pin", Boolean(pin));
  const pinButton = document.querySelector("#renewable-compare");
  pinButton.setAttribute("aria-pressed", String(Boolean(pin)));
  pinButton.textContent = pin ? "Clear pinned setup" : "＋ Pin current setup";
  const compareCard = document.querySelector("#renewable-compare-card");
  compareCard.classList.toggle("has-pin", Boolean(pin));
  if (!pin) {
    compareCard.innerHTML = `<span class="compare-empty-mark" aria-hidden="true">＋</span><span><strong>No reference pinned</strong><small>Pin this setup, then select a scenario or change an input to compare output and show both operating points on the curve.</small></span>`;
  } else {
    const baseline = computeSource(state.source, pin.inputs);
    const delta = result.powerKW - baseline.powerKW;
    const resourceKey = state.source === "wind" ? "windSpeedMs" : "irradianceWm2";
    const resourceLabel = state.source === "wind" ? `${pin.inputs[resourceKey].toFixed(1)} m/s wind` : `${pin.inputs[resourceKey]} W/m² sunlight`;
    compareCard.innerHTML = `<div class="compare-card-head"><span class="compare-pin-icon" aria-hidden="true">⌖</span><span><strong>PINNED REFERENCE</strong><small>${pin.name} · ${resourceLabel}</small></span><span class="compare-card-output">${formatMW(baseline.powerKW)} <small>MW</small></span></div><div class="compare-card-result"><span>Current output <strong>${formatMW(result.powerKW)} MW</strong></span><span class="compare-delta ${delta > 0 ? "is-up" : delta < 0 ? "is-down" : ""}">Change <strong>${delta > 0 ? "+" : ""}${formatMW(delta)} MW</strong></span></div>`;
  }
}

export function bindRenewableEvents({ state, render, setSource }) {
  document.querySelector("#source-select").addEventListener("change", (event) => setSource(event.target.value));
  document.querySelectorAll("#renewable-form input").forEach((input) => input.addEventListener("input", () => {
    state.inputs[input.name] = Number(input.value);
    state.ui.activeScenario = null;
    render();
  }));
  document.querySelector("#renewable-reset").addEventListener("click", () => setSource(state.source, true));
  document.querySelector("#renewable-scenario-cards").addEventListener("click", (event) => {
    const button = event.target.closest("[data-scenario]");
    if (!button) return;
    const scenario = SOURCE_COPY[state.source].scenarios.find((item) => item.id === button.dataset.scenario);
    if (!scenario) return;
    state.inputs = { ...SOURCE_DEFAULTS[state.source], ...scenario.patch };
    state.ui.activeScenario = scenario.id;
    render();
  });
  document.querySelector("#renewable-compare").addEventListener("click", () => {
    state.ui.renewablePins ??= {};
    if (state.ui.renewablePins[state.source]) delete state.ui.renewablePins[state.source];
    else {
      const scenario = matchingScenario(state.source, state.inputs);
      state.ui.renewablePins[state.source] = { inputs: { ...state.inputs }, name: scenario?.title ?? "Custom operating point" };
    }
    render();
  });
}

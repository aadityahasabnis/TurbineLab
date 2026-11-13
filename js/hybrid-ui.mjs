import { PROFILE_OPTIONS } from "./models/profiles.mjs";
import { simulateHybrid } from "./models/hybrid.mjs";

const n = (v, d = 0) => Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const theme = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function renderHybrid(state) {
  const result = simulateHybrid(state.inputs);
  const h = result.hours[state.ui.hybridHour ?? 12];
  const set = (id, value) => { document.querySelector(`#${id}`).textContent = value; };
  for (const [name, value] of Object.entries({ profileId: result.settings.profileId, windCount: result.settings.windCount, pvCapacityKW: result.settings.pvCapacityKW, demandKW: result.settings.demandKW, batteryCapacityKWh: result.settings.batteryCapacityKWh, batteryPowerKW: result.settings.batteryPowerKW, initialSocPct: result.settings.initialSocPct })) {
    const input = document.querySelector(`#hybrid-workspace [name="${name}"]`);
    if (input && document.activeElement !== input) input.value = value;
  }
  document.querySelector("#hybrid-grid").checked = result.settings.gridConnected;
  document.querySelector("#hybrid-hour").value = h.hour;
  set("hybrid-hour-label", `${String(h.hour).padStart(2, "0")}:00`);
  const stats = [
    ["WIND", `${n(h.windKW / 1000, 2)} MW`], ["SOLAR PV", `${n(h.solarKW / 1000, 2)} MW`],
    ["TOTAL GENERATION", `${n(h.generationKW / 1000, 2)} MW`], ["LOAD", `${n(h.demandKW / 1000, 2)} MW`],
    [h.chargeKW ? "BATTERY CHARGING" : "BATTERY DISCHARGE", `${n((h.chargeKW || h.dischargeKW) / 1000, 2)} MW`],
    ["BATTERY STATE", `${n(h.socKWh / Math.max(1, result.settings.batteryCapacityKWh) * 100, 0)}% · ${n(h.socKWh)} kWh`],
    [result.settings.gridConnected ? "GRID IMPORT" : "UNSERVED LOAD", `${n((h.gridImportKW || h.unmetKW) / 1000, 2)} MW`],
    [result.settings.gridConnected ? "GRID EXPORT" : "CURTAILED", `${n((h.gridExportKW || h.curtailedKW) / 1000, 2)} MW`]
  ];
  document.querySelector("#hybrid-hour-stats").innerHTML = stats.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
  const max = Math.max(1, h.generationKW, h.demandKW, h.gridImportKW, h.gridExportKW);
  const bar = (x, y, w, fraction, color) => `<rect x="${x}" y="${y}" width="${Math.max(0, w * fraction)}" height="24" rx="5" fill="${color}"/>`;
  const c = theme("--cyan"), amber = theme("--amber"), muted = theme("--text-faint"), gridColor = theme("--border");
  const splitW = 390;
  const generated = Math.min(1, h.generationKW / max), demand = Math.min(1, h.demandKW / max);
  const svg = document.querySelector("#hybrid-diagram");
  const mobile = window.innerWidth <= 600;
  const mobileDiagram = `<svg viewBox="0 0 390 316" role="img" aria-label="At ${String(h.hour).padStart(2, "0")}:00, wind and solar PV provide ${n(h.generationKW / 1000, 2)} megawatts. Battery state of charge is ${n(h.socKWh / Math.max(1, result.settings.batteryCapacityKWh) * 100)} percent; demand is ${n(h.demandKW / 1000, 2)} megawatts."><text x="20" y="22" fill="${muted}" font-size="10" letter-spacing="1">RENEWABLE GENERATION · ${n(h.generationKW / 1000, 2)} MW</text><rect x="20" y="34" width="350" height="54" rx="9" fill="${theme("--surface-raised")}" stroke="${c}"/><text x="34" y="57" fill="${theme("--text")}" font-size="12">WIND</text><text x="350" y="57" text-anchor="end" fill="${c}" font-size="13" font-family="DM Mono,monospace">${n(h.windKW / 1000,2)} MW</text><text x="34" y="76" fill="${theme("--text")}" font-size="12">SOLAR PV</text><text x="350" y="76" text-anchor="end" fill="${c}" font-size="13" font-family="DM Mono,monospace">${n(h.solarKW / 1000,2)} MW</text><path d="M195 89v22" stroke="${c}" stroke-width="3"/><path d="M188 104l7 8 7-8" fill="none" stroke="${c}" stroke-width="2"/><rect x="20" y="114" width="350" height="57" rx="9" fill="${theme("--surface-raised")}" stroke="${amber}"/><text x="34" y="139" fill="${theme("--text")}" font-size="12">BATTERY · ${n(h.chargeKW / 1000,2)} MW charge / ${n(h.dischargeKW / 1000,2)} MW discharge</text><text x="34" y="158" fill="${amber}" font-size="12" font-family="DM Mono,monospace">${n(h.socKWh)} / ${n(result.settings.batteryCapacityKWh)} kWh</text><path d="M112 172v22m166-22v22" stroke="${gridColor}" stroke-width="2"/><path d="M105 188l7 8 7-8m159 0 7 8 7-8" fill="none" stroke="${gridColor}" stroke-width="2"/><rect x="20" y="199" width="166" height="67" rx="9" fill="${theme("--surface-raised")}" stroke="${amber}"/><text x="34" y="224" fill="${muted}" font-size="10">DEMAND</text><text x="34" y="249" fill="${theme("--text")}" font-size="17" font-family="DM Mono,monospace">${n(h.demandKW / 1000,2)} MW</text><rect x="204" y="199" width="166" height="67" rx="9" fill="${theme("--surface-raised")}" stroke="${gridColor}"/><text x="218" y="224" fill="${muted}" font-size="10">${result.settings.gridConnected ? "GRID EXCHANGE" : "OFF-GRID"}</text><text x="218" y="249" fill="${theme("--text")}" font-size="13" font-family="DM Mono,monospace">${result.settings.gridConnected ? `${n(h.gridImportKW / 1000,2)} in · ${n(h.gridExportKW / 1000,2)} out` : `${n(h.unmetKW / 1000,2)} unmet`}</text><text x="20" y="297" fill="${muted}" font-size="10">POWER FLOW IS SHOWN FOR THE SELECTED HOUR</text></svg>`;
  const desktopDiagram = `<svg viewBox="0 0 760 192" role="img" aria-label="At ${String(h.hour).padStart(2, "0")}:00, ${n(h.generationKW)} kilowatts renewable generation meets ${n(h.demandKW)} kilowatts demand, battery state ${n(h.socKWh / Math.max(1, result.settings.batteryCapacityKWh) * 100)} percent."><text x="28" y="28" fill="${muted}" font-size="11" letter-spacing="1">RENEWABLE GENERATION</text><text x="28" y="51" fill="${c}" font-size="18" font-family="DM Mono, monospace">${n(h.generationKW / 1000, 2)} MW</text><text x="28" y="87" fill="${muted}" font-size="10">WIND ${n(h.windKW / 1000, 2)} MW</text><text x="28" y="106" fill="${muted}" font-size="10">PV ${n(h.solarKW / 1000, 2)} MW</text><path d="M180 82h76" stroke="${c}" stroke-width="3"/><circle cx="287" cy="82" r="30" fill="${theme("--surface-raised")}" stroke="${c}" stroke-width="2"/><path d="M275 82h24m-12-12v24" stroke="${c}" stroke-width="2"/><text x="287" y="128" fill="${muted}" font-size="9" text-anchor="middle">SYSTEM BUS</text><path d="M318 82h64" stroke="${c}" stroke-width="3"/><rect x="382" y="43" width="132" height="76" rx="10" fill="${theme("--surface-raised")}" stroke="${amber}" stroke-width="2"/><text x="448" y="73" fill="${muted}" font-size="10" text-anchor="middle">BATTERY</text><text x="448" y="96" fill="${theme("--text")}" font-size="15" text-anchor="middle" font-family="DM Mono, monospace">${n(h.socKWh / Math.max(1, result.settings.batteryCapacityKWh) * 100)}%</text><path d="M514 82h50" stroke="${h.gridImportKW || h.gridExportKW ? amber : c}" stroke-width="3"/><rect x="568" y="48" width="82" height="68" rx="10" fill="${theme("--surface-raised")}" stroke="${gridColor}" stroke-width="2"/><path d="M586 91v-8m14 8V71m14 20V62m14 29V76" stroke="${muted}" stroke-width="3"/><text x="609" y="133" fill="${muted}" font-size="9" text-anchor="middle">GRID</text><path d="M650 82h43" stroke="${c}" stroke-width="3"/><path d="M700 50v64" stroke="${gridColor}" stroke-width="2"/><text x="28" y="160" fill="${muted}" font-size="10">GENERATION</text>${bar(132,142,splitW,generated,c)}<text x="538" y="160" fill="${theme("--text")}" font-size="11">${n(h.generationKW / 1000,2)} MW</text><text x="28" y="185" fill="${muted}" font-size="10">LOAD</text>${bar(132,167,splitW,demand,amber)}<text x="538" y="185" fill="${theme("--text")}" font-size="11">${n(h.demandKW / 1000,2)} MW</text></svg>`;
  svg.innerHTML = mobile ? mobileDiagram : desktopDiagram;
  renderHybridChart(document.querySelector("#hybrid-chart"), result.hours, h.hour);
  const t = result.totals;
  const totals = [["Renewable generated", t.renewableKWh], ["Load served", t.servedKWh], ["Battery conversion loss", t.batteryLossKWh], ["Grid imported", t.gridImportKWh], ["Grid exported", t.gridExportKWh], ["Curtailed", t.curtailedKWh], ["Unserved load", t.unmetKWh]];
  document.querySelector("#hybrid-totals").innerHTML = totals.map(([label, value]) => `<article><span>${label}</span><strong>${n(value / 1000, 2)} <small>MWh</small></strong></article>`).join("");
  set("hybrid-balance", t.maxBalanceResidualKW < 1e-7 ? "BALANCED · HOURLY POWER" : "CHECK BALANCE");
  document.querySelector("#hybrid-balance").classList.toggle("is-invalid", t.maxBalanceResidualKW >= 1e-7);
  document.querySelector("#hybrid-play").textContent = state.ui.hybridPlaying ? "Ⅱ Pause day" : "▶ Play day";
}

function renderHybridChart(svg, hours, activeHour) {
  const cyan = theme("--cyan"), amber = theme("--amber"), faint = theme("--text-faint"), grid = theme("--chart-grid");
  const peak = Math.max(1, ...hours.flatMap((h) => [h.generationKW, h.demandKW]));
  const x = (i) => 48 + i * 29;
  const y = (v) => 183 - v / peak * 137;
  const line = (key) => hours.map((h, i) => `${i ? "L" : "M"}${x(i)},${y(h[key])}`).join(" ");
  const current = hours[activeHour];
  svg.innerHTML = `<g stroke="${grid}" stroke-dasharray="3 5"><path d="M48 46H716M48 114H716M48 183H716"/></g><path d="${line("generationKW")}" fill="none" stroke="${cyan}" stroke-width="3" stroke-linecap="round"/><path d="${line("demandKW")}" fill="none" stroke="${amber}" stroke-width="2" stroke-dasharray="5 4"/><line x1="${x(activeHour)}" y1="38" x2="${x(activeHour)}" y2="184" stroke="${faint}" stroke-dasharray="3 4"/><circle cx="${x(activeHour)}" cy="${y(current.generationKW)}" r="5" fill="${cyan}"/><text x="48" y="22" fill="${faint}" font-size="10">HOURLY POWER · kW</text><text x="688" y="22" text-anchor="end" fill="${cyan}" font-size="10">— generation</text><text x="688" y="36" text-anchor="end" fill="${amber}" font-size="10">- - demand</text>${[0,4,8,12,16,20,23].map((h) => `<text x="${x(h)}" y="207" text-anchor="middle" fill="${faint}" font-size="9">${String(h).padStart(2,"0")}</text>`).join("")}`;
}

export function bindHybridEvents(state, render) {
  const host = document.querySelector("#hybrid-workspace");
  host.addEventListener("input", (event) => {
    if (event.target.matches("[name]")) {
      const input = event.target;
      state.inputs[input.name] = input.type === "checkbox" ? input.checked : input.type === "number" ? Number(input.value) : input.value;
      render();
    }
  });
  host.addEventListener("change", (event) => {
    if (event.target.matches("[name]")) {
      const input = event.target;
      state.inputs[input.name] = input.type === "checkbox" ? input.checked : input.type === "number" ? Number(input.value) : input.value;
      render();
    }
  });
  document.querySelector("#hybrid-hour").addEventListener("input", (event) => { state.ui.hybridHour = Number(event.target.value); render(); });
  document.querySelector("#hybrid-step").addEventListener("click", () => { state.ui.hybridHour = ((state.ui.hybridHour ?? 12) + 1) % 24; render(); });
  let timer = null;
  document.querySelector("#hybrid-play").addEventListener("click", () => {
    state.ui.hybridPlaying = !state.ui.hybridPlaying;
    if (timer) clearInterval(timer);
    timer = state.ui.hybridPlaying ? setInterval(() => { state.ui.hybridHour = ((state.ui.hybridHour ?? 12) + 1) % 24; render(); }, 700) : null;
    render();
  });
  return () => { if (timer) clearInterval(timer); };
}

const STEAM_TABLE = [
  { p: 0.001, ts: 7.0, hf: 29.3, hfg: 2484, sf: 0.106, sfg: 8.87 },
  { p: 0.005, ts: 32.9, hf: 137.8, hfg: 2424, sf: 0.476, sfg: 7.92 },
  { p: 0.01, ts: 45.8, hf: 191.8, hfg: 2393, sf: 0.649, sfg: 7.50 },
  { p: 0.02, ts: 60.1, hf: 251.4, hfg: 2358, sf: 0.832, sfg: 7.08 },
  { p: 0.05, ts: 81.3, hf: 340.5, hfg: 2305, sf: 1.091, sfg: 6.50 },
  { p: 0.1, ts: 99.6, hf: 417.5, hfg: 2257, sf: 1.303, sfg: 6.05 },
  { p: 0.2, ts: 120.2, hf: 504.7, hfg: 2202, sf: 1.530, sfg: 5.60 },
  { p: 0.5, ts: 151.8, hf: 640.1, hfg: 2108, sf: 1.860, sfg: 4.93 },
  { p: 1, ts: 179.9, hf: 762.8, hfg: 2015, sf: 2.139, sfg: 4.45 },
  { p: 2, ts: 212.4, hf: 908.5, hfg: 1889, sf: 2.447, sfg: 3.91 },
  { p: 3, ts: 233.9, hf: 1008, hfg: 1795, sf: 2.645, sfg: 3.56 },
  { p: 5, ts: 263.9, hf: 1155, hfg: 1640, sf: 2.920, sfg: 3.19 },
  { p: 7.5, ts: 290.5, hf: 1303, hfg: 1480, sf: 3.120, sfg: 2.83 },
  { p: 10, ts: 311.0, hf: 1408, hfg: 1317, sf: 3.360, sfg: 2.62 },
  { p: 15, ts: 342.2, hf: 1610, hfg: 1000, sf: 3.680, sfg: 2.19 },
  { p: 20, ts: 365.8, hf: 1827, hfg: 500, sf: 4.010, sfg: 1.45 },
  { p: 22.064, ts: 374.0, hf: 2015, hfg: 0, sf: 4.410, sfg: 0 }
];

export const DEFAULTS = Object.freeze({
  pressureMPa: 10,
  tempC: 500,
  flowKgS: 50,
  turbineEff: 85,
  condenserKPa: 10
});

export const INPUT_RANGES = Object.freeze({
  // The compact saturation table is intentionally kept below the critical point.
  pressureMPa: [1, 20],
  tempC: [200, 600],
  flowKgS: [1, 100],
  turbineEff: [50, 95],
  condenserKPa: [5, 20]
});

export const PRESETS = Object.freeze({
  coal: { pressureMPa: 18, tempC: 540, flowKgS: 72, turbineEff: 88, condenserKPa: 8 },
  nuclear: { pressureMPa: 7, tempC: 290, flowKgS: 88, turbineEff: 82, condenserKPa: 8 },
  solar: { pressureMPa: 12, tempC: 560, flowKgS: 38, turbineEff: 86, condenserKPa: 9 },
  geothermal: { pressureMPa: 2, tempC: 220, flowKgS: 62, turbineEff: 78, condenserKPa: 14 }
});

export function interpolateSaturation(pressureMPa) {
  const pressure = Math.min(Math.max(pressureMPa, STEAM_TABLE[0].p), STEAM_TABLE.at(-1).p);
  let upperIndex = STEAM_TABLE.findIndex((row) => row.p >= pressure);
  if (upperIndex <= 0) return { ...STEAM_TABLE[0] };
  if (upperIndex === -1) return { ...STEAM_TABLE.at(-1) };
  const low = STEAM_TABLE[upperIndex - 1];
  const high = STEAM_TABLE[upperIndex];
  const ratio = (pressure - low.p) / (high.p - low.p);
  return Object.fromEntries(
    Object.keys(low).map((key) => [key, low[key] + (high[key] - low[key]) * ratio])
  );
}

function condenserSaturation(condenserKPa) {
  return interpolateSaturation(condenserKPa / 1000);
}

function steamHeatCapacity(pressureMPa) {
  // A compact pressure-aware approximation; real steam properties require IAPWS-IF97.
  return 2.08 + 0.16 * pressureMPa;
}
const WATER_GAMMA = 0.001; // Approximate liquid specific volume, m³/kg.
const STEAM_GAS_CONSTANT = 0.4615; // kJ/(kg·K), approximated as ideal vapor.
const GENERATOR_EFFICIENCY = 0.98;

function inletState(pressureMPa, temperatureC) {
  const saturation = interpolateSaturation(pressureMPa);
  const cp = steamHeatCapacity(pressureMPa);
  const effectiveTempC = Math.max(temperatureC, saturation.ts);
  const superheatK = Math.max(0, effectiveTempC - saturation.ts);
  const h = saturation.hf + saturation.hfg + cp * superheatK;
  const entropy = saturation.sf + saturation.sfg
    + cp * Math.log((effectiveTempC + 273.15) / (saturation.ts + 273.15));
  return { h, s: entropy, cp, effectiveTempC, saturation };
}

export function computeAll(inputs) {
  const inlet = inletState(inputs.pressureMPa, inputs.tempC);
  const exhaust = condenserSaturation(inputs.condenserKPa);
  const turbineEfficiency = inputs.turbineEff / 100;
  // Isentropic expansion: s2s = s1. Use saturated-mixture properties when inside the dome;
  // above the saturated-vapor line, use the same idealized cp relation as the inlet.
  const exhaustSaturatedVaporEntropy = exhaust.sf + exhaust.sfg;
  const isentropicQuality = Math.min(1, Math.max(0, (inlet.s - exhaust.sf) / exhaust.sfg));
  let isentropicEnthalpy;
  if (inlet.s <= exhaustSaturatedVaporEntropy) {
    isentropicEnthalpy = exhaust.hf + isentropicQuality * exhaust.hfg;
  } else {
    const superheatRatio = Math.exp((inlet.s - exhaustSaturatedVaporEntropy) / inlet.cp);
    isentropicEnthalpy = exhaust.hf + exhaust.hfg + inlet.cp * (exhaust.ts + 273.15) * (superheatRatio - 1);
  }
  const actualDrop = Math.max(0, (inlet.h - isentropicEnthalpy) * turbineEfficiency);
  const exitEnthalpy = inlet.h - actualDrop;
  const exitQuality = exitEnthalpy <= exhaust.hf + exhaust.hfg
    ? Math.min(1, Math.max(0, (exitEnthalpy - exhaust.hf) / exhaust.hfg))
    : null;
  // Turbine shaft work: Wt = ṁ(h1 − h2); liquid-pump work: Wp ≈ ṁv(Pboiler − Pcond).
  const workKW = inputs.flowKgS * actualDrop;
  const pumpSpecificWork = WATER_GAMMA * (inputs.pressureMPa * 1000 - inputs.condenserKPa);
  const pumpWorkKW = inputs.flowKgS * pumpSpecificWork;
  const heatInKW = inputs.flowKgS * Math.max(1, inlet.h - (exhaust.hf + pumpSpecificWork));
  const netWorkKW = workKW - pumpWorkKW;
  const turbineWorkMW = workKW / 1000;
  const pumpWorkMW = pumpWorkKW / 1000;
  const netWorkMW = netWorkKW / 1000;
  const heatInMW = heatInKW / 1000;
  const powerMW = Math.max(0, netWorkMW * GENERATOR_EFFICIENCY);
  const efficiency = Math.min(1, Math.max(0, netWorkKW / heatInKW));
  // Cycle balance: Qin + Wp = Wt + Qout. Sankey groups pump input with useful cycle work.
  const wasteMW = Math.max(0, heatInMW - netWorkMW);
  const workMW = netWorkMW;
  const generatorLossMW = workMW - powerMW;
  const exitEntropy = exitQuality === null
    ? exhaustSaturatedVaporEntropy + inlet.cp * Math.log(1 + (exitEnthalpy - exhaust.hf - exhaust.hfg) / (inlet.cp * (exhaust.ts + 273.15)))
    : exhaust.sf + exitQuality * exhaust.sfg;
  const exitTempC = exitQuality === null
    ? exhaust.ts + (exitEnthalpy - exhaust.hf - exhaust.hfg) / inlet.cp
    : exhaust.ts;
  const saturatedVaporVolume = STEAM_GAS_CONSTANT * (exhaust.ts + 273.15) / inputs.condenserKPa;
  const exitSpecificVolume = exitQuality === null
    ? STEAM_GAS_CONSTANT * (exitTempC + 273.15) / inputs.condenserKPa
    : WATER_GAMMA + exitQuality * (saturatedVaporVolume - WATER_GAMMA);
  const inletSpecificVolume = STEAM_GAS_CONSTANT * (inlet.effectiveTempC + 273.15) / (inputs.pressureMPa * 1000);

  return {
    h1: inlet.h,
    s1: inlet.s,
    h2: exitEnthalpy,
    s2: exitEntropy,
    exitTempC,
    exitQuality,
    powerMW,
    efficiency,
    workMW,
    turbineWorkMW,
    netWorkMW,
    pumpWorkMW,
    heatInMW,
    wasteMW,
    generatorLossMW,
    rpm: Math.min(3600, Math.max(0, (powerMW / 100) * 3600)),
    inletTempC: inlet.effectiveTempC,
    saturationTempC: inlet.saturation.ts,
    isentropicQuality,
    specificVolume: exitSpecificVolume,
    inletSpecificVolume
  };
}

export function getQualityStatus(quality) {
  if (quality === null || quality === undefined) return "superheated";
  if (quality < 0.85) return "red";
  if (quality < 0.9) return "amber";
  return "green";
}

export function clampInputs(inputs) {
  return Object.fromEntries(Object.entries(INPUT_RANGES).map(([key, [min, max]]) => [
    key,
    Math.min(max, Math.max(min, Number(inputs[key]) || DEFAULTS[key]))
  ]));
}

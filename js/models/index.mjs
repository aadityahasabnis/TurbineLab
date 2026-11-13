import { DEFAULTS as STEAM_DEFAULTS, clampInputs, computeAll } from "../physics.mjs";
import { WIND_DEFAULTS, clampWindInputs, computeWind } from "./wind.mjs";
import { PV_DEFAULTS, clampPVInputs, computeSolarPV } from "./solar-pv.mjs";

export const SOURCES = Object.freeze({
  steam: { label: "Steam power", defaults: STEAM_DEFAULTS, model: "Rankine cycle" },
  wind: { label: "Wind power", defaults: WIND_DEFAULTS, model: "Horizontal-axis wind turbine" },
  "solar-pv": { label: "Solar PV", defaults: PV_DEFAULTS, model: "Photovoltaic array" }
});
export const SOURCE_DEFAULTS = Object.freeze({ steam: STEAM_DEFAULTS, wind: WIND_DEFAULTS, "solar-pv": PV_DEFAULTS });

export function clampSourceInputs(source, inputs) {
  if (source === "wind") return clampWindInputs(inputs);
  if (source === "solar-pv") return clampPVInputs(inputs);
  return clampInputs(inputs);
}

export function computeSource(source, inputs) {
  if (source === "wind") return computeWind(inputs);
  if (source === "solar-pv") return computeSolarPV(inputs);
  const steam = computeAll(inputs);
  const powerKW = steam.powerMW * 1000;
  const availablePowerKW = steam.heatInMW * 1000;
  return { ...steam, source: "steam", powerKW, availablePowerKW, lossesKW: Math.max(0, availablePowerKW - powerKW), conversionEfficiency: availablePowerKW ? powerKW / availablePowerKW : 0 };
}

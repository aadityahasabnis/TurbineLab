import { DEFAULTS as STEAM_DEFAULTS, clampInputs, computeAll } from "../physics.mjs";
import { WIND_DEFAULTS, clampWindInputs, computeWind } from "./wind.mjs";
import { PV_DEFAULTS, clampPVInputs, computeSolarPV } from "./solar-pv.mjs";
import { HYBRID_DEFAULTS, clampHybridInputs } from "./hybrid.mjs";

export const SOURCES = Object.freeze({
  steam: { label: "Steam power", defaults: STEAM_DEFAULTS, model: "Rankine cycle" },
  wind: { label: "Wind power", defaults: WIND_DEFAULTS, model: "Horizontal-axis wind turbine" },
  "solar-pv": { label: "Solar PV", defaults: PV_DEFAULTS, model: "Photovoltaic array" },
  hybrid: { label: "Wind + solar + storage", defaults: HYBRID_DEFAULTS, model: "Hybrid renewable microgrid" }
});
export const SOURCE_DEFAULTS = Object.freeze({ steam: STEAM_DEFAULTS, wind: WIND_DEFAULTS, "solar-pv": PV_DEFAULTS, hybrid: HYBRID_DEFAULTS });

export function clampSourceInputs(source, inputs) {
  if (source === "wind") return clampWindInputs(inputs);
  if (source === "solar-pv") return clampPVInputs(inputs);
  if (source === "hybrid") return clampHybridInputs(inputs);
  return clampInputs(inputs);
}

export function computeSource(source, inputs) {
  if (source === "wind") return computeWind(inputs);
  if (source === "solar-pv") return computeSolarPV(inputs);
  if (source === "hybrid") return { source: "hybrid", ...inputs };
  const steam = computeAll(inputs);
  const powerKW = steam.powerMW * 1000;
  const availablePowerKW = steam.heatInMW * 1000;
  return { ...steam, source: "steam", powerKW, availablePowerKW, lossesKW: Math.max(0, availablePowerKW - powerKW), conversionEfficiency: availablePowerKW ? powerKW / availablePowerKW : 0 };
}

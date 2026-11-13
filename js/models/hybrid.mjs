import { WIND_DEFAULTS, clampWindInputs, computeWind } from "./wind.mjs";
import { PV_DEFAULTS, clampPVInputs, computeSolarPV } from "./solar-pv.mjs";
import { PROFILE_OPTIONS, resourceAt } from "./profiles.mjs";

export const HYBRID_DEFAULTS = Object.freeze({
  profileId: "balanced", windCount: 2, pvCapacityKW: 1800,
  demandKW: 900, batteryCapacityKWh: 2400, batteryPowerKW: 600,
  initialSocPct: 50, gridConnected: true
});

export function clampHybridInputs(inputs = {}) {
  const number = (key, fallback, min, max, integer = false) => {
    const value = Number(inputs[key]);
    const bounded = Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
    return integer ? Math.round(bounded) : bounded;
  };
  return {
    profileId: PROFILE_OPTIONS.some((p) => p.id === inputs.profileId) ? inputs.profileId : HYBRID_DEFAULTS.profileId,
    windCount: number("windCount", 2, 0, 20, true),
    pvCapacityKW: number("pvCapacityKW", 1800, 0, 100000),
    demandKW: number("demandKW", 900, 0, 100000),
    batteryCapacityKWh: number("batteryCapacityKWh", 2400, 0, 200000),
    batteryPowerKW: number("batteryPowerKW", 600, 0, 100000),
    initialSocPct: number("initialSocPct", 50, 0, 100),
    gridConnected: inputs.gridConnected === false || inputs.gridConnected === "false" ? false : true
  };
}

export function simulateHybrid(inputs) {
  const settings = clampHybridInputs(inputs);
  const windInputs = clampWindInputs(WIND_DEFAULTS);
  const pvInputs = clampPVInputs({ ...PV_DEFAULTS, capacityKW: settings.pvCapacityKW });
  let socKWh = settings.batteryCapacityKWh * settings.initialSocPct / 100;
  const chargeEfficiency = 0.95;
  const dischargeEfficiency = 0.95;
  const hours = Array.from({ length: 24 }, (_, hour) => {
    const resource = resourceAt(settings.profileId, hour);
    const wind = computeWind({ ...windInputs, windSpeedMs: resource.windSpeedMs });
    const pv = settings.pvCapacityKW > 0
      ? computeSolarPV({ ...pvInputs, irradianceWm2: resource.irradianceWm2, ambientTempC: resource.ambientTempC })
      : { powerKW: 0 };
    const windKW = wind.powerKW * settings.windCount;
    const solarKW = pv.powerKW;
    const generationKW = windKW + solarKW;
    const demandKW = settings.demandKW;
    const directKW = Math.min(generationKW, demandKW);
    let surplusKW = Math.max(0, generationKW - directKW);
    let deficitKW = Math.max(0, demandKW - directKW);
    const socBeforeKWh = socKWh;
    const chargeKW = Math.min(surplusKW, settings.batteryPowerKW, Math.max(0, settings.batteryCapacityKWh - socKWh) / chargeEfficiency);
    socKWh = Math.min(settings.batteryCapacityKWh, socKWh + chargeKW * chargeEfficiency);
    surplusKW -= chargeKW;
    const dischargeKW = Math.min(deficitKW, settings.batteryPowerKW, socKWh * dischargeEfficiency);
    socKWh = Math.max(0, socKWh - dischargeKW / dischargeEfficiency);
    deficitKW -= dischargeKW;
    const gridImportKW = settings.gridConnected ? deficitKW : 0;
    const unmetKW = settings.gridConnected ? 0 : deficitKW;
    const gridExportKW = settings.gridConnected ? surplusKW : 0;
    const curtailedKW = settings.gridConnected ? 0 : surplusKW;
    const balanceResidualKW = generationKW + gridImportKW + dischargeKW - (demandKW - unmetKW) - chargeKW - gridExportKW - curtailedKW;
    return { hour, ...resource, windKW, solarKW, generationKW, demandKW, directKW, chargeKW, dischargeKW, socBeforeKWh, socKWh, gridImportKW, gridExportKW, curtailedKW, unmetKW, balanceResidualKW };
  });
  const sum = (key) => hours.reduce((total, hour) => total + hour[key], 0);
  const servedKWh = sum("demandKW") - sum("unmetKW");
  const renewableKWh = sum("windKW") + sum("solarKW");
  return {
    settings, hours, totals: {
      renewableKWh, windKWh: sum("windKW"), solarKWh: sum("solarKW"), demandKWh: sum("demandKW"),
      servedKWh, gridImportKWh: sum("gridImportKW"), gridExportKWh: sum("gridExportKW"),
      curtailedKWh: sum("curtailedKW"), unmetKWh: sum("unmetKW"), chargeKWh: sum("chargeKW"),
      dischargeKWh: sum("dischargeKW"), maxBalanceResidualKW: Math.max(...hours.map((h) => Math.abs(h.balanceResidualKW))),
      batteryLossKWh: sum("chargeKW") * (1 - chargeEfficiency) + sum("dischargeKW") * (1 / dischargeEfficiency - 1),
      renewableSharePct: servedKWh ? Math.min(100, renewableKWh / servedKWh * 100) : 0
    }
  };
}

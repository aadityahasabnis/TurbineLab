export const PV_DEFAULTS = Object.freeze({
  capacityKW: 1000,
  irradianceWm2: 800,
  ambientTempC: 25,
  systemLossPct: 14,
  noctC: 45,
  moduleEfficiency: 0.20,
  temperatureCoefficient: -0.004,
  inverterEfficiency: 0.96
});

export const PV_RANGES = Object.freeze({
  capacityKW: [1, 100000], irradianceWm2: [0, 1200],
  ambientTempC: [-20, 55], systemLossPct: [0, 35]
});

export function computeSolarPV(inputs) {
  const cellTempC = inputs.ambientTempC + ((inputs.noctC - 20) / 800) * inputs.irradianceWm2;
  const referenceAreaM2 = inputs.capacityKW / inputs.moduleEfficiency;
  const incidentSolarKW = inputs.irradianceWm2 * referenceAreaM2 / 1000;
  const temperatureFactor = Math.max(0, 1 + inputs.temperatureCoefficient * (cellTempC - 25));
  const dcPowerKW = inputs.capacityKW * (inputs.irradianceWm2 / 1000) * temperatureFactor;
  const acPowerKW = Math.min(inputs.capacityKW, dcPowerKW * (1 - inputs.systemLossPct / 100) * inputs.inverterEfficiency);
  const lossesKW = Math.max(0, incidentSolarKW - acPowerKW);
  return {
    source: "solar-pv", powerKW: acPowerKW, availablePowerKW: incidentSolarKW, lossesKW,
    conversionEfficiency: incidentSolarKW > 0 ? acPowerKW / incidentSolarKW : 0,
    dcPowerKW, cellTempC, referenceAreaM2,
    explanation: `With ${inputs.irradianceWm2} W/m² sunlight and a ${cellTempC.toFixed(0)} °C estimated cell temperature, the ${inputs.capacityKW.toLocaleString()} kWp array produces ${(acPowerKW / 1000).toFixed(2)} MW AC.`,
    modelNote: "Educational operating-point estimate using a simplified NOCT cell-temperature relation, fixed module efficiency, user-set system losses and inverter efficiency. No location-specific weather or annual yield prediction."
  };
}

export function clampPVInputs(inputs) {
  const bounded = { ...PV_DEFAULTS };
  for (const [key, [min, max]] of Object.entries(PV_RANGES)) {
    const value = Number(inputs?.[key]);
    bounded[key] = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : PV_DEFAULTS[key];
  }
  return bounded;
}

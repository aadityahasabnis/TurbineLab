export const WIND_DEFAULTS = Object.freeze({
  windSpeedMs: 8,
  rotorRadiusM: 47,
  ratedPowerKW: 3000,
  cutInMs: 3,
  ratedMs: 12,
  cutOutMs: 25,
  airDensityKgM3: 1.225,
  powerCoefficient: 0.45,
  drivetrainEfficiency: 0.94
});

export const WIND_RANGES = Object.freeze({
  windSpeedMs: [0, 30], rotorRadiusM: [10, 100], ratedPowerKW: [100, 15000],
  cutInMs: [1, 8], ratedMs: [8, 16], cutOutMs: [18, 30]
});

export function computeWind(inputs) {
  const areaM2 = Math.PI * inputs.rotorRadiusM ** 2;
  const availablePowerKW = 0.5 * inputs.airDensityKgM3 * areaM2 * inputs.windSpeedMs ** 3 / 1000;
  const capturedPowerKW = availablePowerKW * inputs.powerCoefficient * inputs.drivetrainEfficiency;
  let powerKW = 0;
  let operatingState = "below cut-in";
  if (inputs.windSpeedMs >= inputs.cutOutMs) operatingState = "above cut-out";
  else if (inputs.windSpeedMs === inputs.cutInMs) operatingState = "at cut-in threshold";
  else if (inputs.windSpeedMs > inputs.cutInMs) {
    const speed = inputs.windSpeedMs;
    const cutInPower = inputs.cutInMs ** 3;
    const ratedRamp = inputs.ratedMs ** 3 - cutInPower;
    const curveFraction = ratedRamp > 0 ? (speed ** 3 - cutInPower) / ratedRamp : 1;
    const ratedPowerCurveKW = inputs.ratedPowerKW * curveFraction;
    powerKW = Math.max(0, Math.min(inputs.ratedPowerKW, capturedPowerKW, ratedPowerCurveKW));
    operatingState = powerKW >= inputs.ratedPowerKW ? "rated output" : "power curve region";
  }
  const lossesKW = Math.max(0, availablePowerKW - powerKW);
  return {
    source: "wind", powerKW, availablePowerKW, lossesKW,
    conversionEfficiency: availablePowerKW > 0 ? powerKW / availablePowerKW : 0,
    operatingState, sweptAreaM2: areaM2,
    explanation: `At ${inputs.windSpeedMs.toFixed(1)} m/s the turbine is ${operatingState}. The simplified rotor model estimates ${(powerKW / 1000).toFixed(2)} MW electrical output from ${(availablePowerKW / 1000).toFixed(2)} MW in the wind stream.`,
    modelNote: "Educational estimate: uniform wind across the rotor, fixed air density, power coefficient and drivetrain efficiency. No site time series, turbulence, wake effects, or certified turbine power curve."
  };
}

export function clampWindInputs(inputs) {
  const bounded = { ...WIND_DEFAULTS };
  for (const [key, [min, max]] of Object.entries(WIND_RANGES)) {
    const value = Number(inputs?.[key]);
    bounded[key] = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : WIND_DEFAULTS[key];
  }
  bounded.ratedMs = Math.max(bounded.cutInMs + 0.5, bounded.ratedMs);
  bounded.cutOutMs = Math.max(bounded.ratedMs, bounded.cutOutMs);
  return bounded;
}

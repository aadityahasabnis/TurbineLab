import test from "node:test";
import assert from "node:assert/strict";
import { SOURCE_DEFAULTS, clampSourceInputs, computeSource } from "../js/models/index.mjs";
import { PV_DEFAULTS, PV_RANGES, clampPVInputs, computeSolarPV } from "../js/models/solar-pv.mjs";
import { WIND_DEFAULTS, clampWindInputs, computeWind } from "../js/models/wind.mjs";
import { readSharedState } from "../js/sharing.mjs";

test("wind operating states honor cut-in, rated, and cut-out boundaries", () => {
  const base = { ...WIND_DEFAULTS };
  assert.equal(computeWind({ ...base, windSpeedMs: base.cutInMs - 0.1 }).powerKW, 0);
  assert.equal(computeWind({ ...base, windSpeedMs: base.cutInMs }).operatingState, "at cut-in threshold");
  assert.equal(computeWind({ ...base, windSpeedMs: base.cutInMs }).powerKW, 0);
  assert.ok(computeWind({ ...base, windSpeedMs: 8 }).powerKW > 0);
  assert.equal(computeWind({ ...base, windSpeedMs: base.ratedMs }).powerKW, base.ratedPowerKW);
  assert.equal(computeWind({ ...base, windSpeedMs: base.cutOutMs }).powerKW, 0);
});

test("wind resource follows swept area and cubic wind-speed scaling", () => {
  const base = computeWind({ ...WIND_DEFAULTS, windSpeedMs: 6 });
  const doubleSpeed = computeWind({ ...WIND_DEFAULTS, windSpeedMs: 12 });
  const doubleRadius = computeWind({ ...WIND_DEFAULTS, windSpeedMs: 6, rotorRadiusM: WIND_DEFAULTS.rotorRadiusM * Math.sqrt(2) });
  assert.ok(Math.abs(doubleSpeed.availablePowerKW / base.availablePowerKW - 8) < 1e-10);
  assert.ok(Math.abs(doubleRadius.availablePowerKW / base.availablePowerKW - 2) < 1e-10);
});

test("wind power curve never exceeds energy captured by a small rotor", () => {
  const limitedRotor = { ...WIND_DEFAULTS, rotorRadiusM: 10, ratedPowerKW: 15000, windSpeedMs: 12 };
  const result = computeWind(limitedRotor);
  const capturedKW = result.availablePowerKW * WIND_DEFAULTS.powerCoefficient * WIND_DEFAULTS.drivetrainEfficiency;
  assert.ok(result.powerKW <= capturedKW);
  assert.ok(result.powerKW < limitedRotor.ratedPowerKW);
});

test("wind output, not-converted energy, and operating boundaries are finite and balanced", () => {
  for (const windSpeedMs of [0, 3, 8, 12, 18, 25, 30]) {
    const result = computeWind({ ...WIND_DEFAULTS, windSpeedMs });
    for (const key of ["powerKW", "availablePowerKW", "lossesKW", "conversionEfficiency"]) assert.ok(Number.isFinite(result[key]));
    assert.ok(result.powerKW >= 0 && result.powerKW <= WIND_DEFAULTS.ratedPowerKW);
    assert.ok(Math.abs(result.availablePowerKW - result.powerKW - result.lossesKW) < 1e-8);
  }
});

test("wind input clamping restores defaults and preserves ordered safety thresholds", () => {
  const inputs = clampWindInputs({ windSpeedMs: 100, cutInMs: 8, ratedMs: 8, cutOutMs: 18 });
  assert.equal(inputs.windSpeedMs, 30);
  assert.ok(inputs.cutInMs <= inputs.ratedMs && inputs.ratedMs <= inputs.cutOutMs);
  assert.equal(clampWindInputs({}).windSpeedMs, WIND_DEFAULTS.windSpeedMs);
});

test("wind range corners remain finite and balanced after threshold normalization", () => {
  for (const windSpeedMs of [0, 30]) for (const rotorRadiusM of [10, 100])
    for (const cutInMs of [1, 8]) for (const ratedMs of [8, 16]) for (const cutOutMs of [18, 30]) {
      const inputs = clampWindInputs({ ...WIND_DEFAULTS, windSpeedMs, rotorRadiusM, cutInMs, ratedMs, cutOutMs });
      const result = computeWind(inputs);
      assert.ok(Number.isFinite(result.powerKW) && Number.isFinite(result.availablePowerKW));
      assert.ok(result.powerKW >= 0 && result.powerKW <= inputs.ratedPowerKW);
      assert.ok(Math.abs(result.availablePowerKW - result.powerKW - result.lossesKW) < 1e-8);
    }
});

test("PV output scales with irradiance and installed capacity", () => {
  const base = computeSolarPV(PV_DEFAULTS);
  const halfSun = computeSolarPV({ ...PV_DEFAULTS, irradianceWm2: PV_DEFAULTS.irradianceWm2 / 2 });
  const doubleCapacity = computeSolarPV({ ...PV_DEFAULTS, capacityKW: PV_DEFAULTS.capacityKW * 2 });
  assert.ok(halfSun.powerKW < base.powerKW);
  assert.ok(Math.abs(doubleCapacity.powerKW / base.powerKW - 2) < 1e-12);
});

test("PV warmer modules reduce output and zero irradiance yields zero power", () => {
  const cool = computeSolarPV({ ...PV_DEFAULTS, ambientTempC: 15 });
  const hot = computeSolarPV({ ...PV_DEFAULTS, ambientTempC: 45 });
  const night = computeSolarPV({ ...PV_DEFAULTS, irradianceWm2: 0 });
  assert.ok(cool.powerKW > hot.powerKW);
  assert.equal(night.powerKW, 0);
  assert.equal(night.availablePowerKW, 0);
  assert.equal(night.conversionEfficiency, 0);
});

test("PV operating boundary is finite, bounded, and energy-balanced", () => {
  for (const irradianceWm2 of [0, 200, 800, 1000, 1200]) {
    for (const ambientTempC of [-20, 25, 55]) {
      const result = computeSolarPV({ ...PV_DEFAULTS, irradianceWm2, ambientTempC });
      for (const key of ["powerKW", "availablePowerKW", "lossesKW", "conversionEfficiency", "cellTempC"]) assert.ok(Number.isFinite(result[key]));
      assert.ok(result.powerKW >= 0 && result.powerKW <= PV_DEFAULTS.capacityKW);
      assert.ok(Math.abs(result.availablePowerKW - result.powerKW - result.lossesKW) < 1e-8);
    }
  }
});

test("PV controls clamp to their declared ranges", () => {
  const inputs = clampPVInputs({ capacityKW: -2, irradianceWm2: 5000, ambientTempC: -100, systemLossPct: 90 });
  for (const [key, [min, max]] of Object.entries(PV_RANGES)) assert.ok(inputs[key] >= min && inputs[key] <= max);
});

test("source results expose the shared electric-power boundary", () => {
  for (const source of ["steam", "wind", "solar-pv"]) {
    const result = computeSource(source, SOURCE_DEFAULTS[source]);
    assert.equal(result.source, source);
    assert.ok(Number.isFinite(result.powerKW) && result.powerKW >= 0);
    assert.ok(Number.isFinite(result.availablePowerKW) && result.availablePowerKW >= 0);
    assert.ok(Number.isFinite(result.lossesKW) && result.lossesKW >= 0);
    assert.ok(Math.abs(result.availablePowerKW - result.powerKW - result.lossesKW) < 1e-6);
  }
});

test("shared setup parsing supports source-specific and legacy steam URLs", () => {
  const wind = readSharedState("?source=wind&windSpeedMs=9.5&rotorRadiusM=40", SOURCE_DEFAULTS);
  assert.equal(wind.source, "wind");
  assert.equal(wind.inputs.windSpeedMs, "9.5");
  assert.equal(wind.inputs.rotorRadiusM, "40");
  const legacySteam = readSharedState("?p=8&t=480&f=40&e=84&c=9", SOURCE_DEFAULTS);
  assert.equal(legacySteam.source, "steam");
  assert.equal(legacySteam.inputs.pressureMPa, "8");
  assert.equal(legacySteam.inputs.tempC, "480");
  assert.equal(readSharedState("?source=unknown", SOURCE_DEFAULTS), null);
});

test("shared renewable links restore a pinned reference separately from current inputs", () => {
  const shared = readSharedState("?source=wind&windSpeedMs=12&ref_windSpeedMs=8&ref_rotorRadiusM=47", SOURCE_DEFAULTS);
  assert.equal(shared.source, "wind");
  assert.equal(shared.inputs.windSpeedMs, "12");
  assert.equal(shared.pinInputs.windSpeedMs, "8");
  assert.equal(shared.pinInputs.rotorRadiusM, "47");
  assert.equal(shared.pinInputs.ratedPowerKW, SOURCE_DEFAULTS.wind.ratedPowerKW);
  assert.equal(readSharedState("?source=solar-pv&capacityKW=1000", SOURCE_DEFAULTS).pinInputs, null);
});

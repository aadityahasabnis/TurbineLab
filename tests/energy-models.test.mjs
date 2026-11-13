import test from "node:test";
import assert from "node:assert/strict";
import { SOURCE_DEFAULTS, clampSourceInputs, computeSource } from "../js/models/index.mjs";
import { PV_DEFAULTS, PV_RANGES, clampPVInputs, computeSolarPV } from "../js/models/solar-pv.mjs";
import { WIND_DEFAULTS, clampWindInputs, computeWind } from "../js/models/wind.mjs";
import { HYBRID_DEFAULTS, clampHybridInputs, simulateHybrid } from "../js/models/hybrid.mjs";
import { buildDaySeries, resourceAt } from "../js/models/profiles.mjs";
import { readSharedState } from "../js/sharing.mjs";
import { readFileSync } from "node:fs";

const renewableBenchmarks = JSON.parse(readFileSync(new URL("./fixtures/renewable-benchmarks.json", import.meta.url), "utf8"));

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

test("wind and PV reproduce published equation fixtures at the stated boundaries", () => {
  const calculate = {
    wind: computeWind,
    "solar-pv": computeSolarPV
  };
  for (const fixture of renewableBenchmarks.fixtures) {
    const result = calculate[fixture.technology](fixture.inputs);
    assert.ok(Number.isFinite(result[fixture.outputKey]), `${fixture.id} returned a finite ${fixture.outputKey}`);
    assert.ok(Math.abs(result[fixture.outputKey] - fixture.expectedKW) <= fixture.toleranceKW,
      `${fixture.id}: expected ${fixture.expectedKW} ± ${fixture.toleranceKW} kW, received ${result[fixture.outputKey]} kW`);
    if (fixture.expectedCellTempC !== undefined) assert.ok(Math.abs(result.cellTempC - fixture.expectedCellTempC) < 1e-12);
  }
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

test("shared time-series links restore profile, hour, and renewable source inputs", () => {
  const shared = readSharedState("?source=wind&windSpeedMs=10&day=1&profile=breezy-cloudy&hour=15", SOURCE_DEFAULTS);
  assert.equal(shared.source, "wind");
  assert.equal(shared.inputs.windSpeedMs, "10");
  assert.deepEqual(shared.ui, { dayMode: true, dayProfile: "breezy-cloudy", dayHour: 15, hybridHour: 15 });
});

test("shared hybrid links restore system inputs and selected dispatch hour", () => {
  const shared = readSharedState("?source=hybrid&windCount=3&pvCapacityKW=2400&gridConnected=false&hour=3", SOURCE_DEFAULTS);
  assert.equal(shared.source, "hybrid");
  assert.equal(shared.inputs.windCount, "3");
  assert.equal(shared.inputs.gridConnected, "false");
  assert.equal(shared.ui.hybridHour, 3);
});

test("synthetic resource profiles are bounded and repeatable across 24 hours", () => {
  for (const profileId of ["balanced", "sunny-calm", "breezy-cloudy"]) {
    const values = Array.from({ length: 24 }, (_, hour) => resourceAt(profileId, hour));
    assert.equal(values.length, 24);
    assert.deepEqual(values, Array.from({ length: 24 }, (_, hour) => resourceAt(profileId, hour)));
    assert.ok(values.every((value) => value.windSpeedMs >= 0 && value.irradianceWm2 >= 0 && value.irradianceWm2 <= 1200));
  }
});

test("renewable day simulation uses hourly operating points and integrates kW to MWh", () => {
  const series = buildDaySeries("solar-pv", PV_DEFAULTS, "sunny-calm", computeSource);
  assert.equal(series.length, 24);
  assert.equal(series[0].result.powerKW, 0);
  assert.ok(series[12].result.powerKW > 0);
  const dailyMWh = series.reduce((total, hour) => total + hour.result.powerKW, 0) / 1000;
  assert.ok(Number.isFinite(dailyMWh) && dailyMWh > 0);
});

test("hybrid hourly dispatch balances generation, storage, load and grid at each hour", () => {
  const result = simulateHybrid(HYBRID_DEFAULTS);
  assert.equal(result.hours.length, 24);
  assert.ok(result.totals.renewableKWh > 0);
  assert.ok(result.totals.gridImportKWh >= 0 && result.totals.gridExportKWh >= 0);
  assert.ok(result.totals.maxBalanceResidualKW < 1e-7);
  assert.ok(result.totals.batteryLossKWh >= 0);
  assert.ok(result.hours.every((hour) => hour.socKWh >= -1e-9 && hour.socKWh <= HYBRID_DEFAULTS.batteryCapacityKWh + 1e-9));
});

test("off-grid hybrid dispatch reports unmet load and curtailment without grid flow", () => {
  const inputs = clampHybridInputs({ ...HYBRID_DEFAULTS, gridConnected: false, windCount: 0, pvCapacityKW: 0, batteryCapacityKWh: 0, batteryPowerKW: 0 });
  const result = simulateHybrid(inputs);
  assert.equal(result.totals.gridImportKWh, 0);
  assert.equal(result.totals.gridExportKWh, 0);
  assert.equal(result.totals.unmetKWh, result.totals.demandKWh);
  assert.equal(result.totals.maxBalanceResidualKW, 0);
});

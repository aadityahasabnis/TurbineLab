import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULTS, INPUT_RANGES, PRESETS, clampInputs, computeAll, getQualityStatus, interpolateSaturation } from "../js/physics.mjs";

test("default plant produces plausible, balanced outputs", () => {
  const result = computeAll(DEFAULTS);
  assert.ok(result.powerMW > 10 && result.powerMW < 100);
  assert.ok(result.efficiency > 0.05 && result.efficiency < 0.5);
  assert.ok(Math.abs(result.heatInMW - result.workMW - result.wasteMW) < 1e-9);
  assert.ok(result.powerMW < result.workMW);
});

test("higher mass flow increases power without changing cycle efficiency", () => {
  const lowFlow = computeAll({ ...DEFAULTS, flowKgS: 25 });
  const highFlow = computeAll({ ...DEFAULTS, flowKgS: 75 });
  assert.ok(highFlow.powerMW > lowFlow.powerMW);
  assert.ok(Math.abs(highFlow.efficiency - lowFlow.efficiency) < 1e-12);
});

test("pressure curve improves then flattens under nominal conditions", () => {
  const low = computeAll({ ...DEFAULTS, pressureMPa: 2 });
  const middle = computeAll({ ...DEFAULTS, pressureMPa: 15 });
  const high = computeAll({ ...DEFAULTS, pressureMPa: 25 });
  assert.ok(middle.efficiency > low.efficiency);
  assert.ok(high.efficiency > middle.efficiency);
  assert.ok(high.efficiency <= middle.efficiency + 0.05);
  assert.ok(high.powerMW > computeAll({ ...DEFAULTS, pressureMPa: 10 }).powerMW);
});

test("temperature and condenser pressure affect output in the expected direction", () => {
  const cool = computeAll({ ...DEFAULTS, tempC: 300 });
  const hot = computeAll({ ...DEFAULTS, tempC: 600 });
  const highCondenser = computeAll({ ...DEFAULTS, condenserKPa: 20 });
  assert.ok(hot.powerMW > cool.powerMW);
  assert.ok(hot.efficiency > cool.efficiency);
  assert.ok(highCondenser.powerMW < computeAll(DEFAULTS).powerMW);
});

test("high-pressure wet steam crosses the red warning threshold", () => {
  assert.ok(computeAll({ ...DEFAULTS, pressureMPa: 25 }).exitQuality < 0.85);
});

test("steam quality thresholds map to green, amber, and red", () => {
  assert.equal(getQualityStatus(0.92), "green");
  assert.equal(getQualityStatus(0.87), "amber");
  assert.equal(getQualityStatus(0.84), "red");
});

test("saturation interpolation is bounded and returns intermediate values", () => {
  assert.equal(interpolateSaturation(0).p, interpolateSaturation(0.001).p);
  const midpoint = interpolateSaturation(0.15);
  assert.ok(midpoint.p > 0.1 && midpoint.p < 0.2);
  assert.ok(midpoint.ts > 99 && midpoint.ts < 121);
});

test("preset and input values stay inside the UI ranges", () => {
  for (const preset of Object.values(PRESETS)) {
    const result = computeAll(clampInputs(preset));
    assert.ok(result.powerMW > 0);
  }
  const bounded = clampInputs({ ...DEFAULTS, pressureMPa: 1000, flowKgS: -3 });
  assert.equal(bounded.pressureMPa, 25);
  assert.equal(bounded.flowKgS, 1);
});

test("all input range corners produce finite, balanced results", () => {
  const keys = Object.keys(INPUT_RANGES);
  for (let mask = 0; mask < 2 ** keys.length; mask += 1) {
    const inputs = Object.fromEntries(keys.map((key, index) => [
      key,
      INPUT_RANGES[key][(mask >> index) & 1]
    ]));
    const result = computeAll(inputs);
    assert.ok(Number.isFinite(result.powerMW));
    assert.ok(result.powerMW > 0);
    assert.ok(result.efficiency >= 0.05 && result.efficiency <= 0.5);
    assert.ok(Math.abs(result.heatInMW - result.workMW - result.wasteMW) < 1e-9);
  }
});

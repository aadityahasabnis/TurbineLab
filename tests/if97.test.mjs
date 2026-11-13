import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DEFAULTS, computeAll, interpolateSaturation } from "../js/physics.mjs";
import { region1, region2, saturationPressureMPa, saturationTemperatureK } from "../js/if97.mjs";

const fixture = JSON.parse(await readFile(new URL("./fixtures/if97-verification.json", import.meta.url), "utf8"));

test("IF97 Region 1 and Region 2 properties match the official verification table", () => {
  for (const item of fixture.fixtures) {
    const state = (item.region === 1 ? region1 : region2)(item.inputs.pressureMPa, item.inputs.temperatureK);
    for (const [property, expected] of Object.entries(item.expected)) {
      assert.ok(Math.abs(state[property] - expected) <= item.tolerance[property], `${item.id}: ${property} ${state[property]} ≠ ${expected}`);
    }
  }
});

test("IF97 saturation pressure and temperature reproduce the official Region 4 checks", () => {
  for (const point of fixture.saturationTemperature) {
    assert.ok(Math.abs(saturationTemperatureK(point.pressureMPa) - point.temperatureK) <= fixture.saturationCurveTolerance.temperatureK);
  }
  for (const point of fixture.saturationPressure) {
    assert.ok(Math.abs(saturationPressureMPa(point.temperatureK) - point.pressureMPa) <= fixture.saturationCurveTolerance.pressureMPa);
  }
});

test("cycle uses IF97 properties for supported boiler states and exact condenser saturation", () => {
  const result = computeAll(DEFAULTS);
  assert.equal(result.propertyMethod, "iapws-if97-regions-1-2-and-4");
  assert.ok(result.h1 > 3300 && result.h1 < 3400);
  assert.ok(Math.abs(result.heatInMW - result.workMW - result.wasteMW) < 1e-9);
  const sat = interpolateSaturation(DEFAULTS.condenserKPa / 1000);
  assert.equal(sat.propertyMethod, "iapws-if97-regions-1-2-and-4");
  assert.ok(sat.hf > 190 && sat.hf < 200);
});

test("dense-fluid states outside implemented IF97 regions stay on visibly tagged fallback", () => {
  const result = computeAll({ ...DEFAULTS, pressureMPa: 20 });
  assert.equal(result.propertyMethod, "legacy-approximation");
  assert.ok(Number.isFinite(result.powerMW));
});

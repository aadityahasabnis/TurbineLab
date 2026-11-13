# Renewable reference benchmarks

These fixtures check reproducibility at equations and boundaries that Energy Lab directly shares with published references. They are regression checks, not calibration evidence for the complete models.

## Fixtures

| Fixture | Direct comparison | Reference input | Expected | Absolute tolerance |
| --- | --- | --- | ---: | ---: |
| `nrel-sam-wind-stream-equation-29` | Rotor-disk wind-stream power before capture | 8 m/s, 10 m radius, 1.225 kg/m³ | 98.5203456 kW | 0.001 kW |
| `nrel-pvwatts-v5-dc-module-equation-8` | PV DC module equation with a known cell temperature | 4 kW DC nameplate, 800 W/m² transmitted POA, 50 °C cell temperature, −0.47%/°C standard-module coefficient | 2.824 kW DC | 0.0001 kW |

The input and expected values, source provenance, equation identifiers, output keys, and tolerance are stored in [`tests/fixtures/renewable-benchmarks.json`](../tests/fixtures/renewable-benchmarks.json). Automated comparison is in `tests/energy-models.test.mjs`.

### Wind boundary

NREL SAM reference manual Equation 29 defines theoretical power in wind as one half density, rotor swept area, and wind speed cubed. Energy Lab's `availablePowerKW` is the same pre-capture quantity. The fixture uses the exact NREL reference air density and an 8 m/s, 10 m-radius check point. The tolerance only accommodates floating-point arithmetic and rounding.

### PV boundary

PVWatts Version 5 Equation 8 computes array DC power from DC nameplate, transmitted plane-of-array irradiance, reference irradiance, cell temperature, and a linear temperature coefficient. Its Table 3 gives the standard module coefficient as −0.47%/°C. The fixture sets Energy Lab's simplified NOCT relation to 50 °C cell temperature (25 °C ambient, 800 W/m² irradiance, 45 °C NOCT) and uses that published coefficient. It compares DC output only; the reference temperature is deliberately a controlled input to isolate the module equation.

## What these checks do not establish

- The SAM manual also documents turbine-specific empirical power curves. Energy Lab's generic cubic-and-cap model is not benchmarked against, or claimed to reproduce, the Bergey example curve or a SAM turbine library curve.
- The PVWatts DC fixture does not validate Energy Lab's NOCT temperature estimate against PVWatts' Fuentes thermal model. It does not validate Energy Lab's simple system-loss multiplication or fixed inverter efficiency against PVWatts' detailed inverter curve.
- Neither fixture validates annual energy, a site forecast, a commercial device, or the complete wind/PV system output.
- Fixture tolerances are numerical regression thresholds, not expected engineering accuracy ranges.

The references describe broader and more detailed models: [NREL SAM wind performance manual](https://docs.nrel.gov/docs/fy14osti/60570.pdf) and [NREL PVWatts Version 5 manual](https://docs.nrel.gov/docs/fy14osti/62641.pdf). A future whole-model validation needs aligned inputs and boundaries, a separately sourced dataset, and documented model uncertainty before it can set meaningful accuracy tolerances.

# Model assumptions and limits

Turbine Lab is designed to make cause and effect visible during an exhibition. Its results are teaching estimates, not independently validated plant predictions.

## What is simplified

- The saturation-property table is small and rounded. Linear interpolation between widely spaced pressure points cannot reproduce a full steam-property formulation, especially near the critical point.
- Superheated enthalpy and entropy use a pressure-dependent, constant-heat-capacity approximation. Real heat capacity changes with both pressure and temperature.
- The supported boiler-pressure range ends at 20 MPa, below water's critical pressure. The model does not calculate supercritical steam.
- Ideal expansion to the exhaust uses saturated properties and an approximate superheat relation. Turbine efficiency is a single overall input; stages, reheat, moisture separation, and leakage are omitted.
- Pump work uses a constant liquid specific volume. Boiler, condenser, piping, and auxiliary losses are not modeled in detail.
- Generator efficiency is fixed at 98%. RPM is a visual mapping, not a turbine-speed calculation.
- The T–s saturation dome is a schematic outline. The inlet and outlet markers use model values, but the drawn dome is not a steam chart.
- P–v state markers use an ideal-vapor estimate, and the connecting cycle path is schematic. The plotted axes are logarithmic.
- Coal, nuclear, solar thermal, and geothermal cards are illustrative steam conditions; they do not model each heat source's complete plant configuration or fuel input.

## How to describe results at an exhibition

Say “the model estimates” or “the simplified cycle shows.” Discuss direction and trade-offs rather than claiming exact plant output. For example, increasing boiler pressure can improve ideal cycle efficiency over a range while making turbine exhaust wetter. Actual trends depend on temperature, reheat, component design, and operating limits.

Use an authoritative steam-property implementation such as IAPWS-IF97 for engineering or safety work. Turbine Lab must not be used to design, size, commission, or operate equipment. See the [implementation roadmap](roadmap.md) for the staged model-validation plan.

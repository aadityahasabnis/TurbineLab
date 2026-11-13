# Model assumptions and limits

Energy Lab is an educational experience for exploring cause and effect. Its outputs are operating-point estimates, not independently validated plant predictions, engineering design results, safety limits, financial estimates, or site forecasts.

## Wind

- Uses uniform wind across the swept rotor area, fixed air density (1.225 kg/m³), a fixed power coefficient (0.45), and drivetrain efficiency (94%).
- Applies cut-in, rated, and cut-out thresholds and caps output at rated capacity.
- Does not use a manufacturer-certified power curve or model hub-height shear, turbulence, wakes, availability, wind direction, or a weather time series.

## Solar PV

- Estimates cell temperature using a simplified NOCT relation; module efficiency, temperature coefficient, inverter efficiency, and system losses are fixed assumptions.
- Irradiance and ambient temperature are user inputs, not location-based weather data.
- Does not model orientation, sun position, shading, snow, soiling, degradation, clipping detail beyond a capacity cap, or annual yield.

## Steam Rankine cycle

- Saturation data is sparse and rounded; superheated properties use a simplified heat-capacity relation and pump work uses constant liquid specific volume.
- Turbine stages, reheat, detailed boiler/condenser losses, and equipment-specific controls are omitted. Generator efficiency is fixed at 98%.
- RPM is a visual mapping, not a machine-speed prediction. The T–s dome and P–v paths include schematic elements.
- Existing coal, nuclear, solar/CSP, and geothermal cards represent illustrative steam-cycle conditions, not complete source-specific plants.

## How to describe the results

Say “the model estimates” and identify which resource inputs and simplifications are active. Discuss trends and trade-offs rather than claiming exact output. A balanced diagram verifies only the model's stated accounting boundary; it does not validate every component or property estimate.

See [Energy Lab model notes](energy-models.md) for equations and primary reference context, and the [roadmap](roadmap.md) for planned validation and source modules.

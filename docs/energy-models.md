# Energy Lab model notes

Energy Lab shares controls, source-aware scenarios, result presentation, comparison, and URL state. The calculations stay separate because each technology has a different resource and conversion chain. Renewable operating-point models can also be evaluated against 24 hourly samples from an explicitly synthetic teaching profile.

## Common result boundary

Each source returns electrical output, available resource power, unconverted energy, conversion efficiency at the declared boundary, an explanation, and model limitations. For the wind and PV models:

```text
resource input = electrical output + not converted
boundary conversion = electrical output / resource input
```

The metric is a simplified operating-point ratio. It is not an annual efficiency or a universal technology comparison. Steam retains its thermal-cycle metrics and detailed Sankey as a separate module.

## Wind estimate

The wind module computes uniform wind-stream power over the rotor swept area:

```text
Pwind = 0.5 × air density × π × rotor radius² × wind speed³
```

A fixed power coefficient and drivetrain efficiency estimate electrical capture. Output is zero at or below cut-in and at or above cut-out, limited to rated capacity, and otherwise follows the captured-power estimate. The interface includes an output curve and controls for wind speed, rotor radius, capacity, and operating thresholds. Wind streak motion follows the resource input. Rotor motion is an illustrative visual cue that responds to estimated electrical output; it is not measured or predicted rotor RPM.

The model assumes 1.225 kg/m³ air density, a fixed 0.45 power coefficient, and 94% drivetrain efficiency. It does not include a manufacturer power curve, hub-height shear calculation, turbulence, wakes, availability, direction, or time-series data. These are editable engineering assumptions only in future work; the current result is an educational estimate.

Reference context: [NREL SAM wind performance model reference](https://docs.nrel.gov/docs/fy14osti/60570.pdf) describes wind resource characterization, turbine power curves, wind-farm layout, and time-step output. Energy Lab does not claim to reproduce SAM.

## Solar PV estimate

The PV module estimates cell temperature using ambient temperature, plane-of-array irradiance, and a fixed nominal operating cell temperature (NOCT):

```text
Tcell = Tambient + (NOCT − 20) × irradiance / 800
Pdc = capacity × irradiance / 1000 × max(0, 1 + γ × (Tcell − 25))
Pac = min(capacity, Pdc × (1 − system loss) × inverter efficiency)
```

The input energy boundary is irradiance over a reference array area derived from a fixed 20% module efficiency. Defaults use NOCT 45 °C, temperature coefficient −0.4%/°C, 14% user-visible system losses, and 96% inverter efficiency. The chart shows output over irradiance for the current temperature and other settings.

This is an operating-point estimate, not PVWatts, a site-specific forecast, or an annual yield estimate. It does not calculate sun position, weather, shading, snow, degradation, or module-specific behavior. Moving ray marks respond to irradiance, while electrical flow marks respond to modeled DC and AC power. Their motion is illustrative and does not represent photon or electron velocity. NREL's [PVWatts Version 5 manual](https://docs.nrel.gov/docs/fy14osti/62641.pdf) provides reference context for irradiance, temperature, system losses, inverter modeling, and aggregation of hourly AC/DC power into energy.

## Synthetic 24-hour source profiles

The “Balanced day”, “Sunny, calm day”, and “Breezy, cloudy day” profiles are deterministic, illustrative arrays generated in code. Their hourly wind speed, irradiance, and ambient temperature values are not measured, geographically located, or sourced weather data. In time-series mode, equipment inputs remain user-controlled while the selected profile supplies resource conditions for each hour. The simulator evaluates 24 hourly operating points with the existing wind/PV model and sums kW samples as 1-hour energy intervals to report MWh. The selected hour can be inspected or played. These are demonstration profiles, not representative-year estimates, forecasts, or a substitute for weather files. NREL's [SAM wind documentation](https://docs.nrel.gov/docs/fy14osti/60570.pdf) and [PVWatts documentation](https://docs.nrel.gov/docs/fy14osti/62641.pdf) provide examples of resource time-series modeling; this simplified app does not reproduce those tools.

## Hybrid hourly dispatch

The hybrid module combines the synthetic profile, the simplified default wind turbine model, and the PV operating-point model, scaled by turbine count and installed PV kW. Demand is a constant user-set kW for each of 24 one-hour intervals. Renewable power serves demand first; surplus charges storage, then is exported when grid-connected or curtailed off-grid. During a deficit, the battery discharges subject to its kW power limit and remaining kWh state; remaining deficit becomes grid import or unserved load. The battery uses fixed 95% charge and 95% discharge efficiencies. Storage capacity (kWh), power limit (kW), and state of charge (kWh) are modeled separately. Battery conversion loss is reported as daily kWh.

The hourly electrical boundary is checked as:

```text
renewable generation + grid import + battery discharge
= served load + battery charge + grid export + curtailment
```

Unserved load is excluded from served demand on the right-hand side. The dispatch uses an idealized bus, no reserve target, one-hour steps, fixed load, and no inverter, voltage, ramp, network, degradation, forecast, or market constraints. It is a teaching example for time-shifting and balancing concepts, not a microgrid design or reliability study. DOE describes how storage energy capacity and power capacity are distinct and how charging, discharging, imports, and curtailment can help balance supply and demand in its [solar integration and storage overview](https://www.energy.gov/cmei/systems/solar-integration-solar-energy-and-storage-basics).

## Scenarios and comparison

Each named operating-point scenario loads its complete source default setup plus the displayed scenario conditions, so it is repeatable even after a user has changed equipment assumptions. Any later control adjustment is identified as a custom operating point. Guided investigations start from a named baseline, pin that baseline, and guide the learner to change one input. A pinned reference stores its own source and inputs; switching between wind and PV keeps each source's pin separate. Renewable day links restore the source, inputs, profile, selected hour, and pin. Hybrid links restore its inputs and selected hour. The chart labels the current point and pinned reference separately.

## What is deliberately separate or deferred

- **Steam:** Existing Rankine model is preserved and remains an approximate teaching model. Its calculations and steam-only diagrams are not reused by PV or wind.
- **CSP:** The existing “CSP heat case” card still only selects illustrative steam-cycle conditions. A real CSP model needs a collector/receiver, thermal losses, heat-transfer/storage boundary, and steam-cycle coupling.
- **Hydro and geothermal:** Each needs resource controls and conversion calculations of its own; they cannot be represented by the wind/PV models or a generic turbine-efficiency slider.
- **Annual generation and site weather:** Deferred until sourced weather data, data-quality handling, and explicit interval assumptions travel with each result.
- **Engineering dispatch:** The included hybrid day is only a simplified teaching model; reserves, inverter and grid constraints, detailed battery behavior, realistic loads, cost, and emissions remain out of scope.

## Validation contract

Automated checks cover equations, input boundaries, finite values, output capacity, zero-resource states, temperature response, source-specific balance, deterministic profile bounds, hourly energy integration, hybrid power balance, storage bounds, off-grid load accounting, and share-link compatibility. Browser checks exercised guided experiments, profile/time playback controls, hybrid configuration, mobile diagram scaling, and URL restoration. These tests verify the implemented educational contracts; they do not establish engineering accuracy. Stronger accuracy claims require model-specific published benchmarks, provenance, tolerances, and separate validation evidence.

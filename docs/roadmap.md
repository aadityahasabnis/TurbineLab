# Energy Lab roadmap

## Current release: Energy Lab and operating-point models

- One source selector and shared render/share flow.
- Separate steam, wind, and PV calculation modules with independent controls.
- Interactive source-specific curves, operating-point comparisons, presets, and visible model limits.
- Local-only browser calculations and URL-restorable model inputs.
- One-variable guided investigations with an automatically pinned baseline.
- 24-hour renewable operating-point series using named, synthetic resource profiles; selected hour, playback, power curve, peak power, and summed daily energy.
- Hybrid wind/PV/battery/load/grid dispatch over the same clearly identified synthetic profiles, including state of charge, imports/exports, curtailment, unserved load, battery conversion losses, and hourly power balance.

The wind and PV models are intentionally modest educational estimates. The added daily and hybrid scenarios are synthetic teaching examples, not measured weather or forecasts. Their automated tests verify equations and declared boundaries, not engineering accuracy. See [Energy Lab model notes](energy-models.md).

## Next: strengthen model evidence and teaching flow

1. **Completed at shared equation boundaries:** publish sourced wind-stream and PV DC equation fixtures with regression tolerances. Whole-system comparison against SAM/PVWatts remains future work until inputs and model boundaries can be aligned; see [renewable reference benchmarks](reference-benchmarks.md).
2. **Completed for Regions 1, 2, and 4:** implement the IF97 Gibbs and saturation equations and regression-check against the official verification tables. Region 3 remains an explicitly labeled approximation fallback; whole-cycle/equipment accuracy is not validated. See [steam reference benchmarks](steam-reference-benchmarks.md).
3. Review keyboard/touch access and reduced-motion behavior across all modules, and improve mobile chart descriptions.
4. Replace synthetic profiles with versioned, cited weather inputs only after explicit source selection, data-quality handling, and interval validation. Annual estimates require that work first.

## Later source modules

- **Concentrating solar thermal (CSP):** collector and receiver, thermal losses and storage, then a coupled power cycle. The current CSP heat case remains a steam preset only.
- **Hydro:** head, flow, turbine/generator efficiency, and an explicit water-resource boundary.
- **Geothermal:** resource temperature and flow plus dry-steam, flash, or binary plant configuration.
- **Storage and grid:** improve the teaching dispatch with reserve policies, time-step controls, inverter and grid limits, and a documented battery model before using it for planning.

Every new module needs independent inputs, equations, limits, tests, and a visual energy boundary. Do not apply one generic turbine model to technologies that use different resource-conversion chains. Cost, emissions, and “best source” comparisons stay out until their assumptions and sources are visible and user-adjustable.

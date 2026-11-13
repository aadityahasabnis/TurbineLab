# Energy Lab roadmap

## Current release: shared platform, steam, wind, and solar PV

- One source selector and shared render/share flow.
- Separate steam, wind, and PV calculation modules with independent controls.
- Interactive source-specific curves, operating-point comparisons, presets, and visible model limits.
- Local-only browser calculations and URL-restorable model inputs.

The wind and PV models are intentionally modest educational estimates. Their automated tests verify equations and declared boundaries, not engineering accuracy. See [Energy Lab model notes](energy-models.md).

## Next: strengthen model evidence and teaching flow

1. Compare the simplified wind and PV outputs with selected published reference examples and publish those fixtures with provenance and tolerances.
2. Improve the steam property engine against published IAPWS/NIST states before claiming validated thermodynamic accuracy.
3. Add source-specific guided experiments and keyboard/touch and reduced-motion review across each module.
4. Only introduce weather files and annual production after sourcing and versioning the dataset and making the time boundary visible.

## Later source modules

- **Concentrating solar thermal (CSP):** collector and receiver, thermal losses and storage, then a coupled power cycle. The current CSP heat case remains a steam preset only.
- **Hydro:** head, flow, turbine/generator efficiency, and an explicit water-resource boundary.
- **Geothermal:** resource temperature and flow plus dry-steam, flash, or binary plant configuration.
- **Storage and grid:** separate charge/discharge and dispatch models; expose time intervals, efficiencies, and system boundaries.

Every new module needs independent inputs, equations, limits, tests, and a visual energy boundary. Do not apply one generic turbine model to technologies that use different resource-conversion chains. Cost, emissions, and “best source” comparisons stay out until their assumptions and sources are visible and user-adjustable.

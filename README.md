# Energy Lab

Energy Lab is a local-first browser learning studio for exploring how steam, wind, and solar photovoltaic systems turn energy resources into electricity. A renewable day view and a hybrid wind/PV/storage/load/grid dispatch help explore changing resources and system balance. Each technology has its own inputs and model; power, energy, and battery state stay distinct.

## Try it

- **Live simulator:** [Energy Lab](https://turbinelab.aadityahasabnis.com/)
- **Steam field guide:** [Learn the Rankine cycle](docs/)
- **Model contracts and limits:** [Energy model notes](docs/energy-models.md)

## Run locally

Serve this directory with any static HTTP server and open `index.html`. The application uses native HTML, CSS, and JavaScript modules; it has no build step or runtime framework.

Run the model and site checks with Node.js:

```powershell
node --test tests\physics.test.mjs tests\energy-models.test.mjs tests\site-seo.test.mjs
```

## Project map

- `index.html` — shared source selector and simulator interface.
- `js/models/` — source registry, independent wind/PV estimates, synthetic day profiles, and hybrid dispatch.
- `js/physics.mjs` — existing approximate steam Rankine cycle.
- `js/renewable-ui.mjs` — wind/PV controls, comparisons, charts, scenarios, and guided investigations.
- `js/hybrid-ui.mjs` — hourly hybrid energy-flow diagram, dispatch chart, and daily summary.
- `js/sharing.mjs` — source-aware URLs, including compatibility with older steam links.
- `docs/` — steam field guide, model assumptions, and future source roadmap.

## Accuracy

All modules are educational estimates, not engineering, safety, financial, or site-assessment tools. Wind uses a simplified rotor-power estimate rather than a certified turbine curve. PV uses a simplified cell-temperature and system-loss model rather than location-specific weather. Time-series and hybrid views use synthetic weather and constant load profiles; they are not forecasts. The steam cycle remains approximate and has not been validated by adding these modules. See [model notes](docs/energy-models.md) and [steam model limitations](docs/model-limitations.md).

## Future modules

Concentrating solar thermal (CSP), hydropower, and geothermal need separate resource and conversion models. The current CSP steam scenario is only an illustrative Rankine input, not a CSP plant simulation. The hybrid storage/grid view is a first teaching dispatch and needs more battery, inverter, and network constraints before planning use.

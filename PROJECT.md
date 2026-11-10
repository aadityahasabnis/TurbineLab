# SteamLab — Interactive Rankine cycle explorer

A responsive classroom simulation of steam-to-turbine energy conversion. The interface lets students vary boiler pressure, inlet temperature, mass flow, turbine efficiency, and condenser pressure, then compare estimated power, cycle efficiency, exhaust state, and energy flows.

## Run locally

Serve this directory with any static HTTP server and open `index.html`. The interface uses native HTML, CSS, and JavaScript modules; no build step or framework is required. Browser module security may prevent reliable operation when opening the HTML directly from disk.

## Project structure

- `index.html` — page structure and controls.
- `css/` — theme, responsive layout, and component styles.
- `js/physics.mjs` — pure calculation model and input ranges.
- `js/visualizations.mjs` — efficiency curve, cycle plots, and Sankey SVG.
- `js/turbine.mjs` — canvas turbine animation.
- `js/main.mjs`, `events.mjs`, `sharing.mjs` — application state, rendering, controls, and URL sharing.
- `tests/physics.test.mjs` — model and balance checks.
- `docs/` — student learning guide, equations, assumptions, Q&A, and build record.

## Read before presenting

Start at [docs/README.md](docs/README.md). The model is intentionally approximate and intended for learning. Read [model limitations](docs/model-limitations.md) before presenting outputs as real-plant predictions.

## Development phases

The current implementation includes the responsive foundation, cycle engine, turbine visual, charts, balanced energy flow, scenarios, sharing, and classroom explanations. The remaining release review is device/browser inspection and comparison against an authoritative steam-property implementation. See [the build record](docs/build-plan-and-changelog.md).

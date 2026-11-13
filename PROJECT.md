# Energy Lab — multi-source power systems explorer

Energy Lab is a responsive browser learning studio for steam, wind, and solar PV. It shares source selection, live rendering, comparison, and shareable scenarios while keeping each technology's resource and conversion model separate.

## Run locally

Serve this directory with any static HTTP server and open `index.html`. The app uses native HTML, CSS, and JavaScript modules with no build step or framework.

## Project structure

- `index.html` — Energy Lab shell, source selector, steam dashboard, and renewable workspace.
- `js/models/` — shared model registry and isolated wind/PV calculations.
- `js/physics.mjs` — existing approximate Rankine cycle.
- `js/renewable-ui.mjs` — source-specific renewable controls and visualizations.
- `js/sharing.mjs` — source-aware query state and legacy steam-link support.
- `tests/` — steam, wind/PV, URL, and site metadata checks.
- `docs/` — source model assumptions and steam field guide.

## Model status

All outputs are educational operating-point estimates, not engineering or site-assessment results. The new wind model uses a fixed-coefficient rotor estimate; PV uses a simplified temperature and loss model. The steam cycle remains a separate, approximate teaching model. See [energy model notes](docs/energy-models.md).

# Turbine Lab

**Short description:** An interactive Rankine cycle simulator for exploring steam power, turbine performance, and energy flow.

Turbine Lab is a browser-based learning experience for exploring how boiler pressure, steam temperature, flow, turbine efficiency, and condenser pressure affect a steam power cycle. Change a control, follow the turbine, and see how work, efficiency, exhaust moisture, and rejected heat move together.

On desktop, inputs and presets stay together in a left rail while the turbine, paired charts, energy balance, and learning panels flow through one visualization workspace. Narrow tablet workspaces stack the charts to keep them readable; mobile keeps its single-column order.

Use **Customize dashboard** to move, resize, or pin any of the seven panels. Your layout is saved in this browser; **Reset layout** restores the responsive defaults.

## Try it

- **Live simulator:** [turbinelab.aadityahasabnis.com](https://turbinelab.aadityahasabnis.com/)
- **Field guide:** [Learn the Rankine cycle](https://turbinelab.aadityahasabnis.com/docs/)
- **Steam facts:** [A quick guide for curious minds](https://turbinelab.aadityahasabnis.com/docs/quick-facts.html)

## Run locally

Serve this directory with any static HTTP server and open `index.html`. The application uses native HTML, CSS, and JavaScript modules; it has no build step or runtime framework.

Run the model checks with Node.js:

```powershell
node --test tests\physics.test.mjs tests\site-seo.test.mjs
```

## Project map

- `index.html` — simulator interface and search/social metadata.
- `css/` — themes, responsive layout, and controls.
- `js/physics.mjs` — pure cycle calculations and operating ranges.
- `js/dashboard-layout.mjs` — responsive panel layout, saved per browser.
- `js/visualizations.mjs`, `js/turbine.mjs` — diagrams and Canvas animation.
- `docs/` — equations, assumptions, classroom experiments, presentation notes, and the implementation roadmap.
- `assets/turbine-lab-og.png` — 1200 × 630 social preview image.
- `scripts/generate-og-image.ps1` — regenerates the social image with anti-aliased Segoe UI typography on Windows.

## Accuracy note

This is an educational approximation, not an engineering, safety, or plant-operating tool. The [equations](docs/physics-and-equations.md), [model limits](docs/model-limitations.md), and [accuracy roadmap](docs/roadmap.md) explain what is and is not represented.

## Next stage

The roadmap turns the current visual simulator into a trustworthy **steam-to-grid learning studio**: published benchmark states, a verified property engine, transparent model confidence, explainable plant-level trade-offs, and a presentation-ready classroom mode.

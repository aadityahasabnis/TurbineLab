# Turbine Lab — implementation-ready roadmap

## The product idea

Do not grow Turbine Lab into another dashboard full of dials. Make it a **steam-to-grid learning studio**: a person asks a question, changes one operating decision, sees the whole energy story, and can explain why the result deserves trust.

Each release should connect four things:

1. **Explore** — a clear, fast simulation with one shared state.
2. **Explain** — a visible chain from inputs, through cycle states, to outputs.
3. **Check** — published property references, test results, assumptions, and an honest confidence/validity status.
4. **Present** — a coherent experiment that works for an audience, not only for the person holding the mouse.

### A different, more memorable approach

Frame each scenario as an **energy decision**, not a source-themed preset:

- *More output:* what changed in steam flow and turbine work?
- *Less fuel heat:* what improved cycle efficiency, and what did it cost?
- *Drier exhaust:* which input reduced moisture without hiding lost power?
- *Useful heat:* could condenser heat serve a nearby process or district-heating loop?
- *Flexible grid:* when should the plant generate, store, or redirect energy?

Start with the simple Rankine cycle. Add reheat, regeneration, combined heat and power, emissions, storage, and grid context only when each has a defined system boundary, input data, formula, and test. That makes the experience distinctive without turning uncertain assumptions into authoritative-looking numbers.

## Current baseline

- A responsive, static browser app with no server or build step.
- Five live controls, four readouts, scenarios, compare, sharing, theme switch, Canvas turbine, SVG diagrams, and a classroom field guide.
- A compact property table and simplified cycle approximations.
- The displayed RPM and some diagrams are explanatory visuals, not machine predictions.
- Energy-flow totals are balanced within the model's declared boundary. This does **not** make every property or plant-performance value validated.

The current status is **teaching model — not property-validated**. Do not describe it as engineering-grade or “high accuracy” until the validation gate below passes.

## Architecture decision

Keep the app static and local-first. The cycle is small enough to compute in the browser; it does not need accounts, telemetry, a database, or an API.

- Keep inputs in one versioned state object and all thermodynamics in pure functions.
- Split property evaluation, cycle process calculations, plant configuration, and display rendering. Views must not calculate thermodynamics.
- Bundle the selected property evaluator locally. Never send live student input to a remote calculation service.
- Start on the main thread. Move the property engine to a Web Worker only if the measured worst-case interaction exceeds the agreed frame budget.
- Keep diagrams derived from the same state/result object; show their system boundary and label schematic paths.
- Store shareable scenarios as versioned, validated URL parameters. Add export only after its units and model version travel with the data.
- Introduce no framework or dependency unless a tested need justifies it.

## Delivery sequence

| Phase | Deliverable | Acceptance gate |
|---|---|---|
| **0 — Identity and discovery** | Consistent Turbine Lab name, page metadata, social preview, sitemap, field-guide links, repository description. | Canonical URLs resolve on the published domain; social image loads as a 1200 × 630 PNG; metadata and structured data parse; no duplicate titles or descriptions on the main and guide pages. |
| **1 — Physics contract and reference set** | A short property-engine selection record; explicit units/ranges; a checked-in benchmark fixture sourced from published IAPWS/NIST reference states. | Every fixture includes source, state, units, expected value, precision, and tolerance. Supported and unsupported regions are explicit before any engine replacement. |
| **2 — Verified property engine** | A locally bundled, license-reviewed IAPWS-IF97-capable evaluator with saturation, compressed-liquid, superheated-vapor, and applicable near-critical behavior for the chosen domain. Keep a second evaluator or published values for independent comparison. | Across reference states, enthalpy/entropy/temperature/quality errors meet the recorded tolerances; domain errors are explicit, not clamped into plausible answers; no input combination creates NaN/Infinity. Report measured error and test coverage rather than claiming exactness. |
| **3 — Auditable Rankine cycle** | Named states 1–4; pump, boiler, turbine, condenser; turbine isentropic efficiency; generator efficiency; independent heat/work rates; quality only in the two-phase region. | Unit and first-law tests pass for each state; mass flow scales rates but not ideal cycle efficiency; property, shaft, net, and electric power are not conflated; Sankey boundary closes within a documented tolerance. |
| **4 — Trustworthy visual model** | T–s / P–v paths generated from calculated states and clearly distinguished from schematics; valid operating envelope; explanation of why a point is unsupported or wet. | Every plotted point is derived from tested state values. Warnings use documented thresholds, distinguish model limits from real-plant alarms, and remain understandable without color. |
| **5 — Beyond the single loop** | Optional plant blocks: reheat first; then regeneration or combined heat and power. Add a condenser-heat destination as an explicit alternate boundary. | Each topology has its own state/process diagram, equations, reference tests, and accounting boundary. Existing simple-cycle scenario remains available as a baseline. No “carbon saved” or fuel-cost claim without user-visible, sourced assumptions. |
| **6 — Energy-system decision lab** | Optional, clearly labeled context layer for heat use, fuel/emissions assumptions, storage, and grid dispatch; compare alternatives using a Pareto view rather than a single “best” score. | Every added metric exposes its source, units, and adjustable assumptions. No opaque optimization; show trade-offs, constraints, and uncertainty. |
| **7 — Classroom and presentation mode** | A guided 3-minute experiment, projector-friendly theme, step-by-step narration, compare snapshots, result card/CSV export, printable lesson, and keyboard/touch support. | A presenter can complete the lesson without instructions from a developer. Shared results include inputs, model version, units, and “educational model” notice. Reduced motion and accessible contrast pass review. |
| **8 — Release and evidence** | Repeatable tests, deployment checks, search/social validation, performance/accessibility review, and a public change log. | No console errors; 375 px/768 px/1440 px layouts work; share links restore all inputs; agreed mobile interaction budget holds on a representative device; Lighthouse and social-preview checks are recorded for the published build. |

Phases 1–4 must pass before marketing the thermodynamics as validated. Phase 5 is the first major product expansion. Phases 6–7 are optional extensions, not prerequisites for a credible educational release.

## Executable work breakdown

### Now — identity and discovery

- [x] Set the public product name to **Turbine Lab** in the simulator and learning guide.
- [x] Add canonical, description, robots, Open Graph, and large Twitter-card metadata.
- [x] Create a share image, favicon, sitemap, and crawler rules.
- [x] Add a direct field-guide entry point and useful GitHub landing-page copy.
- [x] Publish this roadmap and a short-facts page with classroom material.
- [ ] After the next deployment, validate the public HTML, image response, sitemap, and social-card previews.

### Next — property fidelity

1. Write the property-engine selection note: candidate, license, browser footprint, domain/region coverage, reference evidence, and fallback decision.
2. Freeze 15–25 reference states spanning saturation, compressed liquid, superheated vapor, wet exhaust, supported pressure/temperature limits, and edge cases. Keep published source values and displayed precision with every fixture.
3. Add a pure evaluator boundary such as `properties.stateAtPT(P, T)` and `properties.saturationAtP(P)`; use explicit SI/engineering units in names and comments.
4. Replace hand-interpolated state logic behind the existing `computeAll` API, preserving the UI state contract.
5. Add reference-error reporting, domain guards, first-law invariants, randomized range tests, and regression fixtures before updating any chart.
6. Publish the measured validation summary and recalibrate presets only after the benchmark passes.

### Then — topology and presentation

1. Represent the cycle as named state points plus explicit processes; derive all outputs from those states.
2. Add **reheat** as the first optional topology. Explain each additional state in the T–s plot and compare it with the simple cycle using identical boundary conditions.
3. Add **combined heat and power** as a separate condenser-heat destination. Keep electric and useful-heat efficiency distinct.
4. Add a presentation mode that locks a chosen lesson sequence—not the controls—and narrates a changed input, result, trade-off, and limitation.
5. Add export only with a schema version and provenance fields (`modelVersion`, state inputs, units, timestamp, source scenario).

## Thermodynamics and accounting contract

Use the same definitions in code, visible labels, guide, tests, and exported results:

```text
w_turbine = h1 − h2
w_pump    = h4 − h3
w_net     = w_turbine − w_pump
q_in      = h1 − h4
eta_cycle = w_net / q_in
P_electric = m_dot × w_net × eta_generator
Q_out     = q_in − w_net
```

Rates multiply specific quantities by mass flow. With `h` in kJ/kg and mass flow in kg/s, the rate is kW; divide by 1000 for MW.

- Turbine isentropic efficiency: `eta_t = (h1 − h2) / (h1 − h2s)`.
- Steam quality is defined only inside the saturated liquid–vapor dome. Show **wet mixture**, **saturated**, or **superheated**—do not label superheated steam “100% quality.”
- Inlet states outside the selected property engine's domain must be shown as unsupported; never silently substitute a saturated state.
- Keep the heat-input boundary distinct from generator loss. Write the equation for every Sankey split and make the displayed bands close to that boundary.
- RPM should remain “illustrative” until a real rotor, pole count, grid frequency, and control model are specified.

## Quality gates and evidence

### Physics

- Unit tests for each property region and each cycle process.
- Independent reference comparisons with source citations and explicit precision/tolerance.
- Invariants for first-law closure, non-negative rates, bounded efficiency, units, and input-domain rejection.
- Trend tests are supplementary; passing a trend test is not evidence of absolute accuracy.
- Test boundary values, high/low combinations, wet/dry state crossings, and URL-restored values.

### Product and presentation

- One control change updates cards, warnings, all visible charts, and the URL from a single render.
- Desktop, tablet, 375 px mobile, keyboard-only, reduced-motion, and light/projector theme checks.
- Explain the question, observation, answer, and limitation; avoid calling any result a safety threshold.
- Use a “model confidence / domain” status only when it is backed by test coverage, not an invented percentage.

### Search and sharing

- Each public HTML page has a unique useful title, description, canonical, heading structure, and Open Graph image.
- Sitemap contains only published canonical pages; `robots.txt` points to it.
- Test structured data with Google's Rich Results Test and social cards with their current platform debuggers after deployment.
- Search metadata helps discovery and previews; it is not a ranking guarantee. Useful, accurate page content and real links remain the priority.

## Risks and decisions

| Risk | Guardrail |
|---|---|
| “More accurate” becomes an unsupported marketing claim | Publish reference cases, measured error, domain limits, and a dated model version before changing the claim. |
| A property package is stale, too large, or incompatible | Review license, maintenance, browser footprint, source coverage, and fixtures in Phase 1; keep the engine local and swappable. |
| Optional features hide broken energy accounting | Give every topology a declared control volume, equations, and separate invariants. |
| More diagrams imply more certainty than the model has | Derive plots from tested states and label schematic paths explicitly. |
| Emissions, cost, or “best plant” scores imply false precision | Use sourced editable factors, show sensitivity ranges, and never bury assumptions. |
| Features distract from the memorable interaction | Keep the default experience one control → one visible consequence; place advanced layers behind explicit modes. |

## Reference shelf

- [IAPWS Industrial Formulation 1997 (official release)](https://iapws.org/relguide/IF97-Rev.html) — water/steam property formulation.
- [NIST thermodynamic properties of water (IAPWS-based)](https://www.nist.gov/publications/thermodynamic-properties-water-tabulation-iapws-formulation-1995-thermodynamic) — independent reference context.
- [NIST steam tables](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=906704) — tabulated values for teaching and benchmark fixtures.

These references do not validate Turbine Lab by themselves. Validation evidence comes from tested implementation results against cited values.

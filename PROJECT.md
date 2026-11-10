# SteamLab — Phases, To-Do List & Build Instructions

*No code — just the plan, tasks, and precise instructions for whoever builds it.*

---

## PHASE 0 — Project Foundation

**Goal:** empty shell that loads and looks right on all screens.

### To-Do
- [ ] Create folder structure (§Repo layout above)
- [ ] Create `index.html` with all section shells (hero, controls, dashboard, turbine, sankey, charts, presets, learn)
- [ ] Create CSS variable file — colors, spacing, font scale, radius, shadows
- [ ] Set up dark theme tokens (navy/charcoal + cyan/amber) and light theme tokens
- [ ] Build CSS Grid layout: mobile-first, then 640px, then 1024px breakpoints
- [ ] Add Google Font (one sans, one mono for numbers)
- [ ] Verify page renders at 375px, 768px, 1440px

### Instructions for the builder
- **Mobile-first always.** Write the base CSS for phone, then add `@media (min-width)` upward. Never desktop-down.
- **CSS variables for everything.** No hardcoded colors anywhere outside `theme.css`. The theme toggle must flip one root class.
- **Use `clamp()`** for font sizes and section padding — fewer breakpoints needed.
- **Semantic HTML.** Use `<section>`, `<aside>`, `<output>` for values. Accessibility free.
- **No JS in Phase 0.** This phase is purely visual scaffolding.
- **Gate:** page loads, three breakpoints look clean, zero console errors.

---

## PHASE 1 — Core Engine (the project's heart) ⭐

**Goal:** sliders change Power and Efficiency with correct trends.

### To-Do
- [ ] Build `steamTable.json` — ~50 saturation rows (P, Tsat, hf, hfg, hg, sf, sfg, sg), log-spaced 1 kPa → 25 MPa
- [ ] Write interpolation function (linear between nearest rows, clamp at ends)
- [ ] Write superheat enthalpy function
- [ ] Write `computeAll(inputs)` — full chain: h1 → s1 → isentropic exit → actual exit → work → heat → efficiency → quality → rpm
- [ ] Create single `state` object
- [ ] Build 5 slider components with value bubbles
- [ ] Wire slider `input` event → debounce 60ms → update state → compute → render
- [ ] Build dashboard with 2 cards: Power (MW), Efficiency (%)
- [ ] Add number tweening (250–300ms)
- [ ] Reset + Randomize buttons

### Instructions for the builder
- **Physics is pure functions.** No DOM access inside `physics.js` or `steamTable.js`. Takes inputs, returns results. This makes it testable and bug-proof.
- **State is the only truth.** Sliders write to state. Render reads from state. Nothing else.
- **One `render(state)` function** calls every component's update. Never update two things separately.
- **Sanity checks inside `computeAll`:** if efficiency > 50% or < 5%, you have a bug. If quality > 1 or < 0, clamp it. Log a warning in dev.
- **Debounce, don't throttle.** Wait for 60ms of slider silence before recomputing — feels instant but protects the CPU.
- **Tween numbers, never snap.** A jumping number reads as a bug; a sliding number reads as a simulation.
- **Do NOT build any visuals yet.** No turbine, no charts, no Sankey. Two numbers only.
- **Gate:** drag pressure 1→25 MPa → efficiency rises then flattens (diminishing returns); drag temperature up → efficiency rises; all smooth, no lag. **If this gate passes, the project already works.**

---

## PHASE 2 — Turbine Animation

**Goal:** blades spin at a speed that clearly tracks RPM.

### To-Do
- [ ] Create `<canvas>` in turbine section, handle devicePixelRatio
- [ ] Draw static turbine: hub + 12–16 blades + housing
- [ ] Build rotation loop using `requestAnimationFrame`, speed ∝ `state.results.rpm`
- [ ] Build steam particle system — spawn rate ∝ `flowKgS`, speed ∝ `pressureMPa`
- [ ] Gradient steam (white → transparent)
- [ ] Pause loop when canvas is offscreen or tab hidden
- [ ] Show live RPM readout next to canvas
- [ ] Resize canvas on container resize

### Instructions for the builder
- **One rAF loop for the whole page**, not one per component. Central animation ticker in `main.js`.
- **Use `IntersectionObserver`** to pause when offscreen — battery matters on phones.
- **devicePixelRatio scaling** — canvas must be crisp on retina. Set `canvas.width = cssWidth × dpr`, then `ctx.scale(dpr, dpr)`.
- **Particles in a pool** — preallocate ~200, reuse them. Never `new` in the loop; it causes GC stutter.
- **Speed mapping:** `rpm 0 → 0 rad/frame`, `rpm 3600 → ~0.15 rad/frame`. Tune by eye, not by formula.
- **Cap particle count** based on screen width — fewer on mobile.
- **Gate:** raising flow or pressure visibly speeds up particles; raising power visibly speeds up blades; 60fps on mid-range phone.

---

## PHASE 3 — Efficiency Curve

**Goal:** user sees the efficiency dot sliding along a precomputed curve.

### To-Do
- [ ] Precompute efficiency vs pressure array (20–30 samples) at Phase 1 completion
- [ ] Draw SVG axes, grid, curve
- [ ] Plot live dot from current state
- [ ] Animate dot position on change (300ms ease)
- [ ] Add optional ghost dot (previous config) when compare mode is toggled
- [ ] Hover crosshair showing (pressure, efficiency) values

### Instructions for the builder
- **Compute the curve once at boot**, not on every slider move. Cache it. Recompute only when temperature/flow/condenser change (they affect the curve's shape).
- **SVG, not canvas.** Easy hover targets, crisp, accessible.
- **Dot must visibly slide**, not teleport. That slide is the teaching moment — the user sees *why* the optimum exists.
- **Add an inflection marker** — a subtle label at the peak efficiency pressure. "Optimum: 15 MPa."
- **Gate:** drag pressure → dot slides along curve → user can *see* efficiency flatten.

---

## PHASE 4 — Sankey Energy Flow

**Goal:** user sees 100% of input energy accounted for.

### To-Do
- [ ] Build SVG Sankey with 4 fixed flows: Heat In → Work + Waste Heat, Work → Electricity + Generator Loss
- [ ] Flow width ∝ MW values
- [ ] Labels with absolute MW and percentage
- [ ] Hover/tap a flow → highlight + tooltip
- [ ] Animate flow widths smoothly on change
- [ ] Vertical orientation for mobile
- [ ] Verify sum: `heatInMW = workMW + wasteMW` (±0.1%)

### Instructions for the builder
- **Fixed topology.** Do not build a dynamic Sankey library — just 4 hand-placed SVG paths whose stroke-width or polygon shape scales with values.
- **Sum must be exact.** This is a teaching tool — if the numbers don't add up, it teaches the wrong thing. Add a dev-mode assertion.
- **Color semantics:** warm colors (amber/orange) for heat, cyan for work, grey for waste. Consistent everywhere on the page.
- **Tooltip on tap for mobile**, hover for desktop. Don't rely on hover alone.
- **Gate:** flows visibly resize as sliders move; percentages sum to 100%; tap works on phone.

---

## PHASE 5 — T–s Diagram + Warnings

**Goal:** physics depth + safety feedback.

### To-Do
- [ ] Draw saturation dome (from steam table — Tsat vs sf, sg)
- [ ] Plot live cycle point (s1, T1) and exit point (s2, T2)
- [ ] Draw line between them (expansion path)
- [ ] Animate point position on change
- [ ] Build warning system — quality badges (green/amber/red)
- [ ] Show inline warning text for wet steam, stall, low efficiency
- [ ] Add tooltip with exact (s, T) at hover

### Instructions for the builder
- **Saturation dome must be correct shape** — it's the visual anchor of the diagram. Pull from steam table, don't approximate.
- **Warnings are a component**, driven by `results.exitQuality` and `results.powerMW`. Central logic in `warnings.js`.
- **Thresholds:** quality ≥ 0.90 green · 0.85–0.90 amber · < 0.85 red. Power < 5 MW = "turbine stall" warning.
- **Warnings must animate in** (slide or fade), never appear abruptly — jarring warnings get ignored.
- **Gate:** low condenser pressure or high superheat visibly moves the point; red warning triggers exactly when quality < 0.85.

---

## PHASE 6 — Presets, Compare, Share

**Goal:** quick scenario switching + shareable configs.

### To-Do
- [ ] Define 4 preset configs: Coal, Nuclear, Solar Thermal, Geothermal — with realistic input values
- [ ] Preset cards with name, icon, one-line description
- [ ] One tap loads all inputs into state, re-renders everything
- [ ] Compare toggle — pin current config as ghost, then change sliders to see delta
- [ ] Encode state into URL (`history.replaceState`)
- [ ] On load, parse URL and restore config
- [ ] "Copy share link" button

### Instructions for the builder
- **Presets are just state overrides.** No special code path — setting state to preset values is enough.
- **URL encoding:** serialize `state.inputs` as a compact query string. Read on boot and apply before first render.
- **Compare mode:** one boolean in `state.ui`. When on, components draw a second ghost layer using the pinned config. No new state system.
- **Gate:** preset loads all 5 sliders and all visuals correctly in one tap; share URL restores exact config in a new tab.

---

## PHASE 7 — Polish

**Goal:** the site feels finished.

### To-Do
- [ ] Theme toggle (dark/light) with system-preference default
- [ ] Mobile sticky bottom bar showing Power + Efficiency
- [ ] Chart tabs on mobile (T–s / P–V / Efficiency) — swipeable
- [ ] Guided tour on first visit (4-step tooltip walkthrough)
- [ ] "Explain this" toggle — narrates the current result in plain text
- [ ] Accessibility pass: keyboard focus, ARIA labels, contrast check
- [ ] Touch targets ≥ 44px
- [ ] Reduced-motion respect (disable particle animation if `prefers-reduced-motion`)

### Instructions for the builder
- **Reduced motion is non-negotiable.** Respect `prefers-reduced-motion` — set turbine speed to a slow constant or hide particles.
- **Explain toggle** is one text block whose content regenerates from state. No new system.
- **Theme toggle changes one class on `<html>`.** CSS variables do the rest.
- **Guided tour is optional** — if time runs out, skip it. It's the last thing on the list.
- **Gate:** user can use the whole site on a phone with one thumb; site works with keyboard only.

---

## PHASE 8 — QA & Performance

**Goal:** ship-ready.

### To-Do
- [ ] Test on 375px phone, tablet, 1440px desktop
- [ ] Test in Chrome, Firefox, Safari
- [ ] Verify no console errors on load or after 30s of slider dragging
- [ ] Verify load time < 2s on simulated 3G
- [ ] Verify 60fps during slider drag on mid-range Android
- [ ] Verify URL share round-trip
- [ ] Verify physics trends against 3 known plant configs
- [ ] Verify Sankey sums to 100%
- [ ] Verify all warnings fire at correct thresholds
- [ ] Deploy to GitHub Pages / Netlify
- [ ] Run full acceptance checklist (§10)

### Instructions for the builder
- **Test on a real phone**, not just DevTools. Touch behavior and rAF performance differ.
- **Throttle to "Fast 3G"** in DevTools and verify the first paint is under 2s — otherwise mobile users leave before seeing anything.
- **Acceptance checklist is the final gate.** If any item fails, don't ship — fix, then re-run.

---

## CROSS-CUTTING INSTRUCTIONS (apply to every phase)

### Architecture rules
1. **State is the single source of truth.** No DOM reads for values.
2. **One `render(state)` function.** Never update two components separately.
3. **Physics is pure.** No DOM, no side effects, testable in isolation.
4. **One rAF loop** for the whole page. Components register update callbacks.
5. **Every component exposes `init()` and `update(state, results)`.**
6. **Debounce inputs (60ms), tween outputs (250–300ms).**

### Code-quality rules
1. **No hardcoded colors** outside `theme.css`.
2. **No magic numbers** in components — name them (e.g., `RPM_MAX`, `QUALITY_WARN`).
3. **Comment every physics formula** with its name (e.g., `// Turbine work: W = m·(h1 − h2)`).
4. **Keep files under 200 lines.** Split earlier.
5. **Console must be clean.** Log warnings only in dev mode (a flag in `main.js`).

### UX rules
1. **Every number animates.** No snaps.
2. **Every warning animates in.**
3. **Every tooltip works on tap** (mobile) and hover (desktop).
4. **Every slider thumb ≥ 44px.**
5. **Every state-changing action is reversible** (Reset button).

### Testing rules
1. **Physics sanity test** at boot: run 3 known configs, assert output ranges.
2. **Sankey balance test** at boot: assert `heatIn = work + waste`.
3. **Manual smoke test** after every phase: drag all 5 sliders, verify all visuals move.

---

## MASTER TO-DO (flat checklist for the agent)

```
[ ] PHASE 0 — Foundation
    [ ] Folder structure
    [ ] HTML shells for all sections
    [ ] CSS variables + theme tokens
    [ ] Responsive grid (3 breakpoints)
    [ ] Fonts loaded
    [ ] Gate: loads clean at 375/768/1440px

[ ] PHASE 1 — Core Engine ⭐
    [ ] steamTable.json (~50 rows)
    [ ] interpolation + superheat functions
    [ ] computeAll() — full chain
    [ ] state object
    [ ] 5 sliders + debounce
    [ ] Power + Efficiency cards + tweening
    [ ] Reset + Randomize
    [ ] Gate: trends correct, smooth, no lag

[ ] PHASE 2 — Turbine
    [ ] Canvas + dpr scaling
    [ ] Blade rotation tied to RPM
    [ ] Particle system tied to flow/pressure
    [ ] IntersectionObserver pause
    [ ] Live RPM readout
    [ ] Gate: speed visibly tracks power, 60fps mobile

[ ] PHASE 3 — Efficiency Curve
    [ ] Precompute curve at boot
    [ ] SVG axes + curve
    [ ] Live sliding dot
    [ ] Optimum marker
    [ ] Gate: dot slides, user sees flattening

[ ] PHASE 4 — Sankey
    [ ] 4 fixed flows (SVG)
    [ ] Widths ∝ MW
    [ ] Labels with %
    [ ] Hover/tap highlight
    [ ] Vertical on mobile
    [ ] Sum assertion
    [ ] Gate: sums to 100%, resizes live

[ ] PHASE 5 — T–s + Warnings
    [ ] Saturation dome
    [ ] Live cycle point + path
    [ ] Warning component (green/amber/red)
    [ ] Inline warning text
    [ ] Gate: point moves, warnings correct

[ ] PHASE 6 — Presets + Share
    [ ] 4 preset cards
    [ ] One-tap load
    [ ] Compare ghost mode
    [ ] URL encode/decode
    [ ] Copy link
    [ ] Gate: preset + share round-trip

[ ] PHASE 7 — Polish
    [ ] Theme toggle
    [ ] Mobile bottom bar
    [ ] Mobile chart tabs
    [ ] Reduced-motion support
    [ ] Accessibility pass
    [ ] Guided tour (optional)
    [ ] Explain toggle
    [ ] Gate: fully usable one-thumbed, keyboard-accessible

[ ] PHASE 8 — QA
    [ ] Cross-device test
    [ ] Cross-browser test
    [ ] Console clean
    [ ] Load < 2s
    [ ] Physics validation
    [ ] Acceptance checklist all green
    [ ] Deploy
```

---

## THE ONE RULE

> **Build Phase 1 completely before touching any visual. If Phase 1 works — sliders change power and efficiency with correct trends — the project already succeeds. Everything after Phase 1 is decoration on a working engine.**

---

Ready for the next step? I can hand over a **component-by-component instruction sheet** (what each file must contain, what it accepts, what it returns) — still no code, just specs the agent can follow.
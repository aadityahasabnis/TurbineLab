# Build plan and implementation record

## Phases

| Phase | Scope | Status |
|---|---|---|
| 0 — Foundation | Responsive shell, controls, theme, and core sections | Implemented |
| 1 — Cycle engine | Shared inputs, property interpolation, Rankine calculations, outputs | Implemented; approximation is documented |
| 2 — Turbine | Canvas rotor and steam particle animation | Implemented |
| 3 — Performance | Live efficiency curve and compare pin | Implemented |
| 4 — Energy balance | Interactive Sankey with nested generator flow | Implemented; balance uses net shaft work boundary |
| 5 — Thermodynamics | T–s and P–v plots, exhaust status, warnings | Implemented; diagram limits are called out |
| 6 — Scenarios and sharing | Four presets, reset/randomize, compare, URL state | Implemented |
| 7 — Classroom polish | Responsive layout, theme, reduced motion, explanations | Implemented; guided tour remains optional |
| 8 — Release review | Physics checks, browser/device review, deployment | Physics tests run; device/browser and deployment checks remain to be performed |

## Implementation changes

- Replaced the arbitrary turbine-drop correlation with an enthalpy-based isentropic expansion and an explicit turbine-efficiency step.
- Included approximate liquid-pump work, net shaft work, generator conversion, thermal efficiency, and a balanced heat-rejection term.
- Reduced the supported pressure slider maximum to 20 MPa so the model stays below the critical-point region represented poorly by its compact table.
- Made quality undefined for superheated exhaust and explain this state in the interface.
- Updated live T–s exhaust coordinates and made P–v state locations follow the model's specific-volume estimates.
- Added classroom documentation for formulas, assumptions, definitions, Q&A, sources, and the remaining verification work.

## Verification completed

- `node --test tests/physics.test.mjs` — 10 tests passed.
- Tests cover finite and balanced outputs across input-range corners, mass-flow scaling, expected pressure/temperature/condenser trends, wet-steam warning threshold, superheated-exhaust quality behavior, saturation interpolation, and preset bounds.

## Remaining review

- Check the page at 375 px, tablet width, and desktop width, including touch interaction and the light theme.
- Compare representative states with a full IAPWS-IF97 property calculator before making any higher-precision claim.
- Inspect browser console and loading behavior on the actual exhibition device.

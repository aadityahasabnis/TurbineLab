# Build plan and implementation record

## Phases

| Phase | Scope | Status |
|---|---|---|
| 0 — Foundation | Responsive shell, controls, theme, and core sections | Implemented |
| 1 — Cycle engine | Shared inputs, Region 1/2/4 property calculations where supported, Rankine calculations, outputs | Implemented; Region 3 and whole-cycle limits are documented |
| 2 — Turbine | Canvas rotor and steam particle animation | Implemented |
| 3 — Performance | Live efficiency curve and compare pin | Implemented |
| 4 — Energy balance | Interactive Sankey with nested generator flow | Implemented; balance uses net shaft work boundary |
| 5 — Thermodynamics | T–s and P–v plots, exhaust status, warnings | Implemented; diagram limits are called out |
| 6 — Scenarios and sharing | Four presets, reset/randomize, compare, URL state | Implemented |
| 7 — Classroom polish | Responsive layout, theme, reduced motion, explanations | Implemented; guided tour remains optional |
| 8 — Release review | Physics checks, browser/device review, deployment | Physics tests run; device/browser and deployment checks remain to be performed |
| 9 — Steam property validation | IAPWS-IF97 Region 1/2/4 equations and published verification fixtures | Implemented for supported regions; Region 3 and whole-cycle validation remain open |

## Implementation changes

- Replaced the arbitrary turbine-drop correlation with an enthalpy-based isentropic expansion and an explicit turbine-efficiency step.
- Included approximate liquid-pump work, net shaft work, generator conversion, thermal efficiency, and a balanced heat-rejection term.
- Reduced the supported pressure slider maximum to 20 MPa so the model stays below the critical-point region represented poorly by its compact table.
- Made quality undefined for superheated exhaust and explain this state in the interface.
- Updated live T–s exhaust coordinates and made P–v state locations follow the model's specific-volume estimates.
- Added classroom documentation for formulas, assumptions, definitions, Q&A, sources, and verification boundaries.
- Implemented IAPWS-IF97 Regions 1/2 Gibbs property calculations and Region 4 saturation equations; supported steam results identify their method, while dense-fluid Region 3 cases use an explicitly identified approximate fallback.

## Verification completed

- `node --test tests/physics.test.mjs` — 10 tests passed.
- Tests cover finite and balanced outputs across input-range corners, mass-flow scaling, expected pressure/temperature/condenser trends, wet-steam warning threshold, superheated-exhaust quality behavior, saturation interpolation, and preset bounds.
- `node --test tests/if97.test.mjs` — official Region 1, Region 2, and Region 4 verification points pass at documented numeric tolerances.

## Remaining review

- Check the page at 375 px, tablet width, and desktop width, including touch interaction and the light theme.
- Add IAPWS-IF97 Region 3 and compare complete cycle outputs against an independent model before making any plant-level accuracy claim.
- Inspect browser console and loading behavior on the actual exhibition device.

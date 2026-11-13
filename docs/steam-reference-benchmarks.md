# Steam reference benchmarks

These fixtures compare the local Region 1, Region 2, and saturation equations against the official IAPWS-IF97 computer-program verification values. They test the property calculations at individual thermodynamic states, not an entire plant's predicted output.

## Reference fixtures

| Check | Reference point | Expected properties | Absolute tolerance |
|---|---|---|---|
| Region 1, Table 5 | 3 MPa, 300 K | `h = 115.331273 kJ/kg`; `s = 0.392294792 kJ/(kg K)`; `v = 0.00100215168 m³/kg` | 1e-6 kJ/kg; 1e-9 kJ/(kg K); 1e-11 m³/kg |
| Region 1, Table 5 | 3 MPa, 500 K | `h = 975.542239 kJ/kg`; `s = 2.58041912 kJ/(kg K)` | 1e-6 kJ/kg; 1e-8 kJ/(kg K) |
| Region 2, Table 15 | 0.0035 MPa, 700 K | `h = 3335.68375 kJ/kg`; `s = 10.1749996 kJ/(kg K)`; `v = 92.3015898 m³/kg` | 1e-5 kJ/kg; 1e-7 kJ/(kg K); 1e-7 m³/kg |
| Region 2, Table 15 | 30 MPa, 700 K | `h = 2631.49474 kJ/kg`; `s = 5.17540298 kJ/(kg K)`; `v = 0.00542946619 m³/kg` | 1e-5 kJ/kg; 1e-8 kJ/(kg K); 1e-10 m³/kg |
| Saturation, Table 36 | 0.1, 1, and 10 MPa | `T = 372.755919, 453.035632, 584.149488 K` | 1e-6 K |
| Saturation, Table 35 | 300, 500, and 600 K | `p = 0.00353658941, 2.63889776, 12.3443146 MPa` | 2e-8 MPa |

Inputs, values, tolerances and test code are in [`tests/fixtures/if97-verification.json`](../tests/fixtures/if97-verification.json) and [`tests/if97.test.mjs`](../tests/if97.test.mjs). The tolerances account for the reference tables' printed digits and floating-point arithmetic; they are not property-model uncertainty estimates.

## Scope and limitations

- Region 1 and 2 checks validate the implemented Gibbs equations for those published states.
- Region 4 checks validate saturation pressure and temperature. Saturated liquid and vapor properties in the supported subcritical range are evaluated by Regions 1 and 2 at the saturation state.
- The simulator's steam pressure controls extend to 20 MPa. The complete cycle conservatively switches to its approximation path above 16.5292 MPa because high-side saturation can require Region 3. This pressure-based switch also applies to some high-temperature inlet points where Region 2 could evaluate the inlet alone.
- The fixtures do not validate the complete Rankine cycle, its fixed turbine/generator efficiencies, plant losses, schematic diagrams, or any Region 3 fallback result.

Source: [IAPWS R7-97(2012), Revised Release on the IAPWS Industrial Formulation 1997](https://www.iapws.org/relguide/IF97-Rev.pdf), Tables 5, 15, 35 and 36. IAPWS describes IF97 as an industrial formulation based on separate equations for the thermodynamic regions; the [official release page](https://iapws.org/technical-guidance/release/IF97-Rev) links the current release materials.

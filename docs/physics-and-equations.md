# Physics and equations

## The simple Rankine cycle

The model follows four main states: saturated liquid leaving the condenser (3), pressurized liquid leaving the pump (4), steam entering the turbine (1), and expanded steam leaving the turbine (2). The loop is 3 → 4 → 1 → 2 → 3.

## Symbols and units

| Symbol | Meaning | Units |
|---|---|---|
| `ṁ` | Steam mass flow | kg/s |
| `h` | Specific enthalpy | kJ/kg |
| `s` | Specific entropy | kJ/(kg·K) |
| `P` | Pressure | MPa internally; condenser input in kPa |
| `T` | Temperature | K in property equations; °C in controls |
| `x` | Vapor mass fraction in a two-phase mixture | 0–1 |
| `ηt` | Turbine isentropic efficiency | fraction |
| `ηg` | Generator efficiency | fixed at 0.98 |
| `Q̇`, `Ẇ` | Heat and work rates | MW in results |

Multiplying kg/s by kJ/kg yields kW; results are divided by 1,000 for MW.

## Steam-property method

The browser implementation evaluates the official IAPWS-IF97 dimensionless Gibbs equations for Region 1 (compressed liquid) and Region 2 (superheated vapor), plus the Region 4 saturation curve. The property equations derive enthalpy, entropy and specific volume from the Gibbs function and its derivatives. Saturated liquid and vapor states below the Region 2/3 boundary use Region 1 and Region 2 at the saturation pressure and temperature.

The standard Region 2/3 boundary is about 16.5292 MPa at 623.15 K and curves upward with temperature. This release does not implement Region 3's dense-fluid Helmholtz equation or high-side saturation properties above that boundary. For a conservative boundary, the complete cycle switches to its previous approximate path whenever boiler pressure exceeds 16.5292 MPa, including some hot inlet states that could individually be evaluated with Region 2. The result label discloses this pressure-based fallback.

At the inlet, if the selected temperature is below saturation, the state is treated as saturated vapor at that pressure and the UI warns that it substituted the effective saturation temperature. This preserves the simulator's existing behavior; it is not subcooled-liquid modeling.

## Cycle calculation

At condenser pressure, saturated liquid and vapor provide `hf`, `hg`, `sf`, `sg`, `vf`, and `vg`. If the isentropic outlet entropy is inside the saturation dome:

```text
x2s = (s1 − sf) / (sg − sf)
h2s = hf + x2s × (hg − hf)
```

Above the saturated-vapor line, the isentropic outlet is solved in Region 2 at condenser pressure. Turbine efficiency sets the actual enthalpy drop:

```text
ηt = (h1 − h2) / (h1 − h2s)
h2 = h1 − ηt × (h1 − h2s)
```

For an actual outlet inside the dome, `x2 = (h2 − hf)/(hg − hf)`. Quality is undefined for superheated steam and the interface reports it as **DRY / SUPERHEATED**.

Pump work uses saturated-liquid volume from Region 1 when available:

```text
wp ≈ vf × (Pboiler − Pcondenser)
Wt = ṁ × (h1 − h2)
Wp = ṁ × wp
Qin = ṁ × (h1 − hf − wp)
Wnet = Wt − Wp
Pelectric = 0.98 × Wnet
ηcycle = Wnet / Qin
Qout = Qin − Wnet
```

The model's reporting boundary is `Qin = Wnet + Qout`; generator conversion is a nested split of net shaft work into electric output and generator loss. The full-cycle pump correction is included in `Wnet` and in the heat-input state. As before, turbine efficiency, generator efficiency and the idealized plant boundary are user-facing assumptions, not detailed equipment models.

## What is not modeled

The cycle omits Region 3 properties, reheat, staged turbines, pressure drops, detailed boiler/condenser heat transfer, moisture separation, control systems and equipment-specific performance maps. The 98% generator efficiency is fixed. RPM is a visual mapping from output, not a machine-speed calculation. T–s and P–v graphics are explanatory diagrams; the saturation dome uses IF97 data only where implemented.

## Verification

The Region 1, Region 2 and Region 4 equations are checked against the official IAPWS computer-program verification tables. Exact points, numeric tolerances and boundaries are listed in [steam reference benchmarks](steam-reference-benchmarks.md). These equation checks do not validate the whole Rankine plant model, the Region 3 fallback, or equipment assumptions.

Primary references: [official IAPWS-IF97 release](https://iapws.org/technical-guidance/release/IF97-Rev) and [NIST thermodynamic properties of water based on IAPWS-95](https://www.nist.gov/publications/thermodynamic-properties-water-tabulation-iapws-formulation-1995-thermodynamic).

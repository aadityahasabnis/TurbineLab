# Physics and equations

## The simple Rankine cycle

The model describes four main states:

1. **Condenser outlet (state 3):** saturated liquid at condenser pressure.
2. **Pump outlet (state 4):** liquid raised to boiler pressure.
3. **Turbine inlet (state 1):** steam at the selected boiler pressure and temperature.
4. **Turbine outlet (state 2):** steam after expansion to condenser pressure.

The order around the closed loop is 3 → 4 → 1 → 2 → 3. The boiler adds heat, the turbine produces shaft work, the condenser rejects heat, and the pump returns the liquid to high pressure.

## Symbols and units

| Symbol | Meaning | Units in the model |
|---|---|---|
| `ṁ` | steam mass flow rate | kg/s |
| `h` | specific enthalpy | kJ/kg |
| `s` | specific entropy | kJ/(kg·K) |
| `P` | pressure | MPa internally; kPa for condenser input |
| `T` | temperature | °C for display, K in logarithms |
| `x` | vapor mass fraction (steam quality) | 0–1 |
| `ηt` | turbine isentropic efficiency | fraction |
| `ηg` | generator efficiency | fraction (fixed at 0.98) |
| `Q̇`, `Ẇ` | heat/work rate | kW in intermediate calculations, MW in display |

Because `1 kJ/s = 1 kW`, multiplying kg/s by kJ/kg gives kW.

## Calculation chain

### 1. Turbine inlet

Saturated liquid/vapor properties are interpolated from a small pressure table. For superheat, the learning model estimates:

```text
h1 = hg(Pboiler) + cp(Pboiler) × max(0, Tinput − Tsat(Pboiler))
s1 = sg(Pboiler) + cp(Pboiler) × ln(T1 / Tsat,K)
cp(P) = 2.08 + 0.16 × P(MPa) kJ/(kg·K)
```

If the selected temperature is below saturation, the inlet is treated as saturated vapor at the saturation temperature. The interface shows a warning so the effective state is explicit.

### 2. Ideal expansion and real turbine outlet

The ideal reference expansion is isentropic, so `s2s = s1`. At condenser pressure, if the ideal outlet lies in the two-phase region:

```text
x2s = (s1 − sf,cond) / sfg,cond
h2s = hf,cond + x2s × hfg,cond
```

If the ideal outlet is above the saturated-vapor line, a simplified superheat relation is used. Turbine efficiency then sets the actual enthalpy drop:

```text
ηt = (h1 − h2) / (h1 − h2s)
h2 = h1 − ηt × (h1 − h2s)
```

For an actual outlet inside the saturation dome, quality is:

```text
x2 = (h2 − hf,cond) / hfg,cond
```

Quality exists only for a saturated liquid–vapor mixture. Superheated exhaust is reported as **DRY / SUPERHEATED**, with no numeric quality.

### 3. Pump, heat, and power

Liquid pump work is estimated using nearly incompressible water:

```text
wp ≈ vwater × (Pboiler − Pcondenser)
vwater ≈ 0.001 m³/kg
```

With pressure in kPa, `wp` is in kJ/kg. The rates are:

```text
Ẇturbine = ṁ × (h1 − h2)
Ẇpump = ṁ × wp
Ẇnet = Ẇturbine − Ẇpump
Q̇in = ṁ × (h1 − h4), where h4 ≈ hf,cond + wp
Ṗelectric = ηg × Ẇnet
ηcycle = Ẇnet / Q̇in
```

The condenser rejection follows the cycle first law:

```text
Q̇out = Q̇in − Ẇnet
Q̇in + Ẇpump = Ẇturbine + Q̇out
```

The Sankey begins at boiler heat input and divides it into **net shaft work** and condenser heat rejection. Net shaft work then divides into electricity and generator loss. These are nested boundaries: do not add generator loss a second time to the heat-input split.

### 4. Turbine animation

The displayed RPM is an illustrative mapping of electrical output to a 0–3600 RPM range. Real turbine speed is determined by machine design, pole count, grid frequency, and control systems; this display is not a mechanical prediction.

## Physics source and reference

Steam properties in engineering calculations are normally calculated with an equation of state such as IAPWS-IF97, which supplies region-specific thermodynamic relations for water and steam. Energy Lab currently uses rounded saturation data plus simplified superheat and pump approximations so the calculations stay inspectable in a small client-side project.

- [IAPWS-IF97 revised release (official)](https://iapws.org/technical-guidance/release/IF97-Rev)
- [NIST tabulation of water properties based on IAPWS-95](https://www.nist.gov/publications/thermodynamic-properties-water-tabulation-iapws-formulation-1995-thermodynamic)
- [NIST steam tables PDF](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=906704)

The references establish the accepted property framework. Energy Lab’s compact table and correlations are rounded teaching data, not a claim of exact IAPWS evaluation; see [model limits](model-limitations.md) and the [accuracy roadmap](roadmap.md).

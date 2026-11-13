# What changed? — definitions and Q&A

## What changes when I move a control?

Energy Lab recomputes the model from one shared input state. The results then update the dashboard, turbine animation, efficiency curve, cycle plot, energy-flow diagram, status message, and shareable URL.

The “What changed?” sentence describes the current operating point. To study cause and effect, pin a setup with **Compare**, move one control, then compare the result and the chart marker.

## Definitions

- **Boiler pressure:** high-side pressure where the water is heated into steam.
- **Condenser pressure:** low-side pressure at the turbine exhaust and condenser. Lower pressure can allow a larger expansion.
- **Saturation temperature:** boiling/condensing temperature at a given pressure.
- **Superheat:** temperature above saturation at the same pressure.
- **Mass flow rate (`ṁ`):** mass passing through the turbine each second.
- **Enthalpy (`h`):** energy per unit mass used to track heat transfer and work in a flowing fluid.
- **Entropy (`s`):** a thermodynamic property used to define the ideal, isentropic expansion reference.
- **Isentropic expansion:** idealized turbine expansion with constant entropy.
- **Turbine efficiency:** actual turbine enthalpy drop divided by the ideal isentropic enthalpy drop.
- **Steam quality (`x`):** vapor mass fraction in a saturated liquid–vapor mixture. `x = 0` is saturated liquid and `x = 1` is saturated vapor.
- **Wet steam:** a two-phase mixture with liquid droplets; lower quality means more moisture.
- **Net shaft work:** turbine work after subtracting pump work.
- **Thermal efficiency:** net cycle work divided by heat supplied to the working fluid.
- **Generator efficiency:** fraction of shaft work converted to electrical output.
- **MW:** megawatt, one million joules per second.
- **Sankey diagram:** flow widths visualize how energy is divided at stated system boundaries.

## Questions students often ask

### Why does raising pressure not always raise power?

Power depends on both the energy drop per kilogram and the amount of steam flowing. Higher pressure can change the inlet state and reduce exhaust quality. The model's compact property approximations also mean its exact curve should be treated as educational, not universal.

### Why can the turbine show “DRY” instead of 100% quality?

Quality is defined only inside the liquid–vapor mixture region. Superheated vapor is outside that region, so assigning it a quality number would be misleading.

### Why is the exit quality warning important?

Low quality indicates a larger liquid fraction in the exhaust. Droplets can erode turbine blades in real machines. Energy Lab's 85% warning is a classroom threshold, not an operating alarm or universal design limit.

### Why is electric output lower than turbine work?

The cycle first subtracts pump work to find net shaft work. The generator then converts 98% of net shaft work to electricity in this model; the remaining 2% is shown as generator loss.

### Why does mass flow raise power but leave efficiency almost unchanged?

For the same thermodynamic states, heat and work rates both scale with mass flow. Their ratio, efficiency, stays approximately constant.

### What does the T–s diagram show?

It plots temperature against entropy. The inlet and exhaust markers respond to the calculated states. The saturation dome is schematic, so it helps explain the regions but should not be read as precise property data.

### How should I make a fair comparison?

Pin a setup, change one input at a time, note the outputs, and reset before testing another variable. Compare both electric output and efficiency, and watch the exit moisture trade-off.

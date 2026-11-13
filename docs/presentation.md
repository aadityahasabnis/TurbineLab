# Energy Lab — presentation run-of-show

## The promise

In three minutes, show that a steam power plant is an energy-conversion loop—and that a change that helps one output can create a different trade-off elsewhere.

### Learning outcomes

By the end, the audience can:

1. Name the boiler, turbine, generator, condenser, and pump in the cycle.
2. Explain why more steam flow generally raises power while leaving cycle efficiency similar at fixed states.
3. Explain why pressure, temperature, and exhaust moisture must be considered together.
4. Tell a model estimate from a real plant prediction.

## Three-minute live demo

| Time | Show | Say / ask |
|---|---|---|
| 0:00–0:25 | Start on the simulator with the default plant. Point to the single loop and the live outputs. | “This is a simplified Rankine-cycle learning model. We’ll change one condition and follow the energy—not just watch a number.” |
| 0:25–0:55 | Point to boiler, turbine, generator, condenser, and pump; follow one circuit. | “The pump pressurizes liquid, the boiler adds heat, steam expands through the turbine, and the condenser closes the loop.” |
| 0:55–1:35 | Pin the baseline. Move mass flow upward, then return to baseline. | “What changed more: megawatts or efficiency? Why should both heat and work rates scale with flow?” |
| 1:35–2:15 | Increase boiler pressure in small steps and watch power, the curve, quality, and warning. | “The output is a trade-off. What rises? What flattens? When does the exhaust become wetter?” |
| 2:15–2:40 | Point to Sankey and distinguish turbine work, electricity, and rejected heat. | “Follow the boundary: heat supplied is divided into net cycle work and rejected heat. Generator loss is a second, nested split.” |
| 2:40–3:00 | Open the field guide and finish on the model note. | “These trends teach the cycle. This version is not a plant-design or safety calculator; our next milestone is testing properties against published references.” |

## Suggested slide sequence

1. **The question:** Where does a power plant's input heat go?
2. **The loop:** Pump → boiler → turbine/generator → condenser.
3. **One live experiment:** Change one input; record power, efficiency, and exhaust state.
4. **The accounting:** Explain the Sankey boundary and generator conversion.
5. **The evidence:** Show assumptions today and the IAPWS reference-validation plan next.
6. **Audience challenge:** Find a higher-output setup without ignoring efficiency or exhaust moisture.

## Presenter checklist

- Load the simulator before presenting; confirm the correct theme and width.
- Reset to defaults. Use **Compare** to pin the starting condition.
- Change only one control at a time; pause so the audience can read the animated values.
- Avoid promising that high pressure is always better or that a red quality state is a real-world alarm.
- Say “the model estimates,” “in this simplified cycle,” and “within these assumptions.”
- Keep the [field guide](index.html), [steam facts](quick-facts.html), and [model limits](model-limitations.md) ready.
- If asked for an exact plant answer, explain what data and validation would be needed rather than extrapolating the classroom model.

## Discussion prompts

- Why can doubling flow raise power without doubling efficiency?
- Which Sankey band is a useful output, and which one is a loss?
- What other component changes could dry turbine exhaust?
- If condenser heat were useful to a nearby building, would the plant's “waste” boundary change?
- What is the difference between a plausible trend and a validated number?

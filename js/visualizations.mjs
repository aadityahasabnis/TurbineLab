function themeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function chartFrame(width, height, xLabel, yLabel) {
  const grid = themeColor("--chart-grid");
  const faint = themeColor("--text-faint");
  const lines = Array.from({ length: 4 }, (_, index) => {
    const y = 24 + index * 36;
    return `<line x1="42" y1="${y}" x2="${width - 10}" y2="${y}" stroke="${grid}" stroke-dasharray="3 5"/>`;
  }).join("");
  return `<g>${lines}<path d="M42 20V132H${width - 10}" fill="none" stroke="${grid}"/><text x="${width / 2}" y="${height - 5}" text-anchor="middle" fill="${faint}" font-size="9">${xLabel}</text><text x="12" y="78" text-anchor="middle" transform="rotate(-90 12 78)" fill="${faint}" font-size="9">${yLabel}</text></g>`;
}

export function renderEfficiencyChart(svg, inputs, results, compareInputs, computeAll) {
  const width = 360;
  const height = 170;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const cyan = themeColor("--cyan");
  const amber = themeColor("--amber");
  const faint = themeColor("--text-faint");
  const pressures = Array.from({ length: 25 }, (_, index) => 1 + index);
  const samples = pressures.map((pressure) => computeAll({ ...inputs, pressureMPa: pressure }));
  const values = samples.map((sample) => sample.efficiency * 100);
  const min = Math.max(0, Math.floor(Math.min(...values) / 5) * 5 - 2);
  const max = Math.min(60, Math.ceil(Math.max(...values) / 5) * 5 + 2);
  const x = (pressure) => 42 + ((pressure - 1) / 24) * (width - 56);
  const y = (efficiency) => 132 - ((efficiency - min) / Math.max(1, max - min)) * 112;
  const path = pressures.map((pressure, index) => `${index ? "L" : "M"}${x(pressure).toFixed(1)},${y(values[index]).toFixed(1)}`).join(" ");
  const currentX = x(inputs.pressureMPa);
  const currentY = y(results.efficiency * 100);
  let ghost = "";
  if (compareInputs) {
    const compareResult = computeAll(compareInputs);
    ghost = `<circle cx="${x(compareInputs.pressureMPa)}" cy="${y(compareResult.efficiency * 100)}" r="5" fill="${amber}" stroke="${themeColor("--surface")}" stroke-width="2"/><text x="${x(compareInputs.pressureMPa) + 8}" y="${y(compareResult.efficiency * 100) - 8}" fill="${amber}" font-size="8">PIN</text>`;
  }
  const ticks = [1, 5, 10, 15, 20, 25].map((pressure) => `<text x="${x(pressure)}" y="148" text-anchor="middle" fill="${faint}" font-size="8">${pressure}</text>`).join("");
  svg.innerHTML = `${chartFrame(width, height, "BOILER PRESSURE (MPa)", "EFFICIENCY (%)")}<path d="${path}" fill="none" stroke="${cyan}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="${currentX}" y1="${currentY}" x2="${currentX}" y2="132" stroke="${cyan}" stroke-dasharray="2 4" opacity=".6"/><circle cx="${currentX}" cy="${currentY}" r="6" fill="${cyan}" stroke="${themeColor("--surface")}" stroke-width="3"/><text x="${Math.min(width - 43, currentX + 9)}" y="${currentY - 8}" fill="${cyan}" font-size="9" font-weight="700">${(results.efficiency * 100).toFixed(1)}%</text>${ghost}${ticks}<text x="30" y="135" text-anchor="end" fill="${faint}" font-size="7">${min}</text><text x="30" y="25" text-anchor="end" fill="${faint}" font-size="7">${max}</text>`;
}

function renderTs(svg, inputs, results) {
  const cyan = themeColor("--cyan");
  const amber = themeColor("--amber");
  const faint = themeColor("--text-faint");
  const grid = themeColor("--chart-grid");
  const x = (entropy) => 43 + (entropy / 9) * 296;
  const y = (temperature) => 176 - (temperature / 650) * 150;
  const dome = `M${x(0.5)} ${y(35)} C${x(1.2)} ${y(190)} ${x(2.6)} ${y(370)} ${x(4.4)} ${y(374)} C${x(6.7)} ${y(365)} ${x(8.7)} ${y(170)} ${x(8.9)} ${y(35)}`;
  const exitEntropy = Math.max(0.1, results.s1 - (inputs.pressureMPa * 0.045));
  const inletX = x(results.s1);
  const inletY = y(results.inletTempC);
  const exitX = x(exitEntropy);
  const exitY = y(35 + inputs.condenserKPa * 1.8);
  svg.innerHTML = `<g stroke="${grid}" stroke-dasharray="3 5"><line x1="43" y1="26" x2="43" y2="176"/><line x1="43" y1="176" x2="339" y2="176"/><line x1="43" y1="126" x2="339" y2="126"/><line x1="43" y1="76" x2="339" y2="76"/></g><path d="${dome}" fill="${cyan}" fill-opacity=".08" stroke="${cyan}" stroke-opacity=".5" stroke-width="1.5"/><path d="M${inletX} ${inletY} Q${(inletX + exitX) / 2 + 22} ${(inletY + exitY) / 2} ${exitX} ${exitY}" fill="none" stroke="${amber}" stroke-width="2" stroke-dasharray="4 4"/><circle cx="${inletX}" cy="${inletY}" r="5" fill="${cyan}" stroke="${themeColor("--surface")}" stroke-width="2"/><circle cx="${exitX}" cy="${exitY}" r="5" fill="${amber}" stroke="${themeColor("--surface")}" stroke-width="2"/><text x="51" y="39" fill="${faint}" font-size="8">SUPERHEAT</text><text x="188" y="194" text-anchor="middle" fill="${faint}" font-size="9">ENTROPY  s (kJ/kg·K)</text><text x="13" y="102" text-anchor="middle" transform="rotate(-90 13 102)" fill="${faint}" font-size="9">TEMP  T (°C)</text><text x="${Math.min(298, inletX + 7)}" y="${Math.max(33, inletY - 7)}" fill="${cyan}" font-size="8">INLET</text><text x="${Math.min(302, exitX + 7)}" y="${exitY + 13}" fill="${amber}" font-size="8">EXIT</text>`;
}

function renderPv(svg, inputs, results) {
  const cyan = themeColor("--cyan");
  const amber = themeColor("--amber");
  const faint = themeColor("--text-faint");
  const grid = themeColor("--chart-grid");
  const pressureY = (pressure) => 176 - (Math.log(pressure + 1) / Math.log(26)) * 150;
  const inletVolume = Math.max(0.01, 0.001 + 0.4615 * (results.inletTempC + 273.15) / (inputs.pressureMPa * 1000));
  const points = [
    [61, pressureY(inputs.pressureMPa)],
    [156, pressureY(inputs.pressureMPa * 0.8)],
    [304, pressureY(inputs.condenserKPa / 1000)],
    [80, pressureY(inputs.condenserKPa / 1000)]
  ];
  svg.innerHTML = `<g stroke="${grid}" stroke-dasharray="3 5"><line x1="43" y1="26" x2="43" y2="176"/><line x1="43" y1="176" x2="339" y2="176"/><line x1="43" y1="126" x2="339" y2="126"/><line x1="43" y1="76" x2="339" y2="76"/></g><path d="M${points.map(([px, py]) => `${px} ${py}`).join(" L")} Z" fill="${cyan}" fill-opacity=".07" stroke="${amber}" stroke-width="2"/><circle cx="${points[0][0]}" cy="${points[0][1]}" r="5" fill="${cyan}"/><circle cx="${points[2][0]}" cy="${points[2][1]}" r="5" fill="${amber}"/><text x="190" y="194" text-anchor="middle" fill="${faint}" font-size="9">SPECIFIC VOLUME  v (m³/kg)</text><text x="13" y="102" text-anchor="middle" transform="rotate(-90 13 102)" fill="${faint}" font-size="9">PRESSURE  P (MPa)</text><text x="50" y="40" fill="${faint}" font-size="8">BOILER</text><text x="256" y="166" fill="${faint}" font-size="8">CONDENSER</text><text x="52" y="56" fill="${cyan}" font-size="7">${inletVolume.toFixed(2)} m³/kg</text><text x="236" y="61" fill="${amber}" font-size="7">x = ${(results.exitQuality * 100).toFixed(0)}%</text><text x="47" y="130" fill="${faint}" font-size="7">Liquid</text><text x="278" y="37" fill="${faint}" font-size="7">Vapor</text>`;
}

export function renderCycleChart(svg, inputs, results, mode, computeAll, compareInputs) {
  svg.setAttribute("viewBox", "0 0 360 210");
  if (mode === "pv") renderPv(svg, inputs, results);
  else if (mode === "efficiency") renderEfficiencyChart(svg, inputs, results, compareInputs, computeAll);
  else renderTs(svg, inputs, results);
}

function formatMW(value) {
  return `${value.toFixed(1)} MW`;
}

export function renderSankey(svg, results, isMobile = false) {
  const workRatio = results.heatInMW ? results.workMW / results.heatInMW : 0;
  const wasteRatio = Math.max(0, 1 - workRatio);
  const electricityRatio = results.heatInMW ? results.powerMW / results.heatInMW : 0;
  const lossRatio = Math.max(0, workRatio - electricityRatio);
  const workMW = results.workMW;
  const wasteMW = results.wasteMW;
  const powerMW = results.powerMW;
  const genLossMW = results.generatorLossMW;

  if (isMobile) {
    const sourceWidth = 34;
    const workWidth = Math.max(3, sourceWidth * workRatio);
    const wasteWidth = Math.max(3, sourceWidth * wasteRatio);
    const electricityWidth = Math.max(2, sourceWidth * electricityRatio);
    const lossWidth = Math.max(2, sourceWidth * lossRatio);
    svg.setAttribute("viewBox", "0 0 360 490");
    svg.innerHTML = `<g class="sankey-item" data-kind="heat"><path class="sankey-flow" d="M180 63V139" stroke="${themeColor("--amber")}" stroke-width="${sourceWidth}"/><text class="sankey-label" x="180" y="35" text-anchor="middle">HEAT INPUT</text><text class="sankey-value" x="180" y="52" text-anchor="middle">${formatMW(results.heatInMW)} · 100%</text></g><g class="sankey-item" data-kind="work"><path class="sankey-flow" d="M180 139 C180 180 95 180 95 227V295" stroke="${themeColor("--cyan")}" stroke-width="${workWidth}"/><text class="sankey-label" x="80" y="320" text-anchor="middle">TURBINE WORK</text><text class="sankey-value" x="80" y="337" text-anchor="middle">${formatMW(workMW)} · ${(workRatio * 100).toFixed(1)}%</text></g><g class="sankey-item" data-kind="waste"><path class="sankey-flow" d="M180 139 C180 180 265 180 265 227V295" stroke="${themeColor("--text-faint")}" stroke-width="${wasteWidth}"/><text class="sankey-label" x="274" y="320" text-anchor="middle">WASTE HEAT</text><text class="sankey-value" x="274" y="337" text-anchor="middle">${formatMW(wasteMW)} · ${(wasteRatio * 100).toFixed(1)}%</text></g><g class="sankey-item" data-kind="electricity"><path class="sankey-flow" d="M95 295 C95 350 115 350 115 407" stroke="${themeColor("--cyan")}" stroke-width="${electricityWidth}"/><text class="sankey-label" x="93" y="435" text-anchor="middle">ELECTRICITY</text><text class="sankey-value" x="93" y="452" text-anchor="middle">${formatMW(powerMW)} · ${(electricityRatio * 100).toFixed(1)}%</text></g><g class="sankey-item" data-kind="loss"><path class="sankey-flow" d="M95 295 C95 350 245 350 245 407" stroke="${themeColor("--amber")}" stroke-width="${lossWidth}"/><text class="sankey-label" x="245" y="435" text-anchor="middle">GEN. LOSS</text><text class="sankey-value" x="245" y="452" text-anchor="middle">${formatMW(genLossMW)} · ${(lossRatio * 100).toFixed(1)}%</text></g>`;
  } else {
    const sourceWidth = 72;
    const workWidth = Math.max(3, sourceWidth * workRatio);
    const wasteWidth = Math.max(3, sourceWidth * wasteRatio);
    const electricityWidth = Math.max(2, sourceWidth * electricityRatio);
    const lossWidth = Math.max(2, sourceWidth * lossRatio);
    svg.setAttribute("viewBox", "0 0 760 220");
    svg.innerHTML = `<g class="sankey-item" data-kind="heat"><path class="sankey-flow" d="M140 112 C225 112 248 112 320 112" stroke="${themeColor("--amber")}" stroke-width="${sourceWidth}"/><text class="sankey-label" x="142" y="54">HEAT INPUT</text><text class="sankey-value" x="142" y="70">${formatMW(results.heatInMW)} · 100%</text></g><g class="sankey-item" data-kind="work"><path class="sankey-flow" d="M320 112 C392 112 397 66 492 66" stroke="${themeColor("--cyan")}" stroke-width="${workWidth}"/><text class="sankey-label" x="405" y="36">TURBINE WORK</text><text class="sankey-value" x="405" y="51">${formatMW(workMW)} · ${(workRatio * 100).toFixed(1)}%</text></g><g class="sankey-item" data-kind="waste"><path class="sankey-flow" d="M320 112 C392 112 397 164 492 164" stroke="${themeColor("--text-faint")}" stroke-width="${wasteWidth}"/><text class="sankey-label" x="405" y="195">WASTE HEAT</text><text class="sankey-value" x="405" y="209">${formatMW(wasteMW)} · ${(wasteRatio * 100).toFixed(1)}%</text></g><g class="sankey-item" data-kind="electricity"><path class="sankey-flow" d="M492 66 C570 66 592 66 665 66" stroke="${themeColor("--cyan")}" stroke-width="${electricityWidth}"/><text class="sankey-label" x="576" y="35">ELECTRICITY</text><text class="sankey-value" x="576" y="50">${formatMW(powerMW)} · ${(electricityRatio * 100).toFixed(1)}%</text></g><g class="sankey-item" data-kind="loss"><path class="sankey-flow" d="M492 66 C572 66 592 136 665 136" stroke="${themeColor("--amber")}" stroke-width="${lossWidth}"/><text class="sankey-label" x="576" y="178">GEN. LOSS</text><text class="sankey-value" x="576" y="193">${formatMW(genLossMW)} · ${(lossRatio * 100).toFixed(1)}%</text></g><circle class="sankey-node" cx="320" cy="112" r="5"/><circle class="sankey-node" cx="492" cy="66" r="5"/></g>`;
  }
}

export function updateSankeyTooltip(tooltip, kind, results) {
  const work = results.heatInMW ? results.workMW / results.heatInMW * 100 : 0;
  const waste = Math.max(0, 100 - work);
  const descriptions = {
    heat: `Heat input: ${formatMW(results.heatInMW)} is the 100% energy budget.`,
    work: `Turbine work: ${formatMW(results.workMW)} (${work.toFixed(1)}% of heat input).`,
    waste: `Rejected heat: ${formatMW(results.wasteMW)} (${waste.toFixed(1)}% of heat input).`,
    electricity: `Useful electricity: ${formatMW(results.powerMW)} after generator conversion.`,
    loss: `Generator loss: ${formatMW(results.generatorLossMW)} becomes heat in the generator.`
  };
  tooltip.textContent = descriptions[kind] ?? descriptions.heat;
}

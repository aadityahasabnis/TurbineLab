export function bindEvents({
  state, dom, defaults, presets, setInputValues, render, shareSetup, toggleTheme,
  selectChart, updateSankeyTooltip
}) {
  let renderScheduled = false;
  for (const [key, input] of Object.entries(dom)) {
    input.addEventListener("input", () => {
      state.inputs[key] = Number(input.value);
      state.ui.activePreset = null;
      if (!renderScheduled) {
        renderScheduled = true;
        requestAnimationFrame(() => { renderScheduled = false; render(state); });
      }
    });
  }

  document.querySelector("#reset-button").addEventListener("click", () => {
    setInputValues(defaults);
    render(state);
  });
  document.querySelector("#randomize-button").addEventListener("click", () => {
    setInputValues({
      pressureMPa: Math.round((2 + Math.random() * 18) * 2) / 2,
      tempC: Math.round((220 + Math.random() * 360) / 10) * 10,
      flowKgS: Math.round(10 + Math.random() * 80),
      turbineEff: Math.round(60 + Math.random() * 32),
      condenserKPa: Math.round(6 + Math.random() * 13)
    });
    render(state);
  });
  document.querySelectorAll(".quick-set").forEach((button) => button.addEventListener("click", () => {
    setInputValues({ ...state.inputs, [button.dataset.input]: Number(button.dataset.value) });
    render(state);
  }));
  document.querySelectorAll(".sim-grid .preset-card").forEach((button) => button.addEventListener("click", () => {
    setInputValues(presets[button.dataset.preset]);
    state.ui.activePreset = button.dataset.preset;
    render(state);
  }));
  document.querySelector("#theme-toggle").addEventListener("click", toggleTheme);
  document.querySelector("#share-button").addEventListener("click", shareSetup);
  document.querySelector("#footer-share").addEventListener("click", shareSetup);
  document.querySelector("#compare-button").addEventListener("click", () => {
    state.ui.compare = state.ui.compare ? null : { ...state.inputs };
    render(state);
  });
  document.querySelectorAll(".chart-tab").forEach((button) => {
    button.addEventListener("click", () => selectChart(button.dataset.chart));
  });

  let chartTouchStart = 0;
  const cycleChart = document.querySelector(".cycle-chart");
  cycleChart.addEventListener("touchstart", (event) => {
    chartTouchStart = event.changedTouches[0].clientX;
  }, { passive: true });
  cycleChart.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].clientX - chartTouchStart;
    if (Math.abs(distance) < 55) return;
    const charts = ["ts", "pv", "efficiency"];
    const currentIndex = charts.indexOf(state.ui.chart);
    const nextIndex = Math.min(charts.length - 1, Math.max(0, currentIndex + (distance < 0 ? 1 : -1)));
    if (nextIndex !== currentIndex) selectChart(charts[nextIndex]);
  }, { passive: true });

  document.querySelector("#sankey-chart").addEventListener("pointerover", (event) => {
    const flow = event.target.closest("[data-kind]");
    if (flow) {
      document.querySelectorAll(".sankey-flow").forEach((path) => path.classList.toggle("is-selected", path.parentElement === flow));
      updateSankeyTooltip(document.querySelector("#sankey-tooltip"), flow.dataset.kind, state.results);
    }
  });
  document.querySelector("#sankey-chart").addEventListener("click", (event) => {
    const flow = event.target.closest("[data-kind]");
    if (flow) updateSankeyTooltip(document.querySelector("#sankey-tooltip"), flow.dataset.kind, state.results);
  });
  window.addEventListener("resize", () => render(state));
}

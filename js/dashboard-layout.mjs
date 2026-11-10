const STORAGE_KEY = "TurbineLab-dashboard-layout-v4";
const PANELS = ["controls", "presets", "conversion", "performance", "thermodynamics", "energy", "science"];
const ZONES = ["left", "center", "right", "bottom"];
const DEFAULT_ZONE = Object.freeze({
  controls: "left",
  conversion: "center",
  presets: "left",
  performance: "right",
  thermodynamics: "right",
  energy: "bottom",
  science: "bottom"
});

function freshLayout() {
  return {
    order: [...PANELS],
    zones: { ...DEFAULT_ZONE },
    sizes: Object.fromEntries(PANELS.map((id) => [id, "regular"])),
    pinned: []
  };
}

function loadLayout() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return freshLayout();
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.order) || parsed.order.length !== PANELS.length
      || !PANELS.every((id) => parsed.order.includes(id))
      || !parsed.zones || !parsed.sizes || !Array.isArray(parsed.pinned)) {
      throw new Error("Saved dashboard layout does not match the current panels.");
    }
    const layout = freshLayout();
    layout.order = [...parsed.order];
    for (const id of PANELS) {
      if (ZONES.includes(parsed.zones[id])) layout.zones[id] = parsed.zones[id];
      if (["compact", "regular", "spacious"].includes(parsed.sizes[id])) layout.sizes[id] = parsed.sizes[id];
    }
    layout.pinned = parsed.pinned.filter((id) => PANELS.includes(id));
    return layout;
  } catch (error) {
    console.warn("Could not restore the saved dashboard layout; using the default layout.", error);
    return freshLayout();
  }
}

function currentProfile() {
  if (matchMedia("(max-width: 639px)").matches) return "mobile";
  if (matchMedia("(max-width: 1024px)").matches) return "tablet";
  return "desktop";
}

function isNarrowTablet() {
  return matchMedia("(min-width: 640px) and (max-width: 900px)").matches;
}

export function initializeDashboardLayout() {
  const grid = document.querySelector(".sim-grid");
  const panels = new Map([...grid.querySelectorAll("[data-layout-panel]")].map((panel) => [panel.dataset.layoutPanel, panel]));
  const workspace = document.createElement("section");
  workspace.className = "dashboard-workspace";
  workspace.setAttribute("aria-label", "Plant visualizations");
  grid.append(workspace);
  const zones = Object.fromEntries(ZONES.map((id) => {
    const zone = document.createElement("section");
    zone.className = "dashboard-zone";
    zone.dataset.dashboardZone = id;
    zone.setAttribute("aria-label", {
      left: "Plant inputs",
      center: "Turbine and live output",
      right: "Performance and cycle diagrams",
      bottom: "Energy balance and learning"
    }[id]);
    (id === "left" || id === "bottom" ? grid : workspace).append(zone);
    return [id, zone];
  }));
  const toggle = document.querySelector("#layout-toggle");
  const toolbar = document.querySelector("#layout-toolbar");
  const panelSelect = document.querySelector("#layout-panel-select");
  const layout = loadLayout();
  let profile = currentProfile();
  let narrowTablet = isNarrowTablet();

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }

  function render() {
    profile = currentProfile();
    narrowTablet = isNarrowTablet();
    const mobile = profile === "mobile";
    const tablet = profile === "tablet";
    const orderedPanels = [...layout.order].sort((a, b) => layout.order.indexOf(a) - layout.order.indexOf(b));

    for (const zone of Object.values(zones)) zone.replaceChildren();
    for (const id of orderedPanels) {
      const panel = panels.get(id);
      if (!panel) continue;
      const target = zones[layout.zones[id]];
      target.append(panel);
      panel.classList.toggle("layout-size-compact", layout.sizes[id] === "compact");
      panel.classList.toggle("layout-size-spacious", layout.sizes[id] === "spacious");
      panel.classList.toggle("is-pinned", layout.pinned.includes(id));
      panel.classList.toggle("is-layout-selected", panelSelect.value === id);
    }

    for (const zone of Object.values(zones)) zone.hidden = false;
    orderedPanels.forEach((id, index) => {
      panels.get(id).style.order = mobile ? String(index) : "";
    });
    grid.classList.toggle("is-mobile-layout", mobile);
    grid.classList.toggle("is-tablet-layout", tablet);
    workspace.classList.toggle("is-single-column", tablet && narrowTablet);
    toolbar.hidden = !document.body.classList.contains("is-layout-editing");
    const selected = panelSelect.value;
    document.querySelector('[data-layout-action="pin"]').setAttribute("aria-pressed", String(layout.pinned.includes(selected)));
    document.querySelector('[data-layout-action="pin"]').textContent = layout.pinned.includes(selected) ? "⌖ Unpin" : "⌖ Pin";
    document.querySelectorAll('[data-layout-action="left"], [data-layout-action="center"], [data-layout-action="right"]').forEach((button) => {
      button.setAttribute("aria-pressed", String(layout.zones[selected] === button.dataset.layoutAction));
      button.disabled = mobile || layout.pinned.includes(selected);
    });
    document.querySelectorAll('[data-layout-action="up"], [data-layout-action="down"]').forEach((button) => {
      button.disabled = layout.pinned.includes(selected);
    });
  }

  function reorder(id, direction) {
    if (layout.pinned.includes(id)) return;
    const index = layout.order.indexOf(id);
    const sameVisibleGroup = (otherId) => {
      if (profile === "mobile") return true;
      return layout.zones[otherId] === layout.zones[id];
    };
    for (let target = index + direction; target >= 0 && target < layout.order.length; target += direction) {
      if (!layout.pinned.includes(layout.order[target]) && sameVisibleGroup(layout.order[target])) {
        [layout.order[index], layout.order[target]] = [layout.order[target], layout.order[index]];
        break;
      }
    }
  }

  toggle.addEventListener("click", () => {
    const editing = document.body.classList.toggle("is-layout-editing");
    toggle.setAttribute("aria-pressed", String(editing));
    toggle.setAttribute("aria-label", editing ? "Finish dashboard layout" : "Customize dashboard layout");
    toggle.title = editing ? "Finish layout" : "Customize dashboard layout";
    render();
  });
  document.querySelector("#layout-done").addEventListener("click", () => {
    document.body.classList.remove("is-layout-editing");
    toggle.setAttribute("aria-pressed", "false");
    toggle.setAttribute("aria-label", "Customize dashboard layout");
    toggle.title = "Customize dashboard layout";
    persist();
    render();
  });
  document.querySelector("#layout-reset").addEventListener("click", () => {
    const defaults = freshLayout();
    layout.order = defaults.order;
    layout.zones = defaults.zones;
    layout.sizes = defaults.sizes;
    layout.pinned = defaults.pinned;
    persist();
    render();
  });
  panelSelect.addEventListener("change", render);

  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-layout-action]");
    if (!button) return;
    const id = panelSelect.value;
    const action = button.dataset.layoutAction;
    if (action === "pin") {
      layout.pinned = layout.pinned.includes(id) ? layout.pinned.filter((item) => item !== id) : [...layout.pinned, id];
    } else if (action === "left" || action === "center" || action === "right") {
      if (!layout.pinned.includes(id)) layout.zones[id] = action;
    } else if (action === "up" || action === "down") {
      reorder(id, action === "up" ? -1 : 1);
    } else if (action === "smaller") {
      const sizes = ["compact", "regular", "spacious"];
      layout.sizes[id] = sizes[Math.max(0, sizes.indexOf(layout.sizes[id]) - 1)];
    } else if (action === "larger") {
      const sizes = ["compact", "regular", "spacious"];
      layout.sizes[id] = sizes[Math.min(sizes.length - 1, sizes.indexOf(layout.sizes[id]) + 1)];
    }
    persist();
    render();
  });

  window.addEventListener("resize", () => {
    if (profile !== currentProfile() || narrowTablet !== isNarrowTablet()) render();
  });
  render();
}

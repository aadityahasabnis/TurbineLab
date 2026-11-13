export function readSharedState(search, sourceDefaults) {
  const query = new URLSearchParams(search);
  const legacySteam = ["p", "t", "f", "e", "c"].some((key) => query.has(key));
  const source = query.get("source") ?? (legacySteam ? "steam" : null);
  if (!source || !sourceDefaults[source]) return null;
  const inputs = { ...sourceDefaults[source] };
  if (source === "steam" && legacySteam) {
    Object.assign(inputs, {
      pressureMPa: query.get("p") ?? inputs.pressureMPa,
      tempC: query.get("t") ?? inputs.tempC,
      flowKgS: query.get("f") ?? inputs.flowKgS,
      turbineEff: query.get("e") ?? inputs.turbineEff,
      condenserKPa: query.get("c") ?? inputs.condenserKPa
    });
  } else {
    for (const key of Object.keys(inputs)) {
      if (query.has(key)) inputs[key] = query.get(key);
    }
  }
  let pinInputs = null;
  if (source !== "steam" && Object.keys(inputs).some((key) => query.has(`ref_${key}`))) {
    pinInputs = { ...sourceDefaults[source] };
    for (const key of Object.keys(pinInputs)) {
      if (query.has(`ref_${key}`)) pinInputs[key] = query.get(`ref_${key}`);
    }
  }
  return { source, inputs, pinInputs };
}

export function updateShareUrl(source, inputs, pinnedInputs = null) {
  const query = new URLSearchParams({ source });
  if (source === "steam") {
    query.set("p", inputs.pressureMPa);
    query.set("t", inputs.tempC);
    query.set("f", inputs.flowKgS);
    query.set("e", inputs.turbineEff);
    query.set("c", inputs.condenserKPa);
  } else {
    for (const [key, value] of Object.entries(inputs)) query.set(key, value);
    if (pinnedInputs) {
      for (const [key, value] of Object.entries(pinnedInputs)) query.set(`ref_${key}`, value);
    }
  }
  history.replaceState(null, "", `${location.pathname}?${query}${location.hash}`);
}

export function createShareHandler(showToast) {
  return async function shareSetup() {
    try {
      await navigator.clipboard.writeText(location.href);
      showToast("Share link copied to clipboard.");
    } catch {
      showToast("Could not copy automatically. Use your browser address bar to share this setup.");
    }
  };
}

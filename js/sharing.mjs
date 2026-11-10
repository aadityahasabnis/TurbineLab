export function readSharedInputs(defaults) {
  const query = new URLSearchParams(location.search);
  if (!["p", "t", "f", "e", "c"].some((key) => query.has(key))) return null;
  return {
    pressureMPa: query.get("p") ?? defaults.pressureMPa,
    tempC: query.get("t") ?? defaults.tempC,
    flowKgS: query.get("f") ?? defaults.flowKgS,
    turbineEff: query.get("e") ?? defaults.turbineEff,
    condenserKPa: query.get("c") ?? defaults.condenserKPa
  };
}

export function updateShareUrl(inputs) {
  const values = [inputs.pressureMPa, inputs.tempC, inputs.flowKgS, inputs.turbineEff, inputs.condenserKPa];
  const query = new URLSearchParams({ p: values[0], t: values[1], f: values[2], e: values[3], c: values[4] });
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

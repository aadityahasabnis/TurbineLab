// Deliberately synthetic teaching profiles. They are not measured weather or forecasts.
export const PROFILE_OPTIONS = Object.freeze([
  { id: "balanced", label: "Balanced day", note: "Moderate midday sun with an evening wind rise" },
  { id: "sunny-calm", label: "Sunny, calm day", note: "Clear midday solar and light wind" },
  { id: "breezy-cloudy", label: "Breezy, cloudy day", note: "Variable cloud and stronger afternoon wind" }
]);

export function resourceAt(profileId, hour) {
  const h = Math.max(0, Math.min(23, Math.round(Number(hour) || 0)));
  const daylight = Math.max(0, Math.sin(Math.PI * (h - 6) / 12));
  const cloud = profileId === "breezy-cloudy"
    ? Math.max(0.28, 0.72 + 0.22 * Math.sin((h + 2) * Math.PI / 5))
    : profileId === "sunny-calm" ? 0.96 : Math.max(0.55, 0.82 + 0.12 * Math.sin((h + 1) * Math.PI / 7));
  const windBase = profileId === "sunny-calm" ? 4.2 : profileId === "breezy-cloudy" ? 8.3 : 6.1;
  const wind = Math.max(0, windBase + (profileId === "balanced" ? 2.3 : 3.2) * Math.sin((h - 15) * Math.PI / 12) + 1.1 * Math.sin((h + 2) * Math.PI / 6));
  const temperature = 16 + 9 * daylight + (profileId === "breezy-cloudy" ? -2 : 0);
  return { hour: h, windSpeedMs: wind, irradianceWm2: Math.round(950 * daylight * cloud), ambientTempC: temperature };
}

export function buildDaySeries(source, inputs, profileId = "balanced", compute) {
  return Array.from({ length: 24 }, (_, hour) => {
    const resource = resourceAt(profileId, hour);
    const operatingInputs = source === "wind"
      ? { ...inputs, windSpeedMs: resource.windSpeedMs }
      : { ...inputs, irradianceWm2: resource.irradianceWm2, ambientTempC: resource.ambientTempC };
    return { ...resource, result: compute(source, operatingInputs) };
  });
}

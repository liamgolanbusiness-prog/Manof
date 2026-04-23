// Free weather via open-meteo.com — no API key, no rate-limit for low
// volumes, attribution requested. We geocode the project's address with
// open-meteo's geocoding API, then fetch current conditions.
//
// Returns a short Hebrew-ready string like "בהיר, 24°" or null on failure.

const WMO_CODES: Record<number, string> = {
  0: "בהיר",
  1: "בהיר חלקית",
  2: "מעונן חלקית",
  3: "מעונן",
  45: "ערפל",
  48: "ערפל",
  51: "טפטוף קל",
  53: "טפטוף",
  55: "טפטוף חזק",
  61: "גשם קל",
  63: "גשם",
  65: "גשם חזק",
  71: "שלג קל",
  73: "שלג",
  75: "שלג חזק",
  80: "ממטרים",
  81: "ממטרים חזקים",
  82: "ממטרים אלימים",
  95: "סופת רעמים",
};

function codeToHebrew(code: number | null | undefined): string {
  if (code == null) return "";
  return WMO_CODES[code] ?? "";
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!query || query.length < 2) return null;
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "he");
    url.searchParams.set("country", "IL");
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: { latitude: number; longitude: number }[];
    };
    const hit = data.results?.[0];
    if (!hit) return null;
    return { lat: hit.latitude, lng: hit.longitude };
  } catch {
    return null;
  }
}

export async function fetchWeatherForAddress(address: string | null | undefined): Promise<string | null> {
  if (!address) return null;
  const loc = await geocode(address);
  if (!loc) return null;

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(loc.lat));
    url.searchParams.set("longitude", String(loc.lng));
    url.searchParams.set("current", "temperature_2m,weather_code");
    url.searchParams.set("timezone", "Asia/Jerusalem");
    const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const t = data.current?.temperature_2m;
    const code = data.current?.weather_code;
    const desc = codeToHebrew(code);
    if (t == null) return desc || null;
    return desc ? `${desc}, ${Math.round(t)}°` : `${Math.round(t)}°`;
  } catch {
    return null;
  }
}

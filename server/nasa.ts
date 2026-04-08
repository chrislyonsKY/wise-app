/**
 * NASA & JPL API client
 * All external data fetching is centralized here.
 */

const NASA_KEY = "DEMO_KEY"; // Free demo key — 30 req/hr, 50/day

// ── JPL Small Body Database Close Approach Data API ───────────────────────────
// No API key required. Returns close approaches within date range.
export interface JplCadEntry {
  des: string;          // designation
  orbit_id: string;
  jd: string;           // Julian date
  cd: string;           // close approach date "YYYY-Mon-DD HH:MM"
  dist: string;         // nominal distance (AU)
  dist_min: string;
  dist_max: string;
  v_rel: string;        // relative velocity km/s
  v_inf: string;
  t_sigma_f: string;
  body: string;         // target body (Earth)
  h: string;            // absolute magnitude
  fullname: string;
}

interface JplCadResponse {
  signature: { source: string; version: string };
  count: string;
  fields: string[];
  data: string[][];
}

export async function fetchCloseApproaches(daysAhead = 90): Promise<JplCadEntry[]> {
  const today = new Date();
  const future = new Date(today);
  future.setDate(future.getDate() + daysAhead);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const url =
    `https://ssd-api.jpl.nasa.gov/cad.api` +
    `?date-min=${fmt(today)}&date-max=${fmt(future)}` +
    `&dist-max=0.05&sort=date&limit=100&body=Earth`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`JPL CAD API error: ${res.status}`);
  const json: JplCadResponse = await res.json();

  if (!json.data || json.data.length === 0) return [];

  // Map fields array to keyed objects
  const fields = json.fields;
  return json.data.map((row) => {
    const obj: Record<string, string> = {};
    fields.forEach((f, i) => { obj[f] = row[i] || ""; });
    return obj as unknown as JplCadEntry;
  });
}

// ── JPL SBDB Search ───────────────────────────────────────────────────────────
export interface SbdbObject {
  spkid: string;
  fullname: string;
  kind: string;         // "a" asteroid, "c" comet
  orbit_class: { name: string; code: string };
  H: number | null;     // absolute magnitude
  diameter: number | null;
  first_obs: string;
  last_obs: string;
  moid: number | null;
  a: number | null;     // semi-major axis
  e: number | null;     // eccentricity
  i: number | null;     // inclination
  pha: boolean;
}

interface SbdbResponse {
  object: {
    spkid: string;
    fullname: string;
    kind: string;
    orbit_class: { name: string; code: string };
    des: string;
    prefix: string | null;
  };
  phys_par?: Array<{ name: string; value: string; desc: string }>;
  orbit?: {
    moid: string;
    elements: Array<{ name: string; value: string }>;
    first_obs: string;
    last_obs: string;
    pha: string;
    neo: string;
  };
}

export async function searchSbdb(query: string): Promise<SbdbObject | null> {
  const url = `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${encodeURIComponent(query)}&phys=1&full-prec=0`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json: SbdbResponse = await res.json();
    if (!json.object) return null;

    const getParam = (name: string) => {
      const p = json.phys_par?.find((x) => x.name === name);
      return p ? parseFloat(p.value) : null;
    };
    const getElem = (name: string) => {
      const e = json.orbit?.elements.find((x) => x.name === name);
      return e ? parseFloat(e.value) : null;
    };

    return {
      spkid: json.object.spkid,
      fullname: json.object.fullname,
      kind: json.object.kind,
      orbit_class: json.object.orbit_class,
      H: getParam("H"),
      diameter: getParam("diameter"),
      first_obs: json.orbit?.first_obs || "",
      last_obs: json.orbit?.last_obs || "",
      moid: json.orbit?.moid ? parseFloat(json.orbit.moid) : null,
      a: getElem("a"),
      e: getElem("e"),
      i: getElem("i"),
      pha: json.orbit?.pha === "Y",
    };
  } catch {
    return null;
  }
}

// ── JPL SBDB Small Body Browser (browse asteroids) ──────────────────────────
export interface SbdbBrowseItem {
  spkid: string;
  fullname: string;
  kind: string;
  pdes: string;
  H: number | null;
  diameter: number | null;
  orbit_class: string;
  pha: boolean;
  neo: boolean;
}

interface SbdbQueryResponse {
  fields: string[];
  data: (string | number | null)[][];
  total: number;
  count: number;
}

export async function browseSbdbObjects(
  search: string,
  limit = 20,
  offset = 0
): Promise<{ items: SbdbBrowseItem[]; total: number }> {
  // SBDB query API — valid fields: spkid, pdes, H, diameter, class, pha, neo
  const cdata = search.trim()
    ? JSON.stringify({ AND: [`pdes|LIKE|%${search}%`] })
    : JSON.stringify({ AND: ["neo|EQ|Y"] });

  // Note: offset=0 breaks the API — only include when > 0
  const offsetParam = offset > 0 ? `&offset=${offset}` : "";
  const url =
    "https://ssd-api.jpl.nasa.gov/sbdb_query.api" +
    `?fields=spkid,pdes,H,diameter,class,pha,neo` +
    `&sb-kind=a&limit=${limit}${offsetParam}` +
    `&sb-cdata=${encodeURIComponent(cdata)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return { items: [], total: 0 };
    const json: SbdbQueryResponse = await res.json();

    if (!json.data || !json.fields) return { items: [], total: 0 };

    const fi = (name: string) => json.fields.indexOf(name);
    const items: SbdbBrowseItem[] = json.data.map((row) => {
      const pdes = String(row[fi("pdes")] ?? "");
      const spkid = String(row[fi("spkid")] ?? "");
      return {
        spkid,
        fullname: pdes || spkid,
        kind: "a",
        pdes,
        H: row[fi("H")] != null ? Number(row[fi("H")]) : null,
        diameter: row[fi("diameter")] != null ? Number(row[fi("diameter")]) : null,
        orbit_class: String(row[fi("class")] ?? ""),
        pha: row[fi("pha")] === "Y",
        neo: row[fi("neo")] === "Y",
      };
    });

    return { items, total: json.count || items.length };
  } catch {
    return { items: [], total: 0 };
  }
}

// ── NASA Image & Video Library ─────────────────────────────────────────────────
export interface NasaImageItem {
  nasa_id: string;
  title: string;
  description: string;
  date_created: string;
  photographer: string;
  keywords: string[];
  center: string;
  thumbnail: string;
  hd_url: string;
}

interface NasaSearchResult {
  collection: {
    items: Array<{
      data: Array<{
        nasa_id: string;
        title: string;
        description: string;
        date_created: string;
        photographer?: string;
        keywords?: string[];
        center?: string;
        media_type: string;
      }>;
      links?: Array<{ href: string; rel: string; render: string }>;
    }>;
    metadata: { total_hits: number };
  };
}

export async function fetchNasaImages(query: string, page = 1, pageSize = 20): Promise<{
  items: NasaImageItem[];
  total: number;
}> {
  const url =
    `https://images-api.nasa.gov/search` +
    `?q=${encodeURIComponent(query)}` +
    `&media_type=image&page=${page}&page_size=${pageSize}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return { items: [], total: 0 };
    const json: NasaSearchResult = await res.json();

    const total = json.collection.metadata?.total_hits || 0;
    const items: NasaImageItem[] = json.collection.items
      .filter((item) => item.data?.[0])
      .map((item) => {
        const d = item.data[0];
        const thumb = item.links?.find((l) => l.rel === "preview")?.href || "";
        return {
          nasa_id: d.nasa_id,
          title: d.title,
          description: d.description || "",
          date_created: d.date_created || "",
          photographer: d.photographer || "",
          keywords: d.keywords || [],
          center: d.center || "",
          thumbnail: thumb,
          hd_url: thumb.replace("~thumb", "~large"),
        };
      });

    return { items, total };
  } catch {
    return { items: [], total: 0 };
  }
}

// ── NASA NeoWs — Feed for stats ────────────────────────────────────────────────
export interface NeoWsStats {
  neo_count: number;
  close_approach_count: number;
  last_updated: string;
}

export async function fetchNeoWsStats(): Promise<NeoWsStats> {
  const today = new Date().toISOString().split("T")[0];
  const url = `https://api.nasa.gov/neo/rest/v1/stats?api_key=${NASA_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("NeoWs stats error");
    const json = await res.json();
    return {
      neo_count: json.near_earth_object_count || 39048,
      close_approach_count: json.close_approach_count || 1060842,
      last_updated: today,
    };
  } catch {
    // Fallback to known values
    return { neo_count: 39048, close_approach_count: 1060842, last_updated: today };
  }
}

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, like, desc, asc, and, gte } from "drizzle-orm";
import {
  neoApproaches,
  nasaImages,
  catalogObjects,
  cacheMetadata,
  type NeoApproach,
  type InsertNeoApproach,
  type NasaImage,
  type InsertNasaImage,
  type CatalogObject,
  type InsertCatalogObject,
} from "@shared/schema";

const sqlite = new Database("wise_app.db");
const db = drizzle(sqlite);

// ── Init tables ───────────────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS neo_approaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL,
    fullname TEXT NOT NULL,
    close_approach_date TEXT NOT NULL,
    distance_au REAL NOT NULL,
    distance_ld REAL NOT NULL,
    velocity_kms REAL NOT NULL,
    absolute_magnitude REAL,
    is_potentially_hazardous INTEGER NOT NULL DEFAULT 0,
    body_name TEXT NOT NULL DEFAULT 'Earth',
    cached_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS nasa_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nasa_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    date_created TEXT,
    photographer TEXT,
    thumbnail_url TEXT,
    hd_url TEXT,
    keywords TEXT,
    center TEXT,
    search_query TEXT NOT NULL,
    cached_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS catalog_objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    spk_id TEXT,
    designation TEXT NOT NULL,
    fullname TEXT NOT NULL,
    kind TEXT,
    orbit_class TEXT,
    absolute_magnitude REAL,
    diameter REAL,
    first_observed TEXT,
    last_observed TEXT,
    is_pha INTEGER NOT NULL DEFAULT 0,
    moid REAL,
    semi_major_axis REAL,
    eccentricity REAL,
    inclination REAL,
    discovered_by_wise INTEGER NOT NULL DEFAULT 0,
    cached_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cache_metadata (
    key TEXT PRIMARY KEY,
    fetched_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
`);

// ── Cache helpers ─────────────────────────────────────────────────────────────
function now() { return new Date().toISOString(); }
function expiresIn(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

export function isCacheValid(key: string): boolean {
  const row = sqlite.prepare("SELECT expires_at FROM cache_metadata WHERE key = ?").get(key) as
    | { expires_at: string }
    | undefined;
  if (!row) return false;
  return new Date(row.expires_at) > new Date();
}

export function setCache(key: string, ttlHours = 6) {
  sqlite
    .prepare(
      "INSERT OR REPLACE INTO cache_metadata (key, fetched_at, expires_at) VALUES (?, ?, ?)"
    )
    .run(key, now(), expiresIn(ttlHours));
}

// ── NEO Approaches ────────────────────────────────────────────────────────────
export function clearNeoApproaches() {
  sqlite.prepare("DELETE FROM neo_approaches").run();
}

export function insertNeoApproaches(rows: InsertNeoApproach[]) {
  const stmt = sqlite.prepare(`
    INSERT OR IGNORE INTO neo_approaches
      (designation, fullname, close_approach_date, distance_au, distance_ld,
       velocity_kms, absolute_magnitude, is_potentially_hazardous, body_name, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of rows) {
    stmt.run(
      r.designation, r.fullname, r.closeApproachDate,
      r.distanceAu, r.distanceLd, r.velocityKms,
      r.absoluteMagnitude ?? null, r.isPotentiallyHazardous ? 1 : 0,
      r.bodyName ?? "Earth", r.cachedAt
    );
  }
}

export function getNeoApproaches(filters?: {
  hazardousOnly?: boolean;
  minDist?: number;
  maxDist?: number;
  sortBy?: "date" | "dist" | "vel";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}): NeoApproach[] {
  let q = "SELECT * FROM neo_approaches WHERE 1=1";
  const params: (string | number)[] = [];

  if (filters?.hazardousOnly) {
    q += " AND is_potentially_hazardous = 1";
  }
  if (filters?.minDist != null) {
    q += " AND distance_au >= ?";
    params.push(filters.minDist);
  }
  if (filters?.maxDist != null) {
    q += " AND distance_au <= ?";
    params.push(filters.maxDist);
  }

  const col = filters?.sortBy === "dist" ? "distance_au"
    : filters?.sortBy === "vel" ? "velocity_kms"
    : "close_approach_date";
  const dir = filters?.order === "desc" ? "DESC" : "ASC";
  q += ` ORDER BY ${col} ${dir}`;

  if (filters?.limit) {
    q += ` LIMIT ?`;
    params.push(filters.limit);
    if (filters.offset) {
      q += ` OFFSET ?`;
      params.push(filters.offset);
    }
  }

  return sqlite.prepare(q).all(...params) as NeoApproach[];
}

export function getNeoCount(): number {
  const row = sqlite.prepare("SELECT COUNT(*) as cnt FROM neo_approaches").get() as { cnt: number };
  return row.cnt;
}

// ── NASA Images ───────────────────────────────────────────────────────────────
export function clearNasaImages(query: string) {
  sqlite.prepare("DELETE FROM nasa_images WHERE search_query = ?").run(query);
}

export function insertNasaImages(rows: InsertNasaImage[]) {
  const stmt = sqlite.prepare(`
    INSERT OR REPLACE INTO nasa_images
      (nasa_id, title, description, date_created, photographer,
       thumbnail_url, hd_url, keywords, center, search_query, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of rows) {
    stmt.run(
      r.nasaId, r.title, r.description ?? null, r.dateCreated ?? null,
      r.photographer ?? null, r.thumbnailUrl ?? null, r.hdUrl ?? null,
      r.keywords ?? null, r.center ?? null, r.searchQuery, r.cachedAt
    );
  }
}

export function getNasaImages(query?: string, limit = 20, offset = 0): NasaImage[] {
  if (query) {
    return sqlite
      .prepare(
        "SELECT * FROM nasa_images WHERE search_query = ? ORDER BY date_created DESC LIMIT ? OFFSET ?"
      )
      .all(query, limit, offset) as NasaImage[];
  }
  return sqlite
    .prepare("SELECT * FROM nasa_images ORDER BY date_created DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as NasaImage[];
}

export function getNasaImageCount(query?: string): number {
  if (query) {
    const row = sqlite
      .prepare("SELECT COUNT(*) as cnt FROM nasa_images WHERE search_query = ?")
      .get(query) as { cnt: number };
    return row.cnt;
  }
  const row = sqlite.prepare("SELECT COUNT(*) as cnt FROM nasa_images").get() as { cnt: number };
  return row.cnt;
}

// ── Catalog Objects ───────────────────────────────────────────────────────────
export function clearCatalogObjects() {
  sqlite.prepare("DELETE FROM catalog_objects").run();
}

export function insertCatalogObjects(rows: InsertCatalogObject[]) {
  const stmt = sqlite.prepare(`
    INSERT OR REPLACE INTO catalog_objects
      (spk_id, designation, fullname, kind, orbit_class, absolute_magnitude,
       diameter, first_observed, last_observed, is_pha, moid,
       semi_major_axis, eccentricity, inclination, discovered_by_wise, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of rows) {
    stmt.run(
      r.spkId ?? null, r.designation, r.fullname, r.kind ?? null, r.orbitClass ?? null,
      r.absoluteMagnitude ?? null, r.diameter ?? null,
      r.firstObserved ?? null, r.lastObserved ?? null,
      r.isPha ? 1 : 0, r.minOrbitIntersection ?? null,
      r.semiMajorAxis ?? null, r.eccentricity ?? null, r.inclination ?? null,
      r.discoveredByWise ? 1 : 0, r.cachedAt
    );
  }
}

export function getCatalogObjects(filters?: {
  search?: string;
  kind?: string;
  phaOnly?: boolean;
  limit?: number;
  offset?: number;
}): CatalogObject[] {
  let q = "SELECT * FROM catalog_objects WHERE 1=1";
  const params: (string | number)[] = [];

  if (filters?.search) {
    q += " AND (fullname LIKE ? OR designation LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters?.kind) {
    q += " AND kind = ?";
    params.push(filters.kind);
  }
  if (filters?.phaOnly) {
    q += " AND is_pha = 1";
  }

  q += " ORDER BY absolute_magnitude ASC";

  if (filters?.limit) {
    q += ` LIMIT ?`;
    params.push(filters.limit);
    if (filters.offset) {
      q += ` OFFSET ?`;
      params.push(filters.offset);
    }
  }

  return sqlite.prepare(q).all(...params) as CatalogObject[];
}

export function getCatalogCount(search?: string): number {
  if (search) {
    const row = sqlite
      .prepare("SELECT COUNT(*) as cnt FROM catalog_objects WHERE fullname LIKE ? OR designation LIKE ?")
      .get(`%${search}%`, `%${search}%`) as { cnt: number };
    return row.cnt;
  }
  const row = sqlite.prepare("SELECT COUNT(*) as cnt FROM catalog_objects").get() as { cnt: number };
  return row.cnt;
}

// ── Row mappers (SQLite returns snake_case; map to camelCase) ─────────────────
function mapNeoRow(row: Record<string, unknown>): NeoApproach {
  return {
    id: row.id as number,
    designation: row.designation as string,
    fullname: row.fullname as string,
    closeApproachDate: row.close_approach_date as string,
    distanceAu: row.distance_au as number,
    distanceLd: row.distance_ld as number,
    velocityKms: row.velocity_kms as number,
    absoluteMagnitude: row.absolute_magnitude as number | null,
    isPotentiallyHazardous: row.is_potentially_hazardous as number,
    bodyName: row.body_name as string,
    cachedAt: row.cached_at as string,
  };
}

function mapImageRow(row: Record<string, unknown>): NasaImage {
  return {
    id: row.id as number,
    nasaId: row.nasa_id as string,
    title: row.title as string,
    description: row.description as string | null,
    dateCreated: row.date_created as string | null,
    photographer: row.photographer as string | null,
    thumbnailUrl: row.thumbnail_url as string | null,
    hdUrl: row.hd_url as string | null,
    keywords: row.keywords as string | null,
    center: row.center as string | null,
    searchQuery: row.search_query as string,
    cachedAt: row.cached_at as string,
  };
}

function mapCatalogRow(row: Record<string, unknown>): CatalogObject {
  return {
    id: row.id as number,
    spkId: row.spk_id as string | null,
    designation: row.designation as string,
    fullname: row.fullname as string,
    kind: row.kind as string | null,
    orbitClass: row.orbit_class as string | null,
    absoluteMagnitude: row.absolute_magnitude as number | null,
    diameter: row.diameter as number | null,
    firstObserved: row.first_observed as string | null,
    lastObserved: row.last_observed as string | null,
    isPha: row.is_pha as number,
    minOrbitIntersection: row.moid as number | null,
    semiMajorAxis: row.semi_major_axis as number | null,
    eccentricity: row.eccentricity as number | null,
    inclination: row.inclination as number | null,
    discoveredByWise: row.discovered_by_wise as number,
    cachedAt: row.cached_at as string,
  };
}

export function getMappedNeoApproaches(filters?: Parameters<typeof getNeoApproaches>[0]): NeoApproach[] {
  const raw = getNeoApproaches(filters) as unknown as Record<string, unknown>[];
  return raw.map(mapNeoRow);
}

export function getMappedNasaImages(query?: string, limit = 20, offset = 0): NasaImage[] {
  const raw = getNasaImages(query, limit, offset) as unknown as Record<string, unknown>[];
  return raw.map(mapImageRow);
}

export function getMappedCatalogObjects(filters?: Parameters<typeof getCatalogObjects>[0]): CatalogObject[] {
  const raw = getCatalogObjects(filters) as unknown as Record<string, unknown>[];
  return raw.map(mapCatalogRow);
}

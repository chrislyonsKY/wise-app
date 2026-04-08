import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── NEO Close-Approach cache ─────────────────────────────────────────────────
export const neoApproaches = sqliteTable("neo_approaches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  designation: text("designation").notNull(),
  fullname: text("fullname").notNull(),
  closeApproachDate: text("close_approach_date").notNull(),
  distanceAu: real("distance_au").notNull(),
  distanceLd: real("distance_ld").notNull(),       // lunar distances
  velocityKms: real("velocity_kms").notNull(),
  absoluteMagnitude: real("absolute_magnitude"),   // H value → size proxy
  isPotentiallyHazardous: integer("is_potentially_hazardous").notNull().default(0), // 0/1
  bodyName: text("body_name").notNull().default("Earth"),
  cachedAt: text("cached_at").notNull(),
});

// ── NASA Image cache ─────────────────────────────────────────────────────────
export const nasaImages = sqliteTable("nasa_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nasaId: text("nasa_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  dateCreated: text("date_created"),
  photographer: text("photographer"),
  thumbnailUrl: text("thumbnail_url"),
  hdUrl: text("hd_url"),
  keywords: text("keywords"),  // JSON string
  center: text("center"),       // e.g. "JPL", "GSFC"
  searchQuery: text("search_query").notNull(),
  cachedAt: text("cached_at").notNull(),
});

// ── Asteroid/Object Catalog search cache ─────────────────────────────────────
export const catalogObjects = sqliteTable("catalog_objects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  spkId: text("spk_id"),
  designation: text("designation").notNull(),
  fullname: text("fullname").notNull(),
  kind: text("kind"),            // "a" = asteroid, "c" = comet
  orbitClass: text("orbit_class"),
  absoluteMagnitude: real("absolute_magnitude"),
  diameter: real("diameter"),   // km, if known
  firstObserved: text("first_observed"),
  lastObserved: text("last_observed"),
  isPha: integer("is_pha").notNull().default(0),
  minOrbitIntersection: real("moid"),
  semiMajorAxis: real("semi_major_axis"),
  eccentricity: real("eccentricity"),
  inclination: real("inclination"),
  discoveredByWise: integer("discovered_by_wise").notNull().default(0),
  cachedAt: text("cached_at").notNull(),
});

// ── Cache metadata ────────────────────────────────────────────────────────────
export const cacheMetadata = sqliteTable("cache_metadata", {
  key: text("key").primaryKey(),
  fetchedAt: text("fetched_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});

// ── Insert schemas ────────────────────────────────────────────────────────────
export const insertNeoApproachSchema = createInsertSchema(neoApproaches).omit({ id: true });
export const insertNasaImageSchema = createInsertSchema(nasaImages).omit({ id: true });
export const insertCatalogObjectSchema = createInsertSchema(catalogObjects).omit({ id: true });

// ── Types ─────────────────────────────────────────────────────────────────────
export type NeoApproach = typeof neoApproaches.$inferSelect;
export type InsertNeoApproach = z.infer<typeof insertNeoApproachSchema>;

export type NasaImage = typeof nasaImages.$inferSelect;
export type InsertNasaImage = z.infer<typeof insertNasaImageSchema>;

export type CatalogObject = typeof catalogObjects.$inferSelect;
export type InsertCatalogObject = z.infer<typeof insertCatalogObjectSchema>;

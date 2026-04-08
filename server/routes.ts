import type { Express } from "express";
import type { Server } from "http";
import {
  fetchCloseApproaches,
  fetchNasaImages,
  browseSbdbObjects,
  searchSbdb,
  fetchNeoWsStats,
} from "./nasa";
import {
  isCacheValid,
  setCache,
  clearNeoApproaches,
  insertNeoApproaches,
  getNeoCount,
  clearNasaImages,
  insertNasaImages,
  getNasaImageCount,
  clearCatalogObjects,
  insertCatalogObjects,
  getCatalogCount,
  getMappedNeoApproaches,
  getMappedNasaImages,
  getMappedCatalogObjects,
} from "./storage";

const AU_TO_LD = 389.17;

export async function registerRoutes(httpServer: Server, app: Express) {
  // ── Dashboard Stats ─────────────────────────────────────────────────────────
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await fetchNeoWsStats();
      const cachedNeo = getNeoCount();
      res.json({
        ...stats,
        cached_approaches: cachedNeo,
        wise_objects: 747634026,
        neowise_discovered: 39162,
        comets_found: 26,
        years_service: 15,
        mission_status: "RETIRED",
        successor: "NEO Surveyor",
        successor_launch: 2027,
      });
    } catch (err) {
      res.status(400).json({ error: "Failed to fetch stats" });
    }
  });

  // ── NEO Close Approaches ────────────────────────────────────────────────────
  app.get("/api/neo/approaches", async (req, res) => {
    try {
      const cacheKey = "neo_approaches";
      if (!isCacheValid(cacheKey)) {
        const entries = await fetchCloseApproaches(120);
        clearNeoApproaches();

        const rows = entries.map((e) => {
          const distAu = parseFloat(e.dist) || 0;
          const h = parseFloat(e.h) || 99;
          const isPha = h <= 22 && distAu <= 0.05;

          return {
            designation: e.des || e.fullname,
            fullname: e.fullname || e.des,
            closeApproachDate: e.cd || "",
            distanceAu: distAu,
            distanceLd: distAu * AU_TO_LD,
            velocityKms: parseFloat(e.v_rel) || 0,
            absoluteMagnitude: h < 99 ? h : null,
            isPotentiallyHazardous: isPha ? 1 : 0,
            bodyName: e.body || "Earth",
            cachedAt: new Date().toISOString(),
          };
        });

        insertNeoApproaches(rows);
        setCache(cacheKey, 6);
      }

      const hazardousOnly = req.query.hazardous === "true";
      const sortBy = (req.query.sort as "date" | "dist" | "vel") || "date";
      const order = (req.query.order as "asc" | "desc") || "asc";
      const limit = parseInt(String(req.query.limit || "50"));
      const offset = parseInt(String(req.query.offset || "0"));

      const approaches = getMappedNeoApproaches({ hazardousOnly, sortBy, order, limit, offset });
      const total = getNeoCount();

      res.json({ approaches, total, cached: true });
    } catch (err) {
      console.error("NEO approach error:", err);
      res.status(400).json({ error: "Failed to fetch close approaches" });
    }
  });

  // ── Single NEO Lookup ───────────────────────────────────────────────────────
  app.get("/api/neo/lookup/:designation", async (req, res) => {
    try {
      const obj = await searchSbdb(req.params.designation);
      if (!obj) return res.status(404).json({ error: "Object not found" });
      res.json(obj);
    } catch {
      res.status(400).json({ error: "Lookup failed" });
    }
  });

  // ── Object Catalog ──────────────────────────────────────────────────────────
  app.get("/api/catalog", async (req, res) => {
    try {
      const search = String(req.query.search || "");
      const phaOnly = req.query.pha === "true";
      const limit = parseInt(String(req.query.limit || "20"));
      const offset = parseInt(String(req.query.offset || "0"));

      const cacheKey = `catalog_browse_${search}`;
      const localCount = getCatalogCount(search || undefined);

      if (localCount === 0 || !isCacheValid(cacheKey)) {
        const { items } = await browseSbdbObjects(search, Math.min(limit + 20, 100), offset);
        if (items.length > 0) {
          if (!search) clearCatalogObjects();
          const rows = items.map((item) => ({
            spkId: item.spkid,
            designation: item.pdes || item.fullname,
            fullname: item.fullname,
            kind: item.kind,
            orbitClass: item.orbit_class,
            absoluteMagnitude: item.H,
            diameter: item.diameter,
            firstObserved: null,
            lastObserved: null,
            isPha: item.pha ? 1 : 0,
            minOrbitIntersection: null,
            semiMajorAxis: null,
            eccentricity: null,
            inclination: null,
            discoveredByWise: 0,
            cachedAt: new Date().toISOString(),
          }));
          insertCatalogObjects(rows);
          setCache(cacheKey, 12);
        }
      }

      const objects = getMappedCatalogObjects({ search: search || undefined, phaOnly, limit, offset });
      const total = getCatalogCount(search || undefined);

      res.json({ objects, total });
    } catch (err) {
      console.error("Catalog error:", err);
      res.status(400).json({ error: "Catalog fetch failed" });
    }
  });

  // ── NASA Images ─────────────────────────────────────────────────────────────
  const IMAGE_QUERIES: Record<string, string> = {
    wise: "WISE telescope infrared",
    neowise: "NEOWISE comet",
    neo: "near earth asteroid NASA",
    allwise: "AllWISE infrared survey",
    comet: "NEOWISE comet discovery",
  };

  app.get("/api/images", async (req, res) => {
    try {
      const category = String(req.query.category || "wise");
      const page = parseInt(String(req.query.page || "1"));
      const limit = parseInt(String(req.query.limit || "20"));
      const offset = (page - 1) * limit;

      const query = IMAGE_QUERIES[category] || IMAGE_QUERIES.wise;
      const cacheKey = `images_${category}`;

      const localCount = getNasaImageCount(query);
      if (localCount === 0 || !isCacheValid(cacheKey)) {
        const { items } = await fetchNasaImages(query, 1, 40);
        if (items.length > 0) {
          clearNasaImages(query);
          const rows = items.map((img) => ({
            nasaId: img.nasa_id,
            title: img.title,
            description: img.description || null,
            dateCreated: img.date_created || null,
            photographer: img.photographer || null,
            thumbnailUrl: img.thumbnail || null,
            hdUrl: img.hd_url || null,
            keywords: JSON.stringify(img.keywords || []),
            center: img.center || null,
            searchQuery: query,
            cachedAt: new Date().toISOString(),
          }));
          insertNasaImages(rows);
          setCache(cacheKey, 24);
        }
      }

      const images = getMappedNasaImages(query, limit, offset);
      const total = getNasaImageCount(query);

      res.json({ images, total, category });
    } catch (err) {
      console.error("Images error:", err);
      res.status(400).json({ error: "Image fetch failed" });
    }
  });

  // ── Close Approach Chart Data ────────────────────────────────────────────────
  app.get("/api/neo/chart", (_req, res) => {
    try {
      const approaches = getMappedNeoApproaches({ limit: 500, sortBy: "date", order: "asc" });

      // Group by month from close approach date
      const monthBuckets: Record<string, { total: number; pha: number }> = {};
      for (const a of approaches) {
        // date format is "YYYY-Mon-DD HH:MM" or "YYYY-Apr-08 12:00"
        const raw = a.closeApproachDate || "";
        // Extract year and month name e.g. "2026-Apr-08" → "2026-Apr"
        const parts = raw.split(" ")[0].split("-");
        const month = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : raw.substring(0, 7);
        if (!month) continue;
        if (!monthBuckets[month]) monthBuckets[month] = { total: 0, pha: 0 };
        monthBuckets[month].total++;
        if (a.isPotentiallyHazardous) monthBuckets[month].pha++;
      }

      const chartData = Object.entries(monthBuckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, ...v }));

      // Distance histogram
      const distBuckets = [
        { range: "< 0.01 AU", count: 0, color: "#e02a14" },
        { range: "0.01–0.02 AU", count: 0, color: "#e07014" },
        { range: "0.02–0.03 AU", count: 0, color: "#1063c8" },
        { range: "0.03–0.05 AU", count: 0, color: "#4080e0" },
      ];
      for (const a of approaches) {
        if (a.distanceAu < 0.01) distBuckets[0].count++;
        else if (a.distanceAu < 0.02) distBuckets[1].count++;
        else if (a.distanceAu < 0.03) distBuckets[2].count++;
        else distBuckets[3].count++;
      }

      res.json({ byMonth: chartData, byDistance: distBuckets });
    } catch (err) {
      console.error("Chart error:", err);
      res.status(400).json({ error: "Chart data error" });
    }
  });
}

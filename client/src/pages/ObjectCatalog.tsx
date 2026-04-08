import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertTriangle, ChevronRight, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

interface CatalogObject {
  id: number;
  spkId: string | null;
  designation: string;
  fullname: string;
  kind: string | null;
  orbitClass: string | null;
  absoluteMagnitude: number | null;
  diameter: number | null;
  firstObserved: string | null;
  lastObserved: string | null;
  isPha: number;
  minOrbitIntersection: number | null;
  semiMajorAxis: number | null;
  eccentricity: number | null;
  inclination: number | null;
  discoveredByWise: number;
}

interface CatalogResponse {
  objects: CatalogObject[];
  total: number;
}

// Orbit class descriptions
const ORBIT_CLASSES: Record<string, { label: string; color: string }> = {
  AMO: { label: "Amor", color: "#4080e0" },
  APO: { label: "Apollo", color: "#e02a14" },
  ATE: { label: "Aten", color: "#e07014" },
  ATI: { label: "Atira", color: "#a040e0" },
  IEO: { label: "Interior", color: "#e07014" },
  MCA: { label: "Mars-crosser", color: "#c04040" },
  IMB: { label: "Inner Belt", color: "#4080e0" },
  MBA: { label: "Main Belt", color: "#1063c8" },
  OMB: { label: "Outer Belt", color: "#2060a0" },
  TNO: { label: "Trans-Nept.", color: "#60a0e0" },
  PAA: { label: "Parabolic", color: "#40a060" },
  HYA: { label: "Hyperbolic", color: "#40a060" },
  COM: { label: "Comet", color: "#1db87a" },
  JFC: { label: "Jupiter Family", color: "#20a060" },
  HTC: { label: "Halley-type", color: "#2080a0" },
};

function orbitBadge(cls: string | null) {
  if (!cls) return null;
  const info = ORBIT_CLASSES[cls] || { label: cls, color: "#7e96b4" };
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-sm font-mono text-[9px]"
      style={{ color: info.color, background: `${info.color}18`, border: `1px solid ${info.color}40` }}
    >
      {info.label}
    </span>
  );
}

function SizeBar({ h }: { h: number | null }) {
  if (h == null) return <span className="font-mono text-[10px] text-muted-foreground">—</span>;
  // H 10 = very large, H 30 = tiny; scale inversely
  const pct = Math.max(5, Math.min(100, ((30 - h) / 20) * 100));
  const color = h < 18 ? "#e02a14" : h < 22 ? "#e07014" : "#1063c8";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">{h.toFixed(1)}</span>
    </div>
  );
}

export function ObjectCatalog() {
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [phaOnly, setPhaOnly] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery<CatalogResponse>({
    queryKey: ["/api/catalog", { search, pha: phaOnly, limit, offset: page * limit }],
    staleTime: 60_000,
  });

  const objects = data?.objects ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearch = useCallback(() => {
    setSearch(inputVal);
    setPage(0);
  }, [inputVal]);

  const POPULAR = ["Apophis", "Bennu", "Ryugu", "Eros", "Itokawa", "Ceres"];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <div className="nasa-stripe w-full mb-4" />
        <div className="section-num mb-1">03 —— SBDB CATALOG</div>
        <h1 className="font-display text-3xl">Object Catalog</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Search the JPL Small Body Database for near-Earth asteroids, comets, and other small bodies.
          Browse by orbit class, hazard status, or search by designation.
        </p>
      </div>

      {/* Search bar */}
      <div className="mc-card p-4 mb-5">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              data-testid="input-search"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name or designation…"
              className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-sm text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            data-testid="btn-search"
            onClick={handleSearch}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-body hover:bg-blue-600 transition-colors"
          >
            Search
          </button>
          <button
            data-testid="filter-pha"
            onClick={() => { setPhaOnly((v) => !v); setPage(0); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-mono transition-colors border ${
              phaOnly
                ? "bg-secondary/15 border-secondary/40 text-secondary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="w-3 h-3" /> PHA
          </button>
        </div>

        {/* Quick search chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[9px] text-muted-foreground">POPULAR:</span>
          {POPULAR.map((name) => (
            <button
              key={name}
              onClick={() => { setInputVal(name); setSearch(name); setPage(0); }}
              className="font-mono text-[9px] px-2 py-0.5 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              data-testid={`chip-${name.toLowerCase()}`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] text-muted-foreground">
          {isLoading ? "SEARCHING…" : `${total} OBJECTS FOUND`}
          {search && ` · QUERY: "${search}"`}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {totalPages > 1 ? `PAGE ${page + 1}/${totalPages}` : ""}
        </span>
      </div>

      {/* Table */}
      <div className="mc-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase">Designation</th>
              <th className="text-left px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase">Orbit Class</th>
              <th className="text-right px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase">H (Mag)</th>
              <th className="text-right px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase">Relative Size</th>
              <th className="text-center px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="neo-row">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 bg-muted rounded animate-pulse" style={{ width: j === 0 ? "60%" : "40%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : objects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="font-mono text-xs text-muted-foreground">NO OBJECTS FOUND</div>
                  <p className="font-body text-xs text-muted-foreground mt-2">
                    Try a name like "Apophis", "Bennu", or a numeric designation like "99942".
                  </p>
                </td>
              </tr>
            ) : (
              objects.map((obj) => (
                <tr key={obj.id} className="neo-row" data-testid={`obj-row-${obj.id}`}>
                  <td className="px-4 py-3">
                    <div className="font-body text-xs text-foreground max-w-[240px] truncate" title={obj.fullname}>
                      {obj.fullname}
                    </div>
                    <div className="font-mono text-[9px] text-muted-foreground">{obj.spkId || obj.designation}</div>
                  </td>
                  <td className="px-4 py-3">
                    {orbitBadge(obj.orbitClass)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                    {obj.absoluteMagnitude != null ? obj.absoluteMagnitude.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <SizeBar h={obj.absoluteMagnitude} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {obj.isPha ? (
                      <span className="badge-pha">
                        <AlertTriangle className="w-2.5 h-2.5" /> PHA
                      </span>
                    ) : (
                      <span className="badge-neo">NEO</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="font-mono text-[10px] px-3 py-1.5 rounded-sm border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              data-testid="btn-prev-page"
            >
              ← PREV
            </button>
            <span className="font-mono text-[10px] text-muted-foreground">
              {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="font-mono text-[10px] px-3 py-1.5 rounded-sm border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              data-testid="btn-next-page"
            >
              NEXT →
            </button>
          </div>
        )}
      </div>

      {/* Orbit class legend */}
      <div className="mc-card p-4 mt-5">
        <div className="section-num mb-2">ORBIT CLASS REFERENCE</div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {Object.entries(ORBIT_CLASSES).slice(0, 10).map(([code, info]) => (
            <div key={code} className="flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-3 rounded-full"
                style={{ background: info.color }}
              />
              <span className="font-mono text-[9px] text-muted-foreground">
                {code} · {info.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

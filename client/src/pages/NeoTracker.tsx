import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface NeoApproach {
  id: number;
  designation: string;
  fullname: string;
  closeApproachDate: string;
  distanceAu: number;
  distanceLd: number;
  velocityKms: number;
  absoluteMagnitude: number | null;
  isPotentiallyHazardous: number;
  bodyName: string;
}

interface ApproachesResponse {
  approaches: NeoApproach[];
  total: number;
  cached: boolean;
}

type SortField = "date" | "dist" | "vel";
type SortOrder = "asc" | "desc";

function distLabel(au: number) {
  if (au < 0.01) return { label: "VERY CLOSE", color: "#e02a14" };
  if (au < 0.02) return { label: "CLOSE", color: "#e07014" };
  if (au < 0.04) return { label: "MODERATE", color: "#1063c8" };
  return { label: "DISTANT", color: "#4080e0" };
}

// Estimate diameter from absolute magnitude
function estimateDiameter(H: number | null): string {
  if (H == null) return "—";
  // D (km) ≈ (1329 / √0.14) × 10^(-H/5)  — albedo = 0.14
  const d = (1329 / Math.sqrt(0.14)) * Math.pow(10, -H / 5);
  if (d < 0.1) return `${(d * 1000).toFixed(0)} m`;
  return `${d.toFixed(2)} km`;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: NeoApproach }> }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="mc-card p-3 shadow-xl" style={{ minWidth: 200 }}>
      <div className="font-display text-sm text-foreground mb-1">{d.fullname}</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="font-mono text-[9px] text-muted-foreground">DATE</span>
          <span className="font-mono text-[9px] text-foreground">{d.closeApproachDate}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="font-mono text-[9px] text-muted-foreground">DIST</span>
          <span className="font-mono text-[9px] text-foreground">{d.distanceAu.toFixed(4)} AU</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="font-mono text-[9px] text-muted-foreground">VEL</span>
          <span className="font-mono text-[9px] text-foreground">{d.velocityKms.toFixed(1)} km/s</span>
        </div>
      </div>
    </div>
  );
};

export function NeoTracker() {
  const [hazardousOnly, setHazardousOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(0);
  const limit = 25;

  const { data, isLoading, isFetching } = useQuery<ApproachesResponse>({
    queryKey: ["/api/neo/approaches", { hazardous: hazardousOnly, sort: sortBy, order: sortOrder, limit, offset: page * limit }],
  });

  const approaches = data?.approaches ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-0.5" />
    );
  };

  // Scatter data: approaches mapped to distance vs velocity
  const scatterData = approaches.map((a) => ({
    ...a,
    x: a.distanceAu,
    y: a.velocityKms,
    z: a.absoluteMagnitude ? Math.max(5, 30 - a.absoluteMagnitude) : 10,
  }));

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <div className="nasa-stripe w-full mb-4" />
        <div className="flex items-start justify-between">
          <div>
            <div className="section-num mb-1">02 —— NEO SURVEILLANCE</div>
            <h1 className="font-display text-3xl">Close-Approach Tracker</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">
              Upcoming near-Earth object close approaches sourced from the JPL Small Body Database.
              Next 120 days · {total} objects tracked.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isFetching && <RefreshCw className="w-4 h-4 text-primary animate-spin" />}
            <span className="font-mono text-[10px] text-muted-foreground border border-border rounded-sm px-2 py-1">
              JPL CAD API
            </span>
          </div>
        </div>
      </div>

      {/* Scatter plot */}
      <div className="mc-card p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="section-num mb-0.5">SCATTER</div>
            <div className="font-display text-base">Distance vs. Velocity</div>
          </div>
          <div className="flex gap-3 text-[9px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-nasa-red" /> PHA
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-nasa-blue" /> SAFE
            </span>
          </div>
        </div>
        {approaches.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                type="number"
                dataKey="x"
                name="Distance (AU)"
                tick={{ fontSize: 9, fontFamily: "Space Mono", fill: "#7e96b4" }}
                tickLine={false}
                axisLine={{ stroke: "#1a2540" }}
                label={{
                  value: "Distance (AU)",
                  position: "insideBottom",
                  offset: -2,
                  style: { fontSize: 9, fontFamily: "Space Mono", fill: "#7e96b4" },
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Velocity (km/s)"
                tick={{ fontSize: 9, fontFamily: "Space Mono", fill: "#7e96b4" }}
                tickLine={false}
                axisLine={{ stroke: "#1a2540" }}
              />
              <ZAxis type="number" dataKey="z" range={[20, 200]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0.05} stroke="#e02a14" strokeDasharray="4 4" strokeOpacity={0.4} />
              <Scatter
                data={scatterData.filter((d) => !d.isPotentiallyHazardous)}
                fill="#1063c8"
                fillOpacity={0.7}
              />
              <Scatter
                data={scatterData.filter((d) => d.isPotentiallyHazardous)}
                fill="#e02a14"
                fillOpacity={0.85}
              />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center">
            <div className="font-mono text-xs text-muted-foreground">
              {isLoading ? "LOADING TRAJECTORY DATA…" : "NO DATA"}
            </div>
          </div>
        )}
        <p className="font-mono text-[9px] text-muted-foreground mt-2">
          Red dashed line = 0.05 AU PHA boundary · Point size correlates with estimated object size
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-3">
        <button
          data-testid="filter-hazardous"
          onClick={() => { setHazardousOnly((v) => !v); setPage(0); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono transition-colors border ${
            hazardousOnly
              ? "bg-secondary/15 border-secondary/40 text-secondary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          PHA ONLY
        </button>
        <span className="font-mono text-[10px] text-muted-foreground ml-auto">
          {total} objects · page {page + 1}/{Math.max(1, totalPages)}
        </span>
      </div>

      {/* Table */}
      <div className="mc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase">Object</th>
                <th
                  className="text-left px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("date")}
                  data-testid="sort-date"
                >
                  Date <SortIcon field="date" />
                </th>
                <th
                  className="text-right px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("dist")}
                  data-testid="sort-dist"
                >
                  Distance <SortIcon field="dist" />
                </th>
                <th className="text-right px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase">Lunar Dist</th>
                <th
                  className="text-right px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("vel")}
                  data-testid="sort-vel"
                >
                  Velocity <SortIcon field="vel" />
                </th>
                <th className="text-right px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase">Est. Size</th>
                <th className="text-center px-4 py-2.5 font-mono text-[10px] text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="neo-row">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-muted rounded animate-pulse" style={{ width: j === 0 ? "70%" : "50%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : approaches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center font-mono text-xs text-muted-foreground">
                    NO OBJECTS IN RANGE
                  </td>
                </tr>
              ) : (
                approaches.map((a) => {
                  const dl = distLabel(a.distanceAu);
                  return (
                    <tr key={a.id} className="neo-row" data-testid={`neo-row-${a.id}`}>
                      <td className="px-4 py-3">
                        <div className="font-body text-xs text-foreground leading-snug max-w-[200px] truncate">
                          {a.fullname}
                        </div>
                        <div className="font-mono text-[9px] text-muted-foreground">{a.designation}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {a.closeApproachDate.substring(0, 12)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-xs text-foreground">{a.distanceAu.toFixed(4)}</span>
                        <span className="font-mono text-[9px] text-muted-foreground ml-1">AU</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-xs text-foreground">{a.distanceLd.toFixed(1)}</span>
                        <span className="font-mono text-[9px] text-muted-foreground ml-1">LD</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-xs text-foreground">{a.velocityKms.toFixed(1)}</span>
                        <span className="font-mono text-[9px] text-muted-foreground ml-1">km/s</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {estimateDiameter(a.absoluteMagnitude)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {a.isPotentiallyHazardous ? (
                          <span className="badge-pha">
                            <AlertTriangle className="w-2.5 h-2.5" /> PHA
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono"
                            style={{ color: dl.color, background: `${dl.color}18`, border: `1px solid ${dl.color}40` }}
                          >
                            {dl.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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
              {page + 1} / {totalPages}
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
    </div>
  );
}

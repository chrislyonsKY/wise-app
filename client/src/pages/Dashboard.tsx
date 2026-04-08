import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Orbit,
  Database,
  Star,
  Clock,
  ChevronRight,
  AlertTriangle,
  Telescope,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface StatsData {
  neo_count: number;
  close_approach_count: number;
  cached_approaches: number;
  wise_objects: number;
  neowise_discovered: number;
  comets_found: number;
  years_service: number;
  mission_status: string;
  successor: string;
  successor_launch: number;
}

interface ChartData {
  byMonth: { month: string; total: number; pha: number }[];
  byDistance: { range: string; count: number; color: string }[];
}

function StatCard({
  value,
  label,
  sub,
  accent = "blue",
}: {
  value: string;
  label: string;
  sub?: string;
  accent?: "blue" | "red" | "amber" | "green";
}) {
  const cls =
    accent === "red"
      ? "mc-card-red"
      : accent === "amber"
      ? "mc-card-amber"
      : accent === "green"
      ? "mc-card-green"
      : "mc-card";
  return (
    <div className={`${cls} p-4`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label mt-1">{label}</div>
      {sub && <div className="font-mono text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

const MISSION_EVENTS = [
  { date: "DEC 2009", label: "Launch — Vandenberg SLC-2W" },
  { date: "JAN 2010", label: "Sky survey begins" },
  { date: "OCT 2010", label: "Hydrogen coolant exhausted — NEOWISE phase begins" },
  { date: "FEB 2011", label: "Spacecraft hibernated" },
  { date: "DEC 2013", label: "Reactivated — planetary defense mission" },
  { date: "2010–2024", label: "215+ NEOs discovered, 26 comets found" },
  { date: "NOV 2024", label: "Mission ends — 15 years of infrared survey" },
];

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
  });
  const { data: chartData } = useQuery<ChartData>({
    queryKey: ["/api/neo/chart"],
  });

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}K`
      : String(n);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="nasa-stripe w-full mb-4" />
        <div className="flex items-start justify-between">
          <div>
            <div className="section-num mb-1">01 —— MISSION STATUS</div>
            <h1 className="font-display text-3xl text-foreground">
              Wide-Field Infrared Survey Explorer
            </h1>
            <p className="font-body text-sm text-muted-foreground mt-1 max-w-xl">
              NASA infrared space telescope that surveyed the entire sky twice in 13 bands,
              cataloguing 747 million sources and discovering 39,000+ near-Earth objects.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[10px] px-2 py-1 rounded-sm bg-muted text-muted-foreground border border-border">
              {stats?.mission_status ?? "RETIRED"} · 2009–2024
            </span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          value={statsLoading ? "—" : fmt(stats?.wise_objects ?? 747634026)}
          label="Catalogued Sources"
          sub="AllWISE · All-Sky"
          accent="blue"
        />
        <StatCard
          value={statsLoading ? "—" : fmt(stats?.neo_count ?? 39048)}
          label="Near-Earth Objects"
          sub="Cumulative · NeoWs"
          accent="red"
        />
        <StatCard
          value={statsLoading ? "—" : fmt(stats?.neowise_discovered ?? 39162)}
          label="NEOWISE Discoveries"
          sub="Asteroids + Comets"
          accent="amber"
        />
        <StatCard
          value={statsLoading ? "—" : String(stats?.comets_found ?? 26)}
          label="Comets Found"
          sub="Including C/2020 F3"
          accent="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Approach chart */}
        <div className="lg:col-span-2 mc-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="section-num mb-0.5">UPCOMING</div>
              <div className="font-display text-base">Close Approach Timeline</div>
            </div>
            <Link
              href="/neo-tracker"
              className="flex items-center gap-1 font-mono text-[10px] text-primary hover:text-blue-300 transition-colors"
            >
              VIEW ALL <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {chartData?.byMonth?.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData.byMonth} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1063c8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1063c8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="phaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e02a14" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#e02a14" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 9, fontFamily: "Space Mono", fill: "#7e96b4" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fontFamily: "Space Mono", fill: "#7e96b4" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0e18",
                    border: "1px solid #1a2540",
                    borderRadius: "2px",
                    fontFamily: "Space Mono",
                    fontSize: "10px",
                    color: "#dce8f8",
                  }}
                  labelStyle={{ color: "#7e96b4" }}
                />
                <Area type="monotone" dataKey="total" stroke="#1063c8" strokeWidth={1.5} fill="url(#totalGrad)" name="Approaches" />
                <Area type="monotone" dataKey="pha" stroke="#e02a14" strokeWidth={1.5} fill="url(#phaGrad)" name="PHA" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground font-mono text-xs">
              LOADING TRAJECTORY DATA…
            </div>
          )}
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-nasa-blue" />
              <span className="font-mono text-[9px] text-muted-foreground">ALL APPROACHES</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-nasa-red" />
              <span className="font-mono text-[9px] text-muted-foreground">PHA ONLY</span>
            </div>
          </div>
        </div>

        {/* Distance histogram */}
        <div className="mc-card p-4">
          <div className="section-num mb-0.5">DISTRIBUTION</div>
          <div className="font-display text-base mb-3">Approach Distance</div>
          <div className="space-y-3">
            {chartData?.byDistance?.map((b) => {
              const max = Math.max(...(chartData.byDistance?.map((x) => x.count) ?? [1]));
              const pct = max > 0 ? (b.count / max) * 100 : 0;
              return (
                <div key={b.range}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground">{b.range}</span>
                    <span className="font-mono text-[10px] text-foreground">{b.count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: b.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="mt-4 pt-3 border-t border-border space-y-1.5">
            <Link
              href="/neo-tracker"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-sm text-[12px] font-body text-foreground bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
              data-testid="btn-neo-tracker"
            >
              <Orbit className="w-3.5 h-3.5 text-primary" />
              NEO Tracker
            </Link>
            <Link
              href="/catalog"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-sm text-[12px] font-body text-muted-foreground border border-border hover:text-foreground hover:bg-muted transition-colors"
              data-testid="btn-catalog"
            >
              <Database className="w-3.5 h-3.5" />
              Object Catalog
            </Link>
          </div>
        </div>
      </div>

      {/* Mission info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timeline */}
        <div className="mc-card p-4">
          <div className="section-num mb-0.5">02 ——</div>
          <div className="font-display text-base mb-4">Mission Timeline</div>
          <div className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-3">
              {MISSION_EVENTS.map((ev, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-4 w-2 h-2 rounded-full border border-primary bg-background top-1" />
                  <div className="font-mono text-[9px] text-muted-foreground">{ev.date}</div>
                  <div className="font-body text-xs text-foreground">{ev.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Instrument specs */}
        <div className="space-y-3">
          <div className="mc-card-red p-4">
            <div className="flex items-start gap-3">
              <Telescope className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
              <div>
                <div className="font-display text-sm text-foreground">Infrared Telescope</div>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  40 cm aperture cryogenic telescope observing in four infrared bands:
                  3.4, 4.6, 12, and 22 μm. Achieved sensitivity 1,000× greater than IRAS.
                </p>
              </div>
            </div>
          </div>
          <div className="mc-card-amber p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-display text-sm text-foreground">Planetary Defense</div>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  NEOWISE phase (2013–2024) tracked near-Earth asteroids for NASA's
                  planetary defense program, meeting 90% NEO detection mandate.
                </p>
              </div>
            </div>
          </div>
          <div className="mc-card-green p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-display text-sm text-foreground">NEO Surveyor — 2027</div>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Successor mission at Sun-Earth L1 with 50 cm telescope in two IR bands.
                  Will catalog 90% of potentially hazardous asteroids ≥ 140m.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  LayoutDashboard,
  Orbit,
  Database,
  Image,
  ExternalLink,
  Radio,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Mission Overview", icon: LayoutDashboard },
  { href: "/neo-tracker", label: "NEO Tracker", icon: Orbit },
  { href: "/catalog", label: "Object Catalog", icon: Database },
  { href: "/images", label: "Image Explorer", icon: Image },
];

export function AppSidebar() {
  const [location] = useHashLocation();

  return (
    <aside className="flex flex-col w-56 shrink-0 bg-card border-r border-border min-h-screen">
      {/* Top stripe */}
      <div className="nasa-stripe w-full" />

      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          {/* Mission patch SVG */}
          <svg
            viewBox="0 0 32 32"
            className="w-8 h-8 shrink-0"
            aria-label="WISE mission patch"
            fill="none"
          >
            <circle cx="16" cy="16" r="14" stroke="#1063c8" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="4" stroke="#e02a14" strokeWidth="1.5" />
            <line x1="16" y1="2" x2="16" y2="30" stroke="#1063c8" strokeWidth="0.75" />
            <line x1="2" y1="16" x2="30" y2="16" stroke="#1063c8" strokeWidth="0.75" />
            <ellipse cx="16" cy="16" rx="14" ry="6" stroke="#4080e0" strokeWidth="0.75" opacity="0.5" />
            <circle cx="16" cy="2" r="1.5" fill="#e02a14" />
            <circle cx="6" cy="8" r="1" fill="#dce8f8" opacity="0.6" />
            <circle cx="25" cy="25" r="1" fill="#dce8f8" opacity="0.6" />
            <circle cx="28" cy="11" r="0.75" fill="#dce8f8" opacity="0.4" />
          </svg>
          <div>
            <div className="font-display text-sm text-foreground leading-none">WISE</div>
            <div className="font-mono text-[9px] text-muted-foreground mt-0.5 leading-none">
              MISSION CONTROL
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 mt-3">
          <div className="live-dot" />
          <span className="font-mono text-[9px] text-muted-foreground">LIVE · NASA DATA</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2">
        <div className="section-num px-2 mb-2">Navigation</div>
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm transition-colors ${
                    active
                      ? "bg-primary/15 text-foreground border-l-2 border-nasa-blue"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  data-testid={`nav-${href.replace("/", "") || "home"}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="font-body text-[13px]">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="nasa-stripe mt-4 mb-3" />
        <div className="section-num px-2 mb-2">Resources</div>
        <ul className="space-y-0.5">
          <li>
            <a
              href="https://www.jpl.nasa.gov/missions/wide-field-infrared-survey-explorer-wise/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Radio className="w-4 h-4 shrink-0" />
              <span className="font-body text-[13px]">NASA JPL</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
            </a>
          </li>
          <li>
            <a
              href="https://chrislyonsky.github.io/wise-telescope/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span className="font-body text-[13px]">WISE Info Site</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
            </a>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <div className="font-mono text-[9px] text-muted-foreground leading-relaxed">
          DATA: NASA JPL · SBDB<br />
          WISE MISSION: 2009–2024
        </div>
      </div>
    </aside>
  );
}

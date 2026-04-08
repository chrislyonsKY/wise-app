import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Calendar, MapPin, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

interface NasaImage {
  id: number;
  nasaId: string;
  title: string;
  description: string | null;
  dateCreated: string | null;
  photographer: string | null;
  thumbnailUrl: string | null;
  hdUrl: string | null;
  keywords: string | null;
  center: string | null;
  searchQuery: string;
}

interface ImagesResponse {
  images: NasaImage[];
  total: number;
  category: string;
}

const CATEGORIES = [
  { id: "wise", label: "WISE Telescope" },
  { id: "neowise", label: "NEOWISE" },
  { id: "comet", label: "Comets" },
  { id: "neo", label: "Asteroids" },
  { id: "allwise", label: "AllWISE" },
];

function formatDate(iso: string | null) {
  if (!iso) return "";
  return iso.substring(0, 10);
}

function parseKeywords(kw: string | null): string[] {
  if (!kw) return [];
  try {
    const arr = JSON.parse(kw);
    return Array.isArray(arr) ? arr.slice(0, 4) : [];
  } catch {
    return [];
  }
}

function ImageCard({
  img,
  onClick,
}: {
  img: NasaImage;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="mc-card overflow-hidden cursor-pointer group hover:border-primary/50 transition-all"
      onClick={onClick}
      data-testid={`img-card-${img.id}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {img.thumbnailUrl && !imgError ? (
          <img
            src={img.thumbnailUrl}
            alt={img.title}
            crossOrigin="anonymous"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full grid-overlay flex items-center justify-center">
            <div className="font-mono text-[9px] text-muted-foreground text-center px-2">
              {img.title.substring(0, 40).toUpperCase()}
            </div>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
        {img.center && (
          <span className="absolute top-2 right-2 font-mono text-[9px] px-1.5 py-0.5 bg-black/70 text-muted-foreground rounded-sm">
            {img.center}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-body text-xs text-foreground line-clamp-2 leading-snug mb-2">
          {img.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span className="font-mono text-[9px]">{formatDate(img.dateCreated)}</span>
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {parseKeywords(img.keywords).slice(0, 2).map((kw) => (
              <span
                key={kw}
                className="font-mono text-[8px] px-1 py-0.5 bg-muted rounded-sm text-muted-foreground"
              >
                {kw.substring(0, 12)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LightboxModal({
  img,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  img: NasaImage;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="lightbox-modal"
    >
      <div
        className="mc-card max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <div className="font-mono text-[9px] text-muted-foreground">
            {img.nasaId} · {img.center || "NASA"}
          </div>
          <div className="flex items-center gap-2">
            {img.hdUrl && (
              <a
                href={img.hdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-[9px] text-primary hover:text-blue-300 transition-colors"
                data-testid="link-hd"
              >
                HD <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="btn-close-lightbox"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative bg-muted">
          {img.hdUrl && !imgError ? (
            <img
              src={img.hdUrl}
              alt={img.title}
              crossOrigin="anonymous"
              className="w-full max-h-[50vh] object-contain"
              onError={() => setImgError(true)}
            />
          ) : img.thumbnailUrl && !imgError ? (
            <img
              src={img.thumbnailUrl}
              alt={img.title}
              crossOrigin="anonymous"
              className="w-full max-h-[50vh] object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-64 grid-overlay flex items-center justify-center">
              <span className="font-mono text-xs text-muted-foreground">IMAGE UNAVAILABLE</span>
            </div>
          )}

          {/* Nav arrows */}
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-sm flex items-center justify-center transition-colors"
              data-testid="btn-prev-img"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-sm flex items-center justify-center transition-colors"
              data-testid="btn-next-img"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Metadata */}
        <div className="p-4">
          <h2 className="font-display text-base text-foreground mb-2">{img.title}</h2>
          {img.description && (
            <p className="font-body text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-4">
              {img.description}
            </p>
          )}
          <div className="flex flex-wrap gap-3 text-muted-foreground">
            {img.dateCreated && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span className="font-mono text-[9px]">{formatDate(img.dateCreated)}</span>
              </div>
            )}
            {img.photographer && (
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px]">Credit: {img.photographer}</span>
              </div>
            )}
            {img.center && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="font-mono text-[9px]">{img.center}</span>
              </div>
            )}
          </div>
          {parseKeywords(img.keywords).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {parseKeywords(img.keywords).map((kw) => (
                <span
                  key={kw}
                  className="font-mono text-[9px] px-2 py-0.5 bg-muted border border-border rounded-sm text-muted-foreground"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ImageExplorer() {
  const [category, setCategory] = useState("wise");
  const [page, setPage] = useState(1);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const { data, isLoading } = useQuery<ImagesResponse>({
    queryKey: ["/api/images", { category, page, limit: 20 }],
    staleTime: 5 * 60_000,
  });

  const images = data?.images ?? [];
  const total = data?.total ?? 0;
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const selectedImg = selectedIdx != null ? images[selectedIdx] : null;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <div className="nasa-stripe w-full mb-4" />
        <div className="section-num mb-1">04 —— NASA IMAGE LIBRARY</div>
        <h1 className="font-display text-3xl">Image Explorer</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Browse WISE and NEOWISE imagery from the NASA Image and Video Library.
          Infrared sky maps, comet discoveries, and archival mission photographs.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            data-testid={`tab-${cat.id}`}
            onClick={() => { setCategory(cat.id); setPage(1); }}
            className={`shrink-0 px-3 py-1.5 rounded-sm font-mono text-[11px] transition-colors border ${
              category === cat.id
                ? "bg-primary/15 border-primary/40 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] text-muted-foreground">
          {isLoading ? "LOADING…" : `${total} IMAGES`}
        </span>
        {totalPages > 1 && (
          <span className="font-mono text-[10px] text-muted-foreground">
            PAGE {page}/{totalPages}
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="mc-card overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <div className="p-3">
                  <div className="h-3 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))
          : images.map((img, idx) => (
              <ImageCard key={img.id} img={img} onClick={() => setSelectedIdx(idx)} />
            ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="font-mono text-[10px] px-4 py-2 rounded-sm border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            data-testid="btn-prev-page"
          >
            ← PREV
          </button>
          <span className="font-mono text-[10px] text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="font-mono text-[10px] px-4 py-2 rounded-sm border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            data-testid="btn-next-page"
          >
            NEXT →
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && images.length === 0 && (
        <div className="mc-card p-12 text-center">
          <div className="font-mono text-xs text-muted-foreground">NO IMAGES FOUND</div>
          <p className="font-body text-xs text-muted-foreground mt-2">
            Try a different category or check back later.
          </p>
        </div>
      )}

      {/* Lightbox */}
      {selectedImg && (
        <LightboxModal
          img={selectedImg}
          onClose={() => setSelectedIdx(null)}
          onPrev={() => setSelectedIdx((i) => (i != null && i > 0 ? i - 1 : i))}
          onNext={() => setSelectedIdx((i) => (i != null && i < images.length - 1 ? i + 1 : i))}
          hasPrev={(selectedIdx ?? 0) > 0}
          hasNext={(selectedIdx ?? 0) < images.length - 1}
        />
      )}
    </div>
  );
}

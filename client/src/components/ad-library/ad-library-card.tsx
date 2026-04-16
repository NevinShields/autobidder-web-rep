import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Eye, Lock, Sparkles, Star } from "lucide-react";

export type AdLibraryItemRecord = {
  id: number;
  title: string;
  slug: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  previewImageUrl?: string | null;
  assetFileUrl?: string | null;
  assetFileName?: string | null;
  category?: string | null;
  styleTags?: string[];
  serviceTags?: string[];
  tags?: string[];
  featured: boolean;
  active: boolean;
  downloadable: boolean;
  premiumOnly: boolean;
  customizable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  downloadCount?: number;
  access?: {
    canDownload: boolean;
    canSelectForBranding: boolean;
    lockedReason?: string | null;
  };
};

function badgeClasses(kind: "free" | "premium" | "custom" | "featured") {
  switch (kind) {
    case "free":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "premium":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
    case "custom":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300";
    case "featured":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-300";
  }
}

function PreviewSurface({ item }: { item: AdLibraryItemRecord }) {
  if (item.previewImageUrl) {
    return (
      <img
        src={item.previewImageUrl}
        alt={item.title}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.24),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(30,41,59,1)_55%,_rgba(88,28,135,0.95))]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,_transparent,_rgba(255,255,255,0.08))]" />
      <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">
        Ad Preview
      </div>
      <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur-md">
        <div className="text-lg font-semibold text-white">{item.title}</div>
        <div className="mt-2 text-xs leading-6 text-white/70">
          Premium creative ready for service-business promotion.
        </div>
      </div>
    </div>
  );
}

export function AdLibraryCard({
  item,
  selected,
  canCustomize,
  onView,
  onToggleSelect,
  onDownload,
  onUpgrade,
}: {
  item: AdLibraryItemRecord;
  selected: boolean;
  canCustomize: boolean;
  onView: (item: AdLibraryItemRecord) => void;
  onToggleSelect: (item: AdLibraryItemRecord) => void;
  onDownload: (item: AdLibraryItemRecord) => void;
  onUpgrade: () => void;
}) {
  const primaryAction = item.access?.canSelectForBranding
    ? (
        <Button
          size="sm"
          className={selected ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900" : "bg-sky-600 text-white hover:bg-sky-500"}
          onClick={() => onToggleSelect(item)}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {selected ? "Selected" : "Select for Branding"}
        </Button>
      )
    : item.customizable && !canCustomize
      ? (
          <Button size="sm" variant="outline" onClick={onUpgrade}>
            <Lock className="mr-2 h-4 w-4" />
            Upgrade to Access
          </Button>
        )
      : null;

  return (
    <Card className="group overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_28px_70px_-34px_rgba(15,23,42,0.42)] dark:border-slate-800 dark:bg-slate-950/80">
      <div className="relative aspect-[5/4] overflow-hidden border-b border-slate-200/80 bg-slate-950 dark:border-slate-800">
        <PreviewSurface item={item} />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {item.featured && (
            <Badge className={badgeClasses("featured")}>
              <Star className="mr-1 h-3.5 w-3.5" />
              Featured
            </Badge>
          )}
          {item.downloadable && !item.premiumOnly && <Badge className={badgeClasses("free")}>Free Download</Badge>}
          {item.premiumOnly && <Badge className={badgeClasses("premium")}>Paid Plan</Badge>}
          {item.customizable && <Badge className={badgeClasses("custom")}>Customizable</Badge>}
        </div>
      </div>

      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{item.title}</div>
              {item.category && (
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {item.category}
                </div>
              )}
            </div>
            {selected && (
              <div className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                Selected
              </div>
            )}
          </div>
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
            {item.shortDescription || "Premium ad creative designed to help service businesses promote their instant pricing funnel."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[...(item.serviceTags || []), ...(item.styleTags || [])].slice(0, 5).map((tag) => (
            <span
              key={`${item.id}-${tag}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onView(item)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
          {item.downloadable && (
            item.access?.canDownload ? (
              <Button size="sm" variant="outline" onClick={() => onDownload(item)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={onUpgrade}>
                <Lock className="mr-2 h-4 w-4" />
                Upgrade to Access
              </Button>
            )
          )}
          {primaryAction}
        </div>
      </CardContent>
    </Card>
  );
}

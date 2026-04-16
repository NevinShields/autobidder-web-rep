import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Lock, Sparkles, Star } from "lucide-react";
import type { AdLibraryItemRecord } from "./ad-library-card";

export function AdLibraryDetailDialog({
  item,
  open,
  onOpenChange,
  selected,
  canCustomize,
  onToggleSelect,
  onDownload,
  onUpgrade,
}: {
  item: AdLibraryItemRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: boolean;
  canCustomize: boolean;
  onToggleSelect: (item: AdLibraryItemRecord) => void;
  onDownload: (item: AdLibraryItemRecord) => void;
  onUpgrade: () => void;
}) {
  if (!item) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-200 bg-white sm:max-w-4xl dark:border-slate-800 dark:bg-slate-950">
        <DialogHeader className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {item.featured && <Badge className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-300"><Star className="mr-1 h-3.5 w-3.5" />Featured</Badge>}
            {item.downloadable && !item.premiumOnly && <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">Free Download</Badge>}
            {item.premiumOnly && <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">Paid Plan</Badge>}
            {item.customizable && <Badge className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">Customizable</Badge>}
          </div>
          <DialogTitle className="text-3xl tracking-tight text-slate-950 dark:text-white">{item.title}</DialogTitle>
          <DialogDescription className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            {item.fullDescription || item.shortDescription || "Premium ad creative ready for service-business marketing."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 dark:border-slate-800">
            {item.previewImageUrl ? (
              <img src={item.previewImageUrl} alt={item.title} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="aspect-[4/3] bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.24),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(30,41,59,1)_55%,_rgba(88,28,135,0.95))]" />
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Availability</div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                <div>Instant download: <span className="font-semibold text-slate-900 dark:text-white">{item.downloadable ? "Available" : "Not included"}</span></div>
                <div>Brand customization: <span className="font-semibold text-slate-900 dark:text-white">{item.customizable ? "Eligible" : "Not available"}</span></div>
                <div>Plan access: <span className="font-semibold text-slate-900 dark:text-white">{item.premiumOnly ? "Paid plans only" : "Available on free plans"}</span></div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tags</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[...(item.serviceTags || []), ...(item.styleTags || []), ...(item.tags || [])].map((tag) => (
                  <span
                    key={`${item.id}-${tag}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {item.downloadable && (
                item.access?.canDownload ? (
                  <Button onClick={() => onDownload(item)} className="bg-emerald-600 text-white hover:bg-emerald-500">
                    <Download className="mr-2 h-4 w-4" />
                    Download Asset
                  </Button>
                ) : (
                  <Button variant="outline" onClick={onUpgrade}>
                    <Lock className="mr-2 h-4 w-4" />
                    Upgrade to Download
                  </Button>
                )
              )}
              {item.customizable && (
                item.access?.canSelectForBranding ? (
                  <Button onClick={() => onToggleSelect(item)} className={selected ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900" : "bg-sky-600 text-white hover:bg-sky-500"}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {selected ? "Selected for Branding" : "Select for Branding"}
                  </Button>
                ) : canCustomize ? null : (
                  <Button variant="outline" onClick={onUpgrade}>
                    <Lock className="mr-2 h-4 w-4" />
                    Upgrade for Branding
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Play, Video, Loader2, BookOpen } from "lucide-react";

interface SupportVideo {
  id: number;
  title: string;
  description: string | null;
  youtubeUrl: string;
  thumbnailUrl: string | null;
}

interface PageSupportConfig {
  id: number;
  pageKey: string;
  pageName: string;
  isEnabled: boolean;
  videos: SupportVideo[];
}

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    /youtube\.com\/v\/([^&\?\/]+)/,
    /youtube\.com\/shorts\/([^&\?\/]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

interface PageSupportModalProps {
  pageKey: string;
  pageName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PageSupportModal({
  pageKey,
  pageName,
  isOpen,
  onClose,
}: PageSupportModalProps) {
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

  const { data, isLoading } = useQuery<PageSupportConfig>({
    queryKey: [`/api/support/page/${pageKey}`],
    enabled: isOpen,
  });

  const videos = data?.videos || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div className="relative overflow-hidden px-6 pt-6 pb-5 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-800/80 dark:via-gray-900 dark:to-gray-900" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-200/30 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-400/60 font-semibold">Video Guides</p>
              <h2 className="text-xl text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                {pageName} Help
              </h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 flex items-center justify-center mb-3">
                <Loader2 className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 flex items-center justify-center mx-auto mb-4 border border-gray-200/60 dark:border-gray-700/40">
                <Video className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No videos available yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Help videos for this page will appear here</p>
            </div>
          ) : videos.length === 1 ? (
            <div className="space-y-4 mt-1">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  {videos[0].title}
                </h3>
                {videos[0].description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {videos[0].description}
                  </p>
                )}
              </div>
              <VideoEmbed video={videos[0]} />
            </div>
          ) : (
            <Accordion
              type="single"
              collapsible
              value={expandedVideo || undefined}
              onValueChange={setExpandedVideo}
              className="space-y-2 mt-1"
            >
              {videos.map((video, index) => (
                <AccordionItem
                  key={video.id}
                  value={video.id.toString()}
                  className="rounded-xl border border-gray-200/60 dark:border-gray-700/40 overflow-hidden data-[state=open]:bg-white/70 data-[state=open]:dark:bg-gray-800/30 data-[state=open]:shadow-sm px-4 transition-all"
                >
                  <AccordionTrigger className="hover:no-underline py-3.5">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Play className="h-3.5 w-3.5 text-white ml-0.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {video.title}
                        </h4>
                        {video.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-1">
                    <VideoEmbed video={video} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VideoEmbed({ video }: { video: SupportVideo }) {
  const videoId = extractYouTubeVideoId(video.youtubeUrl);

  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/40 flex items-center justify-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">Invalid video URL</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-lg shadow-gray-900/20 dark:shadow-gray-950/40 border border-gray-200/20 dark:border-gray-700/30">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={video.title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

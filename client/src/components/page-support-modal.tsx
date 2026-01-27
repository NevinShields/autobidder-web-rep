import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Play, Video, HelpCircle, Loader2 } from "lucide-react";

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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            {pageName} Help
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No help videos available for this page yet.
            </p>
          </div>
        ) : videos.length === 1 ? (
          // Single video - show directly without accordion
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {videos[0].title}
              </h3>
              {videos[0].description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {videos[0].description}
                </p>
              )}
            </div>
            <VideoEmbed video={videos[0]} />
          </div>
        ) : (
          // Multiple videos - use accordion
          <Accordion
            type="single"
            collapsible
            value={expandedVideo || undefined}
            onValueChange={setExpandedVideo}
            className="space-y-2"
          >
            {videos.map((video) => (
              <AccordionItem
                key={video.id}
                value={video.id.toString()}
                className="border rounded-lg px-4 dark:border-gray-700"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                      <Play className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {video.title}
                      </h4>
                      {video.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <VideoEmbed video={video} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VideoEmbed({ video }: { video: SupportVideo }) {
  const videoId = extractYouTubeVideoId(video.youtubeUrl);

  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Invalid video URL</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 shadow-md">
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

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Play, Sparkles, ArrowRight, Loader2 } from "lucide-react";

interface WelcomeModalConfig {
  title: string;
  description: string | null;
  youtubeUrl: string | null;
  isEnabled: boolean;
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

export function WelcomeModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch welcome modal config
  const { data: config, isLoading } = useQuery<WelcomeModalConfig>({
    queryKey: ["/api/welcome-modal/config"],
    enabled: !!user && !(user as any).welcomeModalShown,
  });

  // Mark as shown mutation
  const markShownMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/welcome-modal/mark-shown"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  // Show modal if user hasn't seen it and config is enabled
  useEffect(() => {
    if (
      user &&
      !(user as any).welcomeModalShown &&
      config?.isEnabled &&
      !isLoading
    ) {
      setIsOpen(true);
    }
  }, [user, config, isLoading]);

  const handleGetStarted = () => {
    setIsOpen(false);
    markShownMutation.mutate();
  };

  const videoId = config?.youtubeUrl
    ? extractYouTubeVideoId(config.youtubeUrl)
    : null;

  // Don't render anything if user has already seen the modal
  if (!user || (user as any).welcomeModalShown) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleGetStarted();
      }
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full w-fit">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {config?.title || "Welcome to Autobidder!"}
          </DialogTitle>
          {config?.description && (
            <DialogDescription className="text-base mt-2">
              {config.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Video Section */}
        {videoId && (
          <div className="my-6">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 shadow-lg">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title="Welcome Video"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Features highlight */}
        {!videoId && (
          <div className="my-6 space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Build Your Calculator
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create custom pricing calculators for your services
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                  <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Capture Leads Automatically
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Embed on your website and start getting qualified leads
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help tip */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Tip:</strong> Look for the{" "}
            <span className="inline-flex items-center gap-1">
              <span className="p-1 bg-gray-200 dark:bg-gray-700 rounded">?</span>
            </span>{" "}
            icon in the header on each page to access helpful tutorial videos.
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleGetStarted}
            disabled={markShownMutation.isPending}
            className="w-full sm:w-auto px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {markShownMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

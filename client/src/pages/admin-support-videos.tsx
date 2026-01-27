import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Video,
  Plus,
  Pencil,
  Trash2,
  Settings,
  Sparkles,
  Loader2,
  Play,
  X,
  GripVertical,
  Check,
  AlertCircle,
} from "lucide-react";

interface SupportVideo {
  id: number;
  title: string;
  description: string | null;
  youtubeUrl: string;
  thumbnailUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface PageSupportConfig {
  id: number;
  pageKey: string;
  pageName: string;
  isEnabled: boolean;
  videoCount?: number;
}

interface WelcomeModalConfig {
  id?: number;
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

export default function AdminSupportVideosPage() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();

  // State for dialogs
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isManagePageDialogOpen, setIsManagePageDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<SupportVideo | null>(null);
  const [managingPage, setManagingPage] = useState<PageSupportConfig | null>(null);

  // Form state
  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
    isActive: true,
  });

  const [welcomeForm, setWelcomeForm] = useState<WelcomeModalConfig>({
    title: "Welcome to Autobidder!",
    description: "",
    youtubeUrl: "",
    isEnabled: true,
  });

  // Queries
  const { data: videos = [], isLoading: videosLoading } = useQuery<SupportVideo[]>({
    queryKey: ["/api/admin/support-videos"],
  });

  const { data: pageConfigs = [], isLoading: configsLoading, refetch: refetchConfigs } = useQuery<PageSupportConfig[]>({
    queryKey: ["/api/admin/page-support-configs"],
  });

  const { data: welcomeConfig, isLoading: welcomeLoading } = useQuery<WelcomeModalConfig>({
    queryKey: ["/api/welcome-modal/config"],
  });

  const { data: pageVideos = [], refetch: refetchPageVideos } = useQuery<(SupportVideo & { assignmentId: number; sortOrder: number })[]>({
    queryKey: [`/api/admin/page-support-configs/${managingPage?.pageKey}/videos`],
    enabled: !!managingPage,
  });

  // Initialize welcome form when data loads
  useEffect(() => {
    if (welcomeConfig) {
      setWelcomeForm({
        title: welcomeConfig.title || "Welcome to Autobidder!",
        description: welcomeConfig.description || "",
        youtubeUrl: welcomeConfig.youtubeUrl || "",
        isEnabled: welcomeConfig.isEnabled,
      });
    }
  }, [welcomeConfig]);

  // Mutations
  const createVideoMutation = useMutation({
    mutationFn: (data: typeof videoForm) =>
      apiRequest("POST", "/api/admin/support-videos", data),
    onSuccess: () => {
      toast({ title: "Video created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-videos"] });
      setIsVideoDialogOpen(false);
      resetVideoForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof videoForm }) =>
      apiRequest("PUT", `/api/admin/support-videos/${id}`, data),
    onSuccess: () => {
      toast({ title: "Video updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-videos"] });
      setIsVideoDialogOpen(false);
      resetVideoForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/support-videos/${id}`),
    onSuccess: () => {
      toast({ title: "Video deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-videos"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateWelcomeMutation = useMutation({
    mutationFn: (data: WelcomeModalConfig) =>
      apiRequest("PUT", "/api/admin/welcome-modal/config", data),
    onSuccess: () => {
      toast({ title: "Welcome modal updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/welcome-modal/config"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const seedPagesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/page-support-configs/seed"),
    onSuccess: () => {
      toast({ title: "Page configurations initialized" });
      refetchConfigs();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePageConfigMutation = useMutation({
    mutationFn: ({ pageKey, isEnabled }: { pageKey: string; isEnabled: boolean }) =>
      apiRequest("PUT", `/api/admin/page-support-configs/${pageKey}`, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-support-configs"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const assignVideoMutation = useMutation({
    mutationFn: ({ pageKey, videoId }: { pageKey: string; videoId: number }) =>
      apiRequest("POST", `/api/admin/page-support-configs/${pageKey}/videos`, { videoId }),
    onSuccess: () => {
      toast({ title: "Video assigned successfully" });
      refetchPageVideos();
      refetchConfigs();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeVideoMutation = useMutation({
    mutationFn: ({ pageKey, videoId }: { pageKey: string; videoId: number }) =>
      apiRequest("DELETE", `/api/admin/page-support-configs/${pageKey}/videos/${videoId}`),
    onSuccess: () => {
      toast({ title: "Video removed successfully" });
      refetchPageVideos();
      refetchConfigs();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetVideoForm = () => {
    setVideoForm({ title: "", description: "", youtubeUrl: "", isActive: true });
    setEditingVideo(null);
  };

  const handleEditVideo = (video: SupportVideo) => {
    setEditingVideo(video);
    setVideoForm({
      title: video.title,
      description: video.description || "",
      youtubeUrl: video.youtubeUrl,
      isActive: video.isActive,
    });
    setIsVideoDialogOpen(true);
  };

  const handleSubmitVideo = () => {
    if (!videoForm.title || !videoForm.youtubeUrl) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (editingVideo) {
      updateVideoMutation.mutate({ id: editingVideo.id, data: videoForm });
    } else {
      createVideoMutation.mutate(videoForm);
    }
  };

  const handleDeleteVideo = (video: SupportVideo) => {
    if (confirm(`Are you sure you want to delete "${video.title}"?`)) {
      deleteVideoMutation.mutate(video.id);
    }
  };

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-gray-600 dark:text-gray-400">
                This page is only accessible to super administrators.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Support Videos Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage welcome modal and page support videos
          </p>
        </div>

        {/* Welcome Modal Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Welcome Modal Configuration
            </CardTitle>
            <CardDescription>
              Configure the welcome modal shown to new users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {welcomeLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="welcome-enabled">Enable Welcome Modal</Label>
                  <Switch
                    id="welcome-enabled"
                    checked={welcomeForm.isEnabled}
                    onCheckedChange={(checked) =>
                      setWelcomeForm((f) => ({ ...f, isEnabled: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-title">Title</Label>
                  <Input
                    id="welcome-title"
                    value={welcomeForm.title}
                    onChange={(e) =>
                      setWelcomeForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="Welcome to Autobidder!"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-description">Description</Label>
                  <Textarea
                    id="welcome-description"
                    value={welcomeForm.description || ""}
                    onChange={(e) =>
                      setWelcomeForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="A brief description for new users..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-video">YouTube Video URL</Label>
                  <Input
                    id="welcome-video"
                    value={welcomeForm.youtubeUrl || ""}
                    onChange={(e) =>
                      setWelcomeForm((f) => ({ ...f, youtubeUrl: e.target.value }))
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {welcomeForm.youtubeUrl && extractYouTubeVideoId(welcomeForm.youtubeUrl) && (
                    <div className="mt-2">
                      <img
                        src={`https://img.youtube.com/vi/${extractYouTubeVideoId(welcomeForm.youtubeUrl)}/mqdefault.jpg`}
                        alt="Video thumbnail"
                        className="rounded-lg w-48"
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => updateWelcomeMutation.mutate(welcomeForm)}
                  disabled={updateWelcomeMutation.isPending}
                >
                  {updateWelcomeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Support Videos Library */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-500" />
                  Support Videos Library
                </CardTitle>
                <CardDescription>
                  Manage all support videos that can be assigned to pages
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  resetVideoForm();
                  setIsVideoDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Video
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {videosLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No videos yet. Create your first support video.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Video</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative w-24 h-14 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
                            {extractYouTubeVideoId(video.youtubeUrl) ? (
                              <img
                                src={`https://img.youtube.com/vi/${extractYouTubeVideoId(video.youtubeUrl)}/mqdefault.jpg`}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{video.title}</p>
                            {video.description && (
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {video.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={video.isActive ? "default" : "secondary"}>
                          {video.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVideo(video)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVideo(video)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Page Configurations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-500" />
                  Page Configurations
                </CardTitle>
                <CardDescription>
                  Enable/disable support and manage videos for each page
                </CardDescription>
              </div>
              {pageConfigs.length === 0 && (
                <Button
                  variant="outline"
                  onClick={() => seedPagesMutation.mutate()}
                  disabled={seedPagesMutation.isPending}
                >
                  {seedPagesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    "Initialize Pages"
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {configsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : pageConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No page configurations yet. Click "Initialize Pages" to set up.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Videos</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{config.pageName}</p>
                          <p className="text-sm text-gray-500">/{config.pageKey}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={config.isEnabled}
                          onCheckedChange={(checked) =>
                            updatePageConfigMutation.mutate({
                              pageKey: config.pageKey,
                              isEnabled: checked,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {config.videoCount || 0} video{(config.videoCount || 0) !== 1 ? "s" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setManagingPage(config);
                            setIsManagePageDialogOpen(true);
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Manage Videos
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Video Create/Edit Dialog */}
        <Dialog open={isVideoDialogOpen} onOpenChange={(open) => {
          if (!open) {
            resetVideoForm();
          }
          setIsVideoDialogOpen(open);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? "Edit Video" : "Add New Video"}
              </DialogTitle>
              <DialogDescription>
                {editingVideo
                  ? "Update the video details"
                  : "Add a new support video to the library"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video-title">Title *</Label>
                <Input
                  id="video-title"
                  value={videoForm.title}
                  onChange={(e) =>
                    setVideoForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Getting Started Guide"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-description">Description</Label>
                <Textarea
                  id="video-description"
                  value={videoForm.description}
                  onChange={(e) =>
                    setVideoForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="A brief description of the video..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-url">YouTube URL *</Label>
                <Input
                  id="video-url"
                  value={videoForm.youtubeUrl}
                  onChange={(e) =>
                    setVideoForm((f) => ({ ...f, youtubeUrl: e.target.value }))
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {videoForm.youtubeUrl && extractYouTubeVideoId(videoForm.youtubeUrl) && (
                  <div className="mt-2">
                    <img
                      src={`https://img.youtube.com/vi/${extractYouTubeVideoId(videoForm.youtubeUrl)}/mqdefault.jpg`}
                      alt="Video thumbnail"
                      className="rounded-lg w-full"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="video-active">Active</Label>
                <Switch
                  id="video-active"
                  checked={videoForm.isActive}
                  onCheckedChange={(checked) =>
                    setVideoForm((f) => ({ ...f, isActive: checked }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitVideo}
                disabled={createVideoMutation.isPending || updateVideoMutation.isPending}
              >
                {(createVideoMutation.isPending || updateVideoMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingVideo ? (
                  "Update Video"
                ) : (
                  "Create Video"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Page Videos Dialog */}
        <Dialog open={isManagePageDialogOpen} onOpenChange={setIsManagePageDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Manage Videos for {managingPage?.pageName}
              </DialogTitle>
              <DialogDescription>
                Add or remove support videos for this page
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Current Videos */}
              <div>
                <Label className="mb-2 block">Assigned Videos</Label>
                {pageVideos.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    No videos assigned to this page yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {pageVideos.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{video.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeVideoMutation.mutate({
                              pageKey: managingPage!.pageKey,
                              videoId: video.id,
                            })
                          }
                          disabled={removeVideoMutation.isPending}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Video */}
              <div>
                <Label className="mb-2 block">Add Video</Label>
                <div className="flex gap-2">
                  <Select
                    onValueChange={(value) => {
                      if (managingPage) {
                        assignVideoMutation.mutate({
                          pageKey: managingPage.pageKey,
                          videoId: parseInt(value),
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a video to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {videos
                        .filter((v) => v.isActive && !pageVideos.find((pv) => pv.id === v.id))
                        .map((video) => (
                          <SelectItem key={video.id} value={video.id.toString()}>
                            {video.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {videos.filter((v) => v.isActive && !pageVideos.find((pv) => pv.id === v.id)).length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    All videos have been assigned to this page.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsManagePageDialogOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

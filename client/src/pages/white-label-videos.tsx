import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Play, Plus, Trash2, Edit2, ExternalLink, Video, Download, FileVideo, Upload } from "lucide-react";
import type { WhiteLabelVideo } from "@shared/schema";

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    /youtube\.com\/v\/([^&\?\/]+)/,
    /youtube\.com\/shorts\/([^&\?\/]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function VideoCard({ video, isAdmin, onEdit, onDelete }: { 
  video: WhiteLabelVideo; 
  isAdmin: boolean;
  onEdit: (video: WhiteLabelVideo) => void;
  onDelete: (id: number) => void;
}) {
  const videoId = video.youtubeUrl ? extractYouTubeVideoId(video.youtubeUrl) : null;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  
  const openVideo = () => {
    if (video.youtubeUrl) {
      window.open(video.youtubeUrl, '_blank');
    }
  };

  const downloadFile = () => {
    if (video.fileUrl) {
      // For object storage URLs, we need to fetch and create a download
      fetch(video.fileUrl)
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = video.fileName || 'video.mp4';
          link.click();
          window.URL.revokeObjectURL(url);
        })
        .catch(() => {
          // Fallback: direct download
          const link = document.createElement('a');
          link.href = video.fileUrl!;
          link.download = video.fileName || 'video.mp4';
          link.click();
        });
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow" data-testid={`video-card-${video.id}`}>
      <div className="relative aspect-video bg-slate-900 cursor-pointer" onClick={openVideo}>
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={video.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        {!thumbnailUrl && (
          <div className="w-full h-full flex items-center justify-center">
            <FileVideo className="w-16 h-16 text-slate-600" />
          </div>
        )}
        {video.youtubeUrl && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-red-600 rounded-full p-4">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
        )}
        {video.category && video.category !== 'general' && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
            {video.category}
          </span>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-2 mb-1" data-testid={`video-title-${video.id}`}>
              {video.title}
            </h3>
            {video.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {video.description}
              </p>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onEdit(video); }}
                data-testid={`edit-video-${video.id}`}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}
                className="text-red-500 hover:text-red-700"
                data-testid={`delete-video-${video.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          {video.youtubeUrl && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={openVideo}
              data-testid={`watch-video-${video.id}`}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Watch
            </Button>
          )}
          {video.fileUrl && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={downloadFile}
              data-testid={`download-video-${video.id}`}
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WhiteLabelVideosPage() {
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<WhiteLabelVideo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
    category: "general",
    fileUrl: null as string | null,
    fileName: null as string | null
  });

  const isAdmin = isSuperAdmin;

  const { data: videos = [], isLoading } = useQuery<WhiteLabelVideo[]>({
    queryKey: ["/api/white-label-videos"]
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/white-label-videos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/white-label-videos"] });
      toast({ title: "Video added successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add video", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await apiRequest("PATCH", `/api/white-label-videos/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/white-label-videos"] });
      toast({ title: "Video updated successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update video", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/white-label-videos/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/white-label-videos"] });
      toast({ title: "Video deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete video", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", youtubeUrl: "", category: "general", fileUrl: null, fileName: null });
    setSelectedFile(null);
    setEditingVideo(null);
    setIsDialogOpen(false);
  };

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/white-label-videos/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!formData.youtubeUrl) {
      toast({ title: "YouTube URL is required", variant: "destructive" });
      return;
    }

    const submitData = async () => {
      let fileUrl = null;
      let fileName = null;

      if (selectedFile) {
        try {
          const uploadResult = await uploadFileMutation.mutateAsync(selectedFile);
          fileUrl = uploadResult.fileUrl;
          fileName = uploadResult.fileName;
        } catch (error) {
          toast({ title: "Failed to upload file", variant: "destructive" });
          return;
        }
      }

      const dataToSend = {
        ...formData,
        fileUrl,
        fileName
      };

      if (editingVideo) {
        updateMutation.mutate({ id: editingVideo.id, data: dataToSend });
      } else {
        createMutation.mutate(dataToSend);
      }
    };

    submitData();
  };

  const handleEdit = (video: WhiteLabelVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || "",
      youtubeUrl: video.youtubeUrl || "",
      category: video.category || "general",
      fileUrl: video.fileUrl || null,
      fileName: video.fileName || null
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      deleteMutation.mutate(id);
    }
  };

  const categories = ["general", "getting-started", "calculators", "leads", "crm", "website", "advanced"];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="white-label-videos-title">White Label Videos</h1>
            <p className="text-muted-foreground">Share YouTube videos and downloadable video content with your clients</p>
          </div>
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button data-testid="add-video-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingVideo ? "Edit Video" : "Add New Video"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Video title"
                      data-testid="input-video-title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">YouTube URL *</label>
                    <Input
                      value={formData.youtubeUrl}
                      onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      data-testid="input-video-url"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Upload Video File (Optional)</label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="video-file-input"
                        data-testid="input-video-file"
                      />
                      <label htmlFor="video-file-input" className="cursor-pointer">
                        {selectedFile ? (
                          <div>
                            <FileVideo className="w-6 h-6 mx-auto mb-2 text-green-600" />
                            <p className="text-sm font-medium text-green-600">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">Click to change</p>
                          </div>
                        ) : (
                          <div>
                            <FileVideo className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Click to upload a video file</p>
                            <p className="text-xs text-muted-foreground">or drag and drop</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this video"
                      rows={3}
                      data-testid="input-video-description"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger data-testid="select-video-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending || uploadFileMutation.isPending}
                      data-testid="submit-video-btn"
                    >
                      {(createMutation.isPending || updateMutation.isPending || uploadFileMutation.isPending)
                        ? "Saving..." 
                        : editingVideo ? "Update" : "Add Video"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin 
                ? "Add your first white label video to share with your clients."
                : "Check back soon for helpful video content."}
            </p>
            {isAdmin && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Video
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isAdmin={isAdmin || false}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

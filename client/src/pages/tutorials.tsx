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
import { Play, Plus, Trash2, Edit2, ExternalLink, Video } from "lucide-react";
import type { Tutorial } from "@shared/schema";

const SUPER_ADMIN_EMAILS = ["admin@autobidder.org", "admin@test.com"];

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

function TutorialCard({ tutorial, isAdmin, onEdit, onDelete }: { 
  tutorial: Tutorial; 
  isAdmin: boolean;
  onEdit: (tutorial: Tutorial) => void;
  onDelete: (id: number) => void;
}) {
  const videoId = extractYouTubeVideoId(tutorial.youtubeUrl);
  const thumbnailUrl = tutorial.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null);
  
  const openVideo = () => {
    window.open(tutorial.youtubeUrl, '_blank');
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow" data-testid={`tutorial-card-${tutorial.id}`}>
      <div className="relative aspect-video bg-slate-900 cursor-pointer" onClick={openVideo}>
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={tutorial.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const fallbackId = videoId;
              if (fallbackId) {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${fallbackId}/hqdefault.jpg`;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-16 h-16 text-slate-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-red-600 rounded-full p-4">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
        {tutorial.category && tutorial.category !== 'general' && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
            {tutorial.category}
          </span>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-2 mb-1" data-testid={`tutorial-title-${tutorial.id}`}>
              {tutorial.title}
            </h3>
            {tutorial.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {tutorial.description}
              </p>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onEdit(tutorial); }}
                data-testid={`edit-tutorial-${tutorial.id}`}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDelete(tutorial.id); }}
                className="text-red-500 hover:text-red-700"
                data-testid={`delete-tutorial-${tutorial.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={openVideo}
          data-testid={`watch-tutorial-${tutorial.id}`}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Watch Tutorial
        </Button>
      </CardContent>
    </Card>
  );
}

export default function TutorialsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
    category: "general"
  });

  const isAdmin = user && SUPER_ADMIN_EMAILS.includes(user.email || "");

  const { data: tutorials = [], isLoading } = useQuery<Tutorial[]>({
    queryKey: ["/api/tutorials"]
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/tutorials", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials"] });
      toast({ title: "Tutorial added successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add tutorial", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await apiRequest("PATCH", `/api/tutorials/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials"] });
      toast({ title: "Tutorial updated successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update tutorial", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/tutorials/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials"] });
      toast({ title: "Tutorial deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete tutorial", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", youtubeUrl: "", category: "general" });
    setEditingTutorial(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.youtubeUrl) {
      toast({ title: "Title and YouTube URL are required", variant: "destructive" });
      return;
    }
    if (editingTutorial) {
      updateMutation.mutate({ id: editingTutorial.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (tutorial: Tutorial) => {
    setEditingTutorial(tutorial);
    setFormData({
      title: tutorial.title,
      description: tutorial.description || "",
      youtubeUrl: tutorial.youtubeUrl,
      category: tutorial.category || "general"
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this tutorial?")) {
      deleteMutation.mutate(id);
    }
  };

  const categories = ["general", "getting-started", "calculators", "leads", "crm", "website", "advanced"];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="tutorials-title">Video Tutorials</h1>
            <p className="text-muted-foreground">Learn how to use AutoBidder with step-by-step video guides</p>
          </div>
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button data-testid="add-tutorial-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tutorial
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingTutorial ? "Edit Tutorial" : "Add New Tutorial"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Tutorial title"
                      data-testid="input-tutorial-title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">YouTube URL *</label>
                    <Input
                      value={formData.youtubeUrl}
                      onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      data-testid="input-tutorial-url"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of what this tutorial covers"
                      rows={3}
                      data-testid="input-tutorial-description"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger data-testid="select-tutorial-category">
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
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="submit-tutorial-btn"
                    >
                      {createMutation.isPending || updateMutation.isPending 
                        ? "Saving..." 
                        : editingTutorial ? "Update" : "Add Tutorial"}
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
        ) : tutorials.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tutorials yet</h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin 
                ? "Add your first tutorial video to help users learn how to use AutoBidder."
                : "Check back soon for helpful tutorial videos."}
            </p>
            {isAdmin && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Tutorial
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((tutorial) => (
              <TutorialCard
                key={tutorial.id}
                tutorial={tutorial}
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

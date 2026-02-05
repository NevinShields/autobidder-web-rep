import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import {
  FileText,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Plus,
  Globe,
  ExternalLink,
  RefreshCw,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BlogPost } from "@shared/schema";

const BLOG_TYPES = [
  { value: "job_showcase", label: "Job Showcase" },
  { value: "expert_opinion", label: "Expert Opinion" },
  { value: "seasonal_tip", label: "Seasonal Tip" },
  { value: "faq_educational", label: "FAQ/Educational" }
];

export default function BlogPostsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deletePost, setDeletePost] = useState<BlogPost | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/blog-posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      setDeletePost(null);
      toast({
        title: "Blog Post Deleted",
        description: "The blog post has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/blog-posts/${id}/sync-to-duda`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({
        title: "Synced to Duda",
        description: "Blog post has been synced to your website.",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync blog post to Duda",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `/api/blog-posts/${id}/publish-to-duda`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({
        title: "Published",
        description: "Blog post is now live on your website.",
      });
    },
    onError: () => {
      toast({
        title: "Publish Failed",
        description: "Failed to publish blog post",
        variant: "destructive",
      });
    },
  });

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.targetCity?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    const matchesType = typeFilter === "all" || post.blogType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string, dudaStatus?: string | null) => {
    if (status === "published" && dudaStatus === "published") {
      return <Badge className="bg-green-100 text-green-800">Live</Badge>;
    }
    if (dudaStatus === "synced") {
      return <Badge className="bg-blue-100 text-blue-800">Synced</Badge>;
    }
    if (status === "scheduled") {
      return <Badge className="bg-purple-100 text-purple-800">Scheduled</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
  };

  const getBlogTypeBadge = (type: string) => {
    const typeInfo = BLOG_TYPES.find(t => t.value === type);
    return <Badge variant="outline">{typeInfo?.label || type}</Badge>;
  };

  // Stats
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === "published").length;
  const draftPosts = posts.filter(p => p.status === "draft").length;
  const avgSeoScore = posts.length > 0
    ? Math.round(posts.reduce((acc, p) => acc + (p.seoScore || 0), 0) / posts.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">Create SEO-optimized blog content for your website</p>
        </div>

        {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg SEO Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSeoScore}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {BLOG_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => navigate("/blog-posts/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Blog Post
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No blog posts</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "No posts match your filters"
                  : "Get started by creating your first blog post"}
              </p>
              {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
                <Button className="mt-4" onClick={() => navigate("/blog-posts/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Blog Post
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SEO Score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-xs truncate">{post.title}</div>
                    </TableCell>
                    <TableCell>{getBlogTypeBadge(post.blogType)}</TableCell>
                    <TableCell>{post.targetCity || "-"}</TableCell>
                    <TableCell>{getStatusBadge(post.status, post.dudaStatus)}</TableCell>
                    <TableCell>
                      {post.seoScore !== null && post.seoScore !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-16 h-2 rounded-full bg-gray-200 overflow-hidden`}>
                            <div
                              className={`h-full ${
                                post.seoScore >= 80 ? 'bg-green-500' :
                                post.seoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${post.seoScore}%` }}
                            />
                          </div>
                          <span className="text-sm">{post.seoScore}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/blog-posts/${post.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => syncMutation.mutate(post.id)}
                            disabled={syncMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync to Duda
                          </DropdownMenuItem>
                          {post.dudaStatus === "synced" && post.status !== "published" && (
                            <DropdownMenuItem
                              onClick={() => publishMutation.mutate(post.id)}
                              disabled={publishMutation.isPending}
                            >
                              <Globe className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {post.dudaLiveUrl && (
                            <DropdownMenuItem
                              onClick={() => window.open(post.dudaLiveUrl!, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Live
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeletePost(post)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePost} onOpenChange={(open) => !open && setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletePost?.title}"? This action cannot be undone.
              {deletePost?.dudaStatus === "published" && (
                <span className="block mt-2 text-orange-600">
                  Note: This will also remove the post from your Duda website.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletePost && deleteMutation.mutate(deletePost.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

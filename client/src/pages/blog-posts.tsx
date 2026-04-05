import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  Edit,
  Trash2,
  Plus,
  Globe,
  ExternalLink,
  RefreshCw,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  CalendarDays,
  MapPin,
  FilterX,
  Sparkles,
  Video
} from "lucide-react";
import { FaFacebookF, FaGoogle } from "react-icons/fa6";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BlogPost } from "@shared/schema";

const BLOG_TYPES = [
  { value: "job_showcase", label: "Job Showcase" },
  { value: "job_type_keyword_targeting", label: "Job Type / Keyword Targeting" },
  { value: "pricing_keyword_targeting", label: "Pricing Keywords Targeting" },
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
        title: "Synced to Website",
        description: "Blog post has been synced to your website.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync blog post to website",
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
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Live</Badge>;
    }
    if (dudaStatus === "synced") {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Synced</Badge>;
    }
    if (status === "scheduled") {
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Scheduled</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-400">Draft</Badge>;
  };

  const getBlogTypeBadge = (type: string) => {
    const typeInfo = BLOG_TYPES.find(t => t.value === type);
    return <Badge variant="outline" className="dark:border-slate-700 dark:text-slate-400">{typeInfo?.label || type}</Badge>;
  };

  // Stats
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === "published").length;
  const draftPosts = posts.filter(p => p.status === "draft").length;
  const avgSeoScore = posts.length > 0
    ? Math.round(posts.reduce((acc, p) => acc + (p.seoScore || 0), 0) / posts.length)
    : 0;

  const hasActiveFilters =
    searchTerm.trim().length > 0 || statusFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const getSeoColorClass = (score?: number | null) => {
    if (score === null || score === undefined) return "bg-slate-300";
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  const renderEnhancementIcons = (post: BlogPost) => {
    const hasFacebook = Boolean(post.facebookPostUrl);
    const hasGmb = Boolean(post.gmbPostUrl);
    const hasVideo = Boolean(post.videoUrl);
    if (!hasFacebook && !hasGmb && !hasVideo) return null;

    return (
      <div className="inline-flex items-center gap-1.5">
        {hasFacebook && (
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
            title="Facebook post linked"
          >
            <FaFacebookF className="h-2.5 w-2.5" />
          </span>
        )}
        {hasGmb && (
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
            title="Google Business Profile post linked"
          >
            <FaGoogle className="h-2.5 w-2.5" />
          </span>
        )}
        {hasVideo && (
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
            title="Video linked"
          >
            <Video className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5 sm:p-6 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-cyan-200 uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                Content Hub
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">Blog Posts</h1>
              <p className="mt-2 text-sm text-slate-200/90 max-w-xl">
                Create, optimize, and publish high-intent local SEO content designed to convert.
              </p>
            </div>
            <Button
              onClick={() => navigate("/blog-posts/new")}
              className="bg-white text-slate-900 hover:bg-slate-100 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Blog Post
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Total Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100">{totalPosts}</p>
                <span className="grid place-items-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <BookOpen className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100">{publishedPosts}</p>
                <span className="grid place-items-center h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100">{draftPosts}</p>
                <span className="grid place-items-center h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Avg SEO Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100">{avgSeoScore}%</p>
                <span className="grid place-items-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-slate-200/90 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div className="space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4" />
                  <Input
                    placeholder="Search by title or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 w-full lg:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 min-w-[130px]">
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
                    <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 min-w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {BLOG_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Showing <span className="font-medium text-slate-900 dark:text-slate-100">{filteredPosts.length}</span> of{" "}
                  <span className="font-medium text-slate-900 dark:text-slate-100">{posts.length}</span> posts
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="dark:border-slate-700 dark:hover:bg-slate-800">
                    <FilterX className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 sm:p-4 bg-white dark:bg-slate-900">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-14 px-4">
                <FileText className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
                <h3 className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">No blog posts found</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {hasActiveFilters
                    ? "No posts match the current filters."
                    : "Get started by creating your first blog post."}
                </p>
                {!hasActiveFilters && (
                  <Button className="mt-4" onClick={() => navigate("/blog-posts/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Blog Post
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-3 p-3 sm:hidden">
                  {filteredPosts.map((post) => (
                    <article key={post.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{post.title}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {getBlogTypeBadge(post.blogType)}
                            {getStatusBadge(post.status, post.dudaStatus)}
                            {renderEnhancementIcons(post)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <div className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{post.targetCity || "No location"}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>{post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy") : "-"}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                          <span>SEO Score</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {post.seoScore !== null && post.seoScore !== undefined ? `${post.seoScore}%` : "-"}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${getSeoColorClass(post.seoScore)}`}
                            style={{ width: `${post.seoScore || 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/blog-posts/${post.id}/edit`)} className="dark:border-slate-700 dark:hover:bg-slate-800">
                          <Edit className="h-4 w-4 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncMutation.mutate(post.id)}
                          disabled={syncMutation.isPending}
                          className="dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <RefreshCw className={`h-4 w-4 mr-1.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                          Sync
                        </Button>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {post.dudaStatus === "synced" && post.status !== "published" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => publishMutation.mutate(post.id)}
                            disabled={publishMutation.isPending}
                            className="dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            <Globe className="h-4 w-4 mr-1.5" />
                            Publish
                          </Button>
                        )}
                        {post.dudaLiveUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(post.dudaLiveUrl!, "_blank")}
                            className="dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            <ExternalLink className="h-4 w-4 mr-1.5" />
                            Live
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400"
                          onClick={() => setDeletePost(post)}
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden sm:block rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                        <TableHead className="dark:text-slate-400">Title</TableHead>
                        <TableHead className="dark:text-slate-400">Type</TableHead>
                        <TableHead className="dark:text-slate-400">Location</TableHead>
                        <TableHead className="dark:text-slate-400">Status</TableHead>
                        <TableHead className="dark:text-slate-400">SEO Score</TableHead>
                        <TableHead className="dark:text-slate-400">Created</TableHead>
                        <TableHead className="text-right dark:text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPosts.map((post) => (
                        <TableRow key={post.id} className="dark:hover:bg-slate-800/50 dark:border-slate-800">
                          <TableCell className="font-medium dark:text-slate-200">
                            <div className="max-w-[320px] truncate">{post.title}</div>
                            <div className="mt-1">{renderEnhancementIcons(post)}</div>
                          </TableCell>
                          <TableCell className="dark:text-slate-300">{getBlogTypeBadge(post.blogType)}</TableCell>
                          <TableCell className="dark:text-slate-300">{post.targetCity || "-"}</TableCell>
                          <TableCell className="dark:text-slate-300">{getStatusBadge(post.status, post.dudaStatus)}</TableCell>
                          <TableCell>
                            {post.seoScore !== null && post.seoScore !== undefined ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full ${getSeoColorClass(post.seoScore)}`}
                                    style={{ width: `${post.seoScore}%` }}
                                  />
                                </div>
                                <span className="text-sm dark:text-slate-300">{post.seoScore}%</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600">-</span>
                            )}
                          </TableCell>
                          <TableCell className="dark:text-slate-300">
                            {post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="dark:hover:bg-slate-800">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
                                <DropdownMenuItem onClick={() => navigate(`/blog-posts/${post.id}/edit`)} className="dark:focus:bg-slate-800">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => syncMutation.mutate(post.id)}
                                  disabled={syncMutation.isPending}
                                  className="dark:focus:bg-slate-800"
                                >
                                  <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                                  Sync to Website
                                </DropdownMenuItem>
                                {post.dudaStatus === "synced" && post.status !== "published" && (
                                  <DropdownMenuItem
                                    onClick={() => publishMutation.mutate(post.id)}
                                    disabled={publishMutation.isPending}
                                    className="dark:focus:bg-slate-800"
                                  >
                                    <Globe className="h-4 w-4 mr-2" />
                                    Publish Live
                                  </DropdownMenuItem>
                                )}
                                {post.dudaLiveUrl && (
                                  <DropdownMenuItem onClick={() => window.open(post.dudaLiveUrl!, "_blank")} className="dark:focus:bg-slate-800">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Live Post
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="dark:bg-slate-800" />
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 dark:focus:bg-red-900/20"
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePost} onOpenChange={(open) => !open && setDeletePost(null)}>
        <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-slate-100">Delete Blog Post?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              Are you sure you want to delete "{deletePost?.title}"? This action cannot be undone.
              {deletePost?.dudaStatus === "published" && (
                <span className="block mt-2 text-orange-600 dark:text-orange-400">
                  Note: This will also remove the post from your website.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deletePost && deleteMutation.mutate(deletePost.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

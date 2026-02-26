import { useState, useEffect } from "react";
import { Link, Redirect } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus, Edit, Trash2, Eye, BookOpen, Tag, Layers, Search, Copy,
  CheckCircle, XCircle, Archive, Globe, FileText, ArrowLeft, ChevronDown, Save, X
} from "lucide-react";

interface KbCategory { id: number; name: string; slug: string; description: string | null; sortOrder: number; }
interface KbTag { id: number; name: string; slug: string; }
interface KbArticle {
  id: number; title: string; slug: string; summary: string | null; content: string;
  categoryId: number | null; status: string; viewCount: number;
  updatedAt: string; publishedAt: string | null;
  tags: KbTag[];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const STATUS_COLORS: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50",
  draft: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600",
  archived: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/50",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  published: <Globe className="w-3 h-3" />,
  draft: <FileText className="w-3 h-3" />,
  archived: <Archive className="w-3 h-3" />,
};

export default function AdminKnowledgeBase() {
  const { isSuperAdmin, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>;
  if (!isSuperAdmin) return <Redirect to="/dashboard" />;

  return (
    <DashboardLayout>
      <KbAdminPanel />
    </DashboardLayout>
  );
}

function KbAdminPanel() {
  const [activeTab, setActiveTab] = useState("articles");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      setActiveTab("articles");
    }
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-2">
            <Link href="/admin"><span className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer">Admin</span></Link>
            <span>/</span>
            <span className="text-gray-700 dark:text-gray-300">Knowledge Base</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Knowledge Base
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage articles, categories, and tags</p>
        </div>
        <Link href="/knowledge-base" target="_blank">
          <Button variant="outline" className="gap-2 rounded-xl dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            <Eye className="w-4 h-4" />
            View Live
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
          <TabsTrigger value="articles" className="rounded-lg gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-gray-400 dark:data-[state=active]:text-white">
            <BookOpen className="w-4 h-4" /> Articles
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-gray-400 dark:data-[state=active]:text-white">
            <Layers className="w-4 h-4" /> Categories
          </TabsTrigger>
          <TabsTrigger value="tags" className="rounded-lg gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-gray-400 dark:data-[state=active]:text-white">
            <Tag className="w-4 h-4" /> Tags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles"><ArticlesTab /></TabsContent>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
        <TabsContent value="tags"><TagsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Articles Tab
// ============================================================
function ArticlesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingArticle, setEditingArticle] = useState<KbArticle | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: articles = [], isLoading } = useQuery<KbArticle[]>({
    queryKey: ["/api/admin/kb/articles"],
    queryFn: () => apiRequest("GET", "/api/admin/kb/articles").then(r => r.json()),
  });

  const { data: categories = [] } = useQuery<KbCategory[]>({
    queryKey: ["/api/admin/kb/categories"],
    queryFn: () => apiRequest("GET", "/api/admin/kb/categories").then(r => r.json()),
  });

  const { data: tags = [] } = useQuery<KbTag[]>({
    queryKey: ["/api/admin/kb/tags"],
    queryFn: () => apiRequest("GET", "/api/admin/kb/tags").then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/kb/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kb/articles"] });
      toast({ title: "Article deleted" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/kb/articles/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kb/articles"] });
      toast({ title: "Article duplicated" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/kb/articles/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kb/articles"] });
      toast({ title: "Status updated" });
    },
  });

  const filtered = articles.filter(a => {
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      {(isCreating || editingArticle) ? (
        <ArticleEditor
          article={editingArticle}
          categories={categories}
          tags={tags}
          onClose={() => { setIsCreating(false); setEditingArticle(null); }}
        />
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 rounded-xl border-gray-200 dark:border-gray-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-sm gap-2 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              New Article
            </Button>
          </div>

          {/* Articles Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No articles found.</p>
              <Button onClick={() => setIsCreating(true)} variant="link" className="text-amber-600 dark:text-amber-400 mt-2">Create your first article →</Button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-5 py-3.5">Title</th>
                      <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Category</th>
                      <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Tags</th>
                      <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                      <th className="text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-5 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filtered.map(article => {
                      const cat = categories.find(c => c.id === article.categoryId);
                      return (
                        <tr key={article.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{article.title}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">/{article.slug}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 hidden sm:table-cell">
                            {cat ? (
                              <span className="text-sm text-gray-600 dark:text-gray-400">{cat.name}</span>
                            ) : (
                              <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {article.tags.slice(0, 3).map(t => (
                                <span key={t.id} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 rounded-full">{t.name}</span>
                              ))}
                              {article.tags.length > 3 && <span className="text-xs text-gray-400 dark:text-gray-500">+{article.tags.length - 3}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[article.status] || STATUS_COLORS.draft}`}>
                              {STATUS_ICONS[article.status]}
                              {article.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {article.status === "published" && (
                                <Link href={`/knowledge-base/article/${article.slug}`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400" title="View">
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                </Link>
                              )}
                              <Button
                                variant="ghost" size="sm"
                                className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                                onClick={() => setEditingArticle(article)}
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="sm"
                                className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => duplicateMutation.mutate(article.id)}
                                title="Duplicate"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              {article.status !== "published" ? (
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400"
                                  onClick={() => statusMutation.mutate({ id: article.id, status: "published" })}
                                  title="Publish"
                                >
                                  <Globe className="w-3.5 h-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-400"
                                  onClick={() => statusMutation.mutate({ id: article.id, status: "draft" })}
                                  title="Unpublish"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost" size="sm"
                                className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                                onClick={() => {
                                  if (confirm("Delete this article?")) deleteMutation.mutate(article.id);
                                }}
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// Article Editor
// ============================================================
function ArticleEditor({
  article, categories, tags, onClose,
}: {
  article: KbArticle | null;
  categories: KbCategory[];
  tags: KbTag[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isNew = !article;

  const [form, setForm] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    summary: article?.summary || "",
    content: article?.content || "",
    categoryId: article?.categoryId ? String(article.categoryId) : "",
    status: article?.status || "draft",
    tagIds: article?.tags?.map(t => t.id) || [] as number[],
  });

  // Auto-gen slug from title for new articles
  useEffect(() => {
    if (isNew && form.title && !form.slug) {
      setForm(f => ({ ...f, slug: slugify(f.title) }));
    }
  }, [form.title, isNew]);

  const saveMutation = useMutation({
    retry: 0,
    mutationFn: (data: any) => {
      if (isNew) {
        return apiRequest("POST", "/api/admin/kb/articles", data).then(r => r.json());
      }
      return apiRequest("PATCH", `/api/admin/kb/articles/${article!.id}`, data).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kb/articles"] });
      toast({ title: isNew ? "Article created" : "Article saved" });
      onClose();
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!form.title.trim()) return toast({ title: "Title is required", variant: "destructive" });
    saveMutation.mutate({
      ...form,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      slug: form.slug || slugify(form.title),
    });
  };

  const toggleTag = (id: number) => {
    setForm(f => ({
      ...f,
      tagIds: f.tagIds.includes(id) ? f.tagIds.filter(t => t !== id) : [...f.tagIds, id],
    }));
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-xl">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isNew ? "New Article" : "Edit Article"}</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">{isNew ? "Create a new knowledge base article" : `Editing: ${article?.title}`}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            <X className="w-4 h-4" /> Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-sm gap-2 rounded-xl"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Saving..." : "Save Article"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title <span className="text-red-500">*</span></Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Article title..."
                className="rounded-xl border-gray-200 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 dark:text-gray-500 flex-shrink-0">/knowledge-base/article/</span>
                <Input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="article-slug"
                  className="rounded-xl border-gray-200 dark:border-gray-600 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Summary</Label>
              <Textarea
                value={form.summary}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="Short description of what this article covers..."
                rows={2}
                className="rounded-xl border-gray-200 dark:border-gray-600 resize-none"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Content
              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-normal">Supports Markdown formatting</span>
            </Label>
            <div className="mb-2 flex flex-wrap gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"># H1</code>
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">## H2</code>
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">### H3</code>
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">#### H4</code>
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">**bold**</code>
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">*italic*</code>
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">- list item</code>
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">[text](url)</code>
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">![alt](img-url)</code>
              <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 rounded">📺 Paste a YouTube URL on its own line to embed</span>
            </div>
            <Textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Write your article content in Markdown..."
              rows={22}
              className="rounded-xl border-gray-200 dark:border-gray-600 resize-y font-mono text-sm"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Publish Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Publish Settings</h3>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</Label>
              <Select value={form.categoryId || "none"} onValueChange={v => setForm(f => ({ ...f, categoryId: v === "none" ? "" : v }))}>
                <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-600">
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Tags</h3>
            {tags.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No tags created yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.tagIds.includes(tag.id)
                        ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-700/50"
                        : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-600"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Categories Tab
// ============================================================
function CategoriesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<KbCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sortOrder: "0" });
  const [showForm, setShowForm] = useState(false);

  const { data: categories = [], isLoading } = useQuery<KbCategory[]>({
    queryKey: ["/api/admin/kb/categories"],
    queryFn: () => apiRequest("GET", "/api/admin/kb/categories").then(r => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingCategory) {
        return apiRequest("PATCH", `/api/admin/kb/categories/${editingCategory.id}`, data).then(r => r.json());
      }
      return apiRequest("POST", "/api/admin/kb/categories", data).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kb/categories"] });
      toast({ title: editingCategory ? "Category updated" : "Category created" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/kb/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kb/categories"] });
      toast({ title: "Category deleted" });
    },
    onError: (e: any) => toast({ title: "Cannot delete", description: "Category has existing articles", variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ name: "", slug: "", description: "", sortOrder: "0" });
    setEditingCategory(null);
    setShowForm(false);
  };

  const startEdit = (cat: KbCategory) => {
    setEditingCategory(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", sortOrder: String(cat.sortOrder) });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    saveMutation.mutate({
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      sortOrder: parseInt(form.sortOrder) || 0,
    });
  };

  return (
    <div className="space-y-5">
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{editingCategory ? "Edit Category" : "New Category"}</h3>
            <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 p-0 rounded-lg dark:text-gray-400 dark:hover:bg-gray-700"><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editingCategory ? f.slug : slugify(e.target.value) }))}
                placeholder="Category name"
                className="rounded-xl border-gray-200 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Slug</Label>
              <Input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="category-slug"
                className="rounded-xl border-gray-200 dark:border-gray-600 font-mono text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this category..."
                rows={2}
                className="rounded-xl border-gray-200 dark:border-gray-600 resize-none"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sort Order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                className="rounded-xl border-gray-200 dark:border-gray-600 w-24"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 gap-2 rounded-xl">
              <Save className="w-4 h-4" />{saveMutation.isPending ? "Saving..." : editingCategory ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={resetForm} className="rounded-xl dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{categories.length} categor{categories.length !== 1 ? "ies" : "y"}</p>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 gap-2 rounded-xl">
            <Plus className="w-4 h-4" />New Category
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Layers className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No categories yet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-5 py-3.5">Name</th>
                <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Slug</th>
                <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Description</th>
                <th className="text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{cat.name}</td>
                  <td className="px-4 py-4 hidden sm:table-cell text-sm font-mono text-gray-400 dark:text-gray-500">{cat.slug}</td>
                  <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{cat.description || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => startEdit(cat)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => { if (confirm("Delete category?")) deleteMutation.mutate(cat.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tags Tab
// ============================================================
function TagsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingTag, setEditingTag] = useState<KbTag | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "" });

  const { data: tags = [], isLoading } = useQuery<KbTag[]>({
    queryKey: ["/api/admin/kb/tags"],
    queryFn: () => apiRequest("GET", "/api/admin/kb/tags").then(r => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingTag) {
        return apiRequest("PATCH", `/api/admin/kb/tags/${editingTag.id}`, data).then(r => r.json());
      }
      return apiRequest("POST", "/api/admin/kb/tags", data).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kb/tags"] });
      toast({ title: editingTag ? "Tag updated" : "Tag created" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/kb/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kb/tags"] });
      toast({ title: "Tag deleted" });
    },
  });

  const resetForm = () => {
    setForm({ name: "", slug: "" });
    setEditingTag(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{editingTag ? "Edit Tag" : "New Tag"}</h3>
            <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 p-0 rounded-lg dark:text-gray-400 dark:hover:bg-gray-700"><X className="w-4 h-4" /></Button>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editingTag ? f.slug : slugify(e.target.value) }))}
                placeholder="Tag name"
                className="rounded-xl border-gray-200 dark:border-gray-600"
              />
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Slug</Label>
              <Input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="tag-slug"
                className="rounded-xl border-gray-200 dark:border-gray-600 font-mono text-sm"
              />
            </div>
            <Button onClick={() => {
              if (!form.name.trim()) return toast({ title: "Name is required", variant: "destructive" });
              saveMutation.mutate({ name: form.name, slug: form.slug || slugify(form.name) });
            }} disabled={saveMutation.isPending} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 gap-2 rounded-xl h-10">
              <Save className="w-4 h-4" />{saveMutation.isPending ? "..." : editingTag ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{tags.length} tag{tags.length !== 1 ? "s" : ""}</p>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 gap-2 rounded-xl">
            <Plus className="w-4 h-4" />New Tag
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" /></div>
      ) : tags.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Tag className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No tags yet.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <Tag className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tag.name}</span>
              <span className="text-xs font-mono text-gray-300 dark:text-gray-600">{tag.slug}</span>
              <div className="flex items-center gap-1 ml-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => { setEditingTag(tag); setForm({ name: tag.name, slug: tag.slug }); setShowForm(true); }}>
                  <Edit className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                  onClick={() => { if (confirm("Delete tag?")) deleteMutation.mutate(tag.id); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen, Clock, Eye, ArrowRight, Tag, ChevronRight, ArrowLeft, Layers, BookMarked
} from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

interface KbCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

interface KbArticle {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  status: string;
  viewCount: number;
  updatedAt: string;
  publishedAt: string | null;
  tags: { id: number; name: string; slug: string }[];
}

function PublicHeader() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={autobidderLogo} alt="Autobidder" className="h-8 w-8" />
              <span className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Autobidder
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Sign In</Button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function CategoryContent() {
  const { slug } = useParams<{ slug: string }>();
  const [sort, setSort] = useState("newest");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/kb/categories", slug, sort, activeTag],
    queryFn: () => {
      const params = new URLSearchParams({ sort });
      if (activeTag) params.set("tag", activeTag);
      return fetch(`/api/kb/categories/${slug}?${params}`).then(r => r.json());
    },
    enabled: !!slug,
  });

  const category: KbCategory | undefined = data?.category;
  const articles: KbArticle[] = data?.articles || [];

  const allTags = Array.from(
    new Map(articles.flatMap(a => a.tags).map(t => [t.id, t])).values()
  );

  const timeAgo = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Category not found</h2>
          <Link href="/knowledge-base">
            <Button variant="ghost" className="text-amber-600 dark:text-amber-400">← Back to Knowledge Base</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Breadcrumb + Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-4">
            <Link href="/knowledge-base">
              <span className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors">Knowledge Base</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 dark:text-white font-medium">{category.name}</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 flex items-center justify-center flex-shrink-0">
              <Layers className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                {category.name}
              </h1>
              {category.description && (
                <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">{category.description}</p>
              )}
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{articles.length} article{articles.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar: Tags */}
          {allTags.length > 0 && (
            <aside className="w-full lg:w-56 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sticky top-24">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Filter by Tag
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTag(null)}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${!activeTag
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                  >
                    All articles
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => setActiveTag(activeTag === tag.slug ? null : tag.slug)}
                      className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${activeTag === tag.slug
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Main: Articles */}
          <div className="flex-1 min-w-0">
            {/* Sort controls */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {articles.length} result{articles.length !== 1 ? "s" : ""}
                {activeTag && <span className="ml-1">· filtered by tag</span>}
              </p>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-40 h-9 text-sm rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                  <SelectItem value="az">A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {articles.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <BookMarked className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No articles found{activeTag ? " for this tag" : ""}.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map(article => (
                  <Link key={article.id} href={`/knowledge-base/article/${article.slug}`} className="block">
                    <div className="group flex items-start gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 hover:border-amber-200 dark:hover:border-amber-700 hover:shadow-md hover:shadow-amber-500/5 transition-all duration-200 cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
                        <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{article.summary}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          {article.tags.slice(0, 4).map(tag => (
                            <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
                              <Tag className="w-2.5 h-2.5" />
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.viewCount.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(article.updatedAt)}</span>
                        <ArrowRight className="w-4 h-4 text-amber-400 dark:text-amber-500 mt-1 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link href="/knowledge-base">
                <Button variant="ghost" className="text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeBaseCategoryPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <DashboardLayout>
        <CategoryContent />
      </DashboardLayout>
    );
  }

  return (
    <>
      <PublicHeader />
      <CategoryContent />
    </>
  );
}

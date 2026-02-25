import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search, BookOpen, Clock, Eye, ArrowRight, Tag, ChevronRight, BookMarked, Layers
} from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";
import { apiRequest } from "@/lib/queryClient";

interface KbCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  articleCount: number;
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
  categoryId: number | null;
}

function estimateReadTime(content: string): number {
  const words = (content || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function PublicHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={autobidderLogo} alt="Autobidder" className="h-8 w-8" />
              <span className="text-[15px] font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Autobidder
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/knowledge-base">
              <span className="text-sm font-medium text-amber-600 hover:text-amber-700 cursor-pointer">Knowledge Base</span>
            </Link>
            <Link href="/pricing">
              <span className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer">Pricing</span>
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-sm shadow-amber-500/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function KbContent() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: categories = [] } = useQuery<KbCategory[]>({
    queryKey: ["/api/kb/categories"],
    queryFn: () => fetch("/api/kb/categories").then(r => r.json()),
  });

  const { data: popular = [] } = useQuery<KbArticle[]>({
    queryKey: ["/api/kb/articles/popular"],
    queryFn: () => fetch("/api/kb/articles/popular?limit=6").then(r => r.json()),
  });

  const { data: recent = [] } = useQuery<KbArticle[]>({
    queryKey: ["/api/kb/articles/recent"],
    queryFn: () => fetch("/api/kb/articles/recent?limit=6").then(r => r.json()),
  });

  const { data: searchResults = [], isFetching: isSearching } = useQuery<KbArticle[]>({
    queryKey: ["/api/kb/search", debouncedSearch],
    queryFn: () => fetch(`/api/kb/search?q=${encodeURIComponent(debouncedSearch)}`).then(r => r.json()),
    enabled: debouncedSearch.trim().length > 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/knowledge-base?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-200/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200/60 mb-6">
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700 tracking-wide uppercase">Knowledge Base</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            How can we help you?
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            Browse guides, tutorials, and documentation to get the most out of Autobidder.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles, guides, topics..."
                className="w-full pl-12 pr-32 py-4 text-base border border-gray-200 rounded-2xl bg-white shadow-lg shadow-gray-100/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-sm rounded-xl px-5"
              >
                Search
              </Button>
            </div>

            {/* Live search dropdown */}
            {debouncedSearch.trim().length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 max-h-80 overflow-y-auto">
                {isSearching ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">No results found for "{debouncedSearch}"</div>
                ) : (
                  <div className="py-2">
                    {searchResults.slice(0, 6).map(a => (
                      <Link key={a.id} href={`/knowledge-base/article/${a.slug}`}>
                        <div className="flex items-start gap-3 px-4 py-3 hover:bg-amber-50 cursor-pointer transition-colors">
                          <BookMarked className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">{a.title}</p>
                            {a.summary && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{a.summary}</p>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Categories Grid */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Browse by Category
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat, i) => {
                const colors = [
                  "from-amber-50 to-amber-100/50 border-amber-200/60 text-amber-700",
                  "from-blue-50 to-blue-100/50 border-blue-200/60 text-blue-700",
                  "from-emerald-50 to-emerald-100/50 border-emerald-200/60 text-emerald-700",
                  "from-purple-50 to-purple-100/50 border-purple-200/60 text-purple-700",
                  "from-rose-50 to-rose-100/50 border-rose-200/60 text-rose-700",
                  "from-cyan-50 to-cyan-100/50 border-cyan-200/60 text-cyan-700",
                ];
                const colorClass = colors[i % colors.length];
                return (
                  <Link key={cat.id} href={`/knowledge-base/category/${cat.slug}`}>
                    <div className={`group relative flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br ${colorClass} border hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5`}>
                      <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors">
                        <Layers className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">{cat.name}</h3>
                        {cat.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
                        )}
                        <p className="text-xs font-medium mt-2 opacity-70">{cat.articleCount} article{cat.articleCount !== 1 ? "s" : ""}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0 mt-1 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Popular Articles */}
        {popular.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Popular Articles
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popular.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Updated */}
        {recent.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Recently Updated
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {categories.length === 0 && popular.length === 0 && (
          <div className="text-center py-24">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Knowledge Base Coming Soon</h3>
            <p className="text-gray-400">Articles and guides are being added. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: KbArticle }) {
  const timeAgo = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Link href={`/knowledge-base/article/${article.slug}`}>
      <div className="group flex flex-col h-full p-5 rounded-2xl bg-white border border-gray-200/80 hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-2 mb-2">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{article.summary}</p>
          )}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {article.tags.slice(0, 3).map(tag => (
                <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500">
                  <Tag className="w-2.5 h-2.5" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {article.viewCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(article.updatedAt)}
          </span>
          <span className="ml-auto flex items-center gap-1 text-amber-500 font-medium group-hover:gap-2 transition-all">
            Read <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function KnowledgeBaseHome() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <DashboardLayout>
        <KbContent />
      </DashboardLayout>
    );
  }

  return (
    <>
      <PublicHeader />
      <KbContent />
    </>
  );
}

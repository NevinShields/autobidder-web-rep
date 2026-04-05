import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Clock, Eye, Tag, ChevronRight, ArrowLeft, ThumbsUp, ThumbsDown,
  List, ArrowRight, BookMarked, Calendar, Edit
} from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

interface KbArticle {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  status: string;
  viewCount: number;
  updatedAt: string;
  publishedAt: string | null;
  tags: { id: number; name: string; slug: string }[];
  category: { id: number; name: string; slug: string } | null;
  related: Array<{
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    viewCount: number;
    updatedAt: string;
  }>;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function estimateReadTime(content: string): number {
  const words = (content || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function buildToc(content: string): TocItem[] {
  const items: TocItem[] = [];
  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    items.push({ id, text, level });
  }
  return items;
}

function extractYouTubeId(url: string): string | null {
  // Handles: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function renderContent(content: string): string {
  // Pre-process: replace bare YouTube URLs on their own line with an embed placeholder
  // This must happen before HTML escaping so URLs aren't mangled
  const preprocessed = content
    .split("\n")
    .map(line => {
      const trimmed = line.trim();
      if (/^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(trimmed)) {
        const id = extractYouTubeId(trimmed);
        if (id) return `__YT_EMBED_${id}__`;
      }
      return line;
    })
    .join("\n");

  // Convert markdown-like content to HTML
  let html = preprocessed
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headings (longest prefix first to avoid partial matches)
    .replace(/^#### (.+)$/gm, (_, t) => {
      const id = t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return `<h4 id="${id}" class="text-base font-semibold text-gray-900 mt-6 mb-2">${t}</h4>`;
    })
    .replace(/^### (.+)$/gm, (_, t) => {
      const id = t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return `<h3 id="${id}" class="text-xl font-bold text-gray-900 mt-8 mb-3">${t}</h3>`;
    })
    .replace(/^## (.+)$/gm, (_, t) => {
      const id = t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return `<h2 id="${id}" class="text-2xl font-bold text-gray-900 mt-10 mb-4">${t}</h2>`;
    })
    .replace(/^# (.+)$/gm, (_, t) => {
      const id = t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return `<h1 id="${id}" class="text-3xl font-bold text-gray-900 mt-10 mb-4">${t}</h1>`;
    })
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono">$1</code>')
    // Callout blocks: > [!NOTE], > [!TIP], > [!WARNING]
    .replace(/^&gt; \[!NOTE\]\n&gt; (.+)$/gm, '<div class="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm my-4">💡 $1</div>')
    .replace(/^&gt; \[!TIP\]\n&gt; (.+)$/gm, '<div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm my-4">✅ $1</div>')
    .replace(/^&gt; \[!WARNING\]\n&gt; (.+)$/gm, '<div class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm my-4">⚠️ $1</div>')
    // Blockquotes
    .replace(/^&gt; (.+)$/gm, '<blockquote class="pl-4 border-l-4 border-amber-400 text-gray-600 italic my-4">$1</blockquote>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li class="text-gray-700 mb-1 ml-4">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="text-gray-700 mb-1 ml-4 list-decimal">$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-600 hover:text-amber-700 underline">$1</a>')
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-amber-600 hover:text-amber-700 underline">$1</a>')
    // YouTube embeds: bare URL placeholders (pre-processed above)
    .replace(/__YT_EMBED_([A-Za-z0-9_-]{11})__/g, (_, id) =>
      `<div class="relative w-full pt-[56.25%] my-6 rounded-2xl overflow-hidden shadow-lg"><iframe class="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
    )
    // YouTube embeds: explicit syntax ![youtube](url)
    .replace(/!\[youtube\]\((https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\)\s]+)[^\)]*)\)/g, (_, url, videoId) => {
      return `<div class="relative w-full pt-[56.25%] my-6 rounded-2xl overflow-hidden shadow-lg"><iframe class="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
    })
    // Images
    .replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-xl my-4 shadow-sm" loading="lazy" />')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-8 border-gray-200" />')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, "</p><p class=\"text-gray-700 leading-relaxed mb-4\">")
    // Wrap li items in ul
    .replace(/(<li[^>]*>[^<]+<\/li>\n?)+/g, m => {
      if (m.includes("list-decimal")) {
        return `<ol class="list-decimal pl-6 my-4 space-y-1">${m}</ol>`;
      }
      return `<ul class="list-disc pl-6 my-4 space-y-1">${m}</ul>`;
    });

  return `<p class="text-gray-700 leading-relaxed mb-4">${html}</p>`;
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

function ArticleContent() {
  const { slug } = useParams<{ slug: string }>();
  const [helpful, setHelpful] = useState<null | boolean>(null);
  const [activeToc, setActiveToc] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  // Fixed: handle case where useAuth might be called in a context where it's not available or returns undefined
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated;
  const isSuperAdmin = auth?.isSuperAdmin;

  const { data: article, isLoading, error } = useQuery<KbArticle>({
    queryKey: ["/api/kb/articles", slug],
    queryFn: () => fetch(`/api/kb/articles/${slug}`).then(r => {
      if (!r.ok) throw new Error("Article not found");
      return r.json();
    }),
    enabled: !!slug,
  });

  const toc = article ? buildToc(article.content) : [];
  const readTime = article ? estimateReadTime(article.content) : 1;

  // Track active heading in viewport
  useEffect(() => {
    if (!toc.length) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.find(e => e.isIntersecting);
        if (visible) setActiveToc(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    toc.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);

  const handleFeedback = (isHelpful: boolean) => {
    setHelpful(isHelpful);
    toast({
      title: isHelpful ? "Thanks for the feedback!" : "Thanks for letting us know",
      description: isHelpful
        ? "We're glad this article was helpful."
        : "We'll work on improving this article.",
    });
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Article not found</h2>
          <Link href="/knowledge-base">
            <Button variant="ghost" className="text-amber-600 dark:text-amber-400">← Back to Knowledge Base</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 flex-wrap">
            <Link href="/knowledge-base">
              <span className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors">Knowledge Base</span>
            </Link>
            {article.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                <Link href={`/knowledge-base/category/${article.category.slug}`}>
                  <span className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors">{article.category.name}</span>
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 font-medium line-clamp-1">{article.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8 items-start">
          {/* Main Article */}
          <div className="flex-1 min-w-0">
            {/* Article Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-6">
              {article.category && (
                <Link href={`/knowledge-base/category/${article.category.slug}`}>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-4 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors">
                    <BookOpen className="w-3 h-3" />
                    {article.category.name}
                  </span>
                </Link>
              )}

              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  {article.title}
                </h1>
                {isSuperAdmin && (
                  <Link href={`/admin/knowledge-base?edit=${article.id}`}>
                    <Button variant="outline" size="sm" className="flex-shrink-0 gap-1.5 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-600 dark:border-gray-600 dark:bg-transparent rounded-xl">
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  </Link>
                )}
              </div>

              {article.summary && (
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">{article.summary}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-gray-400 dark:text-gray-500 pt-5 border-t border-gray-100 dark:border-gray-700">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Updated {formatDate(article.updatedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {readTime} min read
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {article.viewCount.toLocaleString()} views
                </span>
              </div>

              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {article.tags.map(tag => (
                    <Link key={tag.id} href={`/knowledge-base/category/${article.category?.slug || ""}?tag=${tag.slug}`}>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-700 dark:hover:text-amber-400 text-xs text-gray-500 dark:text-gray-400 cursor-pointer transition-colors">
                        <Tag className="w-2.5 h-2.5" />
                        {tag.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Article Content — dark mode handled via .kb-article-content CSS in index.css */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-10 mb-6">
              <div
                ref={contentRef}
                className="prose prose-gray max-w-none kb-article-content"
                dangerouslySetInnerHTML={{ __html: renderContent(article.content) }}
              />
            </div>

            {/* Feedback */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 text-center">
              {helpful === null ? (
                <>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Was this article helpful?</p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleFeedback(true)}
                      className="gap-2 rounded-xl dark:border-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Yes, helpful
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleFeedback(false)}
                      className="gap-2 rounded-xl dark:border-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-700 dark:hover:text-rose-400"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Not helpful
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {helpful ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm flex items-center gap-1.5">
                      <ThumbsUp className="w-4 h-4" /> Thanks for the positive feedback!
                    </span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400 font-medium text-sm flex items-center gap-1.5">
                      <ThumbsDown className="w-4 h-4" /> Thanks — we'll improve this article.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Related Articles */}
            {article.related.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Related Articles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {article.related.map(rel => (
                    <Link key={rel.id} href={`/knowledge-base/article/${rel.slug}`}>
                      <div className="group flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/80 hover:border-amber-200 dark:hover:border-amber-700 hover:shadow-sm cursor-pointer transition-all">
                        <BookMarked className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-none sm:line-clamp-2">{rel.title}</p>
                          {rel.summary && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{rel.summary}</p>}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link href={article.category ? `/knowledge-base/category/${article.category.slug}` : "/knowledge-base"}>
                <Button variant="ghost" className="text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {article.category ? `Back to ${article.category.name}` : "Back to Knowledge Base"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Table of Contents Sidebar */}
          {toc.length > 2 && (
            <aside className="hidden xl:block w-56 flex-shrink-0 sticky top-24">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <List className="w-3.5 h-3.5" />
                  On this page
                </h3>
                <nav className="space-y-1">
                  {toc.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm py-1 transition-colors ${
                        item.level === 1 ? "font-semibold" : item.level === 2 ? "pl-2" : item.level === 3 ? "pl-4" : "pl-6"
                      } ${
                        activeToc === item.id
                          ? "text-amber-600 dark:text-amber-400 font-medium"
                          : "text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeBaseArticlePage() {
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
        <ArticleContent />
      </DashboardLayout>
    );
  }

  return (
    <>
      <PublicHeader />
      <ArticleContent />
    </>
  );
}

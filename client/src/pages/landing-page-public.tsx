import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import LandingPageView, { type LandingPagePublicData } from "@/components/landing-page-view";
import { Button } from "@/components/ui/button";

export default function LandingPagePublic() {
  const { slug } = useParams<{ slug: string }>();
  const isPreviewMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    const preview = params.get("preview");
    return preview === "1" || preview === "true";
  }, []);
  const localPreviewData = useMemo<LandingPagePublicData | null>(() => {
    if (!isPreviewMode || !slug || typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("landing_page_draft_preview");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.slug !== slug || !parsed?.data || typeof parsed.data !== "object") {
        return null;
      }
      return parsed.data as LandingPagePublicData;
    } catch {
      return null;
    }
  }, [isPreviewMode, slug]);

  const { data, isLoading, error } = useQuery<LandingPagePublicData>({
    queryKey: ["/api/landing-page/public", slug, isPreviewMode],
    queryFn: async () => {
      const params = new URLSearchParams({ slug: slug || "" });
      if (isPreviewMode) {
        params.set("preview", "1");
      }
      const res = await fetch(`/api/landing-page/public?${params.toString()}`);
      if (!res.ok) {
        throw new Error(String(res.status));
      }
      return res.json();
    },
    enabled: !!slug && !localPreviewData,
  });
  const resolvedData = localPreviewData || data || null;

  const isNotFound = useMemo(() => {
    if (resolvedData) return false;
    if (!error) return false;
    return (error as any).message === "404" || (error as any).message === "400";
  }, [error, resolvedData]);

  useEffect(() => {
    if (isNotFound) {
      const meta = document.querySelector('meta[name="robots"]');
      if (meta) {
        meta.setAttribute("content", "noindex, nofollow");
      } else {
        const tag = document.createElement("meta");
        tag.name = "robots";
        tag.content = "noindex, nofollow";
        document.head.appendChild(tag);
      }
      return;
    }

    if (resolvedData) {
      document.title = resolvedData.seoTitle || resolvedData.businessName || "Landing Page";
      const desc = resolvedData.seoDescription || resolvedData.tagline || "";
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", desc);
      } else {
        const tag = document.createElement("meta");
        tag.name = "description";
        tag.content = desc;
        document.head.appendChild(tag);
      }

      if (resolvedData.landingPageUrl) {
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!canonical) {
          canonical = document.createElement("link");
          canonical.rel = "canonical";
          document.head.appendChild(canonical);
        }
        canonical.href = resolvedData.landingPageUrl;
      }

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: resolvedData.businessName,
        url: resolvedData.landingPageUrl,
        telephone: resolvedData.phone || undefined,
        email: resolvedData.email || undefined,
        areaServed: resolvedData.serviceAreaText || undefined,
      };
      if (resolvedData.businessName && resolvedData.landingPageUrl) {
        let script = document.querySelector("script[data-landing-jsonld]") as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement("script");
          script.type = "application/ld+json";
          script.dataset.landingJsonld = "true";
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(jsonLd);
      }
    }
  }, [resolvedData, isNotFound]);

  useEffect(() => {
    if (!resolvedData) return;
    fetch("/api/landing-page/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landingPageId: resolvedData.id, type: "view" })
    }).catch(() => {});
  }, [resolvedData]);

  if (isLoading && !resolvedData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Page Not Available</h1>
          <p className="text-gray-500">This landing page isn’t published yet.</p>
          <Button onClick={() => (window.location.href = "/")}>Back to Autobidder</Button>
        </div>
      </div>
    );
  }

  if (!resolvedData) {
    return null;
  }

  return (
    <LandingPageView
      data={resolvedData}
      onLeadSubmitted={() => {
        fetch("/api/landing-page/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ landingPageId: resolvedData.id, type: "lead_submit" })
        }).catch(() => {});
      }}
    />
  );
}

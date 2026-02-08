import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import LandingPageView, { type LandingPagePublicData } from "@/components/landing-page-view";
import { Button } from "@/components/ui/button";

export default function LandingPagePublic() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery<LandingPagePublicData>({
    queryKey: ["/api/landing-page/public", slug],
    queryFn: async () => {
      const res = await fetch(`/api/landing-page/public?slug=${encodeURIComponent(slug || "")}`);
      if (!res.ok) {
        throw new Error(String(res.status));
      }
      return res.json();
    },
    enabled: !!slug,
  });

  const isNotFound = useMemo(() => {
    if (!error) return false;
    return (error as any).message === "404" || (error as any).message === "400";
  }, [error]);

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

    if (data) {
      document.title = data.seoTitle || data.businessName || "Landing Page";
      const desc = data.seoDescription || data.tagline || "";
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", desc);
      } else {
        const tag = document.createElement("meta");
        tag.name = "description";
        tag.content = desc;
        document.head.appendChild(tag);
      }

      if (data.landingPageUrl) {
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!canonical) {
          canonical = document.createElement("link");
          canonical.rel = "canonical";
          document.head.appendChild(canonical);
        }
        canonical.href = data.landingPageUrl;
      }

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: data.businessName,
        url: data.landingPageUrl,
        telephone: data.phone || undefined,
        email: data.email || undefined,
        areaServed: data.serviceAreaText || undefined,
      };
      if (data.businessName && data.landingPageUrl) {
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
  }, [data, isNotFound]);

  useEffect(() => {
    if (!data) return;
    fetch("/api/landing-page/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landingPageId: data.id, type: "view" })
    }).catch(() => {});
  }, [data]);

  if (isLoading) {
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

  if (!data) {
    return null;
  }

  return (
    <LandingPageView
      data={data}
      onLeadSubmitted={() => {
        fetch("/api/landing-page/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ landingPageId: data.id, type: "lead_submit" })
        }).catch(() => {});
      }}
    />
  );
}

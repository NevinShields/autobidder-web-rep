import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";

type ShareLinkLookup = {
  userId: string;
  shareSlug: string | null;
};

export default function PublicCalculatorShare() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery<ShareLinkLookup>({
    queryKey: ["/api/public/share-links", slug],
    queryFn: async () => {
      const response = await fetch(`/api/public/share-links/${encodeURIComponent(slug || "")}`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message || "Failed to resolve share link");
      }
      return body;
    },
    enabled: !!slug,
    retry: false,
  });

  useEffect(() => {
    if (!data?.userId) return;

    const params = new URLSearchParams(window.location.search);
    params.set("userId", data.userId);
    window.location.replace(`/styled-calculator?${params.toString()}`);
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-sm text-gray-500">Opening pricing form...</div>
      </div>
    );
  }

  if (error || !slug) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">Link not found</h1>
          <p className="mt-2 text-sm text-gray-500">This pricing form link is invalid or no longer available.</p>
        </div>
      </div>
    );
  }

  return null;
}

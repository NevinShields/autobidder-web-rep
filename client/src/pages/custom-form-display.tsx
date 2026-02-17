import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";

type CustomFormResponse = {
  form: {
    id: number;
    accountId: string;
    slug: string;
    enabled: boolean;
  };
  formulas: Array<{
    id: number;
  }>;
};

export default function CustomFormDisplay() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute<{ accountId: string; slug: string }>("/f/:accountId/:slug");

  const accountId = params?.accountId;
  const slug = params?.slug;

  const { data, isLoading, error } = useQuery<CustomFormResponse>({
    queryKey: ["/api/public/forms", accountId, slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/forms/${accountId}/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch form data");
      return res.json();
    },
    enabled: !!match && !!accountId && !!slug,
    retry: false,
  });

  useEffect(() => {
    if (!data?.form?.id || !accountId) return;

    const currentParams = new URLSearchParams(window.location.search);
    const targetParams = new URLSearchParams(currentParams);
    targetParams.set("userId", accountId);
    const serviceIds = (data.formulas || []).map((f) => f.id).filter((id) => Number.isFinite(id));
    if (serviceIds.length > 0) {
      targetParams.set("serviceIds", serviceIds.join(","));
    }

    const query = targetParams.toString();
    const target = `/custom-form/${data.form.id}${query ? `?${query}` : ""}`;
    setLocation(target, { replace: true });
  }, [data?.form?.id, data?.formulas, accountId, setLocation]);

  if (!match || !accountId || !slug) {
    return (
      <div className="force-light-mode min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Invalid Form URL</h1>
          <p className="text-gray-600">This custom form URL is not valid.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="force-light-mode min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Loading Form</h1>
          <p className="text-gray-600">Preparing your custom form experience...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.form?.id) {
    return (
      <div className="force-light-mode min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Form Not Found</h1>
          <p className="text-gray-600">This custom form doesn&apos;t exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="force-light-mode min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Redirecting</h1>
        <p className="text-gray-600">Opening the latest calculator experience...</p>
      </div>
    </div>
  );
}

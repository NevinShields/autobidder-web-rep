import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  MapPin,
  Globe,
  Phone,
  Building2,
  Calculator,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForceLightMode } from "@/hooks/use-force-light-mode";

interface DirectoryProfile {
  id: number;
  userId: string;
  companySlug: string;
  companyName: string;
  companyDescription: string | null;
  companyLogoUrl: string | null;
  websiteUrl: string | null;
  phoneNumber: string | null;
  email: string | null;
  city: string;
  state: string;
  zipCode: string | null;
  metaDescription: string | null;
  totalServices: number;
}

interface ServiceListing {
  id: number;
  formulaId: number;
  categoryId: number;
  customDisplayName: string | null;
  displayOrder: number;
  formulaName: string;
  formulaTitle: string;
  formulaDescription: string | null;
  formulaEmbedId: string;
  formulaIconUrl: string | null;
  categoryName: string;
  categorySlug: string;
}

interface CompanyResponse {
  profile: DirectoryProfile;
  services: ServiceListing[];
  isIndexable: boolean;
  landingPageUrl?: string | null;
  landingPagePublished?: boolean;
  isFreePlan?: boolean;
}

export default function DirectoryCompanyPage() {
  useForceLightMode();
  const { companySlug } = useParams<{ companySlug: string }>();
  const [showAllServices, setShowAllServices] = useState(true);

  const { data, isLoading, error } = useQuery<CompanyResponse>({
    queryKey: [`/api/public/directory/company/${companySlug}`],
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h1>
          <p className="text-gray-600 mb-4">This company doesn't exist or is no longer listed.</p>
          <Link href="/directory">
            <Button>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const profile = data?.profile;
  const services = data?.services || [];
  const landingPageUrl = data?.landingPageUrl || null;
  const landingPagePublished = data?.landingPagePublished || false;
  const isFreePlan = data?.isFreePlan || false;
  const websiteUrl = isFreePlan ? landingPageUrl : (profile?.websiteUrl || landingPageUrl);
  const websiteAvailable = isFreePlan ? landingPagePublished : Boolean(profile?.websiteUrl || landingPagePublished);

  // SEO: Set page title and meta description
  useEffect(() => {
    if (profile) {
      document.title = `${profile.companyName} Prices & Cost Calculator | ${profile.city}, ${profile.state}`;
      const desc = `Check prices and costs from ${profile.companyName} in ${profile.city}, ${profile.state}. Use free pricing calculators to get instant quotes for ${profile.totalServices} service${profile.totalServices !== 1 ? 's' : ''}.`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", desc);
      } else {
        const tag = document.createElement("meta");
        tag.name = "description";
        tag.content = desc;
        document.head.appendChild(tag);
      }
      if (!landingPagePublished) {
        const robots = document.querySelector('meta[name="robots"]');
        if (robots) {
          robots.setAttribute("content", "noindex, nofollow");
        } else {
          const tag = document.createElement("meta");
          tag.name = "robots";
          tag.content = "noindex, nofollow";
          document.head.appendChild(tag);
        }
      }
    }
  }, [profile, landingPagePublished]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top accent + nav */}
      <div className="bg-white border-b border-gray-100">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500" />
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link href="/directory">
            <Button variant="ghost" size="sm" className="-ml-2 text-gray-500 hover:text-gray-900">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* Company Profile Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
          {isLoading ? (
            <div className="flex gap-6">
              <Skeleton className="w-20 h-20 rounded-xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full max-w-lg" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                {profile?.companyLogoUrl ? (
                  <img
                    src={profile.companyLogoUrl}
                    alt={profile.companyName}
                    className="w-20 h-20 object-contain rounded-xl border border-gray-100 bg-white shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm">
                    <Building2 className="h-10 w-10 text-blue-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {profile?.companyName}
                  </h1>
                  <Badge className="bg-blue-50 text-blue-700 border-0 rounded-full px-3 py-1 mt-1">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>

                <p className="text-gray-400 flex items-center gap-1.5 mb-3">
                  <MapPin className="h-4 w-4" />
                  {profile?.city}, {profile?.state} {profile?.zipCode}
                </p>

                {profile?.companyDescription && (
                  <p className="text-gray-600 mb-5 max-w-2xl leading-relaxed">
                    {profile.companyDescription}
                  </p>
                )}

                {/* Contact Info - pill style */}
                <div className="flex flex-wrap gap-2">
                  {websiteAvailable && websiteUrl ? (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full px-4 py-2 transition-colors"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-full px-4 py-2">
                      <Globe className="h-3.5 w-3.5" />
                      Website Unavailable
                    </div>
                  )}
                  {profile?.phoneNumber && (
                    <a
                      href={`tel:${profile.phoneNumber}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {profile.phoneNumber}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Pricing Calculators
          </h2>
          <Badge className="bg-emerald-50 text-emerald-700 border-0 rounded-full px-3 py-1">
            <Zap className="h-3 w-3 mr-1" />
            Check Prices & Costs
          </Badge>
        </div>

        {/* View All Services - shown first */}
        {profile && !isLoading && (
          <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden hover:shadow-md hover:border-blue-200/80 transition-all duration-200">
            <button
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
              onClick={() => setShowAllServices(!showAllServices)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 text-lg">
                    View All Price Calculators
                  </h3>
                  <p className="text-sm text-gray-500">
                    Check prices and calculate costs for all services offered by {profile.companyName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge className="bg-emerald-50 text-emerald-700 border-0 rounded-full hidden sm:flex">
                  <Zap className="h-3 w-3 mr-1" />
                  Free Calculator
                </Badge>
                {showAllServices ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>

            {showAllServices && (
              <div className="border-t border-gray-100">
                <div className="p-4 bg-gray-50/50">
                  <iframe
                    src={`/styled-calculator?userId=${profile.userId}`}
                    className="w-full min-h-[800px] border-0 rounded-lg bg-white"
                    title={`${profile.companyName} - All Services`}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state when no services at all */}
        {!isLoading && services.length === 0 && !profile && (
          <div className="bg-white rounded-xl border border-gray-200/80 text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calculator className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No pricing calculators listed yet
            </h3>
            <p className="text-gray-500">
              This company hasn't added any services to their profile yet.
            </p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.2),transparent)]" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
            Are you a service provider?
          </h2>
          <p className="text-blue-200/80 mb-8 max-w-xl mx-auto leading-relaxed">
            List your business and let customers check your prices instantly with a free cost calculator.
          </p>
          <Link href="/directory-setup">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 font-semibold rounded-xl px-8 shadow-lg">
              List Your Business
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>Powered by <a href="/" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">Autobidder</a> — Instant Pricing Calculators for Service Businesses</p>
        </div>
      </footer>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MapPin, Building2, Calculator, Zap, ShieldCheck, ArrowRight, Users } from "lucide-react";
import { useEffect } from "react";
import { useForceLightMode } from "@/hooks/use-force-light-mode";
import { DirectoryPricingReference, type DirectoryPricingReferenceRow } from "@/components/directory-pricing-reference";
import { DirectoryCityFaq } from "@/components/directory-city-faq";

interface DirectoryCategory {
  id: number;
  name: string;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

interface BusinessListing {
  id: number;
  companySlug: string;
  companyName: string;
  companyDescription: string | null;
  companyLogoUrl: string | null;
  city: string;
  state: string;
  totalServices: number;
}

interface ListingsResponse {
  category: DirectoryCategory | null;
  city: string;
  state: string;
  listings: BusinessListing[];
  isIndexable: boolean;
  pricingReference: {
    title: string;
    intro: string;
    rows: DirectoryPricingReferenceRow[];
    sourceCount: number;
  } | null;
}

export default function DirectoryCityCategoryPage() {
  useForceLightMode();
  const { categorySlug, citySlug } = useParams<{ categorySlug: string; citySlug: string }>();

  const { data, isLoading, error } = useQuery<ListingsResponse>({
    queryKey: [`/api/public/directory/listings/${categorySlug}/${citySlug}`],
  });

  // Parse city name from slug if data not loaded yet
  const displayCity = data?.city || citySlug?.split('-').slice(0, -1).join(' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
  const displayState = data?.state || citySlug?.split('-').pop()?.toUpperCase() || '';

  const listingCount = data?.listings?.length || 0;

  // SEO: Set page title and meta description with price/cost/calculator keywords
  useEffect(() => {
    if (data?.category && data?.city) {
      const name = data.category.name;
      const city = data.city;
      const state = data.state;
      document.title = `${name} Prices in ${city}, ${state}`;
      const desc = `Check ${name.toLowerCase()} prices and costs in ${city}, ${state}. Use our free cost calculator to compare pricing from ${listingCount} verified local ${name.toLowerCase()} provider${listingCount !== 1 ? 's' : ''}.`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", desc);
      } else {
        const tag = document.createElement("meta");
        tag.name = "description";
        tag.content = desc;
        document.head.appendChild(tag);
      }
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) {
        robots.setAttribute("content", "index, follow");
      } else {
        const tag = document.createElement("meta");
        tag.name = "robots";
        tag.content = "index, follow";
        document.head.appendChild(tag);
      }
    }
  }, [data?.category, data?.city, data?.state, listingCount]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-4">This location or category doesn't exist.</p>
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500" />
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm mb-5">
            <Link href="/directory" className="text-gray-400 hover:text-blue-600 transition-colors">
              Directory
            </Link>
            <span className="text-gray-300">/</span>
            <Link href={`/prices/${categorySlug}`} className="text-gray-400 hover:text-blue-600 transition-colors">
              {data?.category?.name || categorySlug}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">{displayCity}, {displayState}</span>
          </nav>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-96" />
              <Skeleton className="h-5 w-64" />
            </div>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">
                {data?.category?.name} Prices in {displayCity}, {displayState}
              </h1>
              <p className="text-gray-500 mb-3">
                Compare {data?.category?.name?.toLowerCase()} costs and get instant pricing from {listingCount} verified local provider{listingCount !== 1 ? 's' : ''}.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-emerald-50 text-emerald-700 border-0 rounded-full px-3 py-1">
                  <Zap className="h-3 w-3 mr-1" />
                  Free Cost Calculator
                </Badge>
                <Badge className="bg-blue-50 text-blue-700 border-0 rounded-full px-3 py-1">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Verified Providers
                </Badge>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : listingCount === 0 ? (
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No pricing calculators in this area yet
            </h3>
            <p className="text-gray-500 mb-6">
              Be the first to list {data?.category?.name?.toLowerCase()} prices and costs in {displayCity}!
            </p>
            <Link href="/directory-setup">
              <Button className="rounded-lg">List Your Business</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {data?.listings?.map((business) => (
              <Link key={business.id} href={`/directory/company/${business.companySlug}`}>
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/80 p-4 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_14px_40px_rgba(37,99,235,0.10)] hover:border-blue-200/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/80 to-transparent opacity-70" />
                  <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                    {/* Logo */}
                    <div className="flex shrink-0 items-center gap-3 sm:block">
                      {business.companyLogoUrl ? (
                        <img
                          src={business.companyLogoUrl}
                          alt={business.companyName}
                          className="h-14 w-14 sm:w-16 sm:h-16 object-contain rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm"
                        />
                      ) : (
                        <div className="h-14 w-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-blue-100">
                          <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
                        </div>
                      )}
                      <Badge className="sm:hidden bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] rounded-full px-2.5 py-1 shrink-0">
                        <Zap className="h-3 w-3 mr-1" />
                        Instant Pricing
                      </Badge>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-[1.05rem] sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                            {business.companyName}
                          </h3>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {business.city}, {business.state}
                          </p>
                        </div>
                        <Badge className="hidden sm:inline-flex bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs rounded-full px-2.5 py-1 shrink-0">
                          <Zap className="h-3 w-3 mr-1" />
                          Instant Pricing
                        </Badge>
                      </div>

                      {business.companyDescription && (
                        <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-slate-600">
                          {business.companyDescription}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2.5">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                          <Calculator className="h-3.5 w-3.5 text-slate-500" />
                          {business.totalServices} calculator{business.totalServices !== 1 ? "s" : ""}
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                          <Users className="h-3.5 w-3.5" />
                          Verified provider
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
                        <span className="text-xs text-slate-400">
                          Open company pricing page
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                          Check Prices
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && data?.pricingReference && (
          <div className="mt-12">
            <DirectoryPricingReference
              title={data.pricingReference.title}
              intro={data.pricingReference.intro}
              rows={data.pricingReference.rows}
              sourceCount={data.pricingReference.sourceCount}
            />
          </div>
        )}

        {!isLoading && data?.category && data?.city && data?.state && data?.pricingReference && (
          <DirectoryCityFaq
            categoryName={data.category.name}
            city={data.city}
            state={data.state}
            listingCount={listingCount}
            rows={data.pricingReference.rows}
          />
        )}
      </div>

      {/* Related Categories */}
      <div className="bg-gray-50/50 border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            More Price Calculators in {displayCity}
          </h2>
          <p className="text-gray-500">
            Looking to check prices for other services?{" "}
            <Link href="/directory" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Browse all service cost calculators
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>Powered by <a href="/" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">Autobidder</a> — Instant Pricing Calculators for Service Businesses</p>
        </div>
      </footer>
    </div>
  );
}

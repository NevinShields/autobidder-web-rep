import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MapPin, Building2, Calculator, Zap, ShieldCheck, ArrowRight, Users } from "lucide-react";
import { useEffect } from "react";
import { useForceLightMode } from "@/hooks/use-force-light-mode";

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

  const listingCount = data?.listings?.length || 0;

  // SEO: Set page title and meta description with price/cost/calculator keywords
  useEffect(() => {
    if (data?.category && data?.city) {
      const name = data.category.name;
      const city = data.city;
      const state = data.state;
      document.title = `${name} Prices in ${city}, ${state} | Cost Calculator & Local Providers`;
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
    }
  }, [data?.category, data?.city, data?.state, listingCount]);

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
          <div className="space-y-4">
            {data?.listings?.map((business) => (
              <Link key={business.id} href={`/directory/company/${business.companySlug}`}>
                <div className="group bg-white rounded-xl border border-gray-200/80 p-6 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                  <div className="flex gap-5">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                      {business.companyLogoUrl ? (
                        <img
                          src={business.companyLogoUrl}
                          alt={business.companyName}
                          className="w-16 h-16 object-contain rounded-xl border border-gray-100 bg-white"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-blue-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {business.companyName}
                          </h3>
                          <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {business.city}, {business.state}
                          </p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs rounded-full px-2.5 py-1 shrink-0">
                          <Zap className="h-3 w-3 mr-1" />
                          Price Calculator
                        </Badge>
                      </div>

                      {business.companyDescription && (
                        <p className="text-gray-500 mt-2.5 line-clamp-2 text-sm leading-relaxed">
                          {business.companyDescription}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Calculator className="h-3.5 w-3.5" />
                          {business.totalServices} pricing calculator{business.totalServices !== 1 ? 's' : ''} available
                        </span>
                        <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5 transition-colors">
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

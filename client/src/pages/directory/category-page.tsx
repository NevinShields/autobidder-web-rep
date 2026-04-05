import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronLeft, MapPin, Search, Building2, ArrowRight, Zap, ShieldCheck, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useForceLightMode } from "@/hooks/use-force-light-mode";

interface DirectoryCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

interface CityInfo {
  city: string;
  state: string;
  citySlug: string;
  profileCount: number;
}

interface CategoryCitiesResponse {
  category: DirectoryCategory;
  cities: CityInfo[];
}

export default function DirectoryCategoryPage() {
  useForceLightMode();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery<CategoryCitiesResponse>({
    queryKey: [`/api/public/directory/cities/${categorySlug}`],
  });

  const filteredCities = data?.cities?.filter(city =>
    city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.state.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Group cities by state
  const citiesByState = filteredCities.reduce((acc, city) => {
    if (!acc[city.state]) {
      acc[city.state] = [];
    }
    acc[city.state].push(city);
    return acc;
  }, {} as Record<string, CityInfo[]>);

  const sortedStates = Object.keys(citiesByState).sort();

  const totalProviders = filteredCities.reduce((sum, c) => sum + c.profileCount, 0);

  // SEO: Set page title and meta description
  useEffect(() => {
    if (data?.category) {
      const name = data.category.name;
      document.title = `${name} Prices`;
      const desc = data.category.seoDescription || `Check ${name.toLowerCase()} prices and costs in your city. Use our free ${name.toLowerCase()} cost calculator to compare prices from verified local providers.`;
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
  }, [data?.category]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h1>
          <p className="text-gray-600 mb-4">This service category doesn't exist or isn't available yet.</p>
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
          <Link href="/directory">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-gray-500 hover:text-gray-900">
              <ChevronLeft className="h-4 w-4 mr-1" />
              All Services
            </Button>
          </Link>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-96" />
            </div>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">
                {data?.category?.name} Prices
              </h1>
              <p className="text-gray-500 max-w-2xl text-lg leading-relaxed">
                {data?.category?.seoDescription || `Compare ${data?.category?.name?.toLowerCase()} prices and costs in your city. Use our free calculator to get instant pricing from verified local providers.`}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <Badge className="bg-emerald-50 text-emerald-700 border-0 rounded-full px-3 py-1">
                  <Zap className="h-3 w-3 mr-1" />
                  Free Price Calculator
                </Badge>
                <Badge className="bg-blue-50 text-blue-700 border-0 rounded-full px-3 py-1">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Verified Providers
                </Badge>
                {totalProviders > 0 && (
                  <span className="text-sm text-gray-400 flex items-center gap-1.5 ml-1">
                    <Users className="h-3.5 w-3.5" />
                    {totalProviders} provider{totalProviders !== 1 ? 's' : ''} across {filteredCities.length} {filteredCities.length !== 1 ? 'cities' : 'city'}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search & Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by city or state..."
              className="pl-11 h-11 rounded-xl border-gray-200 focus:border-blue-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : filteredCities.length === 0 ? (
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No cities match your search" : "No price calculators listed yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "Try a different search term."
                : `Be the first to list ${data?.category?.name?.toLowerCase()} prices and costs in your area!`}
            </p>
            {!searchQuery && (
              <Link href="/directory-setup">
                <Button className="rounded-lg">List Your Business</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {sortedStates.map((state) => (
              <div key={state}>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  {state}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {citiesByState[state].map((city) => (
                    <Link
                      key={city.citySlug}
                      href={`/prices/${categorySlug}/${city.citySlug}`}
                    >
                      <div className="group bg-white rounded-xl border border-gray-200/80 p-4 hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-200/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-200">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {city.city}
                            </h3>
                            <p className="text-xs text-gray-400">
                              {city.profileCount} provider{city.profileCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-200" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>Powered by <a href="/" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">Autobidder</a> — Instant Pricing Calculators for Service Businesses</p>
        </div>
      </footer>
    </div>
  );
}

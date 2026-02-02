import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, MapPin, Search, Building2 } from "lucide-react";
import { useState } from "react";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/directory">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-1" />
              All Services
            </Button>
          </Link>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-96" />
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {data?.category?.seoTitle || `${data?.category?.name} Services`}
              </h1>
              <p className="text-gray-600 max-w-2xl">
                {data?.category?.seoDescription || `Find local ${data?.category?.name?.toLowerCase()} professionals with instant pricing in your city.`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Search & Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by city or state..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : filteredCities.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No cities match your search" : "No providers listed yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? "Try a different search term."
                  : `Be the first ${data?.category?.name?.toLowerCase()} provider in your area!`}
              </p>
              {!searchQuery && (
                <Link href="/directory-setup">
                  <Button>List Your Business</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedStates.map((state) => (
              <div key={state}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                  {state}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {citiesByState[state].map((city) => (
                    <Link
                      key={city.citySlug}
                      href={`/quotes/${categorySlug}/${city.citySlug}`}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {city.city}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {city.profileCount} provider{city.profileCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Powered by Autobidder - Instant Pricing Calculators for Service Businesses</p>
        </div>
      </footer>
    </div>
  );
}

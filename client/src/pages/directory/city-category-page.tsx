import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MapPin, Globe, Phone, Building2, Calculator, Star } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/directory" className="hover:text-blue-600">Directory</Link>
            <span>/</span>
            <Link href={`/quotes/${categorySlug}`} className="hover:text-blue-600">
              {data?.category?.name || categorySlug}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{displayCity}, {displayState}</span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-96" />
              <Skeleton className="h-5 w-64" />
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {data?.category?.name} in {displayCity}, {displayState}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {data?.listings?.length || 0} local provider{(data?.listings?.length || 0) !== 1 ? 's' : ''} with instant pricing
              </p>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : (data?.listings?.length || 0) === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No providers in this area yet
              </h3>
              <p className="text-gray-500 mb-4">
                Be the first {data?.category?.name?.toLowerCase()} provider in {displayCity}!
              </p>
              <Link href="/directory-setup">
                <Button>List Your Business</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data?.listings?.map((business) => (
              <Link key={business.id} href={`/directory/company/${business.companySlug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Logo */}
                      <div className="flex-shrink-0">
                        {business.companyLogoUrl ? (
                          <img
                            src={business.companyLogoUrl}
                            alt={business.companyName}
                            className="w-20 h-20 object-contain rounded-lg border"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-10 w-10 text-blue-600" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                              {business.companyName}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {business.city}, {business.state}
                            </p>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Calculator className="h-3 w-3" />
                            Instant Pricing
                          </Badge>
                        </div>

                        {business.companyDescription && (
                          <p className="text-gray-600 mt-3 line-clamp-2">
                            {business.companyDescription}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-4">
                          <span className="text-sm text-gray-500">
                            {business.totalServices} service{business.totalServices !== 1 ? 's' : ''} available
                          </span>
                          <Button size="sm" className="ml-auto">
                            View Services & Get Quote
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Related Categories */}
      <div className="bg-white border-t py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            More Services in {displayCity}
          </h2>
          <p className="text-gray-500">
            Looking for other services? <Link href="/directory" className="text-blue-600 hover:underline">Browse all categories</Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Powered by Autobidder - Instant Pricing Calculators for Service Businesses</p>
        </div>
      </footer>
    </div>
  );
}

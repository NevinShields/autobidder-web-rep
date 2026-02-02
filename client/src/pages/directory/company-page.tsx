import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  MapPin,
  Globe,
  Phone,
  Mail,
  Building2,
  Calculator,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface DirectoryProfile {
  id: number;
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
}

export default function DirectoryCompanyPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [expandedService, setExpandedService] = useState<number | null>(null);

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

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    const cat = service.categoryName;
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(service);
    return acc;
  }, {} as Record<string, ServiceListing[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/directory">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* Company Profile Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex gap-6">
              <Skeleton className="w-24 h-24 rounded-lg" />
              <div className="flex-1 space-y-2">
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
                    className="w-24 h-24 object-contain rounded-lg border bg-white"
                  />
                ) : (
                  <div className="w-24 h-24 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-blue-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile?.companyName}
                </h1>
                <p className="text-gray-500 flex items-center gap-1 mb-3">
                  <MapPin className="h-4 w-4" />
                  {profile?.city}, {profile?.state} {profile?.zipCode}
                </p>

                {profile?.companyDescription && (
                  <p className="text-gray-600 mb-4 max-w-2xl">
                    {profile.companyDescription}
                  </p>
                )}

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4">
                  {profile?.websiteUrl && (
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Visit Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {profile?.phoneNumber && (
                    <a
                      href={`tel:${profile.phoneNumber}`}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                    >
                      <Phone className="h-4 w-4" />
                      {profile.phoneNumber}
                    </a>
                  )}
                  {profile?.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                    >
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Calculator className="h-6 w-6 text-blue-600" />
          Services with Instant Pricing
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No services listed yet
              </h3>
              <p className="text-gray-500">
                This company hasn't added any services to their profile yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
              <div key={category}>
                <Badge variant="outline" className="mb-3">
                  {category}
                </Badge>
                <div className="space-y-3">
                  {categoryServices.map((service) => (
                    <Card key={service.id}>
                      <CardContent className="p-0">
                        {/* Service Header - Always visible */}
                        <button
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          onClick={() =>
                            setExpandedService(
                              expandedService === service.id ? null : service.id
                            )
                          }
                        >
                          <div className="flex items-center gap-4">
                            {service.formulaIconUrl ? (
                              <img
                                src={service.formulaIconUrl}
                                alt=""
                                className="w-12 h-12 object-contain"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Calculator className="h-6 w-6 text-blue-600" />
                              </div>
                            )}
                            <div className="text-left">
                              <h3 className="font-semibold text-gray-900">
                                {service.customDisplayName || service.formulaTitle || service.formulaName}
                              </h3>
                              {service.formulaDescription && (
                                <p className="text-sm text-gray-500 line-clamp-1">
                                  {service.formulaDescription}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">Get Quote</Badge>
                            {expandedService === service.id ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Calculator */}
                        {expandedService === service.id && (
                          <div className="border-t">
                            <div className="p-4 bg-gray-50">
                              <iframe
                                src={`/embed/${service.formulaEmbedId}?embedded=true`}
                                className="w-full min-h-[600px] border-0 rounded-lg bg-white"
                                title={`${service.formulaName} Calculator`}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Are you a service provider?
          </h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            List your business in our directory and let customers get instant quotes with your pricing calculator.
          </p>
          <Link href="/directory-setup">
            <Button variant="secondary" size="lg">
              List Your Business
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Powered by Autobidder - Instant Pricing Calculators for Service Businesses</p>
        </div>
      </footer>
    </div>
  );
}

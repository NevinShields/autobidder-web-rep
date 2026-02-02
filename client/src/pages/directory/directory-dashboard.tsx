import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ChevronLeft,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Settings,
  ExternalLink,
  Calculator,
  AlertCircle,
} from "lucide-react";

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
  isActive: boolean;
  showOnDirectory: boolean;
  totalServices: number;
}

interface ServiceListing {
  id: number;
  formulaId: number;
  categoryId: number;
  isActive: boolean;
  formulaName: string;
  categoryName: string;
  categorySlug: string;
}

interface ServiceArea {
  id: number;
  areaType: string;
  radiusMiles: number | null;
  cities: Array<{ city: string; state: string }> | null;
}

export default function DirectoryDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery<DirectoryProfile | null>({
    queryKey: ["/api/directory/profile"],
  });

  const { data: services } = useQuery<ServiceListing[]>({
    queryKey: ["/api/directory/services"],
    enabled: !!profile,
  });

  const { data: areas } = useQuery<ServiceArea[]>({
    queryKey: ["/api/directory/service-areas"],
    enabled: !!profile,
  });

  const toggleVisibility = useMutation({
    mutationFn: (showOnDirectory: boolean) =>
      apiRequest("/api/directory/profile", { method: "PATCH", body: JSON.stringify({ showOnDirectory }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/directory/profile"] });
      toast({ title: "Visibility updated!" });
    },
    onError: () => toast({ title: "Failed to update visibility", variant: "destructive" }),
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-48 rounded-lg mb-6" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Directory Listing Yet
            </h2>
            <p className="text-gray-500 mb-6">
              Create your listing to get found by homeowners looking for your services.
            </p>
            <Link href="/directory-setup">
              <Button size="lg">
                Create Your Listing
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const area = areas?.[0];
  const serviceCount = services?.length || 0;
  const hasIncompleteSetup = serviceCount === 0 || !area;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Directory Listing</h1>
              <p className="text-gray-600">Manage how your business appears in the directory</p>
            </div>
            <Link href="/directory-setup">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Edit Listing
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Warning Banner */}
        {hasIncompleteSetup && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="py-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Complete Your Listing</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {serviceCount === 0 && "Add at least one service to appear in search results. "}
                  {!area && "Define your service area so customers can find you. "}
                </p>
                <Link href="/directory-setup">
                  <Button size="sm" variant="outline" className="mt-2">
                    Complete Setup
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visibility Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {profile.showOnDirectory ? (
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <EyeOff className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {profile.showOnDirectory ? "Your listing is live" : "Your listing is hidden"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {profile.showOnDirectory
                      ? "Customers can find you in the directory"
                      : "Your listing won't appear in search results"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={profile.showOnDirectory}
                  onCheckedChange={checked => toggleVisibility.mutate(checked)}
                  disabled={toggleVisibility.isPending || hasIncompleteSetup}
                />
                {profile.showOnDirectory && (
                  <Link href={`/directory/company/${profile.companySlug}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {profile.companyLogoUrl ? (
                <img
                  src={profile.companyLogoUrl}
                  alt=""
                  className="w-20 h-20 object-contain rounded-lg border"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{profile.companyName}</h3>
                <p className="text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {profile.city}, {profile.state} {profile.zipCode}
                </p>
                {profile.companyDescription && (
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                    {profile.companyDescription}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  {profile.websiteUrl && (
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      Website
                    </a>
                  )}
                  {profile.phoneNumber && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Phone className="h-3 w-3" />
                      {profile.phoneNumber}
                    </span>
                  )}
                  {profile.email && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Mail className="h-3 w-3" />
                      {profile.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Listed Services
              </CardTitle>
              <Badge variant="secondary">{serviceCount} service{serviceCount !== 1 ? 's' : ''}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {serviceCount === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No services listed yet</p>
                <Link href="/directory-setup">
                  <Button variant="outline" size="sm" className="mt-2">
                    Add Services
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {services?.map(service => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{service.formulaName}</p>
                      <p className="text-sm text-gray-500">Category: {service.categoryName}</p>
                    </div>
                    <Badge variant={service.isActive ? "default" : "secondary"}>
                      {service.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Area Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Service Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!area ? (
              <div className="text-center py-6 text-gray-500">
                <p>No service area defined</p>
                <Link href="/directory-setup">
                  <Button variant="outline" size="sm" className="mt-2">
                    Define Service Area
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                {area.areaType === "radius" ? (
                  <p className="text-gray-700">
                    <span className="font-medium">{area.radiusMiles} mile radius</span> from {profile.city}, {profile.state}
                  </p>
                ) : area.areaType === "cities" && area.cities ? (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Serving {area.cities.length} cities:</p>
                    <div className="flex flex-wrap gap-2">
                      {area.cities.map((city, i) => (
                        <Badge key={i} variant="outline">
                          {city.city}, {city.state}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Service area type: {area.areaType}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Directory Performance</CardTitle>
            <CardDescription>Coming soon: See how many views and leads your listing generates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-500">Profile Views</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-500">Calculator Opens</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-500">Leads Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

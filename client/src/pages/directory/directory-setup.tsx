import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ChevronLeft,
  ChevronRight,
  Building2,
  ListChecks,
  MapPin,
  Eye,
  Check,
  Loader2,
  Search,
  Plus,
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
}

interface Formula {
  id: number;
  name: string;
  title: string;
  isActive: boolean;
}

interface DirectoryCategory {
  id: number;
  name: string;
  slug: string;
  status: string;
}

interface ServiceListing {
  id: number;
  formulaId: number;
  categoryId: number;
  formulaName: string;
  categoryName: string;
}

interface ServiceArea {
  id: number;
  areaType: string;
  radiusMiles: number | null;
  cities: Array<{ city: string; state: string }> | null;
  states: string[] | null;
  zipCodes: string[] | null;
}

const STEPS = [
  { id: 1, name: "Profile", icon: Building2 },
  { id: 2, name: "Services", icon: ListChecks },
  { id: 3, name: "Service Area", icon: MapPin },
  { id: 4, name: "Review", icon: Eye },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function DirectorySetup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    companyName: "",
    companyDescription: "",
    websiteUrl: "",
    phoneNumber: "",
    email: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Service selection state
  const [selectedServices, setSelectedServices] = useState<Map<number, number>>(new Map()); // formulaId -> categoryId
  const [categorySearch, setCategorySearch] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  // Service area state
  const [areaType, setAreaType] = useState<"radius" | "cities">("radius");
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [selectedCities, setSelectedCities] = useState<Array<{ city: string; state: string }>>([]);
  const [newCity, setNewCity] = useState("");
  const [newCityState, setNewCityState] = useState("");

  // Queries
  const { data: existingProfile, isLoading: profileLoading } = useQuery<DirectoryProfile | null>({
    queryKey: ["/api/directory/profile"],
  });

  const { data: formulas, isLoading: formulasLoading } = useQuery<Formula[]>({
    queryKey: ["/api/formulas"],
  });

  const { data: categories } = useQuery<DirectoryCategory[]>({
    queryKey: ["/api/directory/categories/search", categorySearch],
    queryFn: () => apiRequest(`/api/directory/categories/search?q=${categorySearch}`),
  });

  const { data: existingServices } = useQuery<ServiceListing[]>({
    queryKey: ["/api/directory/services"],
    enabled: !!existingProfile,
  });

  const { data: existingAreas } = useQuery<ServiceArea[]>({
    queryKey: ["/api/directory/service-areas"],
    enabled: !!existingProfile,
  });

  const { data: businessSettings } = useQuery({
    queryKey: ["/api/business-settings"],
  });

  // Initialize form with existing data
  useEffect(() => {
    if (existingProfile) {
      setProfileForm({
        companyName: existingProfile.companyName || "",
        companyDescription: existingProfile.companyDescription || "",
        websiteUrl: existingProfile.websiteUrl || "",
        phoneNumber: existingProfile.phoneNumber || "",
        email: existingProfile.email || "",
        city: existingProfile.city || "",
        state: existingProfile.state || "",
        zipCode: existingProfile.zipCode || "",
      });
    } else if (businessSettings) {
      // Pre-fill from business settings
      const bs = businessSettings as any;
      setProfileForm(prev => ({
        ...prev,
        companyName: bs.businessName || "",
        phoneNumber: bs.businessPhone || "",
        email: bs.businessEmail || "",
      }));
    }
  }, [existingProfile, businessSettings]);

  useEffect(() => {
    if (existingServices) {
      const map = new Map<number, number>();
      existingServices.forEach(s => map.set(s.formulaId, s.categoryId));
      setSelectedServices(map);
    }
  }, [existingServices]);

  useEffect(() => {
    if (existingAreas && existingAreas.length > 0) {
      const area = existingAreas[0];
      setAreaType(area.areaType as "radius" | "cities");
      if (area.radiusMiles) setRadiusMiles(area.radiusMiles);
      if (area.cities) setSelectedCities(area.cities);
    }
  }, [existingAreas]);

  // Mutations
  const createProfile = useMutation({
    mutationFn: (data: typeof profileForm) =>
      apiRequest("/api/directory/profile", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/directory/profile"] });
      toast({ title: "Profile created!" });
      setCurrentStep(2);
    },
    onError: () => toast({ title: "Failed to create profile", variant: "destructive" }),
  });

  const updateProfile = useMutation({
    mutationFn: (data: typeof profileForm) =>
      apiRequest("/api/directory/profile", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/directory/profile"] });
      toast({ title: "Profile updated!" });
      setCurrentStep(2);
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  const addService = useMutation({
    mutationFn: (data: { formulaId: number; categoryId: number }) =>
      apiRequest("/api/directory/services", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/directory/services"] });
    },
  });

  const removeService = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/directory/services/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/directory/services"] });
    },
  });

  const suggestCategory = useMutation({
    mutationFn: (name: string) =>
      apiRequest("/api/directory/categories/suggest", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: (data: DirectoryCategory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/directory/categories/search"] });
      toast({ title: data.status === "pending" ? "Category suggested! It will appear once approved." : "Category found!" });
      setNewCategoryName("");
    },
  });

  const saveServiceArea = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/directory/service-areas", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/directory/service-areas"] });
      toast({ title: "Service area saved!" });
      setCurrentStep(4);
    },
    onError: () => toast({ title: "Failed to save service area", variant: "destructive" }),
  });

  const toggleVisibility = useMutation({
    mutationFn: (showOnDirectory: boolean) =>
      apiRequest("/api/directory/profile", { method: "PATCH", body: JSON.stringify({ showOnDirectory }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/directory/profile"] });
      toast({ title: "Visibility updated!" });
    },
  });

  // Handlers
  const handleProfileSubmit = () => {
    if (!profileForm.companyName || !profileForm.city || !profileForm.state) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    if (existingProfile) {
      updateProfile.mutate(profileForm);
    } else {
      createProfile.mutate(profileForm);
    }
  };

  const handleServiceToggle = async (formulaId: number, categoryId: number | null) => {
    const existing = existingServices?.find(s => s.formulaId === formulaId);

    if (categoryId === null) {
      // Remove service
      if (existing) {
        await removeService.mutateAsync(existing.id);
        setSelectedServices(prev => {
          const next = new Map(prev);
          next.delete(formulaId);
          return next;
        });
      }
    } else {
      // Add/update service
      if (existing) {
        await removeService.mutateAsync(existing.id);
      }
      await addService.mutateAsync({ formulaId, categoryId });
      setSelectedServices(prev => new Map(prev).set(formulaId, categoryId));
    }
  };

  const handleSaveServiceArea = () => {
    const data: any = {
      areaType,
      isActive: true,
    };

    if (areaType === "radius") {
      data.radiusMiles = radiusMiles;
      data.centerLatitude = existingProfile?.city; // Would use actual coords in production
      data.centerLongitude = existingProfile?.state;
    } else if (areaType === "cities") {
      data.cities = selectedCities;
    }

    saveServiceArea.mutate(data);
  };

  const addCity = () => {
    if (newCity && newCityState) {
      setSelectedCities(prev => [...prev, { city: newCity, state: newCityState }]);
      setNewCity("");
      setNewCityState("");
    }
  };

  const removeCity = (index: number) => {
    setSelectedCities(prev => prev.filter((_, i) => i !== index));
  };

  const activeFormulas = formulas?.filter(f => f.isActive) || [];
  const approvedCategories = categories?.filter(c => c.status === "approved") || [];

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            {existingProfile ? "Manage Directory Listing" : "List Your Business"}
          </h1>
          <p className="text-gray-600">
            Get found by homeowners looking for your services
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => existingProfile && setCurrentStep(step.id)}
                  disabled={!existingProfile && step.id > 1}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    currentStep === step.id
                      ? "bg-blue-100 text-blue-700"
                      : currentStep > step.id
                      ? "text-green-600"
                      : "text-gray-400"
                  } ${existingProfile ? "cursor-pointer hover:bg-gray-100" : ""}`}
                >
                  <step.icon className="h-5 w-5" />
                  <span className="hidden sm:inline font-medium">{step.name}</span>
                  {currentStep > step.id && <Check className="h-4 w-4" />}
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 1: Profile */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                This information will be shown on your public directory listing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={profileForm.companyName}
                  onChange={e => setProfileForm(p => ({ ...p, companyName: e.target.value }))}
                  placeholder="Your Business Name"
                />
              </div>

              <div>
                <Label htmlFor="companyDescription">Description</Label>
                <Textarea
                  id="companyDescription"
                  value={profileForm.companyDescription}
                  onChange={e => setProfileForm(p => ({ ...p, companyDescription: e.target.value }))}
                  placeholder="Tell customers about your business..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={profileForm.city}
                    onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="Philadelphia"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={profileForm.state}
                    onValueChange={v => setProfileForm(p => ({ ...p, state: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={profileForm.zipCode}
                  onChange={e => setProfileForm(p => ({ ...p, zipCode: e.target.value }))}
                  placeholder="19103"
                />
              </div>

              <div>
                <Label htmlFor="websiteUrl">Website</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={profileForm.websiteUrl}
                  onChange={e => setProfileForm(p => ({ ...p, websiteUrl: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phoneNumber">Phone</Label>
                  <Input
                    id="phoneNumber"
                    value={profileForm.phoneNumber}
                    onChange={e => setProfileForm(p => ({ ...p, phoneNumber: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="contact@business.com"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleProfileSubmit}
                  disabled={createProfile.isPending || updateProfile.isPending}
                >
                  {(createProfile.isPending || updateProfile.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {existingProfile ? "Save & Continue" : "Create Profile"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Services */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Services</CardTitle>
              <CardDescription>
                Choose which services to show on your directory listing and assign categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formulasLoading ? (
                <Skeleton className="h-32" />
              ) : activeFormulas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>You haven't created any pricing calculators yet.</p>
                  <Link href="/formula-builder">
                    <Button className="mt-4">Create Your First Calculator</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeFormulas.map(formula => {
                    const selectedCategoryId = selectedServices.get(formula.id);
                    const isSelected = selectedCategoryId !== undefined;

                    return (
                      <div
                        key={formula.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          isSelected ? "border-blue-300 bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={checked => {
                              if (!checked) {
                                handleServiceToggle(formula.id, null);
                              }
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{formula.title || formula.name}</h4>

                            {isSelected && (
                              <div className="mt-3">
                                <Label className="text-sm">Category</Label>
                                <Select
                                  value={selectedCategoryId?.toString()}
                                  onValueChange={v => handleServiceToggle(formula.id, parseInt(v))}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {approvedCategories.map(cat => (
                                      <SelectItem key={cat.id} value={cat.id.toString()}>
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {!isSelected && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  if (approvedCategories.length > 0) {
                                    handleServiceToggle(formula.id, approvedCategories[0].id);
                                  }
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add to Directory
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Suggest new category */}
              <div className="border-t pt-4 mt-4">
                <Label>Don't see your category?</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Suggest a new category..."
                  />
                  <Button
                    variant="outline"
                    onClick={() => newCategoryName && suggestCategory.mutate(newCategoryName)}
                    disabled={!newCategoryName || suggestCategory.isPending}
                  >
                    {suggestCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suggest"}
                  </Button>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(3)}>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Service Area */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Service Area</CardTitle>
              <CardDescription>
                Define where you provide services so customers can find you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>How do you want to define your service area?</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    variant={areaType === "radius" ? "default" : "outline"}
                    onClick={() => setAreaType("radius")}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Radius from Business
                  </Button>
                  <Button
                    variant={areaType === "cities" ? "default" : "outline"}
                    onClick={() => setAreaType("cities")}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Specific Cities
                  </Button>
                </div>
              </div>

              {areaType === "radius" && (
                <div>
                  <Label>Service Radius (miles)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Input
                      type="number"
                      value={radiusMiles}
                      onChange={e => setRadiusMiles(parseInt(e.target.value) || 0)}
                      min={1}
                      max={500}
                      className="w-24"
                    />
                    <span className="text-gray-500">miles from {profileForm.city || "your location"}</span>
                  </div>
                </div>
              )}

              {areaType === "cities" && (
                <div>
                  <Label>Cities You Serve</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newCity}
                      onChange={e => setNewCity(e.target.value)}
                      placeholder="City name"
                      className="flex-1"
                    />
                    <Select value={newCityState} onValueChange={setNewCityState}>
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addCity} disabled={!newCity || !newCityState}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedCities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedCities.map((city, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeCity(index)}
                        >
                          {city.city}, {city.state} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSaveServiceArea}
                  disabled={saveServiceArea.isPending}
                >
                  {saveServiceArea.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save & Review
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Your Listing</CardTitle>
                <CardDescription>
                  Make sure everything looks good before publishing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Summary */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Business Profile</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-lg">{profileForm.companyName}</p>
                    <p className="text-gray-500">{profileForm.city}, {profileForm.state} {profileForm.zipCode}</p>
                    {profileForm.websiteUrl && (
                      <p className="text-blue-600 text-sm mt-1">{profileForm.websiteUrl}</p>
                    )}
                  </div>
                </div>

                {/* Services Summary */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Services Listed</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedServices.size === 0 ? (
                      <p className="text-gray-500">No services selected</p>
                    ) : (
                      <div className="space-y-2">
                        {Array.from(selectedServices.entries()).map(([formulaId, categoryId]) => {
                          const formula = activeFormulas.find(f => f.id === formulaId);
                          const category = approvedCategories.find(c => c.id === categoryId);
                          return (
                            <div key={formulaId} className="flex items-center justify-between">
                              <span>{formula?.title || formula?.name}</span>
                              <Badge variant="outline">{category?.name}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Area Summary */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Service Area</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {areaType === "radius" ? (
                      <p>{radiusMiles} mile radius from {profileForm.city}</p>
                    ) : (
                      <p>{selectedCities.length} cities: {selectedCities.map(c => `${c.city}, ${c.state}`).join("; ")}</p>
                    )}
                  </div>
                </div>

                {/* Visibility Toggle */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Show on Directory</h3>
                      <p className="text-sm text-gray-500">
                        {existingProfile?.showOnDirectory
                          ? "Your listing is visible to customers"
                          : "Your listing is hidden from customers"}
                      </p>
                    </div>
                    <Button
                      variant={existingProfile?.showOnDirectory ? "outline" : "default"}
                      onClick={() => toggleVisibility.mutate(!existingProfile?.showOnDirectory)}
                      disabled={toggleVisibility.isPending}
                    >
                      {toggleVisibility.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : existingProfile?.showOnDirectory ? (
                        "Hide Listing"
                      ) : (
                        "Publish Listing"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Link href={`/directory/company/${existingProfile?.companySlug}`}>
                <Button>
                  <Eye className="h-4 w-4 mr-2" />
                  View Public Listing
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

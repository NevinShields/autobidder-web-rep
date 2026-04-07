import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calculator, ArrowRight, X, ShieldCheck, Zap, Users, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useForceLightMode } from "@/hooks/use-force-light-mode";

interface DirectoryCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  listingCount: number;
}

interface LocationResult {
  city: string;
  state: string;
  citySlug: string;
  categoryIds: number[];
}

export default function DirectoryHome() {
  useForceLightMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const { data: categories, isLoading } = useQuery<DirectoryCategory[]>({
    queryKey: ["/api/public/directory/categories"],
  });

  const { data: locations } = useQuery<LocationResult[]>({
    queryKey: ["/api/public/directory/locations", debouncedLocationQuery],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/public/directory/locations?q=${encodeURIComponent(debouncedLocationQuery)}`);
      return res.json();
    },
    enabled: debouncedLocationQuery.length >= 2 && !selectedLocation,
  });

  useEffect(() => {
    if (selectedLocation) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedLocationQuery(locationQuery.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [locationQuery, selectedLocation]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocation = (location: LocationResult) => {
    setSelectedLocation(location);
    setLocationQuery(`${location.city}, ${location.state}`);
    setDebouncedLocationQuery(`${location.city}, ${location.state}`);
    setShowLocationDropdown(false);
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setLocationQuery("");
    setDebouncedLocationQuery("");
  };

  // SEO: Set page title and meta description
  useEffect(() => {
    document.title = "Local Service Prices Near You";
    const meta = document.querySelector('meta[name="description"]');
    const content = "Compare prices and costs from verified local service providers. Use free pricing calculators to get instant quotes — no phone calls needed.";
    if (meta) {
      meta.setAttribute("content", content);
    } else {
      const tag = document.createElement("meta");
      tag.name = "description";
      tag.content = content;
      document.head.appendChild(tag);
    }
  }, []);

  // Filter categories by search query and selected location
  const filteredCategories = (categories || []).filter(cat => {
    const matchesSearch = !searchQuery || cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !selectedLocation || selectedLocation.categoryIds.includes(cat.id);
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        {/* Background radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.3),transparent)]" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          {/* Trust pill */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-8">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Free price calculators · Verified providers · No phone calls needed
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
            Instant Price Calculators from{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
              Trusted Local Pros
            </span>
          </h1>

          <p className="text-lg md:text-xl text-blue-200/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Check prices and costs for local services instantly. Our free calculators give you
            transparent quotes from verified professionals — no waiting, no phone tag.
          </p>

          {/* Grouped search container */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/25 p-2 sm:p-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Service search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="What service do you need?"
                    className="pl-12 h-12 text-base border-0 shadow-none focus-visible:ring-0 bg-gray-50/80 rounded-xl text-gray-900"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px bg-gray-200 my-2" />

                {/* Location search */}
                <div className="relative flex-1" ref={locationRef}>
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <Input
                    placeholder="Your city..."
                    className="pl-12 pr-10 h-12 text-base border-0 shadow-none focus-visible:ring-0 bg-gray-50/80 rounded-xl text-gray-900"
                    value={locationQuery}
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      setSelectedLocation(null);
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => {
                      if (debouncedLocationQuery.length >= 2 && !selectedLocation) {
                        setShowLocationDropdown(true);
                      }
                    }}
                  />
                  {selectedLocation && (
                    <button
                      onClick={clearLocation}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Location dropdown */}
                  {showLocationDropdown && locations && locations.length > 0 && !selectedLocation && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-30 max-h-60 overflow-y-auto">
                      {locations.map((loc) => (
                        <button
                          key={`${loc.city}-${loc.state}`}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 text-gray-900 transition-colors first:rounded-t-xl last:rounded-b-xl"
                          onClick={() => handleSelectLocation(loc)}
                        >
                          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="font-medium">{loc.city}, {loc.state}</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {loc.categoryIds.length} service{loc.categoryIds.length !== 1 ? "s" : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA button */}
                <Button
                  className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shrink-0 shadow-lg shadow-blue-600/25"
                  onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find Providers
                </Button>
              </div>
            </div>
          </div>

          {/* Selected location badge */}
          {selectedLocation && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Badge className="bg-white/15 backdrop-blur-sm text-white text-sm px-4 py-1.5 border border-white/20 rounded-full hover:bg-white/20">
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                {selectedLocation.city}, {selectedLocation.state}
              </Badge>
              <button
                onClick={clearLocation}
                className="text-blue-300 hover:text-white text-sm transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Browse by Service */}
      <div id="services-section" className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {selectedLocation
              ? `Services in ${selectedLocation.city}, ${selectedLocation.state}`
              : "Browse by Service"}
          </h2>
          <p className="text-gray-500 mt-2">
            {selectedLocation
              ? "Use free price calculators to check costs from providers in your area"
              : "Use free pricing calculators to compare costs from local professionals"}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedLocation
                ? "Try adjusting your search or location."
                : "No service categories available yet."}
            </p>
            {selectedLocation && (
              <Button
                variant="outline"
                onClick={clearLocation}
                className="rounded-lg"
              >
                Clear location filter
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredCategories.map((category) => (
              <Link
                key={category.id}
                href={
                  selectedLocation
                    ? `/prices/${category.slug}/${selectedLocation.citySlug}`
                    : `/prices/${category.slug}`
                }
              >
                <div className="group relative bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col h-full">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/80 flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-blue-200/80 transition-all duration-200">
                    {category.iconUrl ? (
                      <img src={category.iconUrl} alt="" className="w-7 h-7 object-contain" />
                    ) : (
                      <Calculator className="h-6 w-6 text-blue-600" />
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="font-semibold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>

                  {/* Metadata row */}
                  <div className="flex items-center justify-between mt-auto pt-3">
                    {category.listingCount > 0 ? (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {category.listingCount} provider{category.listingCount !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span />
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>

                  {/* Price calculator badge */}
                  {category.listingCount > 0 && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                        <Zap className="h-2.5 w-2.5" />
                        Price Calculator
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-b from-gray-50/80 to-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              How It Works
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              Use our free calculators to check prices and costs in under 60 seconds
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-16">
            {[
              {
                icon: Search,
                step: "1",
                title: "Choose Your Service",
                desc: "Browse by category and location to find pricing calculators for services in your area.",
              },
              {
                icon: Calculator,
                step: "2",
                title: "Calculate Your Cost",
                desc: "Our free price calculators show you exactly what services cost — no phone calls required.",
              },
              {
                icon: CheckCircle,
                step: "3",
                title: "Book with Confidence",
                desc: "Compare prices, choose your provider, and book directly. No middleman, no hidden costs.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/20">
                  <item.icon className="h-9 w-9 text-white" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">{item.step}</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
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

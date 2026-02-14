import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Image as ImageIcon, Calendar, Tag, Grid3x3, List, Download, X } from "lucide-react";
import { format } from "date-fns";

interface PhotoMeasurement {
  id: number;
  leadId: number | null;
  userId: string;
  formulaName: string | null;
  setupConfig: {
    objectDescription: string;
    measurementType: string;
    referenceImages: Array<{
      image: string;
      description: string;
      measurement: string;
      unit: string;
    }>;
  };
  customerImageUrls: string[];
  estimatedValue: number;
  estimatedUnit: string;
  confidence: number;
  explanation: string;
  warnings: string[];
  tags: string[];
  createdAt: string;
}

export default function PhotosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; measurement: PhotoMeasurement } | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: measurements = [], isLoading: isLoadingMeasurements } = useQuery<PhotoMeasurement[]>({
    queryKey: ["/api/photo-measurements"],
  });

  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  const { data: multiServiceLeads = [], isLoading: isLoadingMultiServiceLeads } = useQuery<any[]>({
    queryKey: ["/api/multi-service-leads"],
  });

  const isLoading = isLoadingMeasurements || isLoadingLeads || isLoadingMultiServiceLeads;

  // Get leads with uploaded images (from both regular leads and multi-service leads)
  const allLeads = [...leads, ...multiServiceLeads];
  const leadsWithImages = allLeads.filter(lead => lead.uploadedImages && lead.uploadedImages.length > 0);

  const filteredMeasurements = measurements.filter((measurement) => {
    const matchesSearch = 
      measurement.formulaName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      measurement.setupConfig?.objectDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      measurement.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = !selectedTag || measurement.tags?.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  // Filter lead images by search
  const filteredLeadImages = leadsWithImages.filter((lead) => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const allTags = Array.from(new Set(measurements.flatMap(m => m.tags || [])));

  const totalPhotos = measurements.reduce((sum, m) => sum + (m.customerImageUrls?.length || 0), 0) +
    leadsWithImages.reduce((sum, lead) => sum + (lead.uploadedImages?.length || 0), 0);

  const handleDownloadPhoto = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `photo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="animate-pulse rounded-2xl h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl h-28 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" />
              ))}
            </div>
            <div className="animate-pulse rounded-2xl h-96 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const metricCards = [
    { label: "Total Photos", value: totalPhotos.toString(), icon: ImageIcon, gradient: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20", iconColor: "text-blue-600 dark:text-blue-400", borderAccent: "border-blue-200/60 dark:border-blue-500/20" },
    { label: "Measurements", value: measurements.length.toString(), icon: Calendar, gradient: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20", iconColor: "text-emerald-600 dark:text-emerald-400", borderAccent: "border-emerald-200/60 dark:border-emerald-500/20" },
    { label: "Tags", value: allTags.length.toString(), icon: Tag, gradient: "from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20", iconColor: "text-violet-600 dark:text-violet-400", borderAccent: "border-violet-200/60 dark:border-violet-500/20" },
  ];

  return (
    <DashboardLayout>
      <style>{`
        @keyframes dash-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dash-stagger { animation: dash-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .dash-stagger-1 { animation-delay: 0ms; }
        .dash-stagger-2 { animation-delay: 60ms; }
        .dash-stagger-3 { animation-delay: 120ms; }
        .dash-stagger-4 { animation-delay: 180ms; }
        .dash-metric-hover { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
        .dash-metric-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px -8px rgba(0,0,0,0.12); }
        .dash-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="p-4 sm:p-6 lg:p-8 dash-grain min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Hero Header */}
          <div className="dash-stagger dash-stagger-1 relative overflow-hidden rounded-2xl border border-blue-200/40 dark:border-blue-500/10 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-200/30 to-transparent dark:from-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600/70 dark:text-blue-400/60 font-semibold mb-2">Assets</p>
                <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Customer Photos
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                  View and manage all photos uploaded by your customers through calculators and leads.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-lg h-8 px-3"
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-lg h-8 px-3"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metricCards.map((metric, i) => (
              <div
                key={metric.label}
                className={`dash-stagger dash-stagger-${i + 2} dash-metric-hover relative overflow-hidden rounded-2xl border ${metric.borderAccent} bg-gradient-to-br ${metric.gradient} backdrop-blur-sm p-5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">{metric.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      {metric.value}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10`}>
                    <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters & Content */}
          <div className="dash-stagger dash-stagger-4 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by customer name, service or tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/40 focus:ring-blue-500/20"
                />
              </div>
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Button
                    variant={selectedTag === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(null)}
                    className="rounded-lg h-9"
                  >
                    All Tags
                  </Button>
                  {allTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTag(tag)}
                      className="rounded-lg h-9"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {filteredMeasurements.length === 0 && filteredLeadImages.length === 0 ? (
              <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/40 rounded-2xl">
                <CardContent className="p-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>No photos found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
                    {searchTerm || selectedTag
                      ? "We couldn't find any photos matching your current filters. Try adjusting your search."
                      : "Customer photos will appear here once they upload them during the calculation process."}
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {/* Lead uploaded images */}
                {filteredLeadImages.flatMap((lead) =>
                  lead.uploadedImages?.map((url: string, index: number) => (
                    <div
                      key={`lead-${lead.id}-${index}`}
                      className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                      onClick={() => handleDownloadPhoto(url)}
                    >
                      <div className="aspect-square bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                        <img
                          src={url}
                          alt="Customer uploaded photo"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <Button size="sm" variant="secondary" className="w-full bg-white/90 text-gray-900 backdrop-blur-sm">
                            <Download className="h-3.5 w-3.5 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{lead.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(lead.createdAt), "MMM d, yyyy")}
                          </p>
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold h-5">
                            Lead
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Photo measurements */}
                {filteredMeasurements.flatMap((measurement) =>
                  measurement.customerImageUrls?.map((url, index) => (
                    <div
                      key={`${measurement.id}-${index}`}
                      className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                      onClick={() => setSelectedPhoto({ url, measurement })}
                    >
                      <div className="aspect-square bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                        <img
                          src={url}
                          alt={measurement.setupConfig?.objectDescription || "Customer photo"}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {measurement.confidence && (
                          <Badge
                            className="absolute top-3 right-3 shadow-lg"
                            variant={measurement.confidence >= 80 ? "default" : "secondary"}
                          >
                            {measurement.confidence}% match
                          </Badge>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <Button size="sm" variant="secondary" className="w-full bg-white/90 text-gray-900 backdrop-blur-sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {measurement.formulaName || measurement.setupConfig?.objectDescription || "Photo Measurement"}
                        </h3>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(measurement.createdAt), "MMM d, yyyy")}
                          </p>
                          <div className="flex gap-1">
                            {measurement.tags?.slice(0, 1).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px] h-5">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <Card className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/40 rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {/* List view items simplified for space */}
                    {filteredLeadImages.map((lead) => (
                      <div key={`lead-${lead.id}`} className="p-5 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer" onClick={() => handleDownloadPhoto(lead.uploadedImages[0])}>
                        <div className="flex items-center gap-5">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <img
                              src={lead.uploadedImages[0]}
                              className="w-full h-full object-cover rounded-xl"
                            />
                            {lead.uploadedImages.length > 1 && (
                              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 py-0.5 text-[10px] font-bold">
                                +{lead.uploadedImages.length - 1}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-gray-900 dark:text-white text-lg" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{lead.name}</h3>
                              <Badge variant="secondary" className="text-[10px] uppercase font-bold px-2">Lead Upload</Badge>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              {format(new Date(lead.createdAt), "MMMM d, yyyy • h:mm a")}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-gray-400 group-hover:text-blue-500 transition-colors">
                            <Download className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {filteredMeasurements.map((measurement) => (
                      <div key={measurement.id} className="p-5 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer" onClick={() => setSelectedPhoto({ url: measurement.customerImageUrls[0], measurement })}>
                        <div className="flex items-center gap-5">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <img
                              src={measurement.customerImageUrls[0]}
                              className="w-full h-full object-cover rounded-xl"
                            />
                            {measurement.customerImageUrls.length > 1 && (
                              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 py-0.5 text-[10px] font-bold">
                                +{measurement.customerImageUrls.length - 1}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-gray-900 dark:text-white text-lg" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                                {measurement.formulaName || measurement.setupConfig?.objectDescription || "Photo Measurement"}
                              </h3>
                              <Badge className="text-[10px] font-bold px-2 bg-blue-500/10 text-blue-600 border-none">
                                {measurement.confidence}% Confidence
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              {measurement.estimatedValue} {measurement.estimatedUnit} • {format(new Date(measurement.createdAt), "MMMM d, yyyy")}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-gray-400 group-hover:text-blue-500 transition-colors">
                            <ExternalLink className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Photo Details
              </DialogTitle>
            </DialogHeader>
            {selectedPhoto && (
              <div className="grid lg:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-700/40">
                    <img
                      src={selectedPhoto.url}
                      alt="Customer photo"
                      className="w-full h-auto object-contain bg-gray-900"
                    />
                  </div>
                  <Button
                    className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900"
                    onClick={() => handleDownloadPhoto(selectedPhoto.url)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Original
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Service Category</Label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                        {selectedPhoto.measurement.formulaName || selectedPhoto.measurement.setupConfig?.objectDescription || "General Asset"}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Estimated Size</Label>
                        <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                          {selectedPhoto.measurement.estimatedValue} {selectedPhoto.measurement.estimatedUnit}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">AI Confidence</Label>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {selectedPhoto.measurement.confidence}%
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2 block">AI Analysis</Label>
                      <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/40">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {selectedPhoto.measurement.explanation || "No AI explanation available for this asset."}
                        </p>
                      </div>
                    </div>

                    {selectedPhoto.measurement.tags && selectedPhoto.measurement.tags.length > 0 && (
                      <div>
                        <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2 block">Detected Attributes</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedPhoto.measurement.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="rounded-lg px-2.5 py-1 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Upload Date</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(selectedPhoto.measurement.createdAt), "MMMM d, yyyy • h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

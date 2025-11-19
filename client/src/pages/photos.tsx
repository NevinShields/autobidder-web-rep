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

  const isLoading = isLoadingMeasurements || isLoadingLeads;

  // Get leads with uploaded images
  const leadsWithImages = leads.filter(lead => lead.uploadedImages && lead.uploadedImages.length > 0);

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

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Customer Photos</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View and manage all photos uploaded by your customers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                data-testid="button-grid-view"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                data-testid="button-list-view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card data-testid="card-total-photos">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Photos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-total-photos">{totalPhotos}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-total-measurements">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Measurements</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-total-measurements">{measurements.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-total-services">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Services</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-total-services">{allTags.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by service or tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-photos"
              />
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
                data-testid="button-all-tags"
              >
                All
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                  data-testid={`button-tag-${tag}`}
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="w-full h-48 mb-4" />
                  <Skeleton className="w-3/4 h-4 mb-2" />
                  <Skeleton className="w-1/2 h-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMeasurements.length === 0 && filteredLeadImages.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No photos found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedTag
                  ? "Try adjusting your filters"
                  : "Customer photos will appear here once they upload them"}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Lead uploaded images */}
            {filteredLeadImages.flatMap((lead) =>
              lead.uploadedImages?.map((url: string, index: number) => (
                <Card
                  key={`lead-${lead.id}-${index}`}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleDownloadPhoto(url)}
                  data-testid={`photo-card-lead-${lead.id}-${index}`}
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                    <img
                      src={url}
                      alt="Customer uploaded photo"
                      className="w-full h-full object-cover"
                      data-testid={`img-card-photo-lead-${lead.id}-${index}`}
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 truncate" data-testid={`text-card-customer-${lead.id}-${index}`}>
                      {lead.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2" data-testid={`text-card-date-lead-${lead.id}-${index}`}>
                      {format(new Date(lead.createdAt), "MMM d, yyyy")}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Customer Upload
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
            
            {/* Photo measurements */}
            {filteredMeasurements.flatMap((measurement) =>
              measurement.customerImageUrls?.map((url, index) => (
                <Card
                  key={`${measurement.id}-${index}`}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedPhoto({ url, measurement })}
                  data-testid={`photo-card-${measurement.id}-${index}`}
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                    <img
                      src={url}
                      alt={measurement.setupConfig?.objectDescription || "Customer photo"}
                      className="w-full h-full object-cover"
                      data-testid={`img-card-photo-${measurement.id}-${index}`}
                    />
                    {measurement.confidence && (
                      <Badge
                        className="absolute top-2 right-2"
                        variant={measurement.confidence >= 80 ? "default" : "secondary"}
                        data-testid={`badge-card-confidence-${measurement.id}-${index}`}
                      >
                        {measurement.confidence}% confidence
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 truncate" data-testid={`text-card-service-${measurement.id}-${index}`}>
                      {measurement.formulaName || measurement.setupConfig?.objectDescription || "Photo Measurement"}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2" data-testid={`text-card-date-${measurement.id}-${index}`}>
                      {format(new Date(measurement.createdAt), "MMM d, yyyy")}
                    </p>
                    {measurement.tags && measurement.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {measurement.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs" data-testid={`badge-card-tag-${tag}`}>
                            {tag}
                          </Badge>
                        ))}
                        {measurement.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{measurement.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Lead uploaded images in list view */}
                {filteredLeadImages.map((lead) => (
                  <div key={`lead-${lead.id}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`lead-row-${lead.id}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex gap-2 flex-shrink-0">
                        {lead.uploadedImages?.slice(0, 3).map((url: string, index: number) => (
                          <img
                            key={index}
                            src={url}
                            alt="Customer uploaded photo"
                            className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleDownloadPhoto(url)}
                            data-testid={`img-list-photo-lead-${lead.id}-${index}`}
                          />
                        ))}
                        {lead.uploadedImages?.length > 3 && (
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-sm text-gray-600 dark:text-gray-400" data-testid={`text-list-more-photos-lead-${lead.id}`}>
                            +{lead.uploadedImages.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1" data-testid={`text-list-customer-${lead.id}`}>
                          {lead.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Customer Upload
                        </p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-500" data-testid={`text-list-date-lead-${lead.id}`}>
                            {format(new Date(lead.createdAt), "MMM d, yyyy h:mm a")}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {lead.uploadedImages.length} {lead.uploadedImages.length === 1 ? 'image' : 'images'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Photo measurements in list view */}
                {filteredMeasurements.map((measurement) => (
                  <div key={measurement.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`measurement-row-${measurement.id}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex gap-2 flex-shrink-0">
                        {measurement.customerImageUrls?.slice(0, 3).map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt="Customer photo"
                            className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedPhoto({ url, measurement })}
                            data-testid={`img-list-photo-${measurement.id}-${index}`}
                          />
                        ))}
                        {measurement.customerImageUrls?.length > 3 && (
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-sm text-gray-600 dark:text-gray-400" data-testid={`text-list-more-photos-${measurement.id}`}>
                            +{measurement.customerImageUrls.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1" data-testid={`text-list-service-${measurement.id}`}>
                          {measurement.formulaName || measurement.setupConfig?.objectDescription || "Photo Measurement"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2" data-testid={`text-list-measurement-${measurement.id}`}>
                          {measurement.estimatedValue} {measurement.estimatedUnit} • {measurement.confidence}% confidence
                        </p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-500" data-testid={`text-list-date-${measurement.id}`}>
                            {format(new Date(measurement.createdAt), "MMM d, yyyy h:mm a")}
                          </span>
                          {measurement.tags && measurement.tags.length > 0 && (
                            <>
                              <span className="text-gray-300">•</span>
                              {measurement.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs" data-testid={`badge-list-tag-${tag}`}>
                                  {tag}
                                </Badge>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Photo Details</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectedPhoto && handleDownloadPhoto(selectedPhoto.url)}
                    data-testid="button-download-photo"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            {selectedPhoto && (
              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={selectedPhoto.url}
                    alt="Customer photo"
                    className="w-full h-auto max-h-[60vh] object-contain"
                    data-testid="img-photo-detail"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Service</p>
                    <p className="text-base text-gray-900 dark:text-gray-100" data-testid="text-detail-service">
                      {selectedPhoto.measurement.formulaName || selectedPhoto.measurement.setupConfig?.objectDescription || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</p>
                    <p className="text-base text-gray-900 dark:text-gray-100" data-testid="text-detail-date">
                      {format(new Date(selectedPhoto.measurement.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Measurement</p>
                    <p className="text-base text-gray-900 dark:text-gray-100" data-testid="text-detail-measurement">
                      {selectedPhoto.measurement.estimatedValue} {selectedPhoto.measurement.estimatedUnit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confidence</p>
                    <p className="text-base text-gray-900 dark:text-gray-100" data-testid="text-detail-confidence">
                      {selectedPhoto.measurement.confidence}%
                    </p>
                  </div>
                </div>
                {selectedPhoto.measurement.explanation && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Explanation</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-detail-explanation">
                      {selectedPhoto.measurement.explanation}
                    </p>
                  </div>
                )}
                {selectedPhoto.measurement.tags && selectedPhoto.measurement.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2" data-testid="container-detail-tags">
                      {selectedPhoto.measurement.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" data-testid={`badge-detail-tag-${tag}`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

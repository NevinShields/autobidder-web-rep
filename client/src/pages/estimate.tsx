import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  FileText,
  Calendar,
  Building,
  Mail,
  Phone,
  MapPin,
  Download,
  Printer,
  DollarSign,
  Percent,
  Receipt,
  Check,
  X,
  Truck,
  Play,
  Paperclip,
  Image as ImageIcon,
  FileIcon,
  AlertCircle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Estimate } from "@shared/schema";

type EstimateTheme = {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
};

type EstimateAttachment = {
  url: string;
  name?: string;
  type: "image" | "pdf" | "file";
  category?: "terms" | "insurance" | "custom";
};

type PublicBusinessSettings = {
  businessName?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  businessAddress?: string | null;
  estimatePageSettings?: {
    defaultShowBusinessLogo?: boolean;
    defaultLogoUrl?: string;
    defaultShowBusinessName?: boolean;
    defaultShowBusinessAddress?: boolean;
    defaultShowBusinessEmail?: boolean;
    defaultShowBusinessPhone?: boolean;
  };
};

export default function EstimatePage() {
  const { estimateNumber } = useParams<{ estimateNumber: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: estimate, isLoading } = useQuery<Estimate>({
    queryKey: ["/api/estimates/by-number", estimateNumber],
    enabled: !!estimateNumber,
  });

  const { data: publicBusinessSettings } = useQuery<PublicBusinessSettings>({
    queryKey: [`/api/public/business-settings/${estimate?.userId}`],
    enabled: !!estimate?.userId,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/estimates/by-number/${estimateNumber}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates/by-number", estimateNumber] });
      toast({
        title: "Estimate Accepted",
        description: "You've successfully accepted this estimate. We'll be in touch soon!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept estimate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/estimates/by-number/${estimateNumber}/decline`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates/by-number", estimateNumber] });
      toast({
        title: "Estimate Declined",
        description: "You've declined this estimate. Thank you for your time.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline estimate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Estimate ${estimate?.estimateNumber}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; }
                .estimate-container { max-width: 800px; margin: 0 auto; }
                .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px; }
                .customer-info { margin: 20px 0; }
                .services-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .services-table th, .services-table td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
                .services-table th { background-color: #f9fafb; }
                .totals { margin-top: 30px; border-top: 2px solid #e5e7eb; padding-top: 20px; }
                .total-row { display: flex; justify-content: space-between; margin: 10px 0; }
                .final-total { font-weight: bold; font-size: 1.2em; border-top: 1px solid #e5e7eb; padding-top: 10px; }
                .message { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              <div class="estimate-container">
                ${printContent}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="force-light-mode min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="force-light-mode min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Estimate Not Found</h1>
          <p className="text-gray-600">The estimate you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  // Extract theme, attachments, video, custom message from estimate
  const theme = (estimate?.theme as EstimateTheme) || {};
  const attachments = (estimate?.attachments as EstimateAttachment[]) || [];
  const videoUrl = estimate?.videoUrl as string | undefined;
  const customMessage = estimate?.customMessage as string | undefined;
  const resolvedMessage = (customMessage || estimate?.businessMessage || "").trim();
  const revisionReason = estimate?.revisionReason as string | undefined;
  const estimateDefaults = publicBusinessSettings?.estimatePageSettings || {};
  const showBusinessLogo =
    estimateDefaults.defaultShowBusinessLogo === true && !!estimateDefaults.defaultLogoUrl;
  const showBusinessName = estimateDefaults.defaultShowBusinessName === true;
  const showBusinessAddress = estimateDefaults.defaultShowBusinessAddress === true;
  const showBusinessEmail = estimateDefaults.defaultShowBusinessEmail === true;
  const showBusinessPhone = estimateDefaults.defaultShowBusinessPhone === true;
  const showBusinessDetails =
    showBusinessLogo ||
    showBusinessName ||
    showBusinessAddress ||
    showBusinessEmail ||
    showBusinessPhone;

  // Helper to get video embed URL
  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Loom
    const loomMatch = url.match(/(?:loom\.com\/share\/)([a-zA-Z0-9]+)/);
    if (loomMatch) {
      return `https://www.loom.com/embed/${loomMatch[1]}`;
    }

    // Return original if it's already an embed URL or direct video
    if (url.includes('embed') || url.endsWith('.mp4') || url.endsWith('.webm')) {
      return url;
    }

    return null;
  };

  // Theme-based styles
  const themeStyles = {
    primaryColor: theme.primaryColor || '#2563eb',
    accentColor: theme.accentColor || '#16a34a',
    backgroundColor: theme.backgroundColor || '#ffffff',
    textColor: theme.textColor || '#111827',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const layoutId = estimate.layoutId || "classic";
  const isMinimal = layoutId === "minimal";
  const isDetailed = layoutId === "detailed";
  const pageBackgroundClass = isMinimal
    ? "bg-white"
    : isDetailed
      ? "bg-slate-50"
      : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50";
  const containerWidthClass = isDetailed ? "max-w-6xl" : isMinimal ? "max-w-3xl" : "max-w-4xl";
  const cardClassName = isMinimal || isDetailed ? "shadow-sm border" : "shadow-lg";
  const headerClassName = isMinimal || isDetailed ? "border-b" : "border-b text-white";
  const headerStyle = isMinimal
    ? { backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor }
    : isDetailed
      ? { backgroundColor: themeStyles.backgroundColor, color: themeStyles.textColor, borderTop: `4px solid ${themeStyles.primaryColor}` }
      : { background: `linear-gradient(to right, ${themeStyles.primaryColor}, ${themeStyles.accentColor})` };
  const headerMutedClass = isMinimal || isDetailed ? "text-gray-500" : "text-white/80";
  const headerTitleClass = isMinimal || isDetailed ? "text-gray-900" : "text-white";
  const headerSubtleClass = isMinimal || isDetailed ? "text-gray-600" : "text-white/80";
  const sectionOuterClassName = isDetailed ? "rounded-xl border border-slate-200 bg-white p-5" : "";
  const sectionInnerClassName = isDetailed ? "bg-transparent p-0" : "bg-gray-50 rounded-lg p-4";
  const messageBoxClassName = isDetailed
    ? "rounded-lg border border-slate-200 bg-slate-50 p-4"
    : "bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg";

  const customerInfoSection = (
    <div className={`mb-8 ${sectionOuterClassName}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: themeStyles.textColor }}>
        <Building className="w-5 h-5" style={{ color: themeStyles.primaryColor }} />
        Customer Information
      </h3>
      <div className={sectionInnerClassName}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${themeStyles.primaryColor}20` }}
            >
              <span className="font-semibold" style={{ color: themeStyles.primaryColor }}>
                {estimate.customerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{estimate.customerName}</p>
              <p className="text-sm text-gray-600">Customer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">{estimate.customerEmail}</p>
              <p className="text-sm text-gray-600">Email</p>
            </div>
          </div>

          {estimate.customerPhone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{estimate.customerPhone}</p>
                <p className="text-sm text-gray-600">Phone</p>
              </div>
            </div>
          )}

          {estimate.customerAddress && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{estimate.customerAddress}</p>
                <p className="text-sm text-gray-600">Address</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const messageSection = resolvedMessage ? (
    <div className={`mb-8 ${sectionOuterClassName}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Message</h3>
      <div className={isMinimal ? "border border-gray-200 p-4 rounded-lg" : messageBoxClassName}>
        <p className="leading-relaxed whitespace-pre-wrap" style={{ color: themeStyles.textColor }}>
          {resolvedMessage}
        </p>
      </div>
    </div>
  ) : null;

  const businessDetailsSection = showBusinessDetails ? (
    <div className={`mb-8 ${sectionOuterClassName}`}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: themeStyles.textColor }}>
        Business Details
      </h3>
      <div className={sectionInnerClassName}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {showBusinessLogo && estimateDefaults.defaultLogoUrl && (
            <img
              src={estimateDefaults.defaultLogoUrl}
              alt={`${publicBusinessSettings?.businessName || "Business"} logo`}
              className="h-12 w-auto object-contain"
            />
          )}
          <div className="space-y-1 text-sm text-gray-700">
            {showBusinessName && publicBusinessSettings?.businessName && (
              <div className="font-semibold text-gray-900">{publicBusinessSettings.businessName}</div>
            )}
            {showBusinessAddress && publicBusinessSettings?.businessAddress && (
              <div>{publicBusinessSettings.businessAddress}</div>
            )}
            {showBusinessEmail && publicBusinessSettings?.businessEmail && (
              <div>{publicBusinessSettings.businessEmail}</div>
            )}
            {showBusinessPhone && publicBusinessSettings?.businessPhone && (
              <div>{publicBusinessSettings.businessPhone}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const videoSection = videoUrl && getVideoEmbedUrl(videoUrl) ? (
    <div className={`mb-8 ${sectionOuterClassName}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Play className="w-5 h-5" style={{ color: themeStyles.primaryColor }} />
        Video
      </h3>
      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-slate-200">
        <iframe
          src={getVideoEmbedUrl(videoUrl)!}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Estimate Video"
        />
      </div>
    </div>
  ) : null;

  const attachmentsSection = attachments.length > 0 ? (
    <div className={`mb-8 ${sectionOuterClassName}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Paperclip className="w-5 h-5" style={{ color: themeStyles.primaryColor }} />
        Attachments
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {attachments.map((attachment, index) => (
          <a
            key={`${attachment.url}-${index}`}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors group"
          >
            {attachment.type === "image" ? (
              <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                <img
                  src={attachment.url}
                  alt={attachment.name || "Attachment"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 rounded bg-red-50 flex items-center justify-center flex-shrink-0">
                <FileIcon className="w-6 h-6 text-red-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                {attachment.name ||
                  (attachment.type === "pdf"
                    ? "PDF Document"
                    : attachment.type === "image"
                      ? "Image"
                      : "File")}
              </p>
              <p className="text-sm text-gray-500 uppercase">{attachment.type}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  ) : null;

  const servicesSection = (
    <div className={`mb-8 ${sectionOuterClassName}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: themeStyles.textColor }}>
        <Receipt className="w-5 h-5" style={{ color: themeStyles.primaryColor }} />
        Services & Pricing
      </h3>
      <div className="overflow-x-auto">
        <table className={`w-full border-collapse border border-gray-200 rounded-lg overflow-hidden ${isDetailed ? "bg-white" : ""}`}>
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                Service
              </th>
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                Description
              </th>
              <th className="border border-gray-200 px-4 py-3 text-right font-semibold text-gray-900">
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {estimate.services.map((service, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-3">
                  <div className="font-medium text-gray-900">{service.name}</div>
                  {service.category && (
                    <div className="text-sm text-gray-500">{service.category}</div>
                  )}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-gray-700">
                  {service.description || 'Professional service'}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-right font-medium text-gray-900">
                  {formatCurrency(service.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const totalsSection = (
    <div className="border-t pt-6">
      <div className="max-w-md ml-auto">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatCurrency(estimate.subtotal)}</span>
          </div>

          {(estimate.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Discount:
              </span>
              <span className="font-medium">-{formatCurrency(estimate.discountAmount ?? 0)}</span>
            </div>
          )}

          {(estimate.distanceFee ?? 0) > 0 && (
            <div className="flex justify-between items-center text-orange-600">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Travel Fee:
              </span>
              <span className="font-medium">{formatCurrency(estimate.distanceFee ?? 0)}</span>
            </div>
          )}

          {(estimate.taxAmount ?? 0) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">{formatCurrency(estimate.taxAmount ?? 0)}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center text-xl font-bold text-gray-900">
            <span className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Total:
            </span>
            <span>{formatCurrency(estimate.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const footerSection = (
    <div className="mt-8 pt-6 border-t text-center text-gray-600">
      <p className="text-sm">
        This estimate is valid until {estimate.validUntil ? format(new Date(estimate.validUntil), 'MMMM dd, yyyy') : 'further notice'}.
      </p>
      <p className="text-sm mt-2">
        Thank you for choosing our services. We look forward to working with you!
      </p>
    </div>
  );

  return (
    <div className={`force-light-mode min-h-screen ${pageBackgroundClass} p-4`}>
      <div className={`${containerWidthClass} mx-auto`}>
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Estimate {estimate.estimateNumber}
          </h1>
          <div className="flex items-center gap-3">
            <Badge className={estimate.estimateType === "pre_estimate" ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"}>
              {estimate.estimateType === "pre_estimate" ? "Pre-Estimate" : "Confirmed Estimate"}
            </Badge>
            <Badge className={getStatusColor(estimate.status)}>
              {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Accept/Decline Actions - Only show for confirmed estimates approved by owner and not yet responded */}
        {estimate.estimateType === "confirmed" &&
         estimate.ownerApprovalStatus === 'approved' && 
         estimate.status !== 'accepted' && 
         estimate.status !== 'rejected' && (
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50/50">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Move Forward?
                </h2>
                <p className="text-gray-600 mb-6">
                  This estimate has been approved and is ready for your response.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending || declineMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
                    data-testid="button-accept-estimate"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    {acceptMutation.isPending ? "Accepting..." : "Accept Estimate"}
                  </Button>
                  <Button
                    onClick={() => declineMutation.mutate()}
                    disabled={acceptMutation.isPending || declineMutation.isPending}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 px-8 py-6 text-lg"
                    data-testid="button-decline-estimate"
                  >
                    <X className="w-5 h-5 mr-2" />
                    {declineMutation.isPending ? "Declining..." : "Decline Estimate"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Response Status - Show when customer has responded */}
        {(estimate.status === 'accepted' || estimate.status === 'rejected') && (
          <Card className={`mb-6 border-2 ${estimate.status === 'accepted' ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
            <CardContent className="p-6">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full ${estimate.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'} mx-auto mb-4 flex items-center justify-center`}>
                  {estimate.status === 'accepted' ? (
                    <Check className={`w-8 h-8 ${estimate.status === 'accepted' ? 'text-green-600' : 'text-red-600'}`} />
                  ) : (
                    <X className="w-8 h-8 text-red-600" />
                  )}
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${estimate.status === 'accepted' ? 'text-green-900' : 'text-red-900'}`}>
                  {estimate.status === 'accepted' ? 'Estimate Accepted' : 'Estimate Declined'}
                </h2>
                <p className={estimate.status === 'accepted' ? 'text-green-700' : 'text-red-700'}>
                  {estimate.status === 'accepted'
                    ? "Thank you for accepting! We'll be in touch shortly to schedule the work."
                    : "Thank you for your response. We appreciate your consideration."}
                </p>
                {estimate.customerResponseAt && (
                  <p className="text-sm text-gray-600 mt-2">
                    Response received on {format(new Date(estimate.customerResponseAt), 'MMMM dd, yyyy')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revision Reason Notice - Show when price was revised */}
        {revisionReason && (
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Price Revision Note</h3>
                  <p className="text-blue-800 text-sm">{revisionReason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estimate Content */}
        <div ref={printRef}>
          {isDetailed ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Card className={cardClassName} style={{ backgroundColor: themeStyles.backgroundColor }}>
                <CardHeader className={headerClassName} style={headerStyle}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Detailed Estimate</p>
                      <CardTitle className={`text-2xl font-bold mt-2 ${headerTitleClass}`}>
                        Estimate #{estimate.estimateNumber}
                      </CardTitle>
                      <p className={headerSubtleClass}>
                        Prepared for {estimate.customerName}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={estimate.estimateType === "pre_estimate" ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"}>
                        {estimate.estimateType === "pre_estimate" ? "Pre-Estimate" : "Confirmed Estimate"}
                      </Badge>
                      <Badge className={getStatusColor(estimate.status)}>
                        {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                      </Badge>
                      <span className="ml-2 text-sm text-gray-500">Total</span>
                      <span className="text-lg font-semibold text-gray-900">{formatCurrency(estimate.totalAmount)}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className={isMinimal ? "p-6" : "p-8"}>
                  {businessDetailsSection}
                  {customerInfoSection}
                  {messageSection}
                  {videoSection}
                  {attachmentsSection}
                  {servicesSection}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="shadow-sm border" style={{ backgroundColor: themeStyles.backgroundColor }}>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge className={getStatusColor(estimate.status)}>
                        {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estimate Number</p>
                      <p className="font-semibold text-gray-900">{estimate.estimateNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Issued</p>
                      <p className="font-semibold text-gray-900">{format(new Date(estimate.createdAt), 'MMMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Valid Until</p>
                      <p className="font-semibold text-gray-900">
                        {estimate.validUntil ? format(new Date(estimate.validUntil), 'MMMM dd, yyyy') : 'Further notice'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border" style={{ backgroundColor: themeStyles.backgroundColor }}>
                  <CardHeader>
                    <CardTitle className="text-lg">Line Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {estimate.services.map((service, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{service.name}</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(service.price)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="shadow-sm border" style={{ backgroundColor: themeStyles.backgroundColor }}>
                  <CardHeader>
                    <CardTitle className="text-lg">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {totalsSection}
                    <div className="mt-6">{footerSection}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className={cardClassName} style={{ backgroundColor: themeStyles.backgroundColor }}>
              <CardHeader className={headerClassName} style={headerStyle}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={`text-2xl font-bold mb-2 ${headerTitleClass}`}>
                      Professional Estimate
                    </CardTitle>
                    <p className={headerMutedClass}>
                      Estimate #{estimate.estimateNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={headerMutedClass}>Issue Date</p>
                    <p className={`font-semibold ${headerTitleClass}`}>
                      {format(new Date(estimate.createdAt), 'MMMM dd, yyyy')}
                    </p>
                    {estimate.validUntil && (
                      <>
                        <p className={`${headerSubtleClass} mt-2`}>Valid Until</p>
                        <p className={`font-semibold ${headerTitleClass}`}>
                          {format(new Date(estimate.validUntil), 'MMMM dd, yyyy')}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className={isMinimal ? "p-6" : "p-8"}>
                {businessDetailsSection}
                {customerInfoSection}
                {messageSection}
                {videoSection}
                {attachmentsSection}
                {servicesSection}
                {totalsSection}
                {footerSection}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  Receipt
} from "lucide-react";
import type { Estimate } from "@shared/schema";

export default function EstimatePage() {
  const { estimateNumber } = useParams<{ estimateNumber: string }>();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: estimate, isLoading } = useQuery<Estimate>({
    queryKey: ["/api/estimates/by-number", estimateNumber],
    enabled: !!estimateNumber,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Estimate {estimate.estimateNumber}
          </h1>
          <div className="flex items-center gap-3">
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

        {/* Estimate Content */}
        <div ref={printRef}>
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    Professional Estimate
                  </CardTitle>
                  <p className="text-blue-100">
                    Estimate #{estimate.estimateNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-blue-100">Issue Date</p>
                  <p className="font-semibold">
                    {format(new Date(estimate.createdAt), 'MMMM dd, yyyy')}
                  </p>
                  {estimate.validUntil && (
                    <>
                      <p className="text-blue-100 mt-2">Valid Until</p>
                      <p className="font-semibold">
                        {format(new Date(estimate.validUntil), 'MMMM dd, yyyy')}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {/* Customer Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Customer Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
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

              {/* Business Message */}
              {estimate.businessMessage && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Message</h3>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <p className="text-gray-700 leading-relaxed">{estimate.businessMessage}</p>
                  </div>
                </div>
              )}

              {/* Services */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  Services & Pricing
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
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

              {/* Totals */}
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

              {/* Footer */}
              <div className="mt-8 pt-6 border-t text-center text-gray-600">
                <p className="text-sm">
                  This estimate is valid until {estimate.validUntil ? format(new Date(estimate.validUntil), 'MMMM dd, yyyy') : 'further notice'}.
                </p>
                <p className="text-sm mt-2">
                  Thank you for choosing our services. We look forward to working with you!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
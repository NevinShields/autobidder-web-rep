import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Percent, Receipt, Users, Mail, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BusinessSettings } from "@shared/schema";

export default function FormSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/business-settings"],
  });

  const businessSettings = settings as BusinessSettings;
  
  // Form state
  const [formSettings, setFormSettings] = useState({
    requireContactFirst: false,
    showBundleDiscount: false,
    bundleDiscountPercent: 10,
    bundleMinServices: 2,
    enableSalesTax: false,
    salesTaxRate: 8.25,
    salesTaxLabel: "Sales Tax",
    enableLeadCapture: true,
    leadCaptureMessage: "Get your custom quote today! We'll contact you within 24 hours.",
    thankYouMessage: "Thank you for your interest! We'll review your requirements and contact you soon.",
    contactEmail: "info@example.com",
    businessDescription: "Professional services with competitive pricing and quality guarantee.",
  });

  // Load existing settings
  useEffect(() => {
    if (businessSettings?.styling) {
      setFormSettings({
        requireContactFirst: businessSettings.styling.requireContactFirst || false,
        showBundleDiscount: businessSettings.styling.showBundleDiscount || false,
        bundleDiscountPercent: businessSettings.styling.bundleDiscountPercent || 10,
        bundleMinServices: 2,
        enableSalesTax: businessSettings.styling.enableSalesTax || false,
        salesTaxRate: businessSettings.styling.salesTaxRate || 8.25,
        salesTaxLabel: businessSettings.styling.salesTaxLabel || "Sales Tax",
        enableLeadCapture: businessSettings.enableLeadCapture ?? true,
        leadCaptureMessage: "Get your custom quote today! We'll contact you within 24 hours.",
        thankYouMessage: "Thank you for your interest! We'll review your requirements and contact you soon.",
        contactEmail: "info@example.com",
        businessDescription: "Professional services with competitive pricing and quality guarantee.",
      });
    }
  }, [businessSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      return apiRequest('/api/business-settings', {
        method: 'PATCH',
        body: {
          enableLeadCapture: updatedSettings.enableLeadCapture,
          styling: {
            ...businessSettings?.styling,
            requireContactFirst: updatedSettings.requireContactFirst,
            showBundleDiscount: updatedSettings.showBundleDiscount,
            bundleDiscountPercent: updatedSettings.bundleDiscountPercent,
            enableSalesTax: updatedSettings.enableSalesTax,
            salesTaxRate: updatedSettings.salesTaxRate,
            salesTaxLabel: updatedSettings.salesTaxLabel,
          }
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-settings"] });
      toast({
        title: "Settings saved successfully",
        description: "Your form logic has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to save settings",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(formSettings);
  };

  const handleSettingChange = (key: string, value: any) => {
    setFormSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-6 h-6" />
            <h1 className="text-2xl font-bold text-gray-900">Form Logic & Settings</h1>
          </div>
          <p className="text-gray-600">
            Configure pricing rules, customer flow, and form behavior for your embeddable quote form.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Test your form settings and see how customers will experience your quote form.</span>
              <Link href="/embed-form">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview Form
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        </div>

        <div className="space-y-6">
          {/* Customer Flow Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Contact Information First</Label>
                  <p className="text-sm text-gray-600">
                    Require customers to provide contact details before seeing pricing
                  </p>
                </div>
                <Switch
                  checked={formSettings.requireContactFirst}
                  onCheckedChange={(checked) => handleSettingChange('requireContactFirst', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Enable Lead Capture</Label>
                  <p className="text-sm text-gray-600">
                    Collect customer information for follow-up
                  </p>
                </div>
                <Switch
                  checked={formSettings.enableLeadCapture}
                  onCheckedChange={(checked) => handleSettingChange('enableLeadCapture', checked)}
                />
              </div>

              {formSettings.enableLeadCapture && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-100">
                  <div>
                    <Label>Lead Capture Message</Label>
                    <Textarea
                      value={formSettings.leadCaptureMessage}
                      onChange={(e) => handleSettingChange('leadCaptureMessage', e.target.value)}
                      placeholder="Message shown to encourage form submission"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Thank You Message</Label>
                    <Textarea
                      value={formSettings.thankYouMessage}
                      onChange={(e) => handleSettingChange('thankYouMessage', e.target.value)}
                      placeholder="Message shown after successful submission"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bundle Discount Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Bundle Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Enable Bundle Discount</Label>
                  <p className="text-sm text-gray-600">
                    Offer discounts when customers select multiple services
                  </p>
                </div>
                <Switch
                  checked={formSettings.showBundleDiscount}
                  onCheckedChange={(checked) => handleSettingChange('showBundleDiscount', checked)}
                />
              </div>

              {formSettings.showBundleDiscount && (
                <div className="space-y-6 pl-4 border-l-2 border-green-100">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Discount Percentage: {formSettings.bundleDiscountPercent}%
                    </Label>
                    <Slider
                      value={[formSettings.bundleDiscountPercent]}
                      onValueChange={([value]) => handleSettingChange('bundleDiscountPercent', value)}
                      max={50}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1%</span>
                      <span>50%</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Minimum Services Required: {formSettings.bundleMinServices}
                    </Label>
                    <Slider
                      value={[formSettings.bundleMinServices]}
                      onValueChange={([value]) => handleSettingChange('bundleMinServices', value)}
                      max={5}
                      min={2}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>2 services</span>
                      <span>5 services</span>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm text-green-700">
                      <strong>Preview:</strong> When customers select {formSettings.bundleMinServices}+ services, 
                      they'll save {formSettings.bundleDiscountPercent}% on their total quote.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales Tax Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Sales Tax
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Enable Sales Tax</Label>
                  <p className="text-sm text-gray-600">
                    Automatically calculate and display tax on quotes
                  </p>
                </div>
                <Switch
                  checked={formSettings.enableSalesTax}
                  onCheckedChange={(checked) => handleSettingChange('enableSalesTax', checked)}
                />
              </div>

              {formSettings.enableSalesTax && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        value={formSettings.salesTaxRate}
                        onChange={(e) => handleSettingChange('salesTaxRate', parseFloat(e.target.value) || 0)}
                        placeholder="8.25"
                        step="0.01"
                        min="0"
                        max="20"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Tax Label</Label>
                      <Input
                        value={formSettings.salesTaxLabel}
                        onChange={(e) => handleSettingChange('salesTaxLabel', e.target.value)}
                        placeholder="Sales Tax"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> Make sure to comply with local tax requirements. 
                      Tax rates vary by location and service type.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact & Business Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formSettings.contactEmail}
                  onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                  placeholder="info@yourbusiness.com"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This email will be shown to customers for questions and support
                </p>
              </div>

              <div>
                <Label>Business Description</Label>
                <Textarea
                  value={formSettings.businessDescription}
                  onChange={(e) => handleSettingChange('businessDescription', e.target.value)}
                  placeholder="Brief description of your services and value proposition"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional description shown on your form (keep it concise)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
              size="lg"
            >
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save Form Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
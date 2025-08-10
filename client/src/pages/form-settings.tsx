import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileToggle } from "@/components/ui/mobile-toggle";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Percent, Receipt, Users, Mail, ExternalLink, UserCheck, MapPin, MessageSquare, HeadphonesIcon, FileText, ImageIcon, Upload, Tag, Plus, Trash2, Edit2 } from "lucide-react";
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

  const { data: user } = useQuery<{id: string}>({
    queryKey: ["/api/auth/user"],
  });

  const businessSettings = settings as BusinessSettings;
  
  // Form state
  const [formSettings, setFormSettings] = useState({
    requireContactFirst: false,
    showProgressGuide: true,
    enableBooking: true,
    showBundleDiscount: false,
    bundleDiscountPercent: 10,
    bundleMinServices: 2,
    enableSalesTax: false,
    salesTaxRate: 8.25,
    salesTaxLabel: "Sales Tax",

    leadCaptureMessage: "Get your custom quote today! We'll contact you within 24 hours.",
    thankYouMessage: "Thank you for your interest! We'll review your requirements and contact you soon.",
    contactEmail: "info@example.com",
    businessDescription: "Professional services with competitive pricing and quality guarantee.",
    
    // Contact intake settings
    requireName: true,
    requireEmail: true,
    requirePhone: false,
    enablePhone: true,
    enableAddress: false,
    requireAddress: false,
    enableNotes: false,
    enableHowDidYouHear: false,
    requireHowDidYouHear: false,
    howDidYouHearOptions: ['Google Search', 'Social Media', 'Word of Mouth', 'Advertisement', 'Other'],
    nameLabel: 'Full Name',
    emailLabel: 'Email Address',
    phoneLabel: 'Phone Number',
    addressLabel: 'Address',
    notesLabel: 'Additional Notes',
    howDidYouHearLabel: 'How did you hear about us?',
    
    // Disclaimer settings
    enableDisclaimer: false,
    disclaimerText: 'Prices are estimates and may vary based on specific requirements. Final pricing will be confirmed after consultation.',
    
    // Image upload settings
    enableImageUpload: false,
    requireImageUpload: false,
    imageUploadLabel: 'Upload Images',
    imageUploadDescription: 'Please upload relevant images to help us provide an accurate quote',
    maxImages: 5,
    maxImageSize: 10,
    imageUploadHelperText: 'Upload clear photos showing the area or items that need service. This helps us provide more accurate pricing.',
    
    // Location-based pricing settings
    businessAddress: '',
    serviceRadius: 25,
    enableDistancePricing: false,
    distancePricingType: 'dollar',
    distancePricingRate: 0,
    
    // Discount system
    discounts: [
      { id: 'military', name: 'Military Discount', percentage: 10, isActive: true, description: 'For active and veteran military personnel' },
      { id: 'elderly', name: 'Elderly Discount', percentage: 5, isActive: true, description: 'For customers 65 and older' }
    ],
    allowDiscountStacking: false,
  });

  // Load existing settings
  useEffect(() => {
    if (businessSettings?.styling) {
      console.log('Loading business settings:', {
        showBundleDiscount: businessSettings.styling.showBundleDiscount,
        enableSalesTax: businessSettings.styling.enableSalesTax,
        enableDisclaimer: businessSettings.styling.enableDisclaimer
      });
      setFormSettings({
        requireContactFirst: businessSettings.styling.requireContactFirst || false,
        showProgressGuide: businessSettings.styling.showProgressGuide ?? true,
        enableBooking: businessSettings.styling.enableBooking ?? true,
        showBundleDiscount: businessSettings.styling.showBundleDiscount ?? false,
        bundleDiscountPercent: businessSettings.styling.bundleDiscountPercent || 10,
        bundleMinServices: 2,
        enableSalesTax: businessSettings.styling.enableSalesTax ?? false,
        salesTaxRate: businessSettings.styling.salesTaxRate || 8.25,
        salesTaxLabel: businessSettings.styling.salesTaxLabel || "Sales Tax",

        leadCaptureMessage: "Get your custom quote today! We'll contact you within 24 hours.",
        thankYouMessage: "Thank you for your interest! We'll review your requirements and contact you soon.",
        contactEmail: "info@example.com",
        businessDescription: "Professional services with competitive pricing and quality guarantee.",
        
        // Contact intake settings
        requireName: businessSettings.styling.requireName ?? true,
        requireEmail: businessSettings.styling.requireEmail ?? true,
        requirePhone: businessSettings.styling.requirePhone || false,
        enablePhone: businessSettings.styling.enablePhone ?? true,
        enableAddress: businessSettings.styling.enableAddress || false,
        requireAddress: businessSettings.styling.requireAddress || false,
        enableNotes: businessSettings.styling.enableNotes || false,
        enableHowDidYouHear: businessSettings.styling.enableHowDidYouHear || false,
        requireHowDidYouHear: businessSettings.styling.requireHowDidYouHear || false,
        howDidYouHearOptions: businessSettings.styling.howDidYouHearOptions || ['Google Search', 'Social Media', 'Word of Mouth', 'Advertisement', 'Other'],
        nameLabel: businessSettings.styling.nameLabel || 'Full Name',
        emailLabel: businessSettings.styling.emailLabel || 'Email Address',
        phoneLabel: businessSettings.styling.phoneLabel || 'Phone Number',
        addressLabel: businessSettings.styling.addressLabel || 'Address',
        notesLabel: businessSettings.styling.notesLabel || 'Additional Notes',
        howDidYouHearLabel: businessSettings.styling.howDidYouHearLabel || 'How did you hear about us?',
        
        // Disclaimer settings
        enableDisclaimer: businessSettings.styling.enableDisclaimer ?? false,
        disclaimerText: businessSettings.styling.disclaimerText || 'Prices are estimates and may vary based on specific requirements. Final pricing will be confirmed after consultation.',
        
        // Image upload settings
        enableImageUpload: businessSettings.styling.enableImageUpload || false,
        requireImageUpload: businessSettings.styling.requireImageUpload || false,
        imageUploadLabel: businessSettings.styling.imageUploadLabel || 'Upload Images',
        imageUploadDescription: businessSettings.styling.imageUploadDescription || 'Please upload relevant images to help us provide an accurate quote',
        maxImages: businessSettings.styling.maxImages || 5,
        maxImageSize: businessSettings.styling.maxImageSize || 10,
        imageUploadHelperText: businessSettings.styling.imageUploadHelperText || 'Upload clear photos showing the area or items that need service. This helps us provide more accurate pricing.',
        
        // Location-based pricing settings
        businessAddress: businessSettings.businessAddress || '',
        serviceRadius: businessSettings.serviceRadius || 25,
        enableDistancePricing: businessSettings.enableDistancePricing || false,
        distancePricingType: businessSettings.distancePricingType || 'dollar',
        distancePricingRate: businessSettings.distancePricingRate || 0,
        
        // Discount system
        discounts: businessSettings.discounts || [
          { id: 'military', name: 'Military Discount', percentage: 10, isActive: true, description: 'For active and veteran military personnel' },
          { id: 'elderly', name: 'Elderly Discount', percentage: 5, isActive: true, description: 'For customers 65 and older' }
        ],
        allowDiscountStacking: businessSettings.allowDiscountStacking || false,
      });
    }
  }, [businessSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      const response = await apiRequest('PATCH', '/api/business-settings', {
        styling: {
          ...businessSettings?.styling,
          requireContactFirst: updatedSettings.requireContactFirst,
          showProgressGuide: updatedSettings.showProgressGuide,
          enableBooking: updatedSettings.enableBooking,
          showBundleDiscount: updatedSettings.showBundleDiscount,
          bundleDiscountPercent: updatedSettings.bundleDiscountPercent,
          enableSalesTax: updatedSettings.enableSalesTax,
          salesTaxRate: updatedSettings.salesTaxRate,
          
          // Contact intake settings
          requireName: updatedSettings.requireName,
          requireEmail: updatedSettings.requireEmail,
          requirePhone: updatedSettings.requirePhone,
          enablePhone: updatedSettings.enablePhone,
          enableAddress: updatedSettings.enableAddress,
          requireAddress: updatedSettings.requireAddress,
          enableNotes: updatedSettings.enableNotes,
          enableHowDidYouHear: updatedSettings.enableHowDidYouHear,
          requireHowDidYouHear: updatedSettings.requireHowDidYouHear,
          howDidYouHearOptions: updatedSettings.howDidYouHearOptions,
          nameLabel: updatedSettings.nameLabel,
          emailLabel: updatedSettings.emailLabel,
          phoneLabel: updatedSettings.phoneLabel,
          addressLabel: updatedSettings.addressLabel,
          notesLabel: updatedSettings.notesLabel,
          howDidYouHearLabel: updatedSettings.howDidYouHearLabel,
          salesTaxLabel: updatedSettings.salesTaxLabel,
          
          // Disclaimer settings
          enableDisclaimer: updatedSettings.enableDisclaimer,
          disclaimerText: updatedSettings.disclaimerText,
          
          // Image upload settings
          enableImageUpload: updatedSettings.enableImageUpload,
          requireImageUpload: updatedSettings.requireImageUpload,
          imageUploadLabel: updatedSettings.imageUploadLabel,
          imageUploadDescription: updatedSettings.imageUploadDescription,
          maxImages: updatedSettings.maxImages,
          maxImageSize: updatedSettings.maxImageSize,
          imageUploadHelperText: updatedSettings.imageUploadHelperText,
        },
        // Location-based pricing settings
        businessAddress: updatedSettings.businessAddress,
        serviceRadius: updatedSettings.serviceRadius,
        enableDistancePricing: updatedSettings.enableDistancePricing,
        distancePricingType: updatedSettings.distancePricingType,
        distancePricingRate: updatedSettings.distancePricingRate,
        discounts: updatedSettings.discounts,
        allowDiscountStacking: updatedSettings.allowDiscountStacking,
      });
      return response.json();
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

  // Discount management functions
  const addDiscount = () => {
    const newDiscount = {
      id: `discount_${Date.now()}`,
      name: 'New Discount',
      percentage: 5,
      isActive: true,
      description: ''
    };
    
    setFormSettings(prev => ({
      ...prev,
      discounts: [...prev.discounts, newDiscount]
    }));
  };

  const updateDiscount = (index: number, field: string, value: any) => {
    setFormSettings(prev => ({
      ...prev,
      discounts: prev.discounts.map((discount, i) => 
        i === index ? { ...discount, [field]: value } : discount
      )
    }));
  };

  const removeDiscount = (index: number) => {
    setFormSettings(prev => ({
      ...prev,
      discounts: prev.discounts.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-8">
        
          {/* Form Settings Panel */}
          <div className="xl:col-span-2">
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
              <Link href={`/embed-form?userId=${user?.id}`}>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Contact Information First</Label>
                  <p className="text-sm text-gray-600">
                    Require customers to provide contact details before seeing pricing
                  </p>
                </div>
                <MobileToggle
                  checked={formSettings.requireContactFirst}
                  onCheckedChange={(checked) => handleSettingChange('requireContactFirst', checked)}
                  size="md"
                />
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">4-Step Progress Guide</Label>
                  <p className="text-sm text-gray-600">
                    Show a visual progress indicator at the top of your pricing form
                  </p>
                </div>
                <MobileToggle
                  checked={formSettings.showProgressGuide}
                  onCheckedChange={(checked) => handleSettingChange('showProgressGuide', checked)}
                  size="md"
                />
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Enable Booking Feature</Label>
                  <p className="text-sm text-gray-600">
                    Allow customers to book appointments directly from the quote form
                  </p>
                </div>
                <MobileToggle
                  checked={formSettings.enableBooking}
                  onCheckedChange={(checked) => handleSettingChange('enableBooking', checked)}
                  size="md"
                />
              </div>

              <Separator />

              {/* Lead capture is now determined by whether any contact fields are required */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <UserCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Lead Collection Status</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {(formSettings.requireName || formSettings.requireEmail || formSettings.requirePhone || 
                        (formSettings.enableAddress && formSettings.requireAddress)) 
                        ? "Contact information will be collected before showing prices"
                        : "Customers can see prices without providing contact information"
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Lead Capture Message</Label>
                  <p className="text-xs text-gray-500 mb-2">Message shown to encourage form submission when contact info is required</p>
                  <Textarea
                    value={formSettings.leadCaptureMessage}
                    onChange={(e) => handleSettingChange('leadCaptureMessage', e.target.value)}
                    placeholder="Get your custom quote today! We'll contact you within 24 hours."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Thank You Message</Label>
                  <p className="text-xs text-gray-500 mb-2">Message shown after successful submission</p>
                  <Textarea
                    value={formSettings.thankYouMessage}
                    onChange={(e) => handleSettingChange('thankYouMessage', e.target.value)}
                    placeholder="Thank you for your interest! We'll review your requirements and contact you soon."
                    className="mt-1"
                  />
                </div>
              </div>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Enable Bundle Discount</Label>
                  <p className="text-sm text-gray-600">
                    Offer discounts when customers select multiple services
                  </p>
                </div>
                <MobileToggle
                  checked={formSettings.showBundleDiscount}
                  onCheckedChange={(checked) => handleSettingChange('showBundleDiscount', checked)}
                  size="md"
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

          {/* Discount Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Customer Discounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Create discount types that customers can apply to their quotes. These appear as selection boxes on the pricing form.
                </p>

                {/* Discount Stacking Setting */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1 flex-1">
                    <Label className="text-base font-medium">Allow Discount Stacking</Label>
                    <p className="text-sm text-gray-600">
                      Let customers combine multiple discounts if they qualify
                    </p>
                  </div>
                  <MobileToggle
                    checked={formSettings.allowDiscountStacking}
                    onCheckedChange={(checked) => handleSettingChange('allowDiscountStacking', checked)}
                    size="md"
                  />
                </div>

                {/* Discounts List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Available Discounts</Label>
                    <Button
                      onClick={addDiscount}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Discount
                    </Button>
                  </div>

                  {formSettings.discounts.map((discount, index) => (
                    <div key={discount.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MobileToggle
                            checked={discount.isActive}
                            onCheckedChange={(checked) => updateDiscount(index, 'isActive', checked)}
                            size="sm"
                          />
                          <span className="text-sm font-medium">
                            {discount.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <Button
                          onClick={() => removeDiscount(index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Discount Name</Label>
                          <Input
                            value={discount.name}
                            onChange={(e) => updateDiscount(index, 'name', e.target.value)}
                            placeholder="e.g., Military Discount"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Percentage</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              value={discount.percentage}
                              onChange={(e) => updateDiscount(index, 'percentage', parseInt(e.target.value) || 0)}
                              min="1"
                              max="50"
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Description (Optional)</Label>
                        <Input
                          value={discount.description || ''}
                          onChange={(e) => updateDiscount(index, 'description', e.target.value)}
                          placeholder="e.g., For active and veteran military personnel"
                          className="mt-1"
                        />
                      </div>

                      {discount.isActive && (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm text-blue-700">
                            <strong>Preview:</strong> "{discount.name}" - {discount.percentage}% off
                            {discount.description && <span> • {discount.description}</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {formSettings.discounts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No discounts created yet</p>
                      <p className="text-sm">Add your first discount to get started</p>
                    </div>
                  )}
                </div>

                {formSettings.discounts.some(d => d.isActive) && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">How Discounts Work</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Active discounts appear as clickable options on your pricing form</li>
                      <li>• Customers can select discounts they qualify for</li>
                      {formSettings.allowDiscountStacking ? (
                        <li>• Multiple discounts can be combined when stacking is enabled</li>
                      ) : (
                        <li>• Customers can only apply one discount per quote</li>
                      )}
                      <li>• Discount amounts are clearly shown in the pricing breakdown</li>
                    </ul>
                  </div>
                )}
              </div>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Enable Sales Tax</Label>
                  <p className="text-sm text-gray-600">
                    Automatically calculate and display tax on quotes
                  </p>
                </div>
                <MobileToggle
                  checked={formSettings.enableSalesTax}
                  onCheckedChange={(checked) => handleSettingChange('enableSalesTax', checked)}
                  size="md"
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

          {/* Disclaimer Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Pricing Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Show Disclaimer</Label>
                  <p className="text-sm text-gray-600">
                    Display a disclaimer message on pricing pages to set customer expectations
                  </p>
                </div>
                <MobileToggle
                  checked={formSettings.enableDisclaimer}
                  onCheckedChange={(checked) => handleSettingChange('enableDisclaimer', checked)}
                  size="md"
                />
              </div>

              {formSettings.enableDisclaimer && (
                <div className="space-y-4 pl-4 border-l-2 border-orange-100">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Disclaimer Message
                    </Label>
                    <Textarea
                      value={formSettings.disclaimerText}
                      onChange={(e) => handleSettingChange('disclaimerText', e.target.value)}
                      placeholder="Enter your disclaimer message..."
                      rows={4}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This message will appear below pricing information to clarify terms and conditions.
                    </p>
                  </div>

                  <div className="bg-orange-50 p-3 rounded-md">
                    <p className="text-sm text-orange-700">
                      <strong>Preview:</strong> Your disclaimer will appear as small text below the price display, 
                      helping customers understand that prices are estimates.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Contact Intake Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Lead Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Configure what contact information to collect from potential customers
                </p>

                {/* Name Field */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1 flex-1">
                      <Label className="text-base font-medium">Name Field</Label>
                      <p className="text-sm text-gray-600">Customer's full name</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-gray-500">Show</span>
                      <MobileToggle
                        checked={formSettings.enableName ?? true}
                        onCheckedChange={(checked) => handleSettingChange('enableName', checked)}
                        size="sm"
                      />
                    </div>
                  </div>
                  {(formSettings.enableName ?? true) && (
                    <div className="pl-4 border-l-2 border-blue-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                        <MobileToggle
                          checked={formSettings.requireName ?? true}
                          onCheckedChange={(checked) => handleSettingChange('requireName', checked)}
                          size="sm"
                        />
                        <Label className="text-sm">Make name required</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1 flex-1">
                      <Label className="text-base font-medium">Email Field</Label>
                      <p className="text-sm text-gray-600">Customer's email address</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-gray-500">Show</span>
                      <MobileToggle
                        checked={formSettings.enableEmail ?? true}
                        onCheckedChange={(checked) => handleSettingChange('enableEmail', checked)}
                        size="sm"
                      />
                    </div>
                  </div>
                  {(formSettings.enableEmail ?? true) && (
                    <div className="pl-4 border-l-2 border-blue-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                        <MobileToggle
                          checked={formSettings.requireEmail ?? true}
                          onCheckedChange={(checked) => handleSettingChange('requireEmail', checked)}
                          size="sm"
                        />
                        <Label className="text-sm">Make email required</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Phone Field */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1 flex-1">
                      <Label className="text-base font-medium">Phone Field</Label>
                      <p className="text-sm text-gray-600">Customer's phone number</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-gray-500">Show</span>
                      <MobileToggle
                        checked={formSettings.enablePhone}
                        onCheckedChange={(checked) => handleSettingChange('enablePhone', checked)}
                        size="sm"
                      />
                    </div>
                  </div>
                  {formSettings.enablePhone && (
                    <div className="pl-4 border-l-2 border-blue-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                        <MobileToggle
                          checked={formSettings.requirePhone}
                          onCheckedChange={(checked) => handleSettingChange('requirePhone', checked)}
                          size="sm"
                        />
                        <Label className="text-sm">Make phone number required</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Address Field */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1 flex-1">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Address Field
                      </Label>
                      <p className="text-sm text-gray-600">Customer's physical address</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-gray-500">Show</span>
                      <MobileToggle
                        checked={formSettings.enableAddress}
                        onCheckedChange={(checked) => handleSettingChange('enableAddress', checked)}
                        size="sm"
                      />
                    </div>
                  </div>
                  {formSettings.enableAddress && (
                    <div className="pl-4 border-l-2 border-blue-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                        <MobileToggle
                          checked={formSettings.requireAddress}
                          onCheckedChange={(checked) => handleSettingChange('requireAddress', checked)}
                          size="sm"
                        />
                        <Label className="text-sm">Make address required</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes Field */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1 flex-1">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Notes Field
                      </Label>
                      <p className="text-sm text-gray-600">Additional comments or requirements</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-gray-500">Show</span>
                      <MobileToggle
                        checked={formSettings.enableNotes}
                        onCheckedChange={(checked) => handleSettingChange('enableNotes', checked)}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* How Did You Hear Field */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1 flex-1">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <HeadphonesIcon className="w-4 h-4" />
                        How Did You Hear About Us?
                      </Label>
                      <p className="text-sm text-gray-600">Track referral sources and marketing effectiveness</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-gray-500">Show</span>
                      <MobileToggle
                        checked={formSettings.enableHowDidYouHear}
                        onCheckedChange={(checked) => handleSettingChange('enableHowDidYouHear', checked)}
                        size="sm"
                      />
                    </div>
                  </div>
                  {formSettings.enableHowDidYouHear && (
                    <div className="pl-4 border-l-2 border-green-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                        <MobileToggle
                          checked={formSettings.requireHowDidYouHear}
                          onCheckedChange={(checked) => handleSettingChange('requireHowDidYouHear', checked)}
                          size="sm"
                        />
                        <Label className="text-sm">Make this field required</Label>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Referral Source Options</Label>
                        <Textarea
                          value={formSettings.howDidYouHearOptions.join('\n')}
                          onChange={(e) => handleSettingChange('howDidYouHearOptions', e.target.value.split('\n').filter(opt => opt.trim()))}
                          placeholder="Enter each option on a new line"
                          className="mt-1 font-mono text-sm"
                          rows={5}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          One option per line. These will appear as dropdown choices for customers.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Image Upload Field */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1 flex-1">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Image Upload
                      </Label>
                      <p className="text-sm text-gray-600">Let customers upload photos for more accurate pricing</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-gray-500">Enable</span>
                      <MobileToggle
                        checked={formSettings.enableImageUpload}
                        onCheckedChange={(checked) => handleSettingChange('enableImageUpload', checked)}
                        size="sm"
                      />
                    </div>
                  </div>
                  {formSettings.enableImageUpload && (
                    <div className="pl-4 border-l-2 border-purple-100 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                        <MobileToggle
                          checked={formSettings.requireImageUpload}
                          onCheckedChange={(checked) => handleSettingChange('requireImageUpload', checked)}
                          size="sm"
                        />
                        <Label className="text-sm">Make image upload required</Label>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Upload Button Label</Label>
                          <Input
                            value={formSettings.imageUploadLabel}
                            onChange={(e) => handleSettingChange('imageUploadLabel', e.target.value)}
                            placeholder="Upload Images"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Max Images</Label>
                          <div className="mt-1">
                            <Slider
                              value={[formSettings.maxImages]}
                              onValueChange={(value) => handleSettingChange('maxImages', value[0])}
                              min={1}
                              max={10}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>1</span>
                              <span className="font-medium">{formSettings.maxImages} images</span>
                              <span>10</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Max File Size (MB)</Label>
                          <div className="mt-1">
                            <Slider
                              value={[formSettings.maxImageSize]}
                              onValueChange={(value) => handleSettingChange('maxImageSize', value[0])}
                              min={1}
                              max={50}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>1MB</span>
                              <span className="font-medium">{formSettings.maxImageSize}MB</span>
                              <span>50MB</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Upload Description</Label>
                        <Input
                          value={formSettings.imageUploadDescription}
                          onChange={(e) => handleSettingChange('imageUploadDescription', e.target.value)}
                          placeholder="Please upload relevant images to help us provide an accurate quote"
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Short description shown above the upload area
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Helper Text</Label>
                        <Textarea
                          value={formSettings.imageUploadHelperText}
                          onChange={(e) => handleSettingChange('imageUploadHelperText', e.target.value)}
                          placeholder="Upload clear photos showing the area or items that need service..."
                          className="mt-1"
                          rows={2}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Detailed instructions to help customers upload useful images
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Field Labels Customization */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Customize Field Labels</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name Field Label</Label>
                      <Input
                        value={formSettings.nameLabel}
                        onChange={(e) => handleSettingChange('nameLabel', e.target.value)}
                        placeholder="Full Name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Email Field Label</Label>
                      <Input
                        value={formSettings.emailLabel}
                        onChange={(e) => handleSettingChange('emailLabel', e.target.value)}
                        placeholder="Email Address"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Phone Field Label</Label>
                      <Input
                        value={formSettings.phoneLabel}
                        onChange={(e) => handleSettingChange('phoneLabel', e.target.value)}
                        placeholder="Phone Number"
                        className="mt-1"
                      />
                    </div>
                    {formSettings.enableAddress && (
                      <div>
                        <Label>Address Field Label</Label>
                        <Input
                          value={formSettings.addressLabel}
                          onChange={(e) => handleSettingChange('addressLabel', e.target.value)}
                          placeholder="Address"
                          className="mt-1"
                        />
                      </div>
                    )}
                    {formSettings.enableNotes && (
                      <div>
                        <Label>Notes Field Label</Label>
                        <Input
                          value={formSettings.notesLabel}
                          onChange={(e) => handleSettingChange('notesLabel', e.target.value)}
                          placeholder="Additional Notes"
                          className="mt-1"
                        />
                      </div>
                    )}
                    {formSettings.enableHowDidYouHear && (
                      <div>
                        <Label>Referral Source Label</Label>
                        <Input
                          value={formSettings.howDidYouHearLabel}
                          onChange={(e) => handleSettingChange('howDidYouHearLabel', e.target.value)}
                          placeholder="How did you hear about us?"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Location-Based Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location-Based Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Distance Pricing Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Enable Distance-Based Pricing</Label>
                  <p className="text-sm text-gray-600">
                    Charge additional fees for customers outside your service area
                  </p>
                </div>
                <MobileToggle
                  checked={formSettings.enableDistancePricing}
                  onCheckedChange={(checked) => handleSettingChange('enableDistancePricing', checked)}
                  size="md"
                />
              </div>

              {/* Business Address */}
              <div>
                <Label>Business Address</Label>
                <Input
                  value={formSettings.businessAddress}
                  onChange={(e) => handleSettingChange('businessAddress', e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your business location used to calculate distances to customer addresses
                </p>
              </div>

              {formSettings.enableDistancePricing && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-100">
                  {/* Service Radius */}
                  <div>
                    <Label className="text-sm font-medium">Service Area Radius (miles)</Label>
                    <div className="mt-2">
                      <Slider
                        value={[formSettings.serviceRadius]}
                        onValueChange={(value) => handleSettingChange('serviceRadius', value[0])}
                        min={5}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>5 mi</span>
                        <span className="font-medium">{formSettings.serviceRadius} miles</span>
                        <span>100 mi</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Customers within this radius pay standard pricing
                    </p>
                  </div>

                  {/* Pricing Type */}
                  <div>
                    <Label className="text-sm font-medium">Distance Fee Type</Label>
                    <Select
                      value={formSettings.distancePricingType}
                      onValueChange={(value) => handleSettingChange('distancePricingType', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dollar">Fixed Dollar Amount per Mile</SelectItem>
                        <SelectItem value="percent">Percentage of Quote per Mile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pricing Rate */}
                  <div>
                    <Label className="text-sm font-medium">
                      {formSettings.distancePricingType === 'dollar' ? 'Fee per Mile ($)' : 'Percentage per Mile (%)'}
                    </Label>
                    <div className="mt-2">
                      <Slider
                        value={[formSettings.distancePricingRate / (formSettings.distancePricingType === 'dollar' ? 100 : 100)]}
                        onValueChange={(value) => handleSettingChange('distancePricingRate', 
                          Math.round(value[0] * (formSettings.distancePricingType === 'dollar' ? 100 : 100))
                        )}
                        min={formSettings.distancePricingType === 'dollar' ? 0.25 : 0.1}
                        max={formSettings.distancePricingType === 'dollar' ? 10 : 5}
                        step={formSettings.distancePricingType === 'dollar' ? 0.25 : 0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formSettings.distancePricingType === 'dollar' ? '$0.25' : '0.1%'}</span>
                        <span className="font-medium">
                          {formSettings.distancePricingType === 'dollar' 
                            ? `$${(formSettings.distancePricingRate / 100).toFixed(2)}` 
                            : `${(formSettings.distancePricingRate / 100).toFixed(1)}%`
                          } per mile
                        </span>
                        <span>{formSettings.distancePricingType === 'dollar' ? '$10.00' : '5.0%'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formSettings.distancePricingType === 'dollar' 
                        ? 'Fixed fee added for each mile beyond your service radius'
                        : 'Percentage of quote added for each mile beyond your service radius'
                      }
                    </p>
                  </div>

                  {/* Example Calculation */}
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>Example:</strong> Customer 10 miles outside your {formSettings.serviceRadius}-mile radius 
                      {formSettings.distancePricingType === 'dollar' 
                        ? ` pays an extra $${((formSettings.distancePricingRate / 100) * 10).toFixed(2)} distance fee.`
                        : ` pays ${((formSettings.distancePricingRate / 100) * 10).toFixed(1)}% extra on their quote.`
                      }
                    </p>
                  </div>
                </div>
              )}

              {!formSettings.enableDistancePricing && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    Enable distance-based pricing to automatically charge travel fees for customers outside your service area. 
                    Make sure to enable address collection in Customer Flow settings.
                  </p>
                </div>
              )}
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

        {/* Live Preview Panel */}
        <div className="xl:col-span-1">
          <Card className="sticky top-4 sm:top-8">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                Live Form Preview
              </CardTitle>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">See your logic changes in real-time</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative">
                <div className="bg-gray-100 rounded-lg p-2 overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                  <iframe
                    src={`/embed-form?userId=${user?.id}`}
                    className="w-full h-[600px] border-0 rounded"
                    title="Live Form Preview"
                    style={{
                      transform: 'scale(0.8)',
                      transformOrigin: 'top left',
                      width: '125%',
                      height: '750px'
                    }}
                  />
                </div>
                <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  Live Preview
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
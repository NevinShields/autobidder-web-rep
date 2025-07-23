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
import { Settings, Percent, Receipt, Users, Mail, ExternalLink, UserCheck, MapPin, MessageSquare, HeadphonesIcon } from "lucide-react";
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
    showProgressGuide: true,
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
  });

  // Load existing settings
  useEffect(() => {
    if (businessSettings?.styling) {
      setFormSettings({
        requireContactFirst: businessSettings.styling.requireContactFirst || false,
        showProgressGuide: businessSettings.styling.showProgressGuide ?? true,
        showBundleDiscount: businessSettings.styling.showBundleDiscount || false,
        bundleDiscountPercent: businessSettings.styling.bundleDiscountPercent || 10,
        bundleMinServices: 2,
        enableSalesTax: businessSettings.styling.enableSalesTax || false,
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
      });
    }
  }, [businessSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      const response = await apiRequest('PATCH', '/api/business-settings', {
        enableLeadCapture: updatedSettings.enableLeadCapture,
        styling: {
          ...businessSettings?.styling,
          requireContactFirst: updatedSettings.requireContactFirst,
          showProgressGuide: updatedSettings.showProgressGuide,
          showBundleDiscount: updatedSettings.showBundleDiscount,
          bundleDiscountPercent: updatedSettings.bundleDiscountPercent,
          enableSalesTax: updatedSettings.enableSalesTax,
          salesTaxRate: updatedSettings.salesTaxRate,
          
          // Contact intake settings
          requireName: updatedSettings.requireName,
          requireEmail: updatedSettings.requireEmail,
          requirePhone: updatedSettings.requirePhone,
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
        }
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Contact Information First</Label>
                  <p className="text-sm text-gray-600">
                    Require customers to provide contact details before seeing pricing
                  </p>
                </div>
                <Switch
                  checked={formSettings.requireContactFirst}
                  onCheckedChange={(checked) => handleSettingChange('requireContactFirst', checked)}
                  className="flex-shrink-0 self-start sm:self-auto"
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
                <Switch
                  checked={formSettings.showProgressGuide}
                  onCheckedChange={(checked) => handleSettingChange('showProgressGuide', checked)}
                  className="flex-shrink-0 self-start sm:self-auto"
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
                <Switch
                  checked={formSettings.showBundleDiscount}
                  onCheckedChange={(checked) => handleSettingChange('showBundleDiscount', checked)}
                  className="flex-shrink-0 self-start sm:self-auto"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Enable Sales Tax</Label>
                  <p className="text-sm text-gray-600">
                    Automatically calculate and display tax on quotes
                  </p>
                </div>
                <Switch
                  checked={formSettings.enableSalesTax}
                  onCheckedChange={(checked) => handleSettingChange('enableSalesTax', checked)}
                  className="flex-shrink-0 self-start sm:self-auto"
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1 flex-1">
                    <Label className="text-base font-medium">Name Field</Label>
                    <p className="text-sm text-gray-600">Customer's full name</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm text-gray-500">Required</span>
                    <Switch
                      checked={formSettings.requireName}
                      onCheckedChange={(checked) => handleSettingChange('requireName', checked)}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1 flex-1">
                    <Label className="text-base font-medium">Email Field</Label>
                    <p className="text-sm text-gray-600">Customer's email address</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm text-gray-500">Required</span>
                    <Switch
                      checked={formSettings.requireEmail}
                      onCheckedChange={(checked) => handleSettingChange('requireEmail', checked)}
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1 flex-1">
                      <Label className="text-base font-medium">Phone Field</Label>
                      <p className="text-sm text-gray-600">Customer's phone number</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-gray-500">Required</span>
                      <Switch
                        checked={formSettings.requirePhone}
                        onCheckedChange={(checked) => handleSettingChange('requirePhone', checked)}
                      />
                    </div>
                  </div>
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
                      <Switch
                        checked={formSettings.enableAddress}
                        onCheckedChange={(checked) => handleSettingChange('enableAddress', checked)}
                      />
                    </div>
                  </div>
                  {formSettings.enableAddress && (
                    <div className="pl-4 border-l-2 border-blue-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                        <Switch
                          checked={formSettings.requireAddress}
                          onCheckedChange={(checked) => handleSettingChange('requireAddress', checked)}
                          className="flex-shrink-0"
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
                      <Switch
                        checked={formSettings.enableNotes}
                        onCheckedChange={(checked) => handleSettingChange('enableNotes', checked)}
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
                      <Switch
                        checked={formSettings.enableHowDidYouHear}
                        onCheckedChange={(checked) => handleSettingChange('enableHowDidYouHear', checked)}
                      />
                    </div>
                  </div>
                  {formSettings.enableHowDidYouHear && (
                    <div className="pl-4 border-l-2 border-green-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                        <Switch
                          checked={formSettings.requireHowDidYouHear}
                          onCheckedChange={(checked) => handleSettingChange('requireHowDidYouHear', checked)}
                          className="flex-shrink-0"
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
                    src="/embed-form"
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
    </div>
  );
}
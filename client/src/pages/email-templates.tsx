import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Mail, Plus, User, Phone, MapPin, DollarSign, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
  description: string;
  enabled: boolean;
}

// Dynamic variables that users can insert
const DYNAMIC_VARIABLES = [
  { name: 'Customer Name', variable: '{{customerName}}', icon: User },
  { name: 'Customer Email', variable: '{{customerEmail}}', icon: Mail },
  { name: 'Customer Phone', variable: '{{customerPhone}}', icon: Phone },
  { name: 'Customer Address', variable: '{{customerAddress}}', icon: MapPin },
  { name: 'Service Name', variable: '{{serviceName}}', icon: Plus },
  { name: 'Total Price', variable: '{{totalPrice}}', icon: DollarSign },
  { name: 'Original Price', variable: '{{originalPrice}}', icon: DollarSign },
  { name: 'Revised Price', variable: '{{revisedPrice}}', icon: DollarSign },
  { name: 'Price Change', variable: '{{priceChange}}', icon: DollarSign },
  { name: 'Appointment Date', variable: '{{appointmentDate}}', icon: Calendar },
  { name: 'Appointment Time', variable: '{{appointmentTime}}', icon: Clock },
  { name: 'Current Date', variable: '{{currentDate}}', icon: Calendar },
  { name: 'Business Name', variable: '{{businessName}}', icon: Plus },
  { name: 'Business Phone', variable: '{{businessPhone}}', icon: Phone },
  { name: 'Business Email', variable: '{{businessEmail}}', icon: Mail },
];

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'lead-submitted',
    name: 'Lead Submitted Email',
    subject: 'Thank you for your {{serviceName}} inquiry - {{totalPrice}}',
    message: `Hi {{customerName}},

Thank you for your interest in our {{serviceName}} service. We've received your inquiry and will get back to you shortly.

Estimated Price: {{totalPrice}}
Service: {{serviceName}}
Date Submitted: {{currentDate}}

What happens next:
• We'll review your project details within 24 hours
• One of our specialists will contact you to discuss your needs  
• We'll provide a detailed estimate and timeline

If you have any questions, feel free to contact us:
{{businessName}}
Phone: {{businessPhone}}
Email: {{businessEmail}}

Best regards,
The {{businessName}} Team`,
    description: 'Sent automatically when customers submit pricing inquiries',
    enabled: true
  },
  {
    id: 'lead-booked',
    name: 'Appointment Booked Email',
    subject: 'Appointment Confirmed: {{serviceName}} on {{appointmentDate}}',
    message: `Hi {{customerName}},

Your appointment has been confirmed! We're looking forward to providing you with excellent service.

Appointment Details:
• Service: {{serviceName}}
• Date: {{appointmentDate}}
• Time: {{appointmentTime}}
• Location: {{customerAddress}}

Before your appointment:
• Please ensure easy access to the service area
• Have any relevant documents ready
• Contact us if you have any questions

Contact Information:
{{businessName}}
Phone: {{businessPhone}}
Email: {{businessEmail}}

We look forward to serving you!

Best regards,
The {{businessName}} Team`,
    description: 'Sent when customers book appointments or schedule services',
    enabled: true
  },
  {
    id: 'revised-bid',
    name: 'Revised Estimate Email',
    subject: 'Updated Estimate: {{serviceName}} - {{revisedPrice}}',
    message: `Hi {{customerName}},

We've reviewed your {{serviceName}} project and have an updated estimate for you.

Price Update:
• Original Estimate: {{originalPrice}}
• Updated Estimate: {{revisedPrice}}
• Price Change: {{priceChange}}

This updated estimate reflects the most accurate pricing based on your specific requirements. If you have any questions about the changes, please don't hesitate to contact us.

Contact Information:
{{businessName}}
Phone: {{businessPhone}}
Email: {{businessEmail}}

Thank you for choosing {{businessName}}!

Best regards,
The {{businessName}} Team`,
    description: 'Sent when pricing is updated or revised after initial quote',
    enabled: true
  }
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const currentTemplate = selectedTemplate ? templates.find(t => t.id === selectedTemplate) : null;

  const updateTemplate = (templateId: string, updates: Partial<EmailTemplate>) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, ...updates } : t
    ));
    setHasChanges(true);
  };

  const toggleTemplate = (templateId: string, enabled: boolean) => {
    updateTemplate(templateId, { enabled });
  };

  const insertVariable = (variable: string) => {
    if (!currentTemplate) return;
    
    const textarea = document.querySelector(`#message-${currentTemplate.id}`) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.slice(0, start) + variable + text.slice(end);
      
      updateTemplate(currentTemplate.id, { message: newText });
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleSave = async () => {
    try {
      // Here you would typically save to the backend
      console.log('Saving templates:', templates);
      
      toast({
        title: "Templates Saved",
        description: "Your email templates have been saved successfully."
      });
      
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving your templates. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Email Templates
            </h1>
            <p className="text-gray-600 mt-2">
              Turn email templates on/off and customize them with dynamic data
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
            className="gap-2"
            size="lg"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Email Template List with Toggle Switches */}
          <div className="lg:col-span-2 space-y-4">
            {templates.map((template) => (
              <Card key={template.id} className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label htmlFor={`toggle-${template.id}`} className="text-sm font-medium">
                        {template.enabled ? 'Enabled' : 'Disabled'}
                      </Label>
                      <Switch
                        id={`toggle-${template.id}`}
                        checked={template.enabled}
                        onCheckedChange={(checked) => toggleTemplate(template.id, checked)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`subject-${template.id}`}>Email Subject</Label>
                    <Input
                      id={`subject-${template.id}`}
                      value={template.subject}
                      onChange={(e) => updateTemplate(template.id, { subject: e.target.value })}
                      placeholder="Email subject line..."
                      disabled={!template.enabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`message-${template.id}`}>Email Message</Label>
                    <Textarea
                      id={`message-${template.id}`}
                      value={template.message}
                      onChange={(e) => updateTemplate(template.id, { message: e.target.value })}
                      placeholder="Email message content..."
                      rows={8}
                      disabled={!template.enabled}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
                      disabled={!template.enabled}
                    >
                      {selectedTemplate === template.id ? 'Hide Variables' : 'Show Variables'}
                    </Button>
                    <Badge variant={template.enabled ? 'default' : 'secondary'}>
                      {template.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dynamic Variables Box */}
          <div className="lg:col-span-1">
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl sticky top-6">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Dynamic Data
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Click to insert dynamic data into your email templates:
                </p>
                
                <div className="space-y-2">
                  {DYNAMIC_VARIABLES.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Button
                        key={item.variable}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-9 text-xs"
                        onClick={() => insertVariable(item.variable)}
                        disabled={!selectedTemplate}
                      >
                        <IconComponent className="h-3 w-3" />
                        {item.name}
                      </Button>
                    );
                  })}
                </div>
                
                {!selectedTemplate && (
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Click "Show Variables" on any email template to insert data
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
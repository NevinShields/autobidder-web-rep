import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EmailTemplateEditor } from '@/components/email-template-editor';
import { Save, Mail, CheckCircle, Clock, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
  description: string;
  category: string;
  status: 'active' | 'draft';
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'lead-submitted',
    name: 'Lead submitted',
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
    category: 'Customer Communication',
    status: 'active'
  },
  {
    id: 'lead-booked',
    name: 'Lead booked',
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
    category: 'Appointment Management',
    status: 'active'
  },
  {
    id: 'revised-bid',
    name: 'Revised bid',
    subject: 'Updated Estimate: {{serviceName}} - {{revisedPrice}}',
    message: `Hi {{customerName}},

We've reviewed your {{serviceName}} project and have an updated estimate for you.

Price Update:
• Original Estimate: {{originalPrice}}
• Updated Estimate: {{revisedPrice}}
• Price Change: {{priceChange}}

{{revisionReason}}

This updated estimate reflects the most accurate pricing based on your specific requirements. If you have any questions about the changes, please don't hesitate to contact us.

Contact Information:
{{businessName}}
Phone: {{businessPhone}}
Email: {{businessEmail}}

Thank you for choosing {{businessName}}!

Best regards,
The {{businessName}} Team`,
    description: 'Sent when pricing is updated or revised after initial quote',
    category: 'Price Management',
    status: 'active'
  }
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [activeTemplate, setActiveTemplate] = useState('lead-submitted');
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const currentTemplate = templates.find(t => t.id === activeTemplate) || templates[0];

  const updateTemplate = (updates: Partial<EmailTemplate>) => {
    setTemplates(prev => prev.map(t => 
      t.id === activeTemplate ? { ...t, ...updates } : t
    ));
    setHasChanges(true);
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

  const getStatusIcon = (status: string) => {
    return status === 'active' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <Clock className="h-4 w-4 text-yellow-500" />
    );
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
              Create and customize email templates with dynamic content for automatic customer communications
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template List Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setActiveTemplate(template.id)}
                      className={`w-full text-left p-4 transition-colors rounded-none border-l-4 ${
                        activeTemplate === template.id
                          ? 'bg-blue-50 border-l-blue-500 text-blue-700'
                          : 'hover:bg-gray-50 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{template.name}</span>
                        {getStatusIcon(template.status)}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {template.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Template Status Overview */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Template Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Active
                    </span>
                    <Badge variant="secondary">
                      {templates.filter(t => t.status === 'active').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Draft
                    </span>
                    <Badge variant="secondary">
                      {templates.filter(t => t.status === 'draft').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-3">
            {currentTemplate && (
              <EmailTemplateEditor
                templateName={currentTemplate.name}
                subject={currentTemplate.subject}
                message={currentTemplate.message}
                onSubjectChange={(subject) => updateTemplate({ subject })}
                onMessageChange={(message) => updateTemplate({ message })}
              />
            )}

            {/* Template Settings */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Template Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Template Status</label>
                    <div className="flex gap-2">
                      <Button
                        variant={currentTemplate.status === 'active' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateTemplate({ status: 'active' })}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Active
                      </Button>
                      <Button
                        variant={currentTemplate.status === 'draft' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateTemplate({ status: 'draft' })}
                        className="gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Draft
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Badge variant="outline" className="block w-fit">
                      {currentTemplate.category}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Automatic Email Sending</h4>
                  <p className="text-sm text-yellow-700">
                    This template will automatically be sent to customers when the corresponding action occurs:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• <strong>Lead submitted:</strong> When customers submit pricing forms</li>
                    <li>• <strong>Lead booked:</strong> When appointments are scheduled</li>
                    <li>• <strong>Revised bid:</strong> When pricing is updated or changed</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
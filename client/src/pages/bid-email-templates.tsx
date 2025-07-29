import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, Edit, Save, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/app-header';

interface BidEmailTemplate {
  id: number;
  userId: string;
  templateType: 'initial_bid' | 'updated_bid' | 'booking_confirmation';
  subject: string;
  body: string;
  fromName: string;
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_TYPES = [
  {
    key: 'initial_bid',
    label: 'Initial Bid Email',
    description: 'Email sent when a new bid/quote is created and sent to the customer'
  },
  {
    key: 'updated_bid',
    label: 'Updated Bid Email',
    description: 'Email sent when a bid/quote is revised or updated'
  },
  {
    key: 'booking_confirmation',
    label: 'Booking Confirmation',
    description: 'Email sent when a customer approves a bid and booking is confirmed'
  }
] as const;

const DEFAULT_TEMPLATES = {
  initial_bid: {
    subject: 'Your Service Quote is Ready - {{businessName}}',
    body: `Hi {{customerName}},

Thank you for your interest in our services! We've prepared a custom quote for you.

**Your Quote Details:**
Service: {{serviceName}}
Estimated Price: {{totalPrice}}

{{#hasMessage}}
**Additional Information:**
{{quoteMessage}}
{{/hasMessage}}

To review your complete quote and respond, please click here:
{{bidResponseLink}}

You can approve, request changes, or decline directly through this link.

Best regards,
{{fromName}}
{{businessName}}
{{businessPhone}}
{{businessEmail}}`,
    fromName: 'Your Service Team'
  },
  updated_bid: {
    subject: 'Updated Quote - {{businessName}}',
    body: `Hi {{customerName}},

We've updated your service quote based on your requirements.

**Updated Quote Details:**
Service: {{serviceName}}
New Price: {{totalPrice}}

{{#hasMessage}}
**What Changed:**
{{quoteMessage}}
{{/hasMessage}}

Please review your updated quote and let us know how you'd like to proceed:
{{bidResponseLink}}

Best regards,
{{fromName}}
{{businessName}}
{{businessPhone}}
{{businessEmail}}`,
    fromName: 'Your Service Team'
  },
  booking_confirmation: {
    subject: 'Service Booking Confirmed - {{businessName}}',
    body: `Hi {{customerName}},

Great news! Your service booking has been confirmed.

**Service Details:**
Service: {{serviceName}}
Final Price: {{totalPrice}}
{{#hasSchedule}}
Scheduled Date: {{scheduledDate}}
{{/hasSchedule}}

{{#hasMessage}}
**Customer Notes:**
{{customerMessage}}
{{/hasMessage}}

We'll be in touch soon to finalize the details and schedule your service.

Thank you for choosing us!

Best regards,
{{fromName}}
{{businessName}}
{{businessPhone}}
{{businessEmail}}`,
    fromName: 'Your Service Team'
  }
};

const AVAILABLE_VARIABLES = [
  { key: '{{customerName}}', description: 'Customer\'s name' },
  { key: '{{businessName}}', description: 'Your business name' },
  { key: '{{serviceName}}', description: 'Name of the service' },
  { key: '{{totalPrice}}', description: 'Total quote price' },
  { key: '{{quoteMessage}}', description: 'Message from business owner' },
  { key: '{{customerMessage}}', description: 'Message from customer' },
  { key: '{{bidResponseLink}}', description: 'Link for customer to respond' },
  { key: '{{fromName}}', description: 'Sender\'s name' },
  { key: '{{businessPhone}}', description: 'Business phone number' },
  { key: '{{businessEmail}}', description: 'Business email address' },
  { key: '{{scheduledDate}}', description: 'Scheduled service date' }
];

export default function BidEmailTemplatesPage() {
  const [activeTemplate, setActiveTemplate] = useState<string>('initial_bid');
  const [editingTemplate, setEditingTemplate] = useState<BidEmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/bid-email-templates'],
    queryFn: () => apiRequest('GET', '/api/bid-email-templates').then(res => res.json()),
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (templateData: Partial<BidEmailTemplate>) =>
      apiRequest('POST', '/api/bid-email-templates', templateData).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bid-email-templates'] });
      setIsCreating(false);
      setEditingTemplate(null);
      toast({
        title: "Template Created",
        description: "Email template has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<BidEmailTemplate>) =>
      apiRequest('PUT', `/api/bid-email-templates/${id}`, data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bid-email-templates'] });
      setEditingTemplate(null);
      toast({
        title: "Template Updated",
        description: "Email template has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const getCurrentTemplate = () => {
    return templates.find(t => t.templateType === activeTemplate);
  };

  const getDefaultTemplate = () => {
    return DEFAULT_TEMPLATES[activeTemplate as keyof typeof DEFAULT_TEMPLATES];
  };

  const handleCreateTemplate = () => {
    const defaultTemplate = getDefaultTemplate();
    setEditingTemplate({
      id: 0,
      userId: '',
      templateType: activeTemplate as any,
      subject: defaultTemplate.subject,
      body: defaultTemplate.body,
      fromName: defaultTemplate.fromName,
      createdAt: '',
      updatedAt: ''
    });
    setIsCreating(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    if (isCreating) {
      createTemplateMutation.mutate({
        templateType: editingTemplate.templateType,
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        fromName: editingTemplate.fromName,
      });
    } else {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        fromName: editingTemplate.fromName,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setIsCreating(false);
  };

  const insertVariable = (variable: string) => {
    if (!editingTemplate) return;
    
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = editingTemplate.body;
      const newText = text.substring(0, start) + variable + text.substring(end);
      
      setEditingTemplate({
        ...editingTemplate,
        body: newText
      });
      
      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppHeader />
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AppHeader />
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bid Email Templates</h1>
            <p className="text-gray-600">
              Customize the emails sent to customers for bids, quotes, and booking confirmations
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Template Selection */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Templates
                  </CardTitle>
                  <CardDescription>
                    Choose a template type to customize
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
                    <TabsList className="grid grid-cols-3 w-full">
                      {TEMPLATE_TYPES.map((type) => (
                        <TabsTrigger key={type.key} value={type.key} className="relative">
                          {type.label}
                          {templates.find(t => t.templateType === type.key) && (
                            <Badge variant="secondary" className="ml-2 h-4 w-4 p-0">
                              ✓
                            </Badge>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {TEMPLATE_TYPES.map((type) => (
                      <TabsContent key={type.key} value={type.key} className="space-y-4">
                        <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                          {type.description}
                        </div>

                        {(() => {
                          const currentTemplate = getCurrentTemplate();
                          const isEditing = editingTemplate?.templateType === type.key;

                          if (isEditing) {
                            return (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="from-name">From Name</Label>
                                  <Input
                                    id="from-name"
                                    value={editingTemplate.fromName}
                                    onChange={(e) => setEditingTemplate({
                                      ...editingTemplate,
                                      fromName: e.target.value
                                    })}
                                    placeholder="Your Service Team"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="subject">Email Subject</Label>
                                  <Input
                                    id="subject"
                                    value={editingTemplate.subject}
                                    onChange={(e) => setEditingTemplate({
                                      ...editingTemplate,
                                      subject: e.target.value
                                    })}
                                    placeholder="Enter email subject..."
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="template-body">Email Body</Label>
                                  <Textarea
                                    id="template-body"
                                    value={editingTemplate.body}
                                    onChange={(e) => setEditingTemplate({
                                      ...editingTemplate,
                                      body: e.target.value
                                    })}
                                    placeholder="Enter email body..."
                                    className="min-h-[300px] font-mono text-sm"
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleSaveTemplate}
                                    disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    {createTemplateMutation.isPending || updateTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
                                  </Button>
                                  <Button variant="outline" onClick={handleCancelEdit}>
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            );
                          }

                          if (currentTemplate) {
                            return (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>From Name</Label>
                                  <div className="p-3 bg-gray-50 rounded border text-sm">
                                    {currentTemplate.fromName}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Email Subject</Label>
                                  <div className="p-3 bg-gray-50 rounded border text-sm">
                                    {currentTemplate.subject}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Email Body</Label>
                                  <div className="p-3 bg-gray-50 rounded border text-sm font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                                    {currentTemplate.body}
                                  </div>
                                </div>

                                <Button
                                  onClick={() => setEditingTemplate(currentTemplate)}
                                  variant="outline"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Template
                                </Button>
                              </div>
                            );
                          }

                          return (
                            <div className="text-center py-8">
                              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No Template Created</h3>
                              <p className="text-gray-600 mb-4">
                                Create a custom email template for {type.label.toLowerCase()}
                              </p>
                              <Button onClick={handleCreateTemplate}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Template
                              </Button>
                            </div>
                          );
                        })()}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Variables Reference */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Available Variables</CardTitle>
                  <CardDescription>
                    Click to insert into your template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {AVAILABLE_VARIABLES.map((variable) => (
                    <div
                      key={variable.key}
                      className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => insertVariable(variable.key)}
                    >
                      <code className="text-sm font-mono text-blue-600">{variable.key}</code>
                      <p className="text-xs text-gray-600 mt-1">{variable.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Plus, User, Mail, MapPin, DollarSign, Calendar, Building, Phone, FileText, Clock, Hash } from 'lucide-react';

interface DynamicVariable {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
}

const DYNAMIC_VARIABLES: DynamicVariable[] = [
  // Customer Information
  { key: '{{customerName}}', label: 'Customer Name', description: 'Full name of the customer', icon: User, category: 'Customer' },
  { key: '{{customerEmail}}', label: 'Customer Email', description: 'Customer email address', icon: Mail, category: 'Customer' },
  { key: '{{customerPhone}}', label: 'Customer Phone', description: 'Customer phone number', icon: Phone, category: 'Customer' },
  { key: '{{customerAddress}}', label: 'Customer Address', description: 'Customer service address', icon: MapPin, category: 'Customer' },
  
  // Pricing Information  
  { key: '{{totalPrice}}', label: 'Total Price', description: 'Final calculated price', icon: DollarSign, category: 'Pricing' },
  { key: '{{originalPrice}}', label: 'Original Price', description: 'Initial quoted price', icon: DollarSign, category: 'Pricing' },
  { key: '{{revisedPrice}}', label: 'Revised Price', description: 'Updated price after changes', icon: DollarSign, category: 'Pricing' },
  { key: '{{priceChange}}', label: 'Price Change', description: 'Difference between original and revised', icon: DollarSign, category: 'Pricing' },
  
  // Service Information
  { key: '{{serviceName}}', label: 'Service Name', description: 'Name of the requested service', icon: FileText, category: 'Service' },
  { key: '{{serviceDescription}}', label: 'Service Description', description: 'Detailed service description', icon: FileText, category: 'Service' },
  { key: '{{estimateNumber}}', label: 'Estimate Number', description: 'Unique estimate identifier', icon: Hash, category: 'Service' },
  
  // Business Information
  { key: '{{businessName}}', label: 'Business Name', description: 'Your business name', icon: Building, category: 'Business' },
  { key: '{{businessPhone}}', label: 'Business Phone', description: 'Your business phone number', icon: Phone, category: 'Business' },
  { key: '{{businessEmail}}', label: 'Business Email', description: 'Your business email address', icon: Mail, category: 'Business' },
  
  // Date & Time
  { key: '{{appointmentDate}}', label: 'Appointment Date', description: 'Scheduled appointment date', icon: Calendar, category: 'Schedule' },
  { key: '{{appointmentTime}}', label: 'Appointment Time', description: 'Scheduled appointment time', icon: Clock, category: 'Schedule' },
  { key: '{{currentDate}}', label: 'Current Date', description: 'Today\'s date', icon: Calendar, category: 'Schedule' },
  { key: '{{validUntil}}', label: 'Valid Until', description: 'Estimate expiration date', icon: Calendar, category: 'Schedule' },
];

interface EmailTemplateEditorProps {
  templateName: string;
  subject: string;
  message: string;
  onSubjectChange: (subject: string) => void;
  onMessageChange: (message: string) => void;
  className?: string;
}

export function EmailTemplateEditor({
  templateName,
  subject,
  message,
  onSubjectChange,
  onMessageChange,
  className = ""
}: EmailTemplateEditorProps) {
  const [messageText, setMessageText] = useState(message);
  const [subjectText, setSubjectText] = useState(subject);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const categories = Array.from(new Set(DYNAMIC_VARIABLES.map(v => v.category)));

  // Insert variable at cursor position
  const insertVariable = (variable: string, isSubject: boolean = false) => {
    if (isSubject) {
      const newSubject = subjectText.slice(0, cursorPosition) + variable + subjectText.slice(cursorPosition);
      setSubjectText(newSubject);
      onSubjectChange(newSubject);
    } else {
      const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement;
      const start = textarea?.selectionStart || 0;
      const end = textarea?.selectionEnd || 0;
      
      const newMessage = messageText.slice(0, start) + variable + messageText.slice(end);
      setMessageText(newMessage);
      onMessageChange(newMessage);
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(start + variable.length, start + variable.length);
        }
      }, 0);
    }
  };

  const DynamicContentPopover = ({ isSubject = false }: { isSubject?: boolean }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Dynamic Content
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4">
          <h4 className="font-medium text-sm mb-3">Insert Dynamic Content</h4>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {categories.map(category => (
              <div key={category}>
                <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                  {category}
                </h5>
                <div className="grid gap-1">
                  {DYNAMIC_VARIABLES
                    .filter(variable => variable.category === category)
                    .map(variable => {
                      const Icon = variable.icon;
                      return (
                        <button
                          key={variable.key}
                          onClick={() => insertVariable(variable.key, isSubject)}
                          className="flex items-start gap-3 p-2 text-left hover:bg-gray-50 rounded-md text-sm group transition-colors"
                        >
                          <Icon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 group-hover:text-blue-600">
                              {variable.label}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {variable.description}
                            </div>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {variable.key}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  const handleMessageChange = (value: string) => {
    setMessageText(value);
    onMessageChange(value);
  };

  const handleSubjectChange = (value: string) => {
    setSubjectText(value);
    onSubjectChange(value);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{templateName} Email Template</CardTitle>
        <p className="text-sm text-gray-600">
          Create professional email templates with dynamic content that automatically fills in customer and business information.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subject Line */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="subject">Email Subject Line</Label>
            <DynamicContentPopover isSubject={true} />
          </div>
          <Input
            id="subject"
            placeholder="Enter email subject (e.g., Thank you for your {{serviceName}} inquiry - {{totalPrice}})"
            value={subjectText}
            onChange={(e) => handleSubjectChange(e.target.value)}
            onSelect={(e: any) => setCursorPosition(e.currentTarget.selectionStart || 0)}
          />
        </div>

        {/* Message Body */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="message-textarea">Email Message</Label>
            <DynamicContentPopover />
          </div>
          <Textarea
            id="message-textarea"
            placeholder={`Write your ${templateName.toLowerCase()} email message here...

Use dynamic content like:
- Hi {{customerName}},
- Your {{serviceName}} service is confirmed for {{appointmentDate}}
- Total price: {{totalPrice}}

Click "Add Dynamic Content" above to insert variables easily.`}
            value={messageText}
            onChange={(e) => handleMessageChange(e.target.value)}
            className="min-h-[200px] resize-y"
          />
        </div>

        {/* Quick Variables Reference */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-900 mb-2">Popular Variables</h5>
          <div className="flex flex-wrap gap-2">
            {['{{customerName}}', '{{serviceName}}', '{{totalPrice}}', '{{businessName}}', '{{appointmentDate}}'].map((variable: string) => (
              <button
                key={variable}
                onClick={() => insertVariable(variable)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded border border-blue-300 transition-colors"
              >
                {variable}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Note */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
          <strong>Note:</strong> Dynamic variables will be automatically replaced with actual customer and business data when emails are sent.
          For example, {{customerName}} becomes "John Smith" and {{totalPrice}} becomes "$2,500".
        </div>
      </CardContent>
    </Card>
  );
}
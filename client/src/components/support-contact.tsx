import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send,
  BookOpen,
  Video,
  FileText,
  Package
} from "lucide-react";
import { Link } from "wouter";

interface SupportContactProps {
  trigger?: React.ReactNode;
}

export default function SupportContact({ trigger }: SupportContactProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "medium",
    category: "general",
    customerName: "",
    customerEmail: "",
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/support-tickets", {
        ...data,
        userId: "user_support", // For user-created tickets
      });
    },
    onSuccess: () => {
      toast({
        title: "Support Request Sent",
        description: "We've received your support request and will get back to you within 24 hours.",
      });
      setIsOpen(false);
      setFormData({
        subject: "",
        description: "",
        priority: "medium",
        category: "general",
        customerName: "",
        customerEmail: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send support request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.description || !formData.customerName || !formData.customerEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createTicketMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const supportOptions = [
    {
      icon: MessageSquare,
      title: "Contact Support",
      description: "Get help with technical issues or questions",
      action: "contact"
    },
    {
      icon: BookOpen,
      title: "Documentation",
      description: "Browse guides and tutorials",
      action: "docs",
      external: true,
      url: "#"
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Watch step-by-step video guides",
      action: "videos",
      external: true,
      url: "#"
    },
    {
      icon: FileText,
      title: "FAQ",
      description: "Find answers to common questions",
      action: "faq",
      external: true,
      url: "#"
    },
    {
      icon: Package,
      title: "DFY Services",
      description: "Browse our done-for-you premium services",
      action: "dfy-services",
      internal: true,
      url: "/dfy-services"
    }
  ];

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <HelpCircle className="h-4 w-4" />
      Support
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Need Help?
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to get support or contact our team directly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Support Options */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {supportOptions.map((option, index) => {
              const Icon = option.icon;
              const CardComponent = (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                    option.action === "contact" ? "border-blue-200 bg-blue-50/50" : "border-gray-200"
                  }`}
                  onClick={() => {
                    if (option.external && option.url) {
                      window.open(option.url, '_blank');
                    } else if (option.internal && option.url) {
                      setIsOpen(false);
                    }
                  }}
                >
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium text-xs sm:text-sm mb-1">{option.title}</h3>
                    <p className="text-xs text-gray-600 hidden sm:block">{option.description}</p>
                  </CardContent>
                </Card>
              );

              return option.internal ? (
                <Link key={index} href={option.url!}>
                  {CardComponent}
                </Link>
              ) : (
                CardComponent
              );
            })}
          </div>

          {/* Contact Form */}
          <Card className="border-blue-200">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                Contact Support Team
              </CardTitle>
              <CardDescription className="text-sm">
                Fill out the form below and we'll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="customerName" className="text-sm">Your Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                      placeholder="John Doe"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail" className="text-sm">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                      placeholder="john@example.com"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Category and Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="category" className="text-sm">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Question</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing & Account</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="bug_report">Bug Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority" className="text-sm">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Low
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            High
                          </div>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Urgent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <Label htmlFor="subject" className="text-sm">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                    className="mt-1"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Please provide detailed information about your issue or question..."
                    rows={3}
                    required
                    className="mt-1 resize-none"
                  />
                </div>

                {/* Response Time Info - Compact Version */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2 text-sm">Expected Response Time</h4>
                      <div className="grid grid-cols-2 gap-1 text-xs text-blue-700">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                          <span>Urgent: 2hrs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          <span>High: 8hrs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                          <span>Medium: 24hrs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Low: 48hrs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    className="flex-1 order-2 sm:order-1"
                  >
                    {createTicketMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        <span className="sm:inline">Send Support Request</span>
                        <span className="sm:hidden">Send Request</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="order-1 sm:order-2"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Additional Contact Methods */}
          <div className="border-t pt-3">
            <h4 className="font-medium mb-2 text-sm">Other Ways to Reach Us</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">support@pricebuilder.pro</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Mon-Fri 9AM-6PM EST</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
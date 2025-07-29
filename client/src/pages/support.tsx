import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Mail, Clock, CheckCircle, Users, Lightbulb } from "lucide-react";

interface SupportForm {
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  category: "technical" | "billing" | "feature_request" | "bug_report" | "general";
}

export default function Support() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SupportForm>({
    subject: "",
    description: "",
    priority: "medium",
    category: "general",
  });

  const submitTicketMutation = useMutation({
    mutationFn: async (data: SupportForm) => {
      return await apiRequest("POST", "/api/support-tickets", data);
    },
    onSuccess: () => {
      setFormData({
        subject: "",
        description: "",
        priority: "medium",
        category: "general",
      });
      toast({
        title: "Support Ticket Submitted",
        description: "We'll get back to you within 24 hours",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit support ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    submitTicketMutation.mutate(formData);
  };

  const contactMethods = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help with our support team",
      action: "Start Chat",
      available: false,
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message about your issue",
      action: "Send Email",
      contact: "support@pricebuilder.com",
    },
  ];

  const responseTimeInfo = [
    { priority: "Urgent", time: "2-4 hours", color: "red" },
    { priority: "High", time: "4-8 hours", color: "orange" },
    { priority: "Medium", time: "8-24 hours", color: "blue" },
    { priority: "Low", time: "1-3 days", color: "green" },
  ];

  const supportCategories = [
    { value: "technical", label: "Technical Issue", icon: "🔧" },
    { value: "billing", label: "Billing & Payments", icon: "💳" },
    { value: "feature_request", label: "Feature Request", icon: "💡" },
    { value: "bug_report", label: "Bug Report", icon: "🐛" },
    { value: "general", label: "General Question", icon: "❓" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            How can we help you?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our support team is here to help you get the most out of PriceBuilder Pro. 
            Choose how you'd like to get in touch.
          </p>
        </div>

        {/* Quick Contact Methods */}
        <div className="grid md:grid-cols-2 gap-6">
          {contactMethods.map((method, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <method.icon className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <CardTitle>{method.title}</CardTitle>
                <CardDescription>{method.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                {method.available === false ? (
                  <Badge variant="secondary">Coming Soon</Badge>
                ) : method.contact ? (
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <a href={`mailto:${method.contact}`}>{method.action}</a>
                    </Button>
                    <p className="text-sm text-muted-foreground">{method.contact}</p>
                  </div>
                ) : (
                  <Button className="w-full">{method.action}</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Support Ticket Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Submit a Support Ticket
            </CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General questions</SelectItem>
                      <SelectItem value="medium">Medium - Standard issues</SelectItem>
                      <SelectItem value="high">High - Important problems</SelectItem>
                      <SelectItem value="urgent">Urgent - Critical issues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject *</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please provide detailed information about your issue, including any error messages or steps to reproduce the problem"
                  rows={6}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitTicketMutation.isPending}
              >
                {submitTicketMutation.isPending ? "Submitting..." : "Submit Support Ticket"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Response Time Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Expected Response Times
            </CardTitle>
            <CardDescription>
              We prioritize tickets based on urgency and complexity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {responseTimeInfo.map((info, index) => (
                <div key={index} className="text-center p-4 rounded-lg border">
                  <Badge 
                    variant={info.color === "red" ? "destructive" : 
                           info.color === "orange" ? "secondary" : 
                           info.color === "blue" ? "default" : "outline"}
                    className="mb-2"
                  >
                    {info.priority}
                  </Badge>
                  <p className="font-semibold">{info.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold">How do I embed a pricing calculator on my website?</h4>
                <p className="text-sm text-muted-foreground">
                  Go to your formula dashboard, copy the embed code, and paste it into your website's HTML.
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold">Can I customize the appearance of my calculators?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! Use the Design Dashboard to customize colors, fonts, and styling to match your brand.
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold">How do I upgrade or downgrade my plan?</h4>
                <p className="text-sm text-muted-foreground">
                  Visit your profile page and use the subscription management section to change your plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
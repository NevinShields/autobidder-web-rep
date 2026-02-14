import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Clock,
  Send,
  Video,
  FileText,
  Package,
  ArrowRight,
  LifeBuoy,
  ExternalLink,
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

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: () => fetch("/api/auth/user").then((res) => res.json()),
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!currentUser?.id) {
        throw new Error("Unable to verify your account. Please refresh and try again.");
      }
      return await apiRequest("POST", "/api/support-tickets", {
        ...data,
        userId: currentUser.id,
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
      description: "Submit a ticket below",
      action: "contact",
      accent: "from-amber-500 to-orange-600",
      bg: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20",
      border: "border-amber-200/60 dark:border-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step guides",
      action: "videos",
      external: true,
      url: "https://www.youtube.com/playlist?list=PLkRcrsyUsL2NgaSBhP1EZQ1C8LwjP05Bw",
      accent: "from-violet-500 to-purple-600",
      bg: "from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20",
      border: "border-violet-200/60 dark:border-violet-500/20",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      icon: FileText,
      title: "FAQ",
      description: "Common questions",
      action: "faq",
      internal: true,
      url: "/faq",
      accent: "from-emerald-500 to-teal-600",
      bg: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20",
      border: "border-emerald-200/60 dark:border-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Package,
      title: "DFY Services",
      description: "Done-for-you setup",
      action: "dfy-services",
      internal: true,
      url: "/dfy-services",
      accent: "from-rose-500 to-pink-600",
      bg: "from-rose-500/10 to-pink-500/10 dark:from-rose-500/20 dark:to-pink-500/20",
      border: "border-rose-200/60 dark:border-rose-500/20",
      iconColor: "text-rose-600 dark:text-rose-400",
    }
  ];

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <HelpCircle className="h-4 w-4" />
      Support
    </Button>
  );

  const inputClasses = "rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all text-sm";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div className="relative overflow-hidden px-6 pt-6 pb-5 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-800/80 dark:via-gray-900 dark:to-gray-900" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-200/30 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
              <LifeBuoy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-400/60 font-semibold">Support</p>
              <h2 className="text-xl text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                How can we help?
              </h2>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          {/* Quick Links Grid */}
          <div className="grid grid-cols-4 gap-2">
            {supportOptions.map((option, index) => {
              const Icon = option.icon;
              const content = (
                <div
                  key={index}
                  className={`group cursor-pointer rounded-xl border ${option.border} bg-gradient-to-br ${option.bg} p-3 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                  onClick={() => {
                    if (option.external && option.url) {
                      window.open(option.url, '_blank');
                    } else if (option.internal && option.url) {
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${option.accent} flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 leading-tight">{option.title}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 hidden sm:block">{option.description}</p>
                </div>
              );

              return option.internal ? (
                <Link key={index} href={option.url!}>
                  {content}
                </Link>
              ) : (
                <div key={index}>{content}</div>
              );
            })}
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/30 overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Send className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Submit a Ticket
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">We'll respond within 24 hours</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3.5 mt-1">
              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="customerName" className="text-xs font-medium text-gray-600 dark:text-gray-400">Your Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    placeholder="John Doe"
                    required
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customerEmail" className="text-xs font-medium text-gray-600 dark:text-gray-400">Email Address *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                    placeholder="john@example.com"
                    required
                    className={inputClasses}
                  />
                </div>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-medium text-gray-600 dark:text-gray-400">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className={inputClasses}>
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
                <div className="space-y-1.5">
                  <Label htmlFor="priority" className="text-xs font-medium text-gray-600 dark:text-gray-400">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger className={inputClasses}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                          Low
                        </span>
                      </SelectItem>
                      <SelectItem value="medium">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full" />
                          Medium
                        </span>
                      </SelectItem>
                      <SelectItem value="high">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-orange-500 rounded-full" />
                          High
                        </span>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full" />
                          Urgent
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-medium text-gray-600 dark:text-gray-400">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  placeholder="Brief description of your issue"
                  required
                  className={inputClasses}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-medium text-gray-600 dark:text-gray-400">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Please provide detailed information about your issue or question..."
                  rows={3}
                  required
                  className={`${inputClasses} resize-none`}
                />
              </div>

              {/* Response Time Info */}
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Response Times</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Urgent", time: "2h", color: "bg-red-500" },
                    { label: "High", time: "8h", color: "bg-orange-500" },
                    { label: "Medium", time: "24h", color: "bg-amber-500" },
                    { label: "Low", time: "48h", color: "bg-emerald-500" },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className={`w-1.5 h-1.5 ${item.color} rounded-full mx-auto mb-1`} />
                      <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{item.label}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm font-semibold h-10"
                >
                  {createTicketMutation.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Request
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer contact info */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                <Mail className="w-3 h-3" />
                <span className="text-[11px]">admin@autobidder.org</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                <Clock className="w-3 h-3" />
                <span className="text-[11px]">Mon-Fri 9AM-6PM EST</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

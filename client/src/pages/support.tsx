import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Mail, Clock, Lightbulb, Send, ChevronRight, ArrowRight, LifeBuoy, Wrench, CreditCard, Bug, HelpCircle, Zap } from "lucide-react";

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
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: () => fetch("/api/auth/user").then((res) => res.json()),
  });

  const submitTicketMutation = useMutation({
    mutationFn: async (data: SupportForm) => {
      if (!currentUser?.id) {
        throw new Error("Unable to verify your account. Please refresh and try again.");
      }
      const customerName =
        [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") ||
        currentUser.email ||
        "Customer";
      return await apiRequest("POST", "/api/support-tickets", {
        ...data,
        userId: currentUser.id,
        customerName,
        customerEmail: currentUser.email || "",
      });
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
      description: "Get instant help from our support team during business hours",
      action: "Start Chat",
      available: false,
      accent: "from-violet-500 to-purple-600",
      bgAccent: "from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20",
      borderAccent: "border-violet-200/60 dark:border-violet-500/20",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message and we'll respond within 24 hours",
      action: "Send Email",
      contact: "support@pricebuilder.com",
      accent: "from-emerald-500 to-teal-600",
      bgAccent: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20",
      borderAccent: "border-emerald-200/60 dark:border-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const responseTimeInfo = [
    { priority: "Urgent", time: "2-4 hours", color: "from-red-500 to-rose-600", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200/60 dark:border-red-500/20", text: "text-red-700 dark:text-red-400" },
    { priority: "High", time: "4-8 hours", color: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200/60 dark:border-amber-500/20", text: "text-amber-700 dark:text-amber-400" },
    { priority: "Medium", time: "8-24 hours", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200/60 dark:border-blue-500/20", text: "text-blue-700 dark:text-blue-400" },
    { priority: "Low", time: "1-3 days", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200/60 dark:border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-400" },
  ];

  const supportCategories = [
    { value: "technical", label: "Technical Issue", icon: Wrench },
    { value: "billing", label: "Billing & Payments", icon: CreditCard },
    { value: "feature_request", label: "Feature Request", icon: Lightbulb },
    { value: "bug_report", label: "Bug Report", icon: Bug },
    { value: "general", label: "General Question", icon: HelpCircle },
  ];

  const faqItems = [
    {
      question: "How do I embed a pricing calculator on my website?",
      answer: "Go to your formula dashboard, copy the embed code, and paste it into your website's HTML. You can customize the embed dimensions and styling before copying.",
      accent: "from-amber-500 to-orange-600",
    },
    {
      question: "Can I customize the appearance of my calculators?",
      answer: "Yes! Use the Design Dashboard to customize colors, fonts, and styling to match your brand. You can also use the AI CSS tool for advanced customization.",
      accent: "from-emerald-500 to-teal-600",
    },
    {
      question: "How do I upgrade or downgrade my plan?",
      answer: "Visit your profile page and use the subscription management section to change your plan. Changes take effect immediately and billing is prorated.",
      accent: "from-violet-500 to-purple-600",
    },
  ];

  return (
    <DashboardLayout>
      <style>{`
        @keyframes support-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .support-stagger { animation: support-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .support-stagger-1 { animation-delay: 0ms; }
        .support-stagger-2 { animation-delay: 60ms; }
        .support-stagger-3 { animation-delay: 120ms; }
        .support-stagger-4 { animation-delay: 180ms; }
        .support-stagger-5 { animation-delay: 240ms; }
        .support-stagger-6 { animation-delay: 300ms; }
        .support-card-hover { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
        .support-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px -8px rgba(0,0,0,0.12); }
        .dark .support-card-hover:hover { box-shadow: 0 8px 30px -8px rgba(0,0,0,0.4); }
        .support-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="p-4 sm:p-6 lg:p-8 support-grain" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Hero Header */}
          <div className="support-stagger support-stagger-1 relative overflow-hidden rounded-2xl border border-amber-200/40 dark:border-amber-500/10 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-200/30 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-orange-200/20 to-transparent dark:from-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                <LifeBuoy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-400/60 font-semibold mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Support Center</p>
                <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  How can we help you?
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-lg">
                  Our team is here to help you get the most out of Autobidder. Reach out anytime.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Contact Methods */}
          <div className="grid md:grid-cols-2 gap-4">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className={`support-stagger support-stagger-${index + 2} support-card-hover relative overflow-hidden rounded-2xl border ${method.borderAccent} bg-gradient-to-br ${method.bgAccent} backdrop-blur-sm p-5 sm:p-6`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${method.accent} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <method.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      {method.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{method.description}</p>
                    <div className="mt-4">
                      {method.available === false ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/40">
                          <Clock className="w-3 h-3" />
                          Coming Soon
                        </span>
                      ) : method.contact ? (
                        <div className="space-y-2">
                          <Button asChild size="sm" className={`rounded-full bg-gradient-to-r ${method.accent} hover:opacity-90 text-white shadow-sm`}>
                            <a href={`mailto:${method.contact}`}>
                              {method.action}
                              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </a>
                          </Button>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{method.contact}</p>
                        </div>
                      ) : (
                        <Button size="sm" className={`rounded-full bg-gradient-to-r ${method.accent} hover:opacity-90 text-white shadow-sm`}>
                          {method.action}
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Support Ticket Form */}
          <div className="support-stagger support-stagger-4 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    Submit a Support Ticket
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Fill out the form and we'll get back to you as soon as possible</p>
                </div>
              </div>
            </div>
            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {supportCategories.map((category) => {
                          const CatIcon = category.icon;
                          return (
                            <SelectItem key={category.value} value={category.value}>
                              <span className="flex items-center gap-2">
                                <CatIcon className="w-3.5 h-3.5 text-gray-400" />
                                {category.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all">
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
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject *</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    required
                    className="rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Please provide detailed information about your issue, including any error messages or steps to reproduce the problem"
                    rows={5}
                    required
                    className="rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all h-11 text-sm font-semibold"
                  disabled={submitTicketMutation.isPending}
                >
                  {submitTicketMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit Support Ticket
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Response Time Information */}
          <div className="support-stagger support-stagger-5 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    Expected Response Times
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">We prioritize tickets based on urgency and complexity</p>
                </div>
              </div>
            </div>
            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                {responseTimeInfo.map((info, index) => (
                  <div key={index} className={`relative overflow-hidden rounded-xl ${info.bg} border ${info.border} p-4 text-center`}>
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${info.text} bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 mb-2`}>
                      {info.priority}
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      {info.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="support-stagger support-stagger-6 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Quick answers to common questions</p>
                </div>
              </div>
            </div>
            <div className="px-3 sm:px-4 pb-4 sm:pb-5 space-y-1 mt-2">
              {faqItems.map((faq, index) => (
                <button
                  key={index}
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left rounded-xl px-4 py-3.5 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${faq.accent} mt-2 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{faq.question}</h4>
                        <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expandedFaq === index ? 'rotate-90' : ''}`} />
                      </div>
                      <div className={`overflow-hidden transition-all duration-200 ${expandedFaq === index ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

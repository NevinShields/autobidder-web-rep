import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calculator,
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  BarChart3,
  Palette,
  Calendar,
  Clock,
  Share,
  ArrowRight,
  Globe,
  LifeBuoy,
  X,
  Sparkles,
  Check
} from "lucide-react";
import { Link } from "wouter";
import type { Formula, Lead, MultiServiceLead, User } from "@shared/schema";
import DashboardLayout from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const TopServicesChart = lazy(() => import("@/components/dashboard/top-services-chart"));

const getQuickActions = (userId?: string) => [
  { icon: Plus, label: "View Calculator", href: "/formula/new", accent: "from-amber-500 to-orange-600" },
  { icon: Palette, label: "View Calculator", href: userId ? `/styled-calculator?userId=${userId}` : "/styled-calculator", accent: "from-violet-500 to-purple-600" },
  { icon: Share, label: "Share Link", href: "/embed-code", accent: "from-rose-500 to-pink-600" },
  { icon: Users, label: "Leads", href: "/leads", accent: "from-emerald-500 to-teal-600" },
  { icon: Calendar, label: "Calendar", href: "/calendar", accent: "from-sky-500 to-blue-600" },
  { icon: Globe, label: "Website", href: "/website", accent: "from-amber-400 to-yellow-600" },
];

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [serviceInput, setServiceInput] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [pricingDetails, setPricingDetails] = useState("");
  const [brandingWebsite, setBrandingWebsite] = useState("");
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false);
  const serviceInputRef = useRef<HTMLInputElement | null>(null);

  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  const { data: formulaList = [], isLoading: formulasLoading } = useQuery<Formula[]>({
    queryKey: ['/api/formulas'],
  });

  const { data: leadList = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const { data: multiLeadList = [], isLoading: multiLeadsLoading } = useQuery<MultiServiceLead[]>({
    queryKey: ['/api/multi-service-leads'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalCalculators: number;
    leadsThisMonth: number;
    avgQuoteValue: number;
    conversionRate: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const { data: profileData } = useQuery<{
    user: any;
    trialStatus: {
      isOnTrial: boolean;
      daysLeft: number;
      expired: boolean;
      trialEndDate: string;
    };
  }>({
    queryKey: ["/api/profile"],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgraded = params.get("upgrade");
    const sessionId = params.get("session_id");

    if (upgraded !== "success" || !sessionId) return;

    apiRequest("GET", `/api/verify-checkout/${sessionId}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data?.success) {
          toast({
            title: "Upgrade verification failed",
            description: data?.message || "We could not verify your payment yet. Please refresh shortly.",
            variant: "destructive",
          });
          return;
        }

        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription-details"] });

        const cleanPath = window.location.pathname;
        window.history.replaceState({}, "", cleanPath);

        toast({
          title: "Upgrade activated",
          description: `Your ${data.plan} plan is now active.`,
        });
      })
      .catch(() => {
        toast({
          title: "Upgrade verification error",
          description: "We could not verify your upgrade yet. Please refresh shortly.",
          variant: "destructive",
        });
      });
  }, [queryClient, toast]);

  const totalCalculators = formulaList.length;
  const totalLeads = leadList.length + multiLeadList.length;
  const avgQuoteValue = (stats?.avgQuoteValue || 0) / 100;
  const conversionRate = stats?.conversionRate || 0;

  const recentLeads = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return [...leadList, ...multiLeadList].filter(lead =>
      new Date(lead.createdAt) > weekAgo
    );
  }, [leadList, multiLeadList]);

  const serviceChartData = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const serviceSelections = new Map<number, { name: string; count: number; revenue: number }>();

    formulaList.forEach(formula => {
      serviceSelections.set(formula.id, { name: formula.name, count: 0, revenue: 0 });
    });

    leadList
      .filter(lead => new Date(lead.createdAt) > thirtyDaysAgo)
      .forEach(lead => {
        if (lead.formulaId && serviceSelections.has(lead.formulaId)) {
          const service = serviceSelections.get(lead.formulaId)!;
          service.count += 1;
          service.revenue += (lead.calculatedPrice || 0) / 100;
        }
      });

    multiLeadList
      .filter(lead => new Date(lead.createdAt) > thirtyDaysAgo)
      .forEach(lead => {
        if (lead.services && Array.isArray(lead.services)) {
          lead.services.forEach((service: any) => {
            if (service.formulaId && serviceSelections.has(service.formulaId)) {
              const serviceData = serviceSelections.get(service.formulaId)!;
              serviceData.count += 1;
              serviceData.revenue += (service.calculatedPrice || 0) / 100;
            }
          });
        }
      });

    return Array.from(serviceSelections.values())
      .filter(service => service.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(service => ({
        name: service.name.length > 15 ? service.name.substring(0, 15) + '...' : service.name,
        leads: service.count,
        revenue: service.revenue
      }));
  }, [formulaList, leadList, multiLeadList]);

  const { data: onboardingProgress } = useQuery<{
    completedSteps: Array<{ step: number; name: string; completed: boolean; completedAt?: string }>;
  }>({
    queryKey: ['/api/onboarding', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const res = await fetch(`/api/onboarding/${user?.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load onboarding progress');
      return res.json();
    },
  });

  const checklistItems = [
    { id: 'create_formula', step: 1, name: 'Create a simple formula', description: 'Start with one service so you can iterate quickly.', href: '/formula/new', actionLabel: 'Create' },
    { id: 'test_formula', step: 2, name: 'Test the formula', description: 'Run through the calculator to confirm pricing.', href: user?.id ? `/styled-calculator?userId=${user.id}` : '/styled-calculator', actionLabel: 'Test' },
    { id: 'generate_icon', step: 3, name: 'Generate a custom icon with AI', description: 'Create a branded icon for your service cards.', href: '/icon-generator', actionLabel: 'Generate' },
    { id: 'css_ai_tool', step: 4, name: 'Use the CSS AI tool', description: 'Describe the design and let AI generate custom CSS.', href: '/design', actionLabel: 'Open' },
  ];

  const checklistNames = new Set(checklistItems.map(item => item.name));
  const completedSteps = onboardingProgress?.completedSteps || [];
  const completedByName = new Map(completedSteps.map(step => [step.name, step.completed]));
  const completedCount = checklistItems.filter(item => completedByName.get(item.name)).length;

  const updateChecklistMutation = useMutation({
    mutationFn: async (updatedSteps: Array<{ step: number; name: string; completed: boolean; completedAt?: string }>) => {
      if (!user?.id) throw new Error('No user available');
      return apiRequest('PATCH', `/api/onboarding/${user.id}`, { completedSteps: updatedSteps });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding', user?.id] });
    },
    onError: () => {
      toast({ title: 'Checklist update failed', description: 'Please try again in a moment.', variant: 'destructive' });
    },
  });

  const toggleChecklistItem = (itemName: string) => {
    const existingSteps = completedSteps;
    const otherSteps = existingSteps.filter(step => !checklistNames.has(step.name));
    const updatedChecklistSteps = checklistItems.map(item => {
      const existing = existingSteps.find(step => step.name === item.name);
      const isTarget = item.name === itemName;
      const nextCompleted = isTarget ? !(existing?.completed ?? false) : (existing?.completed ?? false);
      return {
        step: item.step,
        name: item.name,
        completed: nextCompleted,
        completedAt: nextCompleted ? (existing?.completedAt || new Date().toISOString()) : undefined,
      };
    });
    updateChecklistMutation.mutate([...otherSteps, ...updatedChecklistSteps]);
  };

  const addServiceLineItem = () => {
    const trimmed = serviceInput.trim();
    if (!trimmed) return;
    setServices((prev) => [...prev, trimmed]);
    setServiceInput("");
    requestAnimationFrame(() => serviceInputRef.current?.focus());
  };

  const removeServiceLineItem = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetupRequestSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (services.length === 0) {
      toast({ title: "Add at least one service", description: "Enter a service line item before sending your setup request.", variant: "destructive" });
      return;
    }
    try {
      setIsSubmittingSetup(true);
      await apiRequest("POST", "/api/dfy-setup-request", {
        services,
        pricingDetails: pricingDetails.trim() || null,
        brandingWebsite: brandingWebsite.trim() || null,
      });
      toast({ title: "Setup request sent", description: "Our team will reach out soon to help you get everything set up." });
      setServices([]);
      setServiceInput("");
      setPricingDetails("");
      setBrandingWebsite("");
      setIsSetupDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Something went wrong", description: error?.message || "Please try again or reach out to support.", variant: "destructive" });
    } finally {
      setIsSubmittingSetup(false);
    }
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();
  const greetingName = user?.firstName?.trim() || user?.email?.split('@')[0] || "";

  if (formulasLoading || leadsLoading || multiLeadsLoading || statsLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Skeleton hero */}
            <div className="animate-pulse rounded-2xl h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
            {/* Skeleton metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl h-28 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
            {/* Skeleton cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="animate-pulse rounded-2xl h-48 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" />
              <div className="animate-pulse rounded-2xl h-48 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const metricCards = [
    { label: "Calculators", value: totalCalculators.toString(), icon: Calculator, gradient: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20", iconColor: "text-amber-600 dark:text-amber-400", borderAccent: "border-amber-200/60 dark:border-amber-500/20" },
    { label: "Total Leads", value: totalLeads.toString(), icon: Users, gradient: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20", iconColor: "text-emerald-600 dark:text-emerald-400", borderAccent: "border-emerald-200/60 dark:border-emerald-500/20" },
    { label: "Avg Quote", value: `$${avgQuoteValue.toLocaleString()}`, icon: DollarSign, gradient: "from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20", iconColor: "text-violet-600 dark:text-violet-400", borderAccent: "border-violet-200/60 dark:border-violet-500/20" },
    { label: "Conversion", value: `${conversionRate.toFixed(1)}%`, icon: TrendingUp, gradient: "from-rose-500/10 to-pink-500/10 dark:from-rose-500/20 dark:to-pink-500/20", iconColor: "text-rose-600 dark:text-rose-400", borderAccent: "border-rose-200/60 dark:border-rose-500/20" },
  ];

  return (
    <DashboardLayout>
      <style>{`
        @keyframes dash-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dash-stagger { animation: dash-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .dash-stagger-1 { animation-delay: 0ms; }
        .dash-stagger-2 { animation-delay: 60ms; }
        .dash-stagger-3 { animation-delay: 120ms; }
        .dash-stagger-4 { animation-delay: 180ms; }
        .dash-stagger-5 { animation-delay: 240ms; }
        .dash-stagger-6 { animation-delay: 300ms; }
        .dash-stagger-7 { animation-delay: 360ms; }
        .dash-metric-hover { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
        .dash-metric-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px -8px rgba(0,0,0,0.12); }
        .dark .dash-metric-hover:hover { box-shadow: 0 8px 30px -8px rgba(0,0,0,0.4); }
        .dash-checklist-item { transition: all 0.2s ease; }
        .dash-checklist-item:hover { background: rgba(245, 158, 11, 0.04); }
        .dark .dash-checklist-item:hover { background: rgba(245, 158, 11, 0.06); }
        .dash-quick-action { transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .dash-quick-action:hover { transform: translateY(-1px) scale(1.02); }
        .dash-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="p-4 sm:p-6 lg:p-8 dash-grain" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Hero Header */}
          <div className="dash-stagger dash-stagger-1 relative overflow-hidden rounded-2xl border border-amber-200/40 dark:border-amber-500/10 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-200/30 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-orange-200/20 to-transparent dark:from-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-400/60 font-semibold mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Overview</p>
                <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  {greeting}{greetingName ? `, ${greetingName}` : ''}
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                  Here's how your business is performing. Stay on top of leads, quotes, and conversions.
                </p>
                <Button asChild className="mt-4 rounded-full bg-amber-600 hover:bg-amber-700 text-white">
                  <Link href="/call-screen">Use Calculator</Link>
                </Button>
              </div>
              {profileData?.trialStatus?.isOnTrial && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-amber-100/70 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/40 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    {profileData.trialStatus.daysLeft}d left
                  </span>
                  <Button asChild size="sm" className="h-7 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs px-3">
                    <Link href="/upgrade">Upgrade</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {metricCards.map((metric, i) => (
              <div
                key={metric.label}
                className={`dash-stagger dash-stagger-${i + 2} dash-metric-hover relative overflow-hidden rounded-2xl border ${metric.borderAccent} bg-gradient-to-br ${metric.gradient} backdrop-blur-sm p-4 sm:p-5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">{metric.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      {metric.value}
                    </p>
                  </div>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10`}>
                    <metric.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${metric.iconColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Setup Help Banner */}
          <div className="dash-stagger dash-stagger-6 relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm p-5 sm:p-6">
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-radial from-amber-100/40 to-transparent dark:from-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                  <LifeBuoy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    Want us to set this up for you?
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 max-w-xl">
                    Share your services and branding. We'll build your pricing setup and match your look and feel.
                  </p>
                </div>
              </div>
              <Button
                className="rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white px-6 flex-shrink-0"
                onClick={() => setIsSetupDialogOpen(true)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Get setup help
              </Button>
            </div>
          </div>

          {/* Two Column: Checklist + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

            {/* Setup Checklist */}
            <div className="dash-stagger dash-stagger-7 lg:col-span-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
              <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      Getting Started
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{completedCount} of {checklistItems.length} completed</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {checklistItems.map((item, i) => {
                      const done = completedByName.get(item.name) ?? false;
                      return (
                        <div
                          key={item.id}
                          className={`w-2 h-2 rounded-full transition-colors duration-300 ${done ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="px-3 sm:px-4 pb-4 sm:pb-5 space-y-1">
                {checklistItems.map((item, i) => {
                  const isCompleted = completedByName.get(item.name) ?? false;
                  return (
                    <div
                      key={item.id}
                      className="dash-checklist-item flex items-center gap-3 rounded-xl px-3 py-3"
                    >
                      <button
                        onClick={() => toggleChecklistItem(item.name)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          isCompleted
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-amber-400 dark:hover:border-amber-500'
                        }`}
                      >
                        {isCompleted && <Check className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium transition-colors ${isCompleted ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-200"}`}>
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 hidden sm:block">{item.description}</p>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg h-7 px-2.5 flex-shrink-0"
                      >
                        <Link href={item.href}>
                          {item.actionLabel}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dash-stagger dash-stagger-7 lg:col-span-2 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {getQuickActions(user?.id || '').map((action) => (
                  <Link key={action.href} href={action.href}>
                    <div className="dash-quick-action group flex flex-col items-center gap-2 rounded-xl border border-gray-200/60 dark:border-gray-700/40 bg-white/50 dark:bg-gray-800/30 hover:border-amber-300/60 dark:hover:border-amber-500/30 p-4 cursor-pointer">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.accent} flex items-center justify-center shadow-sm`}>
                        <action.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">{action.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section: Recent Leads + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

            {/* Recent Leads */}
            <div className="dash-stagger dash-stagger-7 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
              <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Recent Leads
                </h2>
                <Button asChild variant="ghost" size="sm" className="text-xs text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg h-7 px-2.5">
                  <Link href="/leads">
                    View all <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
              <div className="px-3 sm:px-4 pb-4 sm:pb-5 space-y-1">
                {recentLeads.slice(0, 5).map((lead, index) => (
                  <div key={lead.id || index} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {('name' in lead && lead.name) ? lead.name.charAt(0).toUpperCase() : 'M'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {'name' in lead ? lead.name : 'Multi-service Lead'}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                      ${(() => {
                        const price = ('totalPrice' in lead && lead.totalPrice) ? lead.totalPrice :
                                     ('calculatedPrice' in lead && lead.calculatedPrice) ? lead.calculatedPrice : null;
                        return price ? (price / 100).toLocaleString() : 'N/A';
                      })()}
                    </p>
                  </div>
                ))}
                {recentLeads.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-500">No leads this week</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">They'll appear here as they come in</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chart */}
            <div className="dash-stagger dash-stagger-7 lg:col-span-2 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
              <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Popular Calculators
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Lead volume by service, last 30 days</p>
              </div>
              <div className="px-3 sm:px-4 pb-4 sm:pb-5">
                <Suspense
                  fallback={
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-xs text-gray-400 dark:text-gray-500">Loading chart...</p>
                      </div>
                    </div>
                  }
                >
                  <TopServicesChart data={serviceChartData} />
                </Suspense>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Setup Dialog */}
      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent className="sm:max-w-2xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Done-for-you onboarding</DialogTitle>
            <DialogDescription>
              Add your service line items one at a time and we will configure everything for you.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSetupRequestSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">Service line items</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  ref={serviceInputRef}
                  value={serviceInput}
                  onChange={(event) => setServiceInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addServiceLineItem();
                    }
                  }}
                  placeholder="e.g. Lawn mowing, weekly"
                  className="rounded-lg"
                />
                <Button type="button" variant="outline" onClick={addServiceLineItem} className="rounded-lg">
                  Add service
                </Button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Press Enter after each service to add it quickly.</p>
              {services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {services.map((service, index) => (
                    <div
                      key={`${service}-${index}`}
                      className="flex items-center gap-2 rounded-lg border border-amber-200/60 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-900/20 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200"
                    >
                      <span>{service}</span>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => removeServiceLineItem(index)}
                        aria-label={`Remove ${service}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Pricing structure details (optional)
              </label>
              <Textarea
                value={pricingDetails}
                onChange={(event) => setPricingDetails(event.target.value)}
                placeholder="Tell us how you price things: base fees, add-ons, minimums, ranges, etc."
                rows={3}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Website for branding reference (optional)
              </label>
              <Input
                value={brandingWebsite}
                onChange={(event) => setBrandingWebsite(event.target.value)}
                placeholder="https://yourcompany.com"
                type="url"
                className="rounded-lg"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setIsSetupDialogOpen(false)} className="rounded-lg">
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white" disabled={isSubmittingSetup}>
                {isSubmittingSetup ? "Sending..." : "Send setup request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

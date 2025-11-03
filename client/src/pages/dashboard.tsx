import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ChartContainer } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { 
  Calculator, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  ExternalLink, 
  BarChart3, 
  Settings, 
  Palette, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Target, 
  Rocket,
  Edit,
  Copy,
  Share,
  ArrowRight,
  Timer,
  Star,
  Globe,
  FileText,
  Mail
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Formula, Lead, BusinessSettings, MultiServiceLead, User } from "@shared/schema";
import SupportContact from "@/components/support-contact";
import DashboardLayout from "@/components/dashboard-layout";

// Function to get quick actions with dynamic URLs
const getQuickActions = (userId?: string) => [
  { icon: Plus, label: "New Calculator", href: "/formula/new", color: "bg-blue-500 hover:bg-blue-600" },
  { icon: Palette, label: "View Calculator", href: userId ? `/styled-calculator?userId=${userId}` : "/styled-calculator", color: "bg-indigo-500 hover:bg-indigo-600" },
  { icon: Share, label: "Share Link", href: "/embed-code", color: "bg-orange-500 hover:bg-orange-600" },
  { icon: Users, label: "Leads", href: "/leads", color: "bg-green-500 hover:bg-green-600" },
  { icon: Calendar, label: "Calendar", href: "/calendar", color: "bg-purple-500 hover:bg-purple-600" },
  { icon: Globe, label: "Website", href: "/website", color: "bg-teal-500 hover:bg-teal-600" },
];

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");

  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  // Fetch formulas
  const { data: formulaList = [], isLoading: formulasLoading } = useQuery<Formula[]>({
    queryKey: ['/api/formulas'],
  });

  // Fetch leads
  const { data: leadList = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  // Fetch multi-service leads
  const { data: multiLeadList = [], isLoading: multiLeadsLoading } = useQuery<MultiServiceLead[]>({
    queryKey: ['/api/multi-service-leads'],
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalCalculators: number;
    leadsThisMonth: number;
    avgQuoteValue: number;
    conversionRate: number;
  }>({
    queryKey: ['/api/stats'],
  });

  // Fetch business settings
  const { data: businessSettings } = useQuery<BusinessSettings>({
    queryKey: ['/api/business-settings'],
  });

  // Fetch profile data for trial status
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate combined metrics
  const totalCalculators = formulaList.length;
  const totalLeads = leadList.length + multiLeadList.length;
  const avgQuoteValue = (stats?.avgQuoteValue || 0) / 100;
  const conversionRate = stats?.conversionRate || 0;

  // Recent activity (last 7 days)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentLeads = [...leadList, ...multiLeadList].filter(lead => 
    new Date(lead.createdAt) > weekAgo
  );

  if (formulasLoading || leadsLoading || multiLeadsLoading || statsLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate service selections over past 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Count service selections from past 30 days
  const serviceSelections = new Map<number, { name: string; count: number; revenue: number }>();
  
  // Initialize with all formulas
  formulaList.forEach(formula => {
    serviceSelections.set(formula.id, {
      name: formula.name,
      count: 0,
      revenue: 0
    });
  });

  // Count from regular leads (past 30 days)
  leadList
    .filter(lead => new Date(lead.createdAt) > thirtyDaysAgo)
    .forEach(lead => {
      if (lead.formulaId && serviceSelections.has(lead.formulaId)) {
        const service = serviceSelections.get(lead.formulaId)!;
        service.count += 1;
        service.revenue += (lead.calculatedPrice || 0) / 100;
      }
    });

  // Count from multi-service leads (past 30 days)
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

  // Convert to chart data and sort by count
  const serviceChartData = Array.from(serviceSelections.values())
    .filter(service => service.count > 0) // Only show services that have been selected
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(service => ({
      name: service.name.length > 15 ? service.name.substring(0, 15) + '...' : service.name,
      leads: service.count,
      revenue: service.revenue
    }));

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <div className="pt-0 px-6 pb-6 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
                  <p className="text-gray-600">Welcome back! Here's your business overview.</p>
                </div>
                {profileData?.trialStatus?.isOnTrial && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      {profileData.trialStatus.daysLeft} days left in trial
                    </span>
                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Link href="/upgrade">Upgrade</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {getQuickActions(user?.id || '').map((action, index) => (
                    <Button key={action.href} asChild variant="outline" className="h-16 flex-col gap-2">
                      <Link href={action.href}>
                        <action.icon className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">{action.label}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Calculators</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{totalCalculators}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Leads</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{totalLeads}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-sm font-medium text-gray-600">Avg Quote</p>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">${avgQuoteValue.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Conversion</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Leads */}
              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">Recent Leads</CardTitle>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/leads">
                        View All <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentLeads.slice(0, 5).map((lead, index) => (
                      <div key={lead.id || index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {'name' in lead ? lead.name : 'Multi-service Lead'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ${(() => {
                              // Handle both regular leads (calculatedPrice) and multi-service leads (totalPrice)
                              const price = ('totalPrice' in lead && lead.totalPrice) ? lead.totalPrice : 
                                           ('calculatedPrice' in lead && lead.calculatedPrice) ? lead.calculatedPrice : null;
                              return price ? (price / 100).toLocaleString() : 'N/A';
                            })()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {recentLeads.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent leads</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Services Chart */}
              <Card className="bg-white border border-gray-200 lg:col-span-2">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Most Popular Calculators</CardTitle>
                </CardHeader>
                <CardContent>
                  {serviceChartData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={serviceChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} />
                          <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          />
                          <Bar dataKey="leads" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No calculator data yet</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
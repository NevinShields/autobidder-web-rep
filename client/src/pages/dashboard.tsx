import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Calculator, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  ExternalLink, 
  BarChart3, 
  Eye, 
  Settings, 
  Palette, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Target, 
  Rocket,
  Edit,
  Copy,
  Share,
  ArrowRight,
  Timer,
  Star
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Formula, Lead, BusinessSettings } from "@shared/schema";
import SupportContact from "@/components/support-contact";
import DashboardLayout from "@/components/dashboard-layout";

// Function to get quick actions with dynamic URLs
const getQuickActions = (userId?: string) => [
  { icon: Plus, label: "New Calculator", href: "/formula/new", color: "bg-blue-500 hover:bg-blue-600" },
  { icon: Palette, label: "Styled Calculator", href: userId ? `/styled-calculator?userId=${userId}` : "/styled-calculator", color: "bg-indigo-500 hover:bg-indigo-600" },
  { icon: Eye, label: "Classic Form", href: userId ? `/embed-form?userId=${userId}` : "/embed-form", color: "bg-green-500 hover:bg-green-600" },
  { icon: Zap, label: "Upsell Form", href: userId ? `/upsell-form?userId=${userId}` : "/upsell-form", color: "bg-purple-500 hover:bg-purple-600" },
  { icon: Share, label: "Share Link", href: "/embed-code", color: "bg-orange-500 hover:bg-orange-600" },
];

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");

  // Fetch user data
  const { data: user } = useQuery({
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
  const { data: multiLeadList = [], isLoading: multiLeadsLoading } = useQuery({
    queryKey: ['/api/multi-service-leads'],
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
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
  const avgQuoteValue = stats?.avgQuoteValue || 0;
  const conversionRate = stats?.conversionRate || 0;

  // Recent activity (last 7 days)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentLeads = [...leadList, ...multiLeadList].filter(lead => 
    new Date(lead.createdAt) > weekAgo
  );

  // Top performing calculators
  const calculatorPerformance = formulaList.map(formula => {
    const formulaLeads = leadList.filter(lead => lead.formulaId === formula.id);
    return {
      ...formula,
      leadCount: formulaLeads.length,
      totalRevenue: formulaLeads.reduce((sum, lead) => sum + (lead.calculatedPrice || 0), 0)
    };
  }).sort((a, b) => b.leadCount - a.leadCount);

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

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your pricing calculators.</p>
          </div>

          {/* Trial Upgrade Banner */}
          {profileData?.trialStatus?.isOnTrial && (
            <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">
                        Free Trial - {profileData.trialStatus.daysLeft} days remaining
                      </h3>
                      <p className="text-blue-700 text-sm">
                        Upgrade to unlock unlimited calculators, leads, and premium features
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/upgrade">
                        <Star className="w-4 h-4 mr-2" />
                        Upgrade Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Calculators */}
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Calculators</p>
                    <p className="text-3xl font-bold">{totalCalculators}</p>
                  </div>
                  <div className="bg-blue-400 bg-opacity-50 p-3 rounded-full">
                    <Calculator className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Leads */}
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Leads</p>
                    <p className="text-3xl font-bold">{totalLeads}</p>
                  </div>
                  <div className="bg-green-400 bg-opacity-50 p-3 rounded-full">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Quote Value */}
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Avg Quote Value</p>
                    <p className="text-3xl font-bold">${avgQuoteValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-400 bg-opacity-50 p-3 rounded-full">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Conversion Rate</p>
                    <p className="text-3xl font-bold">{(conversionRate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-orange-400 bg-opacity-50 p-3 rounded-full">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {getQuickActions(user?.id).map((action, index) => (
                <Link key={action.href} href={action.href}>
                  <Button 
                    className={cn(
                      "w-full h-20 text-white flex flex-col items-center justify-center space-y-2",
                      action.color
                    )}
                  >
                    <action.icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity & Top Calculators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Recent Activity */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {recentLeads.length > 0 ? (
                  <div className="space-y-4">
                    {recentLeads.slice(0, 5).map((lead, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{lead.name}</p>
                          <p className="text-sm text-gray-600">{lead.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            ${(lead.calculatedPrice || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Performing Calculators */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Top Performing Calculators
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {calculatorPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {calculatorPerformance.slice(0, 5).map((formula, index) => (
                      <div key={formula.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <div>
                            <p className="font-medium text-gray-900">{formula.name}</p>
                            <p className="text-sm text-gray-600">{formula.leadCount} leads</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">
                            ${formula.totalRevenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No calculator data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Setup Progress */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Setup Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Business Settings Configured</span>
                  </div>
                  <Badge variant="secondary">
                    {businessSettings ? "Complete" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>First Calculator Created</span>
                  </div>
                  <Badge variant="secondary">
                    {totalCalculators > 0 ? "Complete" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Design Customized</span>
                  </div>
                  <Badge variant="secondary">
                    {businessSettings?.styling ? "Complete" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>First Lead Captured</span>
                  </div>
                  <Badge variant="secondary">
                    {totalLeads > 0 ? "Complete" : "Pending"}
                  </Badge>
                </div>
                
                {/* Progress Bar */}
                <div className="pt-2">
                  <Progress 
                    value={
                      ((businessSettings ? 1 : 0) + 
                       (totalCalculators > 0 ? 1 : 0) + 
                       (businessSettings?.styling ? 1 : 0) + 
                       (totalLeads > 0 ? 1 : 0)) * 25
                    } 
                    className="h-2" 
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    {Math.round(((businessSettings ? 1 : 0) + 
                                (totalCalculators > 0 ? 1 : 0) + 
                                (businessSettings?.styling ? 1 : 0) + 
                                (totalLeads > 0 ? 1 : 0)) * 25)}% Complete
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
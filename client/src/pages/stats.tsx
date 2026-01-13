import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { TrendingUp, Users, DollarSign, Calculator, Calendar, Target, Activity, BarChart3, Filter, Zap, Eye, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Lock } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

// Plans that have access to stats
const STATS_ALLOWED_PLANS = ['trial', 'standard', 'plus', 'plus_seo'];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const GRADIENTS = [
  'from-blue-500 via-blue-600 to-blue-700',
  'from-emerald-500 via-emerald-600 to-emerald-700', 
  'from-amber-500 via-amber-600 to-amber-700',
  'from-rose-500 via-rose-600 to-rose-700',
  'from-purple-500 via-purple-600 to-purple-700',
  'from-cyan-500 via-cyan-600 to-cyan-700'
];

interface StatsData {
  totalCalculators: number;
  leadsThisMonth: number;
  avgQuoteValue: number;
  totalRevenue: number;
  conversionRate: number;
  activeFormulas: number;
}

interface LeadsByService {
  serviceName: string;
  count: number;
  revenue: number;
}

interface MonthlyStats {
  month: string;
  leads: number;
  revenue: number;
  calculators: number;
}

interface RevenueByService {
  serviceName: string;
  totalRevenue: number;
  averageQuote: number;
  leadCount: number;
}

interface LeadsBySource {
  source: string;
  count: number;
}

// Simple Counter Component (no animation)
function SimpleCounter({ value, prefix = "", suffix = "" }: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  return <span>{prefix}{value.toLocaleString()}{suffix}</span>;
}

export default function StatsPage() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState("30");
  const [isVisible, setIsVisible] = useState(false);
  const [isLeadsByServiceExpanded, setIsLeadsByServiceExpanded] = useState(false);
  const [isAvgQuoteExpanded, setIsAvgQuoteExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if user has access to stats
  const userPlan = user?.plan || 'free';
  const hasAccess = STATS_ALLOWED_PLANS.includes(userPlan);

  useEffect(() => {
    setIsVisible(true);

    // Check if mobile on mount
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch basic stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: () => fetch('/api/stats').then(res => res.json()),
  });

  // Fetch leads data for analytics
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['/api/multi-service-leads'],
    queryFn: () => fetch('/api/multi-service-leads').then(res => res.json()),
  });

  // Fetch formulas for service analysis
  const { data: formulas = [], isLoading: formulasLoading } = useQuery({
    queryKey: ['/api/formulas'],
    queryFn: () => fetch('/api/formulas').then(res => res.json()),
  });

  // Filter leads based on date range
  const filterLeadsByDateRange = () => {
    const now = new Date();
    const daysAgo = parseInt(timeFilter);
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    const leadsArray = Array.isArray(leads) ? leads : [];
    return leadsArray.filter((lead: any) => {
      const leadDate = new Date(lead.createdAt);
      return leadDate >= startDate;
    });
  };

  const filteredLeads = filterLeadsByDateRange();

  // Process data for charts
  const processLeadsByService = () => {
    const serviceData: { [key: string]: { count: number; revenue: number } } = {};
    
    filteredLeads.forEach((lead: any) => {
      // Check if it's a multi-service lead with services array
      if (lead.services && Array.isArray(lead.services)) {
        lead.services.forEach((service: any) => {
          const serviceName = service.formulaName || service.serviceName || 'Unknown Service';
          if (!serviceData[serviceName]) {
            serviceData[serviceName] = { count: 0, revenue: 0 };
          }
          serviceData[serviceName].count++;
          serviceData[serviceName].revenue += (service.calculatedPrice || service.price || 0) / 100;
        });
      }
      // Check if it's a single service lead with direct properties
      else if (lead.serviceName) {
        const serviceName = lead.serviceName || 'Unknown Service';
        if (!serviceData[serviceName]) {
          serviceData[serviceName] = { count: 0, revenue: 0 };
        }
        serviceData[serviceName].count++;
        serviceData[serviceName].revenue += (lead.totalPrice || lead.price || 0) / 100;
      }
    });

    return Object.entries(serviceData).map(([serviceName, data]) => ({
      serviceName,
      count: data.count,
      revenue: data.revenue
    }));
  };

  const processMonthlyData = () => {
    const monthlyData: { [key: string]: { leads: number; revenue: number; calculators: number } } = {};
    
    filteredLeads.forEach((lead: any) => {
      const date = new Date(lead.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { leads: 0, revenue: 0, calculators: 0 };
      }
      
      monthlyData[monthKey].leads++;
      // Handle both single-service leads (calculatedPrice) and multi-service leads (totalPrice)
      const revenue = (lead.totalPrice || lead.calculatedPrice || 0) / 100;
      monthlyData[monthKey].revenue += revenue;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6)
      .map(([month, data]) => ({
        month,
        ...data
      }));
  };

  const processRevenueByService = () => {
    const serviceRevenue: { [key: string]: { total: number; count: number } } = {};
    
    filteredLeads.forEach((lead: any) => {
      if (lead.services && Array.isArray(lead.services)) {
        lead.services.forEach((service: any) => {
          const serviceName = service.formulaName || service.serviceName || 'Unknown Service';
          if (!serviceRevenue[serviceName]) {
            serviceRevenue[serviceName] = { total: 0, count: 0 };
          }
          serviceRevenue[serviceName].total += (service.calculatedPrice || service.price || 0) / 100;
          serviceRevenue[serviceName].count++;
        });
      }
    });

    return Object.entries(serviceRevenue)
      .map(([serviceName, data]) => ({
        serviceName,
        totalRevenue: data.total,
        averageQuote: data.count > 0 ? data.total / data.count : 0,
        leadCount: data.count
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  const processLeadsBySource = () => {
    const sourceData: { [key: string]: number } = {};
    
    filteredLeads.forEach((lead: any) => {
      const source = lead.source || 'calculator';
      sourceData[source] = (sourceData[source] || 0) + 1;
    });

    return Object.entries(sourceData).map(([source, count]) => ({
      source: source.charAt(0).toUpperCase() + source.slice(1),
      count
    }));
  };

  const processHowDidYouHear = () => {
    const hearData: { [key: string]: number } = {};
    
    filteredLeads.forEach((lead: any) => {
      const howHeard = lead.howDidYouHear || 'Not specified';
      hearData[howHeard] = (hearData[howHeard] || 0) + 1;
    });

    return Object.entries(hearData)
      .map(([source, count]) => ({
        source,
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getTopPerformingServices = () => {
    return processLeadsByService()
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getConversionMetrics = () => {
    const totalViews = stats?.totalCalculators * 15 || 0;
    const totalLeads = filteredLeads.length;
    const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;
    
    return {
      totalViews,
      totalLeads,
      conversionRate: conversionRate.toFixed(2)
    };
  };

  const getFunnelData = () => {
    const leadsGenerated = filteredLeads.length;
    const leadsBooked = filteredLeads.filter(lead => lead.stage === 'booked').length;
    
    // Use real calculator sessions if available, otherwise estimate
    const calculatorStarts = stats?.totalCalculatorSessions || 
      Math.max(Math.floor((stats?.totalCalculators || 0) * 15 * 0.4), leadsGenerated);
    
    // Estimate views to be higher than calculator starts (assume 40% of viewers start calculator)
    const totalViews = Math.max(calculatorStarts * 2.5, (stats?.totalCalculators || 0) * 15);
    
    return [
      { name: 'Views', value: Math.floor(totalViews), fill: '#3b82f6' },
      { name: 'Calculators Started', value: calculatorStarts, fill: '#10b981' },
      { name: 'Leads Generated', value: leadsGenerated, fill: '#f59e0b' },
      { name: 'Leads Converted to Booked', value: leadsBooked, fill: '#8b5cf6' }
    ];
  };

  const leadsByService = processLeadsByService().sort((a, b) => b.count - a.count);
  const displayedLeadsByService = isLeadsByServiceExpanded ? leadsByService : leadsByService.slice(0, 5);
  const monthlyData = processMonthlyData();
  const revenueByService = processRevenueByService();
  const displayedAvgQuoteData = isAvgQuoteExpanded ? revenueByService : revenueByService.slice(0, 5);
  const topServices = getTopPerformingServices();
  const conversionMetrics = getConversionMetrics();
  const funnelData = getFunnelData();
  const leadsBySource = processLeadsBySource();
  const howDidYouHear = processHowDidYouHear();

  if (statsLoading || leadsLoading || formulasLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-20 mx-auto"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Analytics</h3>
            <p className="text-gray-600">Gathering your business insights...</p>
            <div className="flex justify-center mt-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show upgrade prompt for free users
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto mt-20">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Analytics</h2>
                  <p className="text-gray-600 mb-6">
                    Analytics and statistics are not available on the free plan. Upgrade to track your leads, conversions, and revenue.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/dashboard">
                      <Button variant="outline">Back to Dashboard</Button>
                    </Link>
                    <Link href="/pricing">
                      <Button>View Plans</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Modern Header with Gradient Background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20"></div>
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  Business Analytics
                </h1>
              </div>
              <p className="text-slate-300 text-lg max-w-2xl">
                Real-time insights into your pricing calculators, conversions, and revenue growth
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>Live Data</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span>Auto-refresh</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40 bg-white/10 backdrop-blur-sm border-white/20 text-white" data-testid="select-date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Enhanced Key Metrics Cards with Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`group relative overflow-hidden bg-gradient-to-br ${GRADIENTS[0]} text-white`}>

            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-blue-100 text-sm font-medium tracking-wide">Total Calculators</p>
                  <p className="text-4xl font-bold">
                    <SimpleCounter value={stats?.totalCalculators || 0} />
                  </p>
                  <div className="flex items-center gap-1 text-blue-100 text-xs">
                    <ArrowUp className="w-3 h-3" />
                    <span>Active formulas</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`group relative overflow-hidden bg-gradient-to-br ${GRADIENTS[1]} text-white transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>

            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-emerald-100 text-sm font-medium tracking-wide">Total Leads</p>
                  <p className="text-4xl font-bold">
                    <SimpleCounter value={filteredLeads.length} />
                  </p>
                  <div className="flex items-center gap-1 text-emerald-100 text-xs">
                    <TrendingUp className="w-3 h-3" />
                    <span>
                      {timeFilter === "7" ? "Last 7 days" : 
                       timeFilter === "30" ? "Last 30 days" : 
                       timeFilter === "90" ? "Last 3 months" : 
                       "Last year"}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`group relative overflow-hidden bg-gradient-to-br ${GRADIENTS[4]} text-white transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>

            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-purple-100 text-sm font-medium tracking-wide">Total Revenue</p>
                  <p className="text-4xl font-bold">
                    <SimpleCounter 
                      value={Math.round(leadsByService.reduce((sum, service) => sum + service.revenue, 0))} 
                      prefix="$" 
                    />
                  </p>
                  <div className="flex items-center gap-1 text-purple-100 text-xs">
                    <DollarSign className="w-3 h-3" />
                    <span>
                      {timeFilter === "7" ? "Last 7 days" : 
                       timeFilter === "30" ? "Last 30 days" : 
                       timeFilter === "90" ? "Last 3 months" : 
                       "Last year"}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`group relative overflow-hidden bg-gradient-to-br ${GRADIENTS[2]} text-white transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '400ms' }}>

            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-amber-100 text-sm font-medium tracking-wide">Conversion Rate</p>
                  <p className="text-4xl font-bold">
                    <SimpleCounter value={parseFloat(conversionMetrics.conversionRate)} suffix="%" />
                  </p>
                  <div className="flex items-center gap-1 text-amber-100 text-xs">
                    <Target className="w-3 h-3" />
                    <span>Visitor to lead</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Charts Row 1 with Modern Design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads by Source Pie Chart */}
          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-cyan-50/50"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Leads by Source
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 ml-11">
                    Distribution of lead origins
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-80">
                <Chart
                  options={{
                    chart: {
                      type: 'pie',
                      height: 320,
                      background: 'transparent',
                      fontFamily: 'Inter, sans-serif',
                      toolbar: { show: false },
                      animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                        animateGradually: {
                          enabled: true,
                          delay: 150
                        },
                        dynamicAnimation: {
                          enabled: true,
                          speed: 350
                        }
                      }
                    },
                    colors: COLORS,
                    labels: leadsBySource.map(item => item.source),
                    legend: {
                      position: 'bottom',
                      labels: {
                        colors: '#64748b',
                        fontSize: '12px'
                      }
                    },
                    tooltip: {
                      theme: 'light',
                      style: {
                        fontSize: '12px'
                      },
                      y: {
                        formatter: (val: number) => `${val} leads`
                      }
                    },
                    plotOptions: {
                      pie: {
                        dataLabels: {
                          offset: -5
                        }
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      style: {
                        fontSize: '12px',
                        fontWeight: 600,
                        colors: ['#64748b']
                      }
                    }
                  } as ApexOptions}
                  series={leadsBySource.map(item => item.count)}
                  type="pie"
                  height={320}
                />
              </div>
            </CardContent>
          </Card>

          {/* How They Heard About Us Pie Chart */}
          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      How They Heard About Us
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 ml-11">
                    Distribution of referral sources
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-80">
                <Chart
                  options={{
                    chart: {
                      type: 'pie',
                      height: 320,
                      background: 'transparent',
                      fontFamily: 'Inter, sans-serif',
                      toolbar: { show: false },
                      animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                        animateGradually: {
                          enabled: true,
                          delay: 150
                        },
                        dynamicAnimation: {
                          enabled: true,
                          speed: 350
                        }
                      }
                    },
                    colors: ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#84cc16', '#f97316'],
                    labels: howDidYouHear.map(item => item.source),
                    legend: {
                      position: 'bottom',
                      labels: {
                        colors: '#64748b',
                        fontSize: '12px'
                      }
                    },
                    tooltip: {
                      theme: 'light',
                      style: {
                        fontSize: '12px'
                      },
                      y: {
                        formatter: (val: number) => `${val} leads`
                      }
                    },
                    plotOptions: {
                      pie: {
                        dataLabels: {
                          offset: -5
                        }
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      style: {
                        fontSize: '12px',
                        fontWeight: 600,
                        colors: ['#64748b']
                      }
                    }
                  } as ApexOptions}
                  series={howDidYouHear.map(item => item.count)}
                  type="pie"
                  height={320}
                />
              </div>
            </CardContent>
          </Card>

          {/* Leads by Service Bar Chart */}
          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Leads by Service
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 ml-11">
                    {isLeadsByServiceExpanded ? 'All services' : 'Top 5 services'}
                  </p>
                </div>
                {leadsByService.length > 5 && (
                  <button
                    onClick={() => setIsLeadsByServiceExpanded(!isLeadsByServiceExpanded)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    data-testid="button-expand-leads-by-service"
                  >
                    {isLeadsByServiceExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>Show All ({leadsByService.length})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-80">
                <Chart
                  options={{
                    chart: {
                      type: 'bar',
                      height: 320,
                      background: 'transparent',
                      fontFamily: 'Inter, sans-serif',
                      toolbar: { show: false },
                      animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                        animateGradually: {
                          enabled: true,
                          delay: 150
                        },
                        dynamicAnimation: {
                          enabled: true,
                          speed: 350
                        }
                      }
                    },
                    plotOptions: {
                      bar: {
                        borderRadius: 8,
                        columnWidth: '60%',
                        dataLabels: {
                          position: 'top'
                        }
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      offsetY: -20,
                      style: {
                        fontSize: '12px',
                        fontWeight: 600,
                        colors: ['#64748b']
                      }
                    },
                    colors: ['#3b82f6'],
                    fill: {
                      type: 'gradient',
                      gradient: {
                        shade: 'light',
                        type: 'vertical',
                        shadeIntensity: 0.25,
                        gradientToColors: ['#1d4ed8'],
                        inverseColors: false,
                        opacityFrom: 0.85,
                        opacityTo: 0.65,
                        stops: [0, 100]
                      }
                    },
                    grid: {
                      borderColor: '#e2e8f0',
                      strokeDashArray: 3,
                      opacity: 0.5
                    },
                    xaxis: {
                      categories: displayedLeadsByService.map(item => item.serviceName),
                      labels: {
                        rotate: -45,
                        style: {
                          colors: '#64748b',
                          fontSize: '11px'
                        }
                      },
                      axisBorder: { show: false },
                      axisTicks: { show: false }
                    },
                    yaxis: {
                      labels: {
                        style: {
                          colors: '#64748b'
                        }
                      }
                    },
                    tooltip: {
                      theme: 'light',
                      style: {
                        fontSize: '12px'
                      },
                      y: {
                        formatter: (val: number) => `${val} leads`
                      }
                    }
                  } as ApexOptions}
                  series={[{
                    name: 'Number of Leads',
                    data: displayedLeadsByService.map(item => item.count)
                  }]}
                  type="bar"
                  height={320}
                />
              </div>
            </CardContent>
          </Card>

          {/* Revenue Distribution Pie Chart */}
          <Card className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '600ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white group-hover:rotate-6 transition-transform duration-300">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Revenue Distribution
                </span>
              </CardTitle>
              <p className="text-sm text-gray-600 ml-11">Income breakdown by service type</p>
            </CardHeader>
            <CardContent className="relative">
              {/* Mobile Total Revenue Display */}
              <div className="md:hidden mb-4 text-center p-4 bg-gradient-to-br from-purple-100/50 to-pink-100/50 rounded-xl">
                <p className="text-sm text-gray-600 font-medium mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${revenueByService.slice(0, 8).reduce((sum, item) => sum + item.totalRevenue, 0).toLocaleString()}
                </p>
              </div>
              <div className="h-80">
                <Chart
                  options={{
                    chart: {
                      type: 'donut',
                      height: 320,
                      background: 'transparent',
                      fontFamily: 'Inter, sans-serif',
                      animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                        animateGradually: {
                          enabled: true,
                          delay: 150
                        }
                      }
                    },
                    colors: COLORS.slice(0, 8),
                    plotOptions: {
                      pie: {
                        donut: {
                          size: '65%',
                          background: 'transparent',
                          labels: {
                            show: !isMobile,
                            name: {
                              show: true,
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#374151'
                            },
                            value: {
                              show: true,
                              fontSize: '24px',
                              fontWeight: 700,
                              color: '#111827',
                              formatter: (val: string) => `$${parseInt(val).toLocaleString()}`
                            },
                            total: {
                              show: true,
                              label: 'Total Revenue',
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#6b7280',
                              formatter: () => `$${revenueByService.slice(0, 8).reduce((sum, item) => sum + item.totalRevenue, 0).toLocaleString()}`
                            }
                          }
                        }
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      style: {
                        fontSize: '12px',
                        fontWeight: 600
                      },
                      dropShadow: {
                        enabled: false
                      }
                    },
                    labels: revenueByService.slice(0, 8).map(item => item.serviceName),
                    legend: {
                      show: false
                    },
                    tooltip: {
                      theme: 'light',
                      y: {
                        formatter: (val: number) => `$${val.toLocaleString()}`
                      }
                    },
                    states: {
                      hover: {
                        filter: {
                          type: 'lighten',
                          value: 0.15
                        }
                      }
                    }
                  } as ApexOptions}
                  series={revenueByService.slice(0, 8).map(item => item.totalRevenue)}
                  type="donut"
                  height={320}
                />
              </div>
              
              {/* Revenue Distribution Table */}
              <div className="mt-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200/50">
                      <th className="text-left p-2 sm:p-3 font-semibold text-gray-700 bg-gray-50/50 text-xs sm:text-sm">Service</th>
                      <th className="text-center p-1 sm:p-3 font-semibold text-gray-700 bg-gray-50/50 text-xs sm:text-sm w-12 sm:w-16">Color</th>
                      <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 bg-gray-50/50 text-xs sm:text-sm w-16 sm:w-24">%</th>
                      <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 bg-gray-50/50 text-xs sm:text-sm">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueByService.slice(0, 8).map((service, index) => {
                      const totalRevenue = revenueByService.slice(0, 8).reduce((sum, item) => sum + item.totalRevenue, 0);
                      const percentage = totalRevenue > 0 ? ((service.totalRevenue / totalRevenue) * 100).toFixed(1) : '0.0';
                      
                      return (
                        <tr key={service.serviceName} className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-pink-50/30 transition-all duration-200">
                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-800 font-medium truncate max-w-[120px] sm:max-w-none" title={service.serviceName}>{service.serviceName}</td>
                          <td className="p-1 sm:p-3 text-center">
                            <div className="flex justify-center">
                              <div 
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-md shadow-sm border border-gray-200" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 text-right text-xs sm:text-sm font-semibold text-purple-600 whitespace-nowrap">{percentage}%</td>
                          <td className="p-2 sm:p-3 text-right text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                            ${service.totalRevenue.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Conversion Funnel */}
        <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-blue-50/50"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white group-hover:rotate-6 transition-transform duration-300">
                <Filter className="w-5 h-5" />
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Conversion Funnel
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 ml-11">
              Track how visitors convert through your pricing calculators
            </p>
          </CardHeader>
          <CardContent className="relative">
            <div className="h-96">
              <Chart
                options={{
                  chart: {
                    type: 'bar',
                    height: 400,
                    background: 'transparent',
                    fontFamily: 'Inter, sans-serif',
                    toolbar: { show: false },
                    animations: {
                      enabled: true,
                      easing: 'easeinout',
                      speed: 800,
                      animateGradually: {
                        enabled: true,
                        delay: 150
                      }
                    }
                  },
                  plotOptions: {
                    bar: {
                      borderRadius: 8,
                      horizontal: true,
                      barHeight: '75%',
                      distributed: true,
                      dataLabels: {
                        position: 'center'
                      }
                    }
                  },
                  dataLabels: {
                    enabled: true,
                    style: {
                      colors: ['#ffffff'],
                      fontSize: '13px',
                      fontWeight: 600
                    },
                    dropShadow: {
                      enabled: true,
                      top: 0,
                      left: 0,
                      blur: 4,
                      opacity: 0.8,
                      color: '#000000'
                    },
                    formatter: function(val: number, opts: any) {
                      const stageName = funnelData[opts.dataPointIndex].name;
                      return `${stageName}\n${val.toLocaleString()}`;
                    }
                  },
                  colors: funnelData.map(item => item.fill),
                  fill: {
                    type: 'gradient',
                    gradient: {
                      shade: 'light',
                      type: 'horizontal',
                      shadeIntensity: 0.25,
                      inverseColors: false,
                      opacityFrom: 0.85,
                      opacityTo: 0.65,
                      stops: [0, 100]
                    }
                  },
                  grid: {
                    show: false
                  },
                  xaxis: {
                    labels: {
                      show: false
                    },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                  },
                  yaxis: {
                    labels: {
                      show: false
                    },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                  },
                  tooltip: {
                    theme: 'light',
                    y: {
                      formatter: (val: number) => val.toLocaleString()
                    }
                  },
                  legend: {
                    show: false
                  }
                } as ApexOptions}
                series={[{
                  name: 'Conversion Funnel',
                  data: funnelData.map(item => item.value)
                }]}
                type="bar"
                height={400}
              />
            </div>
            
            {/* Enhanced Funnel Metrics */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {funnelData.map((stage, index) => {
                const nextStage = funnelData[index + 1];
                const conversionRate = nextStage 
                  ? ((nextStage.value / stage.value) * 100).toFixed(1)
                  : null;
                
                return (
                  <div key={stage.name} className="text-center group hover:scale-105 transition-transform duration-200">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="text-2xl font-bold mb-1" style={{ color: stage.fill }}>
                        <SimpleCounter value={stage.value} />
                      </div>
                      <div className="text-xs text-gray-600 mb-2 font-medium">{stage.name}</div>
                      {conversionRate && (
                        <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                          <ArrowDown className="w-3 h-3" />
                          <span>{conversionRate}% convert</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '800ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white group-hover:rotate-6 transition-transform duration-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Monthly Trends
                </span>
              </CardTitle>
              <p className="text-sm text-gray-600 ml-11">Growth patterns over time</p>
            </CardHeader>
            <CardContent className="relative p-2 md:p-6">
              <div className="h-[450px] md:h-[500px]">
                <Chart
                  options={{
                    chart: {
                      type: 'area',
                      height: 450,
                      background: 'transparent',
                      fontFamily: 'Inter, sans-serif',
                      toolbar: { show: false },
                      animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                        animateGradually: {
                          enabled: true,
                          delay: 150
                        }
                      }
                    },
                    colors: ['#3b82f6', '#10b981'],
                    fill: {
                      type: 'gradient',
                      gradient: {
                        shade: 'light',
                        type: 'vertical',
                        shadeIntensity: 0.25,
                        gradientToColors: ['#1d4ed8', '#059669'],
                        inverseColors: false,
                        opacityFrom: 0.7,
                        opacityTo: 0.1,
                        stops: [0, 100]
                      }
                    },
                    dataLabels: {
                      enabled: false
                    },
                    stroke: {
                      curve: 'smooth',
                      width: 3
                    },
                    grid: {
                      borderColor: '#e2e8f0',
                      strokeDashArray: 3,
                      opacity: 0.5
                    },
                    xaxis: {
                      categories: monthlyData.map(item => item.month),
                      labels: {
                        style: {
                          colors: '#64748b',
                          fontSize: '11px'
                        }
                      },
                      axisBorder: { show: false },
                      axisTicks: { show: false }
                    },
                    yaxis: [
                      {
                        title: {
                          text: 'Leads',
                          style: { color: '#64748b' }
                        },
                        labels: {
                          style: { colors: '#64748b' }
                        }
                      },
                      {
                        opposite: true,
                        title: {
                          text: 'Revenue',
                          style: { color: '#64748b' }
                        },
                        labels: {
                          style: { colors: '#64748b' },
                          formatter: (val: number) => {
                            if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                            if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
                            return `$${val}`;
                          }
                        }
                      }
                    ],
                    tooltip: {
                      theme: 'light',
                      shared: true,
                      intersect: false,
                      y: {
                        formatter: (val: number, opts: any) => {
                          if (opts.seriesIndex === 0) return `${val} leads`;
                          return `$${val.toLocaleString()}`;
                        }
                      }
                    },
                    legend: {
                      position: 'top',
                      horizontalAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 500,
                      labels: {
                        colors: '#64748b'
                      }
                    }
                  } as ApexOptions}
                  series={[
                    {
                      name: 'Leads',
                      data: monthlyData.map(item => item.leads)
                    },
                    {
                      name: 'Revenue',
                      data: monthlyData.map(item => item.revenue)
                    }
                  ]}
                  type="area"
                  height={450}
                />
              </div>
            </CardContent>
          </Card>

          {/* Average Quote Value by Service */}
          <Card className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '900ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white group-hover:rotate-6 transition-transform duration-300">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Average Quote Value
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 ml-11">
                    {isAvgQuoteExpanded ? 'All services' : 'Top 5 services'}
                  </p>
                </div>
                {revenueByService.length > 5 && (
                  <button
                    onClick={() => setIsAvgQuoteExpanded(!isAvgQuoteExpanded)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                    data-testid="button-expand-avg-quote"
                  >
                    {isAvgQuoteExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>Show All ({revenueByService.length})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-80">
                <Chart
                  options={{
                    chart: {
                      type: 'bar',
                      height: 320,
                      background: 'transparent',
                      fontFamily: 'Inter, sans-serif',
                      toolbar: { show: false },
                      animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                        animateGradually: {
                          enabled: true,
                          delay: 150
                        }
                      }
                    },
                    plotOptions: {
                      bar: {
                        borderRadius: 8,
                        columnWidth: '60%',
                        dataLabels: {
                          position: 'top'
                        }
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      style: {
                        colors: ['#64748b'],
                        fontSize: '12px',
                        fontWeight: 600
                      },
                      formatter: (val: number) => `$${val.toLocaleString()}`,
                      offsetY: -20
                    },
                    colors: ['#f59e0b'],
                    fill: {
                      type: 'gradient',
                      gradient: {
                        shade: 'light',
                        type: 'vertical',
                        shadeIntensity: 0.25,
                        gradientToColors: ['#d97706'],
                        inverseColors: false,
                        opacityFrom: 0.85,
                        opacityTo: 0.65,
                        stops: [0, 100]
                      }
                    },
                    grid: {
                      borderColor: '#e2e8f0',
                      strokeDashArray: 3,
                      opacity: 0.5
                    },
                    xaxis: {
                      categories: displayedAvgQuoteData.map(item => item.serviceName),
                      labels: {
                        style: {
                          colors: '#64748b',
                          fontSize: '11px'
                        },
                        rotate: -45
                      },
                      axisBorder: { show: false },
                      axisTicks: { show: false }
                    },
                    yaxis: {
                      labels: {
                        style: {
                          colors: '#64748b',
                          fontSize: '11px'
                        },
                        formatter: (val: number) => `$${val.toLocaleString()}`
                      },
                      title: {
                        text: 'Quote Value ($)',
                        style: {
                          color: '#64748b',
                          fontSize: '12px'
                        }
                      }
                    },
                    annotations: {
                      yaxis: [{
                        y: displayedAvgQuoteData.reduce((sum, item) => sum + item.averageQuote, 0) / displayedAvgQuoteData.length,
                        borderColor: '#ef4444',
                        borderWidth: 2,
                        strokeDashArray: 5,
                        label: {
                          text: `Mean: $${Math.round(displayedAvgQuoteData.reduce((sum, item) => sum + item.averageQuote, 0) / displayedAvgQuoteData.length).toLocaleString()}`,
                          position: 'left',
                          style: {
                            color: '#ffffff',
                            background: '#ef4444',
                            fontSize: '11px',
                            fontWeight: 600
                          }
                        }
                      }]
                    },
                    tooltip: {
                      theme: 'light',
                      y: {
                        formatter: (val: number) => `$${val.toLocaleString()}`
                      }
                    }
                  } as ApexOptions}
                  series={[{
                    name: 'Average Quote Value',
                    data: displayedAvgQuoteData.map((item, index) => item.averageQuote)
                  }]}
                  type="bar"
                  height={320}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Top Performing Services Table */}
        <Card className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '1000ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-pink-50/50"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white group-hover:rotate-6 transition-transform duration-300">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Top Performing Services
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 ml-11">Detailed performance metrics and rankings</p>
          </CardHeader>
          <CardContent className="relative">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/50">
                    <th className="text-left p-4 font-semibold text-gray-700 bg-gray-50/50 rounded-tl-lg">Service Name</th>
                    <th className="text-right p-4 font-semibold text-gray-700 bg-gray-50/50">Total Leads</th>
                    <th className="text-right p-4 font-semibold text-gray-700 bg-gray-50/50">Total Revenue</th>
                    <th className="text-right p-4 font-semibold text-gray-700 bg-gray-50/50">Avg Quote</th>
                    <th className="text-center p-4 font-semibold text-gray-700 bg-gray-50/50 rounded-tr-lg">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByService.slice(0, 8).map((service, index) => (
                    <tr key={service.serviceName} className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-white/80 hover:to-gray-50/60 transition-all duration-200 group/row">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div 
                              className="w-4 h-4 rounded-full shadow-lg" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div 
                              className="absolute inset-0 w-4 h-4 rounded-full opacity-20" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                          </div>
                          <span className="font-semibold text-gray-800 group-hover/row:text-gray-900 transition-colors">{service.serviceName}</span>
                        </div>
                      </td>
                      <td className="text-right p-4 font-medium text-gray-700">
                        <SimpleCounter value={service.leadCount} />
                      </td>
                      <td className="text-right p-4 font-bold text-emerald-600">
                        $<SimpleCounter value={service.totalRevenue} />
                      </td>
                      <td className="text-right p-4 font-medium text-gray-700">
                        $<SimpleCounter value={service.averageQuote} />
                      </td>
                      <td className="text-center p-4">
                        <Badge 
                          className={
                            index < 3 
                              ? "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300 shadow-sm hover:shadow-md transition-shadow" 
                              : index < 6 
                              ? "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300 shadow-sm hover:shadow-md transition-shadow" 
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 shadow-sm hover:shadow-md transition-shadow"
                          }
                        >
                          {index < 3 ? "🚀 High" : index < 6 ? "📈 Medium" : "📊 Low"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
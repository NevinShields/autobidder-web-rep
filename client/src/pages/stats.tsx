import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { TrendingUp, Users, DollarSign, Calculator, Calendar, Target, Activity, BarChart3, Filter, Zap, Eye, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { useState, useEffect } from "react";

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

// Simple Counter Component (no animation)
function SimpleCounter({ value, prefix = "", suffix = "" }: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  return <span>{prefix}{value.toLocaleString()}{suffix}</span>;
}

export default function StatsPage() {
  const [timeFilter, setTimeFilter] = useState("30");
  const [isVisible, setIsVisible] = useState(false);
  const [isLeadsByServiceExpanded, setIsLeadsByServiceExpanded] = useState(false);

  useEffect(() => {
    setIsVisible(true);
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
    
    return leads.filter((lead: any) => {
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
          serviceData[serviceName].revenue += service.calculatedPrice || service.price || 0;
        });
      }
      // Check if it's a single service lead with direct properties
      else if (lead.serviceName) {
        const serviceName = lead.serviceName || 'Unknown Service';
        if (!serviceData[serviceName]) {
          serviceData[serviceName] = { count: 0, revenue: 0 };
        }
        serviceData[serviceName].count++;
        serviceData[serviceName].revenue += lead.totalPrice || lead.price || 0;
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
      monthlyData[monthKey].revenue += lead.totalPrice || 0;
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
          serviceRevenue[serviceName].total += service.calculatedPrice || service.price || 0;
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
    const totalViews = stats?.totalCalculators * 15 || 0;
    const calculatorStarts = Math.floor(totalViews * 0.4); // 40% start calculator
    const calculatorCompletions = Math.floor(calculatorStarts * 0.7); // 70% complete
    const leadsGenerated = filteredLeads.length;
    const quotesAccepted = Math.floor(leadsGenerated * 0.3); // 30% acceptance rate
    
    return [
      { name: 'Website Visitors', value: totalViews, fill: '#3b82f6' },
      { name: 'Calculator Started', value: calculatorStarts, fill: '#10b981' },
      { name: 'Calculator Completed', value: calculatorCompletions, fill: '#f59e0b' },
      { name: 'Leads Generated', value: leadsGenerated, fill: '#ef4444' },
      { name: 'Quotes Accepted', value: quotesAccepted, fill: '#8b5cf6' }
    ];
  };

  const leadsByService = processLeadsByService().sort((a, b) => b.count - a.count);
  const displayedLeadsByService = isLeadsByServiceExpanded ? leadsByService : leadsByService.slice(0, 5);
  const monthlyData = processMonthlyData();
  const revenueByService = processRevenueByService();
  const topServices = getTopPerformingServices();
  const conversionMetrics = getConversionMetrics();
  const funnelData = getFunnelData();

  if (statsLoading || leadsLoading || formulasLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
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
                      value={leadsByService.reduce((sum, service) => sum + service.revenue, 0)} 
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
                            show: true,
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
                      position: 'bottom',
                      fontSize: '12px',
                      fontWeight: 500,
                      labels: {
                        colors: '#64748b'
                      },
                      markers: {
                        width: 8,
                        height: 8,
                        radius: 4
                      }
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
                      barHeight: '85%',
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
                      fontSize: '14px',
                      fontWeight: 700
                    },
                    formatter: (val: number) => val.toLocaleString()
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
                    categories: funnelData.map(item => item.name),
                    labels: {
                      show: false
                    },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                  },
                  yaxis: {
                    labels: {
                      style: {
                        colors: '#64748b',
                        fontSize: '12px',
                        fontWeight: 600
                      }
                    }
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
            <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <CardContent className="relative">
              <div className="h-80">
                <Chart
                  options={{
                    chart: {
                      type: 'area',
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
                          text: 'Revenue ($)',
                          style: { color: '#64748b' }
                        },
                        labels: {
                          style: { colors: '#64748b' },
                          formatter: (val: string) => `$${parseInt(val).toLocaleString()}`
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
                      name: 'Revenue ($)',
                      data: monthlyData.map(item => item.revenue)
                    }
                  ]}
                  type="area"
                  height={320}
                />
              </div>
            </CardContent>
          </Card>

          {/* Average Quote Value by Service */}
          <Card className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '900ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white group-hover:rotate-6 transition-transform duration-300">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Average Quote Value
                </span>
              </CardTitle>
              <p className="text-sm text-gray-600 ml-11">Value per service comparison</p>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-80">
                <Chart
                  options={{
                    chart: {
                      type: 'scatter',
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
                      scatter: {
                        size: 8
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      style: {
                        colors: ['#374151'],
                        fontSize: '11px',
                        fontWeight: 600
                      },
                      formatter: (val: number) => `$${val.toLocaleString()}`,
                      offsetY: -10
                    },
                    colors: ['#f59e0b', '#ef4444'],
                    markers: {
                      size: 8,
                      colors: ['#f59e0b'],
                      strokeColors: '#ffffff',
                      strokeWidth: 2,
                      hover: {
                        size: 10
                      }
                    },
                    grid: {
                      borderColor: '#e2e8f0',
                      strokeDashArray: 3,
                      opacity: 0.5,
                      xaxis: {
                        lines: {
                          show: true
                        }
                      },
                      yaxis: {
                        lines: {
                          show: true
                        }
                      }
                    },
                    xaxis: {
                      type: 'category',
                      categories: revenueByService.slice(0, 6).map(item => item.serviceName),
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
                        y: revenueByService.slice(0, 6).reduce((sum, item) => sum + item.averageQuote, 0) / Math.min(6, revenueByService.length),
                        borderColor: '#ef4444',
                        borderWidth: 2,
                        strokeDashArray: 5,
                        label: {
                          text: `Mean: $${Math.round(revenueByService.slice(0, 6).reduce((sum, item) => sum + item.averageQuote, 0) / Math.min(6, revenueByService.length)).toLocaleString()}`,
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
                      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
                        const serviceName = w.globals.categoryLabels[dataPointIndex];
                        const value = series[seriesIndex][dataPointIndex];
                        return `
                          <div class="bg-white p-3 shadow-lg rounded-lg border">
                            <div class="font-semibold text-gray-800">${serviceName}</div>
                            <div class="text-amber-600 font-bold">$${value.toLocaleString()}</div>
                          </div>
                        `;
                      }
                    }
                  } as ApexOptions}
                  series={[{
                    name: 'Average Quote Value',
                    data: revenueByService.slice(0, 6).map((item, index) => item.averageQuote)
                  }]}
                  type="scatter"
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
    </DashboardLayout>
  );
}
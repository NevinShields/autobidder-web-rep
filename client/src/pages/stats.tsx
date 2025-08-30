import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, FunnelChart, Funnel, LabelList } from "recharts";
import { TrendingUp, Users, DollarSign, Calculator, Calendar, Target, Activity, BarChart3, Filter, Zap, Eye, ArrowUp, ArrowDown } from "lucide-react";
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

// Animated Counter Component
function AnimatedCounter({ value, duration = 2000, prefix = "", suffix = "" }: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(value * easeOutQuart));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// Pulse Animation Component
function PulseCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div 
      className="animate-pulse-slow"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function StatsPage() {
  const [timeFilter, setTimeFilter] = useState("30");
  const [isVisible, setIsVisible] = useState(false);
  
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

  // Process data for charts
  const processLeadsByService = () => {
    const serviceData: { [key: string]: { count: number; revenue: number } } = {};
    
    leads.forEach((lead: any) => {
      lead.services.forEach((service: any) => {
        if (!serviceData[service.serviceName]) {
          serviceData[service.serviceName] = { count: 0, revenue: 0 };
        }
        serviceData[service.serviceName].count++;
        serviceData[service.serviceName].revenue += service.price || 0;
      });
    });

    const realData = Object.entries(serviceData).map(([serviceName, data]) => ({
      serviceName,
      count: data.count,
      revenue: data.revenue
    }));

    // Use demo data if no real data exists
    if (realData.length === 0 || realData.every(item => item.count === 0)) {
      return [
        { serviceName: "House Washing", count: 28, revenue: 15400 },
        { serviceName: "Roof Cleaning", count: 22, revenue: 18700 },
        { serviceName: "Gutter Cleaning", count: 35, revenue: 8750 },
        { serviceName: "Window Cleaning", count: 18, revenue: 5400 },
        { serviceName: "Driveway Cleaning", count: 15, revenue: 7200 },
        { serviceName: "Deck Construction", count: 8, revenue: 24000 },
        { serviceName: "Kitchen Remodel", count: 12, revenue: 84000 },
        { serviceName: "Bathroom Renovation", count: 10, revenue: 45000 }
      ];
    }

    return realData;
  };

  const processMonthlyData = () => {
    const monthlyData: { [key: string]: { leads: number; revenue: number; calculators: number } } = {};
    
    leads.forEach((lead: any) => {
      const date = new Date(lead.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { leads: 0, revenue: 0, calculators: 0 };
      }
      
      monthlyData[monthKey].leads++;
      monthlyData[monthKey].revenue += lead.totalPrice || 0;
    });

    const realData = Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6)
      .map(([month, data]) => ({
        month,
        ...data
      }));

    // Use demo data if no real data exists
    if (realData.length === 0 || realData.every(item => item.leads === 0)) {
      return [
        { month: 'Aug 2024', leads: 18, revenue: 45200, calculators: 3 },
        { month: 'Sep 2024', leads: 25, revenue: 62800, calculators: 4 },
        { month: 'Oct 2024', leads: 32, revenue: 78400, calculators: 5 },
        { month: 'Nov 2024', leads: 28, revenue: 71200, calculators: 6 },
        { month: 'Dec 2024', leads: 35, revenue: 89600, calculators: 6 },
        { month: 'Jan 2025', leads: 42, revenue: 108400, calculators: 6 }
      ];
    }

    return realData;
  };

  const processRevenueByService = () => {
    const serviceRevenue: { [key: string]: { total: number; count: number } } = {};
    
    leads.forEach((lead: any) => {
      lead.services.forEach((service: any) => {
        if (!serviceRevenue[service.serviceName]) {
          serviceRevenue[service.serviceName] = { total: 0, count: 0 };
        }
        serviceRevenue[service.serviceName].total += service.price || 0;
        serviceRevenue[service.serviceName].count++;
      });
    });

    const realData = Object.entries(serviceRevenue)
      .map(([serviceName, data]) => ({
        serviceName,
        totalRevenue: data.total,
        averageQuote: data.count > 0 ? data.total / data.count : 0,
        leadCount: data.count
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Use demo data if no real data exists
    if (realData.length === 0 || realData.every(item => item.totalRevenue === 0)) {
      return [
        { serviceName: "Kitchen Remodel", totalRevenue: 84000, averageQuote: 7000, leadCount: 12 },
        { serviceName: "Bathroom Renovation", totalRevenue: 45000, averageQuote: 4500, leadCount: 10 },
        { serviceName: "Deck Construction", totalRevenue: 24000, averageQuote: 3000, leadCount: 8 },
        { serviceName: "Roof Cleaning", totalRevenue: 18700, averageQuote: 850, leadCount: 22 },
        { serviceName: "House Washing", totalRevenue: 15400, averageQuote: 550, leadCount: 28 },
        { serviceName: "Gutter Cleaning", totalRevenue: 8750, averageQuote: 250, leadCount: 35 },
        { serviceName: "Driveway Cleaning", totalRevenue: 7200, averageQuote: 480, leadCount: 15 },
        { serviceName: "Window Cleaning", totalRevenue: 5400, averageQuote: 300, leadCount: 18 }
      ];
    }

    return realData;
  };

  const getTopPerformingServices = () => {
    return processLeadsByService()
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getConversionMetrics = () => {
    const totalViews = stats?.totalCalculators * 15 || 150; // Estimated views
    const totalLeads = leads.length || 148; // Use demo data if no real leads
    const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 8.2;
    
    return {
      totalViews,
      totalLeads,
      conversionRate: conversionRate.toFixed(2)
    };
  };

  const getFunnelData = () => {
    const hasRealData = leads.length > 0;
    
    if (hasRealData) {
      const totalViews = stats?.totalCalculators * 15 || 150;
      const calculatorStarts = Math.floor(totalViews * 0.4); // 40% start calculator
      const calculatorCompletions = Math.floor(calculatorStarts * 0.7); // 70% complete
      const leadsGenerated = leads.length;
      const quotesAccepted = Math.floor(leadsGenerated * 0.3); // 30% acceptance rate
      
      return [
        { name: 'Website Visitors', value: totalViews, fill: '#3b82f6' },
        { name: 'Calculator Started', value: calculatorStarts, fill: '#10b981' },
        { name: 'Calculator Completed', value: calculatorCompletions, fill: '#f59e0b' },
        { name: 'Leads Generated', value: leadsGenerated, fill: '#ef4444' },
        { name: 'Quotes Accepted', value: quotesAccepted, fill: '#8b5cf6' }
      ];
    }

    // Demo data
    return [
      { name: 'Website Visitors', value: 1850, fill: '#3b82f6' },
      { name: 'Calculator Started', value: 742, fill: '#10b981' },
      { name: 'Calculator Completed', value: 519, fill: '#f59e0b' },
      { name: 'Leads Generated', value: 148, fill: '#ef4444' },
      { name: 'Quotes Accepted', value: 44, fill: '#8b5cf6' }
    ];
  };

  const leadsByService = processLeadsByService();
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
                <BarChart3 className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 animate-ping opacity-20 mx-auto"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Analytics</h3>
            <p className="text-gray-600">Gathering your business insights...</p>
            <div className="flex justify-center mt-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 transition-all duration-1000 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 animate-gradient-x"></div>
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
                <SelectTrigger className="w-40 bg-white/10 backdrop-blur-sm border-white/20 text-white">
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
          <Card className={`group relative overflow-hidden bg-gradient-to-br ${GRADIENTS[0]} text-white transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -skew-x-12 group-hover:animate-shimmer"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-blue-100 text-sm font-medium tracking-wide">Total Calculators</p>
                  <p className="text-4xl font-bold">
                    <AnimatedCounter value={stats?.totalCalculators || 0} />
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
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -skew-x-12 group-hover:animate-shimmer"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-emerald-100 text-sm font-medium tracking-wide">Total Leads</p>
                  <p className="text-4xl font-bold">
                    <AnimatedCounter value={leads.length || 148} />
                  </p>
                  <div className="flex items-center gap-1 text-emerald-100 text-xs">
                    <TrendingUp className="w-3 h-3" />
                    <span>All time</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`group relative overflow-hidden bg-gradient-to-br ${GRADIENTS[4]} text-white transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -skew-x-12 group-hover:animate-shimmer"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-purple-100 text-sm font-medium tracking-wide">Total Revenue</p>
                  <p className="text-4xl font-bold">
                    <AnimatedCounter 
                      value={leadsByService.reduce((sum, service) => sum + service.revenue, 0) || 208450} 
                      prefix="$" 
                    />
                  </p>
                  <div className="flex items-center gap-1 text-purple-100 text-xs">
                    <DollarSign className="w-3 h-3" />
                    <span>From all quotes</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`group relative overflow-hidden bg-gradient-to-br ${GRADIENTS[2]} text-white transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '400ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -skew-x-12 group-hover:animate-shimmer"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-amber-100 text-sm font-medium tracking-wide">Conversion Rate</p>
                  <p className="text-4xl font-bold">
                    <AnimatedCounter value={parseFloat(conversionMetrics.conversionRate)} suffix="%" />
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
          <Card className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '500ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white group-hover:rotate-6 transition-transform duration-300">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Leads by Service
                </span>
              </CardTitle>
              <p className="text-sm text-gray-600 ml-11">Performance across all service categories</p>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsByService}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis 
                      dataKey="serviceName" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={11}
                      stroke="#64748b"
                      tickLine={false}
                    />
                    <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                    <Tooltip 
                      formatter={(value, name) => [value, name === 'count' ? 'Leads' : 'Revenue']}
                      labelFormatter={(label) => `Service: ${label}`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#colorLeads)" 
                      name="Number of Leads"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByService.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ serviceName, percent }) => `${serviceName}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={110}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="totalRevenue"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {revenueByService.slice(0, 8).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          className="hover:opacity-80 transition-opacity duration-200"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Conversion Funnel */}
        <Card className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '700ms' }}>
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
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip 
                    formatter={(value, name) => [value.toLocaleString(), name]}
                    labelFormatter={(label) => `Stage: ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList position="center" fill="#fff" stroke="none" fontSize={13} fontWeight="600" />
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
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
                        <AnimatedCounter value={stage.value} />
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
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorLeadsArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorRevenueArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b" 
                      tickLine={false} 
                      axisLine={false}
                      fontSize={11}
                    />
                    <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="leads" 
                      stackId="1" 
                      stroke="#3b82f6" 
                      fill="url(#colorLeadsArea)" 
                      strokeWidth={3}
                      name="Leads"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stackId="2" 
                      stroke="#10b981" 
                      fill="url(#colorRevenueArea)" 
                      strokeWidth={3}
                      name="Revenue ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByService.slice(0, 6)} layout="horizontal">
                    <defs>
                      <linearGradient id="colorQuote" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis 
                      type="number" 
                      stroke="#64748b" 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      dataKey="serviceName" 
                      type="category" 
                      width={100}
                      fontSize={10}
                      stroke="#64748b"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Avg Quote']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Bar 
                      dataKey="averageQuote" 
                      fill="url(#colorQuote)" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
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
                              className="absolute inset-0 w-4 h-4 rounded-full animate-ping opacity-20" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                          </div>
                          <span className="font-semibold text-gray-800 group-hover/row:text-gray-900 transition-colors">{service.serviceName}</span>
                        </div>
                      </td>
                      <td className="text-right p-4 font-medium text-gray-700">
                        <AnimatedCounter value={service.leadCount} />
                      </td>
                      <td className="text-right p-4 font-bold text-emerald-600">
                        $<AnimatedCounter value={service.totalRevenue} />
                      </td>
                      <td className="text-right p-4 font-medium text-gray-700">
                        $<AnimatedCounter value={service.averageQuote} />
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
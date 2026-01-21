import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
  TrendingUp, Users, DollarSign, Calculator, Calendar, Target, Activity,
  BarChart3, Filter, Zap, Eye, ArrowUp, ArrowDown, ChevronDown, ChevronUp,
  Lock, MapPin, Percent, ShoppingCart, Clock, Smartphone, Monitor, Tablet,
  CheckCircle, XCircle, Gift
} from "lucide-react";
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

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Simple Counter Component
function SimpleCounter({ value, prefix = "", suffix = "" }: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  return <span>{prefix}{value.toLocaleString()}{suffix}</span>;
}

// Device Icon Component
function DeviceIcon({ device }: { device: string }) {
  switch (device.toLowerCase()) {
    case 'mobile':
      return <Smartphone className="w-4 h-4" />;
    case 'tablet':
      return <Tablet className="w-4 h-4" />;
    default:
      return <Monitor className="w-4 h-4" />;
  }
}

export default function StatsPage() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState("30");
  const [isVisible, setIsVisible] = useState(false);
  const [isLeadsByServiceExpanded, setIsLeadsByServiceExpanded] = useState(false);
  const [isAvgQuoteExpanded, setIsAvgQuoteExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

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

  // Fetch comprehensive stats with time filter
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/stats', timeFilter],
    queryFn: async () => {
      const res = await fetch(`/api/stats?days=${timeFilter}`, { credentials: 'include' });
      const data = await res.json();
      console.log('[Stats Page] API Response:', data);
      if (!res.ok) {
        console.error('[Stats Page] API Error:', data);
        throw new Error(data.message || 'Failed to fetch stats');
      }
      return data;
    },
  });

  // Log any query errors
  if (statsError) {
    console.error('[Stats Page] Query Error:', statsError);
  }

  // Log the stats data for debugging
  console.log('[Stats Page] hasAccess:', hasAccess, 'userPlan:', userPlan);
  console.log('[Stats Page] stats data:', stats);

  // Show error state if API returned an error response (like upgrade required)
  if (stats?.upgradeRequired || stats?.error) {
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
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Business Analytics</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {stats?.message || "Analytics and statistics are not available on the free plan. Upgrade to track your leads, conversions, and revenue."}
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

  if (statsLoading) {
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
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400">Gathering your business insights...</p>
            <div className="flex justify-center mt-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Business Analytics</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
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

  // Extract data from API response
  const serviceMetrics = stats?.serviceMetrics || [];
  const displayedLeadsByService = isLeadsByServiceExpanded ? serviceMetrics : serviceMetrics.slice(0, 5);
  const displayedAvgQuoteData = isAvgQuoteExpanded ? serviceMetrics : serviceMetrics.slice(0, 5);
  const monthlyTrends = stats?.monthlyTrends || [];
  const sourceMetrics = stats?.sourceMetrics || [];
  const howDidYouHearMetrics = stats?.howDidYouHearMetrics || [];
  const sessionMetrics = stats?.sessionMetrics || {};
  const pageViews = stats?.pageViews || { total: 0, unique: 0, byDevice: {}, byReferrer: {} };
  const geographicMetrics = stats?.geographicMetrics || { byDistance: { near: 0, medium: 0, far: 0 }, totalDistanceFees: 0, avgDistance: 0 };
  const discountMetrics = stats?.discountMetrics || { leadsWithDiscounts: 0, totalDiscountAmount: 0, avgDiscountPercent: 0, discountsByName: {} };
  const upsellMetrics = stats?.upsellMetrics || { leadsWithUpsells: 0, totalUpsellRevenue: 0, upsellAcceptanceRate: 0, upsellsByName: {} };
  const bookingMetrics = stats?.bookingMetrics || { totalBookings: 0, bookingsByDayOfWeek: [0,0,0,0,0,0,0], avgLeadTimedays: 0 };
  const pipelineMetrics = stats?.pipelineMetrics || { avgDaysToBooked: 0 };
  const leadsByStage = stats?.leadsByStage || {};

  // Build funnel data from actual metrics
  const funnelData = [
    { name: 'Page Views', value: pageViews.total || Math.floor((stats?.totalCalculatorSessions || 0) * 2.5), fill: '#3b82f6' },
    { name: 'Calculator Sessions', value: sessionMetrics.total || stats?.totalCalculatorSessions || 0, fill: '#10b981' },
    { name: 'Leads Generated', value: stats?.totalLeads || 0, fill: '#f59e0b' },
    { name: 'Booked', value: stats?.totalBookedLeads || 0, fill: '#8b5cf6' }
  ];

  // Total revenue calculation (already in cents from API)
  const totalRevenueDollars = (stats?.totalRevenue || 0) / 100;

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

        {/* Enhanced Key Metrics Cards */}
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
                    <SimpleCounter value={stats?.totalLeads || 0} />
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
                      value={Math.round(totalRevenueDollars)}
                      prefix="$"
                    />
                  </p>
                  <div className="flex items-center gap-1 text-purple-100 text-xs">
                    <DollarSign className="w-3 h-3" />
                    <span>Quote value</span>
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
                    <SimpleCounter value={stats?.conversionRate || 0} suffix="%" />
                  </p>
                  <div className="flex items-center gap-1 text-amber-100 text-xs">
                    <Target className="w-3 h-3" />
                    <span>Lead to booked</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-white dark:bg-gray-800/80">
            <CardContent className="p-4 text-center">
              <Eye className="w-5 h-5 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pageViews.total}</p>
              <p className="text-xs text-gray-500">Page Views</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800/80">
            <CardContent className="p-4 text-center">
              <Activity className="w-5 h-5 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sessionMetrics.total || 0}</p>
              <p className="text-xs text-gray-500">Sessions</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800/80">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-5 h-5 mx-auto mb-2 text-emerald-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalBookedLeads || 0}</p>
              <p className="text-xs text-gray-500">Booked</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800/80">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-5 h-5 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${Math.round((stats?.avgQuoteValue || 0) / 100)}</p>
              <p className="text-xs text-gray-500">Avg Quote</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800/80">
            <CardContent className="p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pipelineMetrics.avgDaysToBooked || 0}d</p>
              <p className="text-xs text-gray-500">Days to Book</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800/80">
            <CardContent className="p-4 text-center">
              <Percent className="w-5 h-5 mx-auto mb-2 text-rose-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sessionMetrics.completionRate || 0}%</p>
              <p className="text-xs text-gray-500">Completion Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1: Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads by Source Pie Chart */}
          <Card className="group relative overflow-hidden bg-white dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-cyan-50/50 dark:from-emerald-900/10 dark:to-cyan-900/10"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Leads by Source
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
                    Distribution of lead origins
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-80">
                {sourceMetrics.length > 0 ? (
                  <Chart
                    options={{
                      chart: { type: 'pie', height: 320, background: 'transparent', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
                      colors: COLORS,
                      labels: sourceMetrics.map((item: any) => item.source),
                      legend: { position: 'bottom', labels: { colors: '#64748b', fontSize: '12px' } },
                      tooltip: { theme: 'light', y: { formatter: (val: number) => `${val} leads` } },
                      dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: 600, colors: ['#fff'] } }
                    } as ApexOptions}
                    series={sourceMetrics.map((item: any) => item.count)}
                    type="pie"
                    height={320}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* How They Heard About Us */}
          <Card className="group relative overflow-hidden bg-white dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-900/10 dark:to-fuchsia-900/10"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                  <Users className="w-5 h-5" />
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  How They Heard About Us
                </span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">Referral sources</p>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-80">
                {howDidYouHearMetrics.length > 0 ? (
                  <Chart
                    options={{
                      chart: { type: 'pie', height: 320, background: 'transparent', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
                      colors: ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#84cc16', '#f97316'],
                      labels: howDidYouHearMetrics.map((item: any) => item.source),
                      legend: { position: 'bottom', labels: { colors: '#64748b', fontSize: '12px' } },
                      tooltip: { theme: 'light', y: { formatter: (val: number) => `${val} leads` } },
                      dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: 600, colors: ['#fff'] } }
                    } as ApexOptions}
                    series={howDidYouHearMetrics.map((item: any) => item.count)}
                    type="pie"
                    height={320}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Service Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads by Service Bar Chart */}
          <Card className="group relative overflow-hidden bg-white dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Leads by Service
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
                    {isLeadsByServiceExpanded ? 'All services' : 'Top 5 services'}
                  </p>
                </div>
                {serviceMetrics.length > 5 && (
                  <button
                    onClick={() => setIsLeadsByServiceExpanded(!isLeadsByServiceExpanded)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {isLeadsByServiceExpanded ? <><ChevronUp className="w-4 h-4" /><span>Show Less</span></> : <><ChevronDown className="w-4 h-4" /><span>Show All ({serviceMetrics.length})</span></>}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-80">
                {displayedLeadsByService.length > 0 ? (
                  <Chart
                    options={{
                      chart: { type: 'bar', height: 320, background: 'transparent', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
                      plotOptions: { bar: { borderRadius: 8, columnWidth: '60%', dataLabels: { position: 'top' } } },
                      dataLabels: { enabled: true, offsetY: -20, style: { fontSize: '12px', fontWeight: 600, colors: ['#64748b'] } },
                      colors: ['#3b82f6'],
                      fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.25, gradientToColors: ['#1d4ed8'], inverseColors: false, opacityFrom: 0.85, opacityTo: 0.65, stops: [0, 100] } },
                      grid: { borderColor: '#e2e8f0', strokeDashArray: 3, opacity: 0.5 },
                      xaxis: { categories: displayedLeadsByService.map((item: any) => item.serviceName), labels: { rotate: -45, style: { colors: '#64748b', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
                      yaxis: { labels: { style: { colors: '#64748b' } } },
                      tooltip: { theme: 'light', y: { formatter: (val: number) => `${val} leads` } }
                    } as ApexOptions}
                    series={[{ name: 'Number of Leads', data: displayedLeadsByService.map((item: any) => item.leads || item.count) }]}
                    type="bar"
                    height={320}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Distribution Donut */}
          <Card className="group relative overflow-hidden bg-white dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Revenue Distribution
                </span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">Income breakdown by service</p>
            </CardHeader>
            <CardContent className="relative">
              <div className="md:hidden mb-4 text-center p-4 bg-gradient-to-br from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${serviceMetrics.slice(0, 8).reduce((sum: number, item: any) => sum + (item.revenue / 100), 0).toLocaleString()}
                </p>
              </div>
              <div className="h-80">
                {serviceMetrics.length > 0 ? (
                  <Chart
                    options={{
                      chart: { type: 'donut', height: 320, background: 'transparent', fontFamily: 'Inter, sans-serif' },
                      colors: COLORS.slice(0, 8),
                      plotOptions: { pie: { donut: { size: '65%', labels: { show: !isMobile, name: { show: true, fontSize: '16px', fontWeight: 600 }, value: { show: true, fontSize: '24px', fontWeight: 700, formatter: (val: string) => `$${Math.round(parseInt(val) / 100).toLocaleString()}` }, total: { show: true, label: 'Total Revenue', formatter: () => `$${Math.round(serviceMetrics.slice(0, 8).reduce((sum: number, item: any) => sum + item.revenue, 0) / 100).toLocaleString()}` } } } } },
                      labels: serviceMetrics.slice(0, 8).map((item: any) => item.serviceName),
                      legend: { show: false },
                      tooltip: { theme: 'light', y: { formatter: (val: number) => `$${Math.round(val / 100).toLocaleString()}` } }
                    } as ApexOptions}
                    series={serviceMetrics.slice(0, 8).map((item: any) => item.revenue)}
                    type="donut"
                    height={320}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card className="group relative overflow-hidden bg-white dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-900/10 dark:to-blue-900/10"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                <Filter className="w-5 h-5" />
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Conversion Funnel
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
              Track how visitors convert through your pricing calculators
            </p>
          </CardHeader>
          <CardContent className="relative">
            <div className="h-96">
              <Chart
                options={{
                  chart: { type: 'bar', height: 400, background: 'transparent', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
                  plotOptions: { bar: { borderRadius: 8, horizontal: true, barHeight: '75%', distributed: true, dataLabels: { position: 'center' } } },
                  dataLabels: { enabled: true, style: { colors: ['#ffffff'], fontSize: '13px', fontWeight: 600 }, formatter: (val: number, opts: any) => `${funnelData[opts.dataPointIndex].name}\n${val.toLocaleString()}` },
                  colors: funnelData.map(item => item.fill),
                  fill: { type: 'gradient', gradient: { shade: 'light', type: 'horizontal', shadeIntensity: 0.25, inverseColors: false, opacityFrom: 0.85, opacityTo: 0.65, stops: [0, 100] } },
                  grid: { show: false },
                  xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
                  yaxis: { labels: { show: false } },
                  tooltip: { theme: 'light', y: { formatter: (val: number) => val.toLocaleString() } },
                  legend: { show: false }
                } as ApexOptions}
                series={[{ name: 'Conversion Funnel', data: funnelData.map(item => item.value) }]}
                type="bar"
                height={400}
              />
            </div>

            {/* Funnel Metrics */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {funnelData.map((stage, index) => {
                const nextStage = funnelData[index + 1];
                const conversionRate = nextStage && stage.value > 0
                  ? ((nextStage.value / stage.value) * 100).toFixed(1)
                  : null;

                return (
                  <div key={stage.name} className="text-center group hover:scale-105 transition-transform duration-200">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800 dark:to-gray-700 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="text-2xl font-bold mb-1" style={{ color: stage.fill }}>
                        <SimpleCounter value={stage.value} />
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">{stage.name}</div>
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

        {/* NEW: Device & Session Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device Breakdown */}
          <Card className="bg-white dark:bg-gray-800/80 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="w-5 h-5 text-blue-500" />
                Sessions by Device
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(sessionMetrics.byDevice || {}).map(([device, count]: [string, any]) => {
                  const total = Object.values(sessionMetrics.byDevice || {}).reduce((a: number, b: any) => a + b, 0) as number;
                  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={device} className="flex items-center gap-3">
                      <DeviceIcon device={device} />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize font-medium">{device}</span>
                          <span className="text-gray-500">{count} ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(sessionMetrics.byDevice || {}).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No device data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Drop-off Analysis */}
          <Card className="bg-white dark:bg-gray-800/80 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <XCircle className="w-5 h-5 text-red-500" />
                Drop-off by Step
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(sessionMetrics.dropOffByStep || {}).sort(([a], [b]) => parseInt(a) - parseInt(b)).slice(0, 5).map(([step, count]: [string, any]) => (
                  <div key={step} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="font-medium">Step {step}</span>
                    <Badge variant="destructive">{count} abandoned</Badge>
                  </div>
                ))}
                {Object.keys(sessionMetrics.dropOffByStep || {}).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No drop-off data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Session Stats */}
          <Card className="bg-white dark:bg-gray-800/80 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-green-500" />
                Session Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{sessionMetrics.completed || 0}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{sessionMetrics.converted || 0}</p>
                  <p className="text-xs text-gray-500">Converted</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-purple-600">{sessionMetrics.completionRate || 0}%</p>
                  <p className="text-xs text-gray-500">Completion Rate</p>
                </div>
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{Math.round((sessionMetrics.avgDurationSeconds || 0) / 60)}m</p>
                  <p className="text-xs text-gray-500">Avg Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NEW: Geographic & Distance Analytics */}
        <Card className="bg-white dark:bg-gray-800/80 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                <MapPin className="w-5 h-5" />
              </div>
              Geographic Analytics
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">Lead distribution by distance from your business</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl">
                <p className="text-3xl font-bold text-teal-600">{geographicMetrics.byDistance?.near || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Within 10 miles</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">{geographicMetrics.byDistance?.medium || 0}</p>
                <p className="text-sm text-gray-500 mt-1">10-25 miles</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{geographicMetrics.byDistance?.far || 0}</p>
                <p className="text-sm text-gray-500 mt-1">25+ miles</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl">
                <p className="text-3xl font-bold text-emerald-600">${Math.round((geographicMetrics.totalDistanceFees || 0) / 100)}</p>
                <p className="text-sm text-gray-500 mt-1">Distance Fees Collected</p>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Average distance: <span className="font-semibold">{geographicMetrics.avgDistance || 0} miles</span> |
              Leads with location: <span className="font-semibold">{geographicMetrics.leadsWithDistance || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* NEW: Discount & Upsell Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Discount Analytics */}
          <Card className="bg-white dark:bg-gray-800/80 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <Percent className="w-5 h-5" />
                </div>
                Discount Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-orange-600">{discountMetrics.leadsWithDiscounts}</p>
                  <p className="text-xs text-gray-500">Leads w/ Discounts</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">${Math.round((discountMetrics.totalDiscountAmount || 0) / 100)}</p>
                  <p className="text-xs text-gray-500">Total Discounts</p>
                </div>
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{discountMetrics.avgDiscountPercent}%</p>
                  <p className="text-xs text-gray-500">Avg Discount</p>
                </div>
              </div>
              {Object.keys(discountMetrics.discountsByName || {}).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">By Discount Type</p>
                  {Object.entries(discountMetrics.discountsByName).slice(0, 5).map(([name, data]: [string, any]) => (
                    <div key={name} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm">{name}</span>
                      <Badge variant="outline">{data.count}x (${Math.round(data.totalAmount / 100)})</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upsell Analytics */}
          <Card className="bg-white dark:bg-gray-800/80 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <Gift className="w-5 h-5" />
                </div>
                Upsell Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{upsellMetrics.leadsWithUpsells}</p>
                  <p className="text-xs text-gray-500">Leads w/ Upsells</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">${Math.round((upsellMetrics.totalUpsellRevenue || 0) / 100)}</p>
                  <p className="text-xs text-gray-500">Upsell Revenue</p>
                </div>
                <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-teal-600">{upsellMetrics.upsellAcceptanceRate}%</p>
                  <p className="text-xs text-gray-500">Acceptance Rate</p>
                </div>
              </div>
              {Object.keys(upsellMetrics.upsellsByName || {}).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Upsells</p>
                  {Object.entries(upsellMetrics.upsellsByName).slice(0, 5).map(([name, data]: [string, any]) => (
                    <div key={name} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm">{name}</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">{data.count}x (${Math.round(data.totalAmount / 100)})</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* NEW: Booking Analytics */}
        <Card className="bg-white dark:bg-gray-800/80 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Calendar className="w-5 h-5" />
              </div>
              Booking Analytics
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">Calendar and scheduling insights</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bookings by Day of Week */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Bookings by Day of Week</p>
                <div className="space-y-2">
                  {DAY_NAMES.map((day, index) => {
                    const count = bookingMetrics.bookingsByDayOfWeek?.[index] || 0;
                    const maxCount = Math.max(...(bookingMetrics.bookingsByDayOfWeek || [0]));
                    const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="w-8 text-sm font-medium text-gray-500">{day}</span>
                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                            style={{ width: `${Math.max(percent, count > 0 ? 15 : 0)}%` }}
                          >
                            {count > 0 && <span className="text-xs text-white font-medium">{count}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Booking Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <p className="text-3xl font-bold text-indigo-600">{bookingMetrics.totalBookings}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Bookings</p>
                </div>
                <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <p className="text-3xl font-bold text-purple-600">{bookingMetrics.avgLeadTimedays}d</p>
                  <p className="text-sm text-gray-500 mt-1">Avg Lead Time</p>
                </div>
                <div className="text-center p-6 bg-violet-50 dark:bg-violet-900/20 rounded-xl col-span-2">
                  <p className="text-3xl font-bold text-violet-600">{bookingMetrics.capacityUtilization || 0}%</p>
                  <p className="text-sm text-gray-500 mt-1">Capacity Utilization</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="group relative overflow-hidden bg-white dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Monthly Trends
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">Growth patterns over time</p>
          </CardHeader>
          <CardContent className="relative">
            <div className="h-[400px]">
              {monthlyTrends.length > 0 ? (
                <Chart
                  options={{
                    chart: { type: 'area', height: 400, background: 'transparent', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
                    colors: ['#3b82f6', '#10b981'],
                    fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.25, gradientToColors: ['#1d4ed8', '#059669'], inverseColors: false, opacityFrom: 0.7, opacityTo: 0.1, stops: [0, 100] } },
                    dataLabels: { enabled: false },
                    stroke: { curve: 'smooth', width: 3 },
                    grid: { borderColor: '#e2e8f0', strokeDashArray: 3, opacity: 0.5 },
                    xaxis: { categories: monthlyTrends.map((item: any) => item.month), labels: { style: { colors: '#64748b', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
                    yaxis: [
                      { title: { text: 'Leads', style: { color: '#64748b' } }, labels: { style: { colors: '#64748b' } } },
                      { opposite: true, title: { text: 'Revenue', style: { color: '#64748b' } }, labels: { style: { colors: '#64748b' }, formatter: (val: number) => `$${Math.round(val / 100).toLocaleString()}` } }
                    ],
                    tooltip: { theme: 'light', shared: true, intersect: false, y: { formatter: (val: number, opts: any) => opts.seriesIndex === 0 ? `${val} leads` : `$${Math.round(val / 100).toLocaleString()}` } },
                    legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px', fontWeight: 500, labels: { colors: '#64748b' } }
                  } as ApexOptions}
                  series={[
                    { name: 'Leads', data: monthlyTrends.map((item: any) => item.leads) },
                    { name: 'Revenue', data: monthlyTrends.map((item: any) => item.revenue) }
                  ]}
                  type="area"
                  height={400}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No trend data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Stages */}
        <Card className="bg-white dark:bg-gray-800/80 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                <Activity className="w-5 h-5" />
              </div>
              Pipeline Overview
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">Leads by stage</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(leadsByStage).map(([stage, count]: [string, any]) => (
                <div key={stage} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-full">
                  <span className="capitalize text-sm font-medium">{stage.replace(/_/g, ' ')}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {Object.keys(leadsByStage).length === 0 && (
                <p className="text-gray-500">No pipeline data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Services Table */}
        <Card className="group relative overflow-hidden bg-white dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-pink-50/50 dark:from-rose-900/10 dark:to-pink-900/10"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Top Performing Services
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">Detailed performance metrics and rankings</p>
          </CardHeader>
          <CardContent className="relative">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700/50">
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-tl-lg">Service Name</th>
                    <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">Total Leads</th>
                    <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">Total Revenue</th>
                    <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">Avg Quote</th>
                    <th className="text-center p-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-tr-lg">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceMetrics.slice(0, 8).map((service: any, index: number) => (
                    <tr key={service.serviceName} className="border-b border-gray-100 dark:border-gray-700/30 hover:bg-gradient-to-r hover:from-white/80 hover:to-gray-50/60 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 transition-all duration-200">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-semibold text-gray-800 dark:text-white">{service.serviceName}</span>
                        </div>
                      </td>
                      <td className="text-right p-4 font-medium text-gray-700 dark:text-gray-300">
                        <SimpleCounter value={service.leads || service.count || 0} />
                      </td>
                      <td className="text-right p-4 font-bold text-emerald-600">
                        $<SimpleCounter value={Math.round((service.revenue || 0) / 100)} />
                      </td>
                      <td className="text-right p-4 font-medium text-gray-700 dark:text-gray-300">
                        $<SimpleCounter value={Math.round((service.avgQuote || 0) / 100)} />
                      </td>
                      <td className="text-center p-4">
                        <Badge className={
                          index < 3
                            ? "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300"
                            : index < 6
                            ? "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300"
                            : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300"
                        }>
                          {index < 3 ? "High" : index < 6 ? "Medium" : "Low"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {serviceMetrics.length === 0 && (
                <div className="text-center py-8 text-gray-500">No service data available</div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

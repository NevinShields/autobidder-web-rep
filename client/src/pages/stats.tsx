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
  CheckCircle, XCircle, Gift, ExternalLink
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
        .dash-metric-hover { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
        .dash-metric-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px -8px rgba(0,0,0,0.12); }
        .dash-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="p-4 sm:p-6 lg:p-8 dash-grain min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Hero Header */}
          <div className="dash-stagger dash-stagger-1 relative overflow-hidden rounded-2xl border border-blue-200/40 dark:border-blue-500/10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-400/60 font-semibold mb-2">Performance</p>
                <h1 className="text-3xl sm:text-4xl text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Business Analytics
                </h1>
                <p className="mt-2 text-sm text-slate-400 max-w-md">
                  Track your growth, monitor conversion funnels, and analyze service performance in real-time.
                </p>
              </div>
              <div className="flex gap-3">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-40 bg-white/10 backdrop-blur-sm border-white/20 text-white rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200 dark:border-gray-700">
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 3 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Main Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Calculators", value: stats?.totalCalculators || 0, icon: Calculator, gradient: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20", iconColor: "text-blue-600 dark:text-blue-400", borderAccent: "border-blue-200/60 dark:border-blue-500/20" },
              { label: "Total Leads", value: stats?.totalLeads || 0, icon: Users, gradient: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20", iconColor: "text-emerald-600 dark:text-emerald-400", borderAccent: "border-emerald-200/60 dark:border-emerald-500/20" },
              { label: "Total Revenue", value: `$${Math.round(totalRevenueDollars).toLocaleString()}`, icon: DollarSign, gradient: "from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20", iconColor: "text-purple-600 dark:text-purple-400", borderAccent: "border-purple-200/60 dark:border-purple-500/20" },
              { label: "Conversion", value: `${stats?.conversionRate || 0}%`, icon: Target, gradient: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20", iconColor: "text-amber-600 dark:text-amber-400", borderAccent: "border-amber-200/60 dark:border-amber-500/20" },
            ].map((metric, i) => (
              <div
                key={metric.label}
                className={`dash-stagger dash-stagger-${i + 2} dash-metric-hover relative overflow-hidden rounded-2xl border ${metric.borderAccent} bg-gradient-to-br ${metric.gradient} backdrop-blur-sm p-5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">{metric.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      {metric.value}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10`}>
                    <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Secondary Metrics Row */}
          <div className="dash-stagger dash-stagger-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Page Views", value: pageViews.total, icon: Eye, color: "text-blue-500" },
              { label: "Sessions", value: sessionMetrics.total || 0, icon: Activity, color: "text-green-500" },
              { label: "Booked", value: stats?.totalBookedLeads || 0, icon: CheckCircle, color: "text-emerald-500" },
              { label: "Avg Quote", value: `$${Math.round((stats?.avgQuoteValue || 0) / 100)}`, icon: DollarSign, color: "text-purple-500" },
              { label: "Days to Book", value: `${pipelineMetrics.avgDaysToBooked || 0}d`, icon: Clock, color: "text-amber-500" },
              { label: "Completion", value: `${sessionMetrics.completionRate || 0}%`, icon: Percent, color: "text-rose-500" },
            ].map((m) => (
              <Card key={m.label} className="bg-white/70 dark:bg-gray-800/50 border-gray-200/60 dark:border-gray-700/40 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <m.icon className={`w-4 h-4 mx-auto mb-2 ${m.color}`} />
                  <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{m.value}</p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mt-1">{m.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="dash-stagger dash-stagger-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads by Source */}
            <Card className="rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  <Users className="h-5 w-5 text-emerald-500" />
                  Leads by Source
                </CardTitle>
              </CardHeader>
              <CardContent>
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

            {/* How They Heard */}
            <Card className="rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  <Activity className="h-5 w-5 text-violet-500" />
                  Acquisition
                </CardTitle>
              </CardHeader>
              <CardContent>
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

            {/* Leads by Service */}
            <Card className="rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Service Performance
                  </CardTitle>
                  {serviceMetrics.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsLeadsByServiceExpanded(!isLeadsByServiceExpanded)}
                      className="h-8 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-xs"
                    >
                      {isLeadsByServiceExpanded ? "Show Less" : "Show All"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {displayedLeadsByService.length > 0 ? (
                    <Chart
                      options={{
                        chart: { type: 'bar', height: 320, background: 'transparent', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
                        plotOptions: { bar: { borderRadius: 8, columnWidth: '60%', dataLabels: { position: 'top' } } },
                        dataLabels: { enabled: true, offsetY: -20, style: { fontSize: '12px', fontWeight: 600, colors: ['#64748b'] } },
                        colors: ['#3b82f6'],
                        fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.25, gradientToColors: ['#1d4ed8'], inverseColors: false, opacityFrom: 0.85, opacityTo: 0.65, stops: [0, 100] } },
                        xaxis: { categories: displayedLeadsByService.map((item: any) => item.serviceName), labels: { style: { colors: '#64748b', fontSize: '11px' } } },
                        grid: { borderColor: '#e2e8f0', strokeDashArray: 3, opacity: 0.5 },
                        tooltip: { theme: 'light' }
                      } as ApexOptions}
                      series={[{ name: 'Leads', data: displayedLeadsByService.map((item: any) => item.leads || item.count) }]}
                      type="bar"
                      height={320}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card className="rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Monthly Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {monthlyTrends.length > 0 ? (
                    <Chart
                      options={{
                        chart: { type: 'area', height: 320, background: 'transparent', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
                        colors: ['#3b82f6', '#10b981'],
                        stroke: { curve: 'smooth', width: 3 },
                        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100] } },
                        xaxis: { categories: monthlyTrends.map((item: any) => item.month), labels: { style: { colors: '#64748b', fontSize: '11px' } } },
                        yaxis: [
                          { title: { text: 'Leads' }, labels: { style: { colors: '#64748b' } } },
                          { opposite: true, title: { text: 'Revenue' }, labels: { style: { colors: '#64748b' }, formatter: (val: number) => `$${Math.round(val / 100).toLocaleString()}` } }
                        ],
                        grid: { borderColor: '#e2e8f0', strokeDashArray: 3 },
                        tooltip: { theme: 'light', shared: true }
                      } as ApexOptions}
                      series={[
                        { name: 'Leads', data: monthlyTrends.map((item: any) => item.leads) },
                        { name: 'Revenue', data: monthlyTrends.map((item: any) => item.revenue) }
                      ]}
                      type="area"
                      height={320}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel Card */}
          <Card className="rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                <Filter className="h-5 w-5 text-orange-500" />
                Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {funnelData.map((stage, index) => {
                  const nextStage = funnelData[index + 1];
                  const conversionRate = nextStage && stage.value > 0
                    ? ((nextStage.value / stage.value) * 100).toFixed(1)
                    : null;

                  return (
                    <div key={stage.name} className="relative group">
                      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                        <div className="text-3xl font-bold mb-1 tabular-nums" style={{ color: stage.fill }}>
                          {stage.value.toLocaleString()}
                        </div>
                        <p className="text-xs uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500">{stage.name}</p>
                        {conversionRate && (
                          <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg">
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{conversionRate}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Geographic Analysis */}
          <Card className="rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                <MapPin className="h-5 w-5 text-teal-500" />
                Geographic Reach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-6 rounded-2xl bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/20">
                  <p className="text-3xl font-bold text-teal-600 tabular-nums">{geographicMetrics.byDistance?.near || 0}</p>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mt-2">Within 10 miles</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                  <p className="text-3xl font-bold text-blue-600 tabular-nums">{geographicMetrics.byDistance?.medium || 0}</p>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mt-2">10-25 miles</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
                  <p className="text-3xl font-bold text-purple-600 tabular-nums">{geographicMetrics.byDistance?.far || 0}</p>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mt-2">25+ miles</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                  <p className="text-3xl font-bold text-emerald-600 tabular-nums">${Math.round((geographicMetrics.totalDistanceFees || 0) / 100)}</p>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mt-2">Fees Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

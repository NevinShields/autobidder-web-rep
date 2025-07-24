import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { TrendingUp, Users, DollarSign, Calculator, Calendar, Target, Activity, BarChart3 } from "lucide-react";
import AppHeader from "@/components/app-header";
import { useState } from "react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

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

export default function StatsPage() {
  const [timeFilter, setTimeFilter] = useState("30");

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

    return Object.entries(serviceData).map(([serviceName, data]) => ({
      serviceName,
      count: data.count,
      revenue: data.revenue
    }));
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

    // Sort by date and return last 6 months
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
    
    leads.forEach((lead: any) => {
      lead.services.forEach((service: any) => {
        if (!serviceRevenue[service.serviceName]) {
          serviceRevenue[service.serviceName] = { total: 0, count: 0 };
        }
        serviceRevenue[service.serviceName].total += service.price || 0;
        serviceRevenue[service.serviceName].count++;
      });
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
    const totalViews = stats?.totalCalculators * 10 || 0; // Estimated views
    const totalLeads = leads.length;
    const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;
    
    return {
      totalViews,
      totalLeads,
      conversionRate: conversionRate.toFixed(2)
    };
  };

  const leadsByService = processLeadsByService();
  const monthlyData = processMonthlyData();
  const revenueByService = processRevenueByService();
  const topServices = getTopPerformingServices();
  const conversionMetrics = getConversionMetrics();

  if (statsLoading || leadsLoading || formulasLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          <div className="text-center py-8">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Analytics</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights into your pricing calculators and lead generation
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
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

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Calculators</p>
                  <p className="text-3xl font-bold">{stats?.totalCalculators || 0}</p>
                  <p className="text-blue-100 text-xs mt-1">Active formulas</p>
                </div>
                <Calculator className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Leads</p>
                  <p className="text-3xl font-bold">{leads.length || 0}</p>
                  <p className="text-green-100 text-xs mt-1">All time</p>
                </div>
                <Users className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold">
                    ${leadsByService.reduce((sum, service) => sum + service.revenue, 0).toLocaleString()}
                  </p>
                  <p className="text-purple-100 text-xs mt-1">From all quotes</p>
                </div>
                <DollarSign className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Conversion Rate</p>
                  <p className="text-3xl font-bold">{conversionMetrics.conversionRate}%</p>
                  <p className="text-orange-100 text-xs mt-1">Visitor to lead</p>
                </div>
                <Target className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads by Service Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Leads by Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsByService}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="serviceName" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [value, name === 'count' ? 'Leads' : 'Revenue']}
                      labelFormatter={(label) => `Service: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Number of Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Revenue Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByService.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ serviceName, percent }) => `${serviceName}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="totalRevenue"
                    >
                      {revenueByService.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Monthly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="leads" 
                      stackId="1" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6}
                      name="Leads"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stackId="2" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                      name="Revenue ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Average Quote Value by Service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Average Quote Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByService.slice(0, 6)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="serviceName" 
                      type="category" 
                      width={100}
                      fontSize={10}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Avg Quote']}
                    />
                    <Bar dataKey="averageQuote" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Services Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Top Performing Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Service Name</th>
                    <th className="text-right p-3 font-medium">Total Leads</th>
                    <th className="text-right p-3 font-medium">Total Revenue</th>
                    <th className="text-right p-3 font-medium">Avg Quote</th>
                    <th className="text-center p-3 font-medium">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByService.slice(0, 8).map((service, index) => (
                    <tr key={service.serviceName} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{service.serviceName}</span>
                        </div>
                      </td>
                      <td className="text-right p-3">{service.leadCount}</td>
                      <td className="text-right p-3 font-medium text-green-600">
                        ${service.totalRevenue.toLocaleString()}
                      </td>
                      <td className="text-right p-3">
                        ${service.averageQuote.toLocaleString()}
                      </td>
                      <td className="text-center p-3">
                        <Badge 
                          variant={index < 3 ? "default" : index < 6 ? "secondary" : "outline"}
                          className={
                            index < 3 
                              ? "bg-green-100 text-green-800" 
                              : index < 6 
                              ? "bg-yellow-100 text-yellow-800" 
                              : ""
                          }
                        >
                          {index < 3 ? "High" : index < 6 ? "Medium" : "Low"}
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
  );
}
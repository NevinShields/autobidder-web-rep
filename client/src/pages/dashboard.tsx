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
  Star,
  Menu,
  X,
  Home,
  FileText,
  Globe,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Download,
  Activity
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Formula, Lead, BusinessSettings } from "@shared/schema";

// Sidebar navigation items
const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/", active: true },
  { icon: Calculator, label: "Calculators", href: "/formulas" },
  { icon: Users, label: "Leads", href: "/leads" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: BarChart3, label: "Analytics", href: "/stats" },
  { icon: Globe, label: "Website", href: "/website" },
  { icon: Palette, label: "Design", href: "/design" },
  { icon: Settings, label: "Settings", href: "/business-settings" },
];

// Quick action items
const quickActions = [
  { icon: Plus, label: "New Calculator", href: "/formula/new", color: "bg-blue-500 hover:bg-blue-600" },
  { icon: Eye, label: "Preview Form", href: "/embed-form", color: "bg-green-500 hover:bg-green-600" },
  { icon: Download, label: "Export Data", href: "/export", color: "bg-purple-500 hover:bg-purple-600" },
  { icon: Share, label: "Share Link", href: "/share", color: "bg-orange-500 hover:bg-orange-600" },
];

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");
  const [, setLocation] = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Mock user ID - in production this would come from authentication
  const userId = "user1";

  // Check if user needs onboarding
  const { data: user } = useQuery({
    queryKey: ["/api/profile"],
  }) as { data: any };

  useEffect(() => {
    // Redirect to onboarding if user hasn't completed it
    if (user && !(user as any).onboardingCompleted) {
      setLocation("/onboarding");
    }
  }, [user, setLocation]);

  // Fetch all data
  const { data: formulas, isLoading: formulasLoading } = useQuery({
    queryKey: ["/api/formulas"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/leads"],
  });

  const { data: multiServiceLeads, isLoading: multiLeadsLoading } = useQuery({
    queryKey: ["/api/multi-service-leads"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/business-settings"],
  });

  const formulaList = (formulas as Formula[]) || [];
  const leadList = (leads as Lead[]) || [];
  const multiLeadList = (multiServiceLeads as any[]) || [];
  const businessSettings = settings as BusinessSettings;

  // Calculate enhanced metrics
  const totalLeads = leadList.length + multiLeadList.length;
  const avgQuoteValue = (stats as any)?.avgQuoteValue || 0;
  const totalCalculators = formulaList.length;
  const activeCalculators = formulaList.filter(f => f.isDisplayed !== false).length;
  
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
      <div className="flex h-screen bg-gray-50">
        <div className="animate-pulse bg-gray-200 w-64 h-full"></div>
        <div className="flex-1 p-8">
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
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        sidebarExpanded ? "w-64" : "w-16"
      )}>
        {/* Logo and Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {sidebarExpanded && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">PriceBuilder</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-2"
          >
            {sidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={item.active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  !sidebarExpanded && "px-2",
                  item.active && "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                <item.icon className="w-4 h-4" />
                {sidebarExpanded && <span className="ml-2">{item.label}</span>}
              </Button>
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        {sidebarExpanded && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {businessSettings?.businessName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">Owner</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header with Quick Actions */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <Badge variant="secondary" className="text-xs">
                {totalCalculators} calculators
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button size="sm" className={cn("text-white", action.color)}>
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Calculators</p>
                    <p className="text-3xl font-bold text-gray-900">{totalCalculators}</p>
                    <div className="flex items-center mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {activeCalculators} active
                      </Badge>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-3xl font-bold text-gray-900">{totalLeads}</p>
                    <div className="flex items-center mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {recentLeads.length} this week
                      </Badge>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Quote Value</p>
                    <p className="text-3xl font-bold text-gray-900">${avgQuoteValue.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600 font-medium">+12.5%</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">24.8%</p>
                    <div className="flex items-center mt-2">
                      <Target className="w-3 h-3 text-blue-500 mr-1" />
                      <span className="text-xs text-blue-600 font-medium">+3.2%</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Active Calculators */}
            <div className="xl:col-span-2">
              <Card>
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calculator className="w-4 h-4 text-blue-600" />
                      </div>
                      Active Calculators
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{activeCalculators} active</Badge>
                      <Link href="/formulas">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View All
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {calculatorPerformance.length > 0 ? (
                    <div className="space-y-4">
                      {calculatorPerformance.slice(0, 5).map((calculator) => (
                        <div key={calculator.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calculator className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{calculator.name}</h4>
                              <p className="text-sm text-gray-600">{calculator.leadCount} leads generated</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                ${calculator.totalRevenue.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">Total Revenue</p>
                            </div>
                            <Badge 
                              variant={calculator.isDisplayed !== false ? "default" : "secondary"}
                              className="w-16"
                            >
                              {calculator.isDisplayed !== false ? "Active" : "Inactive"}
                            </Badge>
                            <Link href={`/formula/${calculator.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-900 mb-2">No calculators yet</h3>
                      <p className="text-sm text-gray-600 mb-4">Create your first pricing calculator to get started</p>
                      <Link href="/formula/new">
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Calculator
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Recent Leads */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Recent Leads
                    </span>
                    <Badge variant="secondary">{recentLeads.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentLeads.length > 0 ? (
                    <div className="space-y-3">
                      {recentLeads.slice(0, 3).map((lead, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{lead.name}</p>
                            <p className="text-xs text-gray-600 truncate">{lead.email}</p>
                            <p className="text-xs text-gray-500">
                              ${(lead.totalPrice || lead.calculatedPrice || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <Link href="/leads">
                        <Button variant="outline" size="sm" className="w-full mt-3">
                          View All Leads
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No recent leads</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Setup Progress */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-blue-500" />
                    Setup Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Business Settings</span>
                      <CheckCircle2 className={`w-4 h-4 ${businessSettings ? 'text-green-500' : 'text-gray-300'}`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Create Calculator</span>
                      <CheckCircle2 className={`w-4 h-4 ${totalCalculators > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Customize Design</span>
                      <CheckCircle2 className={`w-4 h-4 ${businessSettings?.styling ? 'text-green-500' : 'text-gray-300'}`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Get First Lead</span>
                      <CheckCircle2 className={`w-4 h-4 ${totalLeads > 0 ? 'text-green-500' : 'text-gray-300'}`} />
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
        </main>
      </div>
    </div>
  );
}
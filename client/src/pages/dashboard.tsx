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
  Activity,
  HelpCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Formula, Lead, BusinessSettings } from "@shared/schema";
import SupportContact from "@/components/support-contact";

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
  { icon: Eye, label: "Classic Form", href: "/embed-form", color: "bg-green-500 hover:bg-green-600" },
  { icon: Zap, label: "Upsell Form", href: "/upsell-form", color: "bg-purple-500 hover:bg-purple-600" },
  { icon: Share, label: "Share Link", href: "/share", color: "bg-orange-500 hover:bg-orange-600" },
];

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");
  const [, setLocation] = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <div className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        // Desktop styles
        "hidden lg:flex",
        sidebarExpanded ? "w-64" : "w-16",
        // Mobile styles - slide out menu
        "lg:translate-x-0",
        mobileMenuOpen && "fixed inset-y-0 left-0 z-50 w-64 flex lg:hidden"
      )}>
        {/* Logo and Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {(sidebarExpanded || mobileMenuOpen) && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">PriceBuilder</span>
            </div>
          )}
          {/* Desktop Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-2 hidden lg:flex"
          >
            {sidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
          {/* Mobile Close */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 lg:hidden"
          >
            <X className="w-4 h-4" />
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
                  !sidebarExpanded && !mobileMenuOpen && "px-2",
                  item.active && "bg-blue-600 text-white hover:bg-blue-700"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {(sidebarExpanded || mobileMenuOpen) && <span className="ml-2">{item.label}</span>}
              </Button>
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        {(sidebarExpanded || mobileMenuOpen) && (
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
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
                <Badge variant="secondary" className="text-xs mt-1 sm:mt-0 sm:ml-2 sm:inline-block hidden">
                  {totalCalculators} calculators
                </Badge>
              </div>
            </div>

            {/* Quick Actions - Desktop */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10 w-48 lg:w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <SupportContact 
                trigger={
                  <Button variant="outline" size="sm">
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                }
              />
              {quickActions.slice(0, 2).map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button size="sm" className={cn("text-white", action.color)}>
                    <action.icon className="w-4 h-4 mr-2" />
                    <span className="hidden lg:inline">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>

            {/* Quick Actions - Mobile */}
            <div className="flex md:hidden items-center space-x-2">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <SupportContact 
                trigger={
                  <Button variant="outline" size="sm">
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                }
              />
              <Link href="/formula/new">
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 pb-20 lg:pb-6">
          {/* Mobile Calculator Count Badge */}
          <div className="sm:hidden mb-4">
            <Badge variant="secondary" className="text-xs">
              {totalCalculators} calculators
            </Badge>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-700 truncate">Total Calculators</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-900">{totalCalculators}</p>
                    <div className="flex items-center mt-2">
                      <Badge variant="secondary" className="text-xs bg-blue-200 text-blue-800">
                        {activeCalculators} active
                      </Badge>
                    </div>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-700 truncate">Total Leads</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-900">{totalLeads}</p>
                    <div className="flex items-center mt-2">
                      <Badge variant="secondary" className="text-xs bg-green-200 text-green-800">
                        {recentLeads.length} this week
                      </Badge>
                    </div>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-purple-700 truncate">Avg Quote Value</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-900">${avgQuoteValue.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-3 h-3 text-purple-600 mr-1" />
                      <span className="text-xs text-purple-600 font-medium">+12.5%</span>
                    </div>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-orange-700 truncate">Conversion Rate</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-900">24.8%</p>
                    <div className="flex items-center mt-2">
                      <Target className="w-3 h-3 text-orange-600 mr-1" />
                      <span className="text-xs text-orange-600 font-medium">+3.2%</span>
                    </div>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
            {/* Active Calculators */}
            <div className="xl:col-span-2">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-3 text-gray-800">
                      <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Calculator className="w-4 h-4 text-white" />
                      </div>
                      <span className="hidden sm:inline">Active Calculators</span>
                      <span className="sm:hidden">Calculators</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="hidden sm:inline-block">{activeCalculators} active</Badge>
                      <Link href="/formulas">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">View All</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {calculatorPerformance.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {calculatorPerformance.slice(0, 5).map((calculator) => (
                        <div key={calculator.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{calculator.name}</h4>
                              <p className="text-xs sm:text-sm text-gray-600">{calculator.leadCount} leads generated</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="font-semibold text-gray-900 text-sm">
                                ${calculator.totalRevenue.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">Total Revenue</p>
                            </div>
                            <Badge 
                              variant={calculator.isDisplayed !== false ? "default" : "secondary"}
                              className="text-xs hidden sm:inline-flex"
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
            <div className="space-y-4 sm:space-y-6">
              {/* Recent Leads */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg flex items-center justify-between text-gray-800">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="hidden sm:inline">Recent Leads</span>
                      <span className="sm:hidden">Leads</span>
                    </span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">{recentLeads.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {recentLeads.length > 0 ? (
                    <div className="space-y-3">
                      {recentLeads.slice(0, 3).map((lead, index) => (
                        <div key={index} className="flex items-start space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs sm:text-sm text-gray-900 truncate">{lead.name}</p>
                            <p className="text-xs text-gray-600 truncate">{lead.email}</p>
                            <p className="text-xs text-gray-500">
                              ${(lead.totalPrice || lead.calculatedPrice || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <Link href="/leads">
                        <Button variant="outline" size="sm" className="w-full mt-3">
                          <span className="text-xs sm:text-sm">View All Leads</span>
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm text-gray-600">No recent leads</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Setup Progress */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                    <Rocket className="w-4 h-4 text-purple-600" />
                    <span className="hidden sm:inline">Setup Progress</span>
                    <span className="sm:hidden">Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium">Business Settings</span>
                      <CheckCircle2 className={`w-4 h-4 ${businessSettings ? 'text-green-500' : 'text-gray-300'}`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium">Create Calculator</span>
                      <CheckCircle2 className={`w-4 h-4 ${totalCalculators > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium">Customize Design</span>
                      <CheckCircle2 className={`w-4 h-4 ${businessSettings?.styling ? 'text-green-500' : 'text-gray-300'}`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium">Get First Lead</span>
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

      {/* Mobile Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 lg:hidden z-30">
        <div className="flex items-center justify-around space-x-2">
          {quickActions.slice(0, 4).map((action, index) => (
            <Link key={action.href} href={action.href}>
              <Button 
                size="sm" 
                className={cn(
                  "text-white text-xs px-3 py-2 h-auto flex flex-col items-center",
                  action.color
                )}
              >
                <action.icon className="w-4 h-4 mb-1" />
                <span className="text-xs leading-none">{action.label.split(' ')[0]}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
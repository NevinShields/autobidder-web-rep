import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import AppHeader from "@/components/app-header";
import type { Formula, Lead, BusinessSettings } from "@shared/schema";

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");
  const [, setLocation] = useLocation();

  // Mock user ID - in production this would come from authentication
  const userId = "user1";

  // Check if user needs onboarding
  const { data: user } = useQuery({
    queryKey: ["/api/profile"],
  });

  useEffect(() => {
    // Redirect to onboarding if user hasn't completed it
    if (user && !user.onboardingCompleted) {
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
  const avgQuoteValue = stats?.avgQuoteValue || 0;
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
      revenue: formulaLeads.reduce((sum, lead) => sum + lead.calculatedPrice, 0)
    };
  }).sort((a, b) => b.leadCount - a.leadCount);

  // Quick actions data
  const quickActions = [
    {
      title: "Manage Formulas",
      description: "View and edit pricing calculators",
      icon: Calculator,
      href: "/formulas",
      color: "bg-blue-500",
      urgent: false
    },
    {
      title: "Customer Form",
      description: "View your live pricing form",
      icon: ExternalLink,
      href: "/services",
      color: "bg-indigo-500",
      urgent: false
    },
    {
      title: "Manage Calendar",
      description: "Set availability & bookings",
      icon: Calendar,
      href: "/calendar",
      color: "bg-purple-500",
      urgent: false
    },
    {
      title: "View Leads",
      description: `${totalLeads} leads to review`,
      icon: Users,
      href: "/leads",
      color: "bg-green-500",
      urgent: totalLeads > 0
    },
    {
      title: "Design Settings",
      description: "Customize form appearance",
      icon: Palette,
      href: "/design",
      color: "bg-orange-500",
      urgent: false
    }
  ];

  const isLoading = formulasLoading || leadsLoading || statsLoading || multiLeadsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-4 md:py-8 space-y-6">
        {/* Hero Section - Mobile Optimized */}
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Welcome back to PriceBuilder Pro
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            {businessSettings?.businessName ? `Managing ${businessSettings.businessName}` : "Build, customize, and manage your pricing calculators"}
          </p>
        </div>

        {/* Key Metrics - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <Card className="gradient-border">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Total Calculators</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{totalCalculators}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {activeCalculators} active
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{totalLeads}</p>
                  <p className="text-xs text-purple-600 flex items-center mt-1">
                    <Timer className="w-3 h-3 mr-1" />
                    {recentLeads.length} this week
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Avg Quote Value</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">${avgQuoteValue.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Growth trend
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-border">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{stats?.conversionRate || 0}%</p>
                  <p className="text-xs text-orange-600 flex items-center mt-1">
                    <Target className="w-3 h-3 mr-1" />
                    Performance
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Mobile First */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 group border-2 hover:border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">{action.title}</h3>
                            {action.urgent && (
                              <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                          <div className="flex items-center mt-2 text-blue-600 group-hover:text-blue-700">
                            <span className="text-xs font-medium">Go</span>
                            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Form Access - Prominent Section */}
        <Card className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold mb-2">Your Customer Pricing Form</h2>
                <p className="text-indigo-100 text-sm md:text-base mb-4 md:mb-0">
                  Let customers select services and get instant quotes. Share this link or embed it on your website.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link href="/services">
                  <Button variant="secondary" className="bg-white text-indigo-600 hover:bg-gray-100 w-full sm:w-auto">
                    <Eye className="w-4 h-4 mr-2" />
                    View Form
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-indigo-600 w-full sm:w-auto"
                  onClick={() => {
                    const url = `${window.location.origin}/services`;
                    navigator.clipboard.writeText(url);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Calculator Performance - Takes 2 columns on desktop */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg md:text-xl">Calculator Performance</CardTitle>
                <Link href="/formulas">
                  <Button variant="outline" size="sm">
                    View All
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : calculatorPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {calculatorPerformance.slice(0, 5).map((calculator, index) => (
                      <div key={calculator.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {index < 3 ? <Star className="w-4 h-4" /> : index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 truncate">{calculator.name}</h4>
                            <p className="text-xs text-gray-600">{calculator.leadCount} leads • ${calculator.revenue.toLocaleString()} revenue</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={calculator.leadCount > 0 ? Math.min((calculator.leadCount / Math.max(...calculatorPerformance.map(c => c.leadCount))) * 100, 100) : 0} 
                            className="w-16 md:w-24" 
                          />
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
                  <div className="text-center py-8">
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

          {/* Recent Activity Sidebar */}
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
                      <div key={index} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
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
                      <Button variant="outline" size="sm" className="w-full">
                        View All Leads
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
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

        {/* Mobile CTA Section */}
        <div className="md:hidden">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6 text-center">
              <h3 className="font-bold text-lg mb-2">Ready to grow your business?</h3>
              <p className="text-sm opacity-90 mb-4">Create your first calculator and start capturing leads</p>
              <Link href="/formulas">
                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  <Calculator className="w-4 h-4 mr-2" />
                  Manage Formulas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
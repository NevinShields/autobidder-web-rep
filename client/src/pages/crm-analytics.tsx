import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, TrendingUp, Users, DollarSign, Target, Clock } from "lucide-react";
import { Lead, MultiServiceLead } from "@shared/schema";

type PipelineData = Record<string, { count: number; totalValue: number }>;

interface ConversionData {
  totalLeads: number;
  activeLeads: number;
  completedLeads: number;
  lostLeads: number;
  conversionRate: number;
}

export default function CrmAnalytics() {
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery<PipelineData>({
    queryKey: ["/api/crm/analytics/pipeline"]
  });
  
  const { data: conversionData, isLoading: conversionLoading } = useQuery<ConversionData>({
    queryKey: ["/api/crm/analytics/conversions"]
  });
  
  const { data: regularLeads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"]
  });
  
  const { data: multiServiceLeads = [] } = useQuery<MultiServiceLead[]>({
    queryKey: ["/api/multi-service-leads"]
  });
  
  const allLeads = [...regularLeads, ...multiServiceLeads];
  
  const totalRevenue = allLeads
    .filter(lead => lead.stage === 'paid' || lead.stage === 'completed')
    .reduce((sum, lead) => {
      const price = "calculatedPrice" in lead ? lead.calculatedPrice : lead.totalPrice;
      return sum + price;
    }, 0);
  
  const averageDealSize = allLeads.length > 0
    ? allLeads.reduce((sum, lead) => {
        const price = "calculatedPrice" in lead ? lead.calculatedPrice : lead.totalPrice;
        return sum + price;
      }, 0) / allLeads.length
    : 0;
  
  if (pipelineLoading || conversionLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BarChart className="h-8 w-8" />
          CRM Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your sales performance and pipeline health
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card data-testid="metric-total-leads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {conversionData?.totalLeads || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {conversionData?.activeLeads || 0} active
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="metric-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {conversionData?.conversionRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {conversionData?.completedLeads || 0} won / {conversionData?.lostLeads || 0} lost
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="metric-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${(totalRevenue / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From completed/paid leads
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="metric-avg-deal-size">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ${(averageDealSize / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per lead
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Overview</CardTitle>
            <CardDescription>Leads and value by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineData && Object.entries(pipelineData).map(([stage, data]) => (
                <div key={stage} className="flex items-center justify-between" data-testid={`pipeline-stage-${stage}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {stage.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {data.count} lead{data.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      ${(data.totalValue / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              {(!pipelineData || Object.keys(pipelineData).length === 0) && (
                <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-8">
                  No pipeline data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest lead updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allLeads
                .filter(lead => lead.lastStageChange)
                .sort((a, b) => {
                  const dateA = a.lastStageChange ? new Date(a.lastStageChange).getTime() : 0;
                  const dateB = b.lastStageChange ? new Date(b.lastStageChange).getTime() : 0;
                  return dateB - dateA;
                })
                .slice(0, 5)
                .map((lead) => (
                  <div key={`${"calculatedPrice" in lead ? "lead" : "multi"}-${lead.id}`} className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                        Moved to {lead.stage.replace(/_/g, " ")}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {lead.lastStageChange && new Date(lead.lastStageChange).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              {allLeads.filter(lead => lead.lastStageChange).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-8">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: formulas, isLoading: formulasLoading } = useQuery({
    queryKey: ["/api/formulas"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/leads"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  if (formulasLoading || leadsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const recentActivity = (leads as any[])?.slice(0, 5).map((lead: any) => {
    const formula = (formulas as any[])?.find((f: any) => f.id === lead.formulaId);
    return {
      id: lead.id,
      type: "lead",
      message: "New lead captured",
      formula: formula?.name || "Unknown Formula",
      time: new Date(lead.createdAt).toLocaleDateString(),
    };
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Calculators</span>
                <span className="text-2xl font-bold text-gray-900">{(stats as any)?.totalCalculators || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Leads This Month</span>
                <span className="text-2xl font-bold text-success">{(stats as any)?.leadsThisMonth || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. Quote Value</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${(stats as any)?.avgQuoteValue ? (stats as any).avgQuoteValue.toLocaleString() : '0'}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="text-2xl font-bold text-accent">{(stats as any)?.conversionRate || '0.0'}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Formulas</CardTitle>
              </CardHeader>
              <CardContent>
                {(formulas as any[])?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No formulas created yet</p>
                    <Link href="/formula/new">
                      <Button>Create Your First Formula</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(formulas as any[])?.map((formula: any) => (
                      <div key={formula.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-gray-900">{formula.name}</h3>
                            <p className="text-sm text-gray-500">{formula.title}</p>
                            <div className="mt-2 text-xs text-gray-400">
                              {formula.variables.length} variables • Created {new Date().toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Link href={`/embed/${formula.embedId}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/formula/${formula.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity: any) => (
                      <div key={activity.id} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5"></div>
                        <div>
                          <p className="text-xs text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.formula}</p>
                          <p className="text-xs text-gray-400">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

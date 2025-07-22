import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import AppHeader from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Eye, Edit, Trash2, Check, X, ExternalLink, Copy, Code, Settings, Power, Calculator, User, DollarSign, TrendingUp, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: formulas, isLoading: formulasLoading } = useQuery({
    queryKey: ["/api/formulas"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/leads"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const renameFormulaMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const response = await apiRequest("PATCH", `/api/formulas/${id}`, { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulas"] });
      setEditingId(null);
      setEditingName("");
      toast({
        title: "Formula renamed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to rename formula",
        variant: "destructive",
      });
    },
  });

  const toggleDisplayMutation = useMutation({
    mutationFn: async ({ id, isDisplayed }: { id: number; isDisplayed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/formulas/${id}`, { isDisplayed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulas"] });
      toast({
        title: "Service visibility updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update service visibility",
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = (formula: any) => {
    setEditingId(formula.id);
    setEditingName(formula.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      renameFormulaMutation.mutate({ id: editingId, name: editingName.trim() });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleCopyEmbedCode = () => {
    const embedCode = `<iframe 
  src="${window.location.origin}/embed-form" 
  width="100%" 
  height="800" 
  frameborder="0" 
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
</iframe>`;
    
    navigator.clipboard.writeText(embedCode).then(() => {
      toast({
        title: "Embed code copied!",
        description: "You can now paste it into your website.",
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually.",
        variant: "destructive",
      });
    });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
                Welcome to PriceBuilder Pro
              </h1>
              <p className="mt-3 text-lg text-gray-600 max-w-2xl">
                Create dynamic pricing calculators, capture leads, and grow your business with intelligent automation
              </p>
            </div>
            <div className="mt-6 lg:mt-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/formula/new">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Calculator
                  </Button>
                </Link>
                <Link href="/design">
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3">
                    <Settings className="w-5 h-5 mr-2" />
                    Customize Design
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-blue-700">Total Calculators</span>
                  <div className="text-3xl font-bold text-blue-900 mt-1">{(stats as any)?.totalCalculators || 0}</div>
                </div>
                <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-green-700">Leads This Month</span>
                  <div className="text-3xl font-bold text-green-900 mt-1">{(stats as any)?.leadsThisMonth || 0}</div>
                </div>
                <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-purple-700">Avg. Quote Value</span>
                  <div className="text-3xl font-bold text-purple-900 mt-1">
                    ${(stats as any)?.avgQuoteValue ? (stats as any).avgQuoteValue.toLocaleString() : '0'}
                  </div>
                </div>
                <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-orange-700">Conversion Rate</span>
                  <div className="text-3xl font-bold text-orange-900 mt-1">{(stats as any)?.conversionRate || '0.0'}%</div>
                </div>
                <div className="h-12 w-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Embed Form Section */}
        <div className="mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-white to-purple-50 hover:shadow-xl transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-white">
                <Code className="w-5 h-5" />
                Embed Your Multi-Service Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Preview & Test</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    View how your form looks to customers and test the complete flow from service selection to quote submission.
                  </p>
                  <div className="space-y-3">
                    <Link href="/embed-form">
                      <Button className="w-full sm:w-auto" variant="outline">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Embed Form
                      </Button>
                    </Link>
                    <Link href="/form-settings">
                      <Button className="w-full sm:w-auto" variant="ghost" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Form Logic
                      </Button>
                    </Link>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Embed on Your Website</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Copy this code and paste it anywhere on your website to display your multi-service pricing form.
                  </p>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-md border">
                      <code className="text-xs text-gray-700 break-all">
                        {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed-form" width="100%" height="800" frameborder="0"></iframe>`}
                      </code>
                    </div>
                    <Button onClick={handleCopyEmbedCode} className="w-full sm:w-auto">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Embed Code
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulas */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
                <CardTitle className="text-gray-800">Your Formulas</CardTitle>
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
                      <div key={formula.id} className="group border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex-1 mr-4">
                            {editingId === formula.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={renameFormulaMutation.isPending || !editingName.trim()}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  disabled={renameFormulaMutation.isPending}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-medium text-gray-900">{formula.name}</h3>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleStartEdit(formula)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Power className={`w-4 h-4 ${formula.isDisplayed ? 'text-green-500' : 'text-gray-400'}`} />
                                    <Switch
                                      checked={formula.isDisplayed ?? true}
                                      onCheckedChange={(checked) => {
                                        toggleDisplayMutation.mutate({ id: formula.id, isDisplayed: checked });
                                      }}
                                      disabled={toggleDisplayMutation.isPending}
                                    />
                                    <Label className="text-xs text-gray-600">
                                      {formula.isDisplayed ? 'Visible' : 'Hidden'}
                                    </Label>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500">{formula.title}</p>
                                <div className="mt-2 text-xs text-gray-400">
                                  {formula.variables.length} variables • Created {new Date().toLocaleDateString()}
                                  {!formula.isDisplayed && <span className="text-orange-500 ml-2">• Hidden from customers</span>}
                                </div>
                              </>
                            )}
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
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
                <CardTitle className="text-gray-800">Recent Activity</CardTitle>
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

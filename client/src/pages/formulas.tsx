import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calculator, Plus, Edit, Trash2, ExternalLink, Copy, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AppHeader from "@/components/app-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import type { Formula } from "@shared/schema";

interface NewFormulaData {
  name: string;
  title: string;
}

export default function FormulasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFormula, setNewFormula] = useState<NewFormulaData>({
    name: "",
    title: ""
  });

  // Fetch formulas
  const { data: formulas = [], isLoading } = useQuery<Formula[]>({
    queryKey: ['/api/formulas'],
  });

  // Create formula mutation
  const createFormulaMutation = useMutation({
    mutationFn: (data: NewFormulaData) => apiRequest('POST', '/api/formulas', {
      ...data,
      variables: [],
      formula: "",
      embedId: `formula_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/formulas'] });
      setIsCreateDialogOpen(false);
      setNewFormula({ name: "", title: "" });
      toast({
        title: "Success",
        description: "Formula created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create formula",
        variant: "destructive",
      });
    },
  });

  // Delete formula mutation
  const deleteFormulaMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/formulas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/formulas'] });
      toast({
        title: "Success",
        description: "Formula deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete formula",
        variant: "destructive",
      });
    },
  });

  const handleCreateFormula = () => {
    if (!newFormula.name.trim()) {
      toast({
        title: "Error",
        description: "Formula name is required",
        variant: "destructive",
      });
      return;
    }
    createFormulaMutation.mutate(newFormula);
  };

  const copyEmbedUrl = (embedId: string) => {
    const url = `${window.location.origin}/embed/${embedId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Success",
      description: "Embed URL copied to clipboard",
    });
  };

  const getServiceIcon = (formula: Formula) => {
    // Use custom icon if provided
    if (formula.iconUrl) {
      // Check if it's an emoji
      if (formula.iconUrl.length <= 4 || /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(formula.iconUrl)) {
        return formula.iconUrl;
      }
      // It's a URL, return as image
      return (
        <img 
          src={formula.iconUrl} 
          alt={formula.name}
          className="w-6 h-6 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    
    // Default icons based on service name
    const name = formula.name.toLowerCase();
    if (name.includes('kitchen') || name.includes('remodel')) return '🏠';
    if (name.includes('wash') || name.includes('clean')) return '🧽';
    if (name.includes('paint')) return '🎨';
    if (name.includes('landscape') || name.includes('garden')) return '🌿';
    if (name.includes('roof')) return '🏘️';
    if (name.includes('plumb')) return '🔧';
    if (name.includes('electric')) return '⚡';
    if (name.includes('hvac') || name.includes('air')) return '❄️';
    return '⚙️';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pricing Formulas</h1>
            <p className="text-gray-600 mt-1">Create and manage your service calculators</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Formula
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Formula</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Formula Name</Label>
                  <Input
                    value={newFormula.name}
                    onChange={(e) => setNewFormula({ ...newFormula, name: e.target.value })}
                    placeholder="e.g., House Washing"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newFormula.title}
                    onChange={(e) => setNewFormula({ ...newFormula, title: e.target.value })}
                    placeholder="Brief description of the service"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateFormula}
                    disabled={createFormulaMutation.isPending}
                    className="flex-1"
                  >
                    {createFormulaMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Formulas Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : formulas.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Formulas Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first pricing calculator to get started
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Formula
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formulas.map((formula) => (
              <Card key={formula.id} className="group hover:shadow-lg transition-all duration-200 border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getServiceIcon(formula)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{formula.name}</CardTitle>
                        {formula.title && (
                          <p className="text-sm text-gray-600">{formula.title}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Variables:</span>
                      <Badge variant="secondary">
                        {formula.variables?.length || 0}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={formula.formula ? "default" : "outline"}>
                        {formula.formula ? "Complete" : "Draft"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link href={`/formula/${formula.id}`}>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyEmbedUrl(formula.embedId)}
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy URL
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/embed/${formula.embedId}`, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteFormulaMutation.mutate(formula.id)}
                        disabled={deleteFormulaMutation.isPending}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
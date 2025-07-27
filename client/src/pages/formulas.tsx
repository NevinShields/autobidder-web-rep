import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calculator, Plus, Edit, Trash2, ExternalLink, Copy, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AppHeader from "@/components/app-header";
import SingleServicePreviewModal from "@/components/single-service-preview-modal";

import { Link } from "wouter";
import type { Formula } from "@shared/schema";



export default function FormulasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);

  // Fetch formulas
  const { data: formulas = [], isLoading } = useQuery<Formula[]>({
    queryKey: ['/api/formulas'],
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



  const copyEmbedUrl = (embedId: string) => {
    const url = `${window.location.origin}/service-selector?formula=${embedId}`;
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
      if (formula.iconUrl.length <= 4 || /^[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u26FF]|[\u2700-\u27BF]/.test(formula.iconUrl)) {
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
        {/* Mobile-First Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Calculator Library</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Create and manage your service calculators</p>
          </div>
          
          <Link href="/formula-builder">
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Calculator
            </Button>
          </Link>
        </div>

        {/* Mobile-Optimized Formulas Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 sm:h-6 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : formulas.length === 0 ? (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 text-center py-12">
            <CardContent>
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Formulas Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first pricing calculator to get started
              </p>
              <Link href="/formula-builder">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Formula
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {formulas.map((formula) => (
              <Card key={formula.id} className="group border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-200 active:scale-95">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="text-xl sm:text-2xl flex-shrink-0">
                        {getServiceIcon(formula)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg truncate">{formula.name}</CardTitle>
                        {formula.title && (
                          <p className="text-sm text-gray-600 truncate">{formula.title}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Variables:</span>
                      <Badge variant="secondary" className="px-2 py-1">
                        {formula.variables?.length || 0}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={formula.formula ? "default" : "outline"} className="px-2 py-1">
                        {formula.formula ? "Complete" : "Draft"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Link href={`/formula/${formula.id}`}>
                        <Button size="sm" variant="outline" className="w-full">
                          <Edit className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </Link>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyEmbedUrl(formula.embedId)}
                        className="w-full"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Copy</span>
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedFormula(formula);
                          setShowPreviewModal(true);
                        }}
                        className="w-full"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Preview</span>
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteFormulaMutation.mutate(formula.id)}
                        disabled={deleteFormulaMutation.isPending}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Single Service Preview Modal */}
        {selectedFormula && (
          <SingleServicePreviewModal
            isOpen={showPreviewModal}
            onClose={() => {
              setShowPreviewModal(false);
              setSelectedFormula(null);
            }}
            formula={selectedFormula}
          />
        )}
      </div>
    </div>
  );
}
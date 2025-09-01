import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calculator, Plus, Edit, Trash2, ExternalLink, Copy, Settings, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SingleServicePreviewModal from "@/components/single-service-preview-modal";
import DashboardLayout from "@/components/dashboard-layout";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

import { Link } from "wouter";
import type { Formula } from "@shared/schema";



// Sortable Formula Card Component
function SortableFormulaCard({ formula, onPreview, onDelete, onCopyEmbed, onToggleActive, getServiceIcon }: {
  formula: Formula;
  onPreview: (formula: Formula) => void;
  onDelete: (id: number) => void;
  onCopyEmbed: (embedId: string) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  getServiceIcon: (formula: Formula) => any;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: formula.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-200 ${
        isDragging ? 'z-50' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded flex-shrink-0"
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-xl sm:text-2xl flex-shrink-0">
              {getServiceIcon(formula)}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg truncate flex items-center gap-2">
                {formula.name}
                {!formula.isActive && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    Hidden
                  </Badge>
                )}
              </CardTitle>
              {formula.title && (
                <p className="text-sm text-gray-600 truncate">{formula.title}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className={formula.isActive ? "text-green-600" : "text-gray-500"}>
                {formula.isActive ? "Live" : "Hidden"}
              </span>
              <Switch
                checked={formula.isActive}
                onCheckedChange={(checked) => onToggleActive(formula.id, checked)}
                data-testid={`toggle-formula-${formula.id}`}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Variables:</span>
            <Badge variant="secondary" className="px-2 py-1">
              {formula.variables.length}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview(formula)}
              className="flex-1 min-w-0"
            >
              <ExternalLink className="w-3 h-3 mr-1.5 flex-shrink-0" />
              <span className="truncate">Preview</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopyEmbed(formula.embedId)}
              className="flex-1 min-w-0"
            >
              <Copy className="w-3 h-3 mr-1.5 flex-shrink-0" />
              <span className="truncate">Copy Link</span>
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href={`/formula-builder/${formula.id}`} className="flex-1">
              <Button variant="default" size="sm" className="w-full">
                <Edit className="w-3 h-3 mr-1.5" />
                Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(formula.id)}
              className="flex-1"
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FormulasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [localFormulas, setLocalFormulas] = useState<Formula[]>([]);

  // Fetch formulas
  const { data: formulas = [], isLoading } = useQuery<Formula[]>({
    queryKey: ['/api/formulas'],
  });

  // Update local state when formulas change from server
  useEffect(() => {
    if (formulas.length > 0) {
      setLocalFormulas(formulas);
    }
  }, [formulas]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reorder formulas mutation
  const reorderFormulasMutation = useMutation({
    mutationFn: (reorderedFormulas: Formula[]) => 
      apiRequest('POST', '/api/formulas/reorder', { formulas: reorderedFormulas }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/formulas'] });
      toast({
        title: "Success",
        description: "Formulas reordered successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder formulas",
        variant: "destructive",
      });
      // Reset local state on error
      setLocalFormulas(formulas);
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

  // Toggle formula active status mutation
  const toggleFormulaMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      apiRequest('PUT', `/api/formulas/${id}`, { isActive }),
    onMutate: async ({ id, isActive }) => {
      // Optimistically update local state
      setLocalFormulas(prev => 
        prev.map(formula => 
          formula.id === id 
            ? { ...formula, isActive }
            : formula
        )
      );
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/formulas'] });
      toast({
        title: "Success",
        description: `Formula ${isActive ? 'enabled' : 'hidden'} successfully`,
      });
    },
    onError: (_, { id }) => {
      // Revert optimistic update on error
      setLocalFormulas(prev => 
        prev.map(formula => 
          formula.id === id 
            ? { ...formula, isActive: !formula.isActive }
            : formula
        )
      );
      toast({
        title: "Error",
        description: "Failed to update formula status",
        variant: "destructive",
      });
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localFormulas.findIndex((item) => item.id === active.id);
      const newIndex = localFormulas.findIndex((item) => item.id === over.id);

      const reorderedFormulas = arrayMove(localFormulas, oldIndex, newIndex);
      setLocalFormulas(reorderedFormulas);
      reorderFormulasMutation.mutate(reorderedFormulas);
    }
  }



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
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Mobile-First Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Calculator Library</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Create and manage your service calculators</p>
          </div>
          
          <Link href="/formula-builder/new">
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
        ) : localFormulas.length === 0 ? (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 text-center py-12">
            <CardContent>
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Formulas Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first pricing calculator to get started
              </p>
              <Link href="/formula-builder/new">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Formula
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localFormulas.map(f => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {localFormulas.map((formula) => (
                  <SortableFormulaCard
                    key={formula.id}
                    formula={formula}
                    onPreview={(formula) => {
                      setSelectedFormula(formula);
                      setShowPreviewModal(true);
                    }}
                    onDelete={(id) => deleteFormulaMutation.mutate(id)}
                    onCopyEmbed={copyEmbedUrl}
                    onToggleActive={(id, isActive) => toggleFormulaMutation.mutate({ id, isActive })}
                    getServiceIcon={getServiceIcon}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
    </DashboardLayout>
  );
}
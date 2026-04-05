import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calculator, Plus, Edit, Trash2, ExternalLink, Copy, Settings, GripVertical, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SingleServicePreviewModal from "@/components/single-service-preview-modal";
import DashboardLayout from "@/components/dashboard-layout";
import IconSelector from "@/components/icon-selector";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

import { Link } from "wouter";
import type { Formula } from "@shared/schema";



// Sortable Formula Card Component
function SortableFormulaCard({ formula, onPreview, onDelete, onCopyEmbed, onToggleActive, getServiceIcon, onUpdateIcon, onUploadIcon, onApplyIconGroupToAllServices, isIconSaving, isIconUploading, isApplyingIconGroupToAllServices }: {
  formula: Formula;
  onPreview: (formula: Formula) => void;
  onDelete: (formula: Formula) => void;
  onCopyEmbed: (embedId: string) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  getServiceIcon: (formula: Formula) => any;
  onUpdateIcon: (id: number, iconId: number | null, iconUrl: string | null) => void;
  onUploadIcon: (id: number, file: File) => void;
  onApplyIconGroupToAllServices: (groupId: number) => void;
  isIconSaving: boolean;
  isIconUploading: boolean;
  isApplyingIconGroupToAllServices: boolean;
}) {
  const [showIconOptions, setShowIconOptions] = useState(false);
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
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'default',
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group rounded-2xl border border-slate-300 dark:border-slate-700/70 bg-white dark:bg-slate-900/70 shadow-md shadow-slate-200/60 dark:shadow-none backdrop-blur hover:shadow-lg hover:shadow-slate-200/70 dark:hover:shadow-none transition-shadow duration-200 ${
        isDragging ? 'ring-2 ring-amber-300 dark:ring-amber-500/50 shadow-2xl scale-105' : ''
      }`}
      data-testid={`formula-card-${formula.id}`}
    >
      <CardHeader className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex-shrink-0"
              >
                <GripVertical className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
              <button
                type="button"
                className="text-xl sm:text-2xl flex-shrink-0 w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                onClick={() => setShowIconOptions((prev) => !prev)}
                data-testid={`button-icon-options-${formula.id}`}
              >
                {getServiceIcon(formula)}
              </button>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg leading-tight text-slate-900 dark:text-slate-100">
                  {formula.name}
                </CardTitle>
                {formula.title && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{formula.title}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!formula.isActive && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  Hidden
                </Badge>
              )}
              <span className={`text-xs font-medium ${formula.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                {formula.isActive ? "Live" : "Hidden"}
              </span>
            </div>
            <Switch
              checked={formula.isActive}
              onCheckedChange={(checked) => onToggleActive(formula.id, checked)}
              data-testid={`toggle-formula-${formula.id}`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Variables:</span>
            <Badge variant="secondary" className="px-2 py-1">
              {formula.variables.length}
            </Badge>
          </div>

          {showIconOptions && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 p-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Service Icon
              </span>
              {(isIconSaving || isIconUploading) && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {isIconUploading ? "Uploading" : "Saving"}
                </span>
              )}
            </div>
            <div className="mt-1">
              <IconSelector
                selectedIconId={formula.iconId || undefined}
                onIconSelect={(iconId, iconUrl) => onUpdateIcon(formula.id, iconId, iconUrl)}
                showApplyGroupToAllServices
                onApplyGroupToAllServices={onApplyIconGroupToAllServices}
                isApplyingGroupToAllServices={isApplyingIconGroupToAllServices}
                triggerText="Library"
                size="sm"
                triggerVariant="outline"
                triggerClassName="w-full h-8 text-xs font-medium"
              />
            </div>
            <label className="inline-flex w-full items-center justify-center gap-1.5 h-8 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Upload Icon
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  onUploadIcon(formula.id, file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          )}

          
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href={`/formula-builder/${formula.id}`} className="flex-1">
              <Button variant="default" size="sm" className="w-full">
                <Edit className="w-3 h-3 mr-1.5" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(formula)}
              className="flex-1 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
  const [activeId, setActiveId] = useState<number | null>(null);
  const [formulaToDelete, setFormulaToDelete] = useState<Formula | null>(null);

  // Fetch formulas
  const { data: formulas = [], isLoading } = useQuery<Formula[]>({
    queryKey: ['/api/formulas'],
  });

  // Drag and drop sensors with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
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
      // Query will be refetched automatically
    },
  });

  // Delete formula mutation with optimistic update
  const deleteFormulaMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/formulas/${id}`),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/formulas'] });

      // Snapshot the previous value
      const previousFormulas = queryClient.getQueryData(['/api/formulas']);

      // Optimistically remove the formula from the list
      queryClient.setQueryData(['/api/formulas'], (old: Formula[] | undefined) => {
        if (!old) return [];
        return old.filter(formula => formula.id !== id);
      });

      return { previousFormulas };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Formula deleted successfully",
      });
    },
    onError: (err, id, context) => {
      // Restore the previous state on error
      queryClient.setQueryData(['/api/formulas'], context?.previousFormulas);
      toast({
        title: "Error",
        description: "Failed to delete formula",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: ['/api/formulas'] });
    },
  });

  // Toggle formula active status mutation
  const toggleFormulaMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      apiRequest('PATCH', `/api/formulas/${id}`, { isActive }),
    onMutate: async ({ id, isActive }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['/api/formulas'] });
      
      // Snapshot the previous value
      const previousFormulas = queryClient.getQueryData(['/api/formulas']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['/api/formulas'], (old: Formula[] | undefined) => {
        if (!old) return [];
        return old.map(formula => 
          formula.id === id 
            ? { ...formula, isActive }
            : formula
        );
      });
      
      // Return a context object with the snapshotted value
      return { previousFormulas };
    },
    onSuccess: (_, { isActive }) => {
      toast({
        title: "Success",
        description: `Formula ${isActive ? 'enabled' : 'hidden'} successfully`,
      });
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['/api/formulas'], context?.previousFormulas);
      toast({
        title: "Error",
        description: "Failed to update formula status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have up-to-date data
      queryClient.invalidateQueries({ queryKey: ['/api/formulas'] });
    },
  });

  const [savingIconFormulaId, setSavingIconFormulaId] = useState<number | null>(null);
  const [uploadingIconFormulaId, setUploadingIconFormulaId] = useState<number | null>(null);
  const updateFormulaIconMutation = useMutation({
    mutationFn: ({ id, iconId, iconUrl }: { id: number; iconId: number | null; iconUrl: string | null }) =>
      apiRequest('PATCH', `/api/formulas/${id}`, { iconId, iconUrl }),
    onMutate: async ({ id, iconId, iconUrl }) => {
      setSavingIconFormulaId(id);
      await queryClient.cancelQueries({ queryKey: ['/api/formulas'] });
      const previousFormulas = queryClient.getQueryData(['/api/formulas']);
      queryClient.setQueryData(['/api/formulas'], (old: Formula[] | undefined) => {
        if (!old) return [];
        return old.map((formula) =>
          formula.id === id
            ? { ...formula, iconId, iconUrl: iconUrl || null }
            : formula
        );
      });
      return { previousFormulas };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(['/api/formulas'], context?.previousFormulas);
      toast({
        title: "Save failed",
        description: "Could not update service icon.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSavingIconFormulaId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/formulas'] });
    },
  });

  const applyIconGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await apiRequest('POST', '/api/formulas/apply-icon-group', { groupId });
      return response.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/formulas'] });
      toast({
        title: "Icon group applied",
        description: `Updated ${result.updatedCount || 0} services${result.skippedCount ? `, skipped ${result.skippedCount}` : ''}.`,
      });
    },
    onError: () => {
      toast({
        title: "Apply failed",
        description: "Could not update service icons from the selected group.",
        variant: "destructive",
      });
    },
  });

  const handleUploadFormulaIcon = async (id: number, file: File) => {
    setUploadingIconFormulaId(id);
    try {
      const formData = new FormData();
      formData.append("icon", file);

      const response = await fetch("/api/upload/icon", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload?.iconUrl) {
        throw new Error(payload?.message || "Failed to upload icon");
      }

      updateFormulaIconMutation.mutate({ id, iconId: null, iconUrl: payload.iconUrl });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.message || "Could not upload icon.",
        variant: "destructive",
      });
    } finally {
      setUploadingIconFormulaId(null);
    }
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as number);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = formulas.findIndex((item) => item.id === active.id);
      const newIndex = formulas.findIndex((item) => item.id === over.id);

      const reorderedFormulas = arrayMove(formulas, oldIndex, newIndex);
      
      // Optimistic update
      queryClient.setQueryData(['/api/formulas'], reorderedFormulas);
      
      reorderFormulasMutation.mutate(reorderedFormulas);
    }
  }

  function handleDragCancel() {
    setActiveId(null);
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
      <style>{`
        .formulas-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.028'/%3E%3C/svg%3E");
        }
      `}</style>
      <div className="p-4 sm:p-6 lg:p-8 formulas-grain" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/40 dark:border-amber-500/10 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-200/30 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-orange-200/20 to-transparent dark:from-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/80 dark:bg-white/5 border border-white/80 dark:border-white/10 rounded-xl backdrop-blur-sm">
                  <Calculator className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                </div>
                <h1 className="text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Calculator Library
                </h1>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1">
                Create and manage your service calculators
              </p>
            </div>
            
            <Link href="/formula-builder/new">
              <Button className="h-10 rounded-full px-5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white w-full sm:w-auto shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                New Calculator
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile-Optimized Formulas Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse rounded-2xl border border-slate-300 dark:border-slate-700/70 bg-white dark:bg-slate-900/70 shadow-md shadow-slate-200/60 dark:shadow-none">
                <CardHeader>
                  <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : formulas.length === 0 ? (
          <Card className="rounded-2xl border border-slate-300 dark:border-slate-700/70 bg-white dark:bg-slate-900/70 shadow-md shadow-slate-200/60 dark:shadow-none backdrop-blur text-center py-12">
            <CardContent>
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Formulas Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first pricing calculator to get started
              </p>
              <Link href="/formula-builder/new">
                <Button className="h-10 rounded-full px-5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white">
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
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={formulas.map(f => f.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {formulas.map((formula) => (
                  <SortableFormulaCard
                    key={formula.id}
                    formula={formula}
                    onPreview={(formula) => {
                      setSelectedFormula(formula);
                      setShowPreviewModal(true);
                    }}
                    onDelete={(formula) => setFormulaToDelete(formula)}
                    onCopyEmbed={copyEmbedUrl}
                    onToggleActive={(id, isActive) => toggleFormulaMutation.mutate({ id, isActive })}
                    getServiceIcon={getServiceIcon}
                    onUpdateIcon={(id, iconId, iconUrl) => updateFormulaIconMutation.mutate({ id, iconId, iconUrl })}
                    onUploadIcon={handleUploadFormulaIcon}
                    onApplyIconGroupToAllServices={(groupId) => applyIconGroupMutation.mutate(groupId)}
                    isIconSaving={savingIconFormulaId === formula.id}
                    isIconUploading={uploadingIconFormulaId === formula.id}
                    isApplyingIconGroupToAllServices={applyIconGroupMutation.isPending}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: '0.5',
                    },
                  },
                }),
              }}
            >
              {activeId ? (
                <Card className="rounded-2xl border border-slate-300 dark:border-slate-700/70 bg-white dark:bg-slate-900/80 shadow-2xl shadow-slate-300/60 dark:shadow-none rotate-3 scale-105 opacity-90 backdrop-blur">
                  <CardHeader className="pb-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-1 flex-shrink-0">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="text-xl sm:text-2xl flex-shrink-0">
                            {getServiceIcon(formulas.find(f => f.id === activeId)!)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base sm:text-lg leading-tight">
                              {formulas.find(f => f.id === activeId)?.name}
                            </CardTitle>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ) : null}
            </DragOverlay>
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

        <AlertDialog
          open={!!formulaToDelete}
          onOpenChange={(open) => {
            if (!open) setFormulaToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this formula?</AlertDialogTitle>
              <AlertDialogDescription>
                {formulaToDelete
                  ? `This will permanently delete "${formulaToDelete.name}" and cannot be undone.`
                  : "This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteFormulaMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!formulaToDelete) return;
                  deleteFormulaMutation.mutate(formulaToDelete.id);
                  setFormulaToDelete(null);
                }}
                disabled={deleteFormulaMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteFormulaMutation.isPending ? "Deleting..." : "Delete Formula"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>
    </DashboardLayout>
  );
}

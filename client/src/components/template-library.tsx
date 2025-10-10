import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Users, Clock, Sparkles, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormulaTemplate } from "@shared/schema";

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateLibrary({ isOpen, onClose }: TemplateLibraryProps) {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<FormulaTemplate[]>({
    queryKey: ["/api/formula-templates"],
    enabled: isOpen,
  });

  // Fetch template categories
  const { data: templateCategories = [] } = useQuery<Array<{ id: number; name: string; isActive: boolean }>>({
    queryKey: ['/api/template-categories'],
    enabled: isOpen,
  });

  const useTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await apiRequest("POST", `/api/formula-templates/${templateId}/use`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Template applied successfully!",
        description: "Your new formula has been created from the template.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/formulas"] });
      onClose();
      setLocation(`/formula-builder/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to use template",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Filter templates based on search and category
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get categories from API (active categories only)
  const categories = [
    { id: 0, name: "all" },
    ...templateCategories.filter(c => c.isActive)
  ];

  const handleUseTemplate = (templateId: number) => {
    useTemplateMutation.mutate(templateId);
  };

  const handleImageError = (templateId: number) => {
    setImageErrors(prev => new Set(prev).add(templateId));
  };

  const formatTimesUsed = (count: number) => {
    if (count === 0) return "Never used";
    if (count === 1) return "Used once";
    return `Used ${count} times`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cleaning':
        return '🧽';
      case 'construction':
        return '🏗️';
      case 'landscaping':
        return '🌿';
      case 'automotive':
        return '🚗';
      case 'services':
        return '⚙️';
      case 'uncategorized':
        return '📦';
      default:
        return '📋';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] sm:h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-4 sm:px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Formula Template Library
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-gray-50 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name === "all" ? "All Categories" : category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4 sm:px-6 py-4 sm:py-6">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-20 w-full mb-4" />
                        <Skeleton className="h-8 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                  <p className="text-gray-500 text-sm sm:text-base px-4">
                    {searchTerm || selectedCategory !== "all" 
                      ? "Try adjusting your search or filter criteria." 
                      : "No templates available at the moment."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredTemplates.map((template: FormulaTemplate) => (
                    <Card key={template.id} className="group hover:shadow-lg transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                              {template.iconUrl && !imageErrors.has(template.id) ? (
                                <img 
                                  src={template.iconUrl} 
                                  alt={`${template.name} icon`}
                                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                                  loading="lazy"
                                  decoding="async"
                                  onError={() => handleImageError(template.id)}
                                  data-testid={`img-template-icon-${template.id}`}
                                />
                              ) : (
                                <span className="text-xl sm:text-2xl" aria-hidden="true" data-testid={`icon-category-${template.id}`}>
                                  {getCategoryIcon(template.category)}
                                </span>
                              )}
                              <span className="line-clamp-2">{template.name}</span>
                            </CardTitle>
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3">
                          {template.description || "No description available"}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="hidden sm:inline">{formatTimesUsed(template.timesUsed)}</span>
                            <span className="sm:hidden">{template.timesUsed} uses</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {template.variables.length} vars
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button 
                            onClick={() => handleUseTemplate(template.id)}
                            disabled={useTemplateMutation.isPending}
                            className="w-full"
                            size="sm"
                          >
                            {useTemplateMutation.isPending ? (
                              "Creating..."
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Use This Template</span>
                                <span className="sm:hidden">Use Template</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Template library trigger button component
export function TemplateLibraryButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <BookOpen className="h-4 w-4" />
        Browse Templates
      </Button>
      <TemplateLibrary isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
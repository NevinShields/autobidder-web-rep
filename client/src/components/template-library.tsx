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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/formula-templates"],
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
  const filteredTemplates = templates.filter((template: FormulaTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(templates.map((t: FormulaTemplate) => t.category)))];

  const handleUseTemplate = (templateId: number) => {
    useTemplateMutation.mutate(templateId);
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
      default:
        return '📋';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Formula Template Library
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex gap-4 items-center">
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
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : `${getCategoryIcon(category)} ${category}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="py-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedCategory !== "all" 
                    ? "Try adjusting your search or filter criteria." 
                    : "No templates available at the moment."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template: FormulaTemplate) => (
                  <Card key={template.id} className="group hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                            {template.name}
                          </CardTitle>
                          <Badge variant="secondary" className="mt-2">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {template.description || "No description available"}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatTimesUsed(template.timesUsed)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.variables.length} variables
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
                              Use This Template
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
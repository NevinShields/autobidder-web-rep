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
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] sm:h-[85vh] overflow-hidden rounded-[28px] border border-amber-200/40 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-0 flex flex-col shadow-[0_30px_100px_rgba(15,23,42,0.16)]">
        <DialogHeader className="relative shrink-0 overflow-hidden border-b border-amber-200/40 px-4 py-5 sm:px-6 sm:py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.22),transparent_35%),radial-gradient(circle_at_left,rgba(249,115,22,0.10),transparent_30%)]" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle
                className="flex items-center gap-3 text-slate-900"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-amber-600 shadow-sm ring-1 ring-white/70 backdrop-blur">
                  <BookOpen className="h-5 w-5" />
                </span>
                <span className="text-2xl sm:text-3xl leading-none">Formula Template Library</span>
              </DialogTitle>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-[15px]">
                Start from proven pricing setups and tailor the logic to your business instead of building every formula from scratch.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200/70 bg-white/80 px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {isLoading ? "Loading templates..." : `${filteredTemplates.length} template${filteredTemplates.length !== 1 ? "s" : ""}`}
            </div>
          </div>
        </DialogHeader>

        <div className="shrink-0 border-b border-amber-200/40 bg-white/70 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500/80" />
              <Input
                placeholder="Search templates, industries, or use cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-2xl border-amber-200/70 bg-white/90 pl-10 text-sm shadow-sm focus-visible:ring-amber-300"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-11 w-full rounded-2xl border-amber-200/70 bg-white/90 text-sm shadow-sm sm:w-56">
                <Filter className="mr-2 h-4 w-4 text-amber-500/80" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-amber-200/70">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name === "all" ? "All Categories" : category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border-0 bg-amber-100/80 px-3 py-1 text-[11px] text-amber-800">
              <Sparkles className="mr-1 h-3 w-3" />
              Ready to customize
            </Badge>
            <Badge className="rounded-full border-0 bg-slate-100 px-3 py-1 text-[11px] text-slate-600">
              Built for service businesses
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(248,250,252,0.9))]">
          <ScrollArea className="h-full">
            <div className="px-4 py-4 sm:px-6 sm:py-6">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="overflow-hidden rounded-3xl border border-amber-100/70 bg-white/90 shadow-sm">
                      <CardHeader className="space-y-3 pb-4">
                        <Skeleton className="h-5 w-3/4 rounded-full" />
                        <Skeleton className="h-4 w-24 rounded-full" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="mb-4 h-20 w-full rounded-2xl" />
                        <Skeleton className="h-10 w-full rounded-2xl" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="py-12 sm:py-16">
                  <div className="mx-auto max-w-md rounded-[28px] border border-dashed border-amber-200 bg-white/80 px-6 py-10 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <BookOpen className="h-7 w-7" />
                    </div>
                    <h3
                      className="text-2xl text-slate-900"
                      style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                    >
                      No templates found
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-slate-500">
                      {searchTerm || selectedCategory !== "all"
                        ? "Try adjusting your search or category filter."
                        : "No templates are available right now."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                  {filteredTemplates.map((template: FormulaTemplate) => (
                    <Card
                      key={template.id}
                      className="group overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_24px_60px_rgba(251,146,60,0.14)]"
                    >
                      <CardHeader className="relative pb-4">
                        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-amber-100/70 via-orange-50 to-transparent" />
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm">
                              {template.iconUrl && !imageErrors.has(template.id) ? (
                                <img
                                  src={template.iconUrl}
                                  alt={`${template.name} icon`}
                                  className="h-7 w-7 object-contain sm:h-8 sm:w-8"
                                  loading="lazy"
                                  decoding="async"
                                  onError={() => handleImageError(template.id)}
                                  data-testid={`img-template-icon-${template.id}`}
                                />
                              ) : (
                                <span className="text-2xl" aria-hidden="true" data-testid={`icon-category-${template.id}`}>
                                  {getCategoryIcon(template.category)}
                                </span>
                              )}
                            </div>
                            <CardTitle
                              className="line-clamp-2 text-lg text-slate-900 transition-colors group-hover:text-amber-700"
                              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                            >
                              {template.name}
                            </CardTitle>
                            <Badge className="mt-2 rounded-full border-0 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="mb-4 line-clamp-3 text-sm leading-6 text-slate-600">
                          {template.description || "No description available"}
                        </p>

                        <div className="mb-5 flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700">
                            <Users className="h-3.5 w-3.5" />
                            {template.timesUsed === 0 ? "New" : formatTimesUsed(template.timesUsed)}
                          </div>
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-600">
                            <Clock className="h-3.5 w-3.5" />
                            {template.variables.length} vars
                          </div>
                        </div>

                        <Button
                          onClick={() => handleUseTemplate(template.id)}
                          disabled={useTemplateMutation.isPending}
                          className="h-11 w-full rounded-2xl border-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-700"
                          size="sm"
                        >
                          {useTemplateMutation.isPending ? (
                            "Creating..."
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              <span className="hidden sm:inline">Use This Template</span>
                              <span className="sm:hidden">Use Template</span>
                            </>
                          )}
                        </Button>
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
        className="flex items-center gap-2 rounded-full border-amber-200/70 bg-white/80 px-4 text-slate-700 shadow-sm hover:border-amber-300 hover:bg-amber-50/80 hover:text-amber-700"
      >
        <BookOpen className="h-4 w-4" />
        Browse Templates
      </Button>
      <TemplateLibrary isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

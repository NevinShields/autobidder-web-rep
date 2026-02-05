import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Save,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  Globe,
  CheckCircle,
  XCircle,
  FileText,
  Image as ImageIcon,
  Layout,
  Search,
  Target,
  Briefcase,
  PenTool,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BlogPost, BlogContentSection, Formula, WorkOrder, BlogLayoutTemplate } from "@shared/schema";

const BLOG_TYPES = [
  { value: "job_showcase", label: "Job Showcase", description: "Showcase a completed project with before/after details", icon: Briefcase },
  { value: "expert_opinion", label: "Expert Opinion", description: "Share your expertise on industry topics", icon: PenTool },
  { value: "seasonal_tip", label: "Seasonal Tip", description: "Seasonal maintenance tips for homeowners", icon: FileText },
  { value: "faq_educational", label: "FAQ/Educational", description: "Answer common customer questions", icon: Search }
];

const GOALS = [
  { value: "rank_seo", label: "Rank in Local Search", description: "Focus on local SEO keywords" },
  { value: "educate", label: "Educate Customers", description: "Provide valuable information" },
  { value: "convert", label: "Convert Leads", description: "Strong calls to action" }
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "technical", label: "Technical" }
];

const WIZARD_STEPS = [
  { id: "type", label: "Type", icon: FileText },
  { id: "targeting", label: "Targeting", icon: Target },
  { id: "source", label: "Content", icon: Briefcase },
  { id: "layout", label: "Layout", icon: Layout },
  { id: "editor", label: "Editor", icon: PenTool },
  { id: "seo", label: "SEO Review", icon: Search },
  { id: "publish", label: "Publish", icon: Globe }
];

export default function BlogPostEditorPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = id && id !== "new";

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [blogType, setBlogType] = useState<string>("");
  const [primaryServiceId, setPrimaryServiceId] = useState<number | null>(null);
  const [targetCity, setTargetCity] = useState("");
  const [targetNeighborhood, setTargetNeighborhood] = useState("");
  const [goal, setGoal] = useState("rank_seo");
  const [tonePreference, setTonePreference] = useState("professional");
  const [workOrderId, setWorkOrderId] = useState<number | null>(null);
  const [jobNotes, setJobNotes] = useState("");
  const [talkingPoints, setTalkingPoints] = useState<string[]>([""]);
  const [layoutTemplateId, setLayoutTemplateId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Generated content state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState<BlogContentSection[]>([]);
  const [seoScore, setSeoScore] = useState<number | null>(null);
  const [seoChecklist, setSeoChecklist] = useState<Array<{ id: string; label: string; isPassed: boolean }>>([]);
  const [lockedSections, setLockedSections] = useState<Set<string>>(new Set());

  // Publishing state
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch existing post if editing
  const { data: existingPost, isLoading: isLoadingPost } = useQuery<BlogPost & { sectionLocks: any[] }>({
    queryKey: ["/api/blog-posts", id],
    enabled: !!isEditing,
  });

  // Fetch services/formulas
  const { data: formulas = [] } = useQuery<Formula[]>({
    queryKey: ["/api/formulas"],
  });

  // Fetch work orders
  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/blog-posts/sources/work-orders"],
  });

  // Fetch layout templates
  const { data: layoutTemplates = [] } = useQuery<BlogLayoutTemplate[]>({
    queryKey: ["/api/blog-layout-templates"],
  });

  // Load existing post data
  useEffect(() => {
    if (existingPost) {
      setBlogType(existingPost.blogType);
      setPrimaryServiceId(existingPost.primaryServiceId);
      setTargetCity(existingPost.targetCity || "");
      setTargetNeighborhood(existingPost.targetNeighborhood || "");
      setGoal(existingPost.goal || "rank_seo");
      setTonePreference(existingPost.tonePreference || "professional");
      setWorkOrderId(existingPost.workOrderId);
      setJobNotes(existingPost.jobNotes || "");
      setTalkingPoints(existingPost.talkingPoints as string[] || [""]);
      setLayoutTemplateId(existingPost.layoutTemplateId);
      setTitle(existingPost.title);
      setSlug(existingPost.slug);
      setMetaTitle(existingPost.metaTitle || "");
      setMetaDescription(existingPost.metaDescription || "");
      setExcerpt(existingPost.excerpt || "");
      setContent(existingPost.content as BlogContentSection[]);
      setSeoScore(existingPost.seoScore);
      setSeoChecklist(existingPost.seoChecklist as any[] || []);
      setCategory(existingPost.category || "");
      setTags(existingPost.tags as string[] || []);
      setFeaturedImageUrl(existingPost.featuredImageUrl || "");
      setLockedSections(new Set(existingPost.sectionLocks?.map((l: any) => l.sectionId) || []));
      // Skip to editor step if editing
      setCurrentStep(4);
    }
  }, [existingPost]);

  // Generate content mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const serviceName = formulas.find(f => f.id === primaryServiceId)?.name || "service";
      const selectedWorkOrder = workOrders.find(w => w.id === workOrderId);

      const input = {
        blogType,
        serviceName,
        serviceDescription: formulas.find(f => f.id === primaryServiceId)?.description,
        targetCity,
        targetNeighborhood: targetNeighborhood || undefined,
        goal,
        tonePreference,
        talkingPoints: talkingPoints.filter(p => p.trim()),
        layoutTemplate: selectedTemplate?.sections || [],
        jobData: selectedWorkOrder ? {
          title: selectedWorkOrder.title,
          customerAddress: selectedWorkOrder.customerAddress || "",
          completedDate: selectedWorkOrder.completedDate ? format(new Date(selectedWorkOrder.completedDate), "MMMM d, yyyy") : "",
          notes: selectedWorkOrder.instructions || jobNotes,
          images: []
        } : undefined
      };

      return await apiRequest("POST", "/api/blog-posts/generate-content", input);
    },
    onSuccess: (data: any) => {
      setTitle(data.title);
      setSlug(data.suggestedSlug);
      setMetaTitle(data.metaTitle);
      setMetaDescription(data.metaDescription);
      setExcerpt(data.excerpt);
      setContent(data.content);
      setSeoScore(data.seoScore);
      setSeoChecklist(data.seoChecklist || []);
      setCurrentStep(4); // Move to editor step
      toast({
        title: "Content Generated",
        description: "Your blog content has been generated. Review and edit as needed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    }
  });

  // Save post mutation
  const saveMutation = useMutation({
    mutationFn: async (publish: boolean = false) => {
      const data = {
        blogType,
        primaryServiceId,
        targetCity,
        targetNeighborhood: targetNeighborhood || null,
        goal,
        tonePreference,
        workOrderId,
        jobNotes,
        talkingPoints: talkingPoints.filter(p => p.trim()),
        layoutTemplateId,
        title,
        slug,
        metaTitle,
        metaDescription,
        excerpt,
        content,
        seoScore,
        seoChecklist,
        category: category || null,
        tags,
        featuredImageUrl: featuredImageUrl || null,
        status: publish ? "published" : "draft"
      };

      if (isEditing) {
        return await apiRequest("PATCH", `/api/blog-posts/${id}`, data);
      } else {
        return await apiRequest("POST", "/api/blog-posts", data);
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({
        title: "Saved",
        description: "Blog post saved successfully.",
      });
      if (!isEditing) {
        navigate(`/blog-posts/${data.id}/edit`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save blog post",
        variant: "destructive",
      });
    }
  });

  // Regenerate section mutation
  const regenerateSectionMutation = useMutation({
    mutationFn: async (sectionType: string) => {
      const response = await apiRequest("POST", `/api/blog-posts/${id}/regenerate-section`, {
        sectionType
      });
      return await response.json() as BlogContentSection;
    },
    onSuccess: (newSection: BlogContentSection, variables) => {
      setContent(prev => prev.map(s =>
        s.type === variables ? newSection : s
      ));
      toast({
        title: "Section Regenerated",
        description: "The section has been regenerated with new content.",
      });
    },
    onError: () => {
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate section",
        variant: "destructive",
      });
    }
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate();
  };

  const handleSave = (publish: boolean = false) => {
    saveMutation.mutate(publish);
  };

  const handleTalkingPointChange = (index: number, value: string) => {
    const newPoints = [...talkingPoints];
    newPoints[index] = value;
    setTalkingPoints(newPoints);
  };

  const addTalkingPoint = () => {
    setTalkingPoints([...talkingPoints, ""]);
  };

  const removeTalkingPoint = (index: number) => {
    setTalkingPoints(talkingPoints.filter((_, i) => i !== index));
  };

  const toggleSectionLock = (sectionId: string) => {
    const newLocked = new Set(lockedSections);
    if (newLocked.has(sectionId)) {
      newLocked.delete(sectionId);
    } else {
      newLocked.add(sectionId);
    }
    setLockedSections(newLocked);
  };

  const updateSectionContent = (sectionId: string, newContent: any) => {
    setContent(prev => prev.map(s =>
      s.id === sectionId ? { ...s, content: newContent } : s
    ));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!blogType;
      case 1: return !!primaryServiceId && !!targetCity && !!goal;
      case 2: return true; // Optional step
      case 3: return !!selectedTemplate;
      case 4: return !!title && content.length > 0;
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1 && canProceed()) {
      if (currentStep === 3 && content.length === 0) {
        // Generate content before going to editor
        handleGenerate();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoadingPost) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Type selection
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">What type of blog post do you want to create?</h2>
              <RadioGroup value={blogType} onValueChange={setBlogType} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BLOG_TYPES.map(type => (
                  <Label
                    key={type.value}
                    className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      blogType === type.value ? 'border-blue-600 bg-blue-50' : 'hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value={type.value} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <type.icon className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 1: // Targeting
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Target your content</h2>

            <div className="space-y-4">
              <div>
                <Label>Primary Service</Label>
                <Select value={primaryServiceId?.toString() || ""} onValueChange={v => setPrimaryServiceId(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {formulas.map(formula => (
                      <SelectItem key={formula.id} value={formula.id.toString()}>
                        {formula.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target City</Label>
                  <Input
                    value={targetCity}
                    onChange={e => setTargetCity(e.target.value)}
                    placeholder="e.g., Philadelphia"
                  />
                </div>
                <div>
                  <Label>Neighborhood (Optional)</Label>
                  <Input
                    value={targetNeighborhood}
                    onChange={e => setTargetNeighborhood(e.target.value)}
                    placeholder="e.g., Center City"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Primary Goal</Label>
                <RadioGroup value={goal} onValueChange={setGoal} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {GOALS.map(g => (
                    <Label
                      key={g.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                        goal === g.value ? 'border-blue-600 bg-blue-50' : 'hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value={g.value} />
                      <div>
                        <span className="font-medium text-sm">{g.label}</span>
                        <p className="text-xs text-gray-500">{g.description}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Tone Preference</Label>
                <Select value={tonePreference} onValueChange={setTonePreference}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map(tone => (
                      <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2: // Content source
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Content Source</h2>
            <p className="text-gray-500">Select a completed job or add your own notes for content inspiration.</p>

            {blogType === "job_showcase" && workOrders.length > 0 && (
              <div>
                <Label className="mb-2 block">Select a Completed Job (Optional)</Label>
                <Select value={workOrderId?.toString() || "none"} onValueChange={v => setWorkOrderId(v === "none" ? null : parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a work order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No job selected - use notes below</SelectItem>
                    {workOrders.map(wo => (
                      <SelectItem key={wo.id} value={wo.id.toString()}>
                        {wo.title} - {wo.customerAddress}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Job Notes / Context</Label>
              <Textarea
                value={jobNotes}
                onChange={e => setJobNotes(e.target.value)}
                placeholder="Add any notes or context about the job, project details, challenges overcome, etc."
                rows={4}
              />
            </div>

            <div>
              <Label className="mb-2 block">Key Talking Points</Label>
              <div className="space-y-2">
                {talkingPoints.map((point, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={point}
                      onChange={e => handleTalkingPointChange(index, e.target.value)}
                      placeholder={`Talking point ${index + 1}`}
                    />
                    {talkingPoints.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeTalkingPoint(index)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addTalkingPoint}>
                  Add Talking Point
                </Button>
              </div>
            </div>
          </div>
        );

      case 3: // Layout selection
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Choose a Layout Template</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {layoutTemplates.filter(t => !t.blogType || t.blogType === blogType).map(template => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'ring-2 ring-blue-600 border-blue-600'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setLayoutTemplateId(template.id > 0 ? template.id : null);
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      {selectedTemplate?.id === template.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                      {template.name}
                    </CardTitle>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {(template.sections as any[])?.map((section, i) => (
                        <div key={i} className="text-sm flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${section.required ? 'bg-blue-600' : 'bg-gray-300'}`} />
                          <span>{section.label}</span>
                          {section.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 4: // Editor
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Edit Content</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? "Hide Preview" : "Preview"}
                </Button>
                <Button variant="outline" onClick={() => handleSave(false)} disabled={saveMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              </div>
            </div>

            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="meta">Meta & SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Blog post title"
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label>URL Slug</Label>
                  <Input
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="url-friendly-slug"
                  />
                </div>

                <Accordion type="multiple" className="w-full">
                  {content.map((section, index) => (
                    <AccordionItem key={section.id} value={section.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          {lockedSections.has(section.id) ? (
                            <Lock className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Unlock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="capitalize">{section.type.replace(/_/g, " ")}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-2">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSectionLock(section.id)}
                            >
                              {lockedSections.has(section.id) ? (
                                <>
                                  <Unlock className="h-4 w-4 mr-1" />
                                  Unlock
                                </>
                              ) : (
                                <>
                                  <Lock className="h-4 w-4 mr-1" />
                                  Lock
                                </>
                              )}
                            </Button>
                            {isEditing && !lockedSections.has(section.id) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => regenerateSectionMutation.mutate(section.type)}
                                disabled={regenerateSectionMutation.isPending}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Regenerate
                              </Button>
                            )}
                          </div>
                          {renderSectionEditor(section, lockedSections.has(section.id))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="meta" className="space-y-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input
                    value={metaTitle}
                    onChange={e => setMetaTitle(e.target.value)}
                    placeholder="SEO title (50-60 characters)"
                    maxLength={70}
                  />
                  <p className="text-xs text-gray-500 mt-1">{metaTitle.length}/60 characters</p>
                </div>

                <div>
                  <Label>Meta Description</Label>
                  <Textarea
                    value={metaDescription}
                    onChange={e => setMetaDescription(e.target.value)}
                    placeholder="SEO description (150-160 characters)"
                    maxLength={170}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">{metaDescription.length}/160 characters</p>
                </div>

                <div>
                  <Label>Excerpt</Label>
                  <Textarea
                    value={excerpt}
                    onChange={e => setExcerpt(e.target.value)}
                    placeholder="Short excerpt for previews"
                    rows={2}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      case 5: // SEO Review
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">SEO Review</h2>

            {seoScore !== null && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>SEO Score</span>
                    <span className={`text-2xl ${
                      seoScore >= 80 ? 'text-green-600' :
                      seoScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{seoScore}%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={seoScore} className="h-3 mb-4" />
                  <div className="space-y-2">
                    {seoChecklist.map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        {item.isPassed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className={item.isPassed ? 'text-gray-700' : 'text-red-700'}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 bg-white">
                  <div className="text-blue-600 text-sm truncate">{targetCity} | Your Business</div>
                  <div className="text-lg font-medium text-blue-800 hover:underline cursor-pointer truncate">
                    {metaTitle || title}
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {metaDescription || excerpt}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 6: // Publish
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Publish Settings</h2>

            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <Input
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="e.g., Tips & Guides"
                />
              </div>

              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={tags.join(", ")}
                  onChange={e => setTags(e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                  placeholder="e.g., cleaning, maintenance, tips"
                />
              </div>

              <div>
                <Label>Featured Image URL</Label>
                <Input
                  value={featuredImageUrl}
                  onChange={e => setFeaturedImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleSave(false)}
                    disabled={saveMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={saveMutation.isPending}
                    className="flex-1"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Save & Sync to Duda
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const renderSectionEditor = (section: BlogContentSection, isLocked: boolean) => {
    const handleChange = (field: string, value: any) => {
      if (isLocked) return;
      updateSectionContent(section.id, { ...section.content, [field]: value });
    };

    switch (section.type) {
      case "hero":
        return (
          <div className="space-y-3">
            <div>
              <Label>Headline</Label>
              <Input
                value={section.content?.headline || ""}
                onChange={e => handleChange("headline", e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <Label>Subheadline</Label>
              <Input
                value={section.content?.subheadline || ""}
                onChange={e => handleChange("subheadline", e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
        );

      case "text":
        return (
          <div className="space-y-3">
            <div>
              <Label>Heading</Label>
              <Input
                value={section.content?.heading || ""}
                onChange={e => handleChange("heading", e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                value={section.content?.body || ""}
                onChange={e => handleChange("body", e.target.value)}
                rows={6}
                disabled={isLocked}
              />
            </div>
          </div>
        );

      case "job_summary":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Project Type</Label>
                <Input
                  value={section.content?.projectType || ""}
                  onChange={e => handleChange("projectType", e.target.value)}
                  disabled={isLocked}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={section.content?.location || ""}
                  onChange={e => handleChange("location", e.target.value)}
                  disabled={isLocked}
                />
              </div>
            </div>
            <div>
              <Label>Duration</Label>
              <Input
                value={section.content?.duration || ""}
                onChange={e => handleChange("duration", e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <Label>Highlights (one per line)</Label>
              <Textarea
                value={(section.content?.highlights || []).join("\n")}
                onChange={e => handleChange("highlights", e.target.value.split("\n").filter(Boolean))}
                rows={4}
                disabled={isLocked}
              />
            </div>
          </div>
        );

      case "faq":
        return (
          <div className="space-y-4">
            {(section.content?.questions || []).map((q: any, i: number) => (
              <div key={i} className="border rounded p-3 space-y-2">
                <div>
                  <Label>Question {i + 1}</Label>
                  <Input
                    value={q.question || ""}
                    onChange={e => {
                      const newQuestions = [...(section.content?.questions || [])];
                      newQuestions[i] = { ...newQuestions[i], question: e.target.value };
                      handleChange("questions", newQuestions);
                    }}
                    disabled={isLocked}
                  />
                </div>
                <div>
                  <Label>Answer</Label>
                  <Textarea
                    value={q.answer || ""}
                    onChange={e => {
                      const newQuestions = [...(section.content?.questions || [])];
                      newQuestions[i] = { ...newQuestions[i], answer: e.target.value };
                      handleChange("questions", newQuestions);
                    }}
                    rows={3}
                    disabled={isLocked}
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case "cta":
        return (
          <div className="space-y-3">
            <div>
              <Label>Heading</Label>
              <Input
                value={section.content?.heading || ""}
                onChange={e => handleChange("heading", e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                value={section.content?.body || ""}
                onChange={e => handleChange("body", e.target.value)}
                rows={2}
                disabled={isLocked}
              />
            </div>
            <div>
              <Label>Button Text</Label>
              <Input
                value={section.content?.buttonText || ""}
                onChange={e => handleChange("buttonText", e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <Label>Content (JSON)</Label>
            <Textarea
              value={JSON.stringify(section.content, null, 2)}
              onChange={e => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateSectionContent(section.id, parsed);
                } catch {}
              }}
              rows={8}
              disabled={isLocked}
              className="font-mono text-sm"
            />
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Edit Blog Post" : "Create Blog Post"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing ? title : "Generate SEO-optimized content for your website"}
          </p>
        </div>

        {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {WIZARD_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 cursor-pointer ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
              onClick={() => index < currentStep && setCurrentStep(index)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index === currentStep
                  ? 'bg-blue-600 text-white'
                  : index < currentStep
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span className="hidden md:inline text-sm font-medium">{step.label}</span>
            </div>
          ))}
        </div>
        <Progress value={((currentStep + 1) / WIZARD_STEPS.length) * 100} className="h-1" />
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {generateMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Sparkles className="h-12 w-12 text-blue-600 animate-pulse mb-4" />
              <p className="text-lg font-medium">Generating your blog content...</p>
              <p className="text-gray-500">This may take a moment</p>
            </div>
          ) : (
            renderStepContent()
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {!generateMutation.isPending && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? () => navigate("/blog-posts") : goBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>
          {currentStep < WIZARD_STEPS.length - 1 && (
            <Button onClick={goNext} disabled={!canProceed()}>
              {currentStep === 3 && content.length === 0 ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}

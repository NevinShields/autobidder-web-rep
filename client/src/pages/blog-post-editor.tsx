import { useState, useEffect, useRef, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Video as VideoIcon,
  Settings,
  Upload,
  Trash2,
  Loader2
} from "lucide-react";
import { FaFacebookF, FaGoogle } from "react-icons/fa6";
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
  { id: "strategy", label: "Strategy", icon: Target },
  { id: "editor", label: "Editor", icon: PenTool },
  { id: "seo", label: "SEO Review", icon: Search },
  { id: "publish", label: "Publish", icon: Globe }
];

export default function BlogPostEditorPage() {
  const { id: routeId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postId, setPostId] = useState<string | undefined>(routeId && routeId !== "new" ? routeId : undefined);
  const id = postId || (routeId && routeId !== "new" ? routeId : undefined);
  const isEditing = !!id;

  // Sync routeId changes to postId (e.g. after navigation)
  useEffect(() => {
    if (routeId && routeId !== "new") {
      setPostId(routeId);
    }
  }, [routeId]);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [blogType, setBlogType] = useState<string>("");
  const [primaryServiceId, setPrimaryServiceId] = useState<number | null>(null);
  const [targetCity, setTargetCity] = useState("");
  const [targetNeighborhood, setTargetNeighborhood] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
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
  const [internalLinks, setInternalLinks] = useState<Array<{ anchorText: string; url: string }>>([{ anchorText: "", url: "" }]);
  const [videoUrl, setVideoUrl] = useState("");
  const [facebookPostUrl, setFacebookPostUrl] = useState("");
  const [gmbPostUrl, setGmbPostUrl] = useState("");
  const [useGlobalCtaSettings, setUseGlobalCtaSettings] = useState(true);
  const [postCtaButtonEnabled, setPostCtaButtonEnabled] = useState(true);
  const [postCtaButtonUrl, setPostCtaButtonUrl] = useState("");
  const [globalCtaEnabled, setGlobalCtaEnabled] = useState(true);
  const [globalCtaUrl, setGlobalCtaUrl] = useState("");

  // Uploaded images state
  const [uploadedImages, setUploadedImages] = useState<{
    id?: number;
    preview: string;
    url?: string;
    imageType: string;
    imageStyle: "default" | "rounded" | "rounded_shadow";
    caption: string;
    uploading: boolean;
  }[]>([]);

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [featuredImageUploading, setFeaturedImageUploading] = useState(false);
  const [suggestedTalkingPoints, setSuggestedTalkingPoints] = useState<string[]>([]);
  const [suggestedAngles, setSuggestedAngles] = useState<string[]>([]);
  const [suggestedContext, setSuggestedContext] = useState("");
  const lastSuggestionKeyRef = useRef("");
  const [photoLibraryOpen, setPhotoLibraryOpen] = useState(false);
  const [photoLibraryMode, setPhotoLibraryMode] = useState<"blog" | "featured">("blog");
  const [photoLibrarySearch, setPhotoLibrarySearch] = useState("");
  const beforeSetInputRef = useRef<HTMLInputElement | null>(null);
  const afterSetInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingBeforeSetFiles, setPendingBeforeSetFiles] = useState<File[]>([]);
  const [pendingAfterSetFiles, setPendingAfterSetFiles] = useState<File[]>([]);

  // Fetch existing post if editing
  const { data: existingPost, isLoading: isLoadingPost } = useQuery<BlogPost & { sectionLocks: any[]; images?: any[] }>({
    queryKey: [`/api/blog-posts/${id}`],
    enabled: !!id,
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

  const { data: businessSettings } = useQuery<any>({
    queryKey: ["/api/business-settings"],
  });

  const { data: photoMeasurements = [] } = useQuery<any[]>({
    queryKey: ["/api/photo-measurements"],
  });

  const { data: leadsForPhotos = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  const { data: multiServiceLeadsForPhotos = [] } = useQuery<any[]>({
    queryKey: ["/api/multi-service-leads"],
  });

  const photoLibraryImages = useMemo(() => {
    const fromLeadUploads = [...leadsForPhotos, ...multiServiceLeadsForPhotos].flatMap((lead: any, leadIndex: number) =>
      (lead.uploadedImages || []).filter(Boolean).map((url: string, index: number) => ({
        key: `lead-${lead.id || leadIndex}-${index}-${url}`,
        url,
        title: lead.name || lead.email || "Customer Upload",
        subtitle: "Customer Upload",
        createdAt: lead.createdAt || null,
      }))
    );

    const fromMeasurements = photoMeasurements.flatMap((measurement: any) =>
      (measurement.customerImageUrls || []).filter(Boolean).map((url: string, index: number) => ({
        key: `measurement-${measurement.id}-${index}-${url}`,
        url,
        title: measurement.formulaName || measurement.setupConfig?.objectDescription || "Photo Measurement",
        subtitle: (measurement.tags || []).slice(0, 2).join(", ") || "Photo Measurement",
        createdAt: measurement.createdAt || null,
      }))
    );

    const uniqueByUrl = new Map<string, {
      key: string;
      url: string;
      title: string;
      subtitle: string;
      createdAt: string | null;
    }>();

    [...fromLeadUploads, ...fromMeasurements].forEach((img) => {
      if (!img.url || uniqueByUrl.has(img.url)) return;
      uniqueByUrl.set(img.url, img);
    });

    return Array.from(uniqueByUrl.values()).sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [leadsForPhotos, multiServiceLeadsForPhotos, photoMeasurements]);

  const filteredPhotoLibraryImages = useMemo(() => {
    const term = photoLibrarySearch.trim().toLowerCase();
    if (!term) return photoLibraryImages;
    return photoLibraryImages.filter((img) =>
      `${img.title} ${img.subtitle} ${img.url}`.toLowerCase().includes(term)
    );
  }, [photoLibraryImages, photoLibrarySearch]);

  // Load existing post data
  useEffect(() => {
    if (existingPost) {
      setBlogType(existingPost.blogType);
      setPrimaryServiceId(existingPost.primaryServiceId);
      setTargetCity(existingPost.targetCity || "");
      setTargetNeighborhood(existingPost.targetNeighborhood || "");
      setTargetKeyword(existingPost.targetKeyword || "");
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
      setInternalLinks((existingPost.internalLinks as Array<{ anchorText: string; url: string }> || []).length > 0
        ? existingPost.internalLinks as Array<{ anchorText: string; url: string }>
        : [{ anchorText: "", url: "" }]);
      setVideoUrl(existingPost.videoUrl || "");
      setFacebookPostUrl(existingPost.facebookPostUrl || "");
      setGmbPostUrl(existingPost.gmbPostUrl || "");
      const hasPerPostCtaOverride = existingPost.ctaButtonEnabled !== null || !!existingPost.ctaButtonUrl;
      setUseGlobalCtaSettings(!hasPerPostCtaOverride);
      setPostCtaButtonEnabled(existingPost.ctaButtonEnabled ?? true);
      setPostCtaButtonUrl(existingPost.ctaButtonUrl || "");
      setLockedSections(new Set(existingPost.sectionLocks?.map((l: any) => l.sectionId) || []));
      setUploadedImages(
        (existingPost.images || []).map((img: any) => ({
          id: img.id,
          preview: img.processedUrl || img.originalUrl,
          url: img.processedUrl || img.originalUrl,
          imageType: img.imageType || "hero",
          imageStyle: (img.imageStyle || "default") as "default" | "rounded" | "rounded_shadow",
          caption: img.caption || "",
          uploading: false,
        }))
      );
      // Skip to editor step if editing
      setCurrentStep(2);
    }
  }, [existingPost]);

  useEffect(() => {
    if (!businessSettings) return;
    setGlobalCtaEnabled(businessSettings.blogCtaEnabled ?? true);
    setGlobalCtaUrl(businessSettings.blogCtaUrl || "");
  }, [businessSettings]);

  useEffect(() => {
    if (layoutTemplates.length === 0) return;

    if (layoutTemplateId) {
      const matchedTemplate = layoutTemplates.find(t => t.id === layoutTemplateId);
      if (matchedTemplate) {
        setSelectedTemplate(matchedTemplate);
        return;
      }
    }

    if (!selectedTemplate && blogType) {
      const fallbackTemplate = layoutTemplates.find(t => !t.blogType || t.blogType === blogType);
      if (fallbackTemplate) {
        setSelectedTemplate(fallbackTemplate);
        if (!layoutTemplateId) {
          setLayoutTemplateId(fallbackTemplate.id > 0 ? fallbackTemplate.id : null);
        }
      }
    }
  }, [layoutTemplates, layoutTemplateId, selectedTemplate, blogType]);

  useEffect(() => {
    if (targetKeyword.trim() || !primaryServiceId) return;
    const fallbackKeyword = formulas.find(f => f.id === primaryServiceId)?.name;
    if (fallbackKeyword) {
      setTargetKeyword(fallbackKeyword);
    }
  }, [formulas, primaryServiceId, targetKeyword]);

  const suggestContextMutation = useMutation({
    mutationFn: async () => {
      const selectedService = formulas.find(f => f.id === primaryServiceId);
      const response = await apiRequest("POST", "/api/blog-posts/suggest-keyword-context", {
        targetKeyword: targetKeyword.trim(),
        targetCity: targetCity.trim() || undefined,
        blogType,
        tonePreference,
        serviceName: selectedService?.name || undefined,
      });
      return await response.json() as {
        talkingPoints?: string[];
        contextSummary?: string;
        angleIdeas?: string[];
      };
    },
    onSuccess: (data) => {
      const nextTalkingPoints = (data.talkingPoints || []).filter(Boolean);
      setSuggestedTalkingPoints(nextTalkingPoints);
      setSuggestedAngles((data.angleIdeas || []).filter(Boolean));
      setSuggestedContext(data.contextSummary || "");

      setTalkingPoints((prev) => {
        const hasManualPoints = prev.some((point) => point.trim().length > 0);
        if (hasManualPoints || nextTalkingPoints.length === 0) return prev;
        return nextTalkingPoints;
      });

    },
    onError: () => {
      lastSuggestionKeyRef.current = "";
    },
  });

  useEffect(() => {
    const keyword = targetKeyword.trim();
    if (keyword.length < 3 || !blogType) return;

    const suggestionKey = `${blogType}|${keyword.toLowerCase()}|${targetCity.trim().toLowerCase()}|${tonePreference}`;
    if (lastSuggestionKeyRef.current === suggestionKey) return;

    const timer = setTimeout(() => {
      lastSuggestionKeyRef.current = suggestionKey;
      suggestContextMutation.mutate();
    }, 500);

    return () => clearTimeout(timer);
  }, [targetKeyword, targetCity, blogType, tonePreference]);

  // Generate content mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const serviceName = formulas.find(f => f.id === primaryServiceId)?.name || targetKeyword.trim();
      const selectedWorkOrder = workOrders.find(w => w.id === workOrderId);
      const combinedJobNotes = [selectedWorkOrder?.instructions?.trim(), jobNotes.trim()]
        .filter((value): value is string => Boolean(value))
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .join("\n\n");

      const input = {
        blogType,
        primaryServiceId,
        targetKeyword: targetKeyword.trim(),
        serviceName,
        serviceDescription: formulas.find(f => f.id === primaryServiceId)?.description,
        targetCity,
        targetNeighborhood: targetNeighborhood || undefined,
        goal,
        tonePreference,
        workOrderId,
        jobNotes: combinedJobNotes || undefined,
        layoutTemplateId: selectedTemplate?.id > 0 ? selectedTemplate.id : null,
        talkingPoints: talkingPoints.filter(p => p.trim()),
        layoutTemplate: selectedTemplate?.sections || [],
        jobData: selectedWorkOrder ? {
          title: selectedWorkOrder.title,
          customerAddress: selectedWorkOrder.customerAddress || "",
          completedDate: selectedWorkOrder.completedDate ? format(new Date(selectedWorkOrder.completedDate), "MMMM d, yyyy") : "",
          notes: combinedJobNotes || undefined,
          images: []
        } : undefined,
        images: uploadedImages
          .filter(img => img.url && !img.uploading)
          .map(img => ({ url: img.url!, imageType: img.imageType, imageStyle: img.imageStyle, caption: img.caption })),
        internalLinks: internalLinks
          .map(link => ({ anchorText: link.anchorText.trim(), url: link.url.trim() }))
          .filter(link => link.url),
        videoUrl: videoUrl.trim() || undefined,
        facebookPostUrl: facebookPostUrl.trim() || undefined,
        gmbPostUrl: gmbPostUrl.trim() || undefined,
        ctaButtonEnabled: useGlobalCtaSettings ? null : postCtaButtonEnabled,
        ctaButtonUrl: useGlobalCtaSettings ? null : (postCtaButtonUrl.trim() || null),
      };

      const response = await apiRequest("POST", "/api/blog-posts/generate-content", input);
      return await response.json();
    },
    onSuccess: async (data: any) => {
      setTitle(data.title);
      setSlug(data.slug);
      setMetaTitle(data.metaTitle || "");
      setMetaDescription(data.metaDescription || "");
      setExcerpt(data.excerpt || "");
      setContent(data.content || []);
      setSeoScore(data.seoScore ?? null);
      setSeoChecklist(data.seoChecklist || []);
      setCurrentStep(2); // Move to editor step
      if (data.id) {
        setPostId(String(data.id));
        if (!isEditing) {
          navigate(`/blog-posts/${data.id}/edit`);
        }
        await persistUploadedImagesToPost(data.id);
      }
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
        targetKeyword: targetKeyword.trim() || null,
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
        internalLinks: internalLinks
          .map(link => ({ anchorText: link.anchorText.trim(), url: link.url.trim() }))
          .filter(link => link.url),
        videoUrl: videoUrl.trim() || null,
        facebookPostUrl: facebookPostUrl.trim() || null,
        gmbPostUrl: gmbPostUrl.trim() || null,
        ctaButtonEnabled: useGlobalCtaSettings ? null : postCtaButtonEnabled,
        ctaButtonUrl: useGlobalCtaSettings ? null : (postCtaButtonUrl.trim() || null),
        status: publish ? "published" : "draft"
      };

      if (isEditing) {
        const response = await apiRequest("PATCH", `/api/blog-posts/${id}`, data);
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/blog-posts", data);
        return await response.json();
      }
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      if (data.id) {
        setPostId(String(data.id));
        await persistUploadedImagesToPost(data.id);
      }
      toast({
        title: "Saved",
        description: "Blog post saved successfully.",
      });
      if (!isEditing) {
        navigate("/blog-posts");
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

  // Sync to website mutation
  const syncToWebsiteMutation = useMutation({
    mutationFn: async (blogPostId: string) => {
      const response = await apiRequest("POST", `/api/blog-posts/${blogPostId}/sync-to-duda`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({
        title: "Synced to Website",
        description: `Blog post synced successfully. Website post ID: ${data.dudaPostId}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync blog post to website",
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

  const saveGlobalCtaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/business-settings", {
        blogCtaEnabled: globalCtaEnabled,
        blogCtaUrl: globalCtaUrl.trim() || null,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-settings"] });
      toast({
        title: "Global CTA Saved",
        description: "Default CTA settings will be used for posts using global defaults.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save Global CTA",
        description: error?.message || "Could not save global CTA settings.",
        variant: "destructive",
      });
    }
  });

  const effectiveCtaEnabled = useGlobalCtaSettings ? globalCtaEnabled : postCtaButtonEnabled;
  const effectiveCtaUrl = (useGlobalCtaSettings ? globalCtaUrl : postCtaButtonUrl).trim();

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleSave = (publish: boolean = false) => {
    saveMutation.mutate(publish);
  };

  const handleSaveAndSync = async () => {
    // Save the post first (as draft), then sync to website
    const data = {
      blogType,
      primaryServiceId,
      targetCity,
      targetNeighborhood: targetNeighborhood || null,
      targetKeyword: targetKeyword.trim() || null,
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
      internalLinks: internalLinks
        .map(link => ({ anchorText: link.anchorText.trim(), url: link.url.trim() }))
        .filter(link => link.url),
      videoUrl: videoUrl.trim() || null,
      facebookPostUrl: facebookPostUrl.trim() || null,
      gmbPostUrl: gmbPostUrl.trim() || null,
      ctaButtonEnabled: useGlobalCtaSettings ? null : postCtaButtonEnabled,
      ctaButtonUrl: useGlobalCtaSettings ? null : (postCtaButtonUrl.trim() || null),
      status: "draft"
    };

    try {
      let savedPost: any;
      if (isEditing) {
        const response = await apiRequest("PATCH", `/api/blog-posts/${id}`, data);
        savedPost = await response.json();
      } else {
        const response = await apiRequest("POST", "/api/blog-posts", data);
        savedPost = await response.json();
      }

      const savedId = savedPost.id ? String(savedPost.id) : id;
      if (savedId) {
        setPostId(savedId);
        await persistUploadedImagesToPost(Number(savedId));
        if (!isEditing) {
          navigate(`/blog-posts/${savedId}/edit`);
        }
        queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
        toast({
          title: "Saved",
          description: "Blog post saved. Syncing to website...",
        });
        syncToWebsiteMutation.mutate(savedId);
      }
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save blog post before syncing",
        variant: "destructive",
      });
    }
  };

  const uploadSingleImage = async (
    file: File,
    options?: {
      imageType?: string;
      imageStyle?: "default" | "rounded" | "rounded_shadow";
      caption?: string;
    }
  ) => {
    const imageType = options?.imageType || "hero";
    const imageStyle = options?.imageStyle || "default";
    const caption = options?.caption || "";
    const preview = URL.createObjectURL(file);
    let insertIndex = -1;

    setUploadedImages((prev) => {
      insertIndex = prev.length;
      return [...prev, {
        preview,
        imageType,
        imageStyle,
        caption,
        uploading: true,
      }];
    });

    const formData = new FormData();
    formData.append("image", file);
    formData.append("imageType", imageType);
    formData.append("imageStyle", imageStyle);
    formData.append("caption", caption);
    if (postId) {
      formData.append("blogPostId", postId);
    }

    try {
      const response = await fetch("/api/blog-images/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      setUploadedImages((prev) => prev.map((img, idx) =>
        idx === insertIndex
          ? {
              ...img,
              id: result.id,
              url: result.processedUrl || result.originalUrl,
              preview: result.processedUrl || result.originalUrl || img.preview,
              imageStyle: (result.imageStyle || img.imageStyle || "default") as "default" | "rounded" | "rounded_shadow",
              uploading: false,
            }
          : img
      ));
    } catch (error) {
      URL.revokeObjectURL(preview);
      setUploadedImages((prev) => prev.filter((_, idx) => idx !== insertIndex));
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadSingleImage(file, {
        imageType: "hero",
        imageStyle: "default",
        caption: "",
      });
    }
  };

  const handleBeforeAfterSetUpload = async () => {
    if (pendingBeforeSetFiles.length === 0 && pendingAfterSetFiles.length === 0) return;

    if (pendingBeforeSetFiles.length !== pendingAfterSetFiles.length) {
      toast({
        title: "Before/After count mismatch",
        description: "Uploading available images in order. For clean sets, select matching before and after counts.",
      });
    }

    const pairCount = Math.max(pendingBeforeSetFiles.length, pendingAfterSetFiles.length);
    for (let i = 0; i < pairCount; i++) {
      const beforeFile = pendingBeforeSetFiles[i];
      const afterFile = pendingAfterSetFiles[i];

      if (beforeFile) {
        await uploadSingleImage(beforeFile, {
          imageType: "before",
          imageStyle: "default",
          caption: `Before photo set ${i + 1}`,
        });
      }

      if (afterFile) {
        await uploadSingleImage(afterFile, {
          imageType: "after",
          imageStyle: "default",
          caption: `After photo set ${i + 1}`,
        });
      }
    }

    setPendingBeforeSetFiles([]);
    setPendingAfterSetFiles([]);
    if (beforeSetInputRef.current) beforeSetInputRef.current.value = "";
    if (afterSetInputRef.current) afterSetInputRef.current.value = "";
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => {
      const img = prev[index];
      if (img?.preview) URL.revokeObjectURL(img.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleFeaturedImageUpload = async (file: File | null) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("imageType", "hero");
    formData.append("imageStyle", "default");
    formData.append("caption", "Featured image");
    if (postId) {
      formData.append("blogPostId", postId);
    }

    setFeaturedImageUploading(true);
    try {
      const response = await fetch("/api/blog-images/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      setFeaturedImageUrl(result.processedUrl || result.originalUrl || "");
      toast({
        title: "Featured image uploaded",
        description: "The featured image is ready for publish/sync.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload featured image.",
        variant: "destructive",
      });
    } finally {
      setFeaturedImageUploading(false);
    }
  };

  const getImageExtensionFromMimeType = (mimeType: string): string => {
    if (mimeType === "image/png") return ".png";
    if (mimeType === "image/webp") return ".webp";
    if (mimeType === "image/gif") return ".gif";
    return ".jpg";
  };

  const uploadImageFromLibraryUrl = async ({
    imageUrl,
    imageType,
    imageStyle,
    caption,
    blogPostId,
  }: {
    imageUrl: string;
    imageType: string;
    imageStyle: "default" | "rounded" | "rounded_shadow";
    caption: string;
    blogPostId?: string;
  }) => {
    const sourceResponse = await fetch(imageUrl, { credentials: "include" });
    if (!sourceResponse.ok) {
      throw new Error(`Failed to fetch library image (${sourceResponse.status})`);
    }

    const blob = await sourceResponse.blob();
    const contentType = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
    const extension = getImageExtensionFromMimeType(contentType);
    const file = new File([blob], `library-image-${Date.now()}${extension}`, { type: contentType });

    const formData = new FormData();
    formData.append("image", file);
    formData.append("imageType", imageType);
    formData.append("imageStyle", imageStyle);
    formData.append("caption", caption);
    if (blogPostId) {
      formData.append("blogPostId", blogPostId);
    }

    const uploadResponse = await fetch("/api/blog-images/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!uploadResponse.ok) {
      throw new Error("Failed to copy library image into blog media");
    }

    return uploadResponse.json();
  };

  const persistUploadedImagesToPost = async (blogPostId: number) => {
    const snapshot = [...uploadedImages];
    for (let index = 0; index < snapshot.length; index++) {
      const img = snapshot[index];
      if (!img.url || img.uploading) continue;

      try {
        if (img.id) {
          await apiRequest("PATCH", `/api/blog-images/${img.id}`, {
            blogPostId,
            imageType: img.imageType,
            imageStyle: img.imageStyle,
            caption: img.caption,
          });
          continue;
        }

        const response = await apiRequest("POST", `/api/blog-posts/${blogPostId}/images`, {
          originalUrl: img.url,
          processedUrl: img.url,
          imageType: img.imageType,
          imageStyle: img.imageStyle,
          caption: img.caption,
          altText: img.caption || null,
          sourceType: "lead",
        });
        const created = await response.json();
        setUploadedImages((prev) => prev.map((existing, existingIndex) =>
          existingIndex === index
            ? {
                ...existing,
                id: created.id,
                url: created.processedUrl || created.originalUrl || existing.url,
                preview: created.processedUrl || created.originalUrl || existing.preview,
              }
            : existing
        ));
      } catch (error) {
        console.error("Failed to persist image metadata:", error);
      }
    }
  };

  const openPhotoLibrary = (mode: "blog" | "featured") => {
    setPhotoLibraryMode(mode);
    setPhotoLibrarySearch("");
    setPhotoLibraryOpen(true);
  };

  const handlePhotoLibrarySelect = async (image: { url: string; title: string }) => {
    if (photoLibraryMode === "featured") {
      setFeaturedImageUploading(true);
      try {
        const result = await uploadImageFromLibraryUrl({
          imageUrl: image.url,
          imageType: "hero",
          imageStyle: "default",
          caption: "Featured image",
          blogPostId: postId,
        });
        setFeaturedImageUrl(result.processedUrl || result.originalUrl || image.url);
        setPhotoLibraryOpen(false);
        toast({
          title: "Featured image selected",
          description: "Photo library image copied and set as featured image.",
        });
      } catch (error) {
        toast({
          title: "Featured image copy failed",
          description: "Could not copy this library image. Try another image.",
          variant: "destructive",
        });
      } finally {
        setFeaturedImageUploading(false);
      }
      return;
    }

    const nextImageStyle: "default" | "rounded" | "rounded_shadow" = "default";
    const nextCaption = image.title || "";
    let insertIndex = -1;
    let nextImageType = "process";

    setUploadedImages((prev) => {
      insertIndex = prev.length;
      nextImageType = prev.length === 0 ? "hero" : "process";
      return [...prev, {
        preview: image.url,
        url: image.url,
        imageType: nextImageType,
        imageStyle: nextImageStyle,
        caption: nextCaption,
        uploading: true,
      }];
    });

    try {
      const result = await uploadImageFromLibraryUrl({
        imageUrl: image.url,
        imageType: nextImageType,
        imageStyle: nextImageStyle,
        caption: nextCaption,
        blogPostId: postId,
      });
      setUploadedImages((prev) => prev.map((existing, existingIndex) =>
        existingIndex === insertIndex
          ? {
              ...existing,
              id: result.id,
              url: result.processedUrl || result.originalUrl || existing.url,
              preview: result.processedUrl || result.originalUrl || existing.preview,
              uploading: false,
            }
          : existing
      ));
    } catch (error) {
      setUploadedImages((prev) => prev.map((existing, existingIndex) =>
        existingIndex === insertIndex
          ? { ...existing, uploading: false }
          : existing
      ));
      toast({
        title: "Library image copy failed",
        description: "Using the original image URL instead. If it fails on publish, pick another image.",
        variant: "destructive",
      });
    }
  };

  const updateImageMeta = (index: number, field: 'imageType' | 'caption', value: string) => {
    setUploadedImages(prev => prev.map((img, i) =>
      i === index ? { ...img, [field]: value } : img
    ));
  };

  const updateImageStyle = (index: number, value: "default" | "rounded" | "rounded_shadow") => {
    setUploadedImages(prev => prev.map((img, i) =>
      i === index ? { ...img, imageStyle: value } : img
    ));
  };

  const updateInternalLink = (index: number, field: "anchorText" | "url", value: string) => {
    setInternalLinks(prev => prev.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const addInternalLink = () => {
    setInternalLinks(prev => [...prev, { anchorText: "", url: "" }]);
  };

  const removeInternalLink = (index: number) => {
    setInternalLinks(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ anchorText: "", url: "" }];
    });
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
      case 1: return !!targetKeyword.trim() && !!targetCity.trim() && !!goal && !!selectedTemplate;
      case 2: return !!title && content.length > 0;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1 && canProceed()) {
      if (currentStep === 1 && content.length === 0) {
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
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
              <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>What type of blog post do you want to create?</h2>
              <RadioGroup value={blogType} onValueChange={setBlogType} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BLOG_TYPES.map(type => (
                  <Label
                    key={type.value}
                    className={`flex items-start gap-4 p-4 border dark:border-slate-700 rounded-lg cursor-pointer transition-colors ${
                      blogType === type.value ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30' : 'hover:border-amber-300 dark:hover:border-amber-700'
                    }`}
                  >
                    <RadioGroupItem value={type.value} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <type.icon className="h-5 w-5 text-amber-600" />
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{type.description}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 1: // Strategy (targeting + content + layout)
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Blog Strategy</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Choose any target keyword, then let AI suggest talking points and context.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => suggestContextMutation.mutate()}
                  disabled={!targetKeyword.trim() || suggestContextMutation.isPending}
                >
                  {suggestContextMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Refresh AI Ideas
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Target Keyword</Label>
                  <Input
                    value={targetKeyword}
                    onChange={e => setTargetKeyword(e.target.value)}
                    placeholder="e.g., roof cleaning cost philadelphia"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Use any keyword phrase, not just a service in your account.</p>
                </div>
                <div>
                  <Label>Related Service (Optional)</Label>
                  <Select value={primaryServiceId?.toString() || "none"} onValueChange={v => setPrimaryServiceId(v === "none" ? null : parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked service</SelectItem>
                      {formulas.map(formula => (
                        <SelectItem key={formula.id} value={formula.id.toString()}>
                          {formula.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <div>
                  <Label>Tone Preference</Label>
                  <Select value={tonePreference} onValueChange={setTonePreference}>
                    <SelectTrigger>
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

              <div>
                <Label className="mb-3 block">Primary Goal</Label>
                <RadioGroup value={goal} onValueChange={setGoal} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {GOALS.map(g => (
                    <Label
                      key={g.value}
                      className={`flex items-center gap-3 p-3 border dark:border-slate-700 rounded-lg cursor-pointer ${
                        goal === g.value ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30' : 'hover:border-amber-300 dark:hover:border-amber-700'
                      }`}
                    >
                      <RadioGroupItem value={g.value} />
                      <div>
                        <span className="font-medium text-sm">{g.label}</span>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{g.description}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {(suggestedTalkingPoints.length > 0 || suggestedAngles.length > 0 || suggestedContext) && (
                <Card className="bg-amber-50/70 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40">
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-medium text-sm">AI Suggestions</span>
                    </div>

                    {suggestedTalkingPoints.length > 0 && (
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-gray-600 dark:text-slate-300">Suggested Talking Points</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {suggestedTalkingPoints.map((point, idx) => (
                            <Button
                              key={`${point}-${idx}`}
                              variant="outline"
                              size="sm"
                              className="h-auto py-1 px-2 text-left whitespace-normal"
                              onClick={() => {
                                setTalkingPoints(prev => {
                                  const next = prev.filter(p => p.trim().length > 0);
                                  if (next.includes(point)) return next;
                                  return [...next, point];
                                });
                              }}
                            >
                              + {point}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestedContext && (
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-gray-600 dark:text-slate-300">Suggested Context</Label>
                        <p className="text-sm text-gray-700 dark:text-slate-300 mt-1">{suggestedContext}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setJobNotes((prev) => prev.trim().length > 0 ? `${prev}\n\n${suggestedContext}` : suggestedContext)}
                        >
                          Use Suggested Context in Notes
                        </Button>
                      </div>
                    )}

                    {suggestedAngles.length > 0 && (
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-gray-600 dark:text-slate-300">Suggested Angles</Label>
                        <ul className="mt-1 space-y-1 text-sm text-gray-700 dark:text-slate-300">
                          {suggestedAngles.map((angle, idx) => (
                            <li key={`${angle}-${idx}`}>• {angle}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Content Inputs</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">Add context that helps the model produce stronger sections with less editing.</p>

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
                  placeholder="Add notes, constraints, customer concerns, results, or other context."
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

              <div>
                <Label className="mb-2 block">Upload Images for AI Placement</Label>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
                  Upload images and tag them so the AI can place them in the right sections of your blog post.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openPhotoLibrary("blog")}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Choose from Photo Library
                  </Button>
                </div>

                {blogType === "job_showcase" && (
                  <div className="mb-3 rounded-lg border border-amber-200/70 bg-amber-50/40 dark:bg-amber-950/20 p-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => beforeSetInputRef.current?.click()}
                      >
                        Select Before ({pendingBeforeSetFiles.length})
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => afterSetInputRef.current?.click()}
                      >
                        Select After ({pendingAfterSetFiles.length})
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleBeforeAfterSetUpload}
                        disabled={pendingBeforeSetFiles.length === 0 && pendingAfterSetFiles.length === 0}
                      >
                        Upload Before/After Set
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Use matching before and after selections to upload paired image sets in order.
                    </p>
                    <input
                      ref={beforeSetInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => setPendingBeforeSetFiles(Array.from(e.target.files || []))}
                    />
                    <input
                      ref={afterSetInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => setPendingAfterSetFiles(Array.from(e.target.files || []))}
                    />
                  </div>
                )}

                <div
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-amber-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('blog-image-upload')?.click()}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleImageUpload(e.dataTransfer.files);
                  }}
                >
                  <Upload className="h-8 w-8 mx-auto text-gray-400 dark:text-slate-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-slate-300">Drag & drop images here, or click to browse</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">JPG, PNG, or WebP (max 5MB each)</p>
                  <input
                    id="blog-image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={e => handleImageUpload(e.target.files)}
                  />
                </div>

                {uploadedImages.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900/60">
                        <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-slate-700">
                          {img.uploading ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-slate-400" />
                            </div>
                          ) : (
                            <img src={img.preview} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Select
                            value={img.imageType}
                            onValueChange={v => updateImageMeta(index, 'imageType', v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hero">Hero / Featured</SelectItem>
                              <SelectItem value="before">Before</SelectItem>
                              <SelectItem value="after">After</SelectItem>
                              <SelectItem value="process">Process / In-Progress</SelectItem>
                              <SelectItem value="equipment">Equipment</SelectItem>
                              <SelectItem value="team">Team</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={img.imageStyle}
                            onValueChange={(v) => updateImageStyle(index, v as "default" | "rounded" | "rounded_shadow")}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Style: Default</SelectItem>
                              <SelectItem value="rounded">Style: Rounded Corners</SelectItem>
                              <SelectItem value="rounded_shadow">Style: Rounded + Shadow</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={img.caption}
                            onChange={e => updateImageMeta(index, 'caption', e.target.value)}
                            placeholder="Caption / description for AI context"
                            className="h-8 text-sm"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 h-8 w-8"
                          onClick={() => removeUploadedImage(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold">SEO Linking and Media</h4>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Add internal links and supporting media so the blog can reinforce topical authority and on-site SEO.
                </p>

                <div className="space-y-2">
                  <Label className="mb-2 block">Internal Links</Label>
                  {internalLinks.map((link, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
                      <Input
                        value={link.anchorText}
                        onChange={e => updateInternalLink(index, "anchorText", e.target.value)}
                        placeholder="Anchor text (e.g., House Washing Services)"
                      />
                      <Input
                        value={link.url}
                        onChange={e => updateInternalLink(index, "url", e.target.value)}
                        placeholder="https://yourdomain.com/service-page or /service-page"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInternalLink(index)}
                        disabled={internalLinks.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addInternalLink}>
                    Add Internal Link
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700">
                        <VideoIcon className="h-3 w-3" />
                      </span>
                      Video URL (Optional)
                    </Label>
                    <Input
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                      placeholder="YouTube or Vimeo URL"
                    />
                  </div>
                  <div>
                    <Label className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700">
                        <FaFacebookF className="h-2.5 w-2.5" />
                      </span>
                      Facebook Post URL (Optional)
                    </Label>
                    <Input
                      value={facebookPostUrl}
                      onChange={e => setFacebookPostUrl(e.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <Label className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                        <FaGoogle className="h-2.5 w-2.5" />
                      </span>
                      Google Business Post URL (Optional)
                    </Label>
                    <Input
                      value={gmbPostUrl}
                      onChange={e => setGmbPostUrl(e.target.value)}
                      placeholder="Google post URL"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Layout Template</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {layoutTemplates.filter(t => !t.blogType || t.blogType === blogType).map(template => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'ring-2 ring-amber-500 border-amber-500'
                        : 'hover:border-amber-300 dark:hover:border-amber-700'
                    }`}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setLayoutTemplateId(template.id > 0 ? template.id : null);
                    }}
                  >
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        {selectedTemplate?.id === template.id && (
                          <CheckCircle className="h-5 w-5 text-amber-600" />
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
                            <div className={`w-2 h-2 rounded-full ${section.required ? 'bg-amber-600' : 'bg-gray-300 dark:bg-slate-700'}`} />
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
          </div>
        );

      case 2: // Editor
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Edit Content</h2>
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
                            <Unlock className="h-4 w-4 text-gray-400 dark:text-slate-400" />
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
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{metaTitle.length}/60 characters</p>
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
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{metaDescription.length}/160 characters</p>
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

      case 3: // SEO Review
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>SEO Review</h2>

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
                        <span className={item.isPassed ? 'text-gray-700 dark:text-slate-300' : 'text-red-700'}>
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
                <div className="border dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900">
                  <div className="text-amber-600 text-sm truncate">{targetCity} | Your Business</div>
                  <div className="text-lg font-medium text-amber-800 hover:underline cursor-pointer truncate">
                    {metaTitle || title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">
                    {metaDescription || excerpt}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4: // Publish
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Publish Settings</h2>

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
                <Label className="mb-2 block">Featured Image</Label>
                <div
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-amber-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("featured-image-upload")?.click()}
                >
                  {featuredImageUploading ? (
                    <Loader2 className="h-8 w-8 mx-auto text-gray-400 dark:text-slate-400 mb-2 animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 mx-auto text-gray-400 dark:text-slate-400 mb-2" />
                  )}
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    {featuredImageUploading ? "Uploading..." : "Click to upload a featured image"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">JPG, PNG, or WebP (max 5MB)</p>
                  <input
                    id="featured-image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={e => handleFeaturedImageUpload(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openPhotoLibrary("featured")}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Choose from Photo Library
                  </Button>
                </div>

                {featuredImageUrl && (
                  <div className="mt-3 border dark:border-slate-700 rounded-lg p-3 bg-gray-50 dark:bg-slate-900/60 flex items-center gap-3">
                    <img
                      src={featuredImageUrl}
                      alt="Featured preview"
                      className="w-20 h-20 object-cover rounded border dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Featured image selected</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{featuredImageUrl}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFeaturedImageUrl("")}
                      disabled={featuredImageUploading}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-2 border-t dark:border-slate-700">
                <h3 className="text-base font-semibold">CTA Controls</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Configure a global CTA destination and optionally override it for this post.
                </p>

                <div className="rounded-lg border dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Global CTA Enabled</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Used by posts that keep global defaults enabled.</p>
                    </div>
                    <Switch
                      checked={globalCtaEnabled}
                      onCheckedChange={setGlobalCtaEnabled}
                    />
                  </div>
                  <div>
                    <Label>Global CTA URL</Label>
                    <Input
                      value={globalCtaUrl}
                      onChange={(e) => setGlobalCtaUrl(e.target.value)}
                      placeholder="https://yourdomain.com/contact"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => saveGlobalCtaMutation.mutate()}
                      disabled={saveGlobalCtaMutation.isPending}
                    >
                      {saveGlobalCtaMutation.isPending ? "Saving..." : "Save Global CTA"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border dark:border-slate-700 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Use Global CTA Settings</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Turn off to override CTA behavior for this post only.</p>
                    </div>
                    <Switch
                      checked={useGlobalCtaSettings}
                      onCheckedChange={setUseGlobalCtaSettings}
                    />
                  </div>

                  {!useGlobalCtaSettings && (
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">Show CTA Button on This Post</p>
                        </div>
                        <Switch
                          checked={postCtaButtonEnabled}
                          onCheckedChange={setPostCtaButtonEnabled}
                        />
                      </div>
                      <div>
                        <Label>CTA URL (Per Post)</Label>
                        <Input
                          value={postCtaButtonUrl}
                          onChange={(e) => setPostCtaButtonUrl(e.target.value)}
                          placeholder="https://yourdomain.com/contact"
                        />
                      </div>
                    </>
                  )}

                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Effective CTA: {effectiveCtaEnabled ? "Enabled" : "Disabled"}{effectiveCtaEnabled ? ` (${effectiveCtaUrl || "Uses section/default URL"})` : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t dark:border-slate-700">
                <h3 className="text-base font-semibold">SEO Enhancements</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Add internal links and external proof assets to strengthen on-page SEO and user trust.
                </p>

                <div className="space-y-2">
                  <Label className="mb-2 block">Internal Links</Label>
                  {internalLinks.map((link, index) => (
                    <div key={`publish-link-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
                      <Input
                        value={link.anchorText}
                        onChange={e => updateInternalLink(index, "anchorText", e.target.value)}
                        placeholder="Anchor text"
                      />
                      <Input
                        value={link.url}
                        onChange={e => updateInternalLink(index, "url", e.target.value)}
                        placeholder="https://yourdomain.com/page or /page"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInternalLink(index)}
                        disabled={internalLinks.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addInternalLink}>
                    Add Internal Link
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700">
                        <VideoIcon className="h-3 w-3" />
                      </span>
                      Video URL (Optional)
                    </Label>
                    <Input
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                      placeholder="YouTube or Vimeo URL"
                    />
                  </div>
                  <div>
                    <Label className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700">
                        <FaFacebookF className="h-2.5 w-2.5" />
                      </span>
                      Facebook Post URL (Optional)
                    </Label>
                    <Input
                      value={facebookPostUrl}
                      onChange={e => setFacebookPostUrl(e.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <Label className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                        <FaGoogle className="h-2.5 w-2.5" />
                      </span>
                      Google Business Post URL (Optional)
                    </Label>
                    <Input
                      value={gmbPostUrl}
                      onChange={e => setGmbPostUrl(e.target.value)}
                      placeholder="Google post URL"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleSave(false)}
                    disabled={saveMutation.isPending}
                    className="flex-1 w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button
                    onClick={handleSaveAndSync}
                    disabled={saveMutation.isPending || syncToWebsiteMutation.isPending}
                    className="flex-1 w-full"
                  >
                    {syncToWebsiteMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Globe className="h-4 w-4 mr-2" />
                    )}
                    {syncToWebsiteMutation.isPending ? "Syncing..." : "Save & Sync"}
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
        const faqQuestions = (Array.isArray(section.content?.questions) && section.content.questions.length > 0)
          ? section.content.questions
          : Array.from({ length: 4 }, () => ({ question: "", answer: "" }));
        return (
          <div className="space-y-4">
            {faqQuestions.map((q: any, i: number) => (
              <div key={i} className="border dark:border-slate-700 rounded p-3 space-y-2">
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
      <style>{`
        .blog-editor-grain {
          position: relative;
          background:
            radial-gradient(circle at 0% 0%, rgba(245, 158, 11, 0.12) 0%, transparent 38%),
            radial-gradient(circle at 100% 0%, rgba(234, 88, 12, 0.09) 0%, transparent 32%),
            linear-gradient(180deg, #fffef9 0%, #ffffff 28%, #ffffff 100%);
        }
        .dark .blog-editor-grain {
          background:
            radial-gradient(circle at 0% 0%, rgba(245, 158, 11, 0.16) 0%, transparent 38%),
            radial-gradient(circle at 100% 0%, rgba(234, 88, 12, 0.12) 0%, transparent 34%),
            linear-gradient(180deg, #020617 0%, #0b1220 24%, #020617 100%);
        }
        .blog-editor-grain::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(rgba(148, 163, 184, 0.08) 0.6px, transparent 0.6px);
          background-size: 4px 4px;
          opacity: 0.32;
        }
        .dark .blog-editor-grain::before {
          background-image: radial-gradient(rgba(148, 163, 184, 0.14) 0.7px, transparent 0.7px);
          opacity: 0.22;
        }
      `}</style>
      <div className="blog-editor-grain relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-900 dark:text-slate-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/50 bg-gradient-to-r from-amber-50 via-white to-orange-50 dark:from-amber-950/40 dark:via-slate-900/85 dark:to-orange-950/30 p-5 sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-600/80 font-semibold mb-1">Content Studio</p>
            <h1 className="text-3xl text-gray-900 dark:text-slate-100 leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              {isEditing ? "Edit Blog Post" : "Create Blog Post"}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {isEditing ? title : "Generate SEO-optimized content for your website"}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/blog-posts")} className="border-amber-200 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/30">
            Back to Blog Posts
          </Button>
        </div>

        {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {WIZARD_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 cursor-pointer ${
                index <= currentStep ? 'text-amber-700 dark:text-amber-300' : 'text-gray-400 dark:text-slate-400'
              }`}
              onClick={() => index < currentStep && setCurrentStep(index)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index === currentStep
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30'
                  : index < currentStep
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  : 'bg-gray-100 dark:bg-slate-800 dark:text-slate-400'
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
        <Progress value={((currentStep + 1) / WIZARD_STEPS.length) * 100} className="h-1 bg-slate-200 dark:bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-600" />
      </div>

      {/* Step content */}
      <Card className="border-slate-200/70 dark:border-slate-800/90 bg-white/90 dark:bg-slate-950/80 backdrop-blur-sm shadow-sm">
        <CardContent className="pt-6">
          {generateMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Sparkles className="h-12 w-12 text-amber-600 animate-pulse mb-4" />
              <p className="text-lg font-medium">Generating your blog content...</p>
              <p className="text-slate-500 dark:text-slate-400">This may take a moment</p>
            </div>
          ) : (
            renderStepContent()
          )}
        </CardContent>
      </Card>

      <Dialog open={photoLibraryOpen} onOpenChange={setPhotoLibraryOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">Photo Library</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Choose from the same images available on the `/photos` page.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
            <Input
              value={photoLibrarySearch}
              onChange={(e) => setPhotoLibrarySearch(e.target.value)}
              placeholder="Search by customer, service, tag, or URL"
              className="pl-9"
            />
          </div>
          <div className="overflow-y-auto pr-1">
            {filteredPhotoLibraryImages.length === 0 ? (
              <div className="border dark:border-slate-700 rounded-lg p-8 text-center text-sm text-gray-500 dark:text-slate-400">
                No matching photos found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPhotoLibraryImages.map((img) => (
                  <div key={img.key} className="border dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                    <div className="aspect-video bg-gray-100 dark:bg-slate-800">
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium truncate">{img.title}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{img.subtitle}</p>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={() => handlePhotoLibrarySelect({ url: img.url, title: img.title })}
                      >
                        {photoLibraryMode === "featured" ? "Set as Featured Image" : "Add to Blog Images"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
              {currentStep === 1 && content.length === 0 ? (
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

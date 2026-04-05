import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus, Trash2, Zap, Mail, MessageSquare, Clock, Settings, Loader2,
  Search, MoreHorizontal, ChevronUp, Sparkles, UserPlus, Eye,
  CheckCircle, Tag, Calendar, X,
} from "lucide-react";
import { CrmAutomation } from "@shared/schema";
import DashboardLayout from "@/components/dashboard-layout";
import { Link } from "wouter";
import { format } from "date-fns";

const TEMPLATES_DISMISSED_KEY = "crm-automations-templates-dismissed";

function getTriggerIcon(triggerType: string) {
  switch (triggerType) {
    case "lead_created":
      return <UserPlus className="h-3.5 w-3.5" />;
    case "stage_change":
      return <Zap className="h-3.5 w-3.5" />;
    case "time_based":
      return <Clock className="h-3.5 w-3.5" />;
    case "pre_booking_scheduled":
      return <Calendar className="h-3.5 w-3.5" />;
    case "estimate_viewed":
      return <Eye className="h-3.5 w-3.5" />;
    case "estimate_accepted":
      return <CheckCircle className="h-3.5 w-3.5" />;
    case "tag_added":
      return <Tag className="h-3.5 w-3.5" />;
    case "form_submitted":
      return <Mail className="h-3.5 w-3.5" />;
    default:
      return <Zap className="h-3.5 w-3.5" />;
  }
}

function getTriggerLabel(triggerType: string) {
  switch (triggerType) {
    case "lead_created": return "Lead Created";
    case "stage_change": return "Stage Change";
    case "time_based": return "Time Based";
    case "pre_booking_scheduled": return "Pre-Booking";
    case "estimate_viewed": return "Estimate Viewed";
    case "estimate_accepted": return "Estimate Accepted";
    case "tag_added": return "Tag Added";
    case "form_submitted": return "Form Submitted";
    default: return triggerType?.replace(/_/g, " ") ?? "Unknown";
  }
}

export default function CrmAutomations() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [triggerFilter, setTriggerFilter] = useState<string>("all");
  const [templatesDismissed, setTemplatesDismissed] = useState(
    () => localStorage.getItem(TEMPLATES_DISMISSED_KEY) === "true"
  );
  const [templatesOpen, setTemplatesOpen] = useState(true);

  const { data: automations = [], isLoading } = useQuery<CrmAutomation[]>({
    queryKey: ["/api/crm/automations"],
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/crm/automations/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/automations"] });
      toast({
        title: "Automation updated",
        description: "Automation status has been updated",
      });
    },
  });

  const deleteAutomationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/crm/automations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/automations"] });
      toast({
        title: "Automation deleted",
        description: "The automation has been deleted",
      });
    },
  });

  const activeCount = automations.filter((a) => a.isActive).length;
  const pausedCount = automations.length - activeCount;

  const triggerTypes = useMemo(() => {
    const types = new Set<string>();
    automations.forEach((a) => {
      if (a.triggerType) types.add(a.triggerType);
    });
    return Array.from(types);
  }, [automations]);

  const filteredAutomations = useMemo(() => {
    return automations.filter((a) => {
      if (statusFilter === "active" && !a.isActive) return false;
      if (statusFilter === "paused" && a.isActive) return false;
      if (triggerFilter !== "all" && a.triggerType !== triggerFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = a.name?.toLowerCase().includes(q);
        const descMatch = a.description?.toLowerCase().includes(q);
        if (!nameMatch && !descMatch) return false;
      }
      return true;
    });
  }, [automations, statusFilter, triggerFilter, searchQuery]);

  const hasActiveFilters = searchQuery || statusFilter !== "all" || triggerFilter !== "all";

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setTriggerFilter("all");
  }

  function dismissTemplates() {
    setTemplatesDismissed(true);
    localStorage.setItem(TEMPLATES_DISMISSED_KEY, "true");
  }

  const showTemplates = !templatesDismissed || automations.length === 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center mb-3">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
            </div>
            <p className="text-sm text-gray-400">Loading automations...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style>{`
        @keyframes automations-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .automations-stagger-1 { animation: automations-fade-up 0.5s ease-out both; animation-delay: 0.05s; }
        .automations-stagger-2 { animation: automations-fade-up 0.5s ease-out both; animation-delay: 0.1s; }
        .automations-stagger-3 { animation: automations-fade-up 0.5s ease-out both; animation-delay: 0.15s; }
      `}</style>
      <div className="container mx-auto p-4 sm:p-6 bg-transparent" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Hero Header — condensed */}
        <div className="automations-stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-800/80 dark:via-gray-900 dark:to-gray-800/60 border border-amber-200/40 dark:border-amber-500/10 p-5 sm:p-6 mb-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-200/40 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-200/30 to-transparent dark:from-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-400/60 font-semibold">Workflow Engine</p>
              <h1 className="text-2xl sm:text-3xl text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Automations
              </h1>
            </div>
          </div>
        </div>

        {/* Template Banner — collapsible, dismissible */}
        {showTemplates && (
          <div className="automations-stagger-2 mb-4">
            <div className="rounded-xl border border-amber-200/40 dark:border-amber-500/10 bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5">
                <button
                  onClick={() => setTemplatesOpen(!templatesOpen)}
                  className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Quick Setup Templates
                  <ChevronUp className={`h-3.5 w-3.5 transition-transform ${templatesOpen ? "" : "rotate-180"}`} />
                </button>
                {automations.length > 0 && (
                  <button
                    onClick={dismissTemplates}
                    className="text-amber-500/60 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                    aria-label="Dismiss templates"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {templatesOpen && (
                <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
                  {[
                    { icon: Mail, label: "New Lead Welcome" },
                    { icon: MessageSquare, label: "Estimate Follow-up" },
                    { icon: Zap, label: "Payment Reminder" },
                    { icon: Clock, label: "Inactive Lead Nurture" },
                  ].map((tmpl, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200/50 dark:border-amber-700/30 bg-white/70 dark:bg-gray-800/50 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap flex-shrink-0"
                    >
                      <tmpl.icon className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      {tmpl.label}
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-500/20 text-[9px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-300">
                        Soon
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toolbar Row */}
        {automations.length > 0 && (
          <div className="automations-stagger-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            {/* Search */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search automations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-lg border-gray-200/80 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/50 text-sm"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center bg-gray-100/80 dark:bg-gray-800/60 rounded-lg p-0.5 text-xs font-medium">
              {(["all", "active", "paused"] as const).map((status) => {
                const count = status === "all" ? automations.length : status === "active" ? activeCount : pausedCount;
                const isSelected = statusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                      isSelected
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {status} <span className="text-gray-400 dark:text-gray-500 ml-0.5">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Trigger Filter */}
            {triggerTypes.length > 0 && (
              <Select value={triggerFilter} onValueChange={setTriggerFilter}>
                <SelectTrigger className="h-9 w-auto min-w-[140px] rounded-lg border-gray-200/80 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/50 text-xs">
                  <SelectValue placeholder="All triggers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All triggers</SelectItem>
                  {triggerTypes.map((t) => (
                    <SelectItem key={t} value={t}>{getTriggerLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Spacer + CTA */}
            <div className="sm:ml-auto">
              <Link href="/automations/create">
                <Button
                  data-testid="button-create-automation"
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-500/25 px-5 h-9 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Automation
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Automation list */}
        {automations.length === 0 ? (
          <div className="automations-stagger-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 flex items-center justify-center mb-4 border border-amber-200/60 dark:border-amber-700/30">
                <Zap className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                No automations yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 max-w-sm">
                Create your first automation to streamline your sales process and save time
              </p>
              <Link href="/automations/create">
                <Button data-testid="button-create-first-automation" className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-500/25 px-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Automation
                </Button>
              </Link>
            </div>
          </div>
        ) : filteredAutomations.length === 0 ? (
          /* No filter results */
          <div className="automations-stagger-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Search className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No automations match your filters</p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="rounded-full text-xs border-gray-200/80 dark:border-gray-700/60"
              >
                Clear filters
              </Button>
            </div>
          </div>
        ) : (
          /* Compact automation rows */
          <div className="automations-stagger-3 rounded-xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm divide-y divide-gray-100 dark:divide-gray-700/40 overflow-hidden">
            {filteredAutomations.map((automation) => (
              <div
                key={automation.id}
                data-testid={`automation-card-${automation.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors group"
              >
                {/* Status dot */}
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    automation.isActive
                      ? "bg-emerald-500 shadow-sm shadow-emerald-500/40"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />

                {/* Trigger icon */}
                <span className={`flex-shrink-0 ${automation.isActive ? "text-amber-600 dark:text-amber-400" : "text-gray-400 dark:text-gray-500"}`}>
                  {getTriggerIcon(automation.triggerType || "")}
                </span>

                {/* Name + badge + description */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {automation.name}
                  </span>
                  <span className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold flex-shrink-0 ${
                    automation.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    {automation.isActive ? "Active" : "Paused"}
                  </span>
                  {automation.description && (
                    <span className="hidden lg:inline text-xs text-gray-400 dark:text-gray-500 truncate">
                      — {automation.description}
                    </span>
                  )}
                </div>

                {/* Trigger label — hidden on small */}
                <span className="hidden md:inline-flex text-[10px] uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {getTriggerLabel(automation.triggerType || "")}
                </span>

                {/* Date — hidden on small */}
                <span className="hidden lg:inline-flex text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">
                  {format(new Date(automation.createdAt), "MMM d, yyyy")}
                </span>

                {/* Switch toggle */}
                <Switch
                  checked={automation.isActive}
                  onCheckedChange={(checked) =>
                    toggleAutomationMutation.mutate({ id: automation.id, isActive: checked })
                  }
                  data-testid={`button-toggle-${automation.id}`}
                />

                {/* Action menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <Link href={`/automations/${automation.id}`}>
                      <DropdownMenuItem data-testid={`button-edit-automation-${automation.id}`} className="cursor-pointer">
                        <Settings className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                      data-testid={`button-delete-${automation.id}`}
                      className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this automation?")) {
                          deleteAutomationMutation.mutate(automation.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Image, Search, Check, X, Wand2, Loader2, ChevronDown, SlidersHorizontal } from "lucide-react";

interface Icon {
  id: number;
  name: string;
  filename: string;
  category: string;
  groupId?: number | null;
  group?: {
    id: number;
    displayName: string;
  } | null;
  tags?: Array<{
    id: number;
    displayName: string;
  }>;
  description?: string;
  isActive: boolean;
  url: string;
}

interface IconSelectorProps {
  selectedIconId?: number;
  onIconSelect: (iconId: number | null, iconUrl: string | null) => void;
  showApplyGroupToAllServices?: boolean;
  onApplyGroupToAllServices?: (groupId: number) => void;
  isApplyingGroupToAllServices?: boolean;
  triggerText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  triggerVariant?: "default" | "outline";
  triggerClassName?: string;
}

export default function IconSelector({ 
  selectedIconId, 
  onIconSelect, 
  showApplyGroupToAllServices = false,
  onApplyGroupToAllServices,
  isApplyingGroupToAllServices = false,
  triggerText = "Select Icon",
  size = "md",
  className = "",
  triggerVariant = "default",
  triggerClassName = "",
}: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedApplyGroupId, setSelectedApplyGroupId] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [applyGroupOpen, setApplyGroupOpen] = useState(false);

  const { data: icons, isLoading } = useQuery<Icon[]>({
    queryKey: ['/api/icons'],
    enabled: isOpen,
  });
  const { data: iconGroups = [] } = useQuery<Array<{ id: number; displayName: string }>>({
    queryKey: ['/api/icon-groups', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/icon-groups?active=true');
      if (!response.ok) throw new Error('Failed to fetch icon groups');
      return response.json();
    },
    enabled: isOpen && showApplyGroupToAllServices,
  });

  useEffect(() => {
    if (isOpen && showApplyGroupToAllServices && !selectedApplyGroupId && iconGroups.length > 0) {
      setSelectedApplyGroupId(String(iconGroups[0].id));
    }
  }, [iconGroups, isOpen, selectedApplyGroupId, showApplyGroupToAllServices]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    setFiltersOpen(window.innerWidth >= 768);
    setApplyGroupOpen(window.innerWidth >= 768);
  }, [isOpen]);

  const activeIcons = icons?.filter(icon => icon.isActive) || [];

  const groups = Array.from(
    new Map(
      activeIcons
        .filter((icon) => icon.group)
        .map((icon) => [String(icon.group!.id), icon.group!]),
    ).values(),
  );

  const tags = Array.from(
    new Map(
      activeIcons
        .flatMap((icon) => icon.tags || [])
        .map((tag) => [String(tag.id), tag]),
    ).values(),
  );

  const filteredIcons = activeIcons.filter(icon => {
    const matchesSearch = icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         icon.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === "all" || String(icon.groupId || "ungrouped") === selectedGroup;
    const matchesTag = selectedTag === "all" || (icon.tags || []).some((tag) => String(tag.id) === selectedTag);
    return matchesSearch && matchesGroup && matchesTag;
  });

  const selectedIcon = icons?.find(icon => icon.id === selectedIconId);

  const handleIconSelect = (icon: Icon) => {
    onIconSelect(icon.id, icon.url);
    setIsOpen(false);
  };

  const handleRemoveIcon = () => {
    onIconSelect(null, null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const buttonSizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base"
  };

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {selectedIcon && (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-amber-50/60 dark:bg-amber-900/15 border-amber-200/70 dark:border-amber-700/30">
          <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center overflow-hidden">
            <img 
              src={selectedIcon.url} 
              alt={selectedIcon.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{selectedIcon.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedIcon.category}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRemoveIcon}
            className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          <Button 
            variant={selectedIcon ? "outline" : triggerVariant}
            className={`${buttonSizeClasses[size]} ${triggerClassName}`.trim()}
          >
            <Image className="h-4 w-4 mr-2" />
            {selectedIcon ? "Change Icon" : triggerText}
          </Button>
        </DialogTrigger>
        <DialogContent className="flex h-[92vh] w-[calc(100vw-0.75rem)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-white/95 via-amber-50/40 to-orange-50/40 p-3 shadow-2xl shadow-amber-500/10 backdrop-blur-xl dark:border-amber-500/20 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-800/95 sm:h-auto sm:max-h-[85vh] sm:w-[calc(100vw-1.5rem)] sm:p-6">
          <DialogHeader className="shrink-0 pr-8 sm:pr-0">
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Image className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Select Service Icon
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
            {showApplyGroupToAllServices && iconGroups.length > 0 && onApplyGroupToAllServices && (
              <Collapsible open={applyGroupOpen} onOpenChange={setApplyGroupOpen}>
                <div className="shrink-0 rounded-xl border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="-m-1 flex h-auto w-[calc(100%+0.5rem)] items-start justify-between gap-3 whitespace-normal rounded-xl px-1 py-1 text-left hover:bg-amber-100/60 dark:hover:bg-amber-500/10"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex min-w-0 items-start gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                          <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span className="min-w-0 break-words">
                            Apply Group Icons To All Services
                          </span>
                        </div>
                        <p className="min-w-0 whitespace-normal break-words text-sm text-gray-600 dark:text-gray-400">
                          Replace all service icons in this account using the closest match from a saved icon group.
                        </p>
                      </div>
                      <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 transition-transform ${applyGroupOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Select value={selectedApplyGroupId} onValueChange={setSelectedApplyGroupId}>
                        <SelectTrigger className="w-full rounded-xl border-gray-200/80 bg-white/90 dark:border-gray-700 dark:bg-gray-800/80 sm:w-56">
                          <SelectValue placeholder="Select an icon group" />
                        </SelectTrigger>
                        <SelectContent>
                          {iconGroups.map((group) => (
                            <SelectItem key={group.id} value={String(group.id)}>
                              {group.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        disabled={!selectedApplyGroupId || isApplyingGroupToAllServices}
                        onClick={() => onApplyGroupToAllServices(Number(selectedApplyGroupId))}
                        className="sm:w-auto"
                      >
                        {isApplyingGroupToAllServices ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Applying
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Apply Group
                          </>
                        )}
                      </Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}

            {/* Search and Filter Controls */}
            <div className="shrink-0 space-y-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search icons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-xl border-gray-200/80 bg-white/90 pl-10 dark:border-gray-700 dark:bg-gray-800/80"
                />
              </div>
              <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full justify-between rounded-xl border-gray-200/80 bg-white/90 text-sm font-medium dark:border-gray-700 dark:bg-gray-800/80"
                  >
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      Filters
                      {(selectedGroup !== "all" || selectedTag !== "all") && (
                        <Badge variant="secondary" className="ml-1 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          Active
                        </Badge>
                      )}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger className="h-11 w-full rounded-xl border-gray-200/80 bg-white/90 dark:border-gray-700 dark:bg-gray-800/80 md:w-52">
                        <SelectValue placeholder="Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Groups</SelectItem>
                        <SelectItem value="ungrouped">Ungrouped</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={String(group.id)}>
                            {group.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedTag} onValueChange={setSelectedTag}>
                      <SelectTrigger className="h-11 w-full rounded-xl border-gray-200/80 bg-white/90 dark:border-gray-700 dark:bg-gray-800/80 md:w-52">
                        <SelectValue placeholder="Service Tag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Service Tags</SelectItem>
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={String(tag.id)}>
                            {tag.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Stats */}
            <div className="shrink-0 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{filteredIcons.length} icons available</span>
              {selectedGroup !== "all" && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  {selectedGroup === "ungrouped" ? "Ungrouped" : groups.find((group) => String(group.id) === selectedGroup)?.displayName}
                </Badge>
              )}
              {selectedTag !== "all" && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  {tags.find((tag) => String(tag.id) === selectedTag)?.displayName}
                </Badge>
              )}
            </div>

            {/* Icon Grid */}
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-4 md:grid-cols-6 lg:grid-cols-8">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-gray-200 rounded-xl mb-2"></div>
                      <div className="h-3.5 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredIcons.length > 0 ? (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-4 md:grid-cols-6 lg:grid-cols-8">
                  {filteredIcons.map((icon) => (
                    <button
                      key={icon.id}
                      onClick={() => handleIconSelect(icon)}
                      className={`group rounded-2xl border-2 p-2.5 transition-all hover:shadow-md sm:p-3 ${
                        selectedIconId === icon.id 
                          ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600'
                      }`}
                    >
                      <div className="relative mb-1.5 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white p-2 dark:bg-gray-800 sm:mb-2.5 sm:p-1.5">
                        <img
                          src={icon.url}
                          alt={icon.name}
                          className="max-h-full max-w-full object-contain scale-110 sm:scale-100"
                        />
                        {selectedIconId === icon.id && (
                          <div className="absolute top-1.5 right-1.5 h-5 w-5 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                            <Check className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="truncate text-[11px] font-medium text-gray-900 group-hover:text-amber-700 dark:text-gray-100 dark:group-hover:text-amber-300 sm:text-xs">
                        {icon.name}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Image className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                  <p>No icons found matching your criteria</p>
                  {searchQuery && (
                    <Button
                      variant="link"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedGroup("all");
                        setSelectedTag("all");
                      }}
                      className="text-sm text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Image, Search, Check, X } from "lucide-react";

interface Icon {
  id: number;
  name: string;
  filename: string;
  category: string;
  description?: string;
  isActive: boolean;
  url: string;
}

interface IconSelectorProps {
  selectedIconId?: number;
  onIconSelect: (iconId: number | null, iconUrl: string | null) => void;
  triggerText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  triggerVariant?: "default" | "outline";
  triggerClassName?: string;
}

export default function IconSelector({ 
  selectedIconId, 
  onIconSelect, 
  triggerText = "Select Icon",
  size = "md",
  className = "",
  triggerVariant = "default",
  triggerClassName = "",
}: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: icons, isLoading } = useQuery<Icon[]>({
    queryKey: ['/api/icons'],
    enabled: isOpen,
  });

  const activeIcons = icons?.filter(icon => icon.isActive) || [];
  
  const categories = [
    { value: "all", label: "All Categories" },
    { value: "construction", label: "Construction" },
    { value: "cleaning", label: "Cleaning" },
    { value: "automotive", label: "Automotive" },
    { value: "landscaping", label: "Landscaping" },
    { value: "home", label: "Home Services" },
    { value: "general", label: "General" }
  ];

  const filteredIcons = activeIcons.filter(icon => {
    const matchesSearch = icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         icon.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || icon.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedIcon = icons?.find(icon => icon.id === selectedIconId);

  const handleIconSelect = (icon: Icon) => {
    onIconSelect(icon.id, icon.url);
    setIsOpen(false);
  };

  const handleRemoveIcon = () => {
    onIconSelect(null, null);
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
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant={selectedIcon ? "outline" : triggerVariant}
            className={`${buttonSizeClasses[size]} ${triggerClassName}`.trim()}
          >
            <Image className="h-4 w-4 mr-2" />
            {selectedIcon ? "Change Icon" : triggerText}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-br from-white/95 via-amber-50/40 to-orange-50/40 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-800/95 backdrop-blur-xl shadow-2xl shadow-amber-500/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Image className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Select Service Icon
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search icons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 rounded-xl border-gray-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{filteredIcons.length} icons available</span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  {categories.find(c => c.value === selectedCategory)?.label}
                </Badge>
              )}
            </div>

            {/* Icon Grid */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="grid grid-cols-6 md:grid-cols-8 gap-3">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredIcons.length > 0 ? (
                <div className="grid grid-cols-6 md:grid-cols-8 gap-3">
                  {filteredIcons.map((icon) => (
                    <button
                      key={icon.id}
                      onClick={() => handleIconSelect(icon)}
                      className={`p-3 rounded-xl border-2 transition-all hover:shadow-md group ${
                        selectedIconId === icon.id 
                          ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600'
                      }`}
                    >
                      <div className="aspect-square bg-white dark:bg-gray-800 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                        <img
                          src={icon.url}
                          alt={icon.name}
                          className="max-w-full max-h-full object-contain"
                        />
                        {selectedIconId === icon.id && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                            <Check className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300">
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
                        setSelectedCategory("all");
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

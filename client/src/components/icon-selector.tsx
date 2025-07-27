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
}

export default function IconSelector({ 
  selectedIconId, 
  onIconSelect, 
  triggerText = "Select Icon",
  size = "md" 
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
    <div className="space-y-2">
      {selectedIcon && (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
          <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center overflow-hidden">
            <img 
              src={selectedIcon.url} 
              alt={selectedIcon.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{selectedIcon.name}</p>
            <p className="text-sm text-gray-500">{selectedIcon.category}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRemoveIcon}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant={selectedIcon ? "outline" : "default"}
            className={buttonSizeClasses[size]}
          >
            <Image className="h-4 w-4 mr-2" />
            {selectedIcon ? "Change Icon" : triggerText}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Select Service Icon
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search icons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
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
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{filteredIcons.length} icons available</span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="text-xs">
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
                      className={`p-3 rounded-lg border-2 transition-all hover:shadow-md group ${
                        selectedIconId === icon.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-square bg-white rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                        <img
                          src={icon.url}
                          alt={icon.name}
                          className="max-w-full max-h-full object-contain"
                        />
                        {selectedIconId === icon.id && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 truncate group-hover:text-blue-600">
                        {icon.name}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Image className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No icons found matching your criteria</p>
                  {searchQuery && (
                    <Button
                      variant="link"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                      className="text-sm"
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
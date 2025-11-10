import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Menu, X, Home, Calculator, Settings, Palette, Code, Calendar, Users, BarChart3, ClipboardList, FileText, CheckSquare, MessageCircle, User, Mail, Shield, Globe, LogOut, ChevronDown, ChevronRight, HelpCircle, Zap, CreditCard, Bell, Search, Phone, Workflow } from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import SupportContact from "@/components/support-contact";
import NotificationDropdown from "@/components/notifications/notification-dropdown";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      
      // Clear authentication cache
      queryClient.clear();
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Auto-expand the group containing the active page
  useEffect(() => {
    const allGroups = { ...navGroups, ...settingsGroup };
    Object.entries(allGroups).forEach(([groupKey, group]) => {
      const hasActivePage = group.items.some((item: any) => {
        if (item.href === "/") {
          return location === "/";
        }
        // Check main item
        if (location.startsWith(item.href)) {
          return true;
        }
        // Check subitems if they exist
        if (item.subItems) {
          return item.subItems.some((subItem: any) => location.startsWith(subItem.href));
        }
        return false;
      });
      
      if (hasActivePage) {
        setExpandedGroups(prev => {
          const newSet = new Set(prev);
          newSet.add(groupKey);
          return newSet;
        });
      }
    });
  }, [location, isSuperAdmin]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const navGroups = {
    build: {
      title: "Build",
      icon: Home,
      items: [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Design", href: "/design", icon: Palette },
        { name: "Logic", href: "/form-settings", icon: Settings },
        { name: "Formulas", href: "/formulas", icon: Calculator },
        { name: "Custom Forms", href: "/custom-forms", icon: FileText },
        { name: "Website", href: "/website", icon: Globe },
      ]
    },
    manage: {
      title: "Manage",
      icon: BarChart3,
      items: [
        { name: "Calendar", href: "/calendar", icon: Calendar },
        { name: "Leads", href: "/leads", icon: ClipboardList },
        { name: "Automations", href: "/crm/automations", icon: Workflow },
        ...(isSuperAdmin ? [
          { name: "Proposal Center", href: "/proposals", icon: FileText },
          { name: "Bid Requests", href: "/bid-requests", icon: CheckSquare },
        ] : []),
        { name: "Email Settings", href: "/email-settings", icon: Mail },
        { name: "Stats", href: "/stats", icon: BarChart3 },
        { name: "Embed Code", href: "/embed-code", icon: Code },
        // { name: "Estimates", href: "/estimates", icon: FileText },
      ]
    }
  };

  const settingsGroup = {
    settings: {
      title: "Settings",
      icon: Settings,
      items: [
        { name: "Profile", href: "/profile", icon: User },
        { name: "Integrations", href: "/integrations", icon: Zap },
        { name: "Call Screen", href: "/call-screen", icon: Phone },
        ...(isSuperAdmin ? [{ name: "Admin Dashboard", href: "/admin", icon: Shield }] : []),
      ]
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <Link href="/">
          <div className="flex items-center cursor-pointer group">
            <img 
              src={autobidderLogo} 
              alt="Logo" 
              className="h-8 w-8 transition-transform group-hover:scale-105"
            />
            <span className="ml-3 text-lg font-semibold text-gray-900">Autobidder</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {Object.entries(navGroups).map(([groupKey, group]) => (
          <div key={groupKey}>
            <button
              onClick={() => toggleGroup(groupKey)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <group.icon className="w-4 h-4 mr-3" />
                {group.title}
              </div>
              {expandedGroups.has(groupKey) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {expandedGroups.has(groupKey) && (
              <div className="ml-7 mt-1 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}>
                      <div className={cn(
                        "flex items-center px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
                        isActive(item.href)
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}>
                        <Icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Settings Section */}
        <div className="pt-4 border-t border-gray-200">
          {Object.entries(settingsGroup).map(([groupKey, group]) => (
            <div key={groupKey}>
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <group.icon className="w-4 h-4 mr-3" />
                  {group.title}
                </div>
                {expandedGroups.has(groupKey) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {expandedGroups.has(groupKey) && (
                <div className="ml-7 mt-1 space-y-1">
                  {group.items.map((item: any) => {
                    const Icon = item.icon;
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    
                    return (
                      <div key={item.name}>
                        <Link href={item.href}>
                          <div className={cn(
                            "flex items-center px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
                            isActive(item.href)
                              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          )}>
                            <Icon className="w-4 h-4 mr-3" />
                            {item.name}
                          </div>
                        </Link>
                        
                        {hasSubItems && (
                          <div className="ml-7 mt-1 space-y-1">
                            {item.subItems.map((subItem: any) => {
                              const SubIcon = subItem.icon;
                              return (
                                <Link key={subItem.name} href={subItem.href}>
                                  <div className={cn(
                                    "flex items-center px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
                                    isActive(subItem.href)
                                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                  )}>
                                    <SubIcon className="w-4 h-4 mr-3" />
                                    {subItem.name}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Support Section */}
      <div className="p-4 border-t border-gray-200">
        <SupportContact 
          trigger={
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <HelpCircle className="w-4 h-4 mr-3" />
              Support
            </Button>
          }
        />
      </div>

      {/* User section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {(user as any)?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 truncate">
                {(user as any)?.email || 'User'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="fixed top-4 left-4 bottom-4 w-64 bg-white rounded-2xl shadow-lg overflow-hidden z-40">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-out" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="fixed inset-y-4 left-4 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-out animate-in slide-in-from-left overflow-hidden flex flex-col">
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-72">
        {/* Top Header Bar - Always visible */}
        <header className="sticky top-0 z-50 mt-3 mx-3 mb-3 md:mt-0 md:mx-0 md:mb-0 bg-transparent">
          <div className="bg-gradient-to-r from-slate-50/90 via-blue-50/90 to-indigo-50/90 md:bg-white backdrop-blur-xl md:backdrop-blur-none shadow-xl md:shadow-sm border border-white/40 md:border-b md:border-t-0 md:border-l-0 md:border-r-0 md:border-gray-200 rounded-full md:rounded-none px-4 py-3 lg:px-6">
            <div className="flex items-center justify-between">
            {/* Left side - Mobile menu button (only on mobile) */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              {/* Logo on mobile only */}
              <img 
                src={autobidderLogo} 
                alt="Logo" 
                className="h-6 w-6 lg:hidden ml-2"
              />
              
              {/* Search bar (desktop only) */}
              <div className="hidden lg:flex items-center ml-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Right side - Notifications and Profile */}
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <NotificationDropdown />

              {/* Profile Icon */}
              <div className="flex items-center">
                <Link href="/profile">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </Link>
                <div className="ml-2 hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                    {(user as any)?.email || 'User'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 -mt-20 pt-24 md:mt-0 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
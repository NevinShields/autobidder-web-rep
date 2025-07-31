import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Menu, X, Home, Calculator, Settings, Palette, Code, Calendar, Users, BarChart3, ClipboardList, FileText, CheckSquare, MessageCircle, User, Mail, Shield, Globe, LogOut, ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import SupportContact from "@/components/support-contact";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['build', 'manage']));
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
        { name: "Bid Requests", href: "/bid-requests", icon: CheckSquare },
        { name: "Estimates", href: "/estimates", icon: FileText },
      ]
    }
  };

  const settingsItems = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Email Settings", href: "/email-settings", icon: Mail },
    { name: "Email Templates", href: "/email-templates", icon: FileText },
    { name: "Team", href: "/users", icon: Users },
    { name: "Stats", href: "/stats", icon: BarChart3 },
    { name: "Embed Code", href: "/embed-code", icon: Code },
    ...(isSuperAdmin ? [{ name: "Admin Dashboard", href: "/admin", icon: Shield }] : []),
  ];

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
            <span className="ml-3 text-lg font-semibold text-gray-900">PriceBuilder Pro</span>
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
          <div className="space-y-1">
            {settingsItems.map((item) => {
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
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-64 bg-white shadow-xl">
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <img 
            src={autobidderLogo} 
            alt="Logo" 
            className="h-6 w-6"
          />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {children}
        </main>
      </div>
    </div>
  );
}
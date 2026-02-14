import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Home, Calculator, Settings, Palette, Code, Calendar, Users, BarChart3, ClipboardList, FileText, CheckSquare, MessageCircle, User, Mail, Shield, Globe, LogOut, ChevronDown, ChevronRight, HelpCircle, Zap, CreditCard, Bell, Search, Phone, Workflow, Image, Moon, Sun, Video, Layers, Briefcase, ChevronsLeft } from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import SupportContact from "@/components/support-contact";
import NotificationDropdown from "@/components/notifications/notification-dropdown";
import { SupportHelpButton } from "@/components/support-help-button";
import { useTheme } from "@/hooks/use-theme";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

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
        if (isActive(item.href)) {
          return true;
        }
        // Check subitems if they exist
        if (item.subItems) {
          return item.subItems.some((subItem: any) => isActive(subItem.href));
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
      title: "BUILD",
      icon: Layers,
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
      title: "MANAGE",
      icon: Briefcase,
      items: [
        { name: "Calendar", href: "/calendar", icon: Calendar },
        { name: "Customers", href: "/leads", icon: ClipboardList },
        { name: "Call Screen", href: "/call-screen", icon: Phone },
        { name: "Photos", href: "/photos", icon: Image },
        { name: "Automations", href: "/crm/automations", icon: Workflow },
        { name: "Email Settings", href: "/email-settings", icon: Mail },
        { name: "Estimate Page Editor", href: "/estimate-page-settings", icon: FileText },
        { name: "Stats", href: "/stats", icon: BarChart3 },
        { name: "Embed Code", href: "/embed-code", icon: Code },
      ]
    }
  };

  const settingsGroup = {
    settings: {
      title: "SETTINGS",
      icon: Settings,
      items: [
        { name: "Profile", href: "/profile", icon: User },
        { name: "Integrations", href: "/integrations", icon: Zap },
        ...(isSuperAdmin ? [
          { name: "Admin Dashboard", href: "/admin", icon: Shield },
          { name: "Support Videos", href: "/admin/support-videos", icon: Video },
        ] : []),
      ]
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    if (href === "/formulas" && (location.startsWith("/formula-builder") || location.startsWith("/formula/"))) {
      return true;
    }
    return location.startsWith(href);
  };

  const renderNavItem = (item: any) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link key={item.name} href={item.href}>
        <div
          className={cn(
            "group relative flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-xl transition-all duration-200 cursor-pointer",
            active
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25"
              : "text-gray-600 dark:text-gray-400 hover:bg-amber-50/60 dark:hover:bg-amber-900/10 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <Icon className={cn(
            "w-4 h-4 flex-shrink-0 transition-colors",
            active ? "text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-amber-600 dark:group-hover:text-amber-400"
          )} />
          <span className="truncate">{item.name}</span>
        </div>
      </Link>
    );
  };

  const renderNavGroup = (groupKey: string, group: any) => {
    const isExpanded = expandedGroups.has(groupKey);
    const GroupIcon = group.icon;
    return (
      <div key={groupKey} className="mb-1">
        <button
          onClick={() => toggleGroup(groupKey)}
          className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold tracking-wider text-amber-700/50 dark:text-amber-500/40 hover:text-amber-800 dark:hover:text-amber-400 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <GroupIcon className="w-3.5 h-3.5" />
            {group.title}
          </div>
          <ChevronDown className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            !isExpanded && "-rotate-90"
          )} />
        </button>

        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="mt-0.5 space-y-0.5 pl-1">
            {group.items.map((item: any) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              return (
                <div key={item.name}>
                  {renderNavItem(item)}
                  {hasSubItems && (
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      {item.subItems.map((subItem: any) => renderNavItem(subItem))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="relative overflow-hidden px-5 py-5">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 dark:from-amber-950/20 dark:via-gray-900 dark:to-orange-950/10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/20 to-transparent dark:from-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-xl" />
        <Link href="/">
          <div className="relative flex items-center cursor-pointer group">
            <div className="relative">
              <img
                src={autobidderLogo}
                alt="Logo"
                className="h-9 w-9 transition-transform duration-200 group-hover:scale-110"
              />
            </div>
            <div className="ml-3">
              <span className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Autobidder</span>
              <span className="block text-[10px] font-semibold text-amber-600/60 dark:text-amber-500/40 tracking-[0.15em]">PRICING PLATFORM</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
        {Object.entries(navGroups).map(([groupKey, group]) =>
          renderNavGroup(groupKey, group)
        )}

        {/* Divider */}
        <div className="!my-3 mx-2 border-t border-amber-200/40 dark:border-amber-500/10" />

        {/* Settings Section */}
        {Object.entries(settingsGroup).map(([groupKey, group]) =>
          renderNavGroup(groupKey, group)
        )}
      </nav>

      {/* Support Card */}
      <div className="mx-3 mb-3">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3.5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-200/30 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                <HelpCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">Need help?</span>
            </div>
            <p className="text-[11px] text-amber-700/70 dark:text-amber-400/50 mb-2.5 leading-relaxed">Get in touch with our support team for assistance.</p>
            <SupportContact
              trigger={
                <button className="w-full py-1.5 px-3 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-lg transition-all duration-200 shadow-sm shadow-amber-500/20 hover:shadow-md hover:shadow-amber-500/30">
                  Contact Support
                </button>
              }
            />
          </div>
        </div>
      </div>

      {/* User section */}
      <div className="p-3 border-t border-amber-200/30 dark:border-amber-500/10">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm shadow-amber-500/20">
              <span className="text-sm font-semibold text-white">
                {(user as any)?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-gray-900 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {(user as any)?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
              {(user as any)?.email || ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50/50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 bottom-0 w-[260px] bg-white dark:bg-gray-900 border-r border-amber-200/40 dark:border-amber-500/10 overflow-hidden z-40">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm transition-opacity duration-300 ease-out"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[280px] max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-900 shadow-2xl dark:shadow-gray-950/80 transform transition-all duration-300 ease-out animate-in slide-in-from-left overflow-hidden flex flex-col">
            <div className="absolute top-4 right-3 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="h-full overflow-y-auto scrollbar-thin">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-[260px]">
        {/* Top Header Bar - Always visible */}
        <header className="sticky top-0 z-50 mt-3 mx-3 mb-3 md:mt-0 md:mx-0 md:mb-0 bg-transparent">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl md:bg-white md:dark:bg-gray-900 shadow-sm md:shadow-none border border-gray-200/50 dark:border-gray-800/50 md:border-b md:border-t-0 md:border-l-0 md:border-r-0 md:border-gray-200/80 md:dark:border-gray-800 rounded-2xl md:rounded-none px-4 py-3 lg:px-6">
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
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-72 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 focus:bg-white dark:focus:bg-gray-800 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Right side - Notifications, Theme Toggle and Profile */}
            <div className="flex items-center gap-1">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-9 w-9 p-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                {theme === "light" ? (
                  <Moon className="w-[18px] h-[18px]" />
                ) : (
                  <Sun className="w-[18px] h-[18px]" />
                )}
              </Button>

              {/* Call Screen Link */}
              <Link href="/call-screen">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                  <Phone className="w-[18px] h-[18px]" />
                </Button>
              </Link>

              {/* Page Support Help Button */}
              <SupportHelpButton />

              {/* Notification Bell */}
              <NotificationDropdown />

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

              {/* Profile Icon */}
              <div className="flex items-center">
                <Link href="/profile">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center cursor-pointer hover:shadow-md hover:shadow-amber-500/25 transition-all duration-200">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </Link>
                <div className="ml-2 hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                    {(user as any)?.email?.split('@')[0] || 'User'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-950 -mt-20 pt-24 md:mt-0 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}

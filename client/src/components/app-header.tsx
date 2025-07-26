import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, User, Menu, ChevronDown, Calculator, Settings, Users, BarChart3, Palette, Calendar, ClipboardList, Home, Code, X, ChevronRight, Globe, FileText, Shield, MessageCircle, LogOut, Eye, Mail, CheckSquare } from "lucide-react";
import { useState, useEffect } from "react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";
import { useAuth } from "@/hooks/useAuth";

export default function AppHeader() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSuperAdmin } = useAuth();

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

  const navGroups = {
    build: [
      { name: "Dashboard", href: "/", icon: Home },
      { name: "Formulas", href: "/formulas", icon: Calculator },
      { name: "Services", href: "/services", icon: ClipboardList },
      { name: "Custom Forms", href: "/custom-forms", icon: FileText },
      { name: "Website", href: "/website", icon: Globe },
    ],
    customize: [
      { name: "Form Logic", href: "/form-settings", icon: Settings },
      { name: "Design", href: "/design", icon: Palette },
      { name: "Embed Code", href: "/embed-code", icon: Code },
    ],
    manage: [
      { name: "Calendar", href: "/calendar", icon: Calendar },
      { name: "Team", href: "/users", icon: Users },
      { name: "Leads", href: "/leads", icon: BarChart3 },
      { name: "Bid Requests", href: "/bid-requests", icon: CheckSquare },
      { name: "Estimates", href: "/estimates", icon: FileText },
      { name: "Stats", href: "/stats", icon: BarChart3 },
      { name: "Support", href: "/support-tickets", icon: MessageCircle },
    ],
    settings: [
      { name: "Profile", href: "/profile", icon: User },
      { name: "Business Settings", href: "/business-settings", icon: Settings },
      { name: "Email Settings", href: "/email-settings", icon: Mail },
      ...(isSuperAdmin ? [{ name: "Admin Dashboard", href: "/admin", icon: Shield }] : []),
    ]
  };

  return (
    <header className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 shadow-lg border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer group">
                <img 
                  src={autobidderLogo} 
                  alt="Logo" 
                  className="h-8 w-8 transition-transform group-hover:scale-105"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                  Build <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                {navGroups.build.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="flex items-center cursor-pointer">
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                  Customize <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                {navGroups.customize.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="flex items-center cursor-pointer">
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                  Manage <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                {navGroups.manage.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="flex items-center cursor-pointer">
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                {navGroups.settings.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="flex items-center cursor-pointer">
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Link href="/support-tickets">
              <Button size="sm" variant="outline" className="text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-gray-300 hover:border-blue-300 transition-all duration-200">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </Link>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-3 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 active:scale-95"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                  <User className="h-4 w-4 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/api/logout" className="flex items-center cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Slide-out Panel */}
            <div className="fixed top-0 right-0 h-screen w-80 max-w-[90vw] bg-white shadow-2xl z-50 lg:hidden transform transition-transform ease-in-out duration-300 flex flex-col">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <img 
                    src={autobidderLogo} 
                    alt="Logo" 
                    className="h-7 w-7 filter brightness-0 invert"
                  />
                  <span className="text-lg font-bold text-white">PriceBuilder Pro</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-b border-gray-100 flex-shrink-0 space-y-3">
                <Link href="/formula/new">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl shadow-sm transition-all transform hover:scale-105"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Calculator
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/embed-form">
                    <Button 
                      variant="outline" 
                      className="w-full py-2 text-sm border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  </Link>
                  <Link href="/embed-code">
                    <Button 
                      variant="outline" 
                      className="w-full py-2 text-sm border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Code className="w-4 h-4 mr-1" />
                      Embed
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Scrollable Navigation Groups */}
              <div className="flex-1 overflow-y-auto py-2">
                {Object.entries(navGroups).map(([groupName, items]) => (
                  <div key={groupName} className="mb-4">
                    <h3 className="px-4 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {groupName.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <div className="space-y-1 px-2">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;
                        return (
                          <Link 
                            key={item.name} 
                            href={item.href}
                            className={`
                              flex items-center px-3 py-3 text-sm font-medium rounded-xl cursor-pointer transition-all duration-200 group
                              ${isActive 
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 active:scale-95'
                              }
                            `}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className={`
                              p-2 rounded-lg mr-3 transition-colors
                              ${isActive 
                                ? 'bg-white/20 text-white' 
                                : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                              }
                            `}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span>{item.name}</span>
                            {isActive && (
                              <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* User Profile Section */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex-shrink-0 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Account</p>
                    <p className="text-xs text-gray-500">Manage your settings</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href="/profile">
                    <Button variant="outline" className="w-full justify-start text-sm">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <a href="/api/logout">
                    <Button variant="outline" className="w-full justify-start text-sm text-red-600 border-red-200 hover:bg-red-50">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, User, Menu, ChevronDown, Calculator, Settings, Users, BarChart3, Palette, Calendar, ClipboardList, Home, Code, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function AppHeader() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    ],
    settings: [
      { name: "Profile", href: "/profile", icon: User },
      { name: "Business Settings", href: "/business-settings", icon: Settings },
    ]
  };

  return (
    <header className="bg-gradient-to-r from-white via-gray-50 to-white shadow-lg border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm">
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
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Build <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
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
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Customize <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
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
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Manage <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
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
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
            <Link href="/formula/new">
              <Button size="sm" variant="outline" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-300 transition-colors">
                <Plus className="w-3 h-3 mr-1.5" />
                <span className="hidden sm:inline text-sm">New Formula</span>
                <span className="sm:hidden text-sm">New</span>
              </Button>
            </Link>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors active:scale-95"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* User Profile */}
            <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
              <User className="h-4 w-4 text-white" />
            </div>
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
            <div className="fixed top-0 right-0 h-screen w-80 max-w-[85vw] bg-white shadow-2xl z-50 lg:hidden transform transition-transform ease-in-out duration-300 flex flex-col">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <img 
                    src={autobidderLogo} 
                    alt="Logo" 
                    className="h-8 w-8"
                  />
                  <span className="text-lg font-semibold text-gray-900">Menu</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Action Button */}
              <div className="p-6 border-b border-gray-100 flex-shrink-0">
                <Link href="/formula/new">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl shadow-sm transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Formula
                  </Button>
                </Link>
              </div>

              {/* Scrollable Navigation Groups */}
              <div className="flex-1 overflow-y-auto py-4">
                {Object.entries(navGroups).map(([groupName, items]) => (
                  <div key={groupName} className="mb-6">
                    <h3 className="px-6 mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {groupName}
                    </h3>
                    <div className="space-y-1 px-3">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;
                        return (
                          <Link 
                            key={item.name} 
                            href={item.href}
                            className={`
                              flex items-center justify-between px-3 py-4 mx-0 text-base font-medium rounded-xl cursor-pointer transition-all duration-200
                              ${isActive 
                                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500' 
                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                              }
                            `}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className="flex items-center">
                              <div className={`
                                p-2 rounded-lg mr-4
                                ${isActive 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-gray-100 text-gray-600'
                                }
                              `}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <ChevronRight className={`h-4 w-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* User Profile Section */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Account</p>
                    <p className="text-xs text-gray-500">Manage your settings</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

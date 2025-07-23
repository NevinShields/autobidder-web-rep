import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, User, Menu } from "lucide-react";
import { useState } from "react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function AppHeader() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/", active: location === "/" },
    { name: "Formulas", href: "/formulas", active: location.startsWith("/formula") },
    { name: "Services", href: "/services", active: location === "/services" },
    { name: "Form Logic", href: "/form-settings", active: location === "/form-settings" },
    { name: "Design", href: "/design", active: location === "/design" },
    { name: "Leads", href: "/leads", active: location === "/leads" },
    { name: "Settings", href: "/business-settings", active: location === "/business-settings" },
  ];

  return (
    <header className="bg-gradient-to-r from-white via-gray-50 to-white shadow-lg border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 flex items-center space-x-3">
              <Link href="/">
                <div className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <img 
                      src={autobidderLogo} 
                      alt="Autobidder" 
                      className="h-10 w-10 transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      PriceBuilder Pro
                    </h1>
                    <p className="text-xs text-gray-500 -mt-1">By Autobidder</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer rounded-lg ${
                  item.active
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Link href="/formula/new">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200 border-0">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">New Formula</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* User Profile */}
            <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={`block px-4 py-3 text-sm font-medium transition-colors cursor-pointer rounded-lg mx-2 ${
                  item.active
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

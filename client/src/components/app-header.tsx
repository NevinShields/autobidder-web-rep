import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";

export default function AppHeader() {
  const [location] = useLocation();

  const navItems = [
    { name: "Dashboard", href: "/", active: location === "/" },
    { name: "Formulas", href: "/formulas", active: location.startsWith("/formula") },
    { name: "Services", href: "/services", active: location === "/services" },
    { name: "Design", href: "/design", active: location === "/design" },
    { name: "Leads", href: "/leads", active: false },
    { name: "Settings", href: "/business-settings", active: location === "/business-settings" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-xl font-bold text-primary cursor-pointer">PriceBuilder Pro</h1>
              </Link>
            </div>
          </div>
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <span className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  item.active
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-primary"
                }`}>
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/formula/new">
              <Button className="bg-primary text-white hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                New Formula
              </Button>
            </Link>
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

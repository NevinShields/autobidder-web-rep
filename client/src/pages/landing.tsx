import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Users, BarChart3, Palette, Globe, ArrowRight, CheckCircle, Star } from "lucide-react";
import { Link } from "wouter";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function Landing() {
  const features = [
    {
      icon: Calculator,
      title: "Smart Calculators",
      description: "Create interactive pricing tools with complex formulas and multiple variables"
    },
    {
      icon: Users,
      title: "Lead Generation",
      description: "Automatically capture customer information and convert visitors into leads"
    },
    {
      icon: Palette,
      title: "Custom Branding",
      description: "Match your brand with custom colors, fonts, and styling options"
    },
    {
      icon: Globe,
      title: "Easy Integration",
      description: "Embed calculators anywhere with simple iframe codes - no coding required"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track performance, analyze leads, and optimize your pricing strategies"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Home Cleaning Service Owner",
      content: "PriceBuilder Pro helped me automate my quoting process. I now get 3x more leads!",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Landscaping Contractor",
      content: "The calculators are so easy to customize and my customers love the instant pricing.",
      rating: 5
    },
    {
      name: "Lisa Chen",
      role: "Window Cleaning Business",
      content: "Setup took 10 minutes and I was collecting leads the same day. Amazing platform!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={autobidderLogo} 
              alt="PriceBuilder Pro" 
              className="h-10 w-10"
            />
            <span className="text-xl font-bold text-gray-900">PriceBuilder Pro</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
          Professional Pricing Platform
        </Badge>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
          Turn Website Visitors Into 
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Paying Customers</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Create professional pricing calculators that capture leads and grow your service business. 
          No coding required - start converting visitors in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/signup">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6">
              Start Building Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-lg px-8 py-6">
            View Demo
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-4">✨ No credit card required • Setup in 5 minutes</p>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need to Capture More Leads
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional pricing tools that work on any website and convert visitors into customers
          </p>
        </div>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white/50 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Stop Losing Leads to Complicated Quote Processes
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Instant Pricing</h3>
                    <p className="text-gray-600">Customers get quotes immediately instead of waiting days</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Automatic Lead Capture</h3>
                    <p className="text-gray-600">Collect contact info before showing final prices</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Professional Appearance</h3>
                    <p className="text-gray-600">Custom-branded calculators that match your website</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Mobile-Optimized</h3>
                    <p className="text-gray-600">Works perfectly on all devices and screen sizes</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:pl-8">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">3x</div>
                <div className="text-lg text-gray-700 mb-4">More Leads Generated</div>
                <div className="text-2xl font-bold text-gray-900 mb-2">50%</div>
                <div className="text-lg text-gray-700 mb-4">Faster Quote Process</div>
                <div className="text-2xl font-bold text-gray-900 mb-2">24/7</div>
                <div className="text-lg text-gray-700">Automatic Lead Capture</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trusted by Service Professionals
          </h2>
          <p className="text-xl text-gray-600">
            See what business owners are saying about PriceBuilder Pro
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Converting More Visitors?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of service professionals who are already using PriceBuilder Pro 
            to grow their businesses.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6">
              Get Started Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-blue-100 text-sm mt-4">No setup fees • Cancel anytime • 5-minute setup</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src={autobidderLogo} 
                alt="PriceBuilder Pro" 
                className="h-8 w-8 filter brightness-0 invert"
              />
              <span className="text-xl font-bold">PriceBuilder Pro</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 PriceBuilder Pro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Users, BarChart3, Palette, Globe, ArrowRight, CheckCircle, Star, TrendingUp, Zap, Target, Award, PlayCircle, ChevronRight, DollarSign, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function Landing() {
  const benefits = [
    {
      icon: TrendingUp,
      title: "3x More Leads",
      description: "Convert 67% more website visitors into qualified leads with instant pricing"
    },
    {
      icon: Clock,
      title: "Save 15 Hours/Week",
      description: "Eliminate manual quotes and phone tag with automated pricing calculators"
    },
    {
      icon: DollarSign,
      title: "Increase Profit 25%",
      description: "Price confidently with data-driven calculators that maximize your margins"
    }
  ];

  const features = [
    {
      icon: Calculator,
      title: "AI-Powered Calculator Builder",
      description: "Create complex pricing formulas in minutes with our intelligent builder"
    },
    {
      icon: Palette,
      title: "Complete Brand Customization",
      description: "Match every color, font, and style to create seamless brand experiences"
    },
    {
      icon: Globe,
      title: "One-Click Website Integration",
      description: "Embed anywhere with copy-paste code - works on any website or platform"
    },
    {
      icon: Users,
      title: "Smart Lead Capture",
      description: "Automatically collect contact info and send leads directly to your CRM"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track conversion rates, optimize pricing, and identify your best services"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption, GDPR compliance, and 99.9% uptime guarantee"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Owner, Elite Cleaning Services",
      company: "$2.1M Revenue",
      content: "Autobidder transformed our business. We went from 20 leads per month to 65+ leads. The calculators do the selling for us!",
      rating: 5,
      image: "SJ"
    },
    {
      name: "Mike Rodriguez",
      role: "Rodriguez Landscaping",
      company: "250% Growth",
      content: "Our conversion rate jumped from 12% to 34%. Customers love getting instant quotes, and we love not chasing prospects.",
      rating: 5,
      image: "MR"
    },
    {
      name: "Lisa Chen",
      role: "Crystal Clear Windows",
      company: "15 Employees",
      content: "I was skeptical at first, but after one month we booked $47,000 in new work. This pays for itself 100x over.",
      rating: 5,
      image: "LC"
    }
  ];

  const pricingPlans = [
    {
      name: "Standard",
      price: 49,
      yearlyPrice: 41.42, // $497/year = $41.42/month
      popular: false,
      description: "Essential features for growing businesses",
      features: [
        "Custom Price Calculations",
        "Lead Generation",
        "Scheduling",
        "Custom Design Editor",
        "Custom Logic Builder",
        "Spam Filter",
        "Template Library",
        "Stats Panel",
        "Facebook Pixel Tracking",
        "Google Tracking"
      ]
    },
    {
      name: "Plus",
      price: 97,
      yearlyPrice: 80.83, // $970/year = $80.83/month
      popular: true,
      description: "Advanced features for professional businesses",
      features: [
        "Everything in Standard",
        "Location Filtering",
        "Bid Approval System",
        "Zapier Integration",
        "Website Included",
        "Team Members",
        "Multi Forms"
      ]
    },
    {
      name: "Plus SEO",
      price: 297,
      yearlyPrice: 247.50, // $2970/year = $247.50/month
      popular: false,
      description: "Complete solution with SEO services",
      features: [
        "Everything in Plus",
        "Monthly SEO Done For You",
        "Access to SEO Dashboard",
        "Premium Support"
      ]
    }
  ];

  const stats = [
    { number: "150,000+", label: "Quotes Generated" },
    { number: "2,400+", label: "Businesses Growing" },
    { number: "47%", label: "Average Conversion Increase" },
    { number: "99.9%", label: "Uptime Guarantee" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-50 sticky top-0 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                <img 
                  src={autobidderLogo} 
                  alt="Autobidder" 
                  className="h-8 w-8"
                />
              </div>
              <span className="hidden min-[400px]:block text-xl font-bold text-white">Autobidder</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white/80 hover:text-white font-medium transition-colors">Features</a>
              <a href="#testimonials" className="text-white/80 hover:text-white font-medium transition-colors">Success Stories</a>
              <a href="#pricing" className="text-white/80 hover:text-white font-medium transition-colors">Pricing</a>
              <Link href="/login">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 text-sm font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 text-sm rounded-lg backdrop-blur-sm border border-white/20 shadow-lg">
                  Start Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-white">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="mb-8 inline-block">
            <div className="bg-gradient-to-r from-blue-400/20 to-purple-400/20 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3">
              <span className="text-sm font-medium text-white/90">
                🚀 Trusted by 2,400+ Growing Businesses
              </span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Turn Website Visitors Into
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
              Paying Customers
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed">
            Stop losing leads to "I'll get back to you" responses. Give customers instant, accurate quotes 
            with AI-powered pricing calculators that convert 3x better than traditional forms.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link href="/onboarding">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-5 text-lg rounded-2xl backdrop-blur-sm border border-white/20 shadow-2xl transform hover:scale-105 transition-all duration-300">
                Start Your Free Trial
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" className="bg-white/10 hover:bg-white/20 text-white px-10 py-5 text-lg rounded-2xl backdrop-blur-sm border border-white/20 transition-all duration-300">
              <PlayCircle className="mr-3 h-5 w-5" />
              Watch 2-Min Demo
            </Button>
          </div>

          {/* Login link for existing users */}
          <div className="mb-16">
            <p className="text-white/60 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium underline">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-white/70 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                The Results Speak for Themselves
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Join thousands of service businesses who've transformed their lead generation 
              and doubled their conversion rates with intelligent pricing calculators.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/20 transform hover:-translate-y-2">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 backdrop-blur-sm border border-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-10 w-10 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{benefit.title}</h3>
                  <p className="text-white/70 text-lg leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="mb-6 inline-block">
              <div className="bg-gradient-to-r from-purple-400/20 to-pink-400/20 backdrop-blur-xl border border-white/20 rounded-full px-6 py-2">
                <span className="text-sm font-medium text-white/90">Everything You Need</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                Built for Service Businesses Like Yours
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              From simple calculators to complex multi-service pricing, we've got everything 
              you need to capture more leads and close more deals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/20 transform hover:-translate-y-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-white/70 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="mb-6 inline-block">
              <div className="bg-gradient-to-r from-green-400/20 to-blue-400/20 backdrop-blur-xl border border-white/20 rounded-full px-6 py-2">
                <span className="text-sm font-medium text-white/90">Success Stories</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                Real Results from Real Businesses
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Don't just take our word for it. See how service businesses are using 
              Autobidder to grow their revenue and streamline operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:shadow-green-500/20 transform hover:-translate-y-2">
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400/20 to-purple-400/20 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center text-blue-400 font-bold mr-4 text-lg">
                      {testimonial.image}
                    </div>
                    <div>
                      <div className="font-bold text-white">{testimonial.name}</div>
                      <div className="text-white/60 text-sm">{testimonial.role}</div>
                      <div className="text-green-400 text-sm font-medium">{testimonial.company}</div>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-white/80 italic leading-relaxed">"{testimonial.content}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800">
              Simple Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Growth Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Start free, upgrade when you're ready. All plans include our core features 
              to help you capture more leads and grow your business.
            </p>
            
            <div className="flex items-center justify-center mb-8">
              <span className="text-gray-600 mr-3">Monthly</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" />
                <div className="w-12 h-6 bg-gray-300 rounded-full"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
              <span className="text-gray-600 ml-3">Yearly</span>
              <Badge className="ml-2 bg-green-100 text-green-800">Save 20%</Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`p-8 ${plan.popular ? 'border-4 border-blue-500 relative' : 'border-2'} hover:shadow-xl transition-all duration-300`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-0">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <p className="text-sm text-gray-500">or ${plan.yearlyPrice}/month billed yearly</p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/signup-flow">
                    <Button className={`w-full py-3 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}>
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">14-day free trial • No credit card required • Cancel anytime</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-sm">🔒 SSL Secured</div>
              <div className="text-sm">💳 Stripe Payments</div>
              <div className="text-sm">📞 24/7 Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Ready to 3x Your Lead Generation?
            </span>
          </h2>
          <p className="text-xl mb-12 max-w-4xl mx-auto text-white/80 leading-relaxed">
            Join 2,400+ service businesses already using Autobidder to capture more leads, 
            save time, and grow their revenue. Start your free trial today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link href="/signup-flow">
              <Button size="lg" className="bg-gradient-to-r from-white to-blue-50 text-blue-600 hover:from-blue-50 hover:to-white px-10 py-5 text-lg font-semibold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                Start Your Free Trial
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" className="bg-white/10 hover:bg-white/20 text-white px-10 py-5 text-lg rounded-2xl backdrop-blur-sm border border-white/20 transition-all duration-300">
              Schedule Demo
            </Button>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl px-8 py-4 inline-block">
            <p className="text-white/70">
              No credit card required • 14-day free trial • Setup in under 10 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-slate-800 to-slate-900 text-white py-16">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <img 
                    src={autobidderLogo} 
                    alt="Autobidder" 
                    className="h-6 w-6"
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Autobidder
                </span>
              </div>
              <p className="text-white/60 leading-relaxed">
                The complete pricing calculator platform for service businesses. 
                Turn visitors into customers with intelligent quotes.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-white/60">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/60">
            <p>&copy; 2025 Autobidder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
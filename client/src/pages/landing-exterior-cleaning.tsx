import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Droplets, Home, BarChart3, CheckCircle, Star, TrendingUp, Zap, Clock, DollarSign, Shield, Sparkles, ArrowRight, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function LandingExteriorCleaning() {
  const [isYearly, setIsYearly] = useState(false);
  
  const benefits = [
    {
      icon: TrendingUp,
      title: "Book 3x More Jobs",
      description: "Turn more website visitors into confirmed cleanings with instant, accurate quotes for pressure washing, gutter cleaning, and more"
    },
    {
      icon: Clock,
      title: "Stop Wasting Time on Quotes",
      description: "Eliminate hours spent measuring properties and calculating square footage - let your customers get instant pricing 24/7"
    },
    {
      icon: DollarSign,
      title: "Never Underprice Again",
      description: "Set your profit margins once, then automatically price every job right - accounting for square footage, story height, and difficulty"
    }
  ];

  const features = [
    {
      icon: Calculator,
      title: "Smart Pricing for Every Service",
      description: "Build custom calculators for pressure washing, gutter cleaning, window cleaning, roof washing, and more - with pricing that adjusts for property size, height, and condition"
    },
    {
      icon: Home,
      title: "Property Measurement Tools",
      description: "Let customers enter their square footage or use our map-based measurement tool to size their property accurately"
    },
    {
      icon: Droplets,
      title: "Multi-Service Packages",
      description: "Automatically offer package deals when customers select multiple services - boost your average job value by 40%"
    },
    {
      icon: Sparkles,
      title: "Before/After Photo Galleries",
      description: "Showcase your best work right in the quote calculator to build confidence and close more deals"
    },
    {
      icon: BarChart3,
      title: "Lead Tracking Dashboard",
      description: "See every quote request, follow up with hot leads, and track which services are most popular in your area"
    },
    {
      icon: Shield,
      title: "Mobile-Optimized",
      description: "73% of homeowners search for cleaning services on their phone - our calculators look perfect on every device"
    }
  ];

  const serviceTypes = [
    { name: "Pressure Washing", description: "Price by square footage, surface type, and PSI level" },
    { name: "Gutter Cleaning", description: "Calculate by linear feet and story height" },
    { name: "Window Cleaning", description: "Quote based on number of windows and accessibility" },
    { name: "Roof Washing", description: "Factor in square footage, pitch, and material" },
    { name: "Deck & Fence Cleaning", description: "Price by linear feet and staining options" },
    { name: "Concrete Sealing", description: "Quote by square footage and sealer type" }
  ];

  const testimonials = [
    {
      name: "Tom Mitchell",
      role: "Owner, CleanPro Exterior Services",
      company: "$850K Revenue in 2024",
      content: "We added the instant quote calculator to our website and booked 47 new jobs in the first month. Customers love getting prices immediately instead of waiting for us to call back. Game changer!",
      rating: 5,
      image: "TM"
    },
    {
      name: "Jennifer Lopez",
      role: "Sparkle Wash & Clean",
      company: "300% Lead Growth",
      content: "I was spending 2-3 hours every day just doing estimates. Now the calculator does it automatically and I only talk to people ready to book. My close rate went from 35% to 68%.",
      rating: 5,
      image: "JL"
    },
    {
      name: "Carlos Rodriguez",
      role: "Superior Exterior Cleaning",
      company: "12 Crews",
      content: "The multi-service bundling is brilliant. When someone gets a quote for pressure washing, it suggests gutter cleaning too. We've added $3,200/month in average revenue just from upsells.",
      rating: 5,
      image: "CR"
    }
  ];

  const pricingPlans = [
    {
      name: "Standard",
      price: 49,
      yearlyPrice: 41.42,
      popular: false,
      description: "Perfect for solo operators & small crews",
      features: [
        "Unlimited Quote Calculators",
        "All Service Types Included",
        "Lead Capture & Notifications",
        "Custom Branding & Colors",
        "Property Measurement Tools",
        "Email Follow-up Automation",
        "Mobile-Optimized Design",
        "Basic Analytics Dashboard"
      ]
    },
    {
      name: "Plus",
      price: 97,
      yearlyPrice: 80.83,
      popular: true,
      description: "Best for growing cleaning businesses",
      features: [
        "Everything in Standard",
        "Multi-Service Package Builder",
        "Service Area Filtering",
        "Team Member Access",
        "Zapier & CRM Integration",
        "Before/After Photo Galleries",
        "Professional Website Included",
        "Priority Support"
      ]
    },
    {
      name: "Plus SEO",
      price: 297,
      yearlyPrice: 247.50,
      popular: false,
      description: "Dominate your local market",
      features: [
        "Everything in Plus",
        "Monthly SEO Services",
        "Google My Business Optimization",
        "Local Citation Building",
        "Monthly Ranking Reports",
        "Dedicated SEO Specialist",
        "Premium Support"
      ]
    }
  ];

  const stats = [
    { number: "89,000+", label: "Cleaning Quotes Generated" },
    { number: "840+", label: "Cleaning Companies" },
    { number: "62%", label: "Average Quote-to-Job Rate" },
    { number: "$3.2M", label: "Avg. Revenue Per User/Year" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-40">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
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
              <a href="#services" className="text-white/80 hover:text-white font-medium transition-colors">Services</a>
              <a href="#testimonials" className="text-white/80 hover:text-white font-medium transition-colors">Success Stories</a>
              <a href="#pricing" className="text-white/80 hover:text-white font-medium transition-colors">Pricing</a>
              <Link href="/login">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
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
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 text-sm rounded-lg backdrop-blur-sm border border-white/20 shadow-lg">
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
            <div className="bg-gradient-to-r from-cyan-400/20 to-blue-400/20 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3">
              <span className="text-sm font-medium text-white/90 flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Built Specifically for Exterior Cleaning Businesses
              </span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
              Stop Chasing Quotes.
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
              Start Booking Jobs.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            The instant quote calculator built for pressure washing, gutter cleaning, window washing, and exterior cleaning companies. Turn your website into a 24/7 sales machine.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/onboarding">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-2xl backdrop-blur-sm border border-white/20 shadow-2xl group"
                data-testid="button-start-trial"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-8 py-6 text-lg rounded-2xl backdrop-blur-sm group"
              data-testid="button-watch-demo"
            >
              <PlayCircle className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Exterior Cleaning Companies Choose Autobidder
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Built by cleaning professionals, for cleaning professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white/10 border-white/20 backdrop-blur-xl hover:bg-white/15 transition-all duration-300 hover:scale-105" data-testid={`card-benefit-${index}`}>
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{benefit.title}</h3>
                  <p className="text-white/70 text-lg leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Types Section */}
      <section id="services" className="relative py-20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Price Any Cleaning Service Instantly
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Pre-built calculators for every type of exterior cleaning job
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {serviceTypes.map((service, index) => (
              <div 
                key={index} 
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105 group"
                data-testid={`card-service-${index}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                    <p className="text-white/70">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-white/60 text-lg">
              + Build unlimited custom calculators for any service you offer
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to Win More Jobs
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Powerful features designed specifically for exterior cleaning businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/10 border-white/20 backdrop-blur-xl hover:bg-white/15 transition-all duration-300" data-testid={`card-feature-${index}`}>
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-white/70 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Success Stories from Real Cleaning Companies
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Join hundreds of exterior cleaning businesses growing with Autobidder
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/10 border-white/20 backdrop-blur-xl hover:bg-white/15 transition-all duration-300" data-testid={`card-testimonial-${index}`}>
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/90 text-lg mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {testimonial.image}
                    </div>
                    <div>
                      <div className="text-white font-bold">{testimonial.name}</div>
                      <div className="text-white/60 text-sm">{testimonial.role}</div>
                      <div className="text-cyan-400 text-sm font-semibold">{testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-20 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Start free, upgrade when you're ready. Cancel anytime.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-lg ${!isYearly ? 'text-white font-semibold' : 'text-white/60'}`}>Monthly</span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-16 h-8 rounded-full transition-colors ${isYearly ? 'bg-cyan-500' : 'bg-white/30'}`}
                data-testid="toggle-billing"
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${isYearly ? 'translate-x-8' : ''}`} />
              </button>
              <span className={`text-lg ${isYearly ? 'text-white font-semibold' : 'text-white/60'}`}>
                Yearly <Badge className="ml-2 bg-cyan-500 text-white">Save 15%</Badge>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`${plan.popular ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/50 scale-105' : 'bg-white/10 border-white/20'} backdrop-blur-xl relative overflow-hidden`}
                data-testid={`card-plan-${index}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-white/60 mb-6">{plan.description}</p>
                  <div className="mb-8">
                    <span className="text-5xl font-bold text-white">
                      ${isYearly ? plan.yearlyPrice.toFixed(2) : plan.price}
                    </span>
                    <span className="text-white/60 text-lg">/month</span>
                    {isYearly && (
                      <div className="text-cyan-400 text-sm mt-2">
                        Billed ${(plan.yearlyPrice * 12).toFixed(0)}/year
                      </div>
                    )}
                  </div>
                  <Link href="/onboarding">
                    <Button 
                      className={`w-full mb-8 ${plan.popular ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700' : 'bg-white/20 hover:bg-white/30'} text-white`}
                      size="lg"
                      data-testid={`button-plan-${index}`}
                    >
                      Start Free Trial
                    </Button>
                  </Link>
                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-white/90">
                        <CheckCircle className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-white/70 text-lg">
              All plans include 14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border border-white/20 rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Book More Cleaning Jobs?
            </h2>
            <p className="text-xl text-white/80 mb-10 leading-relaxed">
              Join 840+ exterior cleaning companies using Autobidder to turn their website into a lead-generating machine. Start your free 14-day trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-2xl backdrop-blur-sm border border-white/20 shadow-2xl group"
                  data-testid="button-final-cta"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-8 py-6 text-lg rounded-2xl backdrop-blur-sm"
                  data-testid="button-view-pricing"
                >
                  View Full Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-white/20 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={autobidderLogo} alt="Autobidder" className="h-8 w-8" />
                <span className="text-lg font-bold text-white">Autobidder</span>
              </div>
              <p className="text-white/60">
                The instant quote platform built for exterior cleaning professionals.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-white/60 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-white/60 hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/docs"><span className="text-white/60 hover:text-white transition-colors cursor-pointer">Docs</span></Link></li>
                <li><Link href="/faq"><span className="text-white/60 hover:text-white transition-colors cursor-pointer">FAQ</span></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/terms"><span className="text-white/60 hover:text-white transition-colors cursor-pointer">Terms</span></Link></li>
                <li><Link href="/privacy"><span className="text-white/60 hover:text-white transition-colors cursor-pointer">Privacy</span></Link></li>
                <li><Link href="/support"><span className="text-white/60 hover:text-white transition-colors cursor-pointer">Support</span></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Get Started</h4>
              <ul className="space-y-2">
                <li><Link href="/signup"><span className="text-white/60 hover:text-white transition-colors cursor-pointer">Sign Up</span></Link></li>
                <li><Link href="/login"><span className="text-white/60 hover:text-white transition-colors cursor-pointer">Sign In</span></Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-white/60">
            <p>&copy; 2024 Autobidder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

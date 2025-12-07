import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, Users, BarChart3, Palette, Globe, ArrowRight, CheckCircle, Star, TrendingUp, Zap, Target, Award, PlayCircle, ChevronRight, DollarSign, Clock, Shield, Eye, Layers, Settings, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function Lander() {
  const [isYearly, setIsYearly] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

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
      description: "Create complex pricing formulas in minutes with our intelligent builder",
      tagline: "Instant visibility. Instant action."
    },
    {
      icon: Eye,
      title: "Zero Blind Spots",
      description: "Full visibility into every lead, request, and action. If it converts, we track it.",
      tagline: "See everything. Miss nothing."
    },
    {
      icon: Zap,
      title: "Seamless Integration",
      description: "Connect in minutes. Works with the tools you already use, right out of the box.",
      tagline: "Plug into your stack. Fast."
    }
  ];

  const advancedFeatures = [
    {
      icon: Layers,
      title: "Built to Grow With You",
      description: "Whether you're scaling from 5 to 500 customers, Autobidder adapts its architecture dynamically.",
      tagline: "Adaptive scaling"
    },
    {
      icon: Globe,
      title: "Multi-Region Awareness",
      description: "Stay connected across locations, services and teams with unified visibility.",
      tagline: "Unified visibility. Global protection"
    },
    {
      icon: Settings,
      title: "Modular Rule Engine",
      description: "Customize how your system reacts — with building blocks for pricing logic",
      tagline: "Custom automation"
    },
    {
      icon: RefreshCw,
      title: "Zero Config Maintenance",
      description: "Forget manual updates or policy tuning. Everything stays current and optimized.",
      tagline: "Always up to date. Always accurate."
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Analyze setup. Surface opportunities instantly",
      description: "The system scans your services the moment you connect, uncovering pricing gaps, missed opportunities, and optimization potential — before competitors do."
    },
    {
      step: 2,
      title: "Capture Leads Automatically",
      description: "Once calculators are deployed, smart forms and real-time pricing engage visitors and convert them into qualified leads without lifting a finger."
    },
    {
      step: 3,
      title: "Stay Ahead of the Competition",
      description: "The platform keeps learning from your conversions and market patterns. You get ongoing insights, alerts, and optimizations — automatically."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "CTO",
      company: "Elite Cleaning Services",
      content: "Autobidder flagged a critical pricing gap in our quote process within minutes. That alone increased our close rate by 23%.",
      image: "SJ"
    },
    {
      name: "Mike Rodriguez",
      role: "Head of Operations",
      company: "Rodriguez Landscaping",
      content: "We switched from a bloated CRM solution to Autobidder, and got better lead quality with half the complexity.",
      image: "MR"
    },
    {
      name: "Lisa Chen",
      role: "Owner",
      company: "Crystal Clear Windows",
      content: "The setup was almost too easy. Our team had real-time pricing running before the morning coffee was even done.",
      image: "LC"
    },
    {
      name: "James Wilson",
      role: "Founder",
      company: "Premier Pressure Washing",
      content: "I'm not a tech expert, but with Autobidder I don't have to be. It just works — and keeps working.",
      image: "JW"
    }
  ];

  const pricingPlans = [
    {
      name: "Standard",
      price: 49,
      yearlyPrice: 41.42,
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
      yearlyPrice: 80.83,
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
      yearlyPrice: 247.50,
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

  const logos = ["Zunapulse", "Flowbyte", "CipherCloud", "Novastack", "Ledgerly"];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/20">
                <img 
                  src={autobidderLogo} 
                  alt="Autobidder" 
                  className="h-8 w-8"
                />
              </div>
              <span className="text-xl font-bold text-white">Autobidder</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white/70 hover:text-white font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-white/70 hover:text-white font-medium transition-colors">How It Works</a>
              <a href="#testimonials" className="text-white/70 hover:text-white font-medium transition-colors">Testimonials</a>
              <a href="#pricing" className="text-white/70 hover:text-white font-medium transition-colors">Pricing</a>
              <Link href="/login">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button className="bg-[#00ff66] hover:bg-[#00dd55] text-black font-semibold px-6 rounded-full">
                  Request Demo
                </Button>
              </Link>
            </div>

            <div className="flex md:hidden items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 px-3 py-2 text-sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button className="bg-[#00ff66] hover:bg-[#00dd55] text-black font-semibold px-4 py-2 text-sm rounded-full">
                  Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00ff66]/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight">
            <span className="text-white">Powering the World's</span>
            <br />
            <span className="text-[#00ff66]">Fastest-Growing</span>
            <br />
            <span className="text-white">Service Businesses</span>
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link href="/onboarding">
              <Button size="lg" className="bg-[#00ff66] hover:bg-[#00dd55] text-black font-semibold px-8 py-6 text-lg rounded-full" data-testid="button-start-trial">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-[#00ff66] hover:bg-[#00dd55] text-black font-semibold px-8 py-6 text-lg rounded-full" data-testid="button-watch-demo">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-black border-0">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/51FUePD1_20?autoplay=1&rel=0"
                    title="Autobidder Demo Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <section className="py-12 border-y border-white/10 overflow-hidden">
        <div className="flex animate-scroll">
          {[...logos, ...logos, ...logos, ...logos].map((logo, index) => (
            <div key={index} className="flex-shrink-0 mx-12 text-white/40 font-semibold text-lg">
              {logo}
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 border-b border-white/10">
        <div className="container mx-auto px-6">
          <p className="text-xl md:text-2xl lg:text-3xl text-white/60 leading-relaxed max-w-5xl mx-auto text-center">
            <span className="text-[#00ff66]">Pricing</span> shouldn't feel like a <span className="text-[#00ff66]">chore</span>. With <span className="text-[#00ff66]">automated quotes</span> and <span className="text-[#00ff66]">adaptive calculators</span>, your leads stay engaged — <span className="text-[#00ff66]">even while you sleep</span>.
          </p>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#00ff66] font-medium mb-4">Features</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Built to protect every layer
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              From lead capture to conversion, every part of your sales stack stays optimized.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-[#00ff66]/30 transition-all duration-300 group">
                <div className="w-16 h-16 bg-[#00ff66]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#00ff66]/20 transition-colors">
                  <feature.icon className="h-8 w-8 text-[#00ff66]" />
                </div>
                <p className="text-[#00ff66] text-sm font-medium mb-2">{feature.tagline}</p>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-transparent via-[#00ff66]/5 to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#00ff66] font-medium mb-4">Advanced Capabilities</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Automate pricing.<br />Customize everything.
            </h2>
            <p className="text-white/60 text-lg max-w-3xl mx-auto">
              These advanced capabilities give you the automation, flexibility, and power needed to stay ahead of the competition.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {advancedFeatures.map((feature, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-[#00ff66]/30 transition-all duration-300">
                <p className="text-[#00ff66] text-sm font-medium mb-3">{feature.tagline}</p>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#00ff66] font-medium mb-4">How it works</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              How we grow your business
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
              No complexity. Just clean, effective lead generation in three simple steps.
            </p>
            <Link href="/onboarding">
              <Button className="bg-[#00ff66] hover:bg-[#00dd55] text-black font-semibold px-6 rounded-full">
                Request demo
              </Button>
            </Link>
          </div>

          <div className="space-y-16 max-w-4xl mx-auto">
            {howItWorks.map((step, index) => (
              <div key={index} className="flex gap-8 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-[#00ff66] rounded-full flex items-center justify-center text-black font-bold text-xl">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-white/60 text-lg leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 bg-gradient-to-b from-transparent via-[#00ff66]/5 to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#00ff66] font-medium mb-4">Testimonials</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Trusted by teams<br />that move fast
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Service businesses rely on our platform to stay competitive while they scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-[#00ff66]/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00ff66]/20 to-[#00ff66]/5 rounded-full flex items-center justify-center text-[#00ff66] font-bold">
                    {testimonial.image}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-white/50 text-sm">{testimonial.role}</div>
                  </div>
                </div>
                <div className="text-white/40 text-sm font-medium mb-4">{testimonial.company}</div>
                <p className="text-white/70 text-sm leading-relaxed">{testimonial.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              The Results Speak<br />for Themselves
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#00ff66] mb-2">
                  {stat.number}
                </div>
                <div className="text-white/60 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 bg-[#111111]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/20">
              Simple Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Choose Your Growth Plan
            </h2>
            <p className="text-lg text-white/60 max-w-3xl mx-auto mb-8">
              Start free, upgrade when you're ready. All plans include our core features 
              to help you capture more leads and grow your business.
            </p>
            
            <div className="flex items-center justify-center mb-8">
              <span className={`mr-3 ${!isYearly ? 'text-white font-semibold' : 'text-white/60'}`}>Monthly</span>
              <div className="relative cursor-pointer" onClick={() => setIsYearly(!isYearly)}>
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isYearly}
                  onChange={(e) => setIsYearly(e.target.checked)}
                  data-testid="toggle-pricing"
                />
                <div className={`w-12 h-6 rounded-full transition-colors ${isYearly ? 'bg-[#00ff66]' : 'bg-white/20'}`}></div>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isYearly ? 'left-7' : 'left-1'}`}></div>
              </div>
              <span className={`ml-3 ${isYearly ? 'text-white font-semibold' : 'text-white/60'}`}>Yearly</span>
              <Badge className="ml-2 bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/20">Save 20%</Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`bg-white/5 border ${plan.popular ? 'border-[#00ff66] relative' : 'border-white/10'} rounded-3xl overflow-hidden hover:border-[#00ff66]/50 transition-all duration-300`}>
                {plan.popular && (
                  <Badge className="absolute -top-0 left-1/2 transform -translate-x-1/2 translate-y-4 bg-[#00ff66] text-black px-4 py-1 font-semibold">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-8 pt-12">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-white/60 mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-5xl font-bold text-white" data-testid={`price-${plan.name.toLowerCase()}`}>
                        ${isYearly ? plan.yearlyPrice : plan.price}
                      </span>
                      <span className="text-white/60">/month</span>
                    </div>
                    <p className="text-sm text-white/40">
                      {isYearly ? 'billed annually' : `or $${plan.yearlyPrice}/month billed yearly`}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#00ff66] mr-3 flex-shrink-0" />
                        <span className="text-white/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/onboarding">
                    <Button className={`w-full py-3 rounded-full font-semibold ${plan.popular ? 'bg-[#00ff66] hover:bg-[#00dd55] text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-white/40 mb-4">14-day free trial • No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Money Back Guarantee Section */}
      <section className="py-24 bg-gradient-to-b from-[#111111] to-[#0a0a0a] border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#00ff66]/5 border-2 border-[#00ff66]/30 rounded-3xl p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00ff66]/20 to-[#00ff66]/10 rounded-full flex items-center justify-center border border-[#00ff66]/30">
                  <Shield className="h-8 w-8 text-[#00ff66]" />
                </div>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                60-Day Money Back Guarantee
              </h2>
              
              <p className="text-xl text-white/70 mb-8 leading-relaxed">
                We're confident you'll love Autobidder. If you're not completely satisfied with your results within 60 days, we'll refund every penny—no questions asked. That's how sure we are that this will transform your business.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-[#00ff66] mt-1 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-white mb-2">Full Refund</h3>
                    <p className="text-white/60">100% money back if you're not satisfied</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-[#00ff66] mt-1 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-white mb-2">No Questions</h3>
                    <p className="text-white/60">We won't ask why—simple one-click refund</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-[#00ff66] mt-1 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-white mb-2">60 Days</h3>
                    <p className="text-white/60">Plenty of time to test and see results</p>
                  </div>
                </div>
              </div>
              
              <p className="text-white/60 italic">
                "Your success is our success. If we can't help you generate more leads and grow your business, we don't deserve your money."
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
            Ready to 3x Your<br /><span className="text-[#00ff66]">Lead Generation?</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-12">
            Join thousands of service businesses who've transformed their lead generation 
            and doubled their conversion rates with intelligent pricing calculators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="bg-[#00ff66] hover:bg-[#00dd55] text-black font-semibold px-8 py-6 text-lg rounded-full">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 inline-block bg-white/5 border border-white/10 rounded-full px-8 py-4">
            <p className="text-white/60">
              No credit card required • 14-day free trial • Setup in under 10 minutes
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/20">
                  <img 
                    src={autobidderLogo} 
                    alt="Autobidder" 
                    className="h-6 w-6"
                  />
                </div>
                <span className="text-xl font-bold text-white">
                  Autobidder
                </span>
              </div>
              <p className="text-white/40 leading-relaxed">
                The complete pricing calculator platform for service businesses. 
                Turn visitors into customers with intelligent quotes.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-white/40">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-white/40">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-white/40">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/40">
            <p>&copy; 2025 Autobidder. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
      `}</style>
    </div>
  );
}

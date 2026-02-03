import { useState } from "react";
import { Link } from "wouter";
import { Calculator, Clock, DollarSign, TrendingUp, CheckCircle, ArrowRight, Zap, Shield, Star, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function LandingBrutalist() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const benefits = [
    {
      icon: TrendingUp,
      title: "3X MORE LEADS",
      description: "Convert 67% more website visitors into qualified leads with instant pricing",
      rotation: "rotate-1"
    },
    {
      icon: Clock,
      title: "SAVE 15 HRS/WEEK",
      description: "Eliminate manual quotes and phone tag with automated pricing calculators",
      rotation: "-rotate-1"
    },
    {
      icon: DollarSign,
      title: "BOOST PROFIT 25%",
      description: "Price confidently with data-driven calculators that maximize your margins",
      rotation: "rotate-2"
    }
  ];

  const features = [
    {
      icon: Calculator,
      title: "SMART CALCULATOR BUILDER",
      description: "Create complex pricing formulas in minutes. No code required.",
      rotation: "-rotate-1"
    },
    {
      icon: Zap,
      title: "INSTANT QUOTES",
      description: "Your customers get accurate pricing in seconds, not days.",
      rotation: "rotate-1"
    },
    {
      icon: Shield,
      title: "LEAD PROTECTION",
      description: "Advanced spam filtering keeps your inbox clean and leads qualified.",
      rotation: "-rotate-2"
    }
  ];

  const testimonials = [
    {
      name: "SARAH J.",
      company: "Elite Cleaning",
      content: "Autobidder flagged a critical pricing gap within minutes. Close rate up 23%.",
      rotation: "rotate-1"
    },
    {
      name: "MIKE R.",
      company: "Rodriguez Landscaping",
      content: "Switched from a bloated CRM. Better leads with half the complexity.",
      rotation: "-rotate-1"
    },
    {
      name: "LISA C.",
      company: "Crystal Clear Windows",
      content: "Had real-time pricing running before the morning coffee was done.",
      rotation: "rotate-2"
    }
  ];

  const stats = [
    { number: "150K+", label: "Quotes Generated" },
    { number: "2,400+", label: "Businesses Growing" },
    { number: "47%", label: "Avg Conversion Lift" },
    { number: "99.9%", label: "Uptime" }
  ];

  const comparisonOld = [
    "Waiting days for quotes",
    "Playing phone tag",
    "Losing leads to competitors",
    "Guessing at pricing"
  ];

  const comparisonNew = [
    "Instant automated quotes",
    "24/7 lead capture",
    "Converting while you sleep",
    "Data-driven pricing"
  ];

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#422006] font-bold">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFBEB] border-b-4 border-[#422006]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 border-4 border-[#422006] bg-[#D97706]" style={{ boxShadow: '4px 4px 0px 0px #422006' }}>
                <img 
                  src={autobidderLogo} 
                  alt="Autobidder" 
                  className="h-8 w-8"
                />
              </div>
              <span className="text-2xl font-black uppercase tracking-tight">Autobidder</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="uppercase text-sm hover:text-[#D97706] transition-colors">Features</a>
              <a href="#how-it-works" className="uppercase text-sm hover:text-[#D97706] transition-colors">How It Works</a>
              <a href="#testimonials" className="uppercase text-sm hover:text-[#D97706] transition-colors">Testimonials</a>
              <a href="#pricing" className="uppercase text-sm hover:text-[#D97706] transition-colors">Pricing</a>
              <Link href="/login">
                <button className="uppercase text-sm px-4 py-2 border-4 border-[#422006] bg-[#FEF3C7] hover:bg-[#FFFBEB] transition-all hover:translate-x-[2px] hover:translate-y-[2px]" style={{ boxShadow: '4px 4px 0px 0px #422006' }}>
                  Sign In
                </button>
              </Link>
              <Link href="/onboarding">
                <button className="uppercase text-sm px-6 py-2 border-4 border-[#422006] bg-[#D97706] text-white hover:translate-x-[2px] hover:translate-y-[2px] transition-all" style={{ boxShadow: '4px 4px 0px 0px #422006' }}>
                  Start Free
                </button>
              </Link>
            </div>

            <div className="flex md:hidden items-center space-x-3">
              <Link href="/login">
                <button className="uppercase text-xs px-3 py-2 border-4 border-[#422006] bg-[#FEF3C7]" style={{ boxShadow: '2px 2px 0px 0px #422006' }}>
                  Login
                </button>
              </Link>
              <Link href="/onboarding">
                <button className="uppercase text-xs px-4 py-2 border-4 border-[#422006] bg-[#D97706] text-white" style={{ boxShadow: '2px 2px 0px 0px #422006' }}>
                  Start
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 border-4 border-[#422006] bg-[#D97706] text-white uppercase text-sm -rotate-2" style={{ boxShadow: '4px 4px 0px 0px #422006' }}>
            The #1 Pricing Calculator for Service Businesses
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-none mb-8 tracking-tight">
            <span className="block">Stop Losing</span>
            <span className="block text-[#D97706]">Leads</span>
            <span className="block">To Slow Quotes</span>
          </h1>
          
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-12 font-bold text-[#422006]/80">
            Convert website visitors into paying customers with automated pricing calculators that work 24/7.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/onboarding">
              <button 
                className="group uppercase text-lg px-10 py-5 border-4 border-[#422006] bg-[#D97706] text-white font-black transition-all hover:translate-x-[4px] hover:translate-y-[4px] active:translate-x-[6px] active:translate-y-[6px]"
                style={{ boxShadow: '8px 8px 0px 0px #422006' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '4px 4px 0px 0px #422006'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '8px 8px 0px 0px #422006'}
              >
                Start Free Trial
                <ArrowRight className="inline ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            
            <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
              <DialogTrigger asChild>
                <button 
                  className="uppercase text-lg px-10 py-5 border-4 border-[#422006] bg-[#FEF3C7] font-black transition-all hover:translate-x-[4px] hover:translate-y-[4px]"
                  style={{ boxShadow: '8px 8px 0px 0px #422006' }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '4px 4px 0px 0px #422006'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '8px 8px 0px 0px #422006'}
                >
                  <PlayCircle className="inline mr-2 h-5 w-5" />
                  Watch Demo
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl w-full p-0 overflow-hidden border-4 border-[#422006]" style={{ boxShadow: '8px 8px 0px 0px #422006' }}>
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

      <section className="py-16 border-y-4 border-[#422006] bg-[#422006]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-black text-[#D97706] mb-2 font-mono">
                  {stat.number}
                </div>
                <div className="text-white uppercase text-sm tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 border-4 border-[#422006] bg-[#FEF3C7] uppercase text-sm rotate-1 mb-6" style={{ boxShadow: '4px 4px 0px 0px #422006' }}>
              Why Choose Us
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase">
              Real Results.<br />Real Fast.
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className={`p-8 border-4 border-[#422006] bg-[#FEF3C7] ${benefit.rotation} transition-all hover:translate-x-[4px] hover:translate-y-[4px]`}
                style={{ boxShadow: '8px 8px 0px 0px #422006' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '4px 4px 0px 0px #422006'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '8px 8px 0px 0px #422006'}
              >
                <div className="w-16 h-16 border-4 border-[#422006] bg-[#D97706] flex items-center justify-center mb-6" style={{ boxShadow: '4px 4px 0px 0px #422006' }}>
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black uppercase mb-4">{benefit.title}</h3>
                <p className="text-[#422006]/80">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#FEF3C7] border-y-4 border-[#422006]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 border-4 border-[#422006] bg-[#D97706] text-white uppercase text-sm -rotate-1 mb-6" style={{ boxShadow: '4px 4px 0px 0px #422006' }}>
              The Difference
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase">
              Old Way vs.<br /><span className="text-[#D97706]">The Autobidder Way</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="p-8 border-4 border-[#422006] bg-[#fecaca] -rotate-1" style={{ boxShadow: '8px 8px 0px 0px #422006' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 border-4 border-[#422006] bg-[#F87171] flex items-center justify-center">
                  <span className="text-2xl font-black text-white">X</span>
                </div>
                <h3 className="text-2xl font-black uppercase">The Old Way</h3>
              </div>
              <ul className="space-y-4">
                {comparisonOld.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-[#F87171] font-black text-xl">✗</span>
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-8 border-4 border-[#422006] bg-[#FFFBEB] rotate-1" style={{ boxShadow: '8px 8px 0px 0px #422006' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 border-4 border-[#422006] bg-[#D97706] flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-black uppercase">Autobidder</h3>
              </div>
              <ul className="space-y-4">
                {comparisonNew.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-[#D97706] font-black text-xl">✓</span>
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 border-4 border-[#422006] bg-[#FEF3C7] uppercase text-sm rotate-2 mb-6" style={{ boxShadow: '4px 4px 0px 0px #422006' }}>
              Features
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase">
              Everything You Need<br />To <span className="text-[#D97706]">Win More Jobs</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`p-8 border-4 border-[#422006] bg-[#FFFBEB] ${feature.rotation} transition-all hover:translate-x-[4px] hover:translate-y-[4px]`}
                style={{ boxShadow: '8px 8px 0px 0px #422006' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '4px 4px 0px 0px #422006'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '8px 8px 0px 0px #422006'}
              >
                <div className="w-16 h-16 border-4 border-[#422006] bg-[#D97706] flex items-center justify-center mb-6" style={{ boxShadow: '4px 4px 0px 0px #422006' }}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-black uppercase mb-4">{feature.title}</h3>
                <p className="text-[#422006]/80">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-6 bg-[#422006] text-[#FFFBEB]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 border-4 border-[#FFFBEB] bg-[#D97706] text-white uppercase text-sm -rotate-1 mb-6" style={{ boxShadow: '4px 4px 0px 0px #FFFBEB' }}>
              How It Works
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase">
              Three Steps To<br /><span className="text-[#D97706]">More Customers</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "BUILD YOUR CALCULATOR", description: "Use our drag-and-drop builder to create custom pricing formulas in minutes." },
              { step: "02", title: "EMBED ON YOUR SITE", description: "Copy one line of code. That's it. Works with any website." },
              { step: "03", title: "CAPTURE LEADS 24/7", description: "Visitors get instant quotes. You get qualified leads in your inbox." }
            ].map((item, index) => (
              <div 
                key={index} 
                className="p-8 border-4 border-[#FFFBEB] bg-[#422006] relative"
                style={{ boxShadow: '8px 8px 0px 0px #D97706' }}
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 border-4 border-[#FFFBEB] bg-[#D97706] flex items-center justify-center font-mono font-black text-white">
                  {item.step}
                </div>
                <h3 className="text-xl font-black uppercase mb-4 mt-4">{item.title}</h3>
                <p className="text-[#FFFBEB]/80">{item.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/onboarding">
              <button 
                className="uppercase text-lg px-10 py-5 border-4 border-[#FFFBEB] bg-[#D97706] text-white font-black transition-all hover:translate-x-[4px] hover:translate-y-[4px]"
                style={{ boxShadow: '8px 8px 0px 0px #FFFBEB' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '4px 4px 0px 0px #FFFBEB'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '8px 8px 0px 0px #FFFBEB'}
              >
                Get Started Now
                <ArrowRight className="inline ml-2 h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 border-4 border-[#422006] bg-[#D97706] text-white uppercase text-sm rotate-1 mb-6" style={{ boxShadow: '4px 4px 0px 0px #422006' }}>
              Testimonials
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase">
              What Our<br /><span className="text-[#D97706]">Customers Say</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className={`p-8 border-4 border-[#422006] bg-[#FEF3C7] ${testimonial.rotation}`}
                style={{ boxShadow: '8px 8px 0px 0px #422006' }}
              >
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-[#D97706] text-[#D97706]" />
                  ))}
                </div>
                <p className="text-lg mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 border-4 border-[#422006] bg-[#D97706] flex items-center justify-center text-white font-black">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black uppercase">{testimonial.name}</div>
                    <div className="text-sm text-[#422006]/70">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6 bg-[#FEF3C7] border-y-4 border-[#422006]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 border-4 border-[#422006] bg-[#422006] text-[#FFFBEB] uppercase text-sm -rotate-1 mb-6" style={{ boxShadow: '4px 4px 0px 0px #D97706' }}>
              Simple Pricing
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase">
              No Surprises.<br /><span className="text-[#D97706]">Just Growth.</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "STANDARD", price: "$49", period: "/month", features: ["Custom Calculators", "Lead Generation", "Scheduling", "Design Editor", "Template Library"], popular: false },
              { name: "PLUS", price: "$97", period: "/month", features: ["Everything in Standard", "Location Filtering", "Bid Approval", "Zapier Integration", "Website Included", "Team Members"], popular: true },
              { name: "PLUS SEO", price: "$297", period: "/month", features: ["Everything in Plus", "Monthly SEO Done For You", "SEO Dashboard Access", "Premium Support"], popular: false }
            ].map((plan, index) => (
              <div 
                key={index} 
                className={`p-8 border-4 border-[#422006] ${plan.popular ? 'bg-[#D97706] text-white -rotate-1' : 'bg-[#FFFBEB] rotate-0'} relative transition-all hover:translate-x-[4px] hover:translate-y-[4px]`}
                style={{ boxShadow: '8px 8px 0px 0px #422006' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '4px 4px 0px 0px #422006'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '8px 8px 0px 0px #422006'}
              >
                {plan.popular && (
                  <div className="absolute -top-4 -right-4 px-4 py-1 border-4 border-[#422006] bg-[#FFFBEB] text-[#422006] uppercase text-xs font-black rotate-3" style={{ boxShadow: '2px 2px 0px 0px #422006' }}>
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-black uppercase mb-4">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-black font-mono">{plan.price}</span>
                  <span className="text-lg">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <CheckCircle className={`h-5 w-5 ${plan.popular ? 'text-white' : 'text-[#D97706]'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/onboarding">
                  <button 
                    className={`w-full uppercase text-sm px-6 py-4 border-4 border-[#422006] ${plan.popular ? 'bg-[#FFFBEB] text-[#422006]' : 'bg-[#D97706] text-white'} font-black transition-all hover:translate-x-[2px] hover:translate-y-[2px]`}
                    style={{ boxShadow: '4px 4px 0px 0px #422006' }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '2px 2px 0px 0px #422006'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = '4px 4px 0px 0px #422006'}
                  >
                    Start Free Trial
                    <ArrowRight className="inline ml-2 h-4 w-4" />
                  </button>
                </Link>
              </div>
            ))}
          </div>
          
          <p className="text-center mt-8 text-[#422006]/70">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#422006]">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black uppercase text-[#FFFBEB] mb-6">
            Ready To Win<br /><span className="text-[#D97706]">More Jobs?</span>
          </h2>
          <p className="text-xl text-[#FFFBEB]/80 max-w-2xl mx-auto mb-10">
            Join 2,400+ service businesses already using Autobidder to capture more leads and close more deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/onboarding">
              <button 
                className="uppercase text-lg px-12 py-5 border-4 border-[#FFFBEB] bg-[#D97706] text-white font-black transition-all hover:translate-x-[4px] hover:translate-y-[4px]"
                style={{ boxShadow: '8px 8px 0px 0px #FFFBEB' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '4px 4px 0px 0px #FFFBEB'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '8px 8px 0px 0px #FFFBEB'}
              >
                Start Free Trial
                <ArrowRight className="inline ml-2 h-5 w-5" />
              </button>
            </Link>
            <Link href="/book-call">
              <button 
                className="uppercase text-lg px-12 py-5 border-4 border-[#FFFBEB] bg-transparent text-[#FFFBEB] font-black transition-all hover:translate-x-[4px] hover:translate-y-[4px] hover:bg-[#FFFBEB]/10"
                style={{ boxShadow: '8px 8px 0px 0px #D97706' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '4px 4px 0px 0px #D97706'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '8px 8px 0px 0px #D97706'}
              >
                Book A Demo
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#D97706]">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto p-12 border-4 border-[#422006] bg-[#FFFBEB] -rotate-1" style={{ boxShadow: '12px 12px 0px 0px #422006' }}>
            <div className="w-20 h-20 border-4 border-[#422006] bg-[#D97706] flex items-center justify-center mx-auto mb-6" style={{ boxShadow: '4px 4px 0px 0px #422006' }}>
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">
              60-Day Money Back<br />Guarantee
            </h2>
            <p className="text-xl mb-8 text-[#422006]/80">
              Try Autobidder risk-free. If you're not completely satisfied within 60 days, we'll refund every penny. No questions asked.
            </p>
            <Link href="/onboarding">
              <button 
                className="uppercase text-lg px-12 py-5 border-4 border-[#422006] bg-[#D97706] text-white font-black transition-all hover:translate-x-[4px] hover:translate-y-[4px]"
                style={{ boxShadow: '8px 8px 0px 0px #422006' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '4px 4px 0px 0px #422006'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '8px 8px 0px 0px #422006'}
              >
                Start Your Free Trial
                <ArrowRight className="inline ml-2 h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-16 px-6 bg-[#422006] text-[#FFFBEB] border-t-4 border-[#D97706]">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 border-4 border-[#FFFBEB] bg-[#D97706]" style={{ boxShadow: '4px 4px 0px 0px #FFFBEB' }}>
                  <img 
                    src={autobidderLogo} 
                    alt="Autobidder" 
                    className="h-8 w-8"
                  />
                </div>
                <span className="text-xl font-black uppercase">Autobidder</span>
              </div>
              <p className="text-[#FFFBEB]/70">
                The #1 pricing calculator for service businesses. Convert more leads, close more deals.
              </p>
            </div>
            
            <div>
              <h4 className="font-black uppercase mb-4">Product</h4>
              <ul className="space-y-2 text-[#FFFBEB]/70">
                <li><a href="#features" className="hover:text-[#D97706] transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-[#D97706] transition-colors">Pricing</a></li>
                <li><Link href="/docs" className="hover:text-[#D97706] transition-colors">Docs</Link></li>
                <li><a href="#testimonials" className="hover:text-[#D97706] transition-colors">Testimonials</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black uppercase mb-4">Company</h4>
              <ul className="space-y-2 text-[#FFFBEB]/70">
                <li><Link href="/terms" className="hover:text-[#D97706] transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-[#D97706] transition-colors">Privacy</Link></li>
                <li><Link href="/faq" className="hover:text-[#D97706] transition-colors">FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black uppercase mb-4">Get Started</h4>
              <Link href="/onboarding">
                <button 
                  className="uppercase text-sm px-6 py-3 border-4 border-[#FFFBEB] bg-[#D97706] text-white font-black transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
                  style={{ boxShadow: '4px 4px 0px 0px #FFFBEB' }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '2px 2px 0px 0px #FFFBEB'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '4px 4px 0px 0px #FFFBEB'}
                >
                  Start Free Trial
                </button>
              </Link>
            </div>
          </div>
          
          <div className="border-t-4 border-[#FFFBEB]/20 pt-8 text-center text-[#FFFBEB]/50">
            <p>&copy; 2025 Autobidder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

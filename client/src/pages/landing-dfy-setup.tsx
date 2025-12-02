import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Zap, Palette, Cog, Mail, Video, ArrowRight, Users, BarChart3, TrendingUp, Clock, DollarSign, Star, Play, Globe, Calculator, Workflow } from "lucide-react";
import { Link } from "wouter";
import Lottie from "lottie-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";
import notificationAnimation from "@assets/Notification-[remix]-[copy]_1764687239618.json";

export default function LandingDfySetup() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const setupIncludes = [
    {
      title: "Full Website Design",
      description: "Professional, brand-aligned website optimized for conversions",
      icon: "globe"
    },
    {
      title: "Custom Calculators",
      description: "Up to 10 automated pricing calculators with complex logic",
      icon: "calculator"
    },
    {
      title: "CRM Integration",
      description: "Automatic lead routing into your existing CRM system",
      icon: "workflow"
    },
    {
      title: "Email Automation",
      description: "Automated follow-up sequences and lead nurturing",
      icon: "mail"
    },
    {
      title: "Custom Design & Icons",
      description: "Professional icons and branding matched to your company",
      icon: "palette"
    },
    {
      title: "3 White Label Video Ads",
      description: "Professional videos ready to deploy on social media",
      icon: "video"
    }
  ];

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      globe: Globe,
      calculator: Calculator,
      workflow: Workflow,
      mail: Mail,
      palette: Palette,
      video: Video
    };
    return iconMap[iconName] || Zap;
  };

  const processsteps = [
    {
      number: "01",
      title: "Discovery Call",
      description: "30-minute consultation"
    },
    {
      number: "02",
      title: "Strategy & Design",
      description: "Custom blueprint created"
    },
    {
      number: "03",
      title: "Build & Configure",
      description: "Full technical setup"
    },
    {
      number: "04",
      title: "Launch & Support",
      description: "Live with 30 days support"
    }
  ];

  const benefits = [
    {
      stat: "47%",
      title: "More Leads",
      description: "Average increase within 30 days"
    },
    {
      stat: "18hrs",
      title: "Time Saved",
      description: "Per week with automation"
    },
    {
      stat: "$35K",
      title: "Revenue",
      description: "Average in first 90 days"
    }
  ];

  const testimonials = [
    {
      name: "David Thompson",
      role: "Premium Roofing Co.",
      content: "The setup saved me thousands in development costs. Conversion rate is 3x better.",
      avatar: "DT"
    },
    {
      name: "Maria Santos",
      role: "Elite Landscape Design",
      content: "We went from 5 leads per week to 23 in the first month. Game changer!",
      avatar: "MS"
    },
    {
      name: "James Wilson",
      role: "BuildRight Contractors",
      content: "Customers love how professional our website is. Video ads converting great.",
      avatar: "JW"
    }
  ];

  const pricingPlans = [
    {
      name: "Calculator Setup",
      price: "$297",
      description: "Custom calculation formulas and setup",
      popular: false,
      features: ["Up to 10 custom calculators", "Advanced calculation formulas", "Conditional logic setup", "Mobile responsive", "7 days of support"]
    },
    {
      name: "DFY Setup",
      price: "$997",
      description: "Complete done-for-you marketing system setup",
      popular: true,
      features: ["Full website design", "Up to 10 custom calculators", "CRM integration", "Email automation setup", "Custom design & icons", "3 white label video ads", "30 days of support"]
    }
  ];

  const faqItems = [
    {
      question: "How long does the setup take?",
      answer: "Typically 5-7 business days from kickoff to launch. We handle all the technical work."
    },
    {
      question: "Can I customize after launch?",
      answer: "Absolutely! We'll train your team to make updates. Or we can handle changes for $47/hour."
    },
    {
      question: "What about more than 10 calculators?",
      answer: "Each additional calculator is $47. Most customers use calculator groups to stay within 10."
    },
    {
      question: "Which CRMs do you support?",
      answer: "We integrate with 500+ platforms including HubSpot, Salesforce, Pipedrive, Zoho, and more via Zapier."
    },
    {
      question: "What's included after launch?",
      answer: "30 days of email support and bug fixes included. Optional ongoing support from $97/month."
    },
    {
      question: "Do you offer video consultation?",
      answer: "Yes! Your discovery call is via Zoom with our team. We also offer recorded training videos for your staff."
    },
    {
      question: "Is there a contract or lock-in period?",
      answer: "No contracts. It's a one-time setup fee. You own everything. Stay or go as you please."
    },
    {
      question: "What if I need additional features?",
      answer: "We offer add-ons like SMS integration, phone systems, and advanced reporting. Let's discuss your needs."
    },
    {
      question: "Do you provide training?",
      answer: "Included! We train your team to manage and update everything. We also provide documentation and video guides."
    },
    {
      question: "What's your refund policy?",
      answer: "We're confident you'll love it. 14-day money-back guarantee if you're not happy with the setup."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-blue-900/30 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <img src={autobidderLogo} alt="Autobidder" className="w-6 h-6" />
                <span className="font-bold">Autobidder</span>
              </div>
            </Link>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white">Sign In</Button>
              </Link>
              <Button onClick={() => window.location.href = 'https://buy.stripe.com/14AeVf6Js9TibsC3E99k404'} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white">Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="relative container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-6">
                <span className="text-sm font-semibold text-blue-400 bg-blue-950/50 border border-blue-800 px-4 py-2 rounded-full">Empowering Service Businesses</span>
              </div>
              
              <h1 className="text-6xl md:text-5xl font-bold mb-6 leading-tight">
                Your Complete <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Marketing System</span> in One Week
              </h1>
              
              <p className="text-xl text-gray-300 mb-8">
                Professional website, custom calculators, CRM integration, email automation, and video ads. Everything configured and ready. $997 all-in.
              </p>
              
              <div className="flex gap-4 flex-wrap">
                <Button onClick={() => window.location.href = 'https://buy.stripe.com/14AeVf6Js9TibsC3E99k404'} size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white h-14 px-8">
                  Get Your Setup <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button size="lg" className="bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 h-14 px-8">
                  <Play className="mr-2 w-4 h-4" /> Watch Demo
                </Button>
              </div>
              
              <div className="mt-12 w-80">
                <Lottie animationData={notificationAnimation} loop autoplay />
              </div>
            </div>

            <div>
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-800/40 shadow-2xl">
                <iframe
                  className="w-full aspect-video"
                  src="https://www.youtube.com/embed/bdw1gHJvNEQ"
                  title="Sales Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-4">What's Included</h2>
        <p className="text-gray-400 mb-12 max-w-2xl">Everything you need to turn more visitors into paying customers. Fully configured.</p>
        
        <div className="grid md:grid-cols-3 gap-6">
          {setupIncludes.map((item, idx) => {
            const IconComponent = getIcon(item.icon);
            return (
              <div key={idx} className="bg-gradient-to-br from-blue-900/30 to-slate-900/30 border border-blue-800/40 rounded-lg p-6 hover:border-blue-700/60 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 mb-4 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* White Label Videos Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-4">3 White Label Video Ads</h2>
        <p className="text-gray-400 mb-12 max-w-2xl">Professional videos with your branding. Ready to deploy on YouTube, Facebook, and Instagram. Upload your videos here.</p>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((video, idx) => (
            <div key={idx} className="bg-gradient-to-br from-blue-900/20 to-slate-900/20 border border-blue-800/30 rounded-lg overflow-hidden hover:border-blue-700/60 transition-colors group">
              <div className="aspect-video bg-slate-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
                <div className="relative flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center group-hover:bg-blue-600/50 transition-colors">
                    <Play className="w-8 h-8 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-400">Video {video}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold mb-2">Video Ad {video}</h3>
                <p className="text-gray-400 text-sm mb-4">Upload your white label video ad</p>
                <Button className="w-full bg-blue-950 border border-blue-800 text-white hover:bg-blue-900 text-sm">
                  Upload Video
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-4">How it works</h2>
        <p className="text-gray-400 mb-12 max-w-2xl">From discovery to launch in just 5-7 business days.</p>

        <div className="grid md:grid-cols-4 gap-6">
          {processsteps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/30 border border-blue-800/40 rounded-lg p-6 mb-4">
                <div className="text-4xl font-bold text-blue-400 mb-4">{step.number}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </div>
              
              {idx < processsteps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-4">What our users love</h2>
        <p className="text-gray-400 mb-12 max-w-2xl">Hear from businesses already getting results.</p>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="bg-gradient-to-br from-blue-900/20 to-slate-900/20 border border-blue-800/30 rounded-lg p-8">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-200 mb-6">{testimonial.content}</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-gray-400 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-4">Pricing</h2>
        <p className="text-gray-400 mb-4 max-w-2xl">Transparent pricing. Plus Plan required.</p>
        <p className="text-blue-400 mb-12 text-sm bg-blue-950/50 border border-blue-800 px-4 py-2 rounded-lg inline-block">Available for Autobidder Plus subscribers only</p>

        <div className="max-w-2xl space-y-12">
          {/* Primary Offer */}
          <div className="rounded-lg border bg-gradient-to-br from-blue-900/50 to-slate-900/50 border-blue-600 ring-2 ring-blue-600/50">
            <div className="p-8">
              <div className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-1 rounded-full text-sm font-bold mb-4">Popular</div>
              <h3 className="text-3xl font-bold mb-2">{pricingPlans[1].name}</h3>
              <div className="mb-6">
                <span className="text-6xl font-bold">{pricingPlans[1].price}</span>
                <span className="text-gray-400 text-lg"> one-time</span>
              </div>
              <p className="text-gray-300 mb-8">{pricingPlans[1].description}</p>
              
              <Button onClick={() => window.location.href = 'https://buy.stripe.com/14AeVf6Js9TibsC3E99k404'} className="w-full mb-8 h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              
              <ul className="space-y-3">
                {pricingPlans[1].features.map((feature, fidx) => (
                  <li key={fidx} className="flex gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Downsell Headline */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-300">Already have a great website? <span className="text-blue-400">Only need help setting up your formulas?</span></h3>
          </div>

          {/* Downsell Offer */}
          <div className="rounded-lg border bg-gradient-to-br from-blue-900/20 to-slate-900/20 border-blue-800/30">
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-2">{pricingPlans[0].name}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">{pricingPlans[0].price}</span>
                <span className="text-gray-400 text-lg"> one-time</span>
              </div>
              <p className="text-gray-300 mb-8">{pricingPlans[0].description}</p>
              
              <Button onClick={() => window.location.href = 'https://buy.stripe.com/bJecN7ffYaXm68ib6B9k403'} className="w-full mb-8 h-12 bg-blue-950 border border-blue-800 text-white hover:bg-blue-900">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              
              <ul className="space-y-3">
                {pricingPlans[0].features.map((feature, fidx) => (
                  <li key={fidx} className="flex gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-4">FAQ</h2>
        <p className="text-gray-400 mb-12 max-w-2xl">Common questions answered.</p>

        <div className="grid md:grid-cols-2 gap-6">
          {faqItems.map((item, idx) => (
            <div key={idx} className="bg-gradient-to-br from-blue-900/20 to-slate-900/20 border border-blue-800/30 rounded-lg overflow-hidden hover:border-blue-700/60 transition-colors">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-900/10 transition-colors text-left"
              >
                <span className="font-semibold text-sm">{item.question}</span>
                <span className={`text-blue-400 transition-transform text-xl flex-shrink-0 ml-2 ${expandedFaq === idx ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {expandedFaq === idx && (
                <div className="px-6 py-4 border-t border-blue-800/30 bg-blue-950/20">
                  <p className="text-gray-300 text-sm">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">Ready to transform your business?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of service businesses getting more qualified leads with their automated system.
          </p>
          <Button onClick={() => window.location.href = 'https://buy.stripe.com/14AeVf6Js9TibsC3E99k404'} size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-lg h-14 px-12">
            Schedule Your Setup <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-900/30 bg-slate-950/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={autobidderLogo} alt="Autobidder" className="w-5 h-5" />
                <span className="font-bold">Autobidder</span>
              </div>
              <p className="text-gray-400 text-sm">Automated quote systems built for service businesses.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/templates" className="hover:text-white transition-colors">Templates</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-900/30 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Autobidder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

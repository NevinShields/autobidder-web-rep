import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Palette, Cog, Mail, Video, ArrowRight, Shield, Users, BarChart3, TrendingUp, Clock, DollarSign, Star, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function LandingDfySetup() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const setupIncludes = [
    {
      icon: Globe,
      title: "Full Website Design",
      description: "Professional, brand-aligned website with SEO optimization. Mobile-responsive and optimized for conversions."
    },
    {
      icon: Calculator,
      title: "Custom Calculation Setup",
      description: "Up to 10 custom pricing calculators tailored to your services. Includes complex formulas and conditional logic."
    },
    {
      icon: Cog,
      title: "CRM Integration",
      description: "Seamless connection to your existing CRM system. Automatic lead qualification and routing."
    },
    {
      icon: Mail,
      title: "Email Automation Setup",
      description: "Automated follow-up sequences, lead nurturing, and confirmation emails. Fully configured and ready to send."
    },
    {
      icon: Palette,
      title: "Custom Design & Icons",
      description: "Professional custom icons, color schemes, and branding elements. Matches your company identity perfectly."
    },
    {
      icon: Video,
      title: "3 White Label Video Ads",
      description: "Professional video ads featuring your branding. Ready to deploy on social media and YouTube immediately."
    }
  ];

  const benefits = [
    {
      number: "47%",
      description: "Average increase in qualified leads within 30 days"
    },
    {
      number: "18 hours",
      description: "Time saved per week with automated calculations and emails"
    },
    {
      number: "$35K",
      description: "Average revenue generated within first 90 days"
    }
  ];

  const processsteps = [
    {
      number: "1",
      title: "Initial Consultation",
      description: "We learn about your business, services, and goals. 30-minute discovery call."
    },
    {
      number: "2",
      title: "Strategy & Design",
      description: "Custom pricing strategy and website design created for your unique business model."
    },
    {
      number: "3",
      title: "Build & Integrate",
      description: "Calculators built, CRM integrated, email automation configured. Full technical setup."
    },
    {
      number: "4",
      title: "Launch & Training",
      description: "Live launch of your system. We train your team and provide 30 days of support."
    }
  ];

  const testimonials = [
    {
      name: "David Thompson",
      role: "Owner, Premium Roofing Co.",
      content: "The $997 setup saved me thousands in development costs. My website is converting 3x better than before.",
      rating: 5,
      avatar: "DT"
    },
    {
      name: "Maria Santos",
      role: "CEO, Elite Landscape Design",
      content: "Having everything done for me was a game-changer. We went from 5 leads/week to 23 in the first month.",
      rating: 5,
      avatar: "MS"
    },
    {
      name: "James Wilson",
      role: "Founder, BuildRight Contractors",
      content: "The video ads alone are worth the price. Customers comment on how professional our marketing is now.",
      rating: 5,
      avatar: "JW"
    }
  ];

  const faqItems = [
    {
      question: "How long does the setup take?",
      answer: "Typically 5-7 business days from kickoff to launch. We handle everything so you can focus on your business."
    },
    {
      question: "Can I customize things after launch?",
      answer: "Absolutely! We'll train your team to make updates. Or we can handle changes for you. First 30 days of support included."
    },
    {
      question: "What if I have more than 10 services?",
      answer: "We can build additional calculators. Each additional service calculator is $47. Most customers use calculator groups to stay within 10."
    },
    {
      question: "Will my CRM work with this?",
      answer: "We integrate with 500+ CRM platforms. Zapier, HubSpot, Salesforce, Pipedrive, and more. Tell us what you use and we'll set it up."
    },
    {
      question: "Is there ongoing support?",
      answer: "Yes! 30 days of email support included. After that, optional support packages available from $97-$297/month."
    }
  ];

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-40">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-50 sticky top-0 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <img src={autobidderLogo} alt="Autobidder" className="w-6 h-6" />
                </div>
                <span className="text-white font-bold text-xl">Autobidder</span>
              </div>
            </Link>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white/20">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-20 container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4 bg-purple-500/30 text-purple-200 border-purple-500/50">Done-For-You Setup</Badge>
        
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Your Complete Marketing System in <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">One Week</span>
        </h1>
        
        <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          $997 gets you a fully-built, fully-configured website, calculators, CRM integration, email automation, and professional video ads. We handle everything. You just focus on closing deals.
        </p>

        <div className="flex gap-4 justify-center mb-12 flex-wrap">
          <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg h-14 px-8">
            Get Your Setup <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg h-14 px-8" onClick={() => setIsVideoOpen(true)}>
            <PlayCircle className="mr-2 w-5 h-5" /> Watch Demo
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-2">
                {benefit.number}
              </div>
              <p className="text-sm text-white/70">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="relative z-20 container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white mb-4 text-center">What's Included in Your $997 Setup</h2>
        <p className="text-center text-white/70 mb-12 max-w-2xl mx-auto">
          Everything you need to turn website visitors into paying customers, fully configured and ready to go.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {setupIncludes.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-white/70">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Process */}
      <section className="relative z-20 container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white mb-4 text-center">The Setup Process</h2>
        <p className="text-center text-white/70 mb-12 max-w-2xl mx-auto">
          From discovery to launch in just 5-7 business days. Here's exactly how it works.
        </p>

        <div className="grid md:grid-cols-4 gap-6">
          {processsteps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 h-full">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg mb-4">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-white/70 text-sm">{step.description}</p>
              </div>
              {idx < processsteps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-20 container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">What Our Clients Say</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/90 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-white/60 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-20 container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>

        <div className="max-w-2xl mx-auto space-y-4">
          {faqItems.map((item, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
              >
                <span className="text-lg font-semibold text-white">{item.question}</span>
                <span className={`text-white/60 transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {expandedFaq === idx && (
                <div className="px-6 py-4 border-t border-white/10 bg-white/5">
                  <p className="text-white/80">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-20 container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-white/20 rounded-2xl p-12">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of contractors and service businesses getting more leads and closing more deals with their automated system.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg h-14 px-12">
            Get Your $997 Setup Today <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-white/60 text-sm mt-6">
            Setup + 30 days of support included. Money-back guarantee if not satisfied.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={autobidderLogo} alt="Autobidder" className="w-6 h-6" />
                <span className="text-white font-bold">Autobidder</span>
              </div>
              <p className="text-white/60 text-sm">Automated quote systems for service businesses.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/templates" className="hover:text-white transition-colors">Templates</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/60 text-sm">
            <p>&copy; 2024 Autobidder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Placeholder icons if not imported
const Globe = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20H7m6-4v4m0-11v3m0-3V4m0 0h-3m3 0h3" />
  </svg>
);

const Calculator = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-6 3v-3m-6-1h18V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5z" />
  </svg>
);

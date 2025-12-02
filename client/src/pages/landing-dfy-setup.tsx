import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Zap, Palette, Cog, Mail, Video, ArrowRight, Users, BarChart3, TrendingUp, Clock, DollarSign, Star } from "lucide-react";
import { Link } from "wouter";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function LandingDfySetup() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const setupIncludes = [
    {
      icon: Globe,
      title: "Full Website Design",
      description: "Professional, brand-aligned website optimized for conversions. Mobile-responsive and ready to rank in search results.",
      image: "1"
    },
    {
      icon: Calculator,
      title: "Custom Calculators",
      description: "Automated pricing calculators for each service with complex formulas and conditional logic.",
      image: "2"
    },
    {
      icon: Cog,
      title: "CRM Integration",
      description: "Automatic lead routing into your CRM. Works with 500+ platforms.",
      image: "3"
    }
  ];

  const processsteps = [
    {
      number: "01",
      title: "Discovery",
      description: "30-minute call to understand your business"
    },
    {
      number: "02",
      title: "Strategy",
      description: "Custom pricing strategy and design blueprint"
    },
    {
      number: "03",
      title: "Build",
      description: "Full technical setup and integration"
    },
    {
      number: "04",
      title: "Launch",
      description: "Live with 30 days of support"
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "47% More Leads",
      description: "Average increase in qualified leads within 30 days"
    },
    {
      icon: Clock,
      title: "18 Hours Saved",
      description: "Time saved per week with automation"
    },
    {
      icon: DollarSign,
      title: "$35K Revenue",
      description: "Average in first 90 days"
    }
  ];

  const testimonials = [
    {
      name: "David Thompson",
      role: "Premium Roofing Co.",
      content: "The setup saved me thousands and my conversion rate is 3x better.",
      avatar: "DT"
    },
    {
      name: "Maria Santos",
      role: "Elite Landscape Design",
      content: "We went from 5 to 23 leads per week in just one month.",
      avatar: "MS"
    },
    {
      name: "James Wilson",
      role: "BuildRight Contractors",
      content: "Customers love how professional our website is now.",
      avatar: "JW"
    }
  ];

  const faqItems = [
    {
      question: "How long does the setup take?",
      answer: "Typically 5-7 business days from kickoff to launch. We handle all the technical work."
    },
    {
      question: "Can I customize after launch?",
      answer: "Yes! We'll train your team to make updates themselves."
    },
    {
      question: "What about calculators beyond 10?",
      answer: "Additional service calculators are $47 each."
    },
    {
      question: "Which CRMs do you support?",
      answer: "We integrate with 500+ platforms including HubSpot, Salesforce, Pipedrive, and more."
    },
    {
      question: "What's included after launch?",
      answer: "30 days of email support and bug fixes included."
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <img src={autobidderLogo} alt="Autobidder" className="w-6 h-6" />
                <span className="font-bold text-gray-900">Autobidder</span>
              </div>
            </Link>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full opacity-60 blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-full opacity-60 blur-3xl -ml-48 -mb-48"></div>
        </div>
        
        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">More than a platform</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight text-gray-900">
              Your Complete <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Marketing System</span> in One Week
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Professional website, custom calculators, CRM integration, email automation, and video ads. All for $997. We handle everything—you get the leads.
            </p>
            
            <div className="flex gap-4 justify-center mb-12 flex-wrap">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-14 px-8">
                Get Your Setup <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-50 h-14 px-8">
                Book a Demo
              </Button>
            </div>
            
            <p className="text-sm text-gray-500">No credit card required. Setup includes 30 days of support.</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {setupIncludes.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="group">
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 p-8 mb-6 h-48 flex items-center justify-center border border-gray-200 group-hover:border-blue-300 transition-colors">
                  <Icon className="w-20 h-20 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 border-y border-gray-200">
        <div className="container mx-auto px-4 py-24">
          <div className="grid md:grid-cols-3 gap-12">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx}>
                  <div className="p-4 rounded-xl bg-white w-fit mb-6 border border-gray-200">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-24">
        <div className="mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">How it works</h2>
          <p className="text-xl text-gray-600">From discovery to launch in just 5-7 business days.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {processsteps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="text-7xl font-bold text-gray-100 mb-4">{step.number}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
              
              {idx < processsteps.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 border-y border-gray-200">
        <div className="container mx-auto px-4 py-24">
          <div className="mb-16">
            <h2 className="text-5xl font-bold text-gray-900">What our users <span className="text-gray-400">love</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-8 text-lg">{testimonial.content}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-24">
        <div className="mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">FAQ</h2>
        </div>

        <div className="max-w-3xl space-y-4">
          {faqItems.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-colors">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full px-6 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-lg font-semibold text-gray-900">{item.question}</span>
                <span className={`text-gray-600 transition-transform text-2xl ${expandedFaq === idx ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {expandedFaq === idx && (
                <div className="px-6 py-6 border-t border-gray-200 bg-gray-50">
                  <p className="text-gray-700 text-lg">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-600"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">Ready to get started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of service businesses getting more qualified leads with their automated system.
          </p>
          <Button size="lg" className="bg-white hover:bg-gray-100 text-blue-600 text-lg h-14 px-12">
            Schedule Your Setup <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={autobidderLogo} alt="Autobidder" className="w-5 h-5" />
                <span className="font-bold text-gray-900">Autobidder</span>
              </div>
              <p className="text-gray-600 text-sm">Automated quote systems built for service businesses.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-gray-900 transition-colors">Features</Link></li>
                <li><Link href="/templates" className="hover:text-gray-900 transition-colors">Templates</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link href="/about" className="hover:text-gray-900 transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-gray-900 transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-gray-600 text-sm">
            <p>&copy; 2024 Autobidder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icons
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

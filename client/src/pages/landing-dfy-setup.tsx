import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Palette, Cog, Mail, Video, ArrowRight, Users, BarChart3, TrendingUp, Clock, DollarSign, Star, Phone, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function LandingDfySetup() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const setupIncludes = [
    {
      icon: Globe,
      title: "Full Website Design",
      description: "Professional, brand-aligned website optimized for conversions. Mobile-responsive and ready to rank in search results."
    },
    {
      icon: Calculator,
      title: "Custom Calculators (Up to 10)",
      description: "Automated pricing calculators for each of your services with complex formulas and conditional logic."
    },
    {
      icon: Cog,
      title: "CRM Integration",
      description: "Automatic lead routing into your CRM. Works with HubSpot, Salesforce, Pipedrive, and 500+ other platforms."
    },
    {
      icon: Mail,
      title: "Email Automation",
      description: "Automated follow-up sequences and lead nurturing. Fully configured and ready to send immediately."
    },
    {
      icon: Palette,
      title: "Custom Design & Icons",
      description: "Professional custom icons and branding. Everything matches your company identity perfectly."
    },
    {
      icon: Video,
      title: "3 White Label Video Ads",
      description: "Professional videos with your branding. Ready to deploy on YouTube, Facebook, and Instagram."
    }
  ];

  const processsteps = [
    {
      number: "1",
      title: "Discovery Call",
      description: "30-minute call to understand your business, services, and growth goals."
    },
    {
      number: "2",
      title: "Strategy Session",
      description: "We design your pricing strategy and create your website blueprint."
    },
    {
      number: "3",
      title: "Build & Configure",
      description: "Calculators built, CRM integrated, automation set up. Full technical implementation."
    },
    {
      number: "4",
      title: "Launch & Support",
      description: "Live launch with team training. 30 days of email support included."
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
      title: "18 Hours Saved/Week",
      description: "Automated calculations and email follow-ups"
    },
    {
      icon: DollarSign,
      title: "$35K Revenue in 90 Days",
      description: "Average revenue from new leads generated"
    }
  ];

  const testimonials = [
    {
      name: "David Thompson",
      role: "Premium Roofing Co.",
      content: "The $997 setup saved me thousands in development costs and design fees. My conversion rate is already 3x better.",
      avatar: "DT"
    },
    {
      name: "Maria Santos",
      role: "Elite Landscape Design",
      content: "We went from 5 leads per week to 23 in just the first month. Everything was already configured and working.",
      avatar: "MS"
    },
    {
      name: "James Wilson",
      role: "BuildRight Contractors",
      content: "Customers comment on how professional our website is. The video ads are converting really well too.",
      avatar: "JW"
    }
  ];

  const faqItems = [
    {
      question: "How long does the setup take?",
      answer: "Typically 5-7 business days from kickoff to launch. We handle all the technical work so you can focus on your business."
    },
    {
      question: "Can I customize after launch?",
      answer: "Yes! We'll train your team. We also offer white-glove updates for $47/hour if you'd prefer us to handle changes."
    },
    {
      question: "What about calculators beyond 10 services?",
      answer: "We include up to 10 service calculators. Additional calculators are $47 each, or we can use calculator groups to stay within 10."
    },
    {
      question: "Which CRMs do you support?",
      answer: "We integrate with 500+ platforms via Zapier and direct integrations including HubSpot, Salesforce, Pipedrive, Zoho, and more."
    },
    {
      question: "What's included after launch?",
      answer: "30 days of email support and bug fixes included. Optional ongoing support packages available starting at $97/month."
    },
    {
      question: "Is there a money-back guarantee?",
      answer: "Yes. 30-day money-back guarantee if you're not satisfied. We're confident you'll love the results."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <img src={autobidderLogo} alt="Autobidder" className="w-6 h-6" />
                <span className="font-semibold text-gray-900">Autobidder</span>
              </div>
            </Link>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Get a complete done-for-you marketing system in one week
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Professional website, custom calculators, CRM integration, email automation, and video ads. All for $997. We handle the setup—you get the leads.
            </p>
            <div className="flex gap-3 mb-8 flex-wrap">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Schedule Your Setup <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-50">
                View Pricing
              </Button>
            </div>
            <p className="text-sm text-gray-500">No credit card required. Setup includes 30 days of support.</p>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">What's Included</h2>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl">
          Everything you need to turn more website visitors into paying customers. Fully configured and ready to go.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {setupIncludes.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-blue-50 flex-shrink-0">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="inline-flex p-3 rounded-lg bg-white border border-gray-200 mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl">
          From initial consultation to live launch—all in just 5-7 business days.
        </p>

        <div className="grid md:grid-cols-4 gap-6">
          {processsteps.map((step, idx) => (
            <div key={idx}>
              <div className="mb-4">
                <div className="inline-flex w-12 h-12 rounded-lg bg-blue-100 items-center justify-center">
                  <span className="font-semibold text-blue-600">{step.number}</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">Hear from Our Clients</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
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
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-gray-900 mb-12">Frequently Asked Questions</h2>

        <div className="max-w-2xl space-y-4">
          {faqItems.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <span className="font-semibold text-gray-900">{item.question}</span>
                <span className={`text-gray-600 transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {expandedFaq === idx && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <p className="text-gray-700">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white border-y border-blue-700">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of service businesses getting more qualified leads with their automated system.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-white hover:bg-gray-100 text-blue-600">
              Schedule Consultation <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
              <Phone className="mr-2 w-4 h-4" /> Call Us
            </Button>
          </div>
          <p className="text-blue-100 text-sm mt-8">
            Questions? <span className="underline cursor-pointer">Chat with our team</span>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={autobidderLogo} alt="Autobidder" className="w-5 h-5" />
                <span className="font-semibold text-gray-900">Autobidder</span>
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

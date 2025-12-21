import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Zap, ArrowRight, TrendingUp, MapPin, FileText, Video, Target, Search, Globe, BarChart3, Users, DollarSign, Clock, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function AbSeoPlan() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const monthlyDeliverables = [
    {
      icon: Video,
      title: "Custom 30-Second AI Video",
      description: "Professional, branded video content created with AI to showcase your services and engage potential customers.",
      quantity: "1 per month"
    },
    {
      icon: FileText,
      title: "Blog Posts",
      description: "SEO-optimized blog content targeting high-intent keywords related to your services and service areas.",
      quantity: "2 per month"
    },
    {
      icon: MapPin,
      title: "Location Pages",
      description: "Hyper-targeted landing pages for each city and neighborhood you serve, dominating local search results.",
      quantity: "50 per month"
    }
  ];

  const whySeoIsDifferent = [
    {
      title: "Traditional SEO is Dead",
      description: "Generic keywords like 'pressure washing near me' are saturated. Everyone's fighting for the same spots."
    },
    {
      title: "High-Intent Keywords Win",
      description: "We target price and cost-based searches - people actively comparing and ready to buy."
    },
    {
      title: "Domination Effect",
      description: "When you rank for high-intent phrases, your site naturally rises for basic keywords too."
    },
    {
      title: "Local Search Monopoly",
      description: "50 location pages per month means you'll own search results in every area you serve."
    }
  ];

  const benefits = [
    {
      stat: "50+",
      title: "Location Pages",
      description: "Per month targeting your service areas"
    },
    {
      stat: "High-Intent",
      title: "Keyword Focus",
      description: "Price & cost searches that convert"
    },
    {
      stat: "Organic",
      title: "Traffic Growth",
      description: "Sustainable lead generation"
    }
  ];

  const faqItems = [
    {
      question: "How is this different from traditional SEO?",
      answer: "Traditional SEO focuses on generic keywords that everyone targets. Our approach focuses on high-intent, price-based searches where customers are actively comparing options and ready to buy. This brings in more qualified leads."
    },
    {
      question: "What are location pages?",
      answer: "Location pages are dedicated landing pages for each city, neighborhood, or service area you cover. Each page is optimized to rank in local searches, helping you dominate the map pack and organic results in that specific area."
    },
    {
      question: "How long until I see results?",
      answer: "SEO is a long-term strategy. Most clients start seeing ranking improvements within 60-90 days, with significant traffic increases within 4-6 months. The location pages compound over time, creating lasting competitive advantage."
    },
    {
      question: "What kind of AI videos do you create?",
      answer: "We create 30-second professional videos that showcase your services, highlight your unique value proposition, and can be used across your website, social media, and advertising campaigns."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes! There are no long-term contracts. You can cancel your subscription at any time. All the content we've created for you stays on your website."
    },
    {
      question: "What topics will the blog posts cover?",
      answer: "Blog posts are strategically chosen to target high-intent keywords in your industry - things like pricing guides, cost comparisons, service explanations, and seasonal content that attracts buyers ready to make a decision."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-blue-900/30 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer" data-testid="link-home">
                <img src={autobidderLogo} alt="Autobidder" className="w-6 h-6" />
                <span className="font-bold">Autobidder</span>
              </div>
            </Link>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white" data-testid="button-login">Login</Button>
              </Link>
              <Button 
                onClick={() => window.location.href = 'https://buy.stripe.com/test_placeholder'} 
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                data-testid="button-get-started-header"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-green-600 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6">
              <span className="text-sm font-semibold text-green-400 bg-green-950/50 border border-green-800 px-4 py-2 rounded-full">
                SEO That Actually Works
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Dominate Local Search with{" "}
              <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                High-Intent SEO
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Forget outdated SEO tactics. Our system targets price and cost-based searches where customers are ready to buy - and it works.
            </p>

            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-5xl font-bold text-white">$297</span>
              <span className="text-xl text-gray-400">/month</span>
            </div>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white h-14 px-8"
                data-testid="button-get-started-hero"
              >
                Start Growing Today <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video rounded-2xl overflow-hidden border border-slate-700" data-testid="sales-video">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/Ugp9PiiLC1g"
                title="Sales Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              SEO as You Know It is <span className="text-red-400">Dead</span>
            </h2>
            <p className="text-xl text-gray-300">
              Everyone's competing for the same generic keywords. It's time for a smarter approach.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {whySeoIsDifferent.map((item, index) => (
              <Card key={index} className="bg-slate-900/50 border-slate-700 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-gray-400">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-20 relative bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              What You Get <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">Every Month</span>
            </h2>
            <p className="text-xl text-gray-300">
              Quantifiable deliverables that compound over time to dominate your local market.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {monthlyDeliverables.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="bg-slate-900/80 border-slate-700 overflow-hidden hover:border-green-500/50 transition-colors">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-semibold text-green-400 mb-2">{item.quantity}</div>
                    <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {benefits.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {item.stat}
                </div>
                <div className="text-xl font-semibold text-white mb-1">{item.title}</div>
                <div className="text-gray-400">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              How Our SEO System <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">Works</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center flex-shrink-0 font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Target High-Intent Keywords</h3>
                  <p className="text-gray-400">We identify price and cost-based search terms that indicate buying intent - not just curiosity.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center flex-shrink-0 font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Build Location Authority</h3>
                  <p className="text-gray-400">50 location pages per month create a web of local relevance that Google loves.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center flex-shrink-0 font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Create Valuable Content</h3>
                  <p className="text-gray-400">Blog posts and AI videos establish expertise and keep visitors engaged.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center flex-shrink-0 font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Dominate & Compound</h3>
                  <p className="text-gray-400">As high-intent rankings grow, your entire site rises for basic keywords too.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="pricing-card-animated overflow-hidden rounded-2xl">
              <CardContent className="p-10 text-center">
                <div className="inline-block mb-4">
                  <span className="text-sm font-semibold text-green-400 bg-green-950/50 border border-green-800 px-4 py-1 rounded-full">
                    Monthly SEO Plan
                  </span>
                </div>
                
                <h3 className="text-3xl font-bold text-white mb-4">Ready to Dominate Local Search?</h3>
                
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-6xl font-bold text-white">$297</span>
                  <span className="text-xl text-gray-400">/month</span>
                </div>

                <ul className="text-left max-w-md mx-auto mb-8 space-y-3">
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    1 Custom 30-second AI Video
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    2 SEO-Optimized Blog Posts
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    50 Location Pages
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    High-Intent Keyword Targeting
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    Cancel Anytime
                  </li>
                </ul>

                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white h-14 px-10 w-full md:w-auto"
                  data-testid="button-subscribe"
                >
                  Subscribe Now <ArrowRight className="ml-2 w-4 h-4" />
                </Button>

                <p className="text-gray-500 text-sm mt-4">No long-term contracts. Cancel anytime.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 relative bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Frequently Asked <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">Questions</span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, index) => (
              <Card 
                key={index} 
                className="bg-slate-900/50 border-slate-700 overflow-hidden cursor-pointer hover:border-slate-600 transition-colors"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  {expandedFaq === index && (
                    <p className="text-gray-400 mt-4">{item.answer}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Stop Competing. Start <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">Dominating.</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join service businesses that are winning local search with our high-intent SEO strategy.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white h-14 px-10"
            data-testid="button-get-started-footer"
          >
            Get Started for $297/mo <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-2">
              <img src={autobidderLogo} alt="Autobidder" className="w-6 h-6" />
              <span className="font-bold">Autobidder</span>
            </div>
            <div className="flex gap-6 text-gray-400 text-sm">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Autobidder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

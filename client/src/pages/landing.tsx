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
      content: "PriceBuilder Pro transformed our business. We went from 20 leads per month to 65+ leads. The calculators do the selling for us!",
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
      name: "Professional",
      price: 97,
      yearlyPrice: 77,
      popular: true,
      description: "Perfect for growing businesses",
      features: [
        "Unlimited calculators",
        "Advanced formula builder",
        "Custom branding",
        "Lead management",
        "Analytics dashboard",
        "Email integrations",
        "Priority support"
      ]
    },
    {
      name: "Starter",
      price: 49,
      yearlyPrice: 39,
      popular: false,
      description: "Great for small businesses",
      features: [
        "5 calculators",
        "Basic formula builder",
        "Basic branding",
        "Lead capture",
        "Basic analytics",
        "Email support"
      ]
    },
    {
      name: "Enterprise",
      price: 297,
      yearlyPrice: 237,
      popular: false,
      description: "For large teams & agencies",
      features: [
        "Unlimited everything",
        "White-label solution",
        "Advanced integrations",
        "Team management",
        "Custom domains",
        "API access",
        "Dedicated support"
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img 
                src={autobidderLogo} 
                alt="PriceBuilder Pro" 
                className="h-10 w-10"
              />
              <span className="text-xl font-bold text-gray-900">PriceBuilder Pro</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">Features</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium">Success Stories</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</a>
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 px-4 py-2">
            🚀 Trusted by 2,400+ Growing Businesses
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Turn Website Visitors Into
            <span className="text-blue-600 block">Paying Customers</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Stop losing leads to "I'll get back to you" responses. Give customers instant, accurate quotes 
            with AI-powered pricing calculators that convert 3x better than traditional forms.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-2 hover:bg-gray-50">
              <PlayCircle className="mr-2 h-5 w-5" />
              Watch 2-Min Demo
            </Button>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              The Results Speak for Themselves
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of service businesses who've transformed their lead generation 
              and doubled their conversion rates with intelligent pricing calculators.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center p-8 border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <benefit.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-800">
              Everything You Need
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built for Service Businesses Like Yours
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From simple calculators to complex multi-service pricing, we've got everything 
              you need to capture more leads and close more deals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-white">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800">
              Success Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Real Results from Real Businesses
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. See how service businesses are using 
              PriceBuilder Pro to grow their revenue and streamline operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-0">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-4">
                      {testimonial.image}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.name}</div>
                      <div className="text-gray-600 text-sm">{testimonial.role}</div>
                      <div className="text-blue-600 text-sm font-medium">{testimonial.company}</div>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic leading-relaxed">"{testimonial.content}"</p>
                </CardContent>
              </Card>
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

                  <Link href="/signup">
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
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to 3x Your Lead Generation?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Join 2,400+ service businesses already using PriceBuilder Pro to capture more leads, 
            save time, and grow their revenue. Start your free trial today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
              Schedule Demo
            </Button>
          </div>

          <p className="mt-6 text-blue-100">
            No credit card required • 14-day free trial • Setup in under 10 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src={autobidderLogo} 
                  alt="PriceBuilder Pro" 
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold">PriceBuilder Pro</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                The complete pricing calculator platform for service businesses. 
                Turn visitors into customers with intelligent quotes.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Templates</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 PriceBuilder Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
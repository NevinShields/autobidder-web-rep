import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  Users,
  BarChart3,
  Palette,
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Calendar,
  Mail,
  MessageSquare,
  Camera,
  Map,
  CreditCard,
  FileText,
  Clock,
  Target,
  Sparkles,
  Bot,
  Link as LinkIcon,
  Workflow,
  PieChart,
  Shield,
  Bell,
  Settings,
  Layers,
  DollarSign,
  TrendingUp,
  Smartphone,
  Code,
  Send,
  Receipt,
  MapPin,
  Percent,
  ShoppingCart,
  Building2,
  Play
} from "lucide-react";
import { Link } from "wouter";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function Features() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const heroStats = [
    { number: "3x", label: "More Leads" },
    { number: "67%", label: "Higher Conversion" },
    { number: "15hrs", label: "Saved Weekly" },
    { number: "2,400+", label: "Happy Businesses" }
  ];

  const mainFeatures = [
    {
      id: "calculator",
      icon: Calculator,
      title: "AI-Powered Pricing Calculators",
      subtitle: "Create complex pricing in minutes, not hours",
      description: "Build intelligent pricing calculators that automatically calculate accurate quotes based on your unique pricing logic. No coding required.",
      color: "blue",
      features: [
        {
          icon: Sparkles,
          title: "AI Formula Generation",
          description: "Describe your service and our AI creates a complete pricing calculator with variables, formulas, and professional design"
        },
        {
          icon: Settings,
          title: "Flexible Variable Types",
          description: "Number inputs, dropdowns, checkboxes, multiple-choice cards, and conditional logic that shows/hides fields dynamically"
        },
        {
          icon: MapPin,
          title: "Distance-Based Pricing",
          description: "Automatically add travel fees for customers outside your service radius. Set per-mile rates or percentage-based fees"
        },
        {
          icon: Percent,
          title: "Discounts & Promotions",
          description: "Create percentage-based discounts that customers can apply. Enable discount stacking for special promotions"
        },
        {
          icon: ShoppingCart,
          title: "Upsells & Add-ons",
          description: "Offer optional upgrades like premium materials or rush service. Fixed price or percentage of the main service"
        },
        {
          icon: Layers,
          title: "Multi-Service Bundles",
          description: "Let customers select multiple services in one quote. Apply bundle discounts automatically"
        }
      ],
      image: "/calculator-preview.png"
    },
    {
      id: "leads",
      icon: Users,
      title: "Lead Capture & CRM",
      subtitle: "Never lose a lead again",
      description: "Automatically capture customer information when they get a quote. Track every lead through your sales pipeline with a visual CRM.",
      color: "green",
      features: [
        {
          icon: Target,
          title: "Instant Lead Capture",
          description: "Every quote request automatically captures name, email, phone, address, and all pricing details"
        },
        {
          icon: Workflow,
          title: "8-Stage Sales Pipeline",
          description: "Track leads from new inquiry through estimate, booking, completion, and payment with visual pipeline management"
        },
        {
          icon: FileText,
          title: "Complete Audit Trail",
          description: "See every stage change, email sent, and interaction with full history and timestamps"
        },
        {
          icon: Camera,
          title: "Photo Uploads",
          description: "Customers can upload photos of their project for more accurate quotes and better preparation"
        },
        {
          icon: PieChart,
          title: "Lead Analytics",
          description: "Track conversion rates, identify your best-performing services, and optimize your pricing"
        },
        {
          icon: Bell,
          title: "Instant Notifications",
          description: "Get notified immediately when new leads come in via email, SMS, or push notifications"
        }
      ]
    },
    {
      id: "estimates",
      icon: FileText,
      title: "Estimates & Proposals",
      subtitle: "Professional quotes that close deals",
      description: "Send beautiful, branded estimates that customers can review, approve, and sign online. Track when they're opened and accepted.",
      color: "purple",
      features: [
        {
          icon: Send,
          title: "One-Click Sending",
          description: "Review the auto-generated quote and send professional estimates instantly with your branding"
        },
        {
          icon: Mail,
          title: "Email Open Tracking",
          description: "Know exactly when customers open your estimates so you can follow up at the right time"
        },
        {
          icon: CheckCircle,
          title: "Online Acceptance",
          description: "Customers can accept proposals with one click. No printing, scanning, or mailing required"
        },
        {
          icon: Receipt,
          title: "Invoice Generation",
          description: "Convert accepted estimates to invoices automatically. Integrate with Stripe for online payments"
        },
        {
          icon: Clock,
          title: "Expiring Quotes",
          description: "Create urgency with time-limited quotes that encourage faster decisions"
        },
        {
          icon: Building2,
          title: "Custom Branding",
          description: "Your logo, colors, and business details on every estimate for a professional impression"
        }
      ]
    },
    {
      id: "booking",
      icon: Calendar,
      title: "Booking & Scheduling",
      subtitle: "Fill your calendar automatically",
      description: "Let customers book appointments directly after getting a quote. Sync with Google Calendar and manage your availability effortlessly.",
      color: "orange",
      features: [
        {
          icon: Calendar,
          title: "Availability Management",
          description: "Set your working hours, block off vacation days, and define booking windows up to 90 days out"
        },
        {
          icon: Globe,
          title: "Google Calendar Sync",
          description: "Two-way sync with Google Calendar. Your availability updates automatically based on your existing appointments"
        },
        {
          icon: MapPin,
          title: "Route Optimization",
          description: "Prevent booking conflicts by setting maximum distance between jobs on the same day"
        },
        {
          icon: Mail,
          title: "Confirmation Emails",
          description: "Automatic confirmation emails with appointment details, your contact info, and calendar invites"
        },
        {
          icon: Clock,
          title: "Custom Time Slots",
          description: "Create slots of any duration with custom titles and notes for different service types"
        },
        {
          icon: Smartphone,
          title: "Customer Self-Service",
          description: "Customers book directly from the quote confirmation. No phone calls or back-and-forth needed"
        }
      ]
    },
    {
      id: "automation",
      icon: Zap,
      title: "CRM Automation",
      subtitle: "Put your follow-ups on autopilot",
      description: "Build powerful automation workflows that send emails, SMS messages, update lead stages, and create tasks automatically.",
      color: "yellow",
      features: [
        {
          icon: Workflow,
          title: "Visual Workflow Builder",
          description: "Drag-and-drop interface to create multi-step automations with triggers, conditions, and actions"
        },
        {
          icon: Zap,
          title: "Event Triggers",
          description: "Trigger workflows on lead creation, estimate sent/viewed/accepted, booking confirmed, job completed, and more"
        },
        {
          icon: Mail,
          title: "Email Automation",
          description: "Send personalized emails with dynamic variables like customer name, price, service details, and appointment times"
        },
        {
          icon: MessageSquare,
          title: "SMS Messaging",
          description: "Send text messages via Twilio for appointment reminders, confirmations, and follow-ups"
        },
        {
          icon: Clock,
          title: "Smart Delays",
          description: "Add wait steps between actions. Send a follow-up 3 days after an estimate is viewed but not accepted"
        },
        {
          icon: Target,
          title: "Stage Updates",
          description: "Automatically move leads through your pipeline based on their actions and engagement"
        }
      ]
    },
    {
      id: "ai",
      icon: Bot,
      title: "AI-Powered Features",
      subtitle: "Let AI do the heavy lifting",
      description: "Leverage cutting-edge AI from Claude, Gemini, and OpenAI to generate formulas, measure photos, and create professional content.",
      color: "pink",
      features: [
        {
          icon: Sparkles,
          title: "Formula Generation",
          description: "Describe your service in plain English and AI creates a complete pricing calculator with realistic market rates"
        },
        {
          icon: Camera,
          title: "Photo Measurement",
          description: "Customers upload photos and AI calculates dimensions using reference objects like doors, windows, or bricks"
        },
        {
          icon: Map,
          title: "Map Measurement",
          description: "Draw on Google Maps to measure areas, perimeters, and distances for landscaping, roofing, or paving"
        },
        {
          icon: Palette,
          title: "AI Styling",
          description: "Describe your brand and AI generates custom CSS to match your website perfectly"
        },
        {
          icon: Settings,
          title: "Smart Refinement",
          description: "Tell the AI what to change about your formula and it updates variables, pricing, and logic intelligently"
        },
        {
          icon: Shield,
          title: "Multi-Provider Fallback",
          description: "Uses Claude, Gemini, and OpenAI with automatic failover for maximum reliability"
        }
      ]
    },
    {
      id: "embed",
      icon: Code,
      title: "Website Integration",
      subtitle: "Embed anywhere in minutes",
      description: "Add your pricing calculator to any website with simple embed codes. Works with WordPress, Wix, Squarespace, and any custom site.",
      color: "indigo",
      features: [
        {
          icon: Code,
          title: "One-Line Embed",
          description: "Copy and paste a single line of code to add your calculator to any webpage"
        },
        {
          icon: Palette,
          title: "10+ Design Themes",
          description: "Choose from Modern, Professional, Vibrant, Minimal, and more. Or customize every detail"
        },
        {
          icon: Smartphone,
          title: "Mobile Responsive",
          description: "Calculators look perfect on phones, tablets, and desktops with automatic responsive design"
        },
        {
          icon: Layers,
          title: "Multi-Step Forms",
          description: "Guide customers through service selection, configuration, contact info, and booking in a smooth flow"
        },
        {
          icon: LinkIcon,
          title: "Custom Forms",
          description: "Create branded quote forms with custom URLs for specific services or marketing campaigns"
        },
        {
          icon: Building2,
          title: "Duda Integration",
          description: "Native integration with Duda website builder for seamless form submissions"
        }
      ]
    },
    {
      id: "integrations",
      icon: LinkIcon,
      title: "Powerful Integrations",
      subtitle: "Connect your favorite tools",
      description: "Integrate with 6,000+ apps via Zapier, sync with Google services, send emails through Resend or Gmail, and more.",
      color: "teal",
      features: [
        {
          icon: Zap,
          title: "Zapier Integration",
          description: "Connect to 6,000+ apps. Send leads to your CRM, add rows to spreadsheets, trigger Slack notifications"
        },
        {
          icon: Calendar,
          title: "Google Calendar",
          description: "Bi-directional sync keeps your availability accurate and appointments organized"
        },
        {
          icon: Map,
          title: "Google Maps",
          description: "Address autocomplete, geocoding, distance calculation, and visual map measurement tools"
        },
        {
          icon: FileText,
          title: "Google Sheets",
          description: "Export leads to spreadsheets for reporting, backup, or integration with other tools"
        },
        {
          icon: CreditCard,
          title: "Stripe Payments",
          description: "Accept invoice payments online with secure Stripe checkout and subscription billing"
        },
        {
          icon: Mail,
          title: "Email Delivery",
          description: "Reliable email sending through Resend with automatic Gmail fallback"
        }
      ]
    },
    {
      id: "team",
      icon: Users,
      title: "Team Collaboration",
      subtitle: "Work together seamlessly",
      description: "Invite team members with role-based permissions. Everyone sees the same leads, calendar, and customer data.",
      color: "cyan",
      features: [
        {
          icon: Users,
          title: "Invite Employees",
          description: "Add team members via email invitation. They get their own login with access to your business data"
        },
        {
          icon: Shield,
          title: "Role-Based Permissions",
          description: "Control who can view leads, edit formulas, manage billing, access AI features, and more"
        },
        {
          icon: Building2,
          title: "Shared Workspace",
          description: "Everyone works from the same leads, calendar, and settings. No data silos or sync issues"
        },
        {
          icon: Bell,
          title: "Team Notifications",
          description: "Route lead notifications to specific team members based on service type or availability"
        },
        {
          icon: Workflow,
          title: "Task Assignment",
          description: "Create tasks for team members from automations or manually from the lead view"
        },
        {
          icon: BarChart3,
          title: "Team Analytics",
          description: "Track performance across team members to identify top performers and training opportunities"
        }
      ]
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Elite Cleaning Services",
      result: "$2.1M Revenue",
      content: "We went from 20 leads per month to 65+ leads. The AI-powered calculators do the selling for us while we focus on the actual work.",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Rodriguez Landscaping",
      result: "250% Growth",
      content: "Our conversion rate jumped from 12% to 34%. Customers love getting instant quotes instead of waiting for callbacks.",
      rating: 5
    },
    {
      name: "Lisa Chen",
      role: "Crystal Clear Windows",
      result: "$47K First Month",
      content: "I was skeptical at first, but after one month we booked $47,000 in new work. The automation features save me hours every day.",
      rating: 5
    },
    {
      name: "David Thompson",
      role: "Premier Pressure Washing",
      result: "15 Hours Saved/Week",
      content: "No more phone tag trying to give quotes. Customers get their price instantly and book right then. Game changer for our business.",
      rating: 5
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
      blue: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", gradient: "from-blue-500 to-blue-600" },
      green: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", gradient: "from-green-500 to-green-600" },
      purple: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", gradient: "from-purple-500 to-purple-600" },
      orange: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30", gradient: "from-orange-500 to-orange-600" },
      yellow: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30", gradient: "from-yellow-500 to-yellow-600" },
      pink: { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30", gradient: "from-pink-500 to-pink-600" },
      indigo: { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30", gradient: "from-indigo-500 to-indigo-600" },
      teal: { bg: "bg-teal-500/20", text: "text-teal-400", border: "border-teal-500/30", gradient: "from-teal-500 to-teal-600" },
      cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30", gradient: "from-cyan-500 to-cyan-600" }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <img src={autobidderLogo} alt="Autobidder" className="h-8 w-8" />
                </div>
                <span className="text-xl font-bold text-white">Autobidder</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-white/70 hover:text-white font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-white/70 hover:text-white font-medium transition-colors">How It Works</a>
              <a href="#testimonials" className="text-white/70 hover:text-white font-medium transition-colors">Success Stories</a>
              <Link href="/pricing">
                <span className="text-white/70 hover:text-white font-medium transition-colors cursor-pointer">Pricing</span>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 rounded-xl border border-white/20">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/20 px-4 py-2">
              The Complete Platform for Service Businesses
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Everything You Need to
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Capture, Quote & Close
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed">
              From AI-powered pricing calculators to automated follow-ups, Autobidder gives service businesses
              the tools to convert more leads and grow revenue on autopilot.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/onboarding">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-2xl border border-white/20 shadow-2xl">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="bg-white/5 hover:bg-white/10 text-white px-8 py-6 text-lg rounded-2xl border border-white/20">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {heroStats.map((stat, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                    {stat.number}
                  </div>
                  <div className="text-white/60 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/10 text-white border border-white/20">
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                One Platform, Endless Possibilities
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Every tool you need to automate your quoting, streamline your operations, and grow your business.
            </p>
          </div>

          {/* Feature Navigation Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {mainFeatures.map((feature) => {
              const colors = getColorClasses(feature.color);
              const Icon = feature.icon;
              return (
                <a
                  key={feature.id}
                  href={`#${feature.id}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${colors.bg} ${colors.border} hover:scale-105`}
                >
                  <Icon className={`h-4 w-4 ${colors.text}`} />
                  <span className="text-white/80 text-sm font-medium">{feature.title.split(" ")[0]}</span>
                </a>
              );
            })}
          </div>

          {/* Feature Sections */}
          <div className="space-y-32">
            {mainFeatures.map((feature, featureIndex) => {
              const colors = getColorClasses(feature.color);
              const Icon = feature.icon;
              const isEven = featureIndex % 2 === 0;

              return (
                <div key={feature.id} id={feature.id} className="scroll-mt-24">
                  {/* Feature Header */}
                  <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center mb-12`}>
                    <div className="lg:w-1/2">
                      <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${colors.bg} ${colors.border} border mb-6`}>
                        <Icon className={`h-5 w-5 ${colors.text}`} />
                        <span className={`font-semibold ${colors.text}`}>{feature.subtitle}</span>
                      </div>

                      <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        {feature.title}
                      </h3>

                      <p className="text-lg text-white/70 leading-relaxed mb-8">
                        {feature.description}
                      </p>

                      <Link href="/onboarding">
                        <Button className={`bg-gradient-to-r ${colors.gradient} text-white px-6 py-3 rounded-xl`}>
                          Try It Free
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    <div className="lg:w-1/2">
                      <div className={`bg-gradient-to-br ${colors.bg} backdrop-blur-sm border ${colors.border} rounded-3xl p-8 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                        <div className="relative">
                          <Icon className={`h-32 w-32 ${colors.text} opacity-50 mx-auto`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature Details Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {feature.features.map((subFeature, subIndex) => {
                      const SubIcon = subFeature.icon;
                      return (
                        <Card key={subIndex} className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
                          <CardContent className="p-6">
                            <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                              <SubIcon className={`h-6 w-6 ${colors.text}`} />
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">
                              {subFeature.title}
                            </h4>
                            <p className="text-white/60 text-sm leading-relaxed">
                              {subFeature.description}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/10 text-white border border-white/20">
              Simple Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Get up and running in minutes, not days. Here's how Autobidder transforms your business.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  title: "Create Your Calculator",
                  description: "Describe your service and AI generates a complete pricing calculator, or build one from scratch with our visual editor.",
                  icon: Calculator
                },
                {
                  step: "2",
                  title: "Embed on Your Website",
                  description: "Copy one line of code and paste it into your website. Works with any platform - WordPress, Wix, Squarespace, or custom.",
                  icon: Code
                },
                {
                  step: "3",
                  title: "Capture Leads Automatically",
                  description: "When visitors get quotes, their contact info and pricing details flow directly into your CRM pipeline.",
                  icon: Users
                },
                {
                  step: "4",
                  title: "Close More Deals",
                  description: "Send estimates, book appointments, and automate follow-ups. Watch your conversion rate soar.",
                  icon: TrendingUp
                }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="relative">
                    {index < 3 && (
                      <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50 -translate-x-1/2"></div>
                    )}
                    <div className="text-center">
                      <div className="relative inline-block mb-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-white/10">
                          <Icon className="h-10 w-10 text-blue-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {item.step}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500/20 text-green-400 border border-green-500/30">
              Success Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                Real Results from Real Businesses
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              See how service businesses are using Autobidder to transform their lead generation and revenue.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-white/80 text-sm italic mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="border-t border-white/10 pt-4">
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-white/50 text-sm">{testimonial.role}</div>
                    <div className="text-green-400 text-sm font-medium mt-1">{testimonial.result}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Ready to Transform Your Business?
              </span>
            </h2>
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              Join 2,400+ service businesses already using Autobidder to capture more leads,
              save time, and grow their revenue. Start your free trial today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/onboarding">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-2xl shadow-2xl">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="bg-white/5 hover:bg-white/10 text-white px-8 py-6 text-lg rounded-2xl border border-white/20">
                  View Pricing
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-white/60 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                14-day free trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                Setup in under 10 minutes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                <img src={autobidderLogo} alt="Autobidder" className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-white">Autobidder</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-white/60 text-sm mb-6 md:mb-0">
              <Link href="/pricing"><span className="hover:text-white cursor-pointer">Pricing</span></Link>
              <Link href="/terms"><span className="hover:text-white cursor-pointer">Terms</span></Link>
              <Link href="/privacy"><span className="hover:text-white cursor-pointer">Privacy</span></Link>
              <Link href="/faq"><span className="hover:text-white cursor-pointer">FAQ</span></Link>
            </div>

            <div className="text-white/40 text-sm">
              © 2025 Autobidder. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

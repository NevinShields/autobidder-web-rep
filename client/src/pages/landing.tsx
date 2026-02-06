import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Construction,
  Droplets,
  ExternalLink,
  Flame,
  Hammer,
  Home,
  Layout,
  LayoutDashboard,
  Layers,
  Lightbulb,
  MousePointerClick,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Trees,
  Waves,
  Zap,
  BrickWall,
} from "lucide-react";

const Section = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => <section className={`py-24 px-6 md:px-12 max-w-7xl mx-auto ${className}`}>{children}</section>;

const Button = ({
  children,
  variant = "primary",
  className = "",
  onClick,
}: {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void;
}) => {
  const baseStyles =
    "px-8 py-4 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-widest";
  const variants = {
    primary: "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]",
    secondary: "bg-zinc-900 text-white border border-zinc-800 hover:border-zinc-700",
    ghost: "bg-transparent text-zinc-400 hover:text-white",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
};

const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:border-zinc-600 transition-colors group">
    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
      <Icon className="text-white w-6 h-6" />
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-zinc-400 leading-relaxed text-sm">{description}</p>
  </div>
);

const ServiceCard = ({
  icon: Icon,
  label,
  selected = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  selected?: boolean;
}) => (
  <div
    className={`p-4 md:p-6 rounded-2xl border flex flex-col items-center justify-center text-center gap-3 transition-all duration-300 group cursor-pointer ${
      selected
        ? "bg-white/10 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        : "bg-zinc-900/40 border-white/5 hover:border-white/20"
    }`}
  >
    <div
      className={`transition-transform duration-300 group-hover:scale-110 ${
        selected ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
      }`}
    >
      <Icon className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
    </div>
    <span
      className={`text-[10px] md:text-xs font-bold tracking-tight leading-tight uppercase ${
        selected ? "text-white" : "text-zinc-500"
      }`}
    >
      {label}
    </span>
  </div>
);

export default function Landing() {
  const [activeStep, setActiveStep] = useState(0);
  const [showSticky, setShowSticky] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowSticky(window.scrollY >= 400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const plans = [
    {
      name: "Free",
      price: "0",
      description: "For solo pros getting started.",
      features: ["1 Active Calculator", "Instant Estimates", "Basic Lead Capture"],
    },
    {
      name: "Starter",
      price: "49",
      description: "Perfect for growing operations.",
      features: ["3 Active Calculators", "Owner Approval Flow", "Email Notifications"],
    },
    {
      name: "Pro",
      price: "97",
      description: "The complete automation engine.",
      features: [
        "Unlimited Calculators",
        "Full CRM Integration",
        "Conversion Tracking",
        "Conditional Logic",
      ],
      featured: true,
    },
    {
      name: "Enterprise",
      price: "297",
      description: "Scale without the friction.",
      features: [
        "Custom Integrations",
        "Priority Support",
        "Dedicated Account Manager",
        "White-label Options",
      ],
    },
  ];

  const demos = [
    {
      title: "Pressure Washing",
      icon: Droplets,
      description: "Square footage + height based pricing logic.",
      href: "https://mysite.autobidder.org/preview/19d655c0?t=176988756660",
      color: "from-blue-500/20",
    },
    {
      title: "Holiday Lighting",
      icon: Lightbulb,
      description: "Seasonal quoting with instant booking flows.",
      href: "https://mysite.autobidder.org/preview/cfa077a2?t=1769887566696",
      color: "from-emerald-500/20",
    },
    {
      title: "Pest Control",
      icon: ShieldCheck,
      description: "Service type + urgency based pricing logic.",
      href: "https://mysite.autobidder.org/preview/654c1998?t=1769887566590",
      color: "from-cyan-500/20",
    },
    {
      title: "Epoxy Flooring",
      icon: BrickWall,
      description: "Square footage + finish selection logic.",
      href: "https://mysite.autobidder.org/preview/cb7a5041?t=1769887566755",
      color: "from-orange-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] selection:bg-white selection:text-black font-sans relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center backdrop-blur-md bg-[#0a0a0a]/80 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Zap className="text-black w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase">Autobidder</span>
        </div>
        <div className="hidden md:flex gap-8 text-xs font-medium tracking-widest text-zinc-400 uppercase">
          <a href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </a>
          <a href="#demos" className="hover:text-white transition-colors">
            Case Studies
          </a>
          <a href="/login" className="hover:text-white transition-colors">
            Log In
          </a>
        </div>
        <Button className="!py-2 !px-6 !text-[10px]" onClick={() => (window.location.href = "/onboarding")}>
          Start Free
        </Button>
      </nav>

      <Section className="min-h-screen flex flex-col items-center justify-center text-center pt-32">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-[1.1]">
            Stop Chasing Quotes.
            <br />
            <span className="text-zinc-500 italic">Let Customers Price & Book Instantly.</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Autobidder turns your services into an instant pricing and booking system — so leads convert while
            you’re busy working.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button className="w-full md:w-auto" onClick={() => (window.location.href = "/onboarding")}>
              Start Free
            </Button>
            <Button variant="ghost" className="w-full md:w-auto">
              See How It Works <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="mt-20 w-full max-w-5xl aspect-video rounded-3xl bg-gradient-to-b from-zinc-800 to-transparent p-[1px] opacity-80 group">
          <div className="bg-[#0f0f0f] w-full h-full rounded-[calc(1.5rem-1px)] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-8 bg-zinc-900 border-b border-white/5 flex items-center px-4 gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
            </div>
            <div className="flex items-center justify-center h-full flex-col gap-4">
              <div className="w-48 h-4 bg-zinc-800 rounded animate-pulse" />
              <div className="w-64 h-4 bg-zinc-800/50 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </Section>

      <section className="bg-white text-black py-32 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6">
          <div className="space-y-12">
            <div className="text-3xl md:text-5xl font-medium tracking-tight opacity-20 transition-opacity duration-1000 hover:opacity-100 cursor-default">
              "Leads ask how much."
            </div>
            <div className="text-3xl md:text-5xl font-medium tracking-tight opacity-20 transition-opacity duration-1000 hover:opacity-100 cursor-default pl-8">
              "You’re busy."
            </div>
            <div className="text-3xl md:text-5xl font-medium tracking-tight opacity-20 transition-opacity duration-1000 hover:opacity-100 cursor-default pl-16">
              "You reply later."
            </div>
            <div className="text-3xl md:text-5xl font-medium tracking-tight opacity-100 transition-opacity duration-1000 border-l-4 border-black pl-8 italic">
              "They’re gone."
            </div>
          </div>

          <div className="mt-32 border-t border-black/10 pt-16">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">Speed wins jobs.</h2>
            <p className="text-zinc-600 text-xl max-w-xl">
              Autobidder removes the delay between interest and investment.
            </p>
          </div>
        </div>
      </section>

      <Section className="py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 italic">
            One minute to automate your growth.
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Watch how Autobidder handles the heavy lifting while you're on the job.
          </p>
        </div>
        <div className="relative group max-w-5xl mx-auto">
          <div className="absolute -inset-1 bg-white/10 blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 rounded-[2.5rem]" />
          <button
            type="button"
            onClick={() => setIsVideoOpen(true)}
            className="relative aspect-video rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden shadow-2xl w-full"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black via-zinc-900 to-zinc-800 opacity-80" />
            <div className="z-10 flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                <Play className="fill-current w-8 h-8 ml-1" />
              </div>
              <span className="text-xs font-mono tracking-[0.3em] uppercase opacity-50">
                Play Product Tour (1:12)
              </span>
            </div>
          </button>
        </div>
      </Section>

      <Section className="py-40">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight tracking-tight">
              Autobidder isn't a form. <br />
              <span className="text-zinc-600 italic">It's a pricing engine.</span>
            </h2>
            <p className="text-zinc-400 text-lg mb-12">
              Every step is designed to reduce friction, qualify leads, and close faster. No more "contact for
              price" dead ends.
            </p>
            <div className="space-y-6">
              {[
                { label: "Visitor Landing", desc: "User arrives on your site looking for value." },
                { label: "Instant Estimate", desc: "Our engine calculates a precise quote based on your logic." },
                { label: "Owner Approval", desc: "You review and confirm with one tap." },
                { label: "Auto Booking", desc: "Customer pays or books directly on your calendar." },
              ].map((step, idx) => (
                <div
                  key={step.label}
                  className={`flex gap-6 p-4 rounded-2xl transition-all cursor-pointer ${
                    activeStep === idx ? "bg-white/5 border border-white/10" : "opacity-40 hover:opacity-60"
                  }`}
                  onMouseEnter={() => setActiveStep(idx)}
                >
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-sm font-mono shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{step.label}</h4>
                    {activeStep === idx && <p className="text-xs text-zinc-500 mt-1">{step.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="h-12 bg-zinc-800/50 flex items-center px-6 gap-2 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                </div>
                <div className="mx-auto text-[10px] font-mono text-zinc-600 tracking-widest uppercase">
                  Select Your Service
                </div>
              </div>

              <div className="p-4 md:p-8 bg-gradient-to-b from-zinc-900 to-[#0a0a0a]">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  <ServiceCard icon={Home} label="House Wash" selected />
                  <ServiceCard icon={Construction} label="Fence Cleaning" />
                  <ServiceCard icon={Hammer} label="Roof Cleaning" />
                  <ServiceCard icon={Layers} label="Sidewalk Cleaning" />

                  <ServiceCard icon={Droplets} label="Gutter Cleaning" />
                  <ServiceCard icon={Layout} label="Deck Cleaning" />
                  <ServiceCard icon={Smartphone} label="Driveway Cleaning" />
                  <ServiceCard icon={Flame} label="Kitchen Exhaust" />

                  <ServiceCard icon={Home} label="Gazebo Cleaning" />
                  <ServiceCard icon={BrickWall} label="Pergola Cleaning" />
                  <ServiceCard icon={Layers} label="Retaining Wall" />
                  <ServiceCard icon={Lightbulb} label="Holiday Lights" />
                </div>

                <div className="mt-8 flex justify-center">
                  <div className="w-full bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Estimated Total</div>
                    <div className="text-xl font-bold tracking-tighter text-white">$245.00</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -inset-10 bg-white/5 blur-[80px] rounded-full -z-10" />
          </div>
        </div>
      </Section>

      <Section id="demos" className="bg-zinc-950/50 rounded-[4rem] border border-white/5 my-20 py-32">
        <div className="text-center mb-16 px-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 italic">See it in action.</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Choose an industry to see how Autobidder calculates real jobs in seconds.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {demos.map((demo) => (
            <a
              key={demo.title}
              href={demo.href}
              target="_blank"
              rel="noreferrer"
              className={`bg-zinc-900/80 border border-zinc-800 p-8 rounded-[2rem] hover:border-zinc-500 transition-all cursor-pointer group flex flex-col bg-gradient-to-br ${demo.color} to-transparent`}
            >
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                <demo.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{demo.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed mb-8 flex-grow">{demo.description}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">
                Try Live Demo <ExternalLink className="w-3 h-3" />
              </div>
            </a>
          ))}
        </div>
      </Section>

      <Section className="bg-zinc-950 rounded-[4rem] border border-white/5 my-20">
        <div className="grid md:grid-cols-3 gap-12 text-center md:text-left">
          {[
            { title: "Quote jobs in seconds — automatically.", icon: Clock },
            { title: "Only review serious, qualified leads.", icon: ShieldCheck },
            { title: "Let customers book without calling you.", icon: MousePointerClick },
            { title: "Track every lead from ad to approval.", icon: TrendingUp },
            { title: "Works while you're asleep or offline.", icon: Zap },
            { title: "No tech-skills required. Set and forget.", icon: LayoutDashboard },
          ].map((benefit) => (
            <div key={benefit.title} className="group cursor-default">
              <benefit.icon className="w-8 h-8 mb-6 text-zinc-500 group-hover:text-white transition-colors mx-auto md:mx-0" />
              <h3 className="text-2xl font-semibold tracking-tight leading-snug">{benefit.title}</h3>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 italic">Built for Revenue.</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">Standard forms create work. Autobidder eliminates it.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Layers}
            title="Logic-Based Calculators"
            description="Build your pricing once based on sqft, height, roof pitch, or any custom variable."
          />
          <FeatureCard
            icon={Sparkles}
            title="Conditional Logic"
            description="Automatically upsell add-ons like gutter cleaning or window washing during the quote process."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Owner Approval Flow"
            description="Optionally review every quote before it's sent to ensure total accuracy on complex jobs."
          />
          <FeatureCard
            icon={Smartphone}
            title="Mobile Management"
            description="Accept leads and approve quotes from your phone while you're on a job site."
          />
          <FeatureCard
            icon={TrendingUp}
            title="Conversion Tracking"
            description="See exactly which ads and keywords are driving booked appointments, not just leads."
          />
          <FeatureCard
            icon={CheckCircle2}
            title="CRM Integrations"
            description="Sync instantly with Jobber, Housecall Pro, or your existing workflow tools."
          />
        </div>
      </Section>

      <Section id="pricing" className="relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 italic">Calm, Confident Pricing.</h2>
          <p className="text-zinc-500">No contracts. Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 ${
                plan.featured
                  ? "bg-zinc-900 border-white/20 scale-105 z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                  : "bg-zinc-950/50 border-white/5 hover:border-white/10"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-bold uppercase tracking-widest mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tighter">${plan.price}</span>
                  <span className="text-zinc-500 text-sm font-medium">/mo</span>
                </div>
                <p className="text-zinc-500 text-xs mt-4 leading-relaxed">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-3 items-start text-xs text-zinc-400">
                    <Check className={`w-4 h-4 shrink-0 ${plan.featured ? "text-white" : "text-zinc-600"}`} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                variant={plan.featured ? "primary" : "secondary"}
                className="w-full !py-3 !text-[10px]"
                onClick={() => (window.location.href = "/onboarding")}
              >
                {plan.price === "0" ? "Get Started" : "Choose Plan"}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-20 max-w-2xl mx-auto text-center">
          <p className="text-zinc-500 text-sm leading-relaxed italic">
            "One closed job usually pays for Autobidder many times over. Every minute you spend manually quoting
            is a minute you aren't on the tools or growing your business."
          </p>
        </div>
      </Section>

      <section className="bg-emerald-500 py-32 text-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">Want it built for you?</h2>
            <p className="text-black/80 text-xl max-w-md mb-8">
              We’ll design your high-converting website, build your pricing logic, and launch your automated
              growth system in 14 days.
            </p>
            <Button
              variant="secondary"
              className="!bg-black !text-white !border-none"
              onClick={() => (window.location.href = "/dfy-setup")}
            >
              See DFY Growth System <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="hidden md:block">
            <div className="flex flex-col gap-4 opacity-30 transform -rotate-12 translate-x-20">
              <div className="h-20 bg-black/10 rounded-2xl w-[400px]" />
              <div className="h-20 bg-black/10 rounded-2xl w-[500px]" />
              <div className="h-20 bg-black/10 rounded-2xl w-[450px]" />
            </div>
          </div>
        </div>
      </section>

      <Section className="py-40 text-center">
        <h2 className="text-4xl md:text-7xl font-bold tracking-tighter mb-8 max-w-4xl mx-auto">
          Autobidder doesn't replace your sales process. <br />
          <span className="text-zinc-600 italic">It removes the slow parts.</span>
        </h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center mt-16">
          <Button className="w-full md:w-auto px-12" onClick={() => (window.location.href = "/onboarding")}>
            Start Free
          </Button>
          <Button variant="secondary" className="w-full md:w-auto px-12">
            Book a Demo
          </Button>
        </div>
        <div className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          <div>© 2024 Autobidder Inc.</div>
          <div className="flex gap-12">
            <a href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="https://twitter.com" className="hover:text-white transition-colors">
              Twitter
            </a>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Operational
          </div>
        </div>
      </Section>

      {showSticky && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-[100] md:hidden animate-in slide-in-from-bottom-20 duration-500">
          <Button className="w-full !shadow-2xl" onClick={() => (window.location.href = "/onboarding")}>
            Start Free Trial
          </Button>
        </div>
      )}

      {isVideoOpen && (
        <>
          <div
            onClick={() => setIsVideoOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[140]"
          />
          <div className="fixed left-4 right-4 top-24 md:left-20 md:right-20 md:top-28 z-[150]">
            <div className="relative bg-black rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <button
                onClick={() => setIsVideoOpen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                ×
              </button>
              <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/0Nc2_mwGqlE?autoplay=1"
                  title="Autobidder Product Tour"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

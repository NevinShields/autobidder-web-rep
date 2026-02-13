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
  type LucideIcon,
} from "lucide-react";
import LiquidEther from "@/components/LiquidEther";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

const Section = ({
  children,
  className = "",
  ...props
}: {
  children?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) => (
  <section className={`py-24 px-6 md:px-12 max-w-7xl mx-auto ${className}`} {...props}>
    {children}
  </section>
);

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
  icon: LucideIcon;
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
  icon: LucideIcon;
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
  type ComparisonTier = {
    key: "free" | "starter" | "pro" | "scale";
    label: string;
    price: string;
    featured?: boolean;
  };

  const [activeStep, setActiveStep] = useState(0);
  const [showSticky, setShowSticky] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [mobileComparisonTier, setMobileComparisonTier] = useState<ComparisonTier["key"]>("free");

  const scrollToSection = (sectionId: string) => () => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
      name: "Autobidder Free",
      price: "0",
      description: "Starter access with core visibility tools.",
      features: ["No MeasureMap Features", "10 Leads per Month", "Access to Directory"],
    },
    {
      name: "Core",
      price: "49",
      description: "Essential automation for growing service businesses.",
      features: ["AI Formula Builder", "Dynamic Formula Builder", "Custom Design Editor", "CRM Integration - Zapier"],
    },
    {
      name: "Plus",
      price: "97",
      description: "Expanded toolkit for teams scaling lead flow.",
      features: [
        "Website Included",
        "Autoblogger SEO Tool",
        "AI Measure Tool",
        "Property Data API",
      ],
      featured: true,
    },
    {
      name: "Plus SEO",
      price: "297",
      description: "Growth + SEO acceleration in one plan.",
      features: [
        "Everything in Plus",
        "50 Location Pages Added Monthly for SEO",
        "Custom White Label Video",
      ],
    },
  ];

  const comparisonTiers: ComparisonTier[] = [
    { key: "free", label: "Free", price: "$0" },
    { key: "starter", label: "Starter", price: "$49" },
    { key: "pro", label: "Pro", price: "$97", featured: true },
    { key: "scale", label: "Scale", price: "$297" },
  ];

  const comparisonRows: Array<Record<ComparisonTier["key"] | "feature", string>> = [
    { feature: "Custom Formula Builder", free: "Yes", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Instant Price Estimate (Pre-Estimate)", free: "Yes", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Lead Capture (Name, Email, Phone)", free: "10/ Month", starter: "Unlimited", pro: "Unlimited", scale: "Unlimited" },
    { feature: "Basic Embed (iframe / share link)", free: "Yes", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Publish / Unpublish Control", free: "Yes", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Basic Analytics (views + submissions)", free: "Limited", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Manual Estimate Approval", free: "Optional", starter: "Optional", pro: "Optional", scale: "Optional" },
    { feature: "Multiple Services & Formulas", free: "Yes", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Smart Field Re-use (shared sqft, height)", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Instant Confirmed Estimates", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Custom Pricing Logic (rules & conditions)", free: "Yes", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Booking System (date & time selection)", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Automated Estimate Emails", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Custom Branding (logo & colors)", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Lead Management Dashboard", free: "Yes", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Basic Upsells (add-ons)", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Bundled Discounts", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Conditional Upsells (logic-based)", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Custom Automations", free: "No", starter: "Limited", pro: "Yes", scale: "Yes" },
    { feature: "Zapier Integration", free: "No", starter: "Limited", pro: "Full", scale: "Full" },
    { feature: "Workflow API / Webhooks", free: "No", starter: "No", pro: "Yes", scale: "Yes" },
    { feature: "CRM Integrations (Jobber, HCP, etc.) - via zapier", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Automated SMS Follow-Ups - via twilio", free: "No", starter: "No", pro: "Yes", scale: "Yes" },
    { feature: "AI Formula Builder", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Built-in MeasureMap Tool", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "AI Measure Tool", free: "No", starter: "10/ Day", pro: "20/ Day", scale: "Unlimited" },
    { feature: "Estimate Revision & Resend", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Branded Estimate Pages", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Directory Listing (SEO Indexed)", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Custom Forms", free: "No", starter: "No", pro: "Yes", scale: "Yes" },
    { feature: "ATTOM / Property Data Auto-Fill", free: "No", starter: "No", pro: "Yes", scale: "Yes" },
    { feature: "Bid Verification System", free: "No", starter: "No", pro: "No", scale: "Yes" },
    { feature: "Email Open & Engagement Tracking", free: "No", starter: "No", pro: "No", scale: "Yes" },
    { feature: "Branded PDF Estimates", free: "No", starter: "Yes", pro: "No", scale: "Yes" },
    { feature: "Image & File Attachments on Bids", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "Advanced Analytics & Conversion Tracking", free: "No", starter: "No", pro: "Yes", scale: "Yes" },
    { feature: "Facebook Pixel", free: "No", starter: "Yes", pro: "Yes", scale: "Yes" },
    { feature: "White Label Videos", free: "No", starter: "1/ Month", pro: "3/ Month", scale: "3/ Month" },
    { feature: "Employee Sub-Accounts", free: "No", starter: "No", pro: "Yes", scale: "Yes" },
    { feature: "Priority Support", free: "No", starter: "No", pro: "Yes", scale: "Yes" },
    { feature: "Early Access to New Features", free: "No", starter: "No", pro: "Yes", scale: "Yes" },
    { feature: "SEO Autoblogger", free: "No", starter: "No", pro: "Yes", scale: "Yes" },
    { feature: "SEO DFY", free: "No", starter: "No", pro: "No", scale: "Yes" },
  ];

  const getComparisonValueClass = (value: string, isFeaturedTier: boolean) => {
    const normalized = value.trim().toLowerCase();
    const base = "inline-flex min-w-[84px] items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide";

    if (normalized === "yes" || normalized === "full" || normalized === "unlimited") {
      return `${base} ${isFeaturedTier ? "border-emerald-300/60 bg-emerald-300/15 text-emerald-100" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`;
    }
    if (normalized === "no") {
      return `${base} border-zinc-700 bg-zinc-800/70 text-zinc-400`;
    }
    if (normalized.includes("limited")) {
      return `${base} border-amber-400/40 bg-amber-400/10 text-amber-200`;
    }
    if (normalized.includes("/ month") || normalized.includes("/ day")) {
      return `${base} ${isFeaturedTier ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100" : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"}`;
    }
    if (normalized === "optional") {
      return `${base} border-violet-400/30 bg-violet-400/10 text-violet-200`;
    }
    return `${base} border-zinc-600 bg-zinc-800/80 text-zinc-200`;
  };

  const selectedMobileTier =
    comparisonTiers.find((tier) => tier.key === mobileComparisonTier) || comparisonTiers[0];

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

      <nav className="fixed top-0 w-full z-50 px-4 py-4 md:px-6 md:py-6 flex justify-between items-center backdrop-blur-md bg-[#0a0a0a]/80 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <img src={autobidderLogo} alt="Autobidder logo" className="w-7 h-7 md:w-8 md:h-8 rounded-lg object-cover" />
          <span className="hidden sm:inline text-base md:text-xl font-bold tracking-tighter uppercase truncate">Autobidder</span>
        </div>
        <div className="hidden md:flex gap-8 text-xs font-medium tracking-widest text-zinc-400 uppercase">
          <button type="button" onClick={scrollToSection("pricing")} className="hover:text-white transition-colors">
            Pricing
          </button>
          <button type="button" onClick={scrollToSection("demos")} className="hover:text-white transition-colors">
            Demos
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/login"
            className="h-9 min-h-9 max-h-9 px-3 sm:px-4 inline-flex items-center justify-center rounded-full border border-white/20 text-[10px] leading-none font-medium uppercase tracking-wide sm:tracking-widest text-white/90 hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            Sign In
          </a>
          <Button className="!h-9 !min-h-9 !max-h-9 !py-0 !px-4 sm:!px-6 !text-[10px] !leading-none !tracking-wide sm:!tracking-widest !shadow-none whitespace-nowrap" onClick={() => (window.location.href = "/onboarding")}>
            Start Free
          </Button>
        </div>
      </nav>

      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <LiquidEther
            className="h-full w-full"
            colors={["#1D4ED8", "#4F46E5", "#22D3EE"]}
            resolution={0.4}
            autoDemo
            autoSpeed={0.45}
            autoIntensity={2}
            cursorSize={90}
            mouseForce={18}
            style={{ opacity: 0.7 }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,0,0,0.12),rgba(0,0,0,0.72)_72%)]" />
        </div>

        <Section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center pt-32">
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
              <Button
                variant="ghost"
                className="w-full md:w-auto"
                onClick={scrollToSection("how-it-works-video")}
              >
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
      </section>

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

      <Section id="how-it-works-video" className="py-32">
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

        <div className="mt-16 rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-zinc-950/95 to-zinc-900/90 shadow-[0_20px_80px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="px-8 py-7 border-b border-white/10 bg-black/20">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Feature Comparison</h3>
            <p className="text-zinc-400 text-sm mt-2">
              Compare every plan side by side and pick the level of automation that matches your growth stage.
            </p>
          </div>

          <div className="md:hidden px-4 py-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {comparisonTiers.map((tier) => (
                <button
                  key={`mobile-tab-${tier.key}`}
                  type="button"
                  onClick={() => setMobileComparisonTier(tier.key)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                    mobileComparisonTier === tier.key
                      ? "border-white bg-white text-black"
                      : "border-white/20 bg-zinc-900/70 text-zinc-300 hover:border-white/40"
                  }`}
                >
                  {tier.label} {tier.price}
                </button>
              ))}
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Selected Plan</span>
                <div className="text-right">
                  <div className={`text-sm font-bold ${selectedMobileTier.featured ? "text-emerald-300" : "text-white"}`}>
                    {selectedMobileTier.label}
                  </div>
                  <div className="text-[11px] text-zinc-400">{selectedMobileTier.price}/mo</div>
                </div>
              </div>

              <div>
                {comparisonRows.map((row) => {
                  const value = row[selectedMobileTier.key];
                  return (
                    <div
                      key={`mobile-row-${row.feature}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-white/5 px-4 py-3 last:border-b-0"
                    >
                      <p className="text-sm text-zinc-200 leading-snug">{row.feature}</p>
                      <span className={getComparisonValueClass(value, Boolean(selectedMobileTier.featured))}>{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-zinc-950/95 backdrop-blur px-6 py-5 border-r border-white/10 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                    Feature
                  </th>
                  {comparisonTiers.map((tier) => (
                    <th
                      key={tier.key}
                      className={`px-6 py-5 text-center border-b border-white/10 ${
                        tier.featured ? "bg-white text-black" : "bg-zinc-900/60"
                      }`}
                    >
                      <div className="text-[11px] uppercase tracking-[0.2em] font-bold">{tier.label}</div>
                      <div className={`text-xl font-bold tracking-tight mt-1 ${tier.featured ? "text-black" : "text-white"}`}>
                        {tier.price}
                        <span className={`text-xs ml-1 ${tier.featured ? "text-black/70" : "text-zinc-500"}`}>/mo</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, rowIndex) => (
                  <tr key={row.feature}>
                    <td
                      className={`sticky left-0 z-10 px-6 py-4 border-r border-white/10 text-sm font-medium backdrop-blur ${
                        rowIndex % 2 === 0 ? "bg-zinc-950/96" : "bg-zinc-900/96"
                      }`}
                    >
                      {row.feature}
                    </td>
                    {comparisonTiers.map((tier) => {
                      const value = row[tier.key];
                      return (
                        <td
                          key={`${row.feature}-${tier.key}`}
                          className={`px-4 py-4 text-center border-t border-white/5 ${
                            rowIndex % 2 === 0 ? "bg-zinc-950/60" : "bg-zinc-900/60"
                          } ${tier.featured ? "bg-white/[0.06]" : ""}`}
                        >
                          <span className={getComparisonValueClass(value, Boolean(tier.featured))}>{value}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            <a href="/directory" className="hover:text-white transition-colors">
              Directory
            </a>
            <a href="/setup-step-by-step" className="hover:text-white transition-colors">
              Step-by-Step Setup
            </a>
            <a href="/docs" className="hover:text-white transition-colors">
              Docs
            </a>
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

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  CarFront,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Droplets,
  Home,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Waves,
  X,
  Zap,
} from "lucide-react";
import CalculatorPreview from "@/components/calculator-preview";
import type { Formula } from "@shared/schema";

type LandingTemplateKey =
  | "classic"
  | "split"
  | "spotlight"
  | "bubble-shark"
  | "noir-edge"
  | "fresh-deck"
  | "halo-glass"
  | "atlas-pro"
  | "mono-grid";

interface LandingTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  buttonTextColor: string;
}

const DEFAULT_THEME: LandingTheme = {
  primaryColor: "#2563EB",
  accentColor: "#10B981",
  backgroundColor: "#F8FAFC",
  surfaceColor: "#FFFFFF",
  textColor: "#0F172A",
  mutedTextColor: "#475569",
  buttonTextColor: "#FFFFFF",
};

function sanitizeLandingTheme(input: unknown): LandingTheme {
  const next: LandingTheme = { ...DEFAULT_THEME };
  if (!input || typeof input !== "object") {
    return next;
  }

  const isHex = (value: unknown): value is string =>
    typeof value === "string" && /^#([0-9a-fA-F]{6})$/.test(value.trim());

  for (const key of Object.keys(DEFAULT_THEME) as Array<keyof LandingTheme>) {
    const candidate = (input as Record<string, unknown>)[key];
    if (isHex(candidate)) {
      next[key] = candidate.trim();
    }
  }

  return next;
}

function normalizeLandingServices(
  services: LandingPagePublicData["services"],
): Array<{ serviceId: number; name: string; enabled: boolean; sortOrder: number; imageUrl?: string | null }> {
  if (!Array.isArray(services)) {
    return [];
  }

  return services
    .map((service, index) => {
      const rawEnabled = (service as any)?.enabled;
      const enabled = rawEnabled === true || rawEnabled === "true" || rawEnabled === 1;
      const rawImage = (service as any)?.imageUrl;
      const imageUrl =
        typeof rawImage === "string" && rawImage.trim().length > 0 ? rawImage.trim() : null;

      return {
        serviceId: Number((service as any)?.serviceId),
        name:
          typeof (service as any)?.name === "string" && (service as any).name.trim()
            ? (service as any).name.trim()
            : "Service",
        enabled,
        sortOrder:
          Number.isFinite(Number((service as any)?.sortOrder))
            ? Number((service as any).sortOrder)
            : index,
        imageUrl,
      };
    })
    .filter((service) => Number.isInteger(service.serviceId) && service.serviceId > 0)
    .filter((service, index, arr) => arr.findIndex((candidate) => candidate.serviceId === service.serviceId) === index)
    .filter((service) => service.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 10);
}

export interface LandingPagePublicData {
  id: number;
  userId: string;
  slug: string;
  templateKey: LandingTemplateKey | string | null;
  theme: Partial<LandingTheme> | null;
  businessName: string | null;
  logoUrl: string | null;
  tagline: string | null;
  ctaLabel: string | null;
  trustChips: Array<{ label: string; enabled: boolean; icon?: string }> | null;
  services: Array<{ serviceId: number; name: string; enabled: boolean; sortOrder: number; imageUrl?: string | null }> | null;
  primaryServiceId: number | null;
  primaryServiceEmbedId: string | null;
  enableMultiService: boolean;
  howItWorks: Array<{ title: string; body: string }> | null;
  faqs: Array<{ question: string; answer: string }> | null;
  phone: string | null;
  email: string | null;
  serviceAreaText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  landingPageUrl: string | null;
  leadCapReached: boolean;
  autobidderBrandingRequired: boolean;
}

interface LandingPageViewProps {
  data: LandingPagePublicData;
  isPreview?: boolean;
  previewViewport?: "desktop" | "tablet" | "mobile";
  onLeadSubmitted?: () => void;
}

export default function LandingPageView({ data, isPreview, previewViewport, onLeadSubmitted }: LandingPageViewProps) {
  const [callbackName, setCallbackName] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackNotes, setCallbackNotes] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isPreviewMobile = Boolean(isPreview && previewViewport === "mobile");

  // Returns a fixed grid-cols class when in preview mode, otherwise returns responsive Tailwind classes
  const svcGrid = (mobile: string, tablet: string, desktop: string) => {
    if (previewViewport === "mobile") return mobile;
    if (previewViewport === "tablet") return tablet;
    return desktop;
  };

  const ctaLabel = data.ctaLabel || "Get Instant Quote";
  const trustChips = useMemo(() => (data.trustChips || []).filter((c) => c.enabled), [data.trustChips]);
  const services = useMemo(() => normalizeLandingServices(data.services), [data.services]);
  const howItWorks = (data.howItWorks || []).slice(0, 3);
  const faqs = (data.faqs || []).slice(0, 6);

  const templateKey: LandingTemplateKey =
    data.templateKey === "split" ||
    data.templateKey === "spotlight" ||
    data.templateKey === "bubble-shark" ||
    data.templateKey === "noir-edge" ||
    data.templateKey === "fresh-deck" ||
    data.templateKey === "halo-glass" ||
    data.templateKey === "atlas-pro" ||
    data.templateKey === "mono-grid"
      ? data.templateKey
      : "classic";
  const theme = useMemo(() => sanitizeLandingTheme(data.theme), [data.theme]);

  const bubbleSpecs = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        size: 60 + ((i * 37) % 170),
        left: (i * 17) % 100,
        top: (i * 29) % 100,
        delay: (i % 6) * 0.8,
        duration: 6 + (i % 7),
      })),
    [],
  );

  useEffect(() => {
    if ((templateKey !== "bubble-shark" && templateKey !== "noir-edge") || isPreview) {
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [templateKey, isPreview]);

  useEffect(() => {
    if (isPreview) {
      setIsMenuOpen(false);
      setScrolled(false);
    }
  }, [isPreview, templateKey]);

  const { data: formula } = useQuery<Formula>({
    queryKey: ["/api/embed", data.primaryServiceEmbedId],
    enabled: Boolean(data.primaryServiceEmbedId) && !data.enableMultiService && !isPreview,
  });

  const handleCallbackRequest = async () => {
    if (!callbackName.trim() || !callbackPhone.trim()) return;
    try {
      await fetch("/api/landing-page/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landingPageId: data.id,
          type: "callback_request",
          metadata: { name: callbackName, phone: callbackPhone, notes: callbackNotes },
        }),
      });
      setCallbackName("");
      setCallbackPhone("");
      setCallbackNotes("");
    } catch {
      // Best-effort only
    }
  };

  const QuoteCard = (
    <Card className="shadow-xl" style={{ borderColor: `${theme.primaryColor}33`, backgroundColor: theme.surfaceColor }}>
      <CardHeader>
        <CardTitle style={{ color: theme.textColor }}>Instant Quote</CardTitle>
      </CardHeader>
      <CardContent>
        {isPreview ? (
          <div className="text-sm" style={{ color: theme.mutedTextColor }}>
            Preview mode: calculator disabled.
          </div>
        ) : data.leadCapReached ? (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: theme.mutedTextColor }}>
              We’re fully booked this month, but we can still schedule a callback.
            </p>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={callbackName} onChange={(e) => setCallbackName(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={callbackPhone} onChange={(e) => setCallbackPhone(e.target.value)} />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input value={callbackNotes} onChange={(e) => setCallbackNotes(e.target.value)} />
              </div>
              <Button
                className="w-full"
                onClick={handleCallbackRequest}
                style={{ backgroundColor: theme.primaryColor, color: theme.buttonTextColor }}
              >
                Request Callback
              </Button>
            </div>
          </div>
        ) : data.enableMultiService ? (
          <iframe
            title="Service selector"
            src={`/service-selector?userId=${data.userId}&landingPageId=${data.id}`}
            className="w-full min-h-[460px] sm:min-h-[540px] border rounded-lg"
          />
        ) : formula ? (
          <CalculatorPreview formula={formula as any} onLeadSubmitted={onLeadSubmitted} />
        ) : (
          <div className="text-sm" style={{ color: theme.mutedTextColor }}>
            Calculator unavailable.
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (templateKey === "bubble-shark") {
    const brandName = data.businessName || "Bubble Shark";
    const serviceIcons = [Home, Building2, Zap, CarFront, Droplets, Waves, ShieldCheck, Star];

    return (
      <div className="min-h-screen font-sans selection:bg-cyan-200 relative overflow-x-hidden overflow-y-visible" style={{ backgroundColor: "#f8fafc", color: "#1e293b" }}>
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-14px); }
          }
          .ab-float { animation: float 6s ease-in-out infinite; }
          .ab-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay: 1s; }
          .ab-primary { color: ${theme.primaryColor}; }
          .ab-primary-bg { background-color: ${theme.primaryColor}; }
          .ab-primary-bg-light { background-color: ${theme.primaryColor}1A; }
          .ab-primary-bg-med { background-color: ${theme.primaryColor}33; }
          .ab-primary-hover:hover { opacity: 0.88; }
          .group:hover .ab-group-icon { background-color: ${theme.primaryColor}; color: white; }
        `}</style>

        <div className={`${isPreview ? "absolute" : "fixed"} inset-0 pointer-events-none overflow-hidden z-0 opacity-20`}>
          {bubbleSpecs.map((spec, i) => (
            <div
              key={i}
              className={`absolute rounded-full blur-xl animate-pulse ${i > 5 ? "hidden sm:block" : ""}`}
              style={{
                backgroundColor: theme.primaryColor,
                width: `${spec.size}px`,
                height: `${spec.size}px`,
                left: `${spec.left}%`,
                top: `${spec.top}%`,
                animationDelay: `${spec.delay}s`,
                animationDuration: `${spec.duration}s`,
              }}
            />
          ))}
        </div>

        <nav className={`${isPreview ? "relative" : "fixed"} w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-lg py-2.5 sm:py-3" : "bg-transparent py-3 sm:py-5"}`}>
          <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center gap-3">
            <a href="#top" className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 sm:w-12 sm:h-12 ab-primary-bg rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                {data.logoUrl ? <img src={data.logoUrl} alt={brandName} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" /> : <Waves size={22} className="sm:w-7 sm:h-7" />}
              </div>
              <span className="text-lg sm:text-2xl font-black tracking-tight ab-primary uppercase max-w-[190px] sm:max-w-none truncate">
                {brandName}
              </span>
            </a>

            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="font-semibold hover:opacity-70 transition-opacity">Services</a>
              <a href="#about" className="font-semibold hover:opacity-70 transition-opacity">Why Us</a>
              <a href="#quote" className="font-semibold hover:opacity-70 transition-opacity">Quote</a>
              <a
                href="#quote"
                className="ab-primary-bg ab-primary-hover text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {ctaLabel}
              </a>
            </div>

            <button className="md:hidden text-slate-700" onClick={() => setIsMenuOpen((prev) => !prev)}>
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {isMenuOpen && !isPreview && (
            <div className="md:hidden bg-white border-b absolute w-full left-0 py-4 px-4 flex flex-col gap-3 shadow-xl">
              <a href="#services" onClick={() => setIsMenuOpen(false)} className="text-base font-semibold py-1">Services</a>
              <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-base font-semibold py-1">Why Us</a>
              <a href="#quote" onClick={() => setIsMenuOpen(false)} className="text-base font-semibold py-1">Quote</a>
              <a href="#quote" onClick={() => setIsMenuOpen(false)} className="ab-primary-bg text-white text-center font-bold py-3 rounded-xl mt-1">
                {ctaLabel}
              </a>
            </div>
          )}
        </nav>

        <section id="top" className={`relative ${isPreview ? "pt-8 pb-10 sm:pt-10 sm:pb-12 md:pt-14 md:pb-14" : "pt-24 pb-12 sm:pt-32 sm:pb-20 md:pt-48 md:pb-28"} overflow-hidden`}>
          <div className="container mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
            <div className="space-y-5 sm:space-y-8 text-center md:text-left">
              <div className="inline-flex items-center gap-2 ab-primary-bg-light ab-primary px-3 sm:px-4 py-1.5 rounded-full font-bold text-[10px] sm:text-sm uppercase tracking-wider">
                <Sparkles size={16} /> {trustChips[0]?.label || "5-Star Rated Service"}
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-black leading-[1.08] text-slate-800">
                {brandName}
              </h1>
              <p className="text-base sm:text-xl text-slate-600 max-w-lg mx-auto md:mx-0">
                {data.tagline || "Professional services with transparent pricing and fast response."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                <a
                  href="#quote"
                  className="ab-primary-bg ab-primary-hover text-white px-6 sm:px-8 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  {ctaLabel} <ChevronRight size={20} />
                </a>
                <a
                  href="#services"
                  className="bg-white border-2 border-slate-200 hover:border-slate-300 px-6 sm:px-8 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg text-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  See Services
                </a>
              </div>

              <div className="md:hidden grid grid-cols-3 gap-2 pt-1">
                {(trustChips.length > 0
                  ? trustChips.slice(0, 3)
                  : [{ label: "Licensed & Insured" }, { label: "Fast Quotes" }, { label: "Top Rated" }]
                ).map((chip, idx) => (
                  <div key={`${chip.label}-${idx}`} className="ab-primary-bg-light rounded-2xl p-3 flex flex-col items-center gap-1 text-center">
                    <CheckCircle2 size={16} className="ab-primary" />
                    <span className="text-[10px] font-bold text-slate-700 leading-tight">{chip.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group max-w-md mx-auto md:max-w-none hidden md:block">
              <div className="absolute -inset-2 sm:-inset-4 ab-primary-bg-med rounded-[24px] sm:rounded-[40px] blur-2xl transition-all" />
              <div className="relative bg-white p-3 sm:p-4 rounded-[24px] sm:rounded-[40px] shadow-2xl border border-white">
                <div className="aspect-[4/3] ab-primary-bg-light rounded-[20px] sm:rounded-[32px] flex items-center justify-center relative overflow-hidden">
                  <div className="ab-primary">
                    <Waves size={96} strokeWidth={1} className="w-20 h-20 sm:w-[120px] sm:h-[120px]" />
                  </div>
                </div>
                <div className="hidden sm:block absolute -top-4 -left-4 bg-white p-4 rounded-2xl shadow-lg ab-float z-20">
                  <Droplets className="ab-primary mb-1" />
                  <div className="text-xs font-bold uppercase text-slate-400 tracking-widest">Quality</div>
                  <div className="text-xl font-black text-slate-800">100%</div>
                </div>
                <div className="hidden sm:block absolute -bottom-4 -right-4 ab-primary-bg p-4 rounded-2xl shadow-lg ab-float-delayed text-white z-20">
                  <Star fill="white" className="mb-1" />
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>Reviews</div>
                  <div className="text-xl font-black">4.9/5</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-8 sm:py-10 border-y border-slate-100">
          <div className="container mx-auto px-4 sm:px-6">
            <p className="text-center text-slate-400 font-bold uppercase tracking-[0.14em] sm:tracking-[0.2em] mb-5 sm:mb-8 text-[10px] sm:text-xs">As Trusted By Local Leaders</p>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 md:gap-16 opacity-50">
              {(trustChips.length > 0 ? trustChips : [{ label: "Local Realty" }, { label: "City Plaza" }, { label: "Neighborhood Choice" }]).slice(0, 4).map((chip, i) => (
                <div key={i} className="text-sm sm:text-xl font-bold flex items-center gap-2">
                  <ShieldCheck size={16} className="sm:w-5 sm:h-5 ab-primary" />
                  {chip.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="py-14 sm:py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 space-y-3 sm:space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 leading-tight">
                <span className="sm:hidden">All Your Services</span>
                <span className="hidden sm:inline">
                  All Your Services, <br />
                  <span className="ab-primary underline decoration-wavy underline-offset-8">One Place</span>
                </span>
              </h2>
              <p className="text-slate-500 text-base sm:text-lg">Select a service and get your instant quote directly on this page.</p>
            </div>

            <div className={`grid ${isPreview ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4"} gap-4 sm:gap-6`}>
              {services.map((service, index) => {
                const Icon = serviceIcons[index % serviceIcons.length];
                return (
                  <div
                    key={service.serviceId}
                    className="bg-white p-5 sm:p-8 rounded-[20px] sm:rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group hover:-translate-y-2 flex flex-col"
                  >
                    <div className="ab-group-icon w-12 h-12 sm:w-16 sm:h-16 shrink-0 ab-primary-bg-light ab-primary rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-colors overflow-hidden">
                      {service.imageUrl ? <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" /> : <Icon className="w-6 h-6 sm:w-8 sm:h-8" />}
                    </div>
                    <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3 text-slate-800 leading-tight">{service.name}</h3>
                    <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6 leading-snug sm:leading-relaxed">
                      {howItWorks[index % Math.max(howItWorks.length, 1)]?.body || "Professional service with quality equipment and a careful, reliable process."}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="ab-primary font-black text-sm sm:text-base">Instant Quote</span>
                      <ChevronRight size={16} className="sm:w-5 sm:h-5 text-slate-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="py-10 sm:py-24 bg-slate-900 text-white rounded-[28px] sm:rounded-[40px] md:rounded-[80px] mx-3 sm:mx-4 md:mx-10 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-32 sm:h-48 opacity-10 pointer-events-none">
            <svg viewBox="0 0 1440 320" className="w-full h-full">
              <path fill={theme.primaryColor} fillOpacity="1" d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,224C672,245,768,235,864,208C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
            </svg>
          </div>

          <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 sm:gap-16 items-center relative z-10">
            <div className="space-y-5 sm:space-y-8">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight">
                Why Customers <br />
                <span className="ab-primary italic">Choose Us</span>
              </h2>
              <div className="space-y-3 sm:space-y-6">
                {(howItWorks.length > 0
                  ? howItWorks
                  : [
                      { title: "Quality Workmanship", body: "Professional-grade results you can count on." },
                      { title: "Transparent Pricing", body: "No hidden fees — get an instant quote online." },
                      { title: "Fast Response", body: "Quick scheduling and reliable service." },
                    ]
                ).slice(0, 3).map((item, i) => (
                  <div key={i} className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full ab-primary-bg-med ab-primary flex items-center justify-center">
                      <CheckCircle2 size={14} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-xl font-bold mb-0.5 sm:mb-1">{item.title}</h4>
                      <p className="text-sm text-slate-300 leading-snug">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(() => {
              const statChips = [
                ...trustChips,
                ...["Instant Online Quotes", "Fast Booking"].slice(0, Math.max(0, 4 - trustChips.length)),
              ].slice(0, 4).map((c) => (typeof c === "string" ? { label: c } : c));
              const bgClasses = ["bg-slate-800 border border-slate-700", "ab-primary-bg", "bg-slate-700", "bg-slate-800 border border-slate-700"];
              return (
                <div className={`grid ${svcGrid("grid-cols-1", "grid-cols-2", "grid-cols-2")} gap-3`}>
                  {statChips.map((chip, i) => (
                    <div key={i} className={`${bgClasses[i]} p-4 rounded-2xl flex items-center gap-3 min-w-0`}>
                      <CheckCircle2 size={20} className="text-white flex-shrink-0" />
                      <div className="text-sm font-bold text-white leading-snug break-words">{chip.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>

        <section id="quote" className="py-14 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="ab-primary-bg rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg sm:text-2xl font-black text-white">Get Your Quote</h3>
                <div className="flex flex-wrap gap-4 text-sm text-white/80">
                  {data.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} style={{ color: "rgba(255,255,255,0.7)" }} />
                      <span className="font-semibold">{data.phone}</span>
                    </div>
                  )}
                  {data.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={14} style={{ color: "rgba(255,255,255,0.7)" }} />
                      <span className="font-semibold">{data.email}</span>
                    </div>
                  )}
                  {data.serviceAreaText && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} style={{ color: "rgba(255,255,255,0.7)" }} />
                      <span className="font-semibold">{data.serviceAreaText}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-[20px] sm:rounded-[28px] shadow-2xl p-4 sm:p-8">
                {QuoteCard}
              </div>
            </div>
          </div>
        </section>

        {faqs.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <h2 className="text-xl sm:text-2xl font-black mb-5 sm:mb-6 text-slate-800">FAQs</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={`${faq.question}-${index}`} className="border-slate-200 bg-white">
                  <CardContent className="p-4 sm:p-5">
                    <div className="font-semibold text-slate-900 text-sm sm:text-base">{faq.question}</div>
                    <p className="text-sm mt-2 text-slate-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <footer className="bg-white pt-12 sm:pt-20 pb-8 sm:pb-10 border-t border-slate-100">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mb-8 sm:mb-16">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 ab-primary-bg rounded-full flex items-center justify-center text-white overflow-hidden">
                  {data.logoUrl ? <img src={data.logoUrl} alt={brandName} className="w-full h-full object-cover" /> : <Waves size={20} />}
                </div>
                <span className="text-base sm:text-xl font-black tracking-tight ab-primary uppercase max-w-[220px] truncate">{brandName}</span>
              </div>
              <p className="text-slate-500 text-sm sm:text-base mb-6 sm:mb-10">Reliable services with transparent pricing and fast response.</p>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-6 sm:gap-12">
                <div>
                  <h4 className="font-black text-slate-800 mb-3 sm:mb-6 uppercase tracking-widest text-xs sm:text-sm">Quick Links</h4>
                  <ul className="space-y-2 sm:space-y-4 text-slate-500 font-medium text-sm sm:text-base">
                    <li><a href="#top" className="hover:opacity-70 transition-opacity">Home</a></li>
                    <li><a href="#services" className="hover:opacity-70 transition-opacity">Services</a></li>
                    <li><a href="#about" className="hover:opacity-70 transition-opacity">Why Us</a></li>
                    <li><a href="#quote" className="hover:opacity-70 transition-opacity">Quote</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black text-slate-800 mb-3 sm:mb-6 uppercase tracking-widest text-xs sm:text-sm">Contact</h4>
                  <ul className="space-y-2 sm:space-y-4 text-slate-500 font-medium text-sm sm:text-base">
                    {data.serviceAreaText && (
                      <li className="flex gap-2 sm:gap-3">
                        <MapPin size={16} className="sm:w-[18px] sm:h-[18px] ab-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{data.serviceAreaText}</span>
                      </li>
                    )}
                    {data.phone && (
                      <li className="flex gap-2 sm:gap-3">
                        <Phone size={16} className="sm:w-[18px] sm:h-[18px] ab-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{data.phone}</span>
                      </li>
                    )}
                    {data.email && (
                      <li className="flex gap-2 sm:gap-3">
                        <Mail size={16} className="sm:w-[18px] sm:h-[18px] ab-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm break-all">{data.email}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-6 sm:pt-10 text-center text-slate-400 text-xs sm:text-sm font-medium">
              © {new Date().getFullYear()} {brandName}. All rights reserved.
              {data.autobidderBrandingRequired ? " Powered by Autobidder." : ""}
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ─── NOIR-EDGE TEMPLATE ───────────────────────────────────────────────────
  if (templateKey === "noir-edge") {
    const brandName = data.businessName || "Your Business";
    const svcIcons = [Home, Building2, Zap, CarFront, ShieldCheck, Star, Sparkles, CheckCircle2];

    return (
      <div className="min-h-screen" style={{ backgroundColor: "#0c0c0f", color: "#f0eff4" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&display=swap');
          .ne-display { font-family: 'Playfair Display', Georgia, serif; }
          .ne-mono { font-family: 'DM Mono', 'Courier New', monospace; }
          .ne-primary { color: ${theme.primaryColor}; }
          .ne-primary-bg { background-color: ${theme.primaryColor}; }
          .ne-service-row { border-left: 2px solid transparent; transition: all 0.18s ease; }
          .ne-service-row:hover { border-left-color: ${theme.primaryColor}; background-color: #16161a; padding-left: 1.5rem; }
          .ne-service-row:hover .ne-svc-num { color: ${theme.primaryColor}; }
          .ne-service-row:hover .ne-svc-chevron { color: ${theme.primaryColor}; }
          @keyframes ne-up { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
          .ne-up-1 { animation: ne-up 0.65s ease both; }
          .ne-up-2 { animation: ne-up 0.65s ease 0.12s both; }
          .ne-up-3 { animation: ne-up 0.65s ease 0.24s both; }
        `}</style>

        {/* Nav */}
        <nav className={`${isPreview ? "relative" : "fixed"} top-0 left-0 right-0 z-50 transition-all duration-300`}
          style={{ backgroundColor: scrolled ? "rgba(12,12,15,0.93)" : "transparent", borderBottom: scrolled ? "1px solid rgba(240,239,244,0.07)" : "none", backdropFilter: scrolled ? "blur(12px)" : "none" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
            <a href="#top" className="flex items-center gap-3 min-w-0">
              {data.logoUrl
                ? <img src={data.logoUrl} alt={brandName} className="h-7 w-auto flex-shrink-0" />
                : <span className="ne-mono text-xs ne-primary tracking-[0.3em]">◆</span>}
              <span className="ne-mono text-sm font-medium tracking-[0.14em] uppercase text-white/80 truncate">{brandName}</span>
            </a>
            <div className="hidden md:flex items-center gap-7">
              {(["#services:Services", "#about:About", "#quote:Quote"] as const).map((s) => {
                const [href, label] = s.split(":");
                return <a key={href} href={href} className="ne-mono text-[11px] tracking-widest uppercase text-white/50 hover:text-white transition-colors">{label}</a>;
              })}
              <a href="#quote" className="ne-primary-bg ne-mono text-[11px] tracking-widest uppercase px-5 py-2.5 font-medium hover:opacity-85 transition-opacity" style={{ color: "#0c0c0f" }}>
                {ctaLabel}
              </a>
            </div>
            <button className="md:hidden text-white/60" onClick={() => setIsMenuOpen((p) => !p)}>
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
          {isMenuOpen && !isPreview && (
            <div className="md:hidden px-5 pb-5 flex flex-col gap-3" style={{ backgroundColor: "#16161a", borderTop: "1px solid rgba(240,239,244,0.06)" }}>
              <a href="#services" onClick={() => setIsMenuOpen(false)} className="ne-mono text-xs tracking-widest uppercase text-white/60 py-2">Services</a>
              <a href="#about"    onClick={() => setIsMenuOpen(false)} className="ne-mono text-xs tracking-widest uppercase text-white/60 py-2">About</a>
              <a href="#quote"    onClick={() => setIsMenuOpen(false)} className="ne-mono text-xs tracking-widest uppercase text-white/60 py-2">Quote</a>
              <a href="#quote"    onClick={() => setIsMenuOpen(false)} className="ne-primary-bg ne-mono text-xs tracking-widest uppercase py-3 text-center font-medium mt-1" style={{ color: "#0c0c0f" }}>{ctaLabel}</a>
            </div>
          )}
        </nav>

        {/* Hero */}
        <section id="top" className={`relative overflow-hidden ${isPreview ? "pt-10 pb-14" : "pt-32 pb-24"}`}>
          <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: `linear-gradient(to bottom, transparent, ${theme.primaryColor}, transparent)` }} />
          <div className="absolute select-none pointer-events-none ne-display font-black leading-none text-right" style={{ color: "rgba(240,239,244,0.022)", fontSize: "clamp(160px,28vw,340px)", right: "-0.04em", top: "50%", transform: "translateY(-50%)" }}>01</div>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
            <div className="max-w-3xl">
              {trustChips.length > 0 && (
                <div className="ne-up-1 ne-mono text-[11px] tracking-[0.22em] uppercase flex items-center gap-3 mb-7" style={{ color: theme.primaryColor }}>
                  <span className="inline-block w-7 h-px" style={{ backgroundColor: theme.primaryColor }} />
                  {trustChips[0].label}
                </div>
              )}
              <h1 className="ne-display ne-up-2 font-black text-white leading-none mb-6" style={{ fontSize: "clamp(3rem,8vw,7.5rem)" }}>
                {brandName}
              </h1>
              <p className="ne-up-3 text-white/55 max-w-xl mb-10 leading-relaxed" style={{ fontSize: "1.05rem" }}>
                {data.tagline || "Professional services. Instant quotes. No guesswork."}
              </p>
              <div className="ne-up-3 flex flex-wrap gap-4">
                <a href="#quote" className="ne-primary-bg ne-mono text-sm tracking-wider uppercase px-8 py-4 font-medium inline-flex items-center gap-2 hover:opacity-85 transition-opacity" style={{ color: "#0c0c0f" }}>
                  {ctaLabel} <ChevronRight size={15} />
                </a>
                {data.phone && (
                  <a href={`tel:${data.phone}`} className="ne-mono text-sm tracking-wider uppercase px-8 py-4 font-medium inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors" style={{ border: "1px solid rgba(240,239,244,0.12)" }}>
                    <Phone size={14} /> {data.phone}
                  </a>
                )}
              </div>
            </div>
            {trustChips.length > 1 && (
              <div className="mt-14 flex flex-wrap items-center gap-x-7 gap-y-2">
                {trustChips.map((chip, i) => (
                  <span key={i} className="ne-mono text-[10px] tracking-widest uppercase flex items-center gap-2 text-white/35">
                    {i > 0 && <span className="w-1 h-1 rounded-full inline-block" style={{ backgroundColor: theme.primaryColor }} />}
                    {chip.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-20" style={{ borderTop: "1px solid rgba(240,239,244,0.06)" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="mb-12">
              <div className="ne-mono text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color: theme.primaryColor }}>— Services</div>
              <h2 className="ne-display text-4xl sm:text-5xl font-black text-white">What We Do</h2>
            </div>
            <div style={{ borderTop: "1px solid rgba(240,239,244,0.06)" }}>
              {(services.length > 0 ? services : [
                { serviceId: 1, name: "Service One", enabled: true, sortOrder: 0, imageUrl: null },
                { serviceId: 2, name: "Service Two", enabled: true, sortOrder: 1, imageUrl: null },
                { serviceId: 3, name: "Service Three", enabled: true, sortOrder: 2, imageUrl: null },
              ]).map((service, i) => {
                const Icon = svcIcons[i % svcIcons.length];
                return (
                  <a href="#quote" key={service.serviceId}
                    className="ne-service-row flex items-center gap-5 py-5 px-2 sm:px-4 -mx-2 sm:-mx-4 cursor-pointer group"
                    style={{ borderBottom: "1px solid rgba(240,239,244,0.06)" }}>
                    <span className="ne-svc-num ne-mono text-xs w-8 text-white/30 flex-shrink-0 transition-colors">{String(i + 1).padStart(2, "0")}</span>
                    {service.imageUrl
                      ? <img src={service.imageUrl} alt={service.name} className="w-10 h-10 object-cover rounded-sm flex-shrink-0" />
                      : <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center" style={{ border: "1px solid rgba(240,239,244,0.09)" }}><Icon size={16} className="text-white/35 group-hover:text-white/70 transition-colors" /></div>}
                    <span className="text-white/75 font-medium text-base sm:text-lg flex-1 group-hover:text-white transition-colors">{service.name}</span>
                    <ChevronRight size={16} className="ne-svc-chevron text-white/20 flex-shrink-0 transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* About / How it works */}
        <section id="about" className="py-20" style={{ backgroundColor: "#16161a", borderTop: "1px solid rgba(240,239,244,0.06)" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="ne-mono text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color: theme.primaryColor }}>— Why Us</div>
            <h2 className="ne-display text-4xl sm:text-5xl font-black text-white mb-12">Built Different</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(howItWorks.length > 0 ? howItWorks : [
                { title: "Quality Work", body: "Every job done right the first time, guaranteed." },
                { title: "Fast Response", body: "Same-day quotes and flexible scheduling." },
                { title: "Trusted Locally", body: "Hundreds of satisfied customers in your area." },
              ]).slice(0, 3).map((step, i) => (
                <div key={i} className="p-6" style={{ border: "1px solid rgba(240,239,244,0.07)" }}>
                  <div className="ne-mono text-3xl font-medium mb-5" style={{ color: `${theme.primaryColor}45` }}>{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="ne-display text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quote */}
        <section id="quote" className="py-20" style={{ borderTop: "1px solid rgba(240,239,244,0.06)" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="grid grid-cols-1" style={{ border: "1px solid rgba(240,239,244,0.08)" }}>
              <div className="p-7 sm:p-10 flex flex-col gap-7" style={{ backgroundColor: "#16161a", borderBottom: "1px solid rgba(240,239,244,0.06)" }}>
                <div>
                  <div className="ne-mono text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color: theme.primaryColor }}>— Get a Quote</div>
                  <h3 className="ne-display text-3xl sm:text-4xl font-black text-white mb-3">{ctaLabel}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">Fill in your details and get an instant, accurate estimate from our embedded calculator.</p>
                </div>
                <div className="space-y-3 text-sm">
                  {data.phone && <div className="flex items-center gap-3 text-white/45"><Phone size={13} style={{ color: theme.primaryColor }} />{data.phone}</div>}
                  {data.email && <div className="flex items-center gap-3 text-white/45"><Mail size={13} style={{ color: theme.primaryColor }} />{data.email}</div>}
                  {data.serviceAreaText && <div className="flex items-center gap-3 text-white/45"><MapPin size={13} style={{ color: theme.primaryColor }} />{data.serviceAreaText}</div>}
                </div>
                {trustChips.length > 0 && (
                  <div className="space-y-2">
                    {trustChips.slice(0, 4).map((chip, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-white/35 ne-mono tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.primaryColor }} />
                        {chip.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5 sm:p-10" style={{ backgroundColor: "#0c0c0f" }}>{QuoteCard}</div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="py-20" style={{ backgroundColor: "#16161a", borderTop: "1px solid rgba(240,239,244,0.06)" }}>
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
              <div className="ne-mono text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color: theme.primaryColor }}>— FAQ</div>
              <h2 className="ne-display text-4xl font-black text-white mb-10">Common Questions</h2>
              <div className="max-w-3xl divide-y" style={{ borderColor: "rgba(240,239,244,0.06)" }}>
                {faqs.map((faq, i) => (
                  <div key={i} className="py-6">
                    <div className="font-semibold text-white/85 mb-2">{faq.question}</div>
                    <p className="text-sm text-white/45 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="py-8" style={{ backgroundColor: "#0c0c0f", borderTop: "1px solid rgba(240,239,244,0.06)" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs ne-mono">
            <div>
              <div className="tracking-[0.18em] uppercase text-white/35">{brandName}</div>
              {data.serviceAreaText && <div className="text-white/20 mt-1">{data.serviceAreaText}</div>}
            </div>
            <div className="flex flex-wrap gap-5 text-white/25">
              {data.phone && <span>{data.phone}</span>}
              {data.email && <span>{data.email}</span>}
            </div>
            <div className="text-white/20">© {new Date().getFullYear()} {brandName}{data.autobidderBrandingRequired ? " · Autobidder" : ""}</div>
          </div>
        </footer>
      </div>
    );
  }

  // ─── FRESH-DECK TEMPLATE ──────────────────────────────────────────────────
  if (templateKey === "fresh-deck") {
    const brandName = data.businessName || "Your Business";
    const svcIcons = [Home, Building2, Zap, CarFront, ShieldCheck, Star, Sparkles, CheckCircle2];

    return (
      <div className="min-h-screen" style={{ backgroundColor: "#faf7f2", color: "#111111" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Mulish:wght@400;500;600;700&display=swap');
          .fd-display { font-family: 'Syne', 'Arial Black', sans-serif; font-weight: 800; }
          .fd-body { font-family: 'Mulish', system-ui, sans-serif; }
          .fd-primary { color: ${theme.primaryColor}; }
          .fd-primary-bg { background-color: ${theme.primaryColor}; }
          .fd-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
          .fd-card:hover { transform: translateY(-5px); box-shadow: 0 24px 48px rgba(0,0,0,0.10); }
          @keyframes fd-in { from { opacity:0; transform:translateX(-18px); } to { opacity:1; transform:translateX(0); } }
          .fd-in-1 { animation: fd-in 0.55s ease both; }
          .fd-in-2 { animation: fd-in 0.55s ease 0.1s both; }
          .fd-in-3 { animation: fd-in 0.55s ease 0.2s both; }
          @media (max-width: 640px) {
            .fd-quote-shell > .shadow-xl { box-shadow: none; }
            .fd-quote-shell .p-6 { padding: 1rem; }
          }
        `}</style>

        {/* Nav */}
        <nav className={`${isPreview ? "relative" : "fixed"} top-0 left-0 right-0 z-50`}
          style={{ backgroundColor: "#faf7f2", borderBottom: `3px solid ${theme.primaryColor}` }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
            <a href="#top" className="flex items-center gap-2.5 min-w-0">
              {data.logoUrl
                ? <img src={data.logoUrl} alt={brandName} className="h-9 w-auto flex-shrink-0 rounded" />
                : <div className="w-9 h-9 fd-primary-bg flex items-center justify-center text-white fd-display text-lg flex-shrink-0">{brandName.charAt(0).toUpperCase()}</div>}
              <span className="fd-display text-lg sm:text-xl text-[#111] truncate">{brandName}</span>
            </a>
            <div className="hidden md:flex items-center gap-6">
              <a href="#services" className="fd-body font-semibold text-sm text-[#666] hover:text-[#111] transition-colors">Services</a>
              <a href="#about"    className="fd-body font-semibold text-sm text-[#666] hover:text-[#111] transition-colors">About</a>
              <a href="#quote"    className="fd-body font-semibold text-sm text-[#666] hover:text-[#111] transition-colors">Quote</a>
              <a href="#quote" className="fd-primary-bg fd-body font-bold text-sm px-6 py-2.5 text-white hover:opacity-90 transition-opacity" style={{ borderRadius: "4px" }}>
                {ctaLabel}
              </a>
            </div>
            <button className="md:hidden" onClick={() => setIsMenuOpen((p) => !p)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          {isMenuOpen && !isPreview && (
            <div className="md:hidden px-5 pb-5 flex flex-col gap-3" style={{ backgroundColor: "#faf7f2", borderTop: `1px solid ${theme.primaryColor}25` }}>
              <a href="#services" onClick={() => setIsMenuOpen(false)} className="fd-body font-semibold py-2">Services</a>
              <a href="#about"    onClick={() => setIsMenuOpen(false)} className="fd-body font-semibold py-2">About</a>
              <a href="#quote"    onClick={() => setIsMenuOpen(false)} className="fd-body font-semibold py-2">Quote</a>
              <a href="#quote"    onClick={() => setIsMenuOpen(false)} className="fd-primary-bg fd-body font-bold py-3 text-white text-center mt-1" style={{ borderRadius: "4px" }}>{ctaLabel}</a>
            </div>
          )}
        </nav>

        {/* Hero */}
        <section id="top" className={`relative overflow-hidden ${isPreviewMobile ? "pt-4 pb-8" : isPreview ? "pt-6 pb-10" : "pt-20 pb-12 sm:pt-24 sm:pb-28"}`} style={{ backgroundColor: "#faf7f2" }}>
          <div className={`${isPreviewMobile ? "hidden" : "hidden sm:block"} absolute select-none pointer-events-none fd-display font-black leading-none`} style={{ color: `${theme.primaryColor}0d`, fontSize: "clamp(160px,32vw,420px)", right: "-0.04em", top: "-0.08em" }}>01</div>
          <div className={`max-w-7xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-2 ${isPreviewMobile ? "gap-5" : "gap-7 sm:gap-10"} items-center relative z-10`}>
            <div>
              {trustChips.length > 0 && (
                <div className={`fd-in-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold fd-body uppercase tracking-wider ${isPreviewMobile ? "mb-3" : "mb-4 sm:mb-6"}`} style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}>
                  <Sparkles size={12} /> {trustChips[0].label}
                </div>
              )}
              <h1 className={`fd-display fd-in-2 text-[#111] leading-none ${isPreviewMobile ? "mb-3" : "mb-4 sm:mb-5"}`} style={{ fontSize: isPreviewMobile ? "clamp(1.8rem,8vw,2.3rem)" : "clamp(2.2rem,7vw,5.5rem)" }}>
                {brandName}
              </h1>
              <p className={`fd-body fd-in-3 text-[#666] ${isPreviewMobile ? "text-sm mb-4 max-w-none" : "text-base sm:text-lg max-w-md mb-6 sm:mb-8"} leading-relaxed`}>
                {data.tagline || "Professional services. Transparent pricing. Instant quotes."}
              </p>
              <div className={`flex ${isPreviewMobile ? "flex-col" : "flex-col sm:flex-row"} gap-3 ${isPreviewMobile ? "mb-4" : "mb-6 sm:mb-7"}`}>
                <a href="#quote" className={`fd-primary-bg fd-display text-white ${isPreviewMobile ? "px-4 py-2.5 text-sm" : "px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"} inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`} style={{ borderRadius: "4px" }}>
                  {ctaLabel} <ChevronRight size={18} />
                </a>
                <a href="#services" className={`fd-display text-[#111] ${isPreviewMobile ? "px-4 py-2.5 text-sm" : "px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"} inline-flex items-center justify-center gap-2 hover:bg-black/5 transition-colors`} style={{ border: "2px solid #ddd9d0", borderRadius: "4px" }}>
                  See Services
                </a>
              </div>
              {trustChips.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {trustChips.slice(1, isPreviewMobile ? 3 : 5).map((chip, i) => (
                    <span key={i} className={`fd-body inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${!isPreviewMobile && i > 1 ? "hidden sm:inline-flex" : ""}`} style={{ backgroundColor: "#ede9e1", color: "#555" }}>
                      <CheckCircle size={11} style={{ color: theme.primaryColor }} /> {chip.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Hero visual cards */}
            <div className="hidden lg:flex flex-col gap-4">
              <div className="relative overflow-hidden p-8 rounded-2xl" style={{ backgroundColor: theme.primaryColor }}>
                <div className="fd-display text-white leading-none mb-2" style={{ fontSize: "5rem" }}>
                  {services.length > 0 ? services.length : "∞"}
                </div>
                <div className="fd-body font-semibold text-white/75 text-sm uppercase tracking-widest">Services Available</div>
                <div className="absolute -bottom-5 -right-4 fd-display font-black text-white/10 select-none" style={{ fontSize: "9rem", lineHeight: 1 }}>✦</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="fd-display text-3xl mb-1" style={{ color: theme.primaryColor }}>4.9★</div>
                  <div className="fd-body text-xs font-semibold uppercase tracking-wider text-[#aaa]">Avg Rating</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="fd-display text-3xl mb-1 text-[#111]">Fast</div>
                  <div className="fd-body text-xs font-semibold uppercase tracking-wider text-[#aaa]">Instant Quotes</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-16 sm:py-20" style={{ backgroundColor: "#ffffff" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex items-end justify-between mb-10 gap-4">
              <div>
                <div className="fd-body text-xs font-bold uppercase tracking-widest mb-2" style={{ color: theme.primaryColor }}>Our Services</div>
                <h2 className="fd-display text-3xl sm:text-5xl text-[#111]">What We Offer</h2>
              </div>
              <a href="#quote" className="hidden sm:flex fd-body font-bold text-sm items-center gap-1" style={{ color: theme.primaryColor }}>
                Get a Quote <ChevronRight size={14} />
              </a>
            </div>
            <div className={`grid ${isPreview ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"} gap-5`}>
              {(services.length > 0 ? services : [
                { serviceId: 1, name: "Service One", enabled: true, sortOrder: 0, imageUrl: null },
                { serviceId: 2, name: "Service Two", enabled: true, sortOrder: 1, imageUrl: null },
                { serviceId: 3, name: "Service Three", enabled: true, sortOrder: 2, imageUrl: null },
              ]).map((service, i) => {
                const Icon = svcIcons[i % svcIcons.length];
                return (
                  <a href="#quote" key={service.serviceId}
                    className="fd-card block rounded-2xl p-6 flex flex-col gap-4 cursor-pointer"
                    style={{ backgroundColor: "#faf7f2", borderTop: `4px solid ${theme.primaryColor}` }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${theme.primaryColor}18` }}>
                      {service.imageUrl
                        ? <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover rounded-xl" />
                        : <Icon size={20} style={{ color: theme.primaryColor }} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="fd-display text-lg text-[#111] mb-1">{service.name}</h3>
                      <p className="fd-body text-sm text-[#777] leading-relaxed">
                        {howItWorks[i % Math.max(howItWorks.length, 1)]?.body || "Reliable, professional service with transparent pricing."}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 fd-body text-sm font-bold" style={{ color: theme.primaryColor }}>
                      Get Quote <ChevronRight size={13} />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* About / How It Works */}
        {howItWorks.length > 0 && (
          <section id="about" className="py-16 sm:py-20" style={{ backgroundColor: "#faf7f2" }}>
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
              <div className="fd-body text-xs font-bold uppercase tracking-widest mb-2" style={{ color: theme.primaryColor }}>Why Choose Us</div>
              <h2 className="fd-display text-3xl sm:text-5xl text-[#111] mb-12">How We Work</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {howItWorks.slice(0, 3).map((step, i) => (
                  <div key={i}>
                    <div className="fd-display font-black leading-none select-none mb-4" style={{ fontSize: "6rem", color: `${theme.primaryColor}1e` }}>{i + 1}</div>
                    <h3 className="fd-display text-xl text-[#111] mb-2">{step.title}</h3>
                    <p className="fd-body text-[#777] leading-relaxed">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Quote */}
        <section id="quote" className={`${isPreviewMobile ? "py-8" : "py-12 sm:py-20"}`} style={{ backgroundColor: "#ffffff" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className={`rounded-xl sm:rounded-2xl overflow-hidden grid grid-cols-1 border border-[#ece5db] ${isPreviewMobile ? "shadow-sm" : ""}`}>
              <div className={`fd-primary-bg ${isPreviewMobile ? "p-4" : "p-5 sm:p-10"} flex flex-col gap-5 sm:gap-6 justify-between`}>
                <div>
                  <div className="fd-body text-xs font-bold uppercase tracking-widest text-white/55 mb-3">Ready?</div>
                  <h3 className={`fd-display ${isPreviewMobile ? "text-xl" : "text-2xl sm:text-4xl"} text-white mb-2 sm:mb-3`}>{ctaLabel}</h3>
                  <p className="fd-body text-white/65 text-sm leading-relaxed">
                    Get an instant, accurate quote for {brandName}'s services — no waiting, no guesswork.
                  </p>
                </div>
                <div className="space-y-2.5 sm:space-y-3">
                  {data.phone && <div className="flex items-center gap-2.5 text-white/65 text-sm"><Phone size={14} className="flex-shrink-0" /><span className="fd-body font-semibold">{data.phone}</span></div>}
                  {data.email && <div className="flex items-center gap-2.5 text-white/65 text-sm"><Mail size={14} className="flex-shrink-0" /><span className="fd-body font-semibold">{data.email}</span></div>}
                  {data.serviceAreaText && <div className="flex items-center gap-2.5 text-white/65 text-sm"><MapPin size={14} className="flex-shrink-0" /><span className="fd-body font-semibold">{data.serviceAreaText}</span></div>}
                  {trustChips.slice(0, isPreviewMobile ? 1 : 2).map((chip, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/50 text-xs fd-body">
                      <CheckCircle size={11} className="flex-shrink-0" /> {chip.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className={`bg-[#faf7f2] sm:bg-white ${isPreviewMobile ? "p-2" : "p-3 sm:p-10"}`}>
                <div className={`fd-quote-shell ${isPreviewMobile ? "[&_.shadow-xl]:shadow-none [&_.p-6]:p-4 [&_.py-6]:py-4 [&_.px-6]:px-4" : ""}`}>{QuoteCard}</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="py-16 sm:py-20" style={{ backgroundColor: "#faf7f2" }}>
            <div className="max-w-4xl mx-auto px-5 sm:px-8">
              <div className="fd-body text-xs font-bold uppercase tracking-widest mb-2" style={{ color: theme.primaryColor }}>FAQ</div>
              <h2 className="fd-display text-3xl sm:text-4xl text-[#111] mb-10">Common Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6">
                    <div className="fd-display text-[#111] mb-2 text-base">{faq.question}</div>
                    <p className="fd-body text-sm text-[#777] leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="py-8" style={{ backgroundColor: "#111111" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 fd-primary-bg flex items-center justify-center text-white fd-display text-base">
                {brandName.charAt(0).toUpperCase()}
              </div>
              <span className="fd-display text-base text-white">{brandName}</span>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-white/35 fd-body">
              {data.phone && <span>{data.phone}</span>}
              {data.email && <span>{data.email}</span>}
              {data.serviceAreaText && <span>{data.serviceAreaText}</span>}
            </div>
            <div className="text-xs text-white/25 fd-body">© {new Date().getFullYear()} {brandName}{data.autobidderBrandingRequired ? " · Autobidder" : ""}</div>
          </div>
        </footer>
      </div>
    );
  }

  if (templateKey === "halo-glass") {
    const brandName = data.businessName || "Your Business";
    const featuredServices = services.slice(0, 6);
    const glassTrust = trustChips.length > 0 ? trustChips : [{ label: "Licensed & Insured", enabled: true }];
    const svcIcons = [Sparkles, Home, Building2, ShieldCheck, Droplets, Zap];

    return (
      <div className="min-h-screen overflow-x-hidden" style={{ background: `radial-gradient(1200px 600px at 5% -10%, ${theme.primaryColor}40 0%, transparent 55%), radial-gradient(1000px 500px at 95% 10%, ${theme.accentColor}40 0%, transparent 58%), linear-gradient(180deg, #0B1020 0%, #121931 38%, #0D1327 100%)` }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&family=Manrope:wght@400;500;700&display=swap');
          .hg-display { font-family: 'Outfit', sans-serif; }
          .hg-body { font-family: 'Manrope', system-ui, sans-serif; }
          .hg-glass {
            background: linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04));
            border: 1px solid rgba(255,255,255,0.20);
            box-shadow: 0 20px 60px rgba(0,0,0,0.35);
            backdrop-filter: blur(16px);
          }
          .hg-chip {
            background-color: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.14);
          }
        `}</style>

        <nav className={`${isPreview ? "relative" : "sticky top-0"} z-40`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="hg-glass rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
              <a href="#top" className="flex items-center gap-2 min-w-0">
                {data.logoUrl ? (
                  <img src={data.logoUrl} alt={brandName} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-white hg-display font-bold" style={{ backgroundColor: theme.primaryColor }}>{brandName.charAt(0).toUpperCase()}</div>
                )}
                <span className="hg-display text-white text-base sm:text-lg truncate">{brandName}</span>
              </a>
              <div className="hidden md:flex items-center gap-6 text-sm text-white/80 hg-body">
                <a href="#services">Services</a>
                <a href="#about">About</a>
                <a href="#quote">Quote</a>
              </div>
              <a href="#quote" className="hg-display text-sm px-4 py-2 rounded-full text-white" style={{ backgroundColor: theme.primaryColor }}>
                {ctaLabel}
              </a>
            </div>
          </div>
        </nav>

        <section id="top" className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-10 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
            <div className="hg-glass rounded-3xl p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 hg-chip rounded-full px-3 py-1 text-[11px] uppercase tracking-widest text-white/90 hg-body mb-4">
                <Sparkles size={14} style={{ color: theme.accentColor }} />
                {glassTrust[0].label}
              </div>
              <h1 className="hg-display text-4xl sm:text-6xl leading-tight text-white mb-4">{brandName}</h1>
              <p className="hg-body text-white/75 text-base sm:text-lg max-w-xl mb-6">
                {data.tagline || "Premium service experience with instant online pricing and quick scheduling."}
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#quote" className="hg-display px-6 py-3 rounded-full text-sm text-white" style={{ backgroundColor: theme.primaryColor }}>
                  {ctaLabel}
                </a>
                <a href="#services" className="hg-display px-6 py-3 rounded-full text-sm text-white border border-white/25">
                  Explore Services
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                {glassTrust.slice(0, 3).map((chip, idx) => (
                  <div key={idx} className="hg-chip rounded-xl p-3 text-white/85 text-xs hg-body">
                    {chip.label}
                  </div>
                ))}
              </div>
            </div>

            <div id="quote" className="hg-glass rounded-3xl p-3 sm:p-4">{QuoteCard}</div>
          </div>
        </section>

        <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
          <div className="hg-glass rounded-3xl p-6 sm:p-8">
            <h2 className="hg-display text-2xl sm:text-3xl text-white mb-6">Featured Services</h2>
            <div className={`grid ${svcGrid("grid-cols-1", "grid-cols-2", "grid-cols-3")} gap-4`}>
              {(featuredServices.length > 0 ? featuredServices : [{ serviceId: 1, name: "Primary Service", enabled: true, sortOrder: 0, imageUrl: null }]).map((service, idx) => {
                const Icon = svcIcons[idx % svcIcons.length];
                return (
                  <div key={service.serviceId} className="rounded-2xl p-4 border border-white/15 bg-black/20">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${theme.accentColor}30` }}>
                      {service.imageUrl ? (
                        <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Icon size={20} style={{ color: theme.accentColor }} />
                      )}
                    </div>
                    <h3 className="hg-display text-white text-lg mb-1">{service.name}</h3>
                    <p className="hg-body text-sm text-white/60">{howItWorks[idx % Math.max(howItWorks.length, 1)]?.body || "Fast quote, clear pricing, expert delivery."}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(howItWorks.length > 0 ? howItWorks : [
              { title: "Share project details", body: "Tell us what you need in under two minutes." },
              { title: "Get instant pricing", body: "Receive transparent estimate options right away." },
              { title: "Book with confidence", body: "Choose your schedule and confirm service quickly." },
            ]).slice(0, 3).map((step, idx) => (
              <div key={idx} className="hg-glass rounded-2xl p-5">
                <div className="text-xs hg-body uppercase tracking-widest mb-2" style={{ color: theme.accentColor }}>Step {idx + 1}</div>
                <h3 className="hg-display text-white text-xl mb-2">{step.title}</h3>
                <p className="hg-body text-sm text-white/70">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (templateKey === "atlas-pro") {
    const brandName = data.businessName || "Your Business";
    const heroServices = services.slice(0, 4);
    const proofItems = trustChips.length > 0 ? trustChips.slice(0, 4) : [{ label: "Licensed", enabled: true }, { label: "Insured", enabled: true }];
    const svcIcons = [Building2, ShieldCheck, Home, Zap, CarFront, Star];

    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f3f6fb", color: "#0f172a" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Source+Sans+3:wght@400;600;700&display=swap');
          .ap-display { font-family: 'Plus Jakarta Sans', sans-serif; }
          .ap-body { font-family: 'Source Sans 3', system-ui, sans-serif; }
          .ap-topbar { background: linear-gradient(100deg, ${theme.textColor} 0%, ${theme.primaryColor} 100%); }
        `}</style>

        <header className="ap-topbar text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 text-xs ap-body tracking-wide flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              {data.phone && <span>{data.phone}</span>}
              {data.email && <span>{data.email}</span>}
            </div>
            {data.serviceAreaText && <span className="text-white/80">{data.serviceAreaText}</span>}
          </div>
        </header>

        <nav className={`${isPreview ? "relative" : "sticky top-0"} z-40 bg-white border-b border-slate-200`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <a href="#top" className="ap-display text-lg sm:text-xl font-bold truncate">{brandName}</a>
            <div className="hidden md:flex items-center gap-6 ap-body text-sm text-slate-600">
              <a href="#services">Services</a>
              <a href="#about">Process</a>
              <a href="#quote">Quote</a>
            </div>
            <a href="#quote" className="ap-display text-sm px-4 py-2 rounded-md text-white" style={{ backgroundColor: theme.primaryColor }}>
              {ctaLabel}
            </a>
          </div>
        </nav>

        <section id="top" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200">
              <div className="inline-flex items-center gap-2 ap-body text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4" style={{ backgroundColor: `${theme.primaryColor}12`, color: theme.primaryColor }}>
                <ShieldCheck size={14} /> Professional Team
              </div>
              <h1 className="ap-display text-4xl sm:text-5xl leading-tight mb-4">{brandName}</h1>
              <p className="ap-body text-slate-600 text-base sm:text-lg mb-6">{data.tagline || "Professional service delivery with measurable quality and instant pricing."}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {proofItems.slice(0, 3).map((chip, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 p-3 text-sm ap-body">
                    <div className="font-semibold">{chip.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {["24h Response", "Transparent Pricing", "Skilled Crew", "Reliable Support"].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="ap-body text-xs font-semibold text-slate-600 uppercase tracking-wide">{item}</div>
                  </div>
                ))}
              </div>
            </div>
            <div id="quote" className="bg-white rounded-2xl p-3 border border-slate-200">{QuoteCard}</div>
          </div>
        </section>

        <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
          <div className="flex items-end justify-between mb-6">
            <h2 className="ap-display text-2xl sm:text-3xl">Core Services</h2>
            <a href="#quote" className="ap-body text-sm font-semibold" style={{ color: theme.primaryColor }}>Start Quote</a>
          </div>
          <div className={`grid ${svcGrid("grid-cols-1", "grid-cols-2", "grid-cols-4")} gap-4`}>
            {(heroServices.length > 0 ? heroServices : [{ serviceId: 1, name: "Primary Service", enabled: true, sortOrder: 0, imageUrl: null }]).map((service, idx) => {
              const Icon = svcIcons[idx % svcIcons.length];
              return (
                <div key={service.serviceId} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${theme.primaryColor}14` }}>
                    {service.imageUrl ? <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover rounded-lg" /> : <Icon size={18} style={{ color: theme.primaryColor }} />}
                  </div>
                  <h3 className="ap-display text-base mb-1">{service.name}</h3>
                  <p className="ap-body text-sm text-slate-600">{howItWorks[idx % Math.max(howItWorks.length, 1)]?.body || "Detailed scoping with straightforward estimate ranges."}</p>
                </div>
              );
            })}
          </div>
        </section>

        {faqs.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-14">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
              <h2 className="ap-display text-2xl mb-5">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4">
                    <div className="ap-display text-base mb-1">{faq.question}</div>
                    <p className="ap-body text-sm text-slate-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }

  if (templateKey === "mono-grid") {
    const brandName = data.businessName || "Your Business";
    const monoServices = services.length > 0 ? services : [{ serviceId: 1, name: "Primary Service", enabled: true, sortOrder: 0, imageUrl: null }];

    return (
      <div className="min-h-screen bg-white text-black">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
          .mg-display { font-family: 'Archivo', sans-serif; }
          .mg-body { font-family: 'IBM Plex Sans', system-ui, sans-serif; }
        `}</style>

        <div className="border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <a href="#top" className="mg-display text-lg sm:text-2xl uppercase tracking-tight truncate">{brandName}</a>
            <div className="hidden md:flex items-center gap-5 mg-body text-sm uppercase">
              <a href="#services">Services</a>
              <a href="#about">How It Works</a>
              <a href="#quote">Quote</a>
            </div>
            <a href="#quote" className="mg-display text-xs sm:text-sm uppercase px-3 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors">
              {ctaLabel}
            </a>
          </div>
        </div>

        <section id="top" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 border-2 border-black">
            <div className="p-6 sm:p-10 border-b-2 lg:border-b-0 lg:border-r-2 border-black">
              <div className="mg-body text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: theme.primaryColor }}>
                Independent Service Studio
              </div>
              <h1 className="mg-display text-4xl sm:text-6xl leading-[0.95] uppercase mb-4">{brandName}</h1>
              <p className="mg-body text-base sm:text-lg mb-6 max-w-lg">
                {data.tagline || "A modern, stripped-down experience focused on clarity, speed, and quality work."}
              </p>
              <div className="flex flex-wrap gap-2">
                {(trustChips.length > 0 ? trustChips : [{ label: "Licensed & Insured", enabled: true }]).slice(0, 4).map((chip, idx) => (
                  <span key={idx} className="mg-body text-xs uppercase border border-black px-3 py-1">
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>
            <div id="quote" className="p-3 sm:p-4 bg-[#f7f7f7]">{QuoteCard}</div>
          </div>
        </section>

        <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="mg-display text-2xl sm:text-4xl uppercase mb-4">Services</h2>
          <div className={`grid ${svcGrid("grid-cols-1", "grid-cols-2", "grid-cols-3")} border-2 border-black`}>
            {monoServices.slice(0, 9).map((service, idx) => (
              <div key={service.serviceId} className="border-b-2 border-r-0 sm:border-r-2 border-black p-5 sm:p-6 last:border-b-0">
                <div className="mg-body text-[11px] uppercase tracking-[0.15em] mb-2" style={{ color: theme.primaryColor }}>
                  Service {String(idx + 1).padStart(2, "0")}
                </div>
                {service.imageUrl && (
                  <img src={service.imageUrl} alt={service.name} className="w-full h-32 object-cover border border-black mb-3" />
                )}
                <h3 className="mg-display text-lg uppercase mb-2">{service.name}</h3>
                <p className="mg-body text-sm text-black/75">
                  {howItWorks[idx % Math.max(howItWorks.length, 1)]?.body || "Clear scope, fixed expectations, and dependable execution."}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="mg-display text-2xl sm:text-4xl uppercase mb-4">Process</h2>
          <div className={`grid ${svcGrid("grid-cols-1", "grid-cols-2", "grid-cols-3")} gap-3`}>
            {(howItWorks.length > 0 ? howItWorks : [
              { title: "Intake", body: "Share project basics and timing preferences." },
              { title: "Estimate", body: "Get pricing instantly with no back-and-forth." },
              { title: "Schedule", body: "Lock in a time that fits your calendar." },
            ]).slice(0, 3).map((step, idx) => (
              <div key={idx} className="border-2 border-black p-4">
                <div className="mg-body text-xs uppercase mb-2" style={{ color: theme.primaryColor }}>Step {idx + 1}</div>
                <h3 className="mg-display text-lg uppercase mb-2">{step.title}</h3>
                <p className="mg-body text-sm text-black/75">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t-2 border-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="mg-body text-xs uppercase tracking-wider">
              © {new Date().getFullYear()} {brandName}
            </div>
            <div className="mg-body text-xs uppercase tracking-wider flex flex-wrap gap-3">
              {data.phone && <span>{data.phone}</span>}
              {data.email && <span>{data.email}</span>}
              {data.serviceAreaText && <span>{data.serviceAreaText}</span>}
            </div>
          </div>
        </footer>
      </div>
    );
  }

  const HeroContent = (
    <div className="space-y-5">
      {data.logoUrl && <img src={data.logoUrl} alt={data.businessName || "Business logo"} className="h-12 w-auto" />}
      <h1 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ color: theme.textColor }}>
        {data.businessName || "Your Business"}
      </h1>
      {data.tagline && (
        <p className="text-lg" style={{ color: theme.mutedTextColor }}>
          {data.tagline}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          size="lg"
          className="rounded-full"
          style={{ backgroundColor: theme.primaryColor, color: theme.buttonTextColor }}
        >
          {ctaLabel}
        </Button>
        {data.phone && (
          <Button
            variant="outline"
            size="lg"
            className="rounded-full"
            style={{ borderColor: `${theme.primaryColor}66`, color: theme.primaryColor, backgroundColor: theme.surfaceColor }}
          >
            Call {data.phone}
          </Button>
        )}
      </div>
      {trustChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {trustChips.map((chip, i) => (
            <Badge
              key={`${chip.label}-${i}`}
              variant="secondary"
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: `${theme.accentColor}1A`, color: theme.textColor }}
            >
              <CheckCircle className="h-3 w-3 mr-1" style={{ color: theme.accentColor }} />
              {chip.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ backgroundColor: theme.backgroundColor }}>
      {/* Hero */}
      {templateKey === "spotlight" ? (
        <section
          className="border-b"
          style={{
            background: `linear-gradient(160deg, ${theme.primaryColor}12 0%, ${theme.surfaceColor} 50%, ${theme.accentColor}12 100%)`,
            borderColor: `${theme.primaryColor}20`,
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-3xl mx-auto text-center">{HeroContent}</div>
            <div className="max-w-5xl mx-auto mt-8">{QuoteCard}</div>
          </div>
        </section>
      ) : templateKey === "split" ? (
        <section
          className="border-b"
          style={{
            background: `linear-gradient(120deg, ${theme.primaryColor} 0%, ${theme.textColor} 100%)`,
            borderColor: `${theme.primaryColor}33`,
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-1 gap-8 items-center">
              <div className="space-y-5">
                {data.logoUrl && <img src={data.logoUrl} alt={data.businessName || "Business logo"} className="h-12 w-auto" />}
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white">{data.businessName || "Your Business"}</h1>
                {data.tagline && <p className="text-lg text-white/85">{data.tagline}</p>}
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="rounded-full"
                    style={{ backgroundColor: theme.accentColor, color: theme.buttonTextColor }}
                  >
                    {ctaLabel}
                  </Button>
                  {data.phone && (
                    <Button variant="outline" size="lg" className="rounded-full text-white border-white/40 bg-transparent">
                      Call {data.phone}
                    </Button>
                  )}
                </div>
                {trustChips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {trustChips.map((chip, i) => (
                      <Badge key={`${chip.label}-${i}`} variant="secondary" className="rounded-full px-3 py-1 bg-white/15 text-white">
                        <CheckCircle className="h-3 w-3 mr-1 text-white" />
                        {chip.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {QuoteCard}
            </div>
          </div>
        </section>
      ) : (
        <section
          className="border-b"
          style={{
            background: `linear-gradient(to bottom, ${theme.primaryColor}0D 0%, ${theme.surfaceColor} 100%)`,
            borderColor: `${theme.primaryColor}20`,
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-1 gap-8 items-center">
              {HeroContent}
              {QuoteCard}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: theme.textColor }}>
            Services
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.serviceId} style={{ borderColor: `${theme.primaryColor}33`, backgroundColor: theme.surfaceColor }}>
              <CardContent className="p-4">
                {service.imageUrl ? (
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="w-full h-36 object-cover rounded-md mb-3"
                  />
                ) : null}
                <p className="font-medium" style={{ color: theme.textColor }}>
                  {service.name}
                </p>
              </CardContent>
            </Card>
          ))}
          {services.length === 0 && (
            <p className="text-sm" style={{ color: theme.mutedTextColor }}>
              No services listed yet.
            </p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y" style={{ backgroundColor: `${theme.primaryColor}0D`, borderColor: `${theme.primaryColor}22` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold mb-8" style={{ color: theme.textColor }}>
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((step, index) => (
              <Card key={`${step.title}-${index}`} style={{ borderColor: `${theme.primaryColor}33`, backgroundColor: theme.surfaceColor }}>
                <CardContent className="p-5 space-y-2">
                  <div className="text-sm font-semibold" style={{ color: theme.primaryColor }}>
                    Step {index + 1}
                  </div>
                  <div className="font-semibold" style={{ color: theme.textColor }}>
                    {step.title}
                  </div>
                  <p className="text-sm" style={{ color: theme.mutedTextColor }}>
                    {step.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: theme.textColor }}>
            FAQs
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={`${faq.question}-${index}`} style={{ borderColor: `${theme.primaryColor}33`, backgroundColor: theme.surfaceColor }}>
                <CardContent className="p-5">
                  <div className="font-semibold" style={{ color: theme.textColor }}>
                    {faq.question}
                  </div>
                  <p className="text-sm mt-2" style={{ color: theme.mutedTextColor }}>
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ backgroundColor: theme.textColor, color: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="font-semibold text-lg">{data.businessName || "Your Business"}</div>
              {data.serviceAreaText && <p className="text-sm mt-2 text-white/80">{data.serviceAreaText}</p>}
            </div>
            <div className="space-y-2 text-sm text-white/80">
              {data.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {data.phone}
                </div>
              )}
              {data.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {data.email}
                </div>
              )}
              {data.serviceAreaText && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {data.serviceAreaText}
                </div>
              )}
            </div>
            {data.autobidderBrandingRequired && <div className="text-sm text-white/70">Powered by Autobidder</div>}
          </div>
          <Separator className="my-6 bg-white/20" />
          <div className="text-xs text-white/60">
            © {new Date().getFullYear()} {data.businessName || "Autobidder"}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

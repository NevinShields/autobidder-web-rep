import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  ExternalLink,
  Layout,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import LiquidEther from "@/components/LiquidEther";

type OnboardingData = {
  services: string[];
  customServices: string[];
  hasWebsite: string | null;
  crmStatus: string | null;
  selectedCrm?: string;
  customCrms: string[];
  hasFbAds: string | null;
  hasLogo: boolean | null;
  logoUrl?: string | null;
};

const Section = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <section className={`relative px-6 py-20 min-h-[60vh] flex flex-col justify-center ${className}`}>
    {children}
  </section>
);

const Headline = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <motion.h2
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className={`text-4xl font-bold tracking-tight leading-[1.1] mb-6 ${className}`}
  >
    {children}
  </motion.h2>
);

const OnboardingModal = ({
  isOpen,
  onClose,
  onSchedule,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: () => void;
}) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    services: [],
    customServices: [],
    hasWebsite: null,
    crmStatus: null,
    hasFbAds: null,
    hasLogo: null,
    customCrms: [],
  });
  const [customServiceInput, setCustomServiceInput] = useState("");
  const [customCrmInput, setCustomCrmInput] = useState("");
  const [isSendingLead, setIsSendingLead] = useState(false);
  const [hasSentLead, setHasSentLead] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const toggleService = (service: string) => {
    setData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const addCustomService = (value: string) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    setData((prev) => {
      if (prev.customServices.includes(cleaned)) return prev;
      return { ...prev, customServices: [...prev.customServices, cleaned] };
    });
  };

  const addCustomCrm = (value: string) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    setData((prev) => {
      if (prev.customCrms.includes(cleaned)) return prev;
      return { ...prev, customCrms: [...prev.customCrms, cleaned] };
    });
  };

  const submitLead = async (
    overrides: Partial<OnboardingData> & { logoFileName?: string } = {}
  ) => {
    if (hasSentLead || isSendingLead) {
      nextStep();
      return;
    }
    setIsSendingLead(true);

    const payload = {
      services: data.services,
      customServices: data.customServices,
      hasWebsite: data.hasWebsite,
      crmStatus: data.crmStatus,
      selectedCrm: data.selectedCrm,
      customCrms: data.customCrms,
      hasFbAds: data.hasFbAds,
      hasLogo: overrides.hasLogo ?? data.hasLogo,
      logoFileName: overrides.logoFileName ?? null,
      logoUrl: overrides.logoUrl ?? data.logoUrl ?? null,
    };

    try {
      await fetch("/api/dfy-onboarding-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to submit DFY onboarding lead:", error);
    } finally {
      setHasSentLead(true);
      setIsSendingLead(false);
      nextStep();
    }
  };

  const uploadLogo = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Logo upload failed");
    }
    const result = await response.json();
    return result?.imageUrl as string | undefined;
  };

  const stepVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 100 : -100, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 top-12 bg-[#111] z-[110] rounded-t-[2.5rem] border-t border-white/10 overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full bg-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-6 pt-8">
              <button
                onClick={step === 1 ? onClose : prevStep}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 transition-colors"
              >
                {step === 1 ? <X size={20} /> : <ChevronLeft size={20} />}
              </button>
              <span className="text-xs font-bold tracking-widest text-white/30 uppercase">
                Step {step} of {totalSteps}
              </span>
              <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-32">
              <AnimatePresence mode="wait" custom={step}>
                <motion.div
                  key={step}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="max-w-md mx-auto py-4"
                >
                  {step === 1 && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold leading-tight">Which services do you want to offer?</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          "House Washing",
                          "Roof Cleaning",
                          "Gutter Cleaning",
                          "Concrete Cleaning",
                          "Window Cleaning",
                          "Other",
                        ].map((s) => (
                          <button
                            key={s}
                            onClick={() => toggleService(s)}
                            className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                              data.services.includes(s)
                                ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50"
                                : "bg-white/5 border-white/5 hover:border-white/10"
                            }`}
                          >
                            <span className="font-medium">{s}</span>
                            {data.services.includes(s) && (
                              <CheckCircle2 size={18} className="text-indigo-500" />
                            )}
                          </button>
                        ))}
                      </div>
                      {data.services.includes("Other") && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {data.customServices.map((service) => (
                              <div
                                key={service}
                                className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium"
                              >
                                {service}
                              </div>
                            ))}
                          </div>
                          <input
                            value={customServiceInput}
                            onChange={(event) => setCustomServiceInput(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                addCustomService(customServiceInput);
                                setCustomServiceInput("");
                              }
                            }}
                            placeholder="Add a service and press Enter"
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 outline-none focus:border-indigo-500 transition-colors"
                          />
                          <p className="text-xs text-white/30">Each entry becomes its own card.</p>
                        </div>
                      )}
                      <button
                        disabled={data.services.length === 0}
                        onClick={nextStep}
                        className="w-full h-14 bg-white text-black rounded-2xl font-bold mt-4 disabled:opacity-20 transition-opacity"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold leading-tight">Do you currently have a website?</h3>
                      <div className="grid gap-3">
                        {["Yes, I have a website", "No, I need one built"].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setData({ ...data, hasWebsite: opt });
                              nextStep();
                            }}
                            className={`p-6 rounded-2xl border transition-all text-left ${
                              data.hasWebsite === opt
                                ? "bg-indigo-500/10 border-indigo-500/50"
                                : "bg-white/5 border-white/5"
                            }`}
                          >
                            <span className="font-medium">{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold leading-tight">Do you currently use a CRM?</h3>
                      <div className="grid gap-3">
                        {["Yes", "No", "Not sure"].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setData({ ...data, crmStatus: opt });
                              if (opt !== "Yes") nextStep();
                            }}
                            className={`p-6 rounded-2xl border transition-all text-left ${
                              data.crmStatus === opt
                                ? "bg-indigo-500/10 border-indigo-500/50"
                                : "bg-white/5 border-white/5"
                            }`}
                          >
                            <span className="font-medium">{opt}</span>
                          </button>
                        ))}
                      </div>
                      {data.crmStatus === "Yes" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3 pt-2"
                        >
                          <p className="text-xs font-bold text-white/40 uppercase tracking-widest px-2">
                            Select Your CRM
                          </p>
                          <select
                            onChange={(e) => {
                              setData({ ...data, selectedCrm: e.target.value });
                              if (e.target.value !== "other") {
                                nextStep();
                              }
                            }}
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 outline-none focus:border-indigo-500 transition-colors"
                          >
                            <option value="">Select CRM...</option>
                            <option value="jobber">Jobber</option>
                            <option value="housecall">Housecall Pro</option>
                            <option value="servicetitan">ServiceTitan</option>
                            <option value="other">Other</option>
                          </select>
                          {data.selectedCrm === "other" && (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {data.customCrms.map((crm) => (
                                  <div
                                    key={crm}
                                    className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium"
                                  >
                                    {crm}
                                  </div>
                                ))}
                              </div>
                              <input
                                value={customCrmInput}
                                onChange={(event) => setCustomCrmInput(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    addCustomCrm(customCrmInput);
                                    setCustomCrmInput("");
                                  }
                                }}
                                placeholder="Add a CRM and press Enter"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 outline-none focus:border-indigo-500 transition-colors"
                              />
                              <button
                                onClick={nextStep}
                                disabled={data.customCrms.length === 0}
                                className="w-full h-12 bg-white/10 rounded-2xl font-bold hover:bg-white/20 transition-colors disabled:opacity-40"
                              >
                                Continue
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold leading-tight">Do you have a Facebook Ads account?</h3>
                      <p className="text-sm text-white/40 leading-relaxed">
                        This helps us configure conversion tracking correctly from day one.
                      </p>
                      <div className="grid gap-3">
                        {["Yes", "No", "Not sure"].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setData({ ...data, hasFbAds: opt });
                              nextStep();
                            }}
                            className={`p-6 rounded-2xl border transition-all text-left ${
                              data.hasFbAds === opt
                                ? "bg-indigo-500/10 border-indigo-500/50"
                                : "bg-white/5 border-white/5"
                            }`}
                          >
                            <span className="font-medium">{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold leading-tight">Do you have a logo?</h3>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 bg-white/[0.02] hover:border-white/20 transition-colors"
                      >
                        <Upload size={32} className="text-white/20" />
                        <div className="text-center">
                          <p className="font-medium mb-1">
                            {isUploadingLogo ? "Uploading logo..." : data.hasLogo ? "Logo selected" : "Upload brand assets"}
                          </p>
                          <p className="text-xs text-white/30">
                            {data.hasLogo ? "We'll use this for your branding." : "SVG, PNG, or JPG up to 10MB"}
                          </p>
                        </div>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".svg,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          setIsUploadingLogo(true);
                          uploadLogo(file)
                            .then((logoUrl) => {
                              setData((prev) => ({
                                ...prev,
                                hasLogo: true,
                                logoUrl: logoUrl ?? null,
                              }));
                              submitLead({
                                hasLogo: true,
                                logoFileName: file.name,
                                logoUrl: logoUrl ?? null,
                              });
                            })
                            .catch((error) => {
                              console.error(error);
                            })
                            .finally(() => {
                              setIsUploadingLogo(false);
                            });
                        }}
                      />
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => {
                            setData((prev) => ({ ...prev, hasLogo: false }));
                            submitLead({ hasLogo: false });
                          }}
                          disabled={isSendingLead || isUploadingLogo}
                          className="h-14 bg-white/10 rounded-2xl font-bold hover:bg-white/20 transition-colors disabled:opacity-40"
                        >
                          {isSendingLead ? "Submitting..." : "Skip for now"}
                        </button>
                        <p className="text-center text-[10px] text-white/30 uppercase tracking-[0.2em] pt-2">
                          You can change this later
                        </p>
                      </div>
                    </div>
                  )}

                  {step === 6 && (
                    <div className="space-y-8">
                      <div className="text-center space-y-2">
                        <h3 className="text-3xl font-bold leading-tight">System Ready.</h3>
                        <p className="text-white/40">Choose how you would like to proceed.</p>
                      </div>
                      <div className="grid gap-4">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            window.location.href = "https://buy.stripe.com/14AeVf6Js9TibsC3E99k404";
                          }}
                          className="group relative bg-white text-black p-8 rounded-[2rem] text-left overflow-hidden"
                        >
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                Immediate Action
                              </span>
                              <h4 className="text-xl font-bold">Pay $997 & Start</h4>
                              <p className="text-sm opacity-60">We begin your build immediately.</p>
                            </div>
                            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap size={80} fill="black" />
                          </div>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={onSchedule}
                          className="group relative bg-white/5 border border-white/10 p-8 rounded-[2rem] text-left hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                Consultation
                              </span>
                              <h4 className="text-xl font-bold">Schedule a Call</h4>
                              <p className="text-sm text-white/40">
                                A quick strategy call before moving forward.
                              </p>
                            </div>
                            <Clock size={24} className="text-white/20 group-hover:text-indigo-400 transition-colors" />
                          </div>
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="h-safe-area-bottom" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Hero = ({ onApply }: { onApply: () => void }) => {
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <motion.div
      style={{ scale, opacity }}
      className="relative h-screen flex flex-col items-center justify-center text-center px-6 sticky top-0 z-10 overflow-hidden"
    >
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

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10"
      >
        <span className="text-xs font-medium tracking-[0.2em] uppercase text-indigo-400 mb-4 block">
          Now Accepting Partners
        </span>
        <h1 className="text-5xl font-bold tracking-tight leading-[1.05] mb-6">
          We Build Your Instant Pricing & Booking System —{" "}
          <span className="text-white/40 italic">Done For You.</span>
        </h1>
        <p className="text-lg text-white/60 mb-10 max-w-xs mx-auto">
          Built to convert. Ready to scale.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
          <button
            onClick={onApply}
            className="bg-white text-black h-14 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-white/5"
          >
            Apply for DFY Setup
            <ChevronRight size={20} />
          </button>
          <button className="text-white/60 h-12 font-medium flex items-center justify-center gap-1 active:opacity-70 transition-opacity">
            What's Included
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SalesVideo = ({ onPlay }: { onPlay: () => void }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [120, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.96, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const smoothY = useSpring(y, { stiffness: 120, damping: 22, mass: 0.9 });
  const smoothScale = useSpring(scale, { stiffness: 120, damping: 22, mass: 0.9 });
  const smoothOpacity = useSpring(opacity, { stiffness: 120, damping: 22, mass: 0.9 });

  return (
    <Section className="py-12 -mt-24 md:-mt-40 relative z-20">
      <motion.div
        ref={ref}
        style={{ y: smoothY, scale: smoothScale, opacity: smoothOpacity, willChange: "transform" }}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden aspect-video flex items-center justify-center shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPlay}
            className="z-20 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-white/10"
          >
            <Play fill="black" className="ml-1 text-black" size={32} />
          </motion.button>

          <div className="absolute bottom-6 left-6 z-20 flex flex-col items-start gap-1">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-indigo-400">
              System Walkthrough
            </span>
            <p className="text-sm font-medium text-white/90">See how your new system works</p>
          </div>

          <div className="absolute bottom-6 right-6 z-20">
            <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-1 rounded-md backdrop-blur-md">
              02:45
            </span>
          </div>

          <div className="absolute inset-0 bg-[#1A1A1A] flex items-center justify-center">
            <div className="w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-white/40 italic">
          Watch: How we double your conversion rate in 14 days.
        </p>
      </motion.div>
    </Section>
  );
};

const RealityCheck = () => {
  const statements = [
    "Leads ask for pricing.",
    "You respond too late.",
    "They move on.",
    "Your ads aren't tracked.",
  ];

  return (
    <Section className="bg-black/50 z-10">
      <div className="space-y-12">
        {statements.map((text, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
            className="text-3xl font-light text-white/50 border-l-2 border-white/10 pl-6"
          >
            {text}
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="pt-8"
        >
          <p className="text-2xl font-medium leading-tight">
            This isn't a lead problem.
            <br />
            <span className="text-indigo-400">It's a system problem.</span>
          </p>
        </motion.div>
      </div>
    </Section>
  );
};

const SystemSnapshot = () => {
  const steps = [
    { label: "Visitor", icon: <Target className="text-white/40" /> },
    { label: "Instant Estimate", icon: <Zap className="text-indigo-400" /> },
    { label: "Owner Approval", icon: <ShieldCheck className="text-white/40" /> },
    { label: "Booking", icon: <Clock className="text-white/40" /> },
    { label: "CRM Sync", icon: <Database className="text-white/40" /> },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <Section className="py-32 overflow-hidden">
      <Headline>The System In Motion.</Headline>

      <div className="relative mt-12 bg-[#1A1A1A] rounded-[3rem] p-8 border border-white/5 aspect-[9/16] max-w-[300px] mx-auto shadow-2xl md:aspect-auto md:max-w-5xl">
        <div className="flex flex-col gap-6 h-full justify-center md:flex-row md:items-center md:justify-between md:gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: activeIndex === i ? 1 : 0.3,
                scale: activeIndex === i ? 1.05 : 1,
                x: activeIndex === i ? 8 : 0,
              }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 transition-colors md:flex-1"
            >
              <div className="bg-white/5 p-2 rounded-xl">{step.icon}</div>
              <span className="text-sm font-medium tracking-wide">{step.label}</span>
            </motion.div>
          ))}

          <div className="absolute left-14 top-[15%] bottom-[15%] w-px bg-white/5 -z-10 overflow-hidden md:hidden">
            <motion.div
              animate={{ y: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="w-full h-20 bg-gradient-to-b from-transparent via-indigo-500 to-transparent"
            />
          </div>
          <div className="absolute left-[10%] right-[10%] top-1/2 h-px bg-white/5 -z-10 overflow-hidden hidden md:block">
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="h-full w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
            />
          </div>
        </div>
      </div>

      <p className="text-center text-white/40 mt-8 text-sm font-medium">Fully automated. 24/7/365.</p>
    </Section>
  );
};

const SystemDemos = () => {
  const demos = [
    {
      name: "Pressure Washing",
      industry: "Exterior Cleaning",
      path: "https://mysite.autobidder.org/preview/19d655c0?t=176988756660",
    },
    {
      name: "Holiday Lighting",
      industry: "Seasonal Services",
      path: "https://mysite.autobidder.org/preview/cfa077a2?t=1769887566696",
    },
    {
      name: "Pest Control",
      industry: "Home Services",
      path: "https://mysite.autobidder.org/preview/654c1998?t=1769887566590",
    },
    {
      name: "Epoxy Flooring",
      industry: "Flooring",
      path: "https://mysite.autobidder.org/preview/cb7a5041?t=1769887566755",
    },
  ];

  return (
    <Section className="bg-[#0D0D0D]">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
          <Sparkles size={16} className="text-indigo-400" />
        </div>
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-400">Live Demos</span>
      </div>
      <Headline>Test the System.</Headline>
      <p className="text-white/50 mb-10 -mt-4 text-sm max-w-xs">
        Experience the exact booking flow we'll build for you.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {demos.map((demo, i) => (
          <motion.a
            key={i}
            href={demo.path}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.95 }}
            className="group block p-6 rounded-3xl bg-white/5 border border-white/5 active:bg-white/10 transition-colors"
          >
            <div className="flex flex-col gap-4 h-full justify-between">
              <div>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">
                  {demo.industry}
                </span>
                <h4 className="text-lg font-bold leading-tight group-hover:text-indigo-400 transition-colors">
                  {demo.name}
                </h4>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-indigo-400 uppercase tracking-widest">Live Demo</span>
                <ExternalLink
                  size={14}
                  className="text-white/20 group-hover:text-indigo-400 transition-colors"
                />
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </Section>
  );
};

const DeliverableStack = () => {
  const cards = [
    {
      title: "Conversion Website",
      desc: "6-page high-performance setup designed specifically for your industry.",
      icon: <Layout size={24} />,
    },
    {
      title: "Autobidder Calculator",
      desc: "Customized pricing logic to give instant quotes without you lifting a finger.",
      icon: <Zap size={24} />,
    },
    {
      title: "Video Assets",
      desc: "Pro-grade content to build immediate trust with local homeowners.",
      icon: <Target size={24} />,
    },
    {
      title: "Ads Integration",
      desc: "Complete Facebook & Google tracking to measure every dollar spent.",
      icon: <ArrowRight size={24} />,
    },
    {
      title: "CRM Sync",
      desc: "Direct connection to your existing software. No duplicate entries.",
      icon: <Database size={24} />,
    },
    {
      title: "Strategy Call",
      desc: "1-on-1 session to fine-tune your workflow and launch plan.",
      icon: <ShieldCheck size={24} />,
    },
  ];

  return (
    <Section>
      <Headline>The Deliverables.</Headline>
      <div className="grid gap-4 mt-8">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-[#121212] p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all cursor-pointer"
          >
            <div className="mb-4 text-indigo-400 group-hover:scale-110 transition-transform origin-left">
              {card.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{card.title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{card.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

const QualifyingSection = () => {
  return (
    <Section className="bg-[#080808]">
      <div className="space-y-16">
        <div>
          <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase mb-4 block">
            This is For You If:
          </span>
          <div className="space-y-4">
            {["You're ready to scale your ops", "You run or plan to run ads", "You value speed over DIY"].map(
              (item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <CheckCircle2 className="text-indigo-500 mt-1 shrink-0" size={20} />
                  <p className="text-lg text-white/80">{item}</p>
                </div>
              )
            )}
          </div>
        </div>

        <div className="opacity-50">
          <span className="text-xs font-bold text-white/40 tracking-widest uppercase mb-4 block">
            This is NOT For You If:
          </span>
          <div className="space-y-4">
            {[
              "You prefer manual lead handling",
              "You are a casual hobbyist",
              "You want a 'magic button' with no work",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <XCircle className="text-white/20 mt-1 shrink-0" size={20} />
                <p className="text-lg text-white/60">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

const Pricing = ({ onApply }: { onApply: () => void }) => {
  return (
    <Section className="text-center py-40">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-xs mx-auto"
      >
        <span className="text-sm font-medium text-white/40 mb-2 block">Investment</span>
        <h2 className="text-7xl font-bold mb-2">$997</h2>
        <p className="text-sm font-medium text-indigo-400 tracking-widest uppercase mb-8">
          One-Time Setup Fee
        </p>

        <div className="bg-white/5 p-4 rounded-2xl mb-10 text-sm text-white/60 border border-white/5">
          Requires Autobidder Pro ($97/mo)
        </div>

        <button
          onClick={onApply}
          className="w-full bg-white text-black h-16 rounded-2xl font-bold text-xl active:scale-95 transition-transform"
        >
          Start My DFY Setup
        </button>
      </motion.div>
    </Section>
  );
};

const HowItWorks = () => {
  const steps = [
    { num: "01", title: "Intake", desc: "Answer a few precision questions about your business and pricing logic." },
    { num: "02", title: "Execution", desc: "Our team builds your site, calculator, and integrations in 14 days." },
    { num: "03", title: "Launch", desc: "Review the system, get trained on the tech, and start scaling." },
  ];

  return (
    <Section>
      <Headline>How We Work.</Headline>
      <div className="space-y-12 mt-12 relative">
        <div className="absolute left-6 top-8 bottom-8 w-px bg-white/5" />
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className="flex gap-8 relative"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
          >
            <div className="bg-black border border-white/10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold text-indigo-400">
              {step.num}
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-white/50 leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

const FinalCTA = ({ onApply, onSchedule }: { onApply: () => void; onSchedule: () => void }) => {
  return (
    <Section className="bg-black py-40 text-center">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <p className="text-2xl font-medium mb-12 px-6">
          "You can build this yourself. Or you can have it done right."
        </p>
        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <button
            onClick={onApply}
            className="bg-white text-black h-14 rounded-2xl font-bold text-lg active:scale-95 transition-transform"
          >
            Apply Now
          </button>
          <button
            type="button"
            onClick={onSchedule}
            className="border border-white/10 text-white/60 h-14 rounded-2xl font-semibold text-lg active:bg-white/5 transition-colors"
          >
            Schedule a Call
          </button>
        </div>
      </motion.div>
    </Section>
  );
};

const StickyCTA = ({ visible, onClick }: { visible: boolean; onClick: () => void }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 p-6 z-[60] safe-area-bottom"
      >
        <div
          onClick={onClick}
          className="bg-white text-black h-16 rounded-2xl flex items-center justify-between px-6 shadow-2xl shadow-indigo-500/20 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <span className="font-bold text-lg">Start Your Setup</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold opacity-60 uppercase tracking-widest">$997</span>
            <ChevronRight size={24} />
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function LandingDfySetup() {
  const [showSticky, setShowSticky] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [calInteractive, setCalInteractive] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const calInitializedRef = useRef(false);

  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      if (latest > 0.85) {
        setShowSticky(true);
      } else {
        setShowSticky(false);
      }
    });
  }, [scrollYProgress]);

  const toggleModal = () => setIsModalOpen((prev) => !prev);
  const openBooking = () => {
    setIsModalOpen(false);
    setIsBookingOpen(true);
    setCalInteractive(false);
  };
  const openVideo = () => setIsVideoOpen(true);
  const closeVideo = () => setIsVideoOpen(false);
  const closeBooking = () => setIsBookingOpen(false);

  useEffect(() => {
    if (!isBookingOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isBookingOpen]);

  useEffect(() => {
    if (!isBookingOpen) return;

    const ensureCalShim = () => {
      const win = window as any;
      if (win.Cal) return;
      (function (C, A, L) {
        let p = function (a: any, ar: any) {
          a.q.push(ar);
        };
        let d = C.document;
        (C as any).Cal =
          (C as any).Cal ||
          function () {
            let cal = (C as any).Cal;
            let ar = arguments;
            if (!cal.loaded) {
              cal.ns = {};
              cal.q = cal.q || [];
              d.head.appendChild(d.createElement("script")).src = A;
              cal.loaded = true;
            }
            if (ar[0] === L) {
              const api: any = function () {
                p(api, arguments);
              };
              const namespace = ar[1];
              api.q = api.q || [];
              if (typeof namespace === "string") {
                cal.ns[namespace] = cal.ns[namespace] || api;
                p(cal.ns[namespace], ar);
                p(cal, ["initNamespace", namespace]);
              } else p(cal, ar);
              return;
            }
            p(cal, ar);
          };
      })(window, "https://app.cal.com/embed/embed.js", "init");
    };

    const initCal = () => {
      try {
        const win = window as any;
        ensureCalShim();
        if (!win?.Cal) return;
        if (!calInitializedRef.current) {
          win.Cal("init", "autobidder", { origin: "https://app.cal.com" });
          calInitializedRef.current = true;
        }
        if (!win.Cal?.ns?.autobidder) {
          setTimeout(initCal, 150);
          return;
        }
        const container = document.querySelector("#my-cal-inline-autobidder");
        if (container) {
          container.innerHTML = "";
        }
        win.Cal.ns.autobidder("inline", {
          elementOrSelector: "#my-cal-inline-autobidder",
          config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
          calLink: "nevin-shields-hhg3xz/autobidder",
        });
        win.Cal.ns.autobidder("ui", { hideEventTypeDetails: false, layout: "month_view" });
      } catch (error) {
        console.error("Cal embed init failed:", error);
      }
    };

    ensureCalShim();
    initCal();
  }, [isBookingOpen]);

  return (
    <main className="relative selection:bg-indigo-500 selection:text-white bg-[#0A0A0A] text-[#F5F5F7] overflow-x-hidden">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      <div
        className={
          isModalOpen
            ? "blur-sm transition-all duration-500 scale-[0.98] origin-center"
            : "transition-all duration-500"
        }
      >
        <Hero onApply={toggleModal} />
        <SalesVideo onPlay={openVideo} />
        <RealityCheck />
        <SystemSnapshot />
        <SystemDemos />
        <DeliverableStack />
        <QualifyingSection />
        <Pricing onApply={toggleModal} />
        <HowItWorks />
        <FinalCTA onApply={toggleModal} onSchedule={openBooking} />

        <footer className="p-8 text-center text-[10px] font-bold tracking-[0.3em] uppercase opacity-20 pb-32">
          Autobidder DFY © 2024
        </footer>
      </div>

      <OnboardingModal isOpen={isModalOpen} onClose={toggleModal} onSchedule={openBooking} />
      <StickyCTA visible={showSticky && !isModalOpen} onClick={toggleModal} />

      <AnimatePresence>
        {isBookingOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeBooking}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120]"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed left-0 right-0 bottom-0 top-10 md:top-20 bg-[#0F0F0F] z-[130] rounded-t-[2.5rem] border-t border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6">
                <div className="text-sm font-semibold text-white/70 uppercase tracking-[0.2em]">
                  Schedule a Call
                </div>
                <button
                  onClick={closeBooking}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="h-[80vh] md:h-[70vh] pb-8 px-6 overflow-y-auto touch-pan-y overscroll-contain">
                <div className="relative">
                  {!calInteractive && (
                    <button
                      type="button"
                      onClick={() => setCalInteractive(true)}
                      className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border border-white/10 bg-black/50 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur-sm"
                    >
                      Click to interact
                    </button>
                  )}
                  <div
                    id="my-cal-inline-autobidder"
                    className={`w-full min-h-[700px] md:min-h-full rounded-2xl border border-white/10 bg-black/40 overflow-hidden ${
                      calInteractive ? "" : "pointer-events-none"
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVideoOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeVideo}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[140]"
            />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed left-4 right-4 top-24 md:left-20 md:right-20 md:top-28 z-[150]"
            >
              <div className="relative bg-black rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <button
                  onClick={closeVideo}
                  className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </button>
                <div className="aspect-video w-full">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/AXAdDENUuYk?autoplay=1"
                    title="Autobidder DFY Setup"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-50 bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ffilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')]" />
    </main>
  );
}

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock3, Sparkles } from "lucide-react";
import { Link } from "wouter";
import LiquidEther from "@/components/LiquidEther";

export default function CallScheduling() {
  const calInitializedRef = useRef(false);

  useEffect(() => {
    const ensureCalShim = () => {
      const win = window as any;
      if (win.Cal) return;
      (function (C, A, L) {
        const p = function (a: any, ar: any) {
          a.q.push(ar);
        };
        const d = C.document;
        (C as any).Cal =
          (C as any).Cal ||
          function () {
            const cal = (C as any).Cal;
            const ar = arguments;
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
              } else {
                p(cal, ar);
              }
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
        const container = document.querySelector("#my-cal-inline-autobidder-schedule");
        if (container) {
          container.innerHTML = "";
        }
        win.Cal.ns.autobidder("inline", {
          elementOrSelector: "#my-cal-inline-autobidder-schedule",
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
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0A0A0A] text-[#F5F5F7] selection:bg-indigo-500 selection:text-white">
      <div className="absolute inset-0 z-0">
        <LiquidEther
          className="h-full w-full"
          colors={["#1D4ED8", "#4F46E5", "#22D3EE"]}
          resolution={0.45}
          autoDemo
          autoSpeed={0.4}
          autoIntensity={1.9}
          cursorSize={85}
          mouseForce={16}
          style={{ opacity: 0.5 }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(0,0,0,0.12),rgba(0,0,0,0.84)_72%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:py-14">
        <div className="mb-10">
          <Link href="/dfy-setup" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white/80">
            <ArrowLeft size={14} />
            Back to DFY Setup
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 md:sticky md:top-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/35 bg-indigo-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-indigo-300">
              <Sparkles size={12} />
              Strategy Session
            </div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
              Schedule Your
              <br />
              Setup Call.
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-white/60 md:text-base">
              Pick a time that works for you and we will walk through your offer, tech stack, and launch plan.
            </p>
            <div className="space-y-3 text-sm text-white/75">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <CalendarDays size={16} className="text-indigo-400" />
                <span>Live availability and instant confirmation</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <Clock3 size={16} className="text-indigo-400" />
                <span>~20 minutes with the Autobidder team</span>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[2rem] border border-white/10 bg-black/35 p-4 backdrop-blur-xl md:p-5"
          >
            <div
              id="my-cal-inline-autobidder-schedule"
              className="min-h-[760px] w-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/40"
            />
          </motion.section>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-0 z-50 bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')] opacity-[0.03]" />
    </main>
  );
}

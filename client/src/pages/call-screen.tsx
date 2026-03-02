import { lazy, Suspense } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const StyledCalculator = lazy(() => import("@/pages/styled-calculator"));

export default function CallScreen() {
  return (
    <DashboardLayout>
      <style>{`
        @keyframes callscreen-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cs-stagger { animation: callscreen-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .cs-stagger-1 { animation-delay: 0ms; }
        .cs-stagger-2 { animation-delay: 80ms; }
        .cs-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
      `}</style>
      <div className="p-4 sm:p-6 lg:p-8 cs-grain" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="cs-stagger cs-stagger-1 relative overflow-hidden rounded-2xl border border-amber-200/40 dark:border-amber-500/10 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-200/30 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-orange-200/20 to-transparent dark:from-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-400/60 font-semibold mb-1">Tools</p>
                  <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    Call Screen
                  </h1>
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                    Quick pricing calculator for phone conversations.
                  </p>
                </div>
              </div>
              <Link href="/formulas">
                <Button
                  variant="outline"
                  className="rounded-full border-amber-200 hover:bg-amber-50 dark:border-amber-700/40 dark:hover:bg-amber-900/20 w-full sm:w-auto"
                  data-testid="button-edit-pricing"
                >
                  Edit Pricing
                </Button>
              </Link>
            </div>
          </div>

          {/* Calculator with Call Screen Mode */}
          <div className="cs-stagger cs-stagger-2">
            <Suspense fallback={
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72 mb-6"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i}>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            }>
              <StyledCalculator isCallScreenMode={true} />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

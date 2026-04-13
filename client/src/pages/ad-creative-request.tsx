import { Link } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
import AdCreativeRequestPage from "@/components/ad-creative-request-page";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function AdCreativeRequestRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <img src={autobidderLogo} alt="Autobidder" className="h-10 w-10" />
              <div>
                <div
                  className="text-lg tracking-tight text-slate-950 dark:text-white"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  Autobidder
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                  Pricing Platform
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Button asChild variant="unstyled" className="rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 text-white shadow-[0_16px_30px_-16px_rgba(234,88,12,0.8)] hover:from-amber-500 hover:to-orange-500">
                <Link href="/signup">Start Free</Link>
              </Button>
            </div>
          </div>
        </header>

        <main>
          <AdCreativeRequestPage />
        </main>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <AdCreativeRequestPage />
    </DashboardLayout>
  );
}

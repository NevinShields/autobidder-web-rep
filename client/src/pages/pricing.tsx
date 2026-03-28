import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Crown, Gift, Calculator, Zap, Sparkles, type LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { marketingPlans, type MarketingPlanId } from "@/lib/pricing-plans";
import { useForceLightMode } from "@/hooks/use-force-light-mode";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function Pricing() {
  useForceLightMode();

  const [isYearly, setIsYearly] = useState(false);
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<MarketingPlanId | null>(null);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const planMeta: Record<MarketingPlanId, { badge: string | null; icon: LucideIcon; tone: string }> = {
    free: { badge: null, icon: Gift, tone: "slate" },
    core: { badge: null, icon: Calculator, tone: "sky" },
    plus: { badge: "Most Popular", icon: Zap, tone: "amber" },
    "plus-seo": { badge: null, icon: Crown, tone: "rose" },
  };

  const plans = marketingPlans.map((plan) => ({
    ...plan,
    ...planMeta[plan.id],
  }));

  const stripePlanMap: Partial<Record<MarketingPlanId, "standard" | "plus" | "plus_seo">> = {
    core: "standard",
    plus: "plus",
    "plus-seo": "plus_seo",
  };

  const handlePlanButtonClick = async (planId: MarketingPlanId) => {
    if (!isAuthenticated) {
      window.location.href = "/signup";
      return;
    }

    const mappedPlanId = stripePlanMap[planId];
    if (!mappedPlanId) {
      window.location.href = "/dashboard";
      return;
    }

    try {
      setCheckoutLoadingPlan(planId);

      const response = await apiRequest("POST", "/api/create-checkout-session", {
        planId: mappedPlanId,
        billingPeriod: isYearly ? "yearly" : "monthly",
      });

      const data = await response.json();
      if (!data?.url) {
        throw new Error("Failed to create checkout session");
      }

      window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoadingPlan(null);
    }
  };

  const getToneClasses = (tone: string) => {
    switch (tone) {
      case "sky":
        return {
          iconWrap: "bg-sky-100 text-sky-700 border-sky-200",
          button: "bg-slate-900 hover:bg-slate-800 text-white",
        };
      case "amber":
        return {
          iconWrap: "bg-amber-100 text-amber-700 border-amber-200",
          button: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      case "rose":
        return {
          iconWrap: "bg-rose-100 text-rose-700 border-rose-200",
          button: "bg-slate-900 hover:bg-slate-800 text-white",
        };
      default:
        return {
          iconWrap: "bg-slate-100 text-slate-700 border-slate-200",
          button: "bg-slate-900 hover:bg-slate-800 text-white",
        };
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-slate-50 text-slate-900"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        .pricing-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="pricing-grain absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-200/60 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
        <div className="absolute top-24 left-0 w-80 h-80 bg-gradient-to-br from-orange-200/40 to-transparent rounded-full -translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-[32rem] h-[32rem] bg-gradient-to-tr from-slate-200/60 to-transparent rounded-full translate-y-1/3 -translate-x-1/2 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <img src={autobidderLogo} alt="Autobidder" className="h-10 w-10" />
                <span
                  className="text-xl text-slate-900 tracking-tight"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  Autobidder
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-6 bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200">
              Pricing That Fits the Way You Grow
            </Badge>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight mb-5"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Choose the plan that matches your stage.
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
              Every plan is built around the same Autobidder workflow: instant pricing, better lead capture,
              and less manual quoting.
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center gap-6">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white/85 backdrop-blur-xl px-5 py-4 shadow-sm">
              <div className="flex items-center gap-4">
                <span className={`text-sm font-medium ${!isYearly ? "text-slate-900" : "text-slate-500"}`}>
                  Monthly
                </span>
                <Switch
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                  className="data-[state=checked]:bg-amber-600"
                />
                <span className={`text-sm font-medium ${isYearly ? "text-slate-900" : "text-slate-500"}`}>
                  Yearly
                </span>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 whitespace-nowrap">
                Save up to 20%
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const toneClasses = getToneClasses(plan.tone);

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl border bg-white/88 backdrop-blur-xl shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    plan.featured
                      ? "border-amber-300 ring-1 ring-amber-200 shadow-amber-100/60"
                      : "border-slate-200/80"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-6">
                      <Badge className="bg-slate-900 text-white hover:bg-slate-900 px-3 py-1 border-0">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-5 pt-8">
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${toneClasses.iconWrap}`}>
                      <Icon className="h-7 w-7" />
                    </div>

                    <div className="space-y-3">
                      <CardTitle className="text-2xl text-slate-900">{plan.name}</CardTitle>
                      <div>
                        <div className="flex items-end gap-1">
                          {plan.monthlyPrice === 0 ? (
                            <span className="text-4xl font-bold tracking-tight text-slate-900">Free</span>
                          ) : (
                            <>
                              <span className="text-4xl font-bold tracking-tight text-slate-900">
                                ${isYearly ? plan.yearlyMonthlyPrice.toFixed(2) : plan.monthlyPrice}
                              </span>
                              <span className="text-slate-500 pb-1">/month</span>
                            </>
                          )}
                        </div>

                        {isYearly && plan.monthlyPrice > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-sm text-slate-500">
                              <span className="line-through">${plan.monthlyPrice}/month</span>
                              <span className="ml-2 font-medium text-emerald-700">
                                Save ${((plan.monthlyPrice * 12) - (plan.yearlyMonthlyPrice * 12)).toFixed(2)}/year
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Billed annually (${(plan.yearlyMonthlyPrice * 12).toFixed(2)}/year)
                            </div>
                          </div>
                        )}

                        {plan.monthlyPrice === 0 && (
                          <div className="mt-2 text-sm text-slate-500">Forever free</div>
                        )}
                      </div>

                      <p className="text-sm leading-relaxed text-slate-600">{plan.description}</p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col flex-1 pt-0">
                    <Button
                      className={`w-full h-12 rounded-xl font-medium shadow-sm ${toneClasses.button}`}
                      onClick={() => void handlePlanButtonClick(plan.id)}
                      disabled={checkoutLoadingPlan !== null}
                    >
                      {checkoutLoadingPlan === plan.id
                        ? "Redirecting..."
                        : plan.monthlyPrice === 0
                          ? "Get Started Free"
                          : isAuthenticated
                            ? "Upgrade Now"
                            : "Start Free Trial"}
                    </Button>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-4 w-4 text-amber-600" />
                        <h4 className="text-sm font-semibold text-slate-900">Included in this plan</h4>
                      </div>

                      <div className="space-y-3">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                              <Check className="h-3 w-3 text-emerald-700" />
                            </div>
                            <span className="text-sm leading-6 text-slate-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="py-20 border-y border-slate-200 bg-white/70 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2
                className="text-3xl sm:text-4xl text-slate-900 mb-3"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              >
                Common questions, clear answers.
              </h2>
              <p className="text-slate-600">
                The pricing structure is simple. The rollout can stay flexible.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                {
                  title: "Can I change plans at any time?",
                  body: "Yes. You can upgrade or downgrade your plan whenever you need to. Billing adjusts based on the change.",
                },
                {
                  title: "What happens during the free trial?",
                  body: "You get full access to your selected plan for 14 days with no credit card required. Continue after the trial or cancel.",
                },
                {
                  title: "Do you offer refunds?",
                  body: "Yes. We offer a 30-day money-back guarantee if Autobidder is not the right fit for your workflow.",
                },
                {
                  title: "Is there a setup fee?",
                  body: "No. There are no setup fees or surprise onboarding costs. The listed plan price is the price you pay.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] bg-slate-900 text-white px-8 py-12 sm:px-12 sm:py-14 shadow-[0_20px_60px_rgba(15,23,42,0.18)] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_38%)]" />
              <div className="relative z-10 text-center">
                <h2
                  className="text-3xl sm:text-4xl mb-4"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  Ready to automate your pricing flow?
                </h2>
                <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
                  Start with the plan that fits today. Upgrade when your lead volume, SEO, or automation needs grow.
                </p>
                <Link href="/signup">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-8">
                    Start Your Free Trial
                  </Button>
                </Link>
                <p className="text-slate-400 text-sm mt-4">
                  No credit card required • 14-day free trial
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={autobidderLogo} alt="Autobidder" className="h-8 w-8" />
              <span className="text-slate-900 font-semibold">Autobidder</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <Link href="/docs" className="hover:text-slate-900 transition-colors">Docs</Link>
              <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            </div>
            <div className="text-sm text-slate-500">© 2025 Autobidder. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

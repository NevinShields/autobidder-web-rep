import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";

const StyledCalculator = lazy(() => import("@/pages/styled-calculator"));
const CustomFormDisplay = lazy(() => import("@/pages/custom-form-display"));
const EmbedCalculator = lazy(() => import("@/pages/embed-calculator"));

function CalculatorLoader() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-72 mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmbedRouter() {
  return (
    <Suspense fallback={<CalculatorLoader />}>
      <Switch>
        <Route path="/embed/:embedId" component={EmbedCalculator} />
        <Route path="/custom-form/:embedId" component={StyledCalculator} />
        <Route path="/f/:accountId/:slug" component={CustomFormDisplay} />
        <Route path="/styled-calculator" component={StyledCalculator} />
        <Route>
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Calculator Not Found</h1>
              <p className="text-gray-500">The calculator you're looking for doesn't exist.</p>
            </div>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

export default function EmbedApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <EmbedRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

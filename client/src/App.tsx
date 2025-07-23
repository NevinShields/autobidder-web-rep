import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import FormulaBuilder from "@/pages/formula-builder";
import EmbedCalculator from "@/pages/embed-calculator";
import EmbedForm from "@/pages/embed-form";
import ServiceSelector from "@/pages/service-selector";
import BusinessSettings from "@/pages/business-settings";
import FormSettings from "@/pages/form-settings";
import DesignDashboard from "@/pages/design-dashboard";
import LeadsPage from "@/pages/leads";
import CalendarPage from "@/pages/calendar";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/formula/:id" component={FormulaBuilder} />
      <Route path="/embed/:embedId" component={EmbedCalculator} />
      <Route path="/embed-form" component={EmbedForm} />
      <Route path="/service-selector" component={ServiceSelector} />
      <Route path="/business-settings" component={BusinessSettings} />
      <Route path="/form-settings" component={FormSettings} />
      <Route path="/design" component={DesignDashboard} />
      <Route path="/leads" component={LeadsPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

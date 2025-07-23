import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import FormulasPage from "@/pages/formulas";
import FormulaBuilder from "@/pages/formula-builder";
import EmbedCalculator from "@/pages/embed-calculator";
import EmbedForm from "@/pages/embed-form";
import EmbedCode from "@/pages/embed-code";
import ServiceSelector from "@/pages/service-selector";
import BusinessSettings from "@/pages/business-settings";
import FormSettings from "@/pages/form-settings";
import DesignDashboard from "@/pages/design-dashboard";
import LeadsPage from "@/pages/leads";
import CalendarPage from "@/pages/calendar";
import UsersPage from "@/pages/users";
import Website from "@/pages/website";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Pricing from "@/pages/pricing";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/formulas" component={FormulasPage} />
      <Route path="/formula/:id" component={FormulaBuilder} />
      <Route path="/embed/:embedId" component={EmbedCalculator} />
      <Route path="/embed-form" component={EmbedForm} />
      <Route path="/embed-code" component={EmbedCode} />
      <Route path="/service-selector" component={ServiceSelector} />
      <Route path="/services" component={ServiceSelector} />
      <Route path="/business-settings" component={BusinessSettings} />
      <Route path="/form-settings" component={FormSettings} />
      <Route path="/design" component={DesignDashboard} />
      <Route path="/leads" component={LeadsPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/website" component={Website} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/landing" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/pricing" component={Pricing} />
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

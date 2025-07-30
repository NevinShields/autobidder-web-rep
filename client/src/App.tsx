import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { lazy } from "react";
import Dashboard from "@/pages/dashboard";
import FormulasPage from "@/pages/formulas";
import FormulaBuilder from "@/pages/formula-builder";
import EmbedCalculator from "@/pages/embed-calculator";
import EmbedForm from "@/pages/embed-form";
import UpsellForm from "@/pages/upsell-form";
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
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Pricing from "@/pages/pricing";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";
import StatsPage from "@/pages/stats";
import Onboarding from "@/pages/onboarding";

import SignupSuccess from "@/pages/signup-success";
import CustomForms from "@/pages/custom-forms";
import AdminDashboard from "@/pages/admin-dashboard";
import EstimatesPage from "@/pages/estimates";
import EstimatePage from "@/pages/estimate";
import EmailSettingsPage from "@/pages/email-settings";
import EmailTemplatesPage from "@/pages/email-templates";
import BidRequestsPage from "@/pages/bid-requests";
import VerifyBidPage from "@/pages/verify-bid";
import BidResponsePage from "@/pages/bid-response";
import BidEmailTemplatesPage from "@/pages/bid-email-templates";
import StripeSettingsPage from "@/pages/stripe-settings";
import AdminStripeSettingsPage from "@/pages/admin-stripe-settings";
import SupportPage from "@/pages/support";
import AdminSupportTicketsPage from "@/pages/admin-support-tickets";
import AdminWebsiteTemplatesPage from "@/pages/admin-website-templates";
import AdminDudaTemplatesPage from "@/pages/admin-duda-templates";
import AdminTemplateTagsPage from "@/pages/admin-template-tags";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/landing" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/signup-success" component={SignupSuccess} />
        {/* Public routes for embed forms */}
        <Route path="/embed/:embedId" component={EmbedCalculator} />
        <Route path="/embed-form" component={EmbedForm} />
        <Route path="/upsell-form" component={UpsellForm} />
        <Route path="/service-selector" component={ServiceSelector} />
        <Route path="/services" component={ServiceSelector} />
        <Route path="/estimate/:estimateNumber" component={EstimatePage} />
        <Route path="/verify-bid/:id" component={VerifyBidPage} />
        <Route path="/bid-response/:token" component={BidResponsePage} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/formulas" component={FormulasPage} />
      <Route path="/formula/:id" component={FormulaBuilder} />
      <Route path="/formula-builder/:id" component={FormulaBuilder} />
      <Route path="/formula-builder" component={FormulaBuilder} />
      <Route path="/embed-code" component={EmbedCode} />
      <Route path="/business-settings" component={BusinessSettings} />
      <Route path="/form-settings" component={FormSettings} />
      <Route path="/design" component={DesignDashboard} />
      <Route path="/leads" component={LeadsPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/stats" component={StatsPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/website" component={Website} />
      <Route path="/custom-forms" component={CustomForms} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/estimates" component={EstimatesPage} />
      <Route path="/estimate/:estimateNumber" component={EstimatePage} />
      <Route path="/email-settings" component={EmailSettingsPage} />
      <Route path="/email-templates" component={EmailTemplatesPage} />
      <Route path="/bid-email-templates" component={BidEmailTemplatesPage} />
      <Route path="/bid-requests" component={BidRequestsPage} />
      <Route path="/support" component={SupportPage} />
      <Route path="/stripe-settings" component={StripeSettingsPage} />
      <Route path="/admin/stripe-settings" component={AdminStripeSettingsPage} />
      <Route path="/admin/support-tickets" component={AdminSupportTicketsPage} />
      <Route path="/admin/website-templates" component={AdminWebsiteTemplatesPage} />
      <Route path="/admin/duda-templates" component={AdminDudaTemplatesPage} />
      <Route path="/admin/template-tags" component={AdminTemplateTagsPage} />
      <Route path="/profile" component={ProfilePage} />
      {/* Public routes still accessible when authenticated */}
      <Route path="/embed/:embedId" component={EmbedCalculator} />
      <Route path="/embed-form" component={EmbedForm} />
      <Route path="/upsell-form" component={UpsellForm} />
      <Route path="/service-selector" component={ServiceSelector} />
      <Route path="/services" component={ServiceSelector} />
      <Route path="/verify-bid/:id" component={VerifyBidPage} />
      {/* Password reset routes accessible when authenticated (for testing) */}
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
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

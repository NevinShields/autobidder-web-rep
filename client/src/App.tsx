import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleMapsLoader } from "@/components/google-maps-loader";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/use-theme";
import { lazy } from "react";
import Dashboard from "@/pages/dashboard";
import FormulasPage from "@/pages/formulas";
import FormulaBuilder from "@/pages/formula-builder";
import EmbedCalculator from "@/pages/embed-calculator";

import EmbedCode from "@/pages/embed-code";
import ServiceSelector from "@/pages/service-selector";

import FormSettings from "@/pages/form-settings";
import DesignDashboard from "@/pages/design-dashboard-new";
import LeadsPage from "@/pages/leads";
import CalendarPage from "@/pages/calendar";
import UsersPage from "@/pages/users";
import Website from "@/pages/website";
import Landing from "@/pages/landing";
import Lander from "@/pages/lander";
import LandingExteriorCleaning from "@/pages/landing-exterior-cleaning";
import LandingSplitTest from "@/pages/landing-split-test";
import LandingDfySetup from "@/pages/landing-dfy-setup";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Pricing from "@/pages/pricing";
import Features from "@/pages/features";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";
import StatsPage from "@/pages/stats";
import Onboarding from "@/pages/onboarding";

import SignupSuccess from "@/pages/signup-success";
import CustomForms from "@/pages/custom-forms";
import CustomFormEditor from "@/pages/custom-form-editor";
import AdminDashboard from "@/pages/admin-dashboard";
import EstimatesPage from "@/pages/estimates";
import EstimatePage from "@/pages/estimate";
import WorkOrdersPage from "@/pages/work-orders";
import EmailSettingsPage from "@/pages/email-settings";
import EmailTemplatesPage from "@/pages/email-templates";
import BidRequestsPage from "@/pages/bid-requests";
import VerifyBidPage from "@/pages/verify-bid";
import BidResponsePage from "@/pages/bid-response";
import BidEmailTemplatesPage from "@/pages/bid-email-templates";

import SupportPage from "@/pages/support";

import AdminWebsiteTemplatesPage from "@/pages/admin-website-templates";

import AdminTemplateTagsPage from "@/pages/admin-template-tags";
import DfyServicesPage from "@/pages/dfy-services";
import AdminDfyServicesPage from "@/pages/admin-dfy-services";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import IntegrationsPage from "@/pages/integrations";
import CallScreen from "@/pages/call-screen";
import UpgradePage from "@/pages/upgrade";

import SubscriptionTest from "@/pages/subscription-test";
import PaymentConfirmation from "@/pages/payment-confirmation";
import StyledCalculator from "@/pages/styled-calculator";
import ProposalsPage from "@/pages/proposals";
import ProposalViewPage from "@/pages/proposal-view";
import MapMigrationDemo from "@/pages/map-migration-demo";
import TerraDrawRefinement from "@/pages/terra-draw-refinement";
import CustomFormDisplay from "@/pages/custom-form-display";
import PhotoMeasurement from "@/pages/photo-measurement";
import BookingTest from "@/pages/booking-test";
import SeoTrackerTest from "@/pages/seo-tracker-test";
import MeasureMapTool from "@/pages/measure-map-tool";
import FAQPage from "@/pages/faq";
import BookCall from "@/pages/book-call";
import AcceptInvitePage from "@/pages/accept-invite";
import CrmSettings from "@/pages/crm-settings";
import CrmAutomations from "@/pages/crm-automations";
import CrmAnalytics from "@/pages/crm-analytics";
import AutomationBuilder from "@/pages/automations";
import BlockedIpsPage from "@/pages/blocked-ips";
import PhotosPage from "@/pages/photos";
import TutorialsPage from "@/pages/tutorials";
import WhiteLabelVideosPage from "@/pages/white-label-videos";
import AbSeoPlan from "@/pages/ab-seo-plan";
import LeadCapture from "@/pages/Crm/LeadCapture";
import TryCalculator from "@/pages/try-calculator";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug logging
  console.log('Router render:', { isAuthenticated, isLoading, user: user?.email });


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
        <Route path="/lander" component={Lander} />
        <Route path="/exterior-cleaning" component={LandingExteriorCleaning} />
        <Route path="/split-test" component={LandingSplitTest} />
        <Route path="/dfy-setup" component={LandingDfySetup} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/features" component={Features} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/signup-success" component={SignupSuccess} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/book-call" component={BookCall} />
        <Route path="/accept-invite" component={AcceptInvitePage} />
        {/* Public routes for embed forms */}
        <Route path="/embed/:embedId" component={EmbedCalculator} />
        <Route path="/custom-form/:embedId" component={StyledCalculator} />
        <Route path="/f/:accountId/:slug" component={CustomFormDisplay} />

        <Route path="/service-selector" component={ServiceSelector} />
        <Route path="/services" component={ServiceSelector} />
        <Route path="/styled-calculator" component={StyledCalculator} />
        <Route path="/estimate/:estimateNumber" component={EstimatePage} />
        <Route path="/verify-bid/:token" component={VerifyBidPage} />
        <Route path="/bid-response/:token" component={BidResponsePage} />
        <Route path="/proposal/:leadId" component={ProposalViewPage} />
        {/* Public testing/demo routes */}
        <Route path="/map-migration-demo" component={MapMigrationDemo} />
        <Route path="/terra-draw-refinement" component={TerraDrawRefinement} />
        <Route path="/photo-measurement" component={PhotoMeasurement} />
        <Route path="/measure-map-tool" component={MeasureMapTool} />
        <Route path="/ab-seo-plan" component={AbSeoPlan} />
        <Route path="/try" component={TryCalculator} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <>
      {user && (user as any).isImpersonating && <ImpersonationBanner />}
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/formulas" component={FormulasPage} />
        <Route path="/formula/:id" component={FormulaBuilder} />
        <Route path="/formula-builder/:id" component={FormulaBuilder} />
        <Route path="/formula-builder" component={FormulaBuilder} />
        <Route path="/embed-code" component={EmbedCode} />

        <Route path="/form-settings" component={FormSettings} />
        <Route path="/design" component={DesignDashboard} />
        <Route path="/styled-calculator" component={StyledCalculator} />
        <Route path="/leads" component={LeadsPage} />
        <Route path="/photos" component={PhotosPage} />
        <Route path="/proposals" component={ProposalsPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/stats" component={StatsPage} />
        <Route path="/users" component={UsersPage} />
        <Route path="/website" component={Website} />
        <Route path="/custom-forms" component={CustomForms} />
        <Route path="/custom-forms/:formId/edit" component={CustomFormEditor} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin-dashboard" component={AdminDashboard} />
        <Route path="/estimates" component={EstimatesPage} />
        <Route path="/estimate/:estimateNumber" component={EstimatePage} />
        <Route path="/work-orders" component={WorkOrdersPage} />
        <Route path="/email-settings" component={EmailSettingsPage} />
        <Route path="/email-templates" component={EmailTemplatesPage} />
        <Route path="/bid-email-templates" component={BidEmailTemplatesPage} />
        <Route path="/bid-requests" component={BidRequestsPage} />
        <Route path="/support" component={SupportPage} />
        <Route path="/integrations" component={IntegrationsPage} />
        <Route path="/call-screen" component={CallScreen} />
        <Route path="/crm/settings" component={CrmSettings} />
        <Route path="/crm/automations" component={CrmAutomations} />
        <Route path="/crm/analytics" component={CrmAnalytics} />
        <Route path="/crm/lead-capture" component={LeadCapture} />
        <Route path="/crm/blocked-ips" component={BlockedIpsPage} />
        <Route path="/automations/create" component={AutomationBuilder} />
        <Route path="/automations/:id" component={AutomationBuilder} />

        <Route path="/admin/website-templates" component={AdminWebsiteTemplatesPage} />

        <Route path="/admin/template-tags" component={AdminTemplateTagsPage} />
        <Route path="/dfy-services" component={DfyServicesPage} />
        <Route path="/admin/dfy-services" component={AdminDfyServicesPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/book-call" component={BookCall} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/upgrade" component={UpgradePage} />
        <Route path="/payment-confirmation" component={PaymentConfirmation} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/features" component={Features} />
        <Route path="/landing" component={Landing} />
        <Route path="/lander" component={Lander} />
        <Route path="/exterior-cleaning" component={LandingExteriorCleaning} />
        <Route path="/split-test" component={LandingSplitTest} />
        <Route path="/dfy-setup" component={LandingDfySetup} />

        <Route path="/subscription-test" component={SubscriptionTest} />
        {/* Public routes still accessible when authenticated */}
        <Route path="/embed/:embedId" component={EmbedCalculator} />
        <Route path="/custom-form/:embedId" component={StyledCalculator} />
        <Route path="/f/:accountId/:slug" component={CustomFormDisplay} />

        <Route path="/service-selector" component={ServiceSelector} />
        <Route path="/services" component={ServiceSelector} />
        <Route path="/verify-bid/:token" component={VerifyBidPage} />
        <Route path="/bid-response/:token" component={BidResponsePage} />
        {/* Password reset routes accessible when authenticated (for testing) */}
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        {/* Demo/testing routes accessible when authenticated */}
        <Route path="/map-migration-demo" component={MapMigrationDemo} />
        <Route path="/terra-draw-refinement" component={TerraDrawRefinement} />
        <Route path="/photo-measurement" component={PhotoMeasurement} />
        <Route path="/measure-map-tool" component={MeasureMapTool} />
        <Route path="/booking-test" component={BookingTest} />
        <Route path="/seo-tracker-test" component={SeoTrackerTest} />
        <Route path="/tutorials" component={TutorialsPage} />
        <Route path="/white-label-videos" component={WhiteLabelVideosPage} />
        <Route path="/ab-seo-plan" component={AbSeoPlan} />
        <Route path="/try" component={TryCalculator} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

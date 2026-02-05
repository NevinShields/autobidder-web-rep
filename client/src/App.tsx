import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { WelcomeModal } from "@/components/welcome-modal";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/use-theme";
import { lazy, Suspense } from "react";

// Keep essential pages as eager imports for fast initial load
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import NotFound from "@/pages/not-found";

// Lazy load all other pages for code splitting
const Dashboard = lazy(() => import("@/pages/dashboard"));
const FormulasPage = lazy(() => import("@/pages/formulas"));
const FormulaBuilder = lazy(() => import("@/pages/formula-builder"));
const EmbedCalculator = lazy(() => import("@/pages/embed-calculator"));
const EmbedCode = lazy(() => import("@/pages/embed-code"));
const ServiceSelector = lazy(() => import("@/pages/service-selector"));
const FormSettings = lazy(() => import("@/pages/form-settings"));
const DesignDashboard = lazy(() => import("@/pages/design-dashboard-new"));
const LeadsPage = lazy(() => import("@/pages/leads"));
const CalendarPage = lazy(() => import("@/pages/calendar"));
const UsersPage = lazy(() => import("@/pages/users"));
const Website = lazy(() => import("@/pages/website"));
const Lander = lazy(() => import("@/pages/lander"));
const LandingExteriorCleaning = lazy(() => import("@/pages/landing-exterior-cleaning"));
const LandingSplitTest = lazy(() => import("@/pages/landing-split-test"));
const LandingDfySetup = lazy(() => import("@/pages/landing-dfy-setup"));
const LandingBrutalist = lazy(() => import("@/pages/landing-brutalist"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const Pricing = lazy(() => import("@/pages/pricing"));
const Features = lazy(() => import("@/pages/features"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const StatsPage = lazy(() => import("@/pages/stats"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const DocsPage = lazy(() => import("@/pages/docs"));
const SignupSuccess = lazy(() => import("@/pages/signup-success"));
const CustomForms = lazy(() => import("@/pages/custom-forms"));
const CustomFormEditor = lazy(() => import("@/pages/custom-form-editor"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const EstimatesPage = lazy(() => import("@/pages/estimates"));
const EstimatePage = lazy(() => import("@/pages/estimate"));
const WorkOrdersPage = lazy(() => import("@/pages/work-orders"));
const EmailSettingsPage = lazy(() => import("@/pages/email-settings"));
const BusinessSettingsPage = lazy(() => import("@/pages/business-settings"));
const EstimatePageSettings = lazy(() => import("@/pages/estimate-page-settings"));
const EmailTemplatesPage = lazy(() => import("@/pages/email-templates"));
const BidRequestsPage = lazy(() => import("@/pages/bid-requests"));
const VerifyBidPage = lazy(() => import("@/pages/verify-bid"));
const BidResponsePage = lazy(() => import("@/pages/bid-response"));
const BidEmailTemplatesPage = lazy(() => import("@/pages/bid-email-templates"));
const SupportPage = lazy(() => import("@/pages/support"));
const AdminWebsiteTemplatesPage = lazy(() => import("@/pages/admin-website-templates"));
const AdminTemplateTagsPage = lazy(() => import("@/pages/admin-template-tags"));
const DfyServicesPage = lazy(() => import("@/pages/dfy-services"));
const AdminDfyServicesPage = lazy(() => import("@/pages/admin-dfy-services"));
const AdminSupportVideosPage = lazy(() => import("@/pages/admin-support-videos"));
const TermsPage = lazy(() => import("@/pages/terms"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const IntegrationsPage = lazy(() => import("@/pages/integrations"));
const CallScreen = lazy(() => import("@/pages/call-screen"));
const UpgradePage = lazy(() => import("@/pages/upgrade"));
const SubscriptionTest = lazy(() => import("@/pages/subscription-test"));
const PaymentConfirmation = lazy(() => import("@/pages/payment-confirmation"));
const StyledCalculator = lazy(() => import("@/pages/styled-calculator"));
const ProposalsPage = lazy(() => import("@/pages/proposals"));
const ProposalViewPage = lazy(() => import("@/pages/proposal-view"));
const MapMigrationDemo = lazy(() => import("@/pages/map-migration-demo"));
const TerraDrawRefinement = lazy(() => import("@/pages/terra-draw-refinement"));
const CustomFormDisplay = lazy(() => import("@/pages/custom-form-display"));
const PhotoMeasurement = lazy(() => import("@/pages/photo-measurement"));
const BookingTest = lazy(() => import("@/pages/booking-test"));
const SeoTrackerTest = lazy(() => import("@/pages/seo-tracker-test"));
const MeasureMapTool = lazy(() => import("@/pages/measure-map-tool"));
const FAQPage = lazy(() => import("@/pages/faq"));
const BookCall = lazy(() => import("@/pages/book-call"));
const AcceptInvitePage = lazy(() => import("@/pages/accept-invite"));
const CrmSettings = lazy(() => import("@/pages/crm-settings"));
const CrmAutomations = lazy(() => import("@/pages/crm-automations"));
const CrmAnalytics = lazy(() => import("@/pages/crm-analytics"));
const AutomationBuilder = lazy(() => import("@/pages/automations"));
const BlockedIpsPage = lazy(() => import("@/pages/blocked-ips"));
const PhotosPage = lazy(() => import("@/pages/photos"));
const TutorialsPage = lazy(() => import("@/pages/tutorials"));
const WhiteLabelVideosPage = lazy(() => import("@/pages/white-label-videos"));
const AbSeoPlan = lazy(() => import("@/pages/ab-seo-plan"));
const LeadCapture = lazy(() => import("@/pages/Crm/LeadCapture"));
const TryCalculator = lazy(() => import("@/pages/try-calculator"));
const IconGeneratorPage = lazy(() => import("@/pages/icon-generator"));
const SetupStepByStepPage = lazy(() => import("@/pages/setup-step-by-step"));

// Blog pages
const BlogPostsPage = lazy(() => import("@/pages/blog-posts"));
const BlogPostEditorPage = lazy(() => import("@/pages/blog-post-editor"));

// Directory pages
const DirectoryHome = lazy(() => import("@/pages/directory/directory-home"));
const DirectoryCategoryPage = lazy(() => import("@/pages/directory/category-page"));
const DirectoryCityCategoryPage = lazy(() => import("@/pages/directory/city-category-page"));
const DirectoryCompanyPage = lazy(() => import("@/pages/directory/company-page"));
const DirectorySetup = lazy(() => import("@/pages/directory/directory-setup"));
const DirectoryDashboard = lazy(() => import("@/pages/directory/directory-dashboard"));

// Generic loading fallback for lazy-loaded pages
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

// Calculator-specific loading fallback
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

// Suspense wrapper for lazy-loaded StyledCalculator
function LazyStyledCalculator(props: any) {
  return (
    <Suspense fallback={<CalculatorLoader />}>
      <StyledCalculator {...props} />
    </Suspense>
  );
}

// Generic Suspense wrapper for lazy-loaded pages
function LazyPage({ Component, ...props }: { Component: React.LazyExoticComponent<any>; [key: string]: any }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component {...props} />
    </Suspense>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();

  // Debug logging
  console.log('Router render:', { isAuthenticated, isLoading, user: user?.email });


  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/landing" component={Landing} />
        <Route path="/lander" component={Lander} />
        <Route path="/exterior-cleaning" component={LandingExteriorCleaning} />
        <Route path="/split-test" component={LandingSplitTest} />
        <Route path="/dfy-setup" component={LandingDfySetup} />
        <Route path="/brutalist" component={LandingBrutalist} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/features" component={Features} />
        <Route path="/docs" component={DocsPage} />
        <Route path="/docs/:slug" component={DocsPage} />
        <Route path="/setup-step-by-step" component={SetupStepByStepPage} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/signup-success" component={SignupSuccess} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/book-call" component={BookCall} />
        <Route path="/accept-invite" component={AcceptInvitePage} />
        {/* Public routes for embed forms */}
        <Route path="/embed/:embedId" component={EmbedCalculator} />
        <Route path="/custom-form/:embedId" component={LazyStyledCalculator} />
        <Route path="/f/:accountId/:slug" component={CustomFormDisplay} />

        <Route path="/service-selector" component={ServiceSelector} />
        <Route path="/services" component={ServiceSelector} />
        <Route path="/styled-calculator" component={LazyStyledCalculator} />
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
        <Route path="/icon-generator" component={IconGeneratorPage} />
        {/* Public Directory Routes */}
        <Route path="/directory" component={DirectoryHome} />
        <Route path="/quotes/:categorySlug/:citySlug" component={DirectoryCityCategoryPage} />
        <Route path="/quotes/:categorySlug" component={DirectoryCategoryPage} />
        <Route path="/directory/company/:companySlug" component={DirectoryCompanyPage} />
        <Route component={Landing} />
      </Switch>
      </Suspense>
    );
  }

  return (
    <>
      {user && (user as any).isImpersonating && <ImpersonationBanner />}
      {user && (location === "/" || location.startsWith("/dashboard")) && <WelcomeModal />}
      <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/docs" component={DocsPage} />
        <Route path="/docs/:slug" component={DocsPage} />
        <Route path="/setup-step-by-step" component={SetupStepByStepPage} />
        <Route path="/formulas" component={FormulasPage} />
        <Route path="/formula/:id" component={FormulaBuilder} />
        <Route path="/formula-builder/:id" component={FormulaBuilder} />
        <Route path="/formula-builder" component={FormulaBuilder} />
        <Route path="/embed-code" component={EmbedCode} />

        <Route path="/form-settings" component={FormSettings} />
        <Route path="/design" component={DesignDashboard} />
        <Route path="/styled-calculator" component={LazyStyledCalculator} />
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
        <Route path="/business-settings" component={BusinessSettingsPage} />
        <Route path="/estimate-page-settings" component={EstimatePageSettings} />
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

        <Route path="/blog-posts" component={BlogPostsPage} />
        <Route path="/blog-posts/new" component={BlogPostEditorPage} />
        <Route path="/blog-posts/:id/edit" component={BlogPostEditorPage} />

        <Route path="/admin/website-templates" component={AdminWebsiteTemplatesPage} />

        <Route path="/admin/template-tags" component={AdminTemplateTagsPage} />
        <Route path="/dfy-services" component={DfyServicesPage} />
        <Route path="/admin/dfy-services" component={AdminDfyServicesPage} />
        <Route path="/admin/support-videos" component={AdminSupportVideosPage} />
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
        <Route path="/brutalist" component={LandingBrutalist} />

        <Route path="/subscription-test" component={SubscriptionTest} />
        {/* Public routes still accessible when authenticated */}
        <Route path="/embed/:embedId" component={EmbedCalculator} />
        <Route path="/custom-form/:embedId" component={LazyStyledCalculator} />
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
        <Route path="/icon-generator" component={IconGeneratorPage} />
        {/* Directory routes (public pages accessible when authenticated + owner pages) */}
        <Route path="/directory" component={DirectoryHome} />
        <Route path="/quotes/:categorySlug/:citySlug" component={DirectoryCityCategoryPage} />
        <Route path="/quotes/:categorySlug" component={DirectoryCategoryPage} />
        <Route path="/directory/company/:companySlug" component={DirectoryCompanyPage} />
        <Route path="/directory-setup" component={DirectorySetup} />
        <Route path="/directory-dashboard" component={DirectoryDashboard} />
        <Route component={NotFound} />
      </Switch>
      </Suspense>
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

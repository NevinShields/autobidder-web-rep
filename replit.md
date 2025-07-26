# PriceBuilder Pro

## Overview

PriceBuilder Pro is a modern pricing calculator platform that allows users to create, customize, and embed interactive pricing calculators. The application provides a comprehensive solution for businesses to capture leads through dynamic pricing tools with customizable styling and formula logic.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates

### January 26, 2025 - Email Management System Implementation Completed
- ✓ **COMPREHENSIVE EMAIL MANAGEMENT SYSTEM** - Built complete email management interface for business email configuration and custom templates
- ✓ Added emailSettings and emailTemplates database tables with proper user relationships and storage methods
- ✓ Created comprehensive email settings API endpoints for CRUD operations on settings and templates
- ✓ Built professional email settings page with tabbed interface for settings and template management
- ✓ Added email configuration section for business email, reply-to, from name, and email signature
- ✓ Implemented notification preferences with toggles for new leads, estimates, appointments, system updates, and weekly reports
- ✓ Created email template system with HTML/text content, dynamic variables, and trigger type configuration
- ✓ Added template management with create, edit, delete, and status controls (active/inactive)
- ✓ Integrated email settings navigation in app header under Settings dropdown menu
- ✓ Enhanced email template editor with dynamic variable support ({{customerName}}, {{totalPrice}}, etc.)
- ✓ Applied consistent styling and error handling throughout email management interface
- ✓ Users can now fully customize their email communications and automate customer notifications

### January 26, 2025 - Super Admin Account Type Implementation Completed
- ✓ **SUPER ADMIN SYSTEM** - Implemented restricted admin panel access for admin@autobidder.org and shielnev11@gmail.com only
- ✓ Added super_admin user type to database schema with automatic detection during signup
- ✓ Created requireSuperAdmin middleware for protecting admin API endpoints
- ✓ Enhanced useAuth hook with isSuperAdmin detection based on email addresses
- ✓ Updated admin dashboard with authentication protection - redirects non-super admins to home
- ✓ Modified app header to conditionally show admin dashboard link only for super admin users
- ✓ Protected all admin routes: /api/admin/stats, /api/admin/users, /api/admin/leads, /api/admin/websites, /api/admin/users/:userId, /api/admin/impersonate/:userId
- ✓ Added smart user type assignment during email signup - super admin emails automatically get super_admin type
- ✓ Updated database schema with businessEmail field and leads table with address/notes fields
- ✓ Admin panel now secure with comprehensive access control and user management capabilities
- ✓ Only specified super admin email addresses can access admin dashboard and perform admin operations

### January 26, 2025 - Email Notification System for New Leads Implementation Completed
- ✓ **COMPREHENSIVE EMAIL NOTIFICATION SYSTEM** - Account owners now receive professional email alerts for all new leads
- ✓ Added sendNewLeadNotification function with detailed single-service lead information and pricing
- ✓ Added sendNewMultiServiceLeadNotification function for complex multi-service inquiries with service breakdown
- ✓ Enhanced lead creation endpoints (/api/leads and /api/multi-service-leads) with email notification integration
- ✓ Implemented smart owner email detection using current authenticated user or business settings
- ✓ Created professional email templates with customer information, pricing details, and project variables
- ✓ Added direct action buttons in emails for viewing leads page and replying to customers
- ✓ Integrated conversion optimization tips and urgency messaging in notification emails
- ✓ Applied different visual themes for single vs multi-service leads (green vs purple branding)
- ✓ Enhanced error handling to prevent lead creation failures if email sending fails
- ✓ Added comprehensive lead tracking with submission timestamps and formatted pricing display
- ✓ Account owners receive immediate notifications with complete lead context for faster response times

### January 26, 2025 - Critical Signup Flow Fix: 14-Day Trial Now Works Properly
- ✓ **FIXED CRITICAL SIGNUP ISSUE** - New users now properly get 14-day free trial without payment processing errors
- ✓ Removed Stripe payment requirement from initial signup flow, users start trial immediately after account creation
- ✓ Updated signup-flow.tsx to skip payment step and redirect directly to dashboard after trial account creation
- ✓ Modified /api/signup endpoint to create trial users with 'trialing' status and proper trial dates (14 days)
- ✓ Enhanced trial success page with clear trial benefits and timeline information
- ✓ Fixed signup flow step progression to show trial welcome instead of plan selection
- ✓ Users can now sign up and immediately access full platform features during 14-day trial period
- ✓ Trial users can upgrade to paid plans later through subscription management in profile page

### January 26, 2025 - Subscription Management System Implementation Completed
- ✓ **ADDED COMPREHENSIVE SUBSCRIPTION MANAGEMENT** - Created complete subscription plan update system in profile page
- ✓ Added SubscriptionManagement component with current plan display, upgrade options, and billing period selection
- ✓ Implemented /api/update-subscription endpoint with prorated pricing for plan upgrades/downgrades  
- ✓ Enhanced user profile interface to include subscription-related fields (plan, billing period, trial status, Stripe IDs)
- ✓ Added subscription plan cards with feature lists, pricing display, and billing period toggle (monthly/yearly)
- ✓ Integrated prorated pricing calculations showing users exactly what they'll be charged for upgrades
- ✓ Created billing portal integration allowing existing subscribers to manage payment methods and view invoices
- ✓ Added trial status tracking with days remaining display and upgrade prompts for trial users
- ✓ Enhanced subscription update logic supporting both new subscriptions and existing subscription modifications
- ✓ Applied consistent styling with crown icons, status badges, and professional card layouts throughout
- ✓ Users can now seamlessly upgrade/downgrade plans with real-time prorated billing through Stripe integration

### January 26, 2025 - Design Theme System Expansion Completed
- ✓ **EXPANDED DESIGN THEME SYSTEM** - Added 5 new professional themes for broader design variety
- ✓ Added Dark theme with modern gray/black aesthetics and yellow accent colors
- ✓ Added Retro theme with bold colors, no border radius, and vintage square styling
- ✓ Added Soft theme with gentle pink colors, rounded edges, and minimal shadows
- ✓ Added Corporate theme with clean blue/gray styling for professional businesses
- ✓ Added Luxury theme with dark stone colors and gold accents for premium feel
- ✓ Enhanced layout controls with preset width options (Narrow, Standard, Wide, Full)
- ✓ Added preset border radius controls (None, Small, Medium, Large, Round) with visual buttons
- ✓ Expanded typography controls with font weight options and additional font sizes
- ✓ Improved theme grid layout responsively (1-5 columns based on screen size)
- ✓ Updated theme descriptions to highlight the diverse range (10 total themes)
- ✓ Enhanced design system with quick-select preset buttons for common styling choices
- ✓ Users now have comprehensive design variety from modern to luxury styles

### January 26, 2025 - Professional Estimate System Implementation Completed
- ✓ Built comprehensive estimate management system with professional estimate pages and tracking
- ✓ Added estimates database table with proper relationships to leads and multi-service leads
- ✓ Created professional estimate page with service details, pricing breakdown, and customizable business messaging
- ✓ Implemented estimates management dashboard with status filtering, statistics tracking, and CRUD operations
- ✓ Added estimate creation API routes supporting both single-service and multi-service leads
- ✓ Enhanced leads page with estimate creation buttons for converting leads to formal estimates
- ✓ Integrated navigation menu with estimates link under "Manage" dropdown for easy access
- ✓ Added estimate tracking with unique estimate numbers, validity periods, and status management
- ✓ Created estimate preview functionality with print and PDF download capabilities
- ✓ Implemented automatic estimate number generation and customer information pre-population from leads
- ✓ Added comprehensive pricing calculations including subtotals, tax amounts, discounts, and totals
- ✓ Built estimate status workflow (draft, sent, viewed, accepted, expired) for sales process tracking

### January 25, 2025 - Complete Email-Only Authentication & Support System
- ✓ **REMOVED REPLIT OAUTH DEPENDENCY** - App now runs completely independently with email/password authentication only
- ✓ Eliminated all Replit OAuth components, imports, and login buttons from both frontend and backend
- ✓ Simplified authentication middleware to use email sessions exclusively 
- ✓ Fixed routing issues causing 404 errors at bottom of pages by restructuring wouter Router logic
- ✓ Added comprehensive session middleware with PostgreSQL session storage for email authentication
- ✓ Updated all API endpoints to use email-only authentication (requireAuth middleware)
- ✓ Enhanced signup and login pages with streamlined email/password interface
- ✓ Maintained 14-day free trial functionality for all new email signups with automatic trial tracking
- ✓ Restructured support ticket system to be admin-only with user-facing support contact component
- ✓ Added support contact buttons to dashboard header and comprehensive ticket creation interface
- ✓ Users can now signup and access full platform without any external OAuth dependencies

### January 25, 2025 - Service Selector Checkbox Responsive Fix & Signup Enhancement
- ✓ Fixed service selector checkbox positioning issues with improved responsive spacing
- ✓ Updated checkbox positioning from `top-0 left-0` to `top-2/3 left-2/3` with proper padding
- ✓ Enhanced checkbox styling with consistent sizing across mobile (w-5 h-5) and desktop (w-6 h-6)
- ✓ Applied responsive checkbox fixes to all service selector components (embed-form, upsell-form, enhanced-service-selector)
- ✓ Improved content spacing with additional top padding to prevent overlap with checkboxes
- ✓ Fixed signup page validation errors by redirecting to proper signup-flow page
- ✓ Updated all "Start Free Trial" buttons to use /signup-flow instead of broken /signup route
- ✓ Fixed API endpoint mismatch where landing page redirected to auth instead of form collection
- ✓ Ensured proper user data collection through multi-step signup-flow with validation
- ✓ All signup buttons now properly redirect to working registration flow

### January 25, 2025 - Modern AI-Styled Landing Page with Liquid Glass Effects
- ✓ Transformed landing page with modern AI styling featuring liquid glass effects and glassmorphism design
- ✓ Added animated background blobs with purple, yellow, and pink gradients for dynamic visual appeal
- ✓ Implemented comprehensive glassmorphism elements with backdrop blur effects and transparent borders
- ✓ Enhanced hero section with animated gradient text effects and pulsing animations
- ✓ Updated all sections with dark gradient backgrounds (slate-900, purple-900) for contemporary feel
- ✓ Applied glass morphism cards with white/10 opacity, backdrop blur, and subtle borders throughout
- ✓ Added hover animations with transform effects, color transitions, and shadow enhancements
- ✓ Integrated gradient text elements using bg-clip-text for modern typography effects
- ✓ Enhanced buttons with gradient backgrounds, rounded corners, and scale hover effects
- ✓ Updated footer with consistent AI styling and gradient logo text effects
- ✓ Added CSS keyframe animations for blob movement and glassmorphism utilities

### January 25, 2025 - Admin User Impersonation System Implementation
- ✓ Enhanced admin dashboard with comprehensive user impersonation capabilities
- ✓ Added user account editing functionality allowing admins to modify user profiles, plans, and account status
- ✓ Implemented secure user impersonation system with access tokens and audit logging
- ✓ Created modal dialogs for user editing with field validation and real-time updates
- ✓ Added impersonation warning system with security alerts and user confirmation
- ✓ Integrated admin user management API endpoints: PATCH /api/admin/users/:userId and POST /api/admin/impersonate/:userId
- ✓ Enhanced user table with action buttons for editing and accessing user accounts
- ✓ Added comprehensive error handling and success notifications for admin operations
- ✓ Implemented audit logging for all admin impersonation activities for security tracking
- ✓ Created seamless user account switching allowing admins to manage user accounts without password access

### January 24, 2025 - Booking Feature Toggle Implementation
- ✓ Added enableBooking field to business settings schema with default value of true
- ✓ Enhanced form settings page with booking feature toggle control in Customer Flow section
- ✓ Updated both embed-form and upsell-form to conditionally show booking features based on enableBooking setting
- ✓ Booking calendar, schedule appointment button, and booking confirmation now respect the toggle
- ✓ Businesses can now turn booking functionality on or off through the Form Logic & Settings page
- ✓ Applied proper conditional rendering to all booking-related UI components in both form versions

### January 24, 2025 - Configurable Formula-Level Upsell System Implementation
- ✓ Added upsellItems field to formulas database schema with UpsellItem interface support
- ✓ Enhanced formula builder with comprehensive upsell management section including name, category, percentage, and description controls
- ✓ Added upsell item creation, editing, and deletion functionality with popular item marking
- ✓ Integrated dynamic upsell services generation from selected formulas' upsell configurations
- ✓ Updated upsell form to use formula-specific upsell items instead of hardcoded services
- ✓ Added intelligent upsell flow that skips upsell page if no items are configured
- ✓ Enhanced category-based icon assignment and estimated time calculation for upsells
- ✓ Fixed TypeScript type compatibility issues between string-based upsell IDs and form handlers
- ✓ Added database migration support for new upsell items column with proper default values
- ✓ Added quick navigation links between upsell and classic form versions for easy switching

### January 24, 2025 - Enhanced Dashboard Styling Consistency Project Completed
- ✓ Applied consistent dashboard styling effects to all administrative pages including calendar, business-settings, design-dashboard, form-settings, stats, users, website, and formula-builder
- ✓ Enhanced all stats cards in calendar with gradient backgrounds, colored icons, and hover effects matching main dashboard design
- ✓ Updated calendar grid cards with enhanced styling: shadow effects, gradient headers, and consistent border treatments
- ✓ Applied unified gradient background pattern (slate-50 via blue-50 to indigo-50) across all administrative pages
- ✓ Maintained styling exclusions for customer-facing forms pages and authentication pages as requested
- ✓ Created consistent visual experience across the entire administrative interface
- ✓ Enhanced user experience with professional gradient backgrounds and improved card designs throughout the platform
- ✓ Applied enhanced dashboard styling effects to mobile versions with responsive gradient backgrounds
- ✓ Upgraded stats cards with colored icons, gradient backgrounds, and improved mobile touch interactions
- ✓ Enhanced main content cards and sidebar components with gradient headers and shadow effects
- ✓ Added mobile-specific CSS optimizations for touch feedback, card animations, and visual consistency

### January 24, 2025 - Custom Forms System Implementation
- ✓ Created comprehensive custom forms system for multiple independent forms with separate service selections and design controls
- ✓ Added database schema with customForms and customFormLeads tables for form-specific data management
- ✓ Implemented complete server-side API endpoints for custom forms CRUD operations (/api/custom-forms routes)
- ✓ Enhanced DatabaseStorage class with custom forms methods (getCustomFormById, createCustomForm, updateCustomForm, deleteCustomForm)
- ✓ Built professional custom forms management page with form creation, configuration, and deletion capabilities
- ✓ Added custom forms navigation to Build dropdown menu for easy access
- ✓ Integrated form-specific service selection with multi-checkbox interface for flexible service combinations
- ✓ Applied default styling and form settings to new custom forms for immediate usability
- ✓ Added comprehensive stats display showing total forms, active forms, and lead tracking
- ✓ Implemented copy embed URL functionality for easy form distribution and testing
- ✓ Created delete confirmation dialogs with form name display for safe form management
- ✓ Enhanced form cards with service count badges, creation dates, and quick action buttons

### January 24, 2025 - Production-Ready Signup System & Individual Service Previews
- ✓ Enhanced existing 4-step signup flow to include payment processing with comprehensive plan selection
- ✓ Created dedicated payment integration with Stripe checkout sessions for three subscription tiers ($49, $97, $297/month)
- ✓ Built comprehensive Stripe webhook handler for payment confirmations and subscription management
- ✓ Added SendGrid email automation for welcome emails and subscription confirmations
- ✓ Created professional signup success page with automatic onboarding redirection
- ✓ Fixed TypeScript compilation issues and integrated all payment routes properly
- ✓ Updated database schema and storage methods to support subscription management
- ✓ Implemented individual service preview modal for formula builder instead of multi-service view
- ✓ Added single-service calculator preview with real-time pricing calculations and variable display
- ✓ Enhanced formula preview with styled pricing cards and variable summary for better UX
- ✓ Updated formulas list page to use single-service preview modal instead of opening full embed calculator
- ✓ Applied consistent preview functionality across both formula builder and formulas list pages
- ✓ Fixed copy link functionality to redirect to service selector with preselected formula instead of simple form
- ✓ Enhanced service selector to handle URL parameters and automatically preselect specific formulas from embed links

### January 24, 2025 - Mobile Dashboard Optimization & Error Handling Enhancements
- ✓ Completely optimized main dashboard for mobile devices with responsive sidebar, header, and content areas
- ✓ Added slide-out mobile navigation menu with overlay and touch-friendly interactions
- ✓ Enhanced mobile header with condensed navigation and essential quick actions
- ✓ Optimized stats cards with responsive typography, spacing, and icon sizing for mobile
- ✓ Improved calculator performance list with mobile-friendly layout and truncated content
- ✓ Enhanced right sidebar components with compact mobile designs and responsive text
- ✓ Added mobile footer action bar with essential quick actions for better mobile UX
- ✓ Fixed variable type change error handling with comprehensive logging and user-friendly alerts
- ✓ Enhanced error handling in formula builder with detailed debugging information
- ✓ Fixed all TypeScript compilation errors and added missing styling properties for production stability

### January 24, 2025 - Conditional Logic System Implementation
- ✓ Implemented comprehensive conditional logic system for form variables
- ✓ Added conditional logic schema with support for multiple condition types (equals, not_equals, greater_than, less_than, contains, is_empty, is_not_empty)
- ✓ Created conditional logic evaluation utilities with proper dependency checking
- ✓ Enhanced variable card UI with conditional logic toggle and configuration controls
- ✓ Added dependency variable selection with dropdown of available variables
- ✓ Implemented condition selection based on dependent variable type
- ✓ Added expected value input with smart controls (dropdown for select variables, checkbox states, text/number inputs)
- ✓ Enhanced EnhancedVariableInput component to evaluate and hide/show variables based on conditional logic
- ✓ Applied conditional logic evaluation in embed form for both shared and service-specific variables
- ✓ Variables now automatically hide/show based on answers to previous questions

### January 24, 2025 - Google Maps Measure Tool Integration
- ✓ Added comprehensive MeasureMap component using Google Maps API for accurate property measurements
- ✓ Integrated measure map controls into formula builder with toggle for enabling measurement tool
- ✓ Added measurement type selection: Area (for surfaces, roofs) vs Distance (for gutters, fencing)
- ✓ Added unit selection: Square feet/meters for area, Feet/meters for distance measurements
- ✓ Implemented automatic variable population when measurements are completed
- ✓ Enhanced customer experience with interactive property measurement before pricing
- ✓ Added database schema support for measure map configuration per service formula
- ✓ Applied measure map to embed form with intelligent variable detection and auto-population
- ✓ Added Google Places Autocomplete for smart address search with real-time suggestions
- ✓ Enhanced with multiple measurement capability - users can measure multiple areas/distances
- ✓ Individual measurement tracking with ability to remove specific measurements
- ✓ Automatic total calculation combining all measurements for comprehensive property pricing
- ✓ Fixed map controls positioning to prevent overlay obstruction of map content
- ✓ Enhanced form display controls with optional toggles for progress guide, title, and subtitle elements

### January 24, 2025 - Pricing Card Design Control Integration
- ✓ Enhanced pricing card component to use dedicated pricing card styling properties
- ✓ Integrated all pricing card design controls: border radius, width, color, background, shadow, text color, and accent color
- ✓ Applied comprehensive styling system to pricing display cards for full customization
- ✓ Updated ServiceCardDisplay component to use pricingCard styling properties instead of generic container styling
- ✓ All pricing card elements now fully editable through design dashboard controls

### January 23, 2025 - Website Builder with Duda Integration & User Management
- ✓ Added comprehensive website builder page using Duda API platform
- ✓ Integrated website creation with template selection from real Duda template library
- ✓ Added automatic Duda user account creation with full site permissions
- ✓ Implemented user information collection (email, first name, last name) for Duda accounts
- ✓ Removed SSO functionality per user request (feature not accessible)
- ✓ Enhanced database schema to store Duda account information
- ✓ Set up secure Duda API credential handling with environment variable configuration
- ✓ Updated navigation to include "Website" option under the "Build" dropdown menu
- ✓ Created complete user workflow: template selection → user creation → permission granting → direct editor access
- ✓ Added website management dashboard with creation, editing, and deletion capabilities
- ✓ Configured full access for all users (plan restrictions to be added later)
- ✓ Implemented real-time template loading from Duda API with thumbnails and feature badges
- ✓ Enhanced website creation process with comprehensive error handling and user feedback

### January 23, 2025 - Form Input Height & Font Size Controls + Guide Videos
- ✓ Added input height control with slider (30px to 80px range) in design dashboard
- ✓ Added input font size control with dropdown (xs, sm, base, lg, xl options) in design dashboard  
- ✓ Enhanced form input customization with precise height and typography control
- ✓ Applied input styling controls to all form inputs via EnhancedVariableInput component
- ✓ Implemented guide video feature for services displayed before configuration questions
- ✓ Added professional video container with embedded YouTube player support
- ✓ Videos appear when service selected and hide when pricing is calculated
- ✓ Updated database with sample guide video URLs for testing functionality

### January 23, 2025 - Authentication Pages & Pricing Experience
- ✓ Created professional login page with Replit Auth integration
- ✓ Built comprehensive signup page with feature highlights and benefits
- ✓ Designed marketing-focused landing page with testimonials and call-to-action sections
- ✓ Added professional pricing page with three tiers: $49, $97, and $297 monthly plans
- ✓ Integrated yearly pricing toggle with 17-20% discounts for annual billing
- ✓ Added feature comparison matrix with detailed plan benefits and limitations
- ✓ Enhanced pricing display with savings calculations and billing period indicators
- ✓ Added authentication routing for /login, /signup, /landing, and /pricing paths
- ✓ Enhanced user onboarding experience with feature showcases and social proof
- ✓ Integrated existing branding and visual design system across all marketing pages

### January 23, 2025 - Service Selector Card Sizing & Content Constraints
- ✓ Added comprehensive service selector card sizing controls with 5 size options (Small to 2X Large)
- ✓ Added Cards Per Row control with Auto-responsive and fixed options (1-4 cards per row)
- ✓ Enhanced responsive grid system that automatically adjusts based on card size and screen width
- ✓ Applied sizing controls to both standalone service selector and embed form pages
- ✓ Updated all design themes with appropriate card size defaults for consistent styling
- ✓ Redesigned service selector layout to reduce crowding and improve visual hierarchy
- ✓ Moved selection tick to top-left corner for cleaner positioning
- ✓ Placed service names above icons for better readability and organization
- ✓ Added proper spacing with padding and margins for less cramped appearance
- ✓ Reduced icon sizes slightly and adjusted text positioning for balanced layout
- ✓ Applied consistent spacing improvements across mobile and desktop layouts

### January 23, 2025 - Complete Cleaning Services Formula Library
- ✓ Created comprehensive pricing formulas for 8 professional cleaning services
- ✓ House Washing: Size, stories, siding material, difficulty, frequency, and additional services
- ✓ Roof Cleaning: Size, material, slope, condition, accessibility, cleaning method, and protection
- ✓ Gutter Cleaning: Linear feet, height, type, condition, downspouts, extras, and frequency
- ✓ Window Cleaning: Count, height, types, condition, access difficulty, extras, and frequency  
- ✓ Patio Washing: Size, material, condition, stains, accessibility, extras, and frequency
- ✓ Driveway Cleaning: Size, material, condition, stains, slope, extras, and frequency
- ✓ Pool Deck Cleaning: Size, material, condition, pool type, safety, extras, and frequency
- ✓ Sidewalk Cleaning: Length, width, material, condition, obstacles, extras, and frequency
- ✓ All formulas feature extensive multiple choice questions for accurate pricing
- ✓ Each service includes variable pricing based on complexity, materials, and service frequency
- ✓ Comprehensive additional service options for upselling opportunities

### January 23, 2025 - Clean Service Selector Design (Mobile & Desktop)
- ✓ Applied clean design to both mobile and desktop with icons taking 80% of card space
- ✓ Enhanced typography with font-black weight and large text (6xl mobile, 5xl-6xl desktop)
- ✓ Moved selection indicator to top-left corner on all screen sizes for consistent layout
- ✓ Removed subtitle descriptions and options count for minimal, focused design across all devices
- ✓ Applied aspect-square containers with max-width 80% for consistent large icon display
- ✓ Updated both embed-form and service-selector pages with unified clean experience
- ✓ Created cohesive design language between mobile and desktop for better user experience

### January 23, 2025 - Multiple Choice Design System Integration
- ✓ Enhanced live preview with realistic multiple choice components featuring icon/image display
- ✓ Updated multiple choice inputs to use centered card-based design matching preview
- ✓ Added layout control option: Grid (side by side) vs Single Row for multiple choice variables
- ✓ Applied comprehensive styling system to all multiple choice components across service-selector and embed-form pages
- ✓ Integrated new styling options: card border radius, shadows, colors, hover effects, and layout preferences
- ✓ Created icon placeholders using first letter when no images provided for multiple choice options
- ✓ Updated database schema to include multiChoiceLayout field for layout preference storage

### January 23, 2025 - User Management System & Simplified Navigation
- ✓ Implemented complete user management system with owner and employee user types
- ✓ Added role-based permissions controlling access to formulas, leads, calendar, design, and statistics
- ✓ Created team member invitation system with customizable permission settings
- ✓ Built comprehensive user management interface with invite, edit, and delete functionality
- ✓ Simplified top navigation with organized dropdown menus (Build, Customize, Manage, Settings)
- ✓ Removed branding text for cleaner header design with icon-only logo
- ✓ Enhanced mobile navigation with categorized menu sections
- ✓ Updated database schema to support user relationships and permission management
- ✓ Added Team navigation link for user management access
- ✓ Redesigned calendar page with full monthly calendar view, clickable days, event listings, and recurring schedule functionality
- ✓ Fixed calendar API issues and TypeScript errors for proper data fetching and display

### January 23, 2025 - Design Themes System
- ✓ Added themes tab to design dashboard with 5 professionally designed presets
- ✓ Created Modern theme (Inter font, blue colors, large shadows, 16px border radius)
- ✓ Created Professional theme (Roboto font, gray colors, medium shadows, 8px border radius)
- ✓ Created Vibrant theme (Montserrat font, purple/pink colors, extra large shadows, 20px border radius)
- ✓ Created Minimal theme (Open Sans font, green colors, small shadows, 4px border radius)
- ✓ Created Elegant theme (Lato font, amber colors, large shadows, 12px border radius)
- ✓ Each theme affects fonts, colors, shadows, and border radius across all form components
- ✓ Added one-click theme application with instant preview updates
- ✓ Maintained ability to further customize individual settings after applying themes

### January 23, 2025 - Mobile-Friendly Optimized Menu
- ✓ Created modern slide-out mobile menu with smooth animations and backdrop overlay
- ✓ Enhanced mobile menu with larger touch targets and improved visual hierarchy
- ✓ Added active route highlighting with blue accent colors and border indicators
- ✓ Implemented grouped navigation sections with clear category labels and spacing
- ✓ Added quick action button for creating new formulas directly from mobile menu
- ✓ Enhanced menu items with icon backgrounds and chevron indicators for better UX
- ✓ Added user profile section at bottom of mobile menu for account access
- ✓ Implemented automatic menu closure on route changes and body scroll prevention
- ✓ Optimized button sizes and padding for better mobile touch interaction
- ✓ Optimized leads page for mobile with compact list design taking up less space per row

### January 22, 2025 - AI Integration Switch from OpenAI to Gemini
- ✓ Fixed application startup crash caused by OpenAI quota limitations
- ✓ Migrated AI formula generation from OpenAI to Google Gemini API
- ✓ Implemented lazy-loaded Gemini client with proper error handling
- ✓ Updated API integration to use gemini-2.5-flash model with JSON schema validation
- ✓ Application now uses Gemini's free tier with generous usage limits
- ✓ All existing AI formula generation functionality preserved with improved reliability

### January 22, 2025 - Complete Formula Library & Service Selector Styling
- ✓ Added comprehensive formula library with 12+ contractor services covering all major trades
- ✓ Created detailed pricing calculators for Kitchen Remodel, Bathroom Renovation, Exterior Painting, Deck Construction, Landscaping, Roofing, HVAC, Flooring, Electrical, and Plumbing services
- ✓ Fixed service selector styling implementation across all components (enhanced-service-selector and embed-form)
- ✓ Applied complete design control integration with width, border radius, shadow, colors, hover effects, typography, icon sizes, and spacing
- ✓ Ensured consistent styling between standalone service selector and embedded form versions
- ✓ All service selector design controls now functional and properly applied to both service-selector and embed-form pages

### January 22, 2025 - Lead Management & Service Selector Design Controls
- ✓ Created comprehensive leads management page with filtering, search, and sorting capabilities
- ✓ Added clickable lead details modal with quick action buttons for calling, texting, emailing
- ✓ Integrated Google Maps functionality with embedded maps and direct links to Maps/Street View
- ✓ Added service selector styling controls to design dashboard with comprehensive customization options
- ✓ Enhanced design dashboard with service selector width, border radius, shadow, colors, hover effects, font sizes, and icon size controls
- ✓ Updated schema to include all service selector styling options for complete form appearance control

### January 22, 2025 - Enhanced Dashboard Design and Branding
- ✓ Integrated Autobidder logo into dashboard header with professional branding
- ✓ Enhanced header design with gradient backgrounds, improved navigation styling, and mobile responsiveness
- ✓ Updated dashboard with hero section, gradient backgrounds, and modern card designs
- ✓ Redesigned stats cards with color-coded icons and improved visual hierarchy
- ✓ Enhanced all dashboard cards with consistent shadow effects and gradient headers
- ✓ Improved overall user experience with polished, professional appearance

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple

### Project Structure
The application follows a monorepo structure with clear separation:
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types
- `components.json` - shadcn/ui configuration

## Key Components

### Database Schema
Three main entities managed through Drizzle ORM:
- **Formulas**: Stores calculator configurations with variables, formulas, and styling options
- **Leads**: Captures user submissions with calculated prices and contact information
- **Multi-Service Leads**: Captures customer inquiries for multiple services with combined pricing
- **Business Settings**: Centralized design and form logic configuration

### API Layer
RESTful API endpoints for:
- Formula CRUD operations (`/api/formulas`)
- Lead capture and retrieval (`/api/leads`)
- Multi-service lead management (`/api/multi-service-leads`)
- Embed calculator access (`/api/embed/:embedId`)
- Statistics and analytics (`/api/stats`)
- Business settings management (`/api/business-settings`)

### Frontend Components
- **Dashboard**: Overview of formulas, leads, and activity with embed form integration
- **Formula Builder**: Focused editor for creating pricing logic and variables only
- **Design Dashboard**: Centralized design customization hub for all forms and calculators
- **Form Settings**: Complete form logic control including pricing rules, customer flow, and tax settings
- **Embed Form**: Multi-service customer-facing form for website integration
- **Calculator Preview**: Real-time preview of calculator functionality
- **Service Selector**: Multi-service pricing interface for customers

### Variable System
Comprehensive variable types supporting:
- **Number inputs** with units and validation
- **Text inputs** for custom user data
- **Checkboxes** for boolean selections
- **Dropdown** (single choice) with numeric values for formulas
- **Multiple Choice** with image support and multi-selection capability
- **Select** (legacy) for backward compatibility
- **Editable Variable IDs** for custom formula references
- **Numeric Values** attached to each option for precise formula calculations

### Advanced Styling System
Comprehensive design customization including:
- **Container Settings**: Width, height, border radius, shadow, border width/color, background color
- **Typography Controls**: Font family with Google Fonts integration (Inter, Roboto, Open Sans, Lato, Montserrat), font size, font weight, text color
- **Button Styling**: Primary color, border radius, padding, font weight, shadow effects, style variants (rounded/square/pill)
- **Input Field Design**: Background color, border radius, border width/color, focus color, padding sizes
- **Live Preview**: Real-time preview of design changes with proper font rendering
- **Centralized Control**: All design managed through dedicated Design Dashboard

### Form Logic System
Complete control over form behavior and pricing rules:
- **Customer Flow**: Contact-first toggle, lead capture configuration
- **Bundle Discounts**: Percentage-based discounts for multiple service selections
- **Sales Tax**: Configurable tax rates and labels for compliance
- **Pricing Rules**: Complex multi-service pricing with discount calculations
- **Business Information**: Contact details and descriptions for customer communication

## Data Flow

### Single Service Flow
1. **Formula Creation**: Users build calculators through the formula builder interface
2. **Formula Storage**: Configurations saved to PostgreSQL with unique embed IDs
3. **Calculator Rendering**: Formulas dynamically render interactive calculators
4. **Lead Capture**: User inputs captured and stored with calculated results
5. **Embed Distribution**: Calculators accessible via unique embed URLs

### Multi-Service Flow
1. **Service Selection**: Customers browse available services (formulas) and select multiple options
2. **Variable Configuration**: Each selected service presents its own variable inputs for customization
3. **Individual Calculations**: Each service calculates its own pricing based on user inputs
4. **Combined Pricing**: Total pricing aggregates all selected services
5. **Lead Generation**: Multi-service inquiries captured with detailed service breakdown and combined totals

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL) via `@neondatabase/serverless`
- **ORM**: Drizzle ORM for type-safe database operations
- **UI Components**: Radix UI primitives via shadcn/ui
- **Validation**: Zod for runtime type validation
- **Utilities**: nanoid for unique ID generation, date-fns for date handling

### Development Tools
- **Type Checking**: TypeScript with strict configuration
- **Styling**: TailwindCSS with PostCSS
- **Build**: Vite with React plugin and esbuild for server bundling

## Deployment Strategy

### Production Build Process
- Frontend: Vite builds React app to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Static assets served directly by Express in production

### Environment Configuration
- Development: Vite dev server with Express API
- Production: Single Express server serving both API and static files
- Database: PostgreSQL connection via `DATABASE_URL` environment variable

### Key Features
- **Hot Module Replacement**: Vite HMR for fast development
- **Type Safety**: End-to-end TypeScript with shared schemas
- **Responsive Design**: Mobile-first TailwindCSS implementation
- **Error Handling**: Comprehensive error boundaries and API error handling
- **Accessibility**: Radix UI primitives ensure WCAG compliance
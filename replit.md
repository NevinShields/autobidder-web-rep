# Autobidder

## Overview
Autobidder is a modern platform designed for businesses to create, customize, and embed interactive pricing calculators. It enables dynamic lead capture through highly customizable tools featuring unique styling and formula logic. The vision is to provide a comprehensive solution for generating accurate pricing, managing leads, and automating customer communication, ultimately streamlining sales processes and enhancing user experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: TailwindCSS with shadcn/ui component library, supporting advanced design controls like custom themes (Modern, Professional, Vibrant, Minimal, Elegant, Dark, Retro, Soft, Corporate, Luxury), responsive layouts, and granular styling for pricing cards, input fields, and multiple-choice components.
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and production builds
- **Key Features**: Live preview of design changes, mobile optimization across all dashboards and forms, comprehensive accessibility via Radix UI primitives.

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: PostgreSQL-backed sessions for secure user authentication (email/password only, no OAuth dependencies).

## Recent Changes

### COMPLETE Design System Architecture Rebuild (August 2025)
- **COMPLETED: Full Design System Migration**: Completely rebuilt design architecture with dedicated `designSettings` database table completely separate from business logic
- **Eliminated Old System**: Removed all `componentStyles` and `deviceView` fields from business settings schema to prevent confusion
- **New Design Dashboard**: Rebuilt design-dashboard-new.tsx to exclusively use new design settings API with proper data mapping  
- **Updated Calculator Components**: Migrated styled-calculator.tsx to new design architecture, removing all business settings dependencies
- **Clean API Separation**: Updated embed route to use design settings instead of business settings for proper data separation
- **Removed Legacy Routes**: Eliminated old component styles route that was saving to business settings
- **Database Cleanup**: Successfully removed componentStyles and deviceView columns from business_settings table
- **Icon & Color Picker Fix**: Complete architectural separation resolves icon positioning and color picker save problems
- **Enhanced Data Integrity**: Design changes now persist reliably in dedicated table without interfering with business configuration
- **Template Picker Integration**: Updated template application to maintain complete separation between formulas and design - formulas store no styling data, design settings provide all visual styling at render time

### Major Design Page Reorganization with Component-Based Visual Editor (August 2025)
- **NEW: Complete Visual Design System**: Built comprehensive new design page with component-based visual editing system replacing old save-and-reload workflow
- **Real-Time Preview**: Implemented instant visual feedback with live preview panel showing changes immediately as users edit
- **Component-Based Architecture**: All form elements (service selectors, inputs, dropdowns, multiple-choice, sliders, question cards, pricing cards) organized into expandable containers
- **Advanced Visual Controls**: Added drag-and-drop sizing controls, corner radius adjustment, advanced shadow picker, and comprehensive styling options
- **Unified Themes Tab**: Consolidated colors and typography settings with preset themes and live preview functionality  
- **Mobile/Desktop Toggle**: Added responsive preview with device view switching for better design testing
- **Enhanced Theme Picker**: Updated theme presets with better visual previews and improved user experience
- **Fixed Component Initialization**: Resolved errors where component styles caused crashes by ensuring proper default values

### Claude AI Integration and Multi-Provider Support (August 2025)
- **NEW: Claude AI Integration**: Added Anthropic's Claude 3.5 Sonnet as a third AI provider option for formula generation and editing
- **Multi-Provider Architecture**: Enhanced system to support OpenAI, Gemini, and Claude with intelligent fallback chains
- **Provider Selection API**: Added new `/api/ai-providers` endpoint to check availability of each AI provider based on configured API keys
- **Enhanced Formula Generation**: Updated `/api/formulas/generate` to accept provider parameter allowing users to choose their preferred AI
- **Smart Fallback System**: Implemented intelligent fallback chains - OpenAI → Claude → Gemini for optimal reliability
- **Provider-Specific Routing**: Added logic to try requested provider first, then fallback to alternatives if that provider fails
- **Comprehensive Error Handling**: Enhanced error logging and fallback mechanisms across all three AI providers

### Enhanced AI Formula Generation for Interactive Input Types (August 2025)
- **Updated AI Prompts**: Modified all three AI providers (OpenAI, Gemini, Claude) to prioritize interactive input types
- **Improved User Engagement**: AI now defaults to dropdowns, multiple choice, and checkboxes over basic text/number inputs
- **Strategic Input Selection**: AI uses dropdowns for material types/quality levels, multiple-choice for style preferences/features, checkboxes for add-ons/upgrades
- **Reduced Manual Input**: Number/text inputs now reserved only for measurements and essential data entry
- **Enhanced Calculator Experience**: More engaging, interactive calculators that guide users through selections rather than requiring manual typing
- **Multiple-Choice Prioritization**: Enhanced AI prompts to strongly favor multiple-choice inputs with images over dropdowns for material/style selections

### Critical Authentication Bug Fix (August 2025)
- **RESOLVED MAJOR LOGIN ISSUE**: Fixed critical authentication bug where users couldn't log in with correct credentials due to password hashes not being stored during signup
- **Root Cause**: The `createUser` method in `server/storage.ts` was missing the `passwordHash` field in database insertions, causing all new users to be created without password hashes
- **Complete Fix**: Added all missing authentication fields (`passwordHash`, `authProvider`, `emailVerified`, etc.) to both `createUser` and `createEmployee` methods in storage layer
- **Testing Verified**: Both signup and login flows now work correctly with proper password hash storage and validation
- **Impact**: All users created after this fix can now successfully authenticate; existing users created before this fix may need password resets

### Complete Migration to Resend Email System (January 2025)
- **Removed SendGrid Dependencies**: Fully migrated from SendGrid to Resend as primary email provider
- **Unified Email Templates**: All emails now use consistent Autobidder branding and professional design templates
- **Standardized "From" Names**: All system emails now display "Autobidder <noreply@autobidder.org>" for brand consistency
- **Cleaned Codebase**: Removed all SendGrid references, imports, and backup files
- **Email Template Reorganization**: Renamed sendgrid.ts to email-templates.ts to better reflect current architecture
- **Booking Notification System**: Implemented professional booking notification emails for business owners using Resend

### Enhanced Bid Email with Direct Booking Link (August 2025)
- **Updated "Send to Customer" Email Template**: Enhanced the bid response notification email with a prominent "Accept Quote & Book Service" button
- **Improved User Experience**: Changed button styling to green gradient with clear call-to-action text emphasizing immediate booking capability
- **Added Booking Instructions**: Included specific messaging about approving quotes and scheduling appointments directly from the email
- **Fixed Duplicate Prevention**: Resolved issue where legitimate email resends were being blocked by improving duplicate detection to use content-based hashing instead of subject-only matching
- **Comprehensive Email Testing**: Verified end-to-end email delivery through Resend API with successful quote delivery to prospects

### Fixed "Send to Customer" Email Functionality (August 2025)
- **Root Cause Resolution**: Fixed ES module import errors (`require()` to `await import()`) that were causing 500 server errors
- **Email Format Validation**: Corrected email "from" field formatting to meet Resend API requirements
- **Authentication Consistency**: Updated all scheduling/availability API routes to use consistent authentication patterns
- **Calendar Error Resolution**: Fixed array validation errors preventing calendar page from loading properly
- **Duplicate Prevention Enhancement**: Improved duplicate email detection to allow legitimate resends while preventing spam
- **Complete Email System Integration**: Verified "Send to Customer" button now successfully sends bid approval emails to prospects via Resend API with proper quote response links and booking functionality

## Recent Changes

### Website Setup Email System (January 2025)
- **Added Website Setup Email**: Created `sendWebsiteSetupEmail` function in sendgrid.ts that sends a beautifully designed email with the Duda SSO link when a website is created
- **Integrated with Website Creation**: Modified the `/api/websites` POST endpoint to automatically generate an SSO link via Duda API and email it to the user
- **Email Features**: Professional Autobidder-branded email template with setup instructions, what's next steps, and direct link to website editor
- **Error Handling**: Email sending failures don't prevent website creation from completing successfully

### Password Reset Link Fix (January 2025)
- **Fixed Production URL Generation**: Updated password reset email links to use correct REPLIT_DEV_DOMAIN in live environment
- **Environment-Aware Link Generation**: Added robust URL generation that works in development (localhost), Replit deployment (https), and custom domains
- **Testing Verified**: Confirmed both development and production environments generate proper working links

### Core System Features & Design Patterns
- **Database Schema**: Manages Formulas (calculator configurations), Leads (user submissions), Multi-Service Leads, Business Settings, Estimates, BidRequests, Custom Forms, Email Settings, and Template Tags.
- **API Layer**: RESTful endpoints for CRUD operations across all entities, supporting lead capture, formula management, subscription updates, and administrative functions.
- **Formula Builder**: Allows creation of complex pricing logic with various variable types (number, text, checkbox, dropdown, multiple choice) and supports conditional logic to dynamically show/hide variables.
- **Lead Management**: Comprehensive system for tracking, filtering, and managing leads, including integration with Google Maps for location-based services.
- **Email System**: Robust email notification system (migrated from SendGrid to Resend with fallback) for new leads, estimates, and system updates, featuring customizable templates with dynamic content.
- **Subscription Management**: Integrates with Stripe for secure plan upgrades/downgrades, prorated billing, payment method updates, and invoice history. Supports a 14-day free trial.
- **User Management**: Role-based access control (owner, employee, super admin) with user invitation, editing, and impersonation capabilities.
- **Booking System**: Optional customer-facing booking calendar and appointment scheduling integrated into forms.
- **DFY Services Catalog**: In-app marketplace for purchasing professional services with Stripe payment integration and admin management.
- **Website Builder**: Integration with Duda API for creating and managing websites with template selection.
- **AI Integration**: Uses Google Gemini API for generating pricing formulas, ensuring reliability and cost-effectiveness.
- **Measure Map Tool**: Google Maps integration for accurate property measurements (area/distance) directly within the forms, automatically populating variables.
- **Zapier Integration**: Full Zapier platform integration enabling users to connect Autobidder to 5,000+ apps for workflow automation. Supports both polling and instant triggers (REST hooks), API key authentication, lead triggers (new leads, updated leads), calculator triggers, and actions for creating/updating leads. Includes comprehensive API endpoints for webhooks, authentication testing, and data synchronization. Complete Zapier CLI app structure provided for App Store deployment.

## External Dependencies

- **Database**: Neon Database (PostgreSQL) via `@neondatabase/serverless`
- **ORM**: Drizzle ORM
- **UI Components**: Radix UI primitives via shadcn/ui
- **Validation**: Zod
- **Unique ID Generation**: nanoid
- **Date Handling**: date-fns
- **Email Service**: Resend (primary), Gmail (fallback)
- **Payment Processing**: Stripe
- **AI Integration**: Google Gemini API
- **Mapping/Location**: Google Maps API, Google Places Autocomplete
- **Website Builder Integration**: Duda API
- **Cloud Hosting**: Replit (for development environment)
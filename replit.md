# Autobidder

## Overview
Autobidder is a platform for businesses to create, customize, and embed interactive pricing calculators. It enables dynamic lead capture, automates customer communication, and streamlines sales processes. The project aims to provide a comprehensive solution for accurate pricing, lead management, and an enhanced user experience, driving business growth and market potential.

## Recent Changes
- **Admin Dashboard Consolidation (January 2025):**
  - Successfully moved support ticket section from separate page to unified admin dashboard tab system
  - Created comprehensive SupportTicketsSection component with ticket management, statistics, filtering, and messaging
  - Successfully moved Duda website templates page to unified admin dashboard as "Duda" tab
  - Created DudaTemplatesSection component with complete template and tag management functionality
  - Integrated template sync functionality with Duda API, visibility controls, and tag assignment features
  - Removed separate routing for support tickets and Duda templates pages - all now accessible via admin dashboard
  - Removed "Templates" tab from admin dashboard as requested, maintaining clean 8-tab layout
  - Admin dashboard now serves as single unified interface for all administrative functions
- **Website Builder Enhancements (January 2025):**
  - Removed SSO (Single Sign-On) feature from website creation process as user lacks access to Duda SSO functionality
  - Implemented new website activation email system that sends users direct website links instead of SSO links
  - Created `sendWebsiteActivationEmail()` function with professional email template including website details and activation instructions
  - Updated website creation UI to show different interfaces based on user's website ownership status
  - Once user has created a website, template library is hidden and replaced with dedicated website management interface
  - Added comprehensive website management dashboard showing website URL, preview URL, status, and creation date
  - Enhanced website management with direct action buttons for preview, publish, and delete operations
  - Focused UI on single website per user workflow as requested for priority management
- Removed Classic Form and Upsell Form options from dashboard, keeping only Styled Calculator per user request
- Cleaned up navigation routes by removing `/embed-form` and `/upsell-form` paths from both public and authenticated sections
- Simplified embed code generator page by removing old Multi-Service Selector Embed section
- Fixed email proposal link system by implementing `getBaseUrl()` helper function that uses REPLIT_DEV_DOMAIN instead of localhost URLs
- Updated all email templates to use proper Replit domain for proposal links, calendar links, and lead management URLs
- Removed Team tab from dashboard navigation per user request for cleaner interface
- Standardized all business notification emails with unified template design across welcome, onboarding, subscription, lead notification, and booking emails
- Created reusable email template structure with consistent header, content cards, and footer design for professional appearance
- Enhanced email system consistency to provide better brand experience for business owners
- Fixed admin@autobidder.org login issue by setting proper password hash and email verification
- Moved "Stripe Testing" from main navigation to admin dashboard only for better access control
- Enhanced admin authentication with debug logging for troubleshooting
- **Email Template Consistency Project (January 2025):**
  - Identified and resolved email styling inconsistency across all notification types
  - Systematically converted all custom HTML email templates to use the unified `createUnifiedEmailTemplate` system
  - Updated 12+ email templates including multi-service lead notifications, booking confirmations, bid requests, customer estimates, revised estimates, appointment confirmations, and lead submitted emails
  - Achieved consistent colors, layouts, typography, and branding across all business communications
  - Improved professional appearance and brand consistency for customer-facing emails
  - Maintained template functionality while standardizing visual design across the entire email system
  - **Professional Email Enhancement (January 2025):**
    - Completed systematic removal of all emojis from default email templates
    - Enhanced professional appearance by replacing emoji-based titles, subjects, and content sections with clean text
    - Updated all email notification types to maintain consistent professional tone without decorative emojis
    - Improved business communication standards for enterprise-level appearance
- **Price Display Bug Fix (January 2025):**
  - Fixed price conversion inconsistency where prices were displayed incorrectly in dashboard (showing $32.48 instead of $3248)
  - Standardized all lead submission endpoints to properly convert dollar amounts to cents for database storage
  - Updated styled calculator, service selector, upsell form, and calculator preview components to convert prices to cents
  - Ensured consistent price handling across single service leads and multi-service leads
  - Maintained proper price display formatting (cents to dollars) in dashboard and email templates
  - **Customer Email Price Fix:** Fixed issue where price quotes in emails to prospects were multiplied by 100 while business owner emails showed correct pricing
  - Updated `sendLeadSubmittedEmail` function to properly convert cents to dollars for customer-facing price quotes
  - Ensured price consistency across all email templates (both business owner and customer emails)
- **Conditional Logic Bug Fix (January 2025):**
  - Fixed critical bug where conditional form logic wasn't properly showing/hiding variables based on user selections
  - Root cause: Form values were stored as arrays (e.g., `["Metal"]`) but conditional logic expected strings (e.g., `"Metal"`)
  - Enhanced `evaluateConditionalLogic` function to properly handle array values from select, dropdown, and multiple-choice inputs
  - Updated validation logic to only require answers to visible variables, excluding hidden conditional questions
  - Added helper functions `getVisibleVariables` and `areAllVisibleVariablesCompleted` for reusable conditional logic validation
  - Form progression now correctly validates only visible variables before allowing users to proceed to next steps
  - **Default Values for Hidden Variables:** Implemented automatic default value handling for hidden conditional variables in price calculations
  - Added `defaultValue` property to conditional logic schema for custom defaults
  - Created `getDefaultValueForHiddenVariable` helper function for type-appropriate default values
  - Price calculations now use default values for hidden variables to prevent calculation errors and ensure accurate pricing

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **Styling**: TailwindCSS with shadcn/ui component library, supporting custom themes (Modern, Professional, Vibrant, Minimal, Elegant, Dark, Retro, Soft, Corporate, Luxury), responsive layouts, and granular styling for calculator components.
- **State Management**: TanStack Query
- **Build Tool**: Vite
- **Key Features**: Live preview of design changes, mobile optimization, and accessibility via Radix UI primitives.
- **Design System**: A dedicated design system architecture separates styling from business logic, utilizing a `designSettings` database table for visual configurations. A component-based visual editor allows real-time preview and advanced styling controls for all form elements. Themes are consolidated with preset options and live preview.

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: PostgreSQL-backed sessions for secure user authentication (email/password).

### Core System Features & Design Patterns
- **Database Schema**: Manages Formulas, Leads, Business Settings, Estimates, Bid Requests, Custom Forms, and Email Settings.
- **API Layer**: RESTful endpoints for CRUD operations across all entities.
- **Formula Builder**: Supports complex pricing logic with various variable types and conditional logic.
- **Lead Management**: Tracks, filters, and manages leads, including Google Maps integration for location-based services.
- **Email System**: Robust notification system (Resend primary, Gmail fallback) for leads and updates, with customizable, branded templates.
- **Subscription Management**: Integrates with Stripe for plan upgrades/downgrades, billing, and payment method updates, supporting a 14-day free trial.
- **User Management**: Role-based access control (owner, employee, super admin) with invitation and impersonation.
- **Booking System**: Optional customer-facing booking calendar and appointment scheduling.
- **DFY Services Catalog**: In-app marketplace for professional services with Stripe integration.
- **Website Builder**: Integration with Duda API for website creation and management.
- **AI Integration**: Uses Google Gemini, Anthropic Claude, and OpenAI APIs for formula generation and editing, with multi-provider architecture and intelligent fallback chains. AI prompts prioritize interactive input types (dropdowns, multiple-choice, checkboxes).
- **Measure Map Tool**: Google Maps integration for property measurements within forms.
- **Zapier Integration**: Full platform integration for workflow automation, supporting polling and instant triggers (REST hooks), API key authentication, lead triggers, calculator triggers, and actions for creating/updating leads.
- **Upsell Items System**: Allows businesses to offer optional add-ons during the pricing phase with real-time updates and visual feedback.

## External Dependencies

- **Database**: Neon Database (PostgreSQL) via `@neondatabase/serverless`
- **ORM**: Drizzle ORM
- **UI Components**: Radix UI primitives via shadcn/ui
- **Validation**: Zod
- **Unique ID Generation**: nanoid
- **Date Handling**: date-fns
- **Email Service**: Resend, Gmail
- **Payment Processing**: Stripe
- **AI Integration**: Google Gemini API, Anthropic Claude API, OpenAI API
- **Mapping/Location**: Google Maps API, Google Places Autocomplete
- **Website Builder Integration**: Duda API
- **Cloud Hosting**: Replit (for development environment)
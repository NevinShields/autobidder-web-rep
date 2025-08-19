# Autobidder

## Overview
Autobidder is a platform designed for businesses to create, customize, and embed interactive pricing calculators. Its primary purpose is to automate lead capture, streamline customer communication, and enhance sales processes. The project aims to provide a comprehensive solution for accurate pricing, efficient lead management, and an improved user experience, ultimately driving business growth and expanding market potential.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
### August 19, 2025
- **COMPLETED**: Google Maps Drawing Library Migration to Terra Draw:
  - **Issue**: Google is phasing out the Drawing Library and DrawingManager class (August 2025 phase out, May 2026 complete removal)
  - **Impact**: Current measure map tool relied heavily on deprecated DrawingManager for area/distance measurement functionality
  - **Solution**: Successfully migrated to Terra Draw - a modern, cross-platform drawing library
  - **Implementation**: Created new MeasureMapTerra component with identical functionality using Terra Draw
  - **Status**: Migration complete and ready for deployment
  - **Features Added**: 
    - Migration demo page at `/map-migration-demo` for side-by-side comparison
    - User notification system with dismissible migration notices
    - Legacy component marked with deprecation warnings
    - Future-ready drawing system that works beyond May 2026
- **COMPLETED**: Migrated subscription management to Stripe Customer Portal approach:
  - **Customer Portal Integration**: Implemented seamless subscription management through Stripe's hosted portal
  - **Webhook Integration**: Fixed webhook endpoint conflicts and enabled proper event processing at `/api/stripe-webhook`
  - **URL Configuration**: Corrected webhook URL format to `https://workspace-shielnev11.replit.app/api/stripe-webhook`
  - **Event Processing**: Customer Portal changes now trigger real-time subscription updates in the database
  - **Environment Detection**: System automatically detects test vs live mode from STRIPE_SECRET_KEY prefix
  - **Data Migration**: Cleared old subscription data and reset user account for fresh sandbox testing
  - **Secrets Cleanup**: Removed unnecessary price ID environment variables, keeping only essential Stripe keys
  - **UI Migration**: Replaced manual proration "Change Plan" button with Customer Portal redirect
  - **Plan Selection Interface**: Created professional plan selection with Standard ($49), Plus ($97), and Plus SEO ($297) options
  - **Design Improvements**: Enhanced spacing, responsive design, and visual appeal for subscription upgrade flow
  - **Code Cleanup**: Removed manual sync button since webhooks now handle automatic subscription updates
  - **Webhook Fix**: Added raw body parsing middleware for proper Stripe webhook signature verification
  - **Manual Sync**: Fixed subscription display issue by manually syncing active subscription data from Stripe
  - **Testing Ready**: System fully operational for end-to-end subscription flow with automatic webhook processing

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **Styling**: TailwindCSS with shadcn/ui, supporting custom themes (Modern, Professional, Vibrant, Minimal, Elegant, Dark, Retro, Soft, Corporate, Luxury), responsive layouts, and granular component styling.
- **State Management**: TanStack Query
- **Build Tool**: Vite
- **Key Features**: Live preview of design changes, mobile optimization, and accessibility via Radix UI primitives.
- **Design System**: A dedicated design system separates styling from business logic, utilizing a `designSettings` database table for visual configurations. A component-based visual editor allows real-time preview and advanced styling controls for all form elements. Themes are consolidated with preset options and live preview.

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: PostgreSQL-backed sessions for secure user authentication.

### Core System Features & Design Patterns
- **Database Schema**: Manages Formulas, Leads, Business Settings, Estimates, Bid Requests, Custom Forms, and Email Settings.
- **API Layer**: RESTful endpoints for CRUD operations across all entities.
- **Formula Builder**: Supports complex pricing logic with various variable types and conditional logic.
- **Lead Management**: Tracks, filters, and manages leads.
- **Email System**: Robust notification system with customizable, branded templates.
- **Subscription Management**: Integrates with Stripe for plan upgrades/downgrades, billing, and payment method updates, supporting a 14-day free trial.
- **User Management**: Role-based access control (owner, employee, super admin) with invitation and impersonation.
- **Booking System**: Optional customer-facing booking calendar and appointment scheduling.
- **DFY Services Catalog**: In-app marketplace for professional services.
- **Website Builder**: Integration with Duda API for website creation and management.
- **AI Integration**: Uses Google Gemini, Anthropic Claude, and OpenAI APIs for formula generation and editing, with multi-provider architecture and intelligent fallback chains. AI prompts prioritize interactive input types.
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
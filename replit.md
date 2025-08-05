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
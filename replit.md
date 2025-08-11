# Autobidder

## Overview
Autobidder is a platform for businesses to create, customize, and embed interactive pricing calculators. It enables dynamic lead capture, automates customer communication, and streamlines sales processes. The project aims to provide a comprehensive solution for accurate pricing, lead management, and an enhanced user experience, driving business growth and market potential.

## Recent Changes
- Fixed admin@autobidder.org login issue by setting proper password hash and email verification
- Moved "Stripe Testing" from main navigation to admin dashboard only for better access control
- Enhanced admin authentication with debug logging for troubleshooting

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
# Autobidder

## Overview
Autobidder is a platform designed for businesses to create, customize, and embed interactive pricing calculators. Its primary purpose is to automate lead capture, streamline customer communication, and enhance sales processes. The project aims to provide a comprehensive solution for accurate pricing, efficient lead management, and an improved user experience, ultimately driving business growth and expanding market potential.

## User Preferences
Preferred communication style: Simple, everyday language.

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
- **Booking System**: Optional customer-facing booking calendar and appointment scheduling, leveraging a unified `calendar_events` architecture.
- **DFY Services Catalog**: In-app marketplace for professional services.
- **Website Builder**: Integration with Duda API for website creation and management.
- **AI Integration**: Uses Google Gemini, Anthropic Claude, and OpenAI APIs for formula generation and editing, with multi-provider architecture and intelligent fallback chains. AI prompts prioritize interactive input types.
- **Measure Map Tool**: Google Maps integration for property measurements within forms, using Terra Draw for drawing functionality.
- **Photo Measurement Tool**: AI-powered measurement estimation from photos using OpenAI GPT-4 Vision, prioritizing general knowledge of standard dimensions with optional business-specific calibration. Includes robust security measures for image uploads and storage.
- **Zapier Integration**: Full platform integration for workflow automation, supporting polling and instant triggers (REST hooks), API key authentication, lead triggers, calculator triggers, and actions for creating/updating leads.
- **Upsell Items System**: Allows businesses to offer optional add-ons during the pricing phase with real-time updates and visual feedback.
- **Question Help Text Feature**: Allows business owners to add optional tooltip descriptions to each question/variable in forms for customer guidance.
- **Auto-Expand/Collapse Services Feature**: Automatically guides customers through multi-service forms by expanding incomplete services and collapsing completed ones.
- **Twilio SMS Integration**: Multi-tenant SMS automation where each business connects their own Twilio account. Twilio credentials (Account SID, Auth Token, Phone Number) are stored per-business in the `business_settings` table, allowing businesses to send automated SMS via CRM automations without platform-level Twilio costs. Auth tokens are encrypted at rest using AES-256-GCM with per-environment encryption keys for security.

## External Dependencies

- **Database**: Neon Database (PostgreSQL) via `@neondatabase/serverless`
- **Security**: 
  - Requires `ENCRYPTION_KEY` environment variable (64-character hex string, 32 bytes) for encrypting sensitive credentials
  - Generate with: `openssl rand -hex 32`
  - Used to encrypt Twilio auth tokens and other sensitive per-business credentials
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
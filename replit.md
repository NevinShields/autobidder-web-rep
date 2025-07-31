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

## External Dependencies

- **Database**: Neon Database (PostgreSQL) via `@neondatabase/serverless`
- **ORM**: Drizzle ORM
- **UI Components**: Radix UI primitives via shadcn/ui
- **Validation**: Zod
- **Unique ID Generation**: nanoid
- **Date Handling**: date-fns
- **Email Service**: Resend (primary), Gmail, SendGrid (fallback)
- **Payment Processing**: Stripe
- **AI Integration**: Google Gemini API
- **Mapping/Location**: Google Maps API, Google Places Autocomplete
- **Website Builder Integration**: Duda API
- **Cloud Hosting**: Replit (for development environment)
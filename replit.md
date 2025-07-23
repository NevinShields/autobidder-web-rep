# PriceBuilder Pro

## Overview

PriceBuilder Pro is a modern pricing calculator platform that allows users to create, customize, and embed interactive pricing calculators. The application provides a comprehensive solution for businesses to capture leads through dynamic pricing tools with customizable styling and formula logic.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates

### January 23, 2025 - Mobile-Responsive Design & Enhanced Dashboard
- ✓ Completely redesigned dashboard with mobile-first approach and enhanced functionality
- ✓ Added comprehensive metrics: calculator performance, recent activity, setup progress tracking
- ✓ Implemented responsive grid layouts for all pages (2-col mobile, 4-col desktop for metrics)
- ✓ Enhanced dashboard with quick actions, top performing calculators, and useful business widgets
- ✓ Added mobile-optimized CSS with improved touch targets and responsive typography
- ✓ Updated calendar page with mobile-friendly date picker and touch-optimized controls
- ✓ Made embed forms mobile-responsive with proper padding and responsive text sizing
- ✓ Added gradient borders and enhanced visual design elements throughout the application
- ✓ Integrated booking functionality into pricing form results with mobile-friendly booking calendar
- ✓ Fixed TypeScript issues in booking calendar component for proper lead ID handling

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
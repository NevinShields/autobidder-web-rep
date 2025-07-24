# PriceBuilder Pro

## Overview

PriceBuilder Pro is a modern pricing calculator platform that allows users to create, customize, and embed interactive pricing calculators. The application provides a comprehensive solution for businesses to capture leads through dynamic pricing tools with customizable styling and formula logic.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates

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
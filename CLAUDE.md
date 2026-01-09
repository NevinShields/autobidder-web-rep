# CLAUDE.md

## Project Overview

Autobidder is a full-stack web application for creating, customizing, and embedding interactive pricing calculators. It automates lead capture, streamlines customer communication, and enhances sales processes.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, Wouter (routing), TanStack Query
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **External Services**: Stripe, Google (OAuth, Maps, Calendar, Sheets, Gemini AI), Anthropic Claude, OpenAI, Resend, Twilio, Zapier

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (port 5000)
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Apply database migrations
npm run check        # TypeScript type checking
```

## Project Structure

```
client/              # React frontend
  src/
    pages/           # Route pages (50+)
    components/      # UI components
      ui/            # shadcn/ui components
    hooks/           # Custom React hooks (useAuth, etc.)
    lib/             # Utilities (queryClient, authUtils)
    App.tsx          # Main router
server/              # Express.js backend
  index.ts           # App initialization
  routes.ts          # API routes (main file)
  db.ts              # Database connection
  stripe.ts          # Payment integration
  emailAuth.ts       # Email authentication
  googleAuth.ts      # Google OAuth
shared/
  schema.ts          # Drizzle ORM schema (all tables)
migrations/          # Database migrations
```

## Key Files

- `server/routes.ts` - All API endpoints
- `shared/schema.ts` - Database schema definitions
- `client/src/App.tsx` - Frontend routing
- `client/src/hooks/use-auth.tsx` - Authentication hook
- `server/email-templates.ts` - Email templates
- `server/automation-execution.ts` - CRM automation engine

## Code Patterns

### API Endpoints
- RESTful design in `server/routes.ts`
- Zod schemas for request validation
- Session-based authentication via Passport.js

### Frontend
- TanStack Query for server state
- React Hook Form + Zod for forms
- shadcn/ui components with Radix primitives

### Database
- Drizzle ORM with PostgreSQL
- Schema defined in `shared/schema.ts`
- JSONB columns for complex data (formulas, styling)

## Authentication

Multiple strategies supported:
- Email/password
- Google OAuth
- Role-based access: owner, employee, super_admin

## Important Considerations

- TypeScript strict mode is enabled
- Sensitive credentials are encrypted at rest (AES-256-GCM)
- Multi-provider AI fallback: Claude -> Gemini -> OpenAI
- Email fallback: Resend -> Gmail
- CSRF protection and input validation in place

## Testing

```bash
node test-critical-apis.js       # API endpoint tests
node test-price-calculations.js  # Pricing accuracy tests
node test-database.js            # Database integrity tests
```

## Environment Variables

Required variables are defined in `.env`. Key categories:
- Database: `DATABASE_URL`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, webhook secrets
- Google: Maps, OAuth, Sheets API keys
- AI: `ANTHROPIC_API_KEY`, `GOOGLE_GENAI_API_KEY`, `OPENAI_API_KEY`
- Email: `RESEND_API_KEY`
- SMS: Twilio credentials
- Security: `ENCRYPTION_KEY`

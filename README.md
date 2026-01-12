# REST Express

This is a full-stack web application with a React frontend, an Express.js backend, and a Zapier integration.

## Project Structure

*   `client/`: Contains the React frontend application, built with Vite.
*   `server/`: Contains the Express.js backend application, written in TypeScript.
*   `zapier-app/`: Contains the Zapier integration.
*   `shared/`: Contains shared code between the client and server.
*   `drizzle.config.ts`: Configuration for Drizzle ORM.
*   `migrations/`: Database migration files.

## Tech Stack

*   **Frontend:**
    *   React
    *   Vite
    *   Tailwind CSS
*   **Backend:**
    *   Express.js
    *   TypeScript
*   **Database:**
    *   PostgreSQL (using `drizzle-orm` and `@neondatabase/serverless`)
*   **Integrations:**
    *   Stripe
    *   Google APIs (Maps, Sheets, Calendar)
    *   Zapier
    *   Twilio
    *   Resend
    *   OpenAI
    *   Anthropic (Claude)

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.
The backend will be running on [http://localhost:3000](http://localhost:3000).

### `npm run build`

Builds the app for production to the `dist` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run start`

Runs the production build of the application.

### `npm run check`

Runs the TypeScript compiler to check for type errors.

### `npm run db:push`

Pushes database changes using Drizzle Kit.

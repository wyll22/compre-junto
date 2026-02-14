# Compre Junto FSA

## Overview

Compre Junto FSA is a group buying web application inspired by Facily, built for a local community. Users can browse products, join buying groups to get discounted prices, and manage a shopping cart. The app is a full-stack TypeScript project with a React frontend and Express backend, using PostgreSQL for data storage. The interface is in Brazilian Portuguese and follows a mobile-first design approach.

Key features:
- Product listing with category filtering and search
- Group buying: users create or join groups for products to unlock group prices
- Shopping cart (localStorage-based)
- Admin panel for managing products
- No authentication required — users join groups by providing name and phone number

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project uses a single repository with three main directories:
- `client/` — React frontend (Vite-powered SPA)
- `server/` — Express backend (Node.js)
- `shared/` — Shared types, schemas, and API route definitions used by both client and server

### Frontend
- **Framework**: React with TypeScript
- **Bundler**: Vite (dev server with HMR, production build outputs to `dist/public`)
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (Radix primitives + Tailwind CSS + class-variance-authority)
- **Styling**: Tailwind CSS with CSS variables for theming (orange/warm palette inspired by Facily/Shopee)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Cart**: Client-side only, stored in localStorage (`fsa_cart` key)

Pages: Home (product grid), Admin (product management), Cart, 404

Path aliases configured in tsconfig and vite:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

### Backend
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript, run with `tsx` in development
- **API Pattern**: RESTful JSON API under `/api/*`
- **Route Definitions**: Centralized in `shared/routes.ts` with Zod schemas for input validation and response typing. The server references `api.products.*`, `api.groups.*`, etc.
- **Storage Layer**: `server/storage.ts` defines an `IStorage` interface with a PostgreSQL implementation using raw pool queries (not Drizzle query builder directly for most operations)
- **Build**: Custom build script (`script/build.ts`) uses Vite for client and esbuild for server, outputting to `dist/`

### Database
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM/Schema**: Drizzle ORM with `drizzle-zod` for generating Zod schemas from table definitions
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit (`drizzle-kit push` via `npm run db:push`)

**Tables:**
- `users` — id, name, identifier, createdAt
- `products` — id, name, description, imageUrl, originalPrice (numeric), groupPrice (numeric), minPeople, category, createdAt
- `groups` — id, productId, currentPeople, minPeople, status ("aberto"/"fechado"), createdAt
- `members` — id, groupId, userId (optional), name, phone, createdAt

Relations are defined with Drizzle's `relations()` helper.

### API Routes
Defined in `shared/routes.ts` and implemented in `server/routes.ts`:
- `GET /api/products` — list products (optional category/search filters)
- `GET /api/products/:id` — get single product
- `POST /api/products` — create product
- `PUT /api/products/:id` — update product
- `DELETE /api/products/:id` — delete product
- `GET /api/groups` — list groups (optional productId/status filters)
- `POST /api/groups` — create group
- `POST /api/groups/:id/join` — join a group (name + phone)

### Known Issues
The project has TypeScript compilation errors (`npm run check` fails). Key problems include:
- Remnants of a removed authentication system (session middleware, user context references)
- Type mismatches between shared route definitions and actual implementations
- The `users` table exists in schema but auth flow was removed — joining groups uses name/phone directly

### Dev vs Production
- **Development**: `npm run dev` runs `tsx server/index.ts` which sets up Vite middleware for HMR
- **Production**: `npm run build` creates `dist/` with compiled server (`dist/index.cjs`) and static client files (`dist/public/`), then `npm start` serves it

## External Dependencies

### Required Services
- **PostgreSQL Database**: Must be provisioned and connected via `DATABASE_URL` environment variable. Used for all persistent data (products, groups, members).

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** + **drizzle-zod**: Database schema, migrations, and Zod schema generation
- **pg**: PostgreSQL client (node-postgres)
- **express**: HTTP server framework
- **zod**: Runtime validation for API inputs and responses
- **@tanstack/react-query**: Client-side data fetching and caching
- **wouter**: Client-side routing
- **framer-motion**: Page and component animations
- **shadcn/ui ecosystem**: Radix UI primitives, Tailwind CSS, class-variance-authority, lucide-react
- **react-hook-form** + **@hookform/resolvers**: Form handling with Zod integration

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal`: Runtime error overlay in dev
- `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-dev-banner`: Dev-only Replit integrations
# Compra Junto Formosa

## Overview

Compra Junto Formosa is a group buying web application for a local community in Formosa. Users can browse products in two modes (group buying and individual purchase), join buying groups for discounted prices, and manage a shopping cart. The app features user authentication, an admin panel, and a green/yellow brand identity. Built as a full-stack TypeScript project with React frontend and Express backend, using PostgreSQL for data storage. The interface is in Brazilian Portuguese with a mobile-first design.

Key features:
- Dual sale modes: "Compra em Grupo" (group buying) and "Compre Agora" (individual purchase)
- 14+ product categories (Basico, Bebida, Higiene pessoal, etc.)
- User authentication with register/login/logout (session-based)
- Group buying: users create or join groups for products to unlock group prices
- Shopping cart (localStorage-based, login required for checkout)
- Admin panel for managing products, groups, banners, and videos
- Green (#0B6B3A) and yellow (#D4A62A) brand identity

## User Preferences

Preferred communication style: Simple, everyday language (Brazilian Portuguese).
Default admin credentials: admin@comprajuntoformosa.com / admin123

## Recent Changes

- 2026-02-14: Evolved from "Compre Junto FSA" to "Compra Junto Formosa"
- Added dual sale modes (grupo/agora) with tab-based switching
- Added user authentication (register/login/logout with bcryptjs + sessions)
- Expanded to 14+ product categories
- Added new product fields: stock, reserveFee, nowPrice, active
- Added banners and videos tables with full CRUD in admin
- Rebuilt brand identity with green/yellow color palette
- Created comprehensive admin panel with tabs for products, groups, banners, videos

## System Architecture

### Monorepo Structure
The project uses a single repository with three main directories:
- `client/` — React frontend (Vite-powered SPA)
- `server/` — Express backend (Node.js)
- `shared/` — Shared types, schemas, and constants used by both client and server

### Frontend
- **Framework**: React with TypeScript
- **Bundler**: Vite (dev server with HMR, production build outputs to `dist/public`)
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (Radix primitives + Tailwind CSS)
- **Styling**: Tailwind CSS with CSS variables for theming (green/yellow brand palette)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Cart**: Client-side only, stored in localStorage (`fsa_cart` key)

Pages: Home (`/`), Login (`/login`), Cart (`/carrinho`), Admin (`/admin`), 404

Path aliases:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

### Backend
- **Framework**: Express on Node.js
- **Language**: TypeScript, run with `tsx` in development
- **API Pattern**: RESTful JSON API under `/api/*`
- **Authentication**: Session-based with express-session, bcryptjs for password hashing
- **Storage Layer**: `server/storage.ts` defines an `IStorage` interface with PostgreSQL implementation using raw pool queries
- **Session**: In-memory session store (not persistent across restarts)

### Database
- **Database**: PostgreSQL via `DATABASE_URL`
- **ORM/Schema**: Drizzle ORM with `drizzle-zod` for Zod schema generation
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit (`npm run db:push`)

**Tables:**
- `users` — id, name, email (unique), password (bcrypt hash), phone, role (user/admin), createdAt
- `products` — id, name, description, imageUrl, originalPrice, groupPrice, nowPrice, minPeople, stock, reserveFee, category, saleMode (grupo/agora), active, createdAt
- `groups` — id, productId, currentPeople, minPeople, status (aberto/fechado), createdAt
- `members` — id, groupId, userId, name, phone, createdAt
- `banners` — id, title, imageUrl, mobileImageUrl, linkUrl, sortOrder, active, createdAt
- `videos` — id, title, embedUrl, sortOrder, active, createdAt
- `orders` — id, userId, items (jsonb), totalAmount, status, createdAt

### API Routes
- `GET /api/products` — list products (optional category/search/saleMode filters)
- `GET /api/products/:id` — get single product
- `POST /api/products` — create product (admin)
- `PUT /api/products/:id` — update product (admin)
- `DELETE /api/products/:id` — delete product (admin)
- `GET /api/groups` — list groups (optional productId/status filters)
- `POST /api/groups` — create group
- `POST /api/groups/:id/join` — join a group
- `PATCH /api/groups/:id/status` — update group status (admin)
- `GET /api/banners` — list banners
- `POST /api/banners` — create banner (admin)
- `PUT /api/banners/:id` — update banner (admin)
- `DELETE /api/banners/:id` — delete banner (admin)
- `GET /api/videos` — list videos
- `POST /api/videos` — create video (admin)
- `PUT /api/videos/:id` — update video (admin)
- `DELETE /api/videos/:id` — delete video (admin)
- `POST /api/auth/register` — register new user
- `POST /api/auth/login` — login
- `POST /api/auth/logout` — logout
- `GET /api/auth/me` — get current user

### Dev vs Production
- **Development**: `npm run dev` runs `tsx server/index.ts` with Vite middleware for HMR
- **Production**: `npm run build` creates `dist/` then `npm start` serves it

## External Dependencies

### Required Services
- **PostgreSQL Database**: Connected via `DATABASE_URL` environment variable

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** + **drizzle-zod**: Database schema and migrations
- **pg**: PostgreSQL client
- **express** + **express-session**: HTTP server and sessions
- **bcryptjs**: Password hashing
- **zod**: Runtime validation
- **@tanstack/react-query**: Client-side data fetching
- **wouter**: Client-side routing
- **framer-motion**: Animations
- **shadcn/ui ecosystem**: UI components
- **lucide-react**: Icons

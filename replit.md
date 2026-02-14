# Compra Junto Formosa

## Overview

Compra Junto Formosa is a group buying web application designed for a local community in Formosa, Brazil. The platform allows users to purchase products individually or participate in group buying to secure discounted prices. Key functionalities include user authentication, a shopping cart, order management, and an administrative panel for content and product management. The application emphasizes a mobile-first design, is localized in Brazilian Portuguese, and features a distinct green and yellow brand identity.

The project aims to empower local commerce by facilitating community-driven purchasing, offering flexible fulfillment options (pickup and delivery), and providing a comprehensive user and administrative experience.

## User Preferences

Preferred communication style: Simple, everyday language (Brazilian Portuguese).
Default admin credentials: admin@comprajuntoformosa.com / admin123

## Recent Changes

- 2026-02-14: Dual fulfillment logistics (pickup/delivery)
  - Added fulfillmentType field (pickup/delivery) to products and orders tables
  - pickup_points table for collection locations with full CRUD
  - Products default: saleMode "grupo" → pickup, "agora" → delivery (admin can override)
  - ProductCard shows "Retirada"/"Entrega" badge per product
  - Cart: mixed fulfillment detection blocks checkout, resolution buttons
  - Checkout: pickup point radio selector or delivery address display
  - Order confirmation shows pickup/delivery details
  - Admin: "Retirada" tab for pickup points, fulfillment field in ProductForm
  - Entregas legal page updated with "Modalidades de Recebimento" section
  - API: GET/POST/PUT/DELETE /api/pickup-points + orders accept fulfillmentType/pickupPointId

## System Architecture

### Monorepo Structure
The project is organized as a monorepo containing three main components:
- `client/`: React frontend (Vite-powered SPA)
- `server/`: Express backend (Node.js)
- `shared/`: Common types, schemas, and constants.

### Frontend
- **Framework**: React with TypeScript.
- **Bundler**: Vite.
- **Routing**: Wouter.
- **State Management/Data Fetching**: TanStack React Query.
- **UI Components**: shadcn/ui (Radix primitives + Tailwind CSS).
- **Styling**: Tailwind CSS with CSS variables for a green/yellow theme.
- **Animations**: Framer Motion.
- **Icons**: Lucide React.
- **Forms**: React Hook Form with Zod validation.
- **Shopping Cart**: Client-side, persisted in `localStorage`.
- **UI/UX Decisions**: Mobile-first design, 5 visible category chips on mobile (4 regular + "Ofertas"), inline subcategory display, auto-rotating banner carousel, embedded video section, dual fulfillment type indication (pickup/delivery badges).
- **Technical Implementations**: Hierarchical category system (9 top-level, ~43 subcategories), legal pages with dynamic company config, enhanced customer account area with multiple tabs (Profile, Address, Security, Orders, Groups), address auto-fill using ViaCEP API.

### Backend
- **Framework**: Express.js with Node.js.
- **Language**: TypeScript.
- **API Pattern**: RESTful JSON API.
- **Authentication**: Session-based using `express-session` and `connect-pg-simple`, with `bcryptjs` for password hashing.
- **Storage Layer**: Custom `IStorage` interface with PostgreSQL implementation.
- **Security**: Helmet for security headers, strict CORS, Zod validation for all API routes, global XSS sanitization middleware, CSRF protection, rate limiting, and robust backend role enforcement. Audit logs track administrative actions.

### Database
- **Database**: PostgreSQL.
- **ORM/Schema**: Drizzle ORM with `drizzle-zod` for schema generation.
- **Migrations**: Drizzle Kit.
- **Core Tables**: `users`, `categories`, `products`, `groups`, `members`, `banners`, `videos`, `orders`, `pickup_points`, `audit_logs`.

### Feature Specifications
- **Dual Sale Modes**: "Compra em Grupo" (group buying) and "Compre Agora" (individual purchase).
- **Group Buying Mechanics**: Users create or join groups; auto-closes groups when minimum participants are met; auto-creates new groups if stock permits; prevents duplicate user entries; tracks reserve fees (`pendente`/`pago`/`nenhuma`).
- **Fulfillment Logistics**: Products and orders support `pickup` or `delivery`. Dedicated `pickup_points` management. Cart detects mixed fulfillment types and prompts resolution.
- **Admin Panel**: Comprehensive dashboard with statistics, CRUD for products, categories, groups, orders, banners, videos, pickup points, and user management. Includes reserve fee management per member and detailed audit logs.

## External Dependencies

### Required Services
- **PostgreSQL Database**: Accessed via `DATABASE_URL`.

### Key NPM Packages
- **Database & ORM**: `drizzle-orm`, `drizzle-kit`, `drizzle-zod`, `pg`.
- **Backend Core**: `express`, `express-session`, `connect-pg-simple`, `bcryptjs`, `zod`.
- **Frontend Core**: `@tanstack/react-query`, `wouter`, `framer-motion`.
- **UI & Icons**: `shadcn/ui` ecosystem, `lucide-react`.
- **Address Auto-fill**: ViaCEP API (implicitly through `client` implementation).
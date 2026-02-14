# Compra Junto Formosa

## Overview

Compra Junto Formosa is a group buying web application for a local community in Formosa. Users can browse products in two modes (group buying and individual purchase), join buying groups for discounted prices, and manage a shopping cart. The app features user authentication, an admin panel, user account management, and a green/yellow brand identity. Built as a full-stack TypeScript project with React frontend and Express backend, using PostgreSQL for data storage. The interface is in Brazilian Portuguese with a mobile-first design.

Key features:
- Dual sale modes: "Compra em Grupo" (group buying) and "Compre Agora" (individual purchase)
- Hierarchical category system: 9 top-level categories (Mercado, Bebidas, Casa & Limpeza, Higiene & Beleza, Pet Shop, Agro & Jardim, Ferramentas, Moda & Calcados, Ofertas) with ~43 subcategories managed via database
- Mobile: 5 category chips visible (4 regular + pinned "Ofertas") + "Ver mais" modal for all categories
- Subcategories appear inline when a category is selected
- User authentication with register/login/logout (session-based with connect-pg-simple)
- Group buying: users create or join groups for products to unlock group prices
- Auto-close groups when min people reached + auto-create new group if stock allows
- Duplicate user prevention in groups
- Reserve fee tracking per member (pendente/pago/nenhuma)
- Shopping cart (localStorage-based) with real order creation on backend
- Order confirmation screen with order number
- Minha Conta page: view groups, orders, update profile
- Admin panel for managing products, groups, orders, banners, and videos
- Banner carousel on home page (auto-rotate)
- Videos section on home page (embedded YouTube/etc)
- Green (#0B6B3A) and yellow (#D4A62A) brand identity

## User Preferences

Preferred communication style: Simple, everyday language (Brazilian Portuguese).
Default admin credentials: admin@comprajuntoformosa.com / admin123

## Recent Changes

- 2026-02-14: Hierarchical category system
  - Replaced flat 19-category list with hierarchical system (categories table with parentId)
  - 9 top-level categories with ~43 subcategories, all managed via database
  - Home page: category chips from API, mobile shows 4 + pinned Ofertas + "Ver mais" modal
  - Subcategories appear inline when category is selected
  - Admin: new "Categorias" tab for subcategory CRUD
  - ProductForm now uses category/subcategory dropdowns (categoryId/subcategoryId)
  - Legacy text `category` field preserved for backward compatibility (derived from selected category)
  - Products API supports categoryId/subcategoryId filters
- 2026-02-14: Enhanced customer area & login
  - Login accepts email OR phone number in single field
  - Registration includes displayName (apelido) field
  - Account page rewritten with 5 tabs: Perfil, Endereco, Seguranca, Pedidos, Grupos
  - Profile: avatar with initials, display name/apelido, phone with BR formatting
  - Address: ViaCEP API integration for CEP auto-fill, all Brazilian address fields
  - Security: change password with current password verification
  - Orders: expandable cards with status icons/badges, item details
  - Groups: enhanced cards with product images, progress bars, status badges
  - New fields on users table: displayName, addressCep/Street/Number/Complement/District/City/State
  - New endpoint: POST /api/auth/password for password change
- 2026-02-14: Complete admin panel overhaul
  - NEW Dashboard tab: stat cards (produtos ativos, pedidos, clientes, grupos, receita total, grupos abertos, pedidos pendentes)
  - NEW Clientes tab: user listing with search, detail dialog showing full profile + address
  - Enhanced Orders tab: now shows customer name/email/phone, search bar
  - Enhanced Groups tab: progress bars, reserve fee management per member (pendente/pago)
  - Enhanced Categories tab: top-level category editing (name + active toggle), collapsible subcategory lists, delete confirmations, create new top-level categories
  - Enhanced Banners/Videos: delete confirmation dialogs
  - New endpoints: GET /api/admin/stats, GET /api/admin/users, PATCH /api/members/:id/reserve-status
  - Orders admin now joins with user data (getOrdersWithUsers)
- 2026-02-14: Major update with comprehensive features
  - Added Minha Conta page with Meus Grupos, Meus Pedidos, Meus Dados tabs
  - Cart now creates real orders on backend with confirmation screen
  - Admin panel now includes Orders tab with status management
  - Admin groups view shows product name and member list dialog
  - Home page now shows banner carousel and videos section
  - Session storage upgraded to PostgreSQL-backed (connect-pg-simple)
  - Auto-close groups when min people reached, auto-create new if stock allows
  - Reserve fee tracking (pendente/pago/nenhuma) per group member
  - Duplicate user prevention in same group
  - User profile update endpoint
  - Admin can view all products (including inactive) via /api/products/all

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

Pages: Home (`/`), Login (`/login`), Cart (`/carrinho`), Minha Conta (`/minha-conta`), Admin (`/admin`), 404

Path aliases:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

### Backend
- **Framework**: Express on Node.js
- **Language**: TypeScript, run with `tsx` in development
- **API Pattern**: RESTful JSON API under `/api/*`
- **Authentication**: Session-based with express-session + connect-pg-simple, bcryptjs for password hashing
- **Storage Layer**: `server/storage.ts` defines an `IStorage` interface with PostgreSQL implementation using raw pool queries
- **Session**: PostgreSQL-backed session store (persistent across restarts)
- **Auth Middleware**: requireAuth and requireAdmin functions in routes.ts

### Database
- **Database**: PostgreSQL via `DATABASE_URL`
- **ORM/Schema**: Drizzle ORM with `drizzle-zod` for Zod schema generation
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit (`npm run db:push`)

**Tables:**
- `users` — id, name, email (unique), password (bcrypt hash), phone, role (user/admin), emailVerified, phoneVerified, createdAt
- `categories` — id, name, slug, parentId (self-ref, null for top-level), sortOrder, active
- `products` — id, name, description, imageUrl, originalPrice, groupPrice, nowPrice, minPeople, stock, reserveFee, category (legacy text), categoryId (FK to categories), subcategoryId (FK to categories), saleMode (grupo/agora), active, createdAt
- `groups` — id, productId, currentPeople, minPeople, status (aberto/fechado), createdAt
- `members` — id, groupId, userId, name, phone, reserveStatus (pendente/pago/nenhuma), createdAt
- `banners` — id, title, imageUrl, mobileImageUrl, linkUrl, sortOrder, active, createdAt
- `videos` — id, title, embedUrl, sortOrder, active, createdAt
- `orders` — id, userId, items (jsonb), total, status (recebido/processando/enviado/entregue/cancelado), createdAt

### API Routes
- `GET /api/categories` — list categories (optional parentId filter)
- `POST /api/categories` — create category (admin)
- `PUT /api/categories/:id` — update category (admin)
- `DELETE /api/categories/:id` — delete category (admin)
- `GET /api/products` — list active products (optional category/search/saleMode/categoryId/subcategoryId filters)
- `GET /api/products/all` — list ALL products including inactive (admin)
- `GET /api/products/:id` — get single product
- `POST /api/products` — create product (admin)
- `PUT /api/products/:id` — update product (admin)
- `DELETE /api/products/:id` — delete product (admin)
- `GET /api/groups` — list groups (optional productId/status filters, includes product info)
- `GET /api/groups/:id` — get single group
- `GET /api/groups/:id/members` — list group members
- `POST /api/groups` — create group (auth required, auto-joins creator)
- `POST /api/groups/:id/join` — join a group (auth required, duplicate prevention)
- `PATCH /api/groups/:id/status` — update group status (admin)
- `GET /api/user/groups` — get current user's groups with product info
- `GET /api/banners` — list banners (optional active=true filter)
- `POST /api/banners` — create banner (admin)
- `PUT /api/banners/:id` — update banner (admin)
- `DELETE /api/banners/:id` — delete banner (admin)
- `GET /api/videos` — list videos (optional active=true filter)
- `POST /api/videos` — create video (admin)
- `PUT /api/videos/:id` — update video (admin)
- `DELETE /api/videos/:id` — delete video (admin)
- `POST /api/orders` — create order (auth required)
- `GET /api/orders` — list user's orders (admin: ?all=true for all)
- `GET /api/orders/:id` — get single order
- `PATCH /api/orders/:id/status` — update order status (admin)
- `POST /api/auth/register` — register new user
- `POST /api/auth/login` — login
- `POST /api/auth/logout` — logout
- `GET /api/auth/me` — get current user
- `PUT /api/auth/profile` — update user profile (auth required)

### Dev vs Production
- **Development**: `npm run dev` runs `tsx server/index.ts` with Vite middleware for HMR
- **Production**: `npm run build` creates `dist/` then `npm start` serves it

## External Dependencies

### Required Services
- **PostgreSQL Database**: Connected via `DATABASE_URL` environment variable

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** + **drizzle-zod**: Database schema and migrations
- **pg**: PostgreSQL client
- **express** + **express-session** + **connect-pg-simple**: HTTP server, sessions with PG store
- **bcryptjs**: Password hashing
- **zod**: Runtime validation
- **@tanstack/react-query**: Client-side data fetching
- **wouter**: Client-side routing
- **framer-motion**: Animations
- **shadcn/ui ecosystem**: UI components
- **lucide-react**: Icons

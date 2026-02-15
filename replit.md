# Compra Junto Formosa

## Overview

Compra Junto Formosa is a group buying web application designed for a local community in Formosa, Brazil. The platform allows users to purchase products individually or participate in group buying to secure discounted prices. Key functionalities include user authentication, a shopping cart, order management, and an administrative panel for content and product management. The application emphasizes a mobile-first design, is localized in Brazilian Portuguese, and features a distinct green and yellow brand identity.

The project aims to empower local commerce by facilitating community-driven purchasing, offering flexible fulfillment options (pickup and delivery), and providing a comprehensive user and administrative experience.

## User Preferences

Preferred communication style: Simple, everyday language (Brazilian Portuguese).
Default admin credentials: admin@comprajuntoformosa.com / admin123

## Recent Changes

- 2026-02-15: Advanced filters, product specs & stock management
  - Advanced filters on Home page: brand dropdown, price range (min/max), collapsible filter panel
  - Active filter badges with individual remove buttons and "clear all" option
  - Filter count badge on toggle button shows number of active filters
  - Product detail page: specifications section with brand, weight, dimensions, specs text
  - Stock management UI: disabled buy button when out of stock, qty limited to available stock
  - ProductCard: "Esgotado" badge when stock=0, low stock warning (<=5 units)
  - ProductDetail: stock count shown, qty capped, out-of-stock prevents adding to cart
  - Database: brand, weight, dimensions, specifications columns on products table
  - API: GET /api/products/brands, products filter supports brand/minPrice/maxPrice params
  - Admin ProductForm: inputs for brand, weight, dimensions, specifications

- 2026-02-15: Smart search with autocomplete
  - Autocomplete search bar: suggestions dropdown appears as user types (debounced 300ms)
  - Lightweight /api/products/suggestions endpoint returns top 8 matching products
  - Suggestions show product thumbnail, name, price, and sale mode badge
  - Clicking a suggestion navigates to product detail page
  - Works on both desktop and mobile search bars
  - Click-outside closes dropdown, cleanup on unmount

- 2026-02-15: User roles & analytics enhancements
  - User roles: admin, editor, author, user with distinct permissions
  - Role management: admin can change user roles from Clientes tab with role filter and count cards
  - Role-based access: articles/media/navigation routes use requireRole for granular permissions
  - Author can create content, Editor can edit/publish/delete, Admin has full access
  - Analytics dashboard: top pages, traffic sources/referrers, daily pageview chart (30 days)
  - Referrer tracking added to site_visits table and visitor tracking
  - Per-article SEO: dynamic title, meta description, og:image on blog pages
  - API: PATCH /api/admin/users/:id/role, GET /api/admin/analytics

- 2026-02-14: CMS features (Blog, Media Library, Dynamic Navigation)
  - Blog/Articles: articles table, full CRUD API, admin "Artigos" tab with title/slug/content/excerpt/image/published
  - Public blog pages: /blog (list) and /blog/:slug (detail) with SEO-friendly URLs
  - Media Library: media_assets table, multer-based image upload (5MB max, JPEG/PNG/GIF/WebP/SVG), admin "Midia" tab
  - Uploaded files served from /uploads/ with copy URL, grid display, delete
  - Dynamic Navigation: navigation_links table with location (header/footer), admin "Navegacao" tab
  - Footer loads links from DB with fallback to hardcoded defaults
  - Visitor tracking: site_visits table, /api/track-visit endpoint, visitor analytics in System tab
  - API: GET/POST/PUT/DELETE /api/articles, GET/POST/DELETE /api/media, POST /api/media/upload, GET/POST/PUT/DELETE /api/navigation-links

- 2026-02-14: Admin system monitoring tab
  - New "Sistema" tab in admin panel with real-time monitoring
  - Backend /api/admin/system-health endpoint with comprehensive diagnostics
  - Status cards: site online/offline, database connection, server memory
  - Performance metrics: API response time, DB response time, uptime
  - Alerts: overdue pickups, low stock products (5 or less)
  - System resources summary: categories, pickup points, banners, videos
  - Recent activity feed from audit logs
  - Security checklist showing all active protections
  - Auto-refresh every 30 seconds with manual refresh button
  - Countdown timer (saleEndsAt) on product cards for time-limited sales

- 2026-02-14: Production-readiness features
  - SEO: meta description, Open Graph tags, Twitter cards, lang=pt-BR
  - Password recovery: forgot-password/reset-password flow with 1-hour token expiry, single-use tokens
  - Product detail page: /produto/:id with qty selector, group progress display, related products
  - Stock control: transactional decrement with FOR UPDATE locks during checkout, rollback on error
  - Payment indication: PIX key and WhatsApp contact shown on order confirmation
  - In-app notifications: notifications table, auto-creation on order status changes, NotificationBell with polling, mark-read
  - API: POST /api/auth/forgot-password, POST /api/auth/reset-password, GET /api/products/:id, GET /api/notifications, GET /api/notifications/unread-count, POST /api/notifications/mark-read

- 2026-02-14: Pickup-focused order status workflow
  - New status flow: recebido → em_separacao → pronto_retirada → retirado (with nao_retirado/cancelado branches)
  - order_status_history table tracks all status transitions with user, timestamp, and reason
  - order_settings table for configurable pickup window (default 72h) and tolerance (24h)
  - pickup_deadline auto-calculated when order moves to pronto_retirada
  - Admin: enhanced orders tab with status filter, overdue alerts, quick action buttons, order detail dialog with history
  - Admin: Order Settings tab for configuring pickup deadlines and admin override
  - Customer: status progress timeline in order details, pickup countdown timer, expandable status history
  - API: GET /api/orders/:id/history, GET/PUT /api/admin/order-settings, GET /api/admin/orders/overdue
  - Status transitions validated with configurable admin override option

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
- **Core Tables**: `users`, `categories`, `products`, `groups`, `members`, `banners`, `videos`, `orders`, `order_status_history`, `order_settings`, `pickup_points`, `audit_logs`, `articles`, `media_assets`, `navigation_links`, `site_visits`.

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
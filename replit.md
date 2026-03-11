# Compra Junto Formosa

## Overview
Compra Junto Formosa is a group buying web application for a local community in Formosa, Brazil. It enables users to purchase products individually or in groups for discounts. The platform includes user authentication, shopping cart, order management, and an administrative panel for content and product management. It is mobile-first, localized in Brazilian Portuguese, and features a green and yellow brand identity. The project aims to empower local commerce through community-driven purchasing, flexible fulfillment (pickup/delivery), and a comprehensive user and administrative experience.

## User Preferences
Preferred communication style: Simple, everyday language (Brazilian Portuguese).
Default admin credentials: admin@comprajuntoformosa.com / admin123

## Critical Notes
⚠️ **IMPORTANT**: User explicitly requested "NÃO ALTERE NADA SEM MINHA AUTORIZAÇÃO" (Do NOT change anything without authorization)
✅ **STATUS**: App published to production (March 11, 2026)
✅ **MOBILE**: Responsividade mobile/desktop corrigida (T002 concluído)
✅ **NaN ERROR**: Proteção contra NaN em getCategory já implementada (T001 - não era necessário)
✅ **PERFORMANCE**: 41 módulos JS via code-splitting, bundle ~900KB, APIs respondem 60-460ms

## System Architecture

### Monorepo Structure
The project is a monorepo with `client/` (React frontend), `server/` (Express backend), and `shared/` (common types/schemas).

### Frontend
- **Framework**: React with TypeScript, Vite bundler.
- **Routing**: Wouter.
- **State/Data Fetching**: TanStack React Query.
- **UI Components**: shadcn/ui (Radix primitives + Tailwind CSS) with green/yellow theme.
- **Styling**: Tailwind CSS with responsive breakpoints (mobile-first: sm:, md:, lg:, xl:).
- **Animations**: Framer Motion.
- **Icons**: Lucide React + react-icons (socials).
- **Forms**: React Hook Form with Zod validation.
- **Shopping Cart**: Client-side, `localStorage` persisted.
- **Responsive Design**: Mobile grids 2-6 cols (grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6), adaptive padding/gaps.
- **UI/UX Decisions**: Mobile-first design, hierarchical category system (9 top-level, ~43 subcategories), auto-rotating banner carousel, embedded video section, dual fulfillment type indication, legal pages with dynamic company config, enhanced customer account area, address auto-fill via ViaCEP API, cross-selling on cart/product detail pages.
- **Technical Implementations**: Smart search with autocomplete, Mercado Livre-style responsive filter system, product stock management with low stock warnings, partner product submission and approval workflow, sponsor banners (desktop sidebar, mobile inline), responsive checkout flow with adaptive form grids.
- **Testing**: data-testid attributes on all interactive elements and key display elements for E2E testing capability.

### Backend
- **Framework**: Express.js with Node.js and TypeScript.
- **API Pattern**: RESTful JSON API.
- **Authentication**: Session-based (`express-session`, `connect-pg-simple`), `bcryptjs` for password hashing.
- **Storage Layer**: Custom `IStorage` interface with PostgreSQL.
- **Security**: Helmet headers (CSP, HSTS, X-Frame-Options), strict CORS, Zod validation, global XSS sanitization, CSRF protection, rate limiting on login/register, robust role enforcement, audit logs.
- **Validation**: getCategory() safely handles NaN inputs via `parseInt()` + `isNaN()` check.
- **Feature Specifications**: Dual sale modes ("Compra em Grupo" and "Compre Agora"), group buying mechanics (creation, joining, auto-closure, reserve fees), pickup/delivery fulfillment logistics, comprehensive admin panel (CRUD for products, categories, groups, orders, banners, videos, pickup points, users), user roles (admin, editor, author, user, parceiro/partner) with granular permissions, CMS features (Blog, Media Library, Dynamic Navigation), advanced order status workflow (recebido → em_separacao → pronto_retirada → retirado), real-time admin monitoring, in-app notifications, cross-selling/up-selling.

### Database
- **Database**: PostgreSQL 8.54 MB.
- **ORM/Schema**: Drizzle ORM with `drizzle-zod`.
- **Migrations**: Drizzle Kit (`npm run db:push`).
- **Core Tables**: 26 tables including `users`, `categories`, `products`, `groups`, `members`, `banners`, `videos`, `orders`, `order_status_history`, `order_settings`, `pickup_points`, `audit_logs`, `articles`, `media_assets`, `navigation_links`, `site_config`, `notifications`, `filter_types`, `filter_options`, and more.
- **Data Status**: 
  - 8 products (all approved and active)
  - 52 categories (hierarchical)
  - 3 active banners
  - 1 active video
  - 2 users (admin + test)
  - **0 pickup points** (⚠️ BLOCKS "Retirada" fulfillment flow entirely)
  - Real company data in `site_config` table (CNPJ 43.702.504/0001-66, WhatsApp 5561998705105)
  - Notifications table created and ready

## External Dependencies

### Required Services
- **PostgreSQL Database**: Accessed via `DATABASE_URL`.
- **ViaCEP API**: For CEP address lookup (public, no auth required).

### Key NPM Packages
- **Database & ORM**: `drizzle-orm`, `drizzle-kit`, `drizzle-zod`, `pg`.
- **Backend Core**: `express`, `express-session`, `connect-pg-simple`, `bcryptjs`, `zod`, `helmet`.
- **Frontend Core**: `@tanstack/react-query`, `wouter`, `framer-motion`.
- **UI & Icons**: `shadcn/ui` ecosystem, `lucide-react`, `react-icons/si`.
- **Forms & Validation**: `react-hook-form`, `@hookform/resolvers`, `zod`.

## Production Deployment

### Current Environment
- **Status**: Published to production (March 2026).
- **Mode**: `NODE_ENV=production node dist/index.cjs`
- **Port**: 5000
- **Build**: `npm run build` produces 1.4 MB server binary + 900 KB frontend assets (41 JS modules)
- **Type Checking**: `npm run check` (0 TypeScript errors)

### Security Headers (Active)
- CSP: Content Security Policy configured
- HSTS: max-age=31536000 (1 year HTTPS enforcement)
- X-Frame-Options: SAMEORIGIN (clickjacking protection)
- X-Content-Type-Options: nosniff
- Rate Limiting: Applied to /api/auth/login and /register endpoints
- Password Requirements: 8+ chars, uppercase, number, special char
- Protected Routes: 401 on /api/auth/me and /api/admin/* without session

### Mobile Responsiveness (T002 - COMPLETED)
- ✅ Grid layouts: responsive breakpoints across all product grids
  - Featured products: 2 cols (mobile) → 3 (sm) → 4 (md) → 5 (lg) → 6 (xl)
  - Products list: 2 cols → 3 → 4 → 5
  - Cross-sell: 2 cols → 3
- ✅ Padding/spacing: adaptive (px-3 sm:px-4 md:px-6 lg:px-8, gaps 2 sm:gap-3 md:gap-4)
- ✅ ProductCard: p-2 sm:p-3 with responsive badge sizes
- ✅ Cart address form: mobile-first grid layouts (grid-cols-2 sm:grid-cols-3)
- ✅ FilterSidebar: desktop sidebar with mobile popover chips
- ✅ Footer: responsive 4-column grid (1 sm:2 lg:4)
- ✅ Data-testid: all interactive elements tagged for E2E testing

### Known Issues & TODO
1. ⚠️ **CRITICAL**: 0 Pickup Points in DB
   - Prevents "Retirada" checkout flow
   - Solution: Admin adds ≥1 pickup point via admin panel → /admin/pickup-points
   
2. ⚠️ **FRONTEND DATA MISMATCH**: `client/src/lib/companyConfig.ts` still has placeholder CNPJ/WhatsApp/PIX
   - Real data is in `site_config` DB table (synced to Footer via /api/site-config)
   - Cart.tsx uses `companyConfig.ts` for WhatsApp/PIX display (shows test data)
   - TODO: Cart.tsx should fetch from `/api/site-config` instead of hardcoded file
   
3. ⚠️ **MISSING DOCS**: sitemap.xml and robots.txt (SEO optimization, not critical)

4. ✅ **ACESSIBILITY**: data-testid added to all interactive/display elements for test automation (Cypress/Playwright ready)

5. ✅ **PERFORMANCE**: All critical optimizations complete
   - Code-splitting: 41 modules
   - API latency: 60-460ms (normal range)
   - Bundle: ~900 KB (reasonable for feature set)

## Recent Changes (March 11, 2026)
- ✅ T002: Mobile responsiveness finalized (responsive grids, padding, product cards, cart form)
- ✅ T001: NaN error check verified (already present in getCategory)
- ✅ T003: Documentation updated (this file + LAUNCH_CHECKLIST.md)
- ✅ Verified production security headers and rate limiting
- ✅ Verified database integrity (26 tables, 8 products, 52 categories)

## Architecture Decisions

### Mobile-First Approach
All components designed with mobile constraints first, then enhanced for larger screens using Tailwind breakpoints.

### Client-Side Cart
Shopping cart managed via `localStorage` to enable immediate UX feedback without server round-trips. Persists across sessions.

### Responsive Grids
Products displayed in adaptive grids:
- Small phones: 2 columns
- Tablets (sm+): 3 columns
- Desktops (md+): 4-5 columns
- Large screens (lg+/xl): 5-6 columns
Gap responsive: 2 (mobile) → 3 (sm) → 4 (md+)

### Category Hierarchy
9 top-level categories with ~43 subcategories. Users filter through hierarchical selections on "Compre Agora" mode.

### Payment Flow
- PIX: Display key (copy-paste) + WhatsApp confirmation link
- Cash/Card: Payment on pickup/delivery
- Payment confirmation via WhatsApp with order details

## Command Reference

### Development
```bash
npm run dev          # Start dev server (Vite + Express)
npm run check        # TypeScript type checking
npm run build        # Production build
```

### Database
```bash
npm run db:studio    # Open Drizzle Studio (admin UI)
npm run db:push      # Sync schema to PostgreSQL
npm run db:migrate   # Run migrations
```

### Deployment
```bash
npm run start        # Start production server (NODE_ENV=production)
```

## Workflow Configuration
- **Workflow Name**: "Start application"
- **Command**: `npm run start` (production mode)
- **Status**: Running on port 5000

## Testing & Validation
- All interactive elements tagged with `data-testid` for E2E test automation
- Current test readiness: HIGH (all necessary attributes in place)
- Recommended: Cypress or Playwright for automated testing

## Next Steps (For User/Admin)
1. **Add Pickup Points**: Via /admin/pickup-points (enables "Retirada" fulfillment)
2. **Sync Cart Config**: Update `client/src/lib/companyConfig.ts` OR make Cart.tsx use `/api/site-config`
3. **SEO Enhancements**: Add sitemap.xml and robots.txt (if needed)
4. **Launch Marketing**: Share the live URL and start promoting

# Compra Junto Formosa

## Overview
Compra Junto Formosa is a group buying web application for a local community in Formosa, Brazil. It enables users to purchase products individually or in groups for discounts. The platform includes user authentication, shopping cart, order management, and an administrative panel for content and product management. It is mobile-first, localized in Brazilian Portuguese, and features a green and yellow brand identity. The project aims to empower local commerce through community-driven purchasing, flexible fulfillment (pickup/delivery), and a comprehensive user and administrative experience.

## User Preferences
Preferred communication style: Simple, everyday language (Brazilian Portuguese).
Default admin credentials: admin@comprajuntoformosa.com / admin123

## System Architecture

### Monorepo Structure
The project is a monorepo with `client/` (React frontend), `server/` (Express backend), and `shared/` (common types/schemas).

### Frontend
- **Framework**: React with TypeScript, Vite bundler.
- **Routing**: Wouter.
- **State/Data Fetching**: TanStack React Query.
- **UI Components**: shadcn/ui (Radix primitives + Tailwind CSS) with green/yellow theme.
- **Styling**: Tailwind CSS.
- **Animations**: Framer Motion.
- **Icons**: Lucide React.
- **Forms**: React Hook Form with Zod validation.
- **Shopping Cart**: Client-side, `localStorage` persisted.
- **UI/UX Decisions**: Mobile-first design, hierarchical category system (9 top-level, ~43 subcategories), auto-rotating banner carousel, embedded video section, dual fulfillment type indication, legal pages with dynamic company config, enhanced customer account area, address auto-fill via ViaCEP API.
- **Technical Implementations**: Smart search with autocomplete, Mercado Livre-style responsive filter system with advanced filters and product specifications, product stock management with low stock warnings, partner product submission and approval workflow, sponsor banners (desktop sidebar, mobile inline).

### Backend
- **Framework**: Express.js with Node.js and TypeScript.
- **API Pattern**: RESTful JSON API.
- **Authentication**: Session-based (`express-session`, `connect-pg-simple`), `bcryptjs` for password hashing.
- **Storage Layer**: Custom `IStorage` interface with PostgreSQL.
- **Security**: Helmet, strict CORS, Zod validation, global XSS sanitization, CSRF protection, rate limiting, robust role enforcement, audit logs.
- **Feature Specifications**: Dual sale modes ("Compra em Grupo" and "Compre Agora"), group buying mechanics (creation, joining, auto-closure, reserve fees), pickup/delivery fulfillment logistics with `pickup_points` management, comprehensive admin panel (CRUD for products, categories, groups, orders, banners, videos, pickup points, users), user roles (admin, editor, author, user) with granular permissions, CMS features (Blog, Media Library, Dynamic Navigation), advanced order status workflow (recebido → em_separacao → pronto_retirada → retirado), real-time admin system monitoring, in-app notifications, cross-selling (related products suggestions on product detail and cart pages), up-selling (related groups suggestions for group buying mode), sticky sponsor banners on desktop.

### Database
- **Database**: PostgreSQL.
- **ORM/Schema**: Drizzle ORM with `drizzle-zod`.
- **Migrations**: Drizzle Kit.
- **Core Tables**: `users`, `categories`, `products`, `groups`, `members`, `banners`, `videos`, `orders`, `order_status_history`, `order_settings`, `pickup_points`, `audit_logs`, `articles`, `media_assets`, `navigation_links`, `site_visits`, `sponsor_banners`.

## External Dependencies

### Required Services
- **PostgreSQL Database**: Accessed via `DATABASE_URL`.

### Key NPM Packages
- **Database & ORM**: `drizzle-orm`, `drizzle-kit`, `drizzle-zod`, `pg`.
- **Backend Core**: `express`, `express-session`, `connect-pg-simple`, `bcryptjs`, `zod`.
- **Frontend Core**: `@tanstack/react-query`, `wouter`, `framer-motion`.
- **UI & Icons**: `shadcn/ui` ecosystem, `lucide-react`.
- **Address Auto-fill**: ViaCEP API (implicitly through `client` implementation).
# Integrated Lens System (ILS)

## Overview

The Integrated Lens System (ILS) is an enterprise-grade web application designed to streamline optical lab operations. It provides a unified platform for managing lens orders, production workflows, and quality control across three primary stakeholder groups: Eye Care Professionals (ECPs), Lab Technicians, and Suppliers. The system enables ECPs to submit and track lens orders, allows lab technicians to manage production queues and quality control, and facilitates supplier coordination for materials and purchase orders.

The application is built as a modern, cloud-native platform with a focus on data clarity, professional presentation, and efficient workflows for information-dense enterprise operations.

## Recent Changes

**October 26, 2025 - Supplier Management System**
- Extended `users` table with supplier contact fields: `accountNumber`, `contactEmail`, `contactPhone`, and `address` (JSONB)
- Added customer reference fields to `patients` and `orders` tables for better tracking
- Implemented full CRUD API for supplier management (`/api/suppliers`) with lab-tech/engineer role guards
- Built comprehensive Supplier Management UI with dialog forms and table views
- Reorganized Lab Dashboard with tabbed interface (Orders, Purchase Orders, Suppliers)
- All supplier operations use Zod validation and proper error handling

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework and Tooling:**
- **React with TypeScript**: Primary UI framework using functional components and hooks
- **Vite**: Build tool and development server providing fast HMR (Hot Module Replacement)
- **Wouter**: Lightweight routing library for client-side navigation
- **TanStack Query (React Query)**: Server state management for data fetching, caching, and synchronization

**UI Component System:**
- **shadcn/ui with Radix UI**: Component library built on Radix UI primitives, configured in "new-york" style
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Material Design Principles**: Design system focused on enterprise data presentation with clarity and efficiency
- **Typography**: Inter font family for UI elements, JetBrains Mono for technical/monospace data
- **Theme System**: Light/dark mode support with CSS custom properties

**State Management:**
- Server state managed via TanStack Query with aggressive caching (staleTime: Infinity)
- Local UI state managed with React hooks (useState, useEffect)
- Authentication state synchronized with server sessions

**Key Design Decisions:**
- Component-based architecture with reusable UI components (StatCard, OrderCard, OrderTable, etc.)
- Path aliases configured for clean imports (@/ for client, @shared/ for shared types)
- Responsive design with mobile-first approach using Tailwind breakpoints
- Accessibility-first components via Radix UI primitives

### Backend Architecture

**Framework and Runtime:**
- **Node.js with Express**: REST API server using Express framework
- **TypeScript with ESM**: Type-safe backend code using ES modules

**API Design:**
- RESTful endpoints under `/api` namespace
- Request/response middleware for JSON parsing with raw body preservation
- Request logging middleware tracking method, path, status code, and duration
- Structured error handling with HTTP status codes

**Session Management:**
- Express sessions with PostgreSQL storage (connect-pg-simple)
- 7-day session TTL (time-to-live)
- Secure, HTTP-only cookies for session tokens

**Code Organization:**
- Route handlers separated in `server/routes.ts`
- Database access layer abstracted in `server/storage.ts` implementing IStorage interface
- Shared types and schemas in `shared/schema.ts` for type safety across client and server

### Authentication and Authorization

**Replit Auth (OpenID Connect):**
- OpenID Connect integration with Replit's authentication service
- Passport.js strategy for OAuth flows
- User claims stored in session with automatic token refresh
- Memoized OIDC configuration for performance

**Role-Based Access Control:**
- Four user roles: `ecp`, `lab_tech`, `engineer`, `supplier`
- Role stored in user profile and enforced in API endpoints
- Frontend routing and UI adapted based on user role
- Middleware `isAuthenticated` ensures protected routes require valid sessions

**Session Security:**
- Sessions stored in PostgreSQL for persistence and scalability
- Secure cookies with httpOnly and secure flags
- Environment-based session secrets
- Automatic session expiration and cleanup

### Data Storage

**Database:**
- **PostgreSQL**: Primary relational database via Neon serverless
- **Drizzle ORM**: Type-safe ORM with schema-first approach
- **Connection Pooling**: Neon serverless with WebSocket support for serverless environments

**Schema Design:**
- `users`: User profiles with role, organization, Replit Auth fields, and supplier contact information (accountNumber, contactEmail, contactPhone, address as JSONB)
- `patients`: Patient records linked to ECPs with optional customer reference field
- `orders`: Lens orders with prescription data, status tracking, relationships, and optional customer reference field
- `sessions`: Express session storage table
- PostgreSQL enums for controlled vocabularies (user_role, order_status)

**Data Access Pattern:**
- Repository pattern via IStorage interface in `server/storage.ts`
- Drizzle ORM provides type-safe queries with TypeScript inference
- Shared Zod schemas (drizzle-zod) for runtime validation and type generation
- Database migrations managed via `drizzle-kit`

**Key Schema Decisions:**
- UUID primary keys via `gen_random_uuid()` for distributed scalability
- JSONB fields for flexible prescription data storage
- Indexed session expiration for efficient cleanup
- Timestamp tracking (createdAt, updatedAt) on core entities

### External Dependencies

**Core Infrastructure:**
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **Replit Auth**: OAuth/OIDC authentication provider
- **Replit Deployment**: Cloud hosting platform with automatic HTTPS

**NPM Packages:**
- **@tanstack/react-query**: ^5.60.5 - Server state management
- **drizzle-orm**: ^0.39.1 - Database ORM
- **@neondatabase/serverless**: ^0.10.4 - Neon PostgreSQL client
- **express**: REST API framework
- **passport**: ^0.7.0 - Authentication middleware
- **openid-client**: OIDC/OAuth client
- **connect-pg-simple**: ^10.0.0 - PostgreSQL session store
- **zod**: Schema validation library
- **wouter**: Client-side routing
- **lucide-react**: Icon library
- **date-fns**: ^3.6.0 - Date manipulation utilities
- **tailwindcss**: Utility CSS framework
- **@radix-ui/***: Headless UI component primitives

**Development Tools:**
- **Vite**: Frontend build tool with plugins for Replit integration
- **TypeScript**: Type checking across entire stack
- **tsx**: TypeScript execution for development server
- **esbuild**: Production bundling for backend

**Third-Party Integrations:**
- Google Fonts API: Inter and JetBrains Mono font families
- Replit-specific Vite plugins: cartographer, dev-banner, runtime-error-modal
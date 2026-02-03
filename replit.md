# HopeConnect - Child Sponsorship Platform

## Overview

HopeConnect is a digital sponsorship platform that connects sponsors with children in need. The application enables users to browse and sponsor children, track sponsorships, view progress reports, and manage payments. It includes both a sponsor-facing dashboard and an admin dashboard for managing the platform.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Form Handling**: React Hook Form with Zod validation
- **Theme**: Light/dark mode support with CSS custom properties

### Backend Architecture
- **Framework**: Express 5 running on Node.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful JSON APIs under `/api/*` routes
- **Build System**: Vite for frontend, esbuild for server bundling

### Authentication System
- **Strategy**: Session-based authentication using Passport.js with local strategy
- **Password Security**: scrypt hashing with random salt
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Role-based Access**: Sponsor and admin roles with protected routes

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command
- **Tables**: users, children, sponsorships, reports, payments

### Data Models
- **Users**: Sponsors and admins with authentication credentials
- **Children**: Profiles with location, story, needs, and sponsorship status
- **Sponsorships**: Links sponsors to children with payment tracking
- **Reports**: Progress updates on sponsored children
- **Payments**: Monthly sponsorship payment records

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/   # UI components and shadcn/ui
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utilities and query client
│       └── pages/        # Route components
├── server/           # Express backend
│   ├── auth.ts       # Authentication setup
│   ├── db.ts         # Database connection
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Data access layer
│   └── seed.ts       # Database seeding
└── shared/           # Shared TypeScript types and schema
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### UI Component Library
- **shadcn/ui**: Pre-built accessible components based on Radix UI primitives
- **Radix UI**: Headless UI primitives for dialogs, menus, forms, etc.
- **Tailwind CSS**: Utility-first CSS framework

### Development Tools
- **Vite**: Frontend build tool with HMR support
- **esbuild**: Fast server-side bundling for production
- **Replit Plugins**: Development banner, cartographer, and runtime error overlay

### Payment Processing
- **Stripe**: Integrated via stripe-replit-sync for payment processing
- **Features**: Monthly recurring subscriptions and one-time donations
- **Webhook Handling**: Automatic webhook setup and handling
- **Security**: Session metadata validation, customer binding, Zod input validation

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `STRIPE_SECRET_KEY`: Stripe API secret key (managed by Replit)
- `STRIPE_PUBLISHABLE_KEY`: Stripe public key for frontend

## Recent Changes

### February 2026
- Added Stripe payment integration for sponsorships (monthly and one-time)
- Implemented user profile page with edit functionality and password change
- Added search/filter for children in sponsor dashboard
- Enhanced security with Zod validation on all API endpoints
- Added session metadata validation for Stripe checkout confirmation
- Expanded seed data with 5 sponsors, 2 admins, 10 children

## Test Accounts

### Sponsors
- sarah.johnson@email.com / sponsor123
- michael.chen@email.com / sponsor123
- emily.rodriguez@email.com / sponsor123
- david.williams@email.com / sponsor123
- jennifer.taylor@email.com / sponsor123

### Admins
- admin@hopeconnect.org / admin123
- operations@hopeconnect.org / admin123
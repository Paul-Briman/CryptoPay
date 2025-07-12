# CryptoPay - Bitcoin Investment Platform

## Overview

CryptoPay is a modern Bitcoin investment platform built with React and Node.js. The application allows users to register, log in, select investment plans, and manage their Bitcoin investments. It features a consistent professional black and yellow theme with responsive design, user authentication, plan management, and admin functionality with dedicated admin login page.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom CryptoPay theme (black and yellow)
- **UI Components**: Radix UI primitives with shadcn/ui components
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with in-memory store
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schemas shared between client and server
- **Development**: Hot module replacement via Vite integration

### Data Storage
- **Database**: PostgreSQL (configured for Neon Database)
- **ORM**: Drizzle ORM with type-safe queries and relations
- **Session Store**: In-memory session storage (MemoryStore)
- **Schema**: Shared TypeScript schemas between frontend and backend
- **Storage**: DatabaseStorage class implementing IStorage interface

## Key Components

### Authentication System
- Session-based authentication using Express sessions
- User registration and login with form validation
- Role-based access control (admin vs regular users)
- Auth middleware for protected routes
- Automatic session management with 24-hour expiration

### Investment Plans
- Four investment tiers: Basic, Gold, Platinum, Diamond
- ROI calculations: 4x, 6.5x, 7.5x, 10x respectively
- Plan status tracking: pending, active, completed
- Bitcoin wallet integration for payments
- Copy-to-clipboard functionality for wallet addresses

### User Dashboard
- Plan selection interface with visual cards
- Investment tracking and status display
- Bitcoin wallet address display (only for pending plans)
- Responsive design for mobile and desktop

### Admin Panel
- User management interface
- Plan status management (pending to active)
- Comprehensive user and plan overview
- Admin-only route protection

### UI/UX Features
- Responsive navigation with mobile hamburger menu
- Live Bitcoin price display (CoinGecko integration)
- Support chat integration (WhatsApp redirect)
- Toast notifications for user feedback
- Loading states and error handling

## Data Flow

### User Registration/Login Flow
1. User submits credentials via form
2. Frontend validates using Zod schemas
3. Backend processes and creates/validates user
4. Session created and stored in memory
5. User redirected to dashboard

### Investment Plan Flow
1. User selects plan from dashboard
2. Plan data sent to backend with user ID
3. Plan created with "pending" status
4. Bitcoin wallet address displayed
5. Admin can activate plan via admin panel
6. Wallet address hidden once plan is active

### Admin Management Flow
1. Admin accesses protected admin route
2. System fetches all users and their plans
3. Admin can change plan status from pending to active
4. Status change triggers user dashboard update

## External Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **@hookform/resolvers**: Form validation integration
- **wouter**: Lightweight routing
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Date manipulation utilities

### Backend Dependencies
- **express**: Web application framework
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: PostgreSQL driver
- **express-session**: Session middleware
- **memorystore**: In-memory session storage
- **zod**: Schema validation

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **esbuild**: Fast bundler for production
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- tsx for running TypeScript backend
- Concurrent development with API proxy
- Environment variable management

### Production Build
- Vite builds optimized client bundle
- esbuild bundles server code
- Static assets served from Express
- Session-based authentication maintained

### Database Setup
- Drizzle migrations for schema management
- PostgreSQL database (Neon Database configured)
- Environment variable for database URL
- Automatic schema validation

### Environment Configuration
- DATABASE_URL for PostgreSQL connection
- SESSION_SECRET for session security
- NODE_ENV for environment detection
- Build outputs to dist/ directory

The application is designed to be easily deployable to various platforms while maintaining development simplicity and production performance.
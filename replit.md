# Orient Marketplace

## Overview

Orient is a vendor marketplace platform that connects customers with quality vendors and their products. The application is built as a full-stack web application with a React frontend and Express backend, using PostgreSQL for data persistence and Google Cloud Storage for file uploads. The platform supports three user roles: customers (who browse products), vendors (who manage their stores and products), and admins (who moderate the platform).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management with built-in caching and refetching

**UI Component System**
- Radix UI primitives for accessible, unstyled component foundations
- shadcn/ui component library (New York style) built on top of Radix UI
- Tailwind CSS for utility-first styling with custom design tokens
- CSS variables for theming (supports light/dark mode through class-based switching)

**State Management Strategy**
- Server state managed through TanStack Query with infinite stale time (manual invalidation)
- Query client configured to throw on 401 errors by default, with special handling for auth endpoints
- Authentication state accessed via custom `useAuth` hook that wraps user query
- Form state managed locally with React Hook Form and Zod validation

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for type-safe API development
- ESM modules throughout the codebase
- Custom middleware for request logging and JSON response capture
- Vite integration in development for SSR-like capabilities

**Authentication & Session Management**
- Replit Auth (OpenID Connect) for authentication
- Passport.js with OpenID Client strategy for OAuth flow
- PostgreSQL-backed session storage using connect-pg-simple
- Session cookies with 1-week TTL, HTTP-only, and secure flags
- User sessions stored in `sessions` table with automatic cleanup

**Database Layer**
- Drizzle ORM with Neon serverless PostgreSQL driver
- WebSocket connections for serverless compatibility
- Schema-first approach with Zod validation schemas derived from Drizzle tables
- Connection pooling through `@neondatabase/serverless` Pool

**Data Model**
- Users table with role-based access (customer, vendor, admin)
- Vendors table linked to users, with approval workflow (pending, approved, rejected)
- Products table with vendor relationships and status tracking (active, inactive, flagged)
- Categories table with slug-based routing
- Sessions table for authentication state

**API Design Pattern**
- RESTful endpoints with resource-based routing
- Role-based access control middleware (`isAuthenticated` for protected routes)
- Consistent error handling with HTTP status codes
- JSON request/response bodies with Zod schema validation

### File Upload & Storage

**Object Storage Service**
- Google Cloud Storage integration for file uploads
- Custom `ObjectStorageService` class abstracting storage operations
- Replit sidecar authentication for GCS access (external account credentials)
- ACL (Access Control List) policy system for fine-grained object permissions
- Uppy file uploader on frontend with AWS S3-compatible protocol
- Direct-to-storage uploads using presigned URLs

**ACL Architecture**
- Custom metadata-based ACL policies stored with objects
- Support for multiple access group types (extensible enum design)
- Permission types: READ and WRITE
- ACL rules combining access groups with permissions

### PWA Capabilities

**Progressive Web App Features**
- Service worker for offline functionality and caching
- Web app manifest for installability
- Cache-first strategy for static assets, network-first for API calls
- Runtime caching for dynamic content
- Icons and splash screens for mobile experience

## External Dependencies

### Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **Google Cloud Storage**: Object storage for user-uploaded files (product images, vendor logos)
- **Replit Authentication**: OpenID Connect provider for user authentication
- **Replit Object Storage Sidecar**: Local proxy for GCS credential management

### Third-Party Libraries

**Frontend**
- `@tanstack/react-query`: Server state management and caching
- `@radix-ui/*`: Accessible UI component primitives (20+ components)
- `wouter`: Lightweight routing library
- `react-hook-form` + `@hookform/resolvers`: Form handling with validation
- `@uppy/core`, `@uppy/react`, `@uppy/dashboard`, `@uppy/aws-s3`: File upload UI and logic
- `zod`: Schema validation for forms and API data
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority` + `clsx`: Conditional CSS class composition

**Backend**
- `drizzle-orm`: Type-safe SQL query builder and ORM
- `@neondatabase/serverless`: PostgreSQL driver with serverless support
- `openid-client`: OpenID Connect client implementation
- `passport`: Authentication middleware
- `express-session` + `connect-pg-simple`: Session management
- `@google-cloud/storage`: GCS SDK for file operations
- `memoizee`: Function memoization for OIDC config caching

**Development Tools**
- `vite`: Build tool and dev server
- `typescript`: Static type checking
- `tsx`: TypeScript execution for development server
- `esbuild`: Production build for backend
- `@replit/vite-plugin-*`: Replit-specific dev tools (cartographer, error overlay, dev banner)
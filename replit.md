# replit.md

## Overview

InvoiceFlow is a modern web application for invoice and client management. It's built with a full-stack architecture using React for the frontend, Express.js for the backend, and PostgreSQL for data persistence. The application provides comprehensive functionality for managing clients, creating and tracking invoices, managing expenses, and generating reports.

## System Architecture

The application follows a monorepo structure with clear separation between client-side and server-side code:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling
- **Request Logging**: Custom middleware for API request/response logging

### Database Architecture
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Serverless-first approach using @neondatabase/serverless

## Key Components

### 1. Database Schema
The application uses four main entities:
- **Clients**: Store client information including contact details and billing rates
- **Invoices**: Track invoice metadata, status, and financial totals
- **Line Items**: Individual billable items within invoices
- **Expenses**: Business expense tracking with categorization

### 2. API Layer
RESTful endpoints organized by resource:
- `/api/clients` - Client CRUD operations
- `/api/invoices` - Invoice management with line items
- `/api/expenses` - Expense tracking
- `/api/dashboard/stats` - Dashboard analytics

### 3. User Interface
Organized into distinct pages:
- **Dashboard**: Overview with key metrics and recent activity
- **Clients**: Client database management
- **Invoices**: Invoice creation, editing, and status tracking
- **Expenses**: Business expense management

### 4. Shared Types
Centralized type definitions in the `shared` folder ensure consistency between frontend and backend, with Zod schemas providing runtime validation.

## Data Flow

1. **User Interaction**: Users interact with React components in the client
2. **State Management**: TanStack Query manages server state and caching
3. **API Communication**: HTTP requests to Express.js backend
4. **Data Validation**: Zod schemas validate incoming data
5. **Database Operations**: Drizzle ORM handles PostgreSQL interactions
6. **Response**: Structured JSON responses with error handling

## External Dependencies

### Core Framework Dependencies
- **React ecosystem**: React, React DOM, React Hook Form
- **UI Components**: Radix UI primitives, Lucide React icons
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **Backend**: Express.js, cors middleware
- **Database**: Drizzle ORM, Neon serverless driver

### Development Tools
- **TypeScript**: Full type safety across the stack
- **Vite**: Development server and build tool
- **ESBuild**: Backend bundling for production

### Additional Features
- **PDF Generation**: Mock implementation structure for invoice PDFs
- **Date Handling**: date-fns for date formatting and manipulation
- **Carousel**: Embla Carousel for UI components

## Deployment Strategy

The application is configured for deployment on Replit's infrastructure:

### Development Mode
- **Frontend**: Vite dev server with HMR and runtime error overlay
- **Backend**: tsx for TypeScript execution with hot reload
- **Database**: PostgreSQL 16 module provisioned automatically

### Production Build
- **Frontend**: Vite build process creates optimized static assets
- **Backend**: ESBuild bundles server code for production
- **Deployment**: Configured for Replit's autoscale deployment target

### Configuration
- **Port**: Application runs on port 5000
- **Database**: Uses DATABASE_URL environment variable
- **Build Process**: Two-stage build (frontend assets + backend bundle)

## Recent Changes

- **June 24, 2025**: Initial application setup with React frontend and Express backend
- **June 24, 2025**: Implemented Replit Auth integration with secure session management
- **June 24, 2025**: Added PostgreSQL database with user isolation for all data models
- **June 24, 2025**: Fixed expense validation issues - resolved date field conversion from string to Date object
- **June 24, 2025**: Updated all database queries to use proper AND conditions for user data filtering
- **June 24, 2025**: Created landing page for unauthenticated users and updated sidebar with user profile display

## Changelog

```
Changelog:
- June 24, 2025. Initial setup with full authentication and database integration
- June 24, 2025. Fixed expense creation validation and user data isolation
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
# Integrated Lens System (ILS)

Enterprise-grade web application for managing optical lab operations, lens orders, and production workflows.

## Overview

The Integrated Lens System (ILS) provides a unified platform for managing lens orders, production workflows, and quality control across three primary stakeholder groups:

- **Eye Care Professionals (ECPs)**: Submit and track lens orders
- **Lab Technicians & Engineers**: Manage production queues and quality control
- **Suppliers**: Coordinate materials and purchase orders
- **Administrators**: Manage users and platform settings

## Features

### Phase 6: OMA File Support ✅
- OMA file upload and parsing for prescription data
- Frame tracing visualization
- Integrated file viewer in order details

### Phase 5: User Management ✅
- Multi-role user system (ECP, Lab Tech, Engineer, Supplier, Admin)
- Account approval workflow with pending/active/suspended states
- Comprehensive admin dashboard for user management
- Role-based access control throughout the application

### Phase 4: Settings Management ✅
- Organization settings configuration
- User preferences (theme, language, notifications)
- Role-based access to settings

### Phase 3: Customer Reference & PO Enhancement ✅
- Customer reference tracking in orders
- Enhanced purchase order generation with supplier details
- PDF generation and email notifications

### Phase 2: Supplier Management ✅
- Full CRUD operations for supplier management
- Supplier contact information and account tracking
- Purchase order line item management

### Phase 1: Core Order Management ✅
- Order creation and tracking
- Patient management
- Lab dashboard with production workflow
- Consult logging system
- Technical documentation library

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development and building
- **TanStack Query** (React Query) for server state management
- **Wouter** for lightweight routing
- **shadcn/ui** with Radix UI components
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **TypeScript** with ES modules
- **PostgreSQL** (Neon serverless) for database
- **Drizzle ORM** for type-safe database queries
- **Passport.js** for authentication
- **Replit Auth** (OpenID Connect) integration

### Key Libraries
- **Zod** for schema validation
- **date-fns** for date manipulation
- **PDFKit** for PDF generation
- **Resend** for email notifications

## Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or use Replit's built-in database)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/newvantageco/integrated-lens-system.git
cd integrated-lens-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with the following variables:
```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
ADMIN_SETUP_KEY=your_admin_setup_key
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and helpers
├── server/                # Backend Express application
│   ├── routes.ts          # API route handlers
│   ├── storage.ts         # Database access layer
│   └── replitAuth.ts      # Authentication setup
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and Zod schemas
└── db/                    # Database migrations and config
```

## Authentication

The application uses Replit Auth (OpenID Connect) for authentication with the following roles:

- `ecp` - Eye Care Professional
- `lab_tech` - Lab Technician
- `engineer` - Lab Engineer
- `supplier` - Supplier/Vendor
- `admin` - System Administrator

New users must be approved by an administrator before gaining access to the system.

### Bootstrap Master User (optional)

For secure operational access you can pre-provision a "master" account that automatically receives every role. Set the following environment variables before starting the server:

```
MASTER_USER_EMAIL=master@example.com
MASTER_USER_PASSWORD=changeMeToSomethingStrong
MASTER_USER_FIRST_NAME=Master
MASTER_USER_LAST_NAME=Admin
MASTER_USER_ORGANIZATION=Platform Control
```

The password must be at least 12 characters. On startup the server hashes the password, marks the account as active/verified, and assigns all available roles so you can switch contexts without separate logins. Leave these variables empty to skip creating the master account.

## Development

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
npm run db:push
```

### Building for Production
```bash
npm run build
```

## License

Copyright © 2025. All rights reserved.

## Support

For support and questions, please contact the development team.
# NVC-Internal-System-
# interneal-system-
# interneal-system-

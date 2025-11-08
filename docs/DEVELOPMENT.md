# Development Guide - ILS 2.0

Comprehensive guide for local development, debugging, and troubleshooting.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Database Management](#database-management)
- [Running the Application](#running-the-application)
- [Development Tools](#development-tools)
- [Debugging](#debugging)
- [Working with AI Services](#working-with-ai-services)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Common Development Tasks](#common-development-tasks)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

---

## Environment Setup

### Prerequisites Installation

**macOS:**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js 20
brew install node@20

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Install Redis (optional)
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql-15 postgresql-contrib
sudo systemctl start postgresql

# Install Redis (optional)
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Windows:**
```powershell
# Install via Chocolatey
choco install nodejs-lts postgresql redis-64

# Or download installers:
# Node.js: https://nodejs.org/
# PostgreSQL: https://www.postgresql.org/download/windows/
# Redis: https://redis.io/docs/getting-started/installation/install-redis-on-windows/
```

### Project Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/newvantageco/ILS2.0.git
   cd ILS2.0
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://postgres:password@localhost:5432/ils2_dev"

   # Session (generate with: openssl rand -base64 32)
   SESSION_SECRET="your-secure-random-string"

   # AI Services (optional for basic development)
   OPENAI_API_KEY="sk-..."
   ANTHROPIC_API_KEY="sk-ant-..."

   # Development
   NODE_ENV="development"
   PORT="5000"
   ```

3. **Set up database:**
   ```bash
   # Create database
   createdb ils2_dev

   # Push schema to database
   npm run db:push

   # (Optional) Seed with test data
   npm run db:seed
   ```

4. **Verify installation:**
   ```bash
   npm run dev
   ```

   Visit http://localhost:5000 - you should see the login page.

---

## Database Management

### Drizzle Studio

Visual database browser and editor:

```bash
# Open Drizzle Studio
npm run db:studio
```

Access at http://localhost:4983

**Features:**
- Browse all tables and relationships
- Edit data directly
- Run custom queries
- View schema

### Schema Changes

**Development workflow:**

1. **Edit schema:**
   ```typescript
   // shared/schema.ts
   export const myNewTable = pgTable('my_new_table', {
     id: text('id').primaryKey().default(sql`gen_random_uuid()`),
     companyId: text('company_id').notNull(),
     name: text('name').notNull(),
     createdAt: timestamp('created_at').defaultNow(),
   });
   ```

2. **Push to development database:**
   ```bash
   npm run db:push
   ```

   This directly syncs your schema to the database (no migrations needed for dev).

3. **For production, generate migration:**
   ```bash
   npm run db:generate
   # Creates migration file in drizzle/migrations/

   npm run db:migrate
   # Applies migration to database
   ```

### Database Utilities

**Reset database:**
```bash
# WARNING: Deletes all data
dropdb ils2_dev
createdb ils2_dev
npm run db:push
```

**Backup database:**
```bash
pg_dump ils2_dev > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore database:**
```bash
psql ils2_dev < backup_20240115_143000.sql
```

**Query database directly:**
```bash
psql ils2_dev

# Example queries
SELECT * FROM users LIMIT 10;
SELECT * FROM patients WHERE company_id = 'comp_123';
\dt  -- List all tables
\d patients  -- Describe patients table
```

---

## Running the Application

### Development Mode

**Full stack (recommended):**
```bash
npm run dev
```

This runs:
- Vite dev server (frontend) on port 5173
- Express API server (backend) on port 5000
- Hot reload for both frontend and backend

**Frontend only:**
```bash
cd client
npm run dev
```

**Backend only:**
```bash
npm run server
```

### Production Mode

**Build and preview:**
```bash
npm run build
npm run preview
```

**Production server:**
```bash
NODE_ENV=production npm start
```

### Multiple Terminal Setup

**Terminal 1 - Application:**
```bash
npm run dev
```

**Terminal 2 - Tests:**
```bash
npm run test:components -- --watch
```

**Terminal 3 - Database:**
```bash
npm run db:studio
```

**Terminal 4 - Git/Commands:**
```bash
# Available for git commands, inspections, etc.
```

---

## Development Tools

### VS Code Extensions

**Essential:**
- **ESLint** - JavaScript linting
- **TypeScript** - Language support
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **Prettier** - Code formatting (if configured)

**Recommended:**
- **GitLens** - Git visualization
- **Error Lens** - Inline error highlighting
- **REST Client** - API testing
- **SQLTools** - Database browsing

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/dist": true
  }
}
```

### Browser DevTools

**React DevTools:**
- Install React DevTools extension for Chrome/Firefox
- Inspect component props and state
- Profile component renders

**Redux DevTools (if using Redux):**
- Time-travel debugging
- Action inspection
- State diff visualization

---

## Debugging

### Backend Debugging

**Console logging:**
```typescript
// Structured logging
console.info('Processing order', { orderId, status });
console.error('Failed to create patient', { error, patientData });
console.debug('Database query', { query, params });
```

**VS Code debugger:**

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "server"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

**Set breakpoints and use:**
- F5 to start debugging
- F10 to step over
- F11 to step into
- Inspect variables in debug panel

**Database query debugging:**
```typescript
// Log all Drizzle queries
import { db } from './db';

db.$client.on('query', (e) => {
  console.debug('Query:', e.query);
  console.debug('Params:', e.params);
});
```

### Frontend Debugging

**React DevTools:**
```typescript
// Add display names for debugging
export function MyComponent() {
  // Component logic
}
MyComponent.displayName = 'MyComponent';
```

**TanStack Query DevTools:**

Already included in development mode. View at bottom-right of screen:
- Query status
- Cache data
- Mutation status
- Refetch controls

**Console debugging:**
```typescript
// Debug component renders
useEffect(() => {
  console.debug('Component mounted', { props });
  return () => console.debug('Component unmounted');
}, []);

// Debug state changes
useEffect(() => {
  console.debug('State changed', { oldValue, newValue });
}, [value]);
```

### Network Debugging

**Chrome DevTools Network Tab:**
- Filter by "Fetch/XHR"
- Inspect request/response headers
- View response payloads
- Monitor timing

**API request logging:**
```typescript
// Log all API requests
import axios from 'axios';

axios.interceptors.request.use(config => {
  console.debug('API Request:', {
    method: config.method,
    url: config.url,
    data: config.data
  });
  return config;
});

axios.interceptors.response.use(
  response => {
    console.debug('API Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);
```

---

## Working with AI Services

### Local Development (Optional AI)

The application works without AI services for basic development:

```env
# .env - Comment out AI keys
# OPENAI_API_KEY="sk-..."
# ANTHROPIC_API_KEY="sk-ant-..."
```

AI features will gracefully fail with user-friendly messages.

### OpenAI Integration

**Setup:**
```env
OPENAI_API_KEY="sk-proj-..."
```

**Test in code:**
```typescript
// server/services/MasterAIService.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test connection
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 50,
});

console.log('OpenAI response:', response.choices[0].message.content);
```

**Development tips:**
- Use `gpt-3.5-turbo` for faster/cheaper testing
- Set low `max_tokens` during development
- Mock AI responses in tests
- Monitor usage at https://platform.openai.com/usage

### Anthropic Claude Integration

**Setup:**
```env
ANTHROPIC_API_KEY="sk-ant-..."
```

**Test in code:**
```typescript
// server/services/OphthalamicAIService.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Test connection
const message = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 50,
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log('Claude response:', message.content[0].text);
```

### Python RAG Service (Optional)

**Start Python service:**
```bash
cd python-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**Configure:**
```env
PYTHON_SERVICE_URL="http://localhost:8000"
```

---

## API Development

### Creating New Endpoints

**1. Define route:**
```typescript
// server/routes/myFeature.ts
import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Request validation schema
const createItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

/**
 * @openapi
 * /api/my-feature/items:
 *   post:
 *     summary: Create new item
 *     tags: [MyFeature]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item created successfully
 */
router.post(
  '/items',
  isAuthenticated,
  validateRequest(createItemSchema),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const companyId = req.user!.companyId;

      // Business logic here
      const item = await createItem({ name, description, companyId });

      res.status(201).json(item);
    } catch (error) {
      console.error('Failed to create item:', error);
      res.status(500).json({ error: 'Failed to create item' });
    }
  }
);

export default router;
```

**2. Register route:**
```typescript
// server/routes.ts
import myFeatureRoutes from './routes/myFeature';

app.use('/api/my-feature', myFeatureRoutes);
```

**3. Test with curl:**
```bash
# Login first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt

# Test endpoint
curl -X POST http://localhost:5000/api/my-feature/items \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Test Item"}'
```

### API Testing

**Using REST Client (VS Code):**

Create `api-tests.http`:

```http
### Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password"
}

### Create Item
POST http://localhost:5000/api/my-feature/items
Content-Type: application/json

{
  "name": "Test Item",
  "description": "Test description"
}
```

**Using Postman:**
1. Import collection from `/api-docs.json`
2. Set up environment variables
3. Create request collections
4. Share with team

---

## Frontend Development

### Component Development Workflow

**1. Create component:**
```typescript
// client/src/components/MyComponent.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={onAction}>Action</Button>
      </CardContent>
    </Card>
  );
}
```

**2. Add to Storybook (if configured):**
```typescript
// client/src/components/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  args: {
    title: 'Example Title',
  },
};
```

**3. Use in page:**
```typescript
// client/src/pages/MyPage.tsx
import { MyComponent } from '@/components/MyComponent';

export default function MyPage() {
  return (
    <div>
      <MyComponent
        title="Dashboard"
        onAction={() => console.log('Action clicked')}
      />
    </div>
  );
}
```

### Data Fetching with TanStack Query

**Setup query:**
```typescript
// client/src/hooks/useItems.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await fetch('/api/my-feature/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    },
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await fetch('/api/my-feature/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create item');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch items query
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
```

**Use in component:**
```typescript
function MyComponent() {
  const { data: items, isLoading } = useItems();
  const createItem = useCreateItem();

  const handleCreate = () => {
    createItem.mutate({ name: 'New Item' });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleCreate}>Create Item</button>
      {items?.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}
```

---

## Common Development Tasks

### Adding a Form

**Using React Hook Form + Zod:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof formSchema>;

export function PatientForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input {...register('firstName')} placeholder="First Name" />
        {errors.firstName && (
          <p className="text-red-500 text-sm">{errors.firstName.message}</p>
        )}
      </div>

      <div>
        <Input {...register('lastName')} placeholder="Last Name" />
        {errors.lastName && (
          <p className="text-red-500 text-sm">{errors.lastName.message}</p>
        )}
      </div>

      <div>
        <Input {...register('email')} type="email" placeholder="Email" />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Adding a Modal/Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function CreatePatientDialog() {
  const [open, setOpen] = useState(false);

  const handleSubmit = (data: FormData) => {
    // Handle form submission
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Patient</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Patient</DialogTitle>
        </DialogHeader>
        <PatientForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
```

### Adding a Table

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function PatientsTable({ patients }: { patients: Patient[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => (
          <TableRow key={patient.id}>
            <TableCell>{patient.firstName} {patient.lastName}</TableCell>
            <TableCell>{patient.email}</TableCell>
            <TableCell>{patient.phone}</TableCell>
            <TableCell>
              <Button size="sm" variant="outline">Edit</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## Performance Optimization

### Frontend Performance

**Code splitting:**
```typescript
// Lazy load routes
import { lazy, Suspense } from 'react';

const PatientsPage = lazy(() => import('./pages/Patients'));
const OrdersPage = lazy(() => import('./pages/Orders'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
      </Routes>
    </Suspense>
  );
}
```

**Memoization:**
```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive component
export const PatientCard = memo(({ patient }: { patient: Patient }) => {
  return <div>{patient.name}</div>;
});

// Memoize expensive calculation
function OrderSummary({ orders }: { orders: Order[] }) {
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.totalPrice, 0);
  }, [orders]);

  return <div>Total: £{totalRevenue}</div>;
}

// Memoize callback
function ParentComponent() {
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);

  return <ChildComponent onClick={handleClick} />;
}
```

**Query optimization:**
```typescript
// Prefetch data
const queryClient = useQueryClient();

queryClient.prefetchQuery({
  queryKey: ['patients'],
  queryFn: fetchPatients,
});

// Stale time to reduce refetches
useQuery({
  queryKey: ['patients'],
  queryFn: fetchPatients,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Backend Performance

**Database indexing:**
```typescript
// Add indexes for frequently queried fields
export const patients = pgTable('patients', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  email: text('email'),
}, (table) => ({
  companyIdIdx: index('patients_company_id_idx').on(table.companyId),
  emailIdx: index('patients_email_idx').on(table.email),
}));
```

**Query optimization:**
```typescript
// Bad - N+1 query problem
const orders = await db.select().from(schema.orders);
for (const order of orders) {
  order.patient = await db.select()
    .from(schema.patients)
    .where(eq(schema.patients.id, order.patientId));
}

// Good - Join query
const orders = await db.select()
  .from(schema.orders)
  .leftJoin(schema.patients, eq(schema.orders.patientId, schema.patients.id));
```

**Caching:**
```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

export async function getPatient(id: string) {
  const cached = cache.get(id);
  if (cached) return cached;

  const patient = await db.select()
    .from(schema.patients)
    .where(eq(schema.patients.id, id));

  cache.set(id, patient);
  return patient;
}
```

---

## Troubleshooting

### Common Issues

**1. Port already in use:**
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=5001 npm run dev
```

**2. Database connection errors:**
```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql  # Linux
```

**3. Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .vite
npm run build
```

**4. TypeScript errors:**
```bash
# Restart TypeScript server in VS Code
Cmd+Shift+P -> "TypeScript: Restart TS Server"

# Check types without build
npm run type-check
```

**5. Hot reload not working:**
```bash
# Restart dev server
# Increase file watcher limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Debug Checklist

When something isn't working:

1. **Check console** for errors (both browser and server)
2. **Verify environment variables** are set correctly
3. **Check database connection** and data
4. **Clear caches** (browser, node_modules, build)
5. **Restart services** (database, Redis, dev server)
6. **Check logs** for detailed error messages
7. **Verify dependencies** are installed (`npm install`)
8. **Check branch** is up to date (`git pull`)

---

## Additional Resources

### Documentation
- [Testing Guide](./TESTING.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [API Documentation](http://localhost:5000/api-docs)

### External Docs
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Happy coding! 🚀**

Last Updated: November 2024

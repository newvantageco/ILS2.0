# Multi-Tenant Development Guide

## Quick Reference for Developers

This guide ensures you maintain multi-tenant compliance when adding new features to the Integrated Lens System.

---

## 🚀 Quick Start Checklist

When creating a new feature, ensure:

- [ ] Database table includes `companyId` foreign key
- [ ] Index created on `companyId` column
- [ ] Cascade delete configured
- [ ] API routes filter by `req.user.companyId`
- [ ] Create operations set `companyId`
- [ ] Update/delete operations validate ownership
- [ ] Frontend doesn't manipulate `companyId`
- [ ] Tests verify cross-company isolation

---

## 📝 Database Tables

### ✅ Correct Pattern

```typescript
export const yourTable = pgTable("your_table", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // ✅ REQUIRED: Add companyId foreign key
  companyId: varchar("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  
  // ✅ REQUIRED: Add user reference if applicable
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  
  // Your other columns...
  name: varchar("name").notNull(),
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // ✅ REQUIRED: Add index on companyId
  index("idx_your_table_company").on(table.companyId),
  
  // Optional: Add compound indexes if needed
  index("idx_your_table_company_user").on(table.companyId, table.userId),
]);
```

### ❌ Incorrect Pattern

```typescript
export const yourTable = pgTable("your_table", {
  id: varchar("id").primaryKey(),
  
  // ❌ WRONG: Missing companyId
  userId: varchar("user_id").references(() => users.id),
  
  name: varchar("name"),
});
```

---

## 🔌 API Routes

### ✅ Correct Pattern: GET (List)

```typescript
router.get('/items', async (req: Request, res: Response) => {
  try {
    // ✅ Extract companyId from authenticated user
    const companyId = req.user!.companyId;
    
    if (!companyId) {
      return res.status(401).json({ error: 'Company ID not found' });
    }
    
    // ✅ Filter by companyId
    const items = await db
      .select()
      .from(yourTable)
      .where(eq(yourTable.companyId, companyId))
      .orderBy(yourTable.createdAt);
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});
```

### ✅ Correct Pattern: GET (Single Item)

```typescript
router.get('/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // ✅ Filter by both ID and companyId
    const [item] = await db
      .select()
      .from(yourTable)
      .where(and(
        eq(yourTable.id, id),
        eq(yourTable.companyId, companyId)  // ✅ Prevents cross-company access
      ))
      .limit(1);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});
```

### ✅ Correct Pattern: POST (Create)

```typescript
router.post('/items', async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { name, description } = req.body;
    
    // ✅ Set companyId from authenticated user (not from request body!)
    const [newItem] = await db
      .insert(yourTable)
      .values({
        companyId,  // ✅ From session, not request
        userId,
        name,
        description,
      })
      .returning();
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});
```

### ✅ Correct Pattern: PUT (Update)

```typescript
router.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const { name, description } = req.body;
    
    // ✅ First verify ownership
    const [existing] = await db
      .select()
      .from(yourTable)
      .where(and(
        eq(yourTable.id, id),
        eq(yourTable.companyId, companyId)
      ))
      .limit(1);
    
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // ✅ Update with company verification
    const [updated] = await db
      .update(yourTable)
      .set({
        name,
        description,
        updatedAt: new Date(),
      })
      .where(and(
        eq(yourTable.id, id),
        eq(yourTable.companyId, companyId)  // ✅ Double-check company
      ))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});
```

### ✅ Correct Pattern: DELETE

```typescript
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // ✅ Verify ownership before deletion
    const [existing] = await db
      .select()
      .from(yourTable)
      .where(and(
        eq(yourTable.id, id),
        eq(yourTable.companyId, companyId)
      ))
      .limit(1);
    
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // ✅ Delete with company verification
    await db
      .delete(yourTable)
      .where(and(
        eq(yourTable.id, id),
        eq(yourTable.companyId, companyId)
      ));
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});
```

### ❌ Incorrect Patterns

```typescript
// ❌ WRONG: No company filter
router.get('/items', async (req, res) => {
  const items = await db.select().from(yourTable);  // Exposes all companies' data!
  res.json(items);
});

// ❌ WRONG: CompanyId from request body
router.post('/items', async (req, res) => {
  const { companyId, name } = req.body;  // User can specify any company!
  await db.insert(yourTable).values({ companyId, name });
});

// ❌ WRONG: No ownership verification
router.delete('/items/:id', async (req, res) => {
  await db.delete(yourTable).where(eq(yourTable.id, req.params.id));  // Can delete any company's data!
  res.status(204).send();
});
```

---

## 🎨 Frontend Components

### ✅ Correct Pattern

```typescript
// ✅ Frontend doesn't manipulate companyId
const MyComponent = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/items'],
    queryFn: async () => {
      const res = await fetch('/api/items', {
        credentials: 'include',  // ✅ Include auth cookies
      });
      return res.json();
    },
  });
  
  const createItem = async (data: ItemData) => {
    // ✅ No companyId in payload - backend sets it
    await fetch('/api/items', {
      method: 'POST',
      credentials: 'include',  // ✅ Include auth cookies
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };
  
  return <div>{/* Render items */}</div>;
};
```

### ❌ Incorrect Pattern

```typescript
// ❌ WRONG: Frontend specifies companyId
const createItem = async (data: ItemData) => {
  await fetch('/api/items', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      companyId: 'some-company-id',  // ❌ Never do this!
    }),
  });
};
```

---

## 📁 File Storage

### ✅ Correct Pattern

```typescript
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const companyId = req.user!.companyId;
    const uploadType = req.body.uploadType || 'document';
    
    // ✅ Use company-specific directory
    const dir = getCompanyDirectory(companyId, uploadType);
    const filename = generateUniqueFilename(req.file);
    const filePath = path.join(dir, filename);
    
    // Save file...
    
    // ✅ Include companyId in URL
    const url = `/uploads/${companyId}/${uploadType}/${filename}`;
    
    res.json({ url, filename });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Helper function
const getCompanyDirectory = (companyId: string, uploadType: string): string => {
  const baseDir = path.join(uploadsDir, companyId);
  const typeDir = path.join(baseDir, uploadType);
  
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true });
  }
  
  return typeDir;
};
```

### ❌ Incorrect Pattern

```typescript
// ❌ WRONG: Shared directory for all companies
router.post('/upload', upload.single('file'), async (req, res) => {
  const filename = req.file.originalname;
  const filePath = path.join(uploadsDir, filename);  // ❌ No company isolation!
  // All companies' files mixed together!
});
```

---

## 🧪 Testing

### ✅ Required Test Cases

```typescript
describe('Multi-Tenant Isolation', () => {
  let companyA: Company;
  let companyB: Company;
  let userA: User;
  let userB: User;
  
  beforeEach(async () => {
    companyA = await createTestCompany({ name: 'Company A' });
    companyB = await createTestCompany({ name: 'Company B' });
    userA = await createTestUser({ companyId: companyA.id });
    userB = await createTestUser({ companyId: companyB.id });
  });
  
  // ✅ Test 1: List should only show own company's data
  it('should only return items from user\'s company', async () => {
    await createItem({ companyId: companyA.id, name: 'Item A' });
    await createItem({ companyId: companyB.id, name: 'Item B' });
    
    const response = await request(app)
      .get('/api/items')
      .set('Authorization', `Bearer ${userA.token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('Item A');
  });
  
  // ✅ Test 2: Cannot access other company's item
  it('should return 404 when accessing another company\'s item', async () => {
    const itemB = await createItem({ companyId: companyB.id, name: 'Item B' });
    
    const response = await request(app)
      .get(`/api/items/${itemB.id}`)
      .set('Authorization', `Bearer ${userA.token}`);
    
    expect(response.status).toBe(404);
  });
  
  // ✅ Test 3: Cannot update other company's item
  it('should return 404 when updating another company\'s item', async () => {
    const itemB = await createItem({ companyId: companyB.id, name: 'Item B' });
    
    const response = await request(app)
      .put(`/api/items/${itemB.id}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: 'Hacked' });
    
    expect(response.status).toBe(404);
  });
  
  // ✅ Test 4: Cannot delete other company's item
  it('should return 404 when deleting another company\'s item', async () => {
    const itemB = await createItem({ companyId: companyB.id, name: 'Item B' });
    
    const response = await request(app)
      .delete(`/api/items/${itemB.id}`)
      .set('Authorization', `Bearer ${userA.token}`);
    
    expect(response.status).toBe(404);
    
    // Verify item still exists
    const item = await getItem(itemB.id);
    expect(item).toBeDefined();
  });
  
  // ✅ Test 5: Create should set companyId from session
  it('should set companyId from authenticated user', async () => {
    const response = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: 'New Item' });
    
    expect(response.status).toBe(201);
    expect(response.body.companyId).toBe(companyA.id);
  });
});
```

---

## 🔍 Code Review Checklist

When reviewing pull requests, verify:

### Database Changes
- [ ] New tables have `companyId` foreign key with `onDelete: 'cascade'`
- [ ] Index added on `companyId` column
- [ ] Migration script includes proper constraints
- [ ] Schema types exported correctly

### API Routes
- [ ] All GET routes filter by `companyId`
- [ ] POST routes set `companyId` from `req.user.companyId`
- [ ] PUT/PATCH routes verify ownership before update
- [ ] DELETE routes verify ownership before deletion
- [ ] No `companyId` accepted from request body/params
- [ ] Error messages don't leak cross-company information

### File Operations
- [ ] Files stored in company-specific directories
- [ ] File paths include `companyId`
- [ ] File deletion scoped to company
- [ ] No shared directories between companies

### Frontend Code
- [ ] API calls include `credentials: 'include'`
- [ ] No hardcoded company identifiers
- [ ] No `companyId` in request payloads
- [ ] Error handling for unauthorized access

### Tests
- [ ] Cross-company access tests included
- [ ] Ownership verification tests included
- [ ] Cascade delete tests for new tables
- [ ] Tests cover all CRUD operations

---

## 🚨 Common Mistakes to Avoid

### 1. ❌ Trusting Client-Provided CompanyId

```typescript
// ❌ NEVER DO THIS
router.post('/items', async (req, res) => {
  const { companyId, name } = req.body;  // ❌ Client provides companyId
  await db.insert(yourTable).values({ companyId, name });
});

// ✅ ALWAYS DO THIS
router.post('/items', async (req, res) => {
  const companyId = req.user!.companyId;  // ✅ From session
  const { name } = req.body;
  await db.insert(yourTable).values({ companyId, name });
});
```

### 2. ❌ Forgetting Company Filter on Queries

```typescript
// ❌ NEVER DO THIS
const items = await db.select().from(yourTable);  // Returns all companies!

// ✅ ALWAYS DO THIS
const companyId = req.user!.companyId;
const items = await db.select().from(yourTable)
  .where(eq(yourTable.companyId, companyId));
```

### 3. ❌ Not Verifying Ownership on Updates/Deletes

```typescript
// ❌ NEVER DO THIS
router.delete('/items/:id', async (req, res) => {
  await db.delete(yourTable).where(eq(yourTable.id, req.params.id));
  // Can delete any company's data!
});

// ✅ ALWAYS DO THIS
router.delete('/items/:id', async (req, res) => {
  const companyId = req.user!.companyId;
  
  // Verify ownership first
  const [item] = await db.select()
    .from(yourTable)
    .where(and(
      eq(yourTable.id, req.params.id),
      eq(yourTable.companyId, companyId)
    ));
  
  if (!item) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  await db.delete(yourTable).where(eq(yourTable.id, req.params.id));
});
```

### 4. ❌ Using Shared File Directories

```typescript
// ❌ NEVER DO THIS
const filePath = path.join(uploadsDir, filename);  // Shared directory!

// ✅ ALWAYS DO THIS
const companyId = req.user!.companyId;
const dir = path.join(uploadsDir, companyId, 'documents');
const filePath = path.join(dir, filename);
```

### 5. ❌ Missing Cascade Delete

```typescript
// ❌ NEVER DO THIS
companyId: varchar("company_id").references(() => companies.id)

// ✅ ALWAYS DO THIS
companyId: varchar("company_id")
  .notNull()
  .references(() => companies.id, { onDelete: 'cascade' })
```

---

## 📚 Related Resources

- [Multi-Tenant Audit Report](./MULTI_TENANT_AUDIT_REPORT.md) - Comprehensive audit of current implementation
- [Multi-Tenant Upload System](./MULTI_TENANT_UPLOAD_SYSTEM.md) - File storage isolation guide
- [Database Schema](./shared/schema.ts) - Complete schema with multi-tenant examples
- [Authentication Middleware](./server/middleware/auth.ts) - How companyId is extracted

---

## 💡 Need Help?

**Before adding a new feature:**
1. Review this guide
2. Check similar existing features in the codebase
3. Write tests first (TDD approach)
4. Have your code reviewed with this checklist

**When in doubt:**
- Always filter by `companyId`
- Never trust client-provided `companyId`
- Test cross-company access scenarios
- Verify cascade delete behavior

---

**Remember:** Multi-tenant isolation is a **security requirement**, not a feature. Every line of code must respect company boundaries.

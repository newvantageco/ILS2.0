# Multi-Tenant Compliance Checklist

Use this checklist when adding new features or reviewing pull requests to ensure multi-tenant compliance.

---

## 🗃️ Database Changes

### New Table
- [ ] Table includes `companyId` column
- [ ] `companyId` has foreign key to `companies.id`
- [ ] Foreign key includes `onDelete: 'cascade'`
- [ ] `companyId` column is marked as `notNull()`
- [ ] Index created on `companyId` column
- [ ] If applicable, compound index with `companyId` + other common query fields
- [ ] Migration script includes all constraints
- [ ] Schema types exported in schema.ts

**Example:**
```typescript
export const myTable = pgTable("my_table", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  // other columns...
}, (table) => [
  index("idx_my_table_company").on(table.companyId),
]);
```

### Table Modification
- [ ] Changes don't bypass company isolation
- [ ] Migration preserves `companyId` constraints
- [ ] Indexes updated if query patterns change

---

## 🔌 API Route Changes

### GET (List) Route
- [ ] Extracts `companyId` from `req.user.companyId`
- [ ] Returns 401 if `companyId` is missing
- [ ] Query filters by `companyId`
- [ ] No company data leaked in error messages
- [ ] Pagination preserves company filter

**Example:**
```typescript
router.get('/items', async (req, res) => {
  const companyId = req.user!.companyId;
  
  if (!companyId) {
    return res.status(401).json({ error: 'Company not found' });
  }
  
  const items = await db.select()
    .from(items)
    .where(eq(items.companyId, companyId));
  
  res.json(items);
});
```

### GET (Single) Route
- [ ] Extracts `companyId` from `req.user.companyId`
- [ ] Query filters by both `id` AND `companyId`
- [ ] Returns 404 if not found (not 403 - avoid info leak)
- [ ] No cross-company data in response

**Example:**
```typescript
router.get('/items/:id', async (req, res) => {
  const companyId = req.user!.companyId;
  const { id } = req.params;
  
  const [item] = await db.select()
    .from(items)
    .where(and(
      eq(items.id, id),
      eq(items.companyId, companyId)
    ));
  
  if (!item) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.json(item);
});
```

### POST (Create) Route
- [ ] Extracts `companyId` from `req.user.companyId`
- [ ] Sets `companyId` on new record
- [ ] Does NOT accept `companyId` from request body
- [ ] Validates user belongs to company
- [ ] Returns created record with correct `companyId`

**Example:**
```typescript
router.post('/items', async (req, res) => {
  const companyId = req.user!.companyId;
  const { name, description } = req.body;  // No companyId here!
  
  const [item] = await db.insert(items)
    .values({
      companyId,  // From session
      name,
      description,
    })
    .returning();
  
  res.status(201).json(item);
});
```

### PUT/PATCH (Update) Route
- [ ] Extracts `companyId` from `req.user.companyId`
- [ ] Verifies record exists and belongs to company
- [ ] Returns 404 if not found (not 403)
- [ ] Update query includes `companyId` filter
- [ ] Does NOT allow updating `companyId`

**Example:**
```typescript
router.put('/items/:id', async (req, res) => {
  const companyId = req.user!.companyId;
  const { id } = req.params;
  const { name } = req.body;
  
  // Verify ownership
  const [existing] = await db.select()
    .from(items)
    .where(and(
      eq(items.id, id),
      eq(items.companyId, companyId)
    ));
  
  if (!existing) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  // Update with company filter
  const [updated] = await db.update(items)
    .set({ name })
    .where(and(
      eq(items.id, id),
      eq(items.companyId, companyId)
    ))
    .returning();
  
  res.json(updated);
});
```

### DELETE Route
- [ ] Extracts `companyId` from `req.user.companyId`
- [ ] Verifies record exists and belongs to company
- [ ] Returns 404 if not found (not 403)
- [ ] Delete query includes `companyId` filter

**Example:**
```typescript
router.delete('/items/:id', async (req, res) => {
  const companyId = req.user!.companyId;
  const { id } = req.params;
  
  // Verify ownership
  const [existing] = await db.select()
    .from(items)
    .where(and(
      eq(items.id, id),
      eq(items.companyId, companyId)
    ));
  
  if (!existing) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  await db.delete(items)
    .where(and(
      eq(items.id, id),
      eq(items.companyId, companyId)
    ));
  
  res.status(204).send();
});
```

### Admin Override Route (if applicable)
- [ ] Checks if user is platform_admin
- [ ] Returns 403 for non-admin users
- [ ] Logs admin actions
- [ ] Includes reason/justification for access

---

## 📁 File Storage Changes

### Upload Route
- [ ] Extracts `companyId` from `req.user.companyId`
- [ ] Uses company-specific directory
- [ ] Generates unique filename (UUID-based)
- [ ] Returns URL with `companyId` in path
- [ ] Creates directory if not exists

**Example:**
```typescript
router.post('/upload', upload.single('file'), async (req, res) => {
  const companyId = req.user!.companyId;
  const dir = getCompanyDirectory(companyId, 'documents');
  
  // Save file to company directory...
  
  const url = `/uploads/${companyId}/documents/${filename}`;
  res.json({ url });
});
```

### File Delete Route
- [ ] Extracts `companyId` from `req.user.companyId`
- [ ] Verifies file belongs to company
- [ ] Uses company-specific directory for deletion
- [ ] Returns 404 if file not found

### File Access Route
- [ ] Extracts `companyId` from `req.user.companyId`
- [ ] Verifies file belongs to company
- [ ] Returns 404 if file not found
- [ ] URL includes `companyId`

---

## 🎨 Frontend Changes

### Component
- [ ] Doesn't hardcode `companyId`
- [ ] Doesn't accept `companyId` as prop
- [ ] API calls include `credentials: 'include'`
- [ ] Doesn't send `companyId` in request body
- [ ] Handles 401/403 errors appropriately

**Example:**
```typescript
const MyComponent = () => {
  const { data } = useQuery({
    queryKey: ['/api/items'],
    queryFn: async () => {
      const res = await fetch('/api/items', {
        credentials: 'include',  // ✅
      });
      return res.json();
    },
  });
  
  const createItem = async (data) => {
    await fetch('/api/items', {
      method: 'POST',
      credentials: 'include',  // ✅
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),  // No companyId ✅
    });
  };
  
  return <div>...</div>;
};
```

### API Client
- [ ] Includes authentication headers/cookies
- [ ] Doesn't manipulate `companyId`
- [ ] Error handling for unauthorized access
- [ ] No company-specific hardcoded values

---

## 🧪 Testing

### Required Tests
- [ ] **List Test**: User can only see their company's records
- [ ] **Get Test**: User can only access their company's record
- [ ] **Cross-Company Get Test**: User gets 404 for other company's record
- [ ] **Create Test**: New record has correct `companyId`
- [ ] **Update Test**: User can update their company's record
- [ ] **Cross-Company Update Test**: User gets 404 updating other company's record
- [ ] **Delete Test**: User can delete their company's record
- [ ] **Cross-Company Delete Test**: User gets 404 deleting other company's record
- [ ] **Cascade Delete Test**: Deleting company removes all related records

**Example Test:**
```typescript
describe('Multi-Tenant Isolation', () => {
  it('should prevent cross-company access', async () => {
    const companyA = await createCompany();
    const companyB = await createCompany();
    const userA = await createUser({ companyId: companyA.id });
    const itemB = await createItem({ companyId: companyB.id });
    
    const response = await request(app)
      .get(`/api/items/${itemB.id}`)
      .set('Authorization', `Bearer ${userA.token}`);
    
    expect(response.status).toBe(404);
  });
});
```

---

## 📝 Documentation

- [ ] Updated API documentation with company scoping
- [ ] Added to route table in documentation
- [ ] Documented any admin override behavior
- [ ] Updated OpenAPI/Swagger specs if applicable
- [ ] Added examples to developer guide if new pattern

---

## 🔍 Code Review Questions

### For Reviewer
1. Does this code filter by `companyId`?
2. Can a user access another company's data?
3. Is `companyId` coming from session or request?
4. Are there cross-company isolation tests?
5. Does cascade delete work correctly?
6. Are error messages leaking company info?
7. Is file storage company-isolated?
8. Does the frontend specify `companyId`?

### For Developer
1. Have you tested cross-company access?
2. Have you verified cascade delete?
3. Have you added the required tests?
4. Have you checked for information leaks?
5. Have you reviewed the dev guide?

---

## ⚠️ Red Flags

### Immediate Rejection
- ❌ `companyId` accepted from request body/params
- ❌ Query without `companyId` filter on company-scoped table
- ❌ Shared file directory for all companies
- ❌ Hardcoded `companyId` in frontend
- ❌ Missing cascade delete on new foreign key
- ❌ No cross-company access tests

### Requires Discussion
- ⚠️ New platform-wide table without company scoping
- ⚠️ Admin override without logging
- ⚠️ Static file serving without authentication
- ⚠️ Error message includes company-specific data

---

## ✅ Sign-Off

Once all items are checked:

- [ ] All database checklist items completed
- [ ] All API route checklist items completed
- [ ] All file storage checklist items completed (if applicable)
- [ ] All frontend checklist items completed
- [ ] All tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed by second developer
- [ ] No red flags present

**Reviewer Name:** _________________  
**Review Date:** _________________  
**Approval:** ☐ Approved ☐ Needs Changes  

---

## 📚 Quick Links

- [Multi-Tenant Development Guide](./MULTI_TENANT_DEV_GUIDE.md)
- [Multi-Tenant Audit Report](./MULTI_TENANT_AUDIT_REPORT.md)
- [Multi-Tenant Upload System](./MULTI_TENANT_UPLOAD_SYSTEM.md)
- [Complete Implementation Summary](./MULTI_TENANT_COMPLETE.md)

---

**Remember:** Multi-tenant isolation is a security requirement. Every feature must respect company boundaries.

**When in doubt, ask:** "Can a user from Company A access Company B's data with this code?"

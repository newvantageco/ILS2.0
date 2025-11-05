# Chunk 10: Infrastructure Scale Implementation Plan

**Estimated Time:** 12-16 hours  
**Complexity:** High  
**Status:** Ready to implement

---

## Overview

Chunk 10 upgrades the infrastructure for production scalability:
1. **Redis Sessions** - Replace PostgreSQL sessions with Redis (faster, scalable)
2. **S3 File Storage** - Migrate file uploads from local storage to AWS S3
3. **WebSocket Real-Time** - Add real-time updates for orders, inventory, notifications

**Dependencies:**
- ✅ Chunk 8: Background Job Queue (Redis already initialized)
- ✅ Chunk 9: Event-Driven Architecture (WebSocket broadcaster exists)

---

## Current State Analysis

### What We Already Have

**1. Redis Connection (Chunk 8)**
```typescript
// server/workers/redis.ts
export const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
```
✅ Redis is already connected and running for job queues

**2. WebSocket Broadcaster (Chunk 9)**
```typescript
// server/events/websocket/WebSocketBroadcaster.ts
export class WebSocketBroadcaster {
  static broadcastToUser(userId, event)
  static broadcastToCompany(companyId, event)
  static broadcastToAll(event)
}
```
✅ WebSocket system is already implemented

**3. Session Store (Current)**
```typescript
// server/index.ts - Currently using PostgreSQL
app.use(session({
  store: new PgStore({ pool: pgPool }),
  // ...
}));
```
❌ Need to migrate to Redis

**4. File Storage (Current)**
```typescript
// server/routes/upload.ts - Currently using local disk
const storage = multer.diskStorage({
  destination: './uploads/',
  // ...
});
```
❌ Need to migrate to S3

---

## Implementation Tasks

### Part 1: Redis Session Store (4 hours)

**Why:** PostgreSQL sessions don't scale well. Redis is 50-100x faster for session operations.

**Tasks:**
1. Install `connect-redis` package
2. Replace PgStore with RedisStore
3. Test session persistence
4. Remove old PostgreSQL session table (optional)

**Files to Modify:**
- `server/index.ts` - Replace session store
- `package.json` - Add connect-redis dependency
- `shared/schema.ts` - Mark session table as deprecated (optional)

---

### Part 2: S3 File Storage (6 hours)

**Why:** Local disk storage doesn't work in containerized/cloud environments. S3 is scalable and durable.

**Tasks:**
1. Install AWS SDK v3 packages
2. Create StorageService abstraction
3. Update upload routes to use S3
4. Migrate existing files (if any)
5. Add environment variables

**New Files:**
- `server/services/StorageService.ts` - S3 upload/download abstraction
- `server/services/StorageService.test.ts` - Unit tests

**Files to Modify:**
- `server/routes/upload.ts` - Replace multer disk storage with S3
- `.env.example` - Add S3 configuration
- Any routes that handle file uploads

**Environment Variables:**
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=ils-production-files
S3_ENDPOINT=https://s3.amazonaws.com (or MinIO endpoint for local dev)
```

---

### Part 3: WebSocket Integration (2 hours)

**Note:** WebSocket system already exists from Chunk 9! We just need to integrate it with more events.

**Tasks:**
1. Verify WebSocket server is running
2. Add WebSocket endpoint documentation
3. Create frontend connection examples
4. Test real-time broadcasts

**Files to Document:**
- WebSocket connection guide
- Event subscription examples
- Frontend integration guide

---

## Detailed Implementation

### Part 1: Redis Session Store

#### Step 1.1: Install Dependencies
```bash
npm install connect-redis@7
```

#### Step 1.2: Update server/index.ts

**Before:**
```typescript
import connectPgSimple from "connect-pg-simple";
const PgStore = connectPgSimple(session);

app.use(session({
  store: new PgStore({
    pool: pgPool,
    createTableIfMissing: false,
  }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: app.get("env") === "production",
    sameSite: "lax",
  },
}));
```

**After:**
```typescript
import RedisStore from "connect-redis";
import { redisClient } from "./workers/redis";

app.use(session({
  store: new RedisStore({
    client: redisClient,
    prefix: "session:",
  }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: app.get("env") === "production",
    sameSite: "lax",
  },
}));
```

#### Step 1.3: Test Session Persistence

Create test endpoint:
```typescript
// server/routes/test.ts
router.get('/test-session', (req, res) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  res.json({ views: req.session.views });
});
```

Test:
```bash
# First request
curl -c cookies.txt http://localhost:3000/api/test-session
# {"views":1}

# Second request (with cookies)
curl -b cookies.txt http://localhost:3000/api/test-session
# {"views":2}
```

#### Step 1.4: Verify Redis Storage

```bash
# Connect to Redis
redis-cli

# List session keys
KEYS session:*

# View session data
GET session:abcd1234efgh5678
```

---

### Part 2: S3 File Storage

#### Step 2.1: Install Dependencies
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### Step 2.2: Create StorageService.ts

```typescript
// server/services/StorageService.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  } : undefined,
  endpoint: process.env.S3_ENDPOINT, // For MinIO local dev
  forcePathStyle: !!process.env.S3_ENDPOINT, // Required for MinIO
});

const bucket = process.env.S3_BUCKET || 'ils-files';

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read';
}

export class StorageService {
  /**
   * Upload a file to S3
   * @param key - File path/key (e.g., 'uploads/2025/11/file.pdf')
   * @param body - File buffer or stream
   * @param options - Upload options
   * @returns S3 URL
   */
  static async uploadFile(
    key: string,
    body: Buffer | Readable,
    options: UploadOptions = {}
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: options.contentType,
      Metadata: options.metadata,
      ACL: options.acl || 'private',
    });

    await s3Client.send(command);
    
    // Return public URL if public-read, otherwise return key
    if (options.acl === 'public-read') {
      return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
    
    return key; // Return key for private files
  }

  /**
   * Get a signed URL for private file access
   * @param key - File key
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Signed URL
   */
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Download a file from S3
   * @param key - File key
   * @returns File buffer
   */
  static async downloadFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    const stream = response.Body as Readable;
    
    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Delete a file from S3
   * @param key - File key
   */
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
  }

  /**
   * Check if file exists
   * @param key - File key
   * @returns true if exists
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Generate a unique file key
   * @param companyId - Company ID
   * @param filename - Original filename
   * @returns Unique key
   */
  static generateKey(companyId: string, filename: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    
    // uploads/{companyId}/{year}/{month}/{timestamp}-{random}-{filename}
    return `uploads/${companyId}/${year}/${month}/${timestamp}-${randomString}-${filename}`;
  }
}
```

#### Step 2.3: Update Upload Routes

```typescript
// server/routes/upload.ts (BEFORE)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});
```

```typescript
// server/routes/upload.ts (AFTER)
import multer from 'multer';
import { StorageService } from '../services/StorageService';

// Use memory storage for multer (don't write to disk)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const user = req.user as User;
    const key = StorageService.generateKey(user.companyId, req.file.originalname);

    // Upload to S3
    await StorageService.uploadFile(key, req.file.buffer, {
      contentType: req.file.mimetype,
      metadata: {
        originalName: req.file.originalname,
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Generate signed URL for immediate access
    const url = await StorageService.getSignedUrl(key);

    res.json({
      success: true,
      key,
      url,
      expiresIn: 3600, // 1 hour
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Endpoint to get signed URL for existing file
router.get('/file/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const url = await StorageService.getSignedUrl(key);
    res.json({ url });
  } catch (error: any) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Endpoint to delete file
router.delete('/file/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    await StorageService.deleteFile(key);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'File deletion failed' });
  }
});
```

#### Step 2.4: Environment Variables

```bash
# .env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=ils-production-files

# For local development with MinIO
# S3_ENDPOINT=http://localhost:9000
```

#### Step 2.5: Local Development with MinIO

```bash
# Install MinIO (macOS)
brew install minio/stable/minio

# Start MinIO server
mkdir -p ~/minio-data
minio server ~/minio-data --console-address :9001

# Access at http://localhost:9001
# Default credentials: minioadmin / minioadmin

# Create bucket via CLI
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/ils-files
```

---

### Part 3: WebSocket Integration

**Note:** WebSocket system already exists from Chunk 9!

#### Step 3.1: Verify WebSocket Server

```typescript
// server/events/websocket/WebSocketBroadcaster.ts (already exists)
export class WebSocketBroadcaster {
  static registerConnection(connectionId, socket, userId?, companyId?)
  static broadcastToUser(userId, event)
  static broadcastToCompany(companyId, event)
  static broadcastToAll(event)
}
```

#### Step 3.2: Frontend Connection Example

```typescript
// client/src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';

export function useWebSocket(onMessage: (event: any) => void) {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    ws.current = new WebSocket('ws://localhost:3000');

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.current?.close();
    };
  }, [onMessage]);

  return ws.current;
}
```

#### Step 3.3: Usage Example

```typescript
// client/src/components/OrdersList.tsx
import { useWebSocket } from '../hooks/useWebSocket';

export function OrdersList() {
  const [orders, setOrders] = useState([]);

  useWebSocket((event) => {
    if (event.type === 'order.created') {
      // Add new order to list
      setOrders(prev => [event.data, ...prev]);
    } else if (event.type === 'order.updated') {
      // Update existing order
      setOrders(prev => prev.map(order => 
        order.id === event.data.orderId 
          ? { ...order, ...event.data.changes }
          : order
      ));
    }
  });

  return <div>...</div>;
}
```

---

## Testing Plan

### Part 1: Redis Sessions

**Test 1: Session Persistence**
```bash
# Create session
curl -c cookies.txt -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Verify session works
curl -b cookies.txt http://localhost:3000/api/user
```

**Test 2: Session Expiration**
```bash
# Set session max age to 10 seconds
# Wait 10 seconds
# Verify session is gone
```

**Test 3: Redis Storage**
```bash
# Check Redis for session data
redis-cli KEYS "session:*"
```

### Part 2: S3 File Storage

**Test 1: File Upload**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.pdf" \
  -H "Authorization: Bearer $TOKEN"
```

**Test 2: File Download**
```bash
# Get signed URL
curl http://localhost:3000/api/file/uploads%2Fcompany123%2F2025%2F11%2Ftest.pdf

# Download file
curl -o downloaded.pdf "$SIGNED_URL"
```

**Test 3: File Deletion**
```bash
curl -X DELETE http://localhost:3000/api/file/uploads%2Fcompany123%2F2025%2F11%2Ftest.pdf
```

### Part 3: WebSocket Real-Time

**Test 1: Connection**
```javascript
const ws = new WebSocket('ws://localhost:3000');
ws.onopen = () => console.log('Connected');
```

**Test 2: Receive Events**
```javascript
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};

// In another terminal, create an order
// Should receive order.created event via WebSocket
```

**Test 3: Company Isolation**
```javascript
// Connect as User A (Company 1)
// Connect as User B (Company 2)
// Create order in Company 1
// Verify only User A receives the event
```

---

## File Structure

```
server/
├── services/
│   ├── StorageService.ts          # NEW - S3 file operations
│   └── StorageService.test.ts     # NEW - Unit tests
├── routes/
│   └── upload.ts                  # MODIFY - Use S3 instead of disk
├── index.ts                       # MODIFY - Use Redis sessions
└── events/
    └── websocket/
        └── WebSocketBroadcaster.ts # EXISTS - Already implemented
```

---

## Performance Improvements

### Redis Sessions
- **Before:** 50-100ms session lookup (PostgreSQL)
- **After:** 1-2ms session lookup (Redis)
- **Improvement:** 50-100x faster

### S3 Storage
- **Before:** Limited by disk space, single server
- **After:** Unlimited storage, 99.999999999% durability
- **Benefits:**
  - Scales to petabytes
  - Works in containerized environments
  - CDN integration possible
  - Automatic backups

### WebSocket Real-Time
- **Before:** Client polling every 5-10 seconds
- **After:** Instant updates (< 100ms)
- **Benefits:**
  - Real-time order updates
  - Live inventory changes
  - Instant notifications
  - Better UX

---

## Environment Setup

### Production (AWS)
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=ils-production-files
REDIS_URL=redis://redis.example.com:6379
```

### Development (Local)
```bash
AWS_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000  # MinIO
S3_BUCKET=ils-dev-files
REDIS_URL=redis://localhost:6379
```

---

## Migration Strategy

### Phase 1: Redis Sessions (Zero Downtime)
1. Deploy with Redis session store
2. Old sessions expire naturally (30 days)
3. Users automatically get Redis sessions on next login
4. No user impact

### Phase 2: S3 Storage (Gradual)
1. Deploy S3 upload routes
2. New files go to S3
3. Old files stay on disk (read-only)
4. Optional: Migrate old files with script
5. Keep disk fallback for old files

### Phase 3: WebSocket (Opt-in)
1. Deploy WebSocket server
2. Frontend connects if supported
3. Falls back to polling if WebSocket fails
4. Progressive enhancement

---

## Success Criteria

✅ **Redis Sessions**
- [ ] Sessions stored in Redis
- [ ] Session lookup < 5ms
- [ ] Zero downtime migration
- [ ] All session features work

✅ **S3 Storage**
- [ ] New files uploaded to S3
- [ ] Signed URLs work for private files
- [ ] File deletion works
- [ ] Local dev works with MinIO

✅ **WebSocket Real-Time**
- [ ] WebSocket connections established
- [ ] Events broadcast in real-time
- [ ] Company isolation works
- [ ] Graceful fallback if connection fails

---

## Next Steps

Ready to implement Chunk 10? I'll:
1. Start with Redis sessions (4 hours)
2. Implement S3 storage (6 hours)
3. Document WebSocket integration (2 hours)

Let me know when you're ready to proceed!

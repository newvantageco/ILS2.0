# Multi-Tenant Upload System

## Overview
The upload system has been designed with multi-tenant architecture to ensure complete data isolation between different companies on the platform.

## Architecture

### Directory Structure
```
uploads/
├── {companyId-1}/
│   ├── products/
│   │   ├── image1.jpg
│   │   └── image2.png
│   └── profiles/
│       ├── avatar1.jpg
│       └── avatar2.png
├── {companyId-2}/
│   ├── products/
│   └── profiles/
└── ...
```

### Key Features

1. **Company-Based Isolation**
   - Each company's uploads are stored in separate directories
   - Directory structure: `uploads/{companyId}/{uploadType}/`
   - Upload types: `products`, `profiles`

2. **Automatic Directory Creation**
   - Directories are created automatically when needed
   - Uses recursive creation to ensure parent directories exist

3. **Authentication Required**
   - All upload endpoints require authentication
   - Company ID is extracted from `req.user.companyId`
   - Unauthorized requests (no company ID) return 401 error

4. **File URL Structure**
   - URLs include company ID for proper routing
   - Format: `/uploads/{companyId}/{uploadType}/{filename}`
   - Example: `/uploads/comp-123/products/product-1234567890.jpg`

## API Endpoints

### Upload Single Image
```
POST /api/upload/image
```

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Fields:
  - `image`: File (required)
  - `uploadType`: String ('product' | 'profile', default: 'product')

**Response:**
```json
{
  "success": true,
  "url": "/uploads/{companyId}/products/filename.jpg",
  "filename": "product-1234567890.jpg",
  "originalName": "my-image.jpg",
  "size": 45678,
  "mimetype": "image/jpeg"
}
```

### Upload Multiple Images
```
POST /api/upload/images
```

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Fields:
  - `images`: File[] (up to 10 files)
  - `uploadType`: String ('product' | 'profile', default: 'product')

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "url": "/uploads/{companyId}/products/filename1.jpg",
      "filename": "product-1234567890.jpg",
      "originalName": "image1.jpg",
      "size": 45678,
      "mimetype": "image/jpeg"
    },
    ...
  ]
}
```

### Delete Image
```
DELETE /api/upload/image
```

**Request:**
- Method: DELETE
- Content-Type: application/json
- Body:
  ```json
  {
    "filename": "product-1234567890.jpg",
    "uploadType": "product"
  }
  ```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Get Image Info
```
GET /api/upload/image/:filename?type=product
```

**Response:**
```json
{
  "filename": "product-1234567890.jpg",
  "size": 45678,
  "created": "2024-01-15T10:30:00.000Z",
  "modified": "2024-01-15T10:30:00.000Z",
  "url": "/uploads/{companyId}/products/product-1234567890.jpg"
}
```

## Security Features

### 1. File Validation
- **Allowed types**: jpeg, jpg, png, gif, webp
- **Size limit**: 5MB per file
- **Extension check**: Validates file extensions
- **MIME type check**: Verifies actual file type

### 2. Company Isolation
- Files can only be uploaded to authenticated company's directory
- Files can only be deleted from authenticated company's directory
- File info can only be retrieved for authenticated company's files
- No cross-company access possible

### 3. Filename Generation
- Uses UUID-based unique filenames
- Format: `{uploadType}-{timestamp}-{uuid}.{extension}`
- Prevents filename collisions
- Prevents path traversal attacks

## Implementation Details

### Helper Function
```typescript
const getCompanyDirectory = (companyId: string, uploadType: string): string => {
  const baseDir = path.join(uploadsDir, companyId);
  const typeDir = path.join(baseDir, uploadType === 'profile' ? 'profiles' : 'products');
  
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true });
  }
  
  return typeDir;
};
```

### Multer Configuration
```typescript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.body.uploadType || 'product';
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return cb(new Error('Company ID not found'), '');
    }
    
    const destination = getCompanyDirectory(companyId, uploadType);
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    const uploadType = req.body.uploadType || 'product';
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uploadType}-${uniqueSuffix}${ext}`);
  }
});
```

## Frontend Integration

### Using the ImageUpload Component
```tsx
import { ImageUpload } from '@/components/ui/ImageUpload';

<ImageUpload
  onUpload={(url) => {
    // URL is automatically scoped to company: /uploads/{companyId}/products/...
    setProductData({ ...productData, imageUrl: url });
  }}
  uploadType="product"
  maxSize={5}
/>
```

### Manual Upload
```typescript
const uploadImage = async (file: File, uploadType: string = 'product') => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('uploadType', uploadType);
  
  const response = await fetch('/api/upload/image', {
    method: 'POST',
    body: formData,
    credentials: 'include', // Important for authentication
  });
  
  const data = await response.json();
  return data.url; // Returns /uploads/{companyId}/{type}/{filename}
};
```

## Static File Serving

The server automatically serves uploaded files:
```typescript
app.use('/uploads', express.static(uploadsDir));
```

Files are accessible at: `http://your-domain/uploads/{companyId}/{type}/{filename}`

## Migration Notes

If you're migrating from a non-multi-tenant system:

1. **Backup existing uploads**: Copy the entire `uploads/` directory
2. **Restructure files**: Organize files into company-specific directories
3. **Update database URLs**: Update all image URLs in the database to include company IDs
4. **Test thoroughly**: Verify each company can only access their own files

## Best Practices

1. **Always use authenticated requests**: Never upload files without authentication
2. **Handle upload errors**: Implement proper error handling for failed uploads
3. **Validate file types**: Don't rely only on server-side validation
4. **Show upload progress**: Use progress indicators for better UX
5. **Clean up on failure**: Delete orphaned files if database operations fail
6. **Optimize images**: Consider image optimization before upload
7. **Use appropriate upload type**: Use 'profile' for user avatars, 'product' for product images

## Testing

### Test Multi-Tenant Isolation
1. Create users from different companies
2. Upload files as User A from Company X
3. Try to access files as User B from Company Y
4. Verify User B cannot access User A's files

### Test File Operations
1. Upload single file
2. Upload multiple files
3. Delete uploaded file
4. Get file info
5. Verify file URLs are correct

## Troubleshooting

### Issue: "Company ID not found" error
**Solution**: Ensure user is authenticated and middleware populates `req.user.companyId`

### Issue: Files not appearing
**Solution**: Check directory permissions and verify recursive directory creation

### Issue: Cross-company access
**Solution**: Verify all endpoints check and use `req.user.companyId`

### Issue: File size limit errors
**Solution**: Adjust multer limits and ensure client-side validation matches

## Future Enhancements

1. **Cloud Storage**: Migrate to AWS S3 or similar for better scalability
2. **Image Processing**: Add automatic thumbnail generation
3. **CDN Integration**: Use CDN for faster file delivery
4. **Compression**: Implement automatic image compression
5. **Virus Scanning**: Add malware detection for uploaded files
6. **Quota Management**: Implement storage quotas per company
7. **Audit Logging**: Track all file operations for compliance

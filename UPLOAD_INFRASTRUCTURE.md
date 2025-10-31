# Image Upload Infrastructure

## Overview
Complete file upload system for product images, profile pictures, and other assets.

## Features
✅ **Single & Multiple File Uploads** - Upload one or many images at once
✅ **Image Preview** - Instant preview before and after upload
✅ **File Validation** - Type checking (JPEG, PNG, GIF, WebP) and size limits (5MB)
✅ **Secure Storage** - Files stored in organized directories
✅ **RESTful API** - Clean endpoints for upload, delete, and info retrieval
✅ **React Component** - Reusable ImageUpload component with drag-and-drop UI
✅ **Progress Indicators** - Loading states during upload
✅ **Error Handling** - User-friendly error messages

## Directory Structure
```
uploads/
├── .gitkeep
├── products/        # Product images
│   └── .gitkeep
└── profiles/        # User profile pictures
    └── .gitkeep
```

## Backend API Endpoints

### Upload Single Image
```http
POST /api/upload/image
Content-Type: multipart/form-data

Body:
- image: File (required)
- uploadType: "product" | "profile" (optional, default: "product")

Response:
{
  "success": true,
  "url": "/uploads/products/aviator-1698765432-123456789.jpg",
  "filename": "aviator-1698765432-123456789.jpg",
  "originalName": "aviator.jpg",
  "size": 245678,
  "mimetype": "image/jpeg"
}
```

### Upload Multiple Images
```http
POST /api/upload/images
Content-Type: multipart/form-data

Body:
- images: File[] (required, max 10 files)
- uploadType: "product" | "profile" (optional)

Response:
{
  "success": true,
  "files": [
    {
      "url": "/uploads/products/image1.jpg",
      "filename": "image1.jpg",
      ...
    }
  ],
  "count": 3
}
```

### Delete Image
```http
DELETE /api/upload/image
Content-Type: application/json

Body:
{
  "filename": "aviator-1698765432-123456789.jpg",
  "uploadType": "product"
}

Response:
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Get Image Info
```http
GET /api/upload/image/:filename?type=product

Response:
{
  "filename": "aviator-1698765432-123456789.jpg",
  "size": 245678,
  "created": "2025-10-31T12:00:00.000Z",
  "modified": "2025-10-31T12:00:00.000Z",
  "url": "/uploads/products/aviator-1698765432-123456789.jpg"
}
```

### Access Uploaded Files
```http
GET /uploads/products/:filename
GET /uploads/profiles/:filename
```

## Frontend Usage

### Import the Component
```tsx
import { ImageUpload } from "@/components/ui/ImageUpload";
```

### Basic Usage
```tsx
<ImageUpload
  currentImageUrl={product.imageUrl}
  onImageUploaded={(url) => setProduct({ ...product, imageUrl: url })}
  uploadType="product"
/>
```

### Props
```tsx
interface ImageUploadProps {
  currentImageUrl?: string;      // Current image URL to display
  onImageUploaded: (url: string) => void;  // Callback when upload succeeds
  uploadType?: "product" | "profile";      // Upload directory
  className?: string;             // Additional CSS classes
}
```

## Configuration

### File Limits
- **Max File Size**: 5MB
- **Allowed Types**: JPEG, JPG, PNG, GIF, WebP
- **Max Multiple Upload**: 10 files

### Multer Configuration (server/routes/upload.ts)
```typescript
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});
```

## Security Features
1. **File Type Validation** - Only allows image files
2. **File Size Limits** - Prevents large file uploads
3. **Authentication Required** - All endpoints protected by `isAuthenticated` middleware
4. **Sanitized Filenames** - Removes special characters from filenames
5. **Unique Filenames** - Timestamp + random number prevents collisions

## Storage Strategy
Files are stored on the local filesystem in organized directories:
- Development: `./uploads/`
- Production: Consider cloud storage (S3, Cloudinary, etc.)

## Migration to Cloud Storage (Optional)
To migrate to cloud storage like AWS S3:

1. Install SDK: `npm install @aws-sdk/client-s3 multer-s3`
2. Update storage configuration in `server/routes/upload.ts`
3. Update environment variables with cloud credentials

## Example: Full Product Form with Image
```tsx
function ProductForm() {
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
    // ... other fields
  });

  return (
    <form>
      <Input
        label="Product Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      
      <ImageUpload
        currentImageUrl={formData.imageUrl}
        onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
        uploadType="product"
      />
      
      <Button type="submit">Save Product</Button>
    </form>
  );
}
```

## Error Handling
The ImageUpload component handles common errors:
- Invalid file type
- File too large
- Network errors
- Server errors

All errors are displayed via toast notifications.

## Testing

### Test Upload
```bash
curl -X POST http://localhost:3000/api/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "uploadType=product"
```

### Test Access
```bash
curl http://localhost:3000/uploads/products/filename.jpg
```

## Git Configuration
Uploaded files are excluded from git:
```gitignore
uploads/
!uploads/.gitkeep
```

This keeps the directory structure in git while excluding actual uploaded files.

## Future Enhancements
- [ ] Image compression before upload
- [ ] Multiple image gallery support
- [ ] Drag-and-drop file upload
- [ ] Image cropping/editing
- [ ] Cloud storage integration (S3, Cloudinary)
- [ ] CDN integration for faster delivery
- [ ] Image optimization (WebP conversion, responsive sizes)
- [ ] Upload progress tracking
- [ ] Batch operations (delete multiple)

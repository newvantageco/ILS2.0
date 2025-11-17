# 🗄️ ILS 2.0 - File Storage Setup Guide

## **OVERVIEW**

Configure secure, scalable file storage for prescription uploads, medical documents, and AI processing using AWS S3 with HIPAA-compliant security features.

---

## **🎯 STORAGE ARCHITECTURE**

### **Multi-Layer Security**
- **Encryption at Rest**: AES-256 server-side encryption
- **Encryption in Transit**: TLS 1.2+ for all transfers
- **Access Control**: IAM-based permissions
- **Tenant Isolation**: Separate folders per organization
- **Version Control**: Automatic file versioning
- **Audit Logs**: Complete access tracking

### **Storage Tiers**
```
ils-production-files/
├── prescriptions/
│   ├── original/          # Raw prescription images
│   ├── processed/         # AI-processed results
│   └── thumbnails/        # Preview images
├── medical-documents/
│   ├── patient-records/   # EMR attachments
│   └── test-results/      # Lab results, scans
├── ai-models/
│   ├── training-data/     # ML training datasets
│   └── deployments/       # Model artifacts
├── uploads/
│   ├── temp/             # Temporary uploads
│   └── avatars/          # User profile images
└── backups/
    ├── database/         # Database backups
    └── files/            # File backups
```

---

## **🚀 QUICK SETUP**

### **Option 1: Automated Setup (Recommended)**
```bash
# Run the automated setup script
./scripts/setup-s3-storage.sh
```

### **Option 2: Manual Setup**
Follow the detailed steps below if you prefer manual configuration.

---

## **🔧 MANUAL SETUP**

### **Step 1: AWS Account Setup**
1. **Create AWS Account**: [aws.amazon.com](https://aws.amazon.com)
2. **Enable S3 Service**: Navigate to S3 console
3. **Choose Region**: Select `us-east-1` or nearest region
4. **Set Up IAM**: Create users with appropriate permissions

### **Step 2: Create S3 Bucket**
```bash
# Using AWS CLI
aws s3api create-bucket \
    --bucket ils-production-files \
    --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket ils-production-files \
    --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
    --bucket ils-production-files \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'
```

### **Step 3: Configure Security**
```bash
# Block public access
aws s3api put-public-access-block \
    --bucket ils-production-files \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### **Step 4: Create IAM User**
```bash
# Create user
aws iam create-user --user-name ils-file-uploader

# Create policy
cat > s3-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetObjectVersion"
            ],
            "Resource": [
                "arn:aws:s3:::ils-production-files",
                "arn:aws:s3:::ils-production-files/*"
            ]
        }
    ]
}
EOF

# Create and attach policy
aws iam create-policy \
    --policy-name ILSS3UploadPolicy \
    --policy-document file://s3-policy.json

aws iam attach-user-policy \
    --user-name ils-file-uploader \
    --policy-arn arn:aws:iam::ACCOUNT:policy/ILSS3UploadPolicy
```

### **Step 5: Generate Access Keys**
```bash
# Create access keys
aws iam create-access-key --user-name ils-file-uploader
```

---

## **🔗 RAILWAY INTEGRATION**

### **Environment Variables**
Add these to your Railway project settings:

```bash
# Storage Configuration
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=ils-production-files

# File Processing
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
ENABLE_AI_PROCESSING=true
ENABLE_THUMBNAIL_GENERATION=true
```

### **CORS Configuration**
```bash
# Update CORS with your actual domain
aws s3api put-bucket-cors \
    --bucket ils-production-files \
    --cors-configuration '{
        "CORSRules": [
            {
                "AllowedHeaders": ["*"],
                "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
                "AllowedOrigins": ["https://your-app.railway.app"],
                "ExposeHeaders": ["ETag"],
                "MaxAgeSeconds": 3000
            }
        ]
    }'
```

---

## **📡 API ENDPOINTS**

### **File Upload**
```bash
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer JWT_TOKEN

Form Data:
- file: (binary)
- patientId: string
- type: prescription|document|avatar
- description: string (optional)
```

### **File Download**
```bash
GET /api/files/:fileId
Authorization: Bearer JWT_TOKEN

Query Parameters:
- download: boolean (force download)
- thumbnail: boolean (get thumbnail)
```

### **Prescription Processing**
```bash
POST /api/prescriptions/process
Content-Type: multipart/form-data
Authorization: Bearer JWT_TOKEN

Form Data:
- image: (binary)
- patientId: string
- useAI: boolean
- extractData: boolean
```

---

## **🧪 TESTING SETUP**

### **Run Storage Tests**
```bash
# Test the complete storage system
./scripts/test-file-storage.sh https://your-app.railway.app
```

### **Manual Testing**
```bash
# Test S3 connectivity
aws s3 ls s3://ils-production-files

# Test upload
curl -X POST https://your-app.railway.app/api/upload \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "file=@prescription.jpg" \
  -F "patientId=patient123" \
  -F "type=prescription"

# Test AI processing
curl -X POST https://your-app.railway.app/api/prescriptions/ocr \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "image=@prescription.jpg" \
  -F "useAI=true"
```

---

## **🔒 SECURITY COMPLIANCE**

### **HIPAA Requirements**
✅ **Encryption**: AES-256 at rest, TLS in transit  
✅ **Access Controls**: IAM-based permissions  
✅ **Audit Logging**: Complete access tracking  
✅ **Data Isolation**: Tenant-separated storage  
✅ **Backup**: Automated versioning and backups  
✅ **Retention**: Configurable data retention policies  

### **Security Features**
- **Server-Side Encryption**: All files encrypted automatically
- **Version Control**: Track all file changes
- **Access Logging**: Monitor who accessed what, when
- **IAM Policies**: Granular permission control
- **Network Security**: VPC endpoints for private access
- **Data Classification**: Automatic PHI detection and handling

---

## **💰 COST OPTIMIZATION**

### **Storage Classes**
```bash
# Lifecycle policy for cost optimization
aws s3api put-bucket-lifecycle-configuration \
    --bucket ils-production-files \
    --lifecycle-configuration '{
        "Rules": [
            {
                "ID": "PrescriptionArchive",
                "Status": "Enabled",
                "Transitions": [
                    {
                        "Days": 30,
                        "StorageClass": "STANDARD_IA"
                    },
                    {
                        "Days": 90,
                        "StorageClass": "GLACIER"
                    }
                ]
            }
        ]
    }'
```

### **Estimated Costs**
- **S3 Standard**: ~$0.023 per GB/month
- **S3 IA**: ~$0.0125 per GB/month
- **S3 Glacier**: ~$0.004 per GB/month
- **Data Transfer**: ~$0.09 per GB (first 10GB free)
- **Requests**: ~$0.0004 per 1,000 PUT/POST requests

**Monthly Estimate** (100GB storage, 50GB transfer):
- Storage: $2.30
- Transfer: $4.50
- Requests: $0.20
- **Total**: ~$7/month

---

## **📊 MONITORING & METRICS**

### **CloudWatch Integration**
```bash
# Enable CloudWatch metrics
aws s3api put-bucket-metrics-configuration \
    --bucket ils-production-files \
    --metrics-configuration '{
        "Id": "EntireBucket"
    }'
```

### **Key Metrics**
- **Storage Usage**: Total bytes stored
- **Request Count**: GET/PUT/DELETE operations
- **Error Rates**: 4xx/5xx errors
- **Data Transfer**: Bytes in/out
- **Latency**: Request response times

---

## **🚨 TROUBLESHOOTING**

### **Common Issues**

#### **Upload Failures**
```bash
# Check credentials
aws sts get-caller-identity

# Verify bucket permissions
aws s3 ls s3://ils-production-files

# Check CORS settings
aws s3api get-bucket-cors --bucket ils-production-files
```

#### **Access Denied**
```bash
# Verify IAM policy
aws iam list-attached-user-policies --user-name ils-file-uploader

# Check bucket policy
aws s3api get-bucket-policy --bucket ils-production-files
```

#### **Performance Issues**
```bash
# Enable transfer acceleration
aws s3api put-bucket-accelerate-configuration \
    --bucket ils-production-files \
    --accelerate-configuration Status=Enabled

# Use multipart uploads for large files
aws s3 cp large-file.jpg s3://ils-production-files/ \
    --expected-size 104857600
```

---

## **🔄 BACKUP & DISASTER RECOVERY**

### **Automated Backups**
```bash
# Enable cross-region replication
aws s3api put-bucket-replication \
    --bucket ils-production-files \
    --replication-configuration file://replication-config.json
```

### **Backup Strategy**
- **Version Control**: Automatic file versioning
- **Cross-Region**: Replicate to backup region
- **Point-in-Time**: Restore any previous version
- **Regular Testing**: Monthly backup restoration tests

---

## **🎯 SUCCESS CRITERIA**

Your file storage is properly configured when:

✅ **S3 Bucket Created**: With encryption and versioning  
✅ **IAM User Configured**: With appropriate permissions  
✅ **CORS Set Up**: Allowing uploads from your domain  
✅ **Environment Variables**: Configured in Railway  
✅ **Upload Working**: Can upload files successfully  
✅ **Download Working**: Can access uploaded files  
✅ **AI Integration**: Prescription processing functional  
✅ **Security Compliance**: HIPAA requirements met  

---

## **🚀 NEXT STEPS**

1. **Run Setup Script**: `./scripts/setup-s3-storage.sh`
2. **Configure Railway**: Add environment variables
3. **Test Uploads**: Run `./scripts/test-file-storage.sh`
4. **Verify AI Integration**: Test prescription OCR
5. **Set Up Monitoring**: Configure CloudWatch alerts
6. **Configure Backups**: Enable cross-region replication

---

## **📞 SUPPORT**

- **AWS S3 Docs**: [docs.aws.amazon.com/s3](https://docs.aws.amazon.com/s3)
- **AWS IAM Docs**: [docs.aws.amazon.com/iam](https://docs.aws.amazon.com/iam)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **ILS Documentation**: `./docs/`

---

**🗄️ Your secure, HIPAA-compliant file storage system is ready!**

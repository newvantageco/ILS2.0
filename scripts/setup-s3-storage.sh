#!/bin/bash

# ILS 2.0 - AWS S3 Storage Setup Script
# Creates S3 bucket, IAM user, and configures permissions for file storage

set -e

echo "🗄️ ILS 2.0 - AWS S3 Storage Setup"
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🔍 $1${NC}"
}

# Configuration
BUCKET_NAME="ils-production-files"
IAM_USER_NAME="ils-file-uploader"
REGION="us-east-1"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    echo ""
    print_info "Install AWS CLI:"
    echo "  macOS: brew install awscli"
    echo "  Ubuntu: apt install awscli"
    echo "  Or visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured"
    echo ""
    print_info "Configure AWS credentials:"
    echo "  aws configure"
    echo "  # Enter your AWS Access Key ID"
    echo "  # Enter your AWS Secret Access Key"
    echo "  # Enter default region (us-east-1)"
    echo "  # Enter default output format (json)"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_success "Logged in to AWS as account: $AWS_ACCOUNT_ID"

echo ""
print_header "S3 BUCKET CREATION"

# Create S3 bucket
print_info "Creating S3 bucket: $BUCKET_NAME"

if aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" 2>/dev/null; then
    print_success "S3 bucket created: $BUCKET_NAME"
else
    print_warning "Bucket may already exist or there was an error"
fi

# Enable versioning
print_info "Enabling versioning on bucket..."
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

# Enable encryption
print_info "Enabling default encryption..."
aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'

# Block public access
print_info "Blocking public access..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

print_success "S3 bucket configured with security settings"

echo ""
print_header "IAM USER CREATION"

# Create IAM user
print_info "Creating IAM user: $IAM_USER_NAME"

if aws iam create-user --user-name "$IAM_USER_NAME" 2>/dev/null; then
    print_success "IAM user created: $IAM_USER_NAME"
else
    print_warning "IAM user may already exist"
fi

# Create IAM policy
print_info "Creating IAM policy for S3 access..."

POLICY_NAME="ILSS3UploadPolicy"
POLICY_DOCUMENT=$(cat << EOF
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
                "arn:aws:s3:::$BUCKET_NAME",
                "arn:aws:s3:::$BUCKET_NAME/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListAllMyBuckets"
            ],
            "Resource": "*"
        }
    ]
}
EOF
)

# Create policy
POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOCUMENT" \
    --query 'Policy.Arn' \
    --output text 2>/dev/null || echo "")

if [ -n "$POLICY_ARN" ]; then
    print_success "IAM policy created: $POLICY_ARN"
else
    # Policy might already exist, get its ARN
    POLICY_ARN=$(aws iam list-policies \
        --scope Local \
        --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" \
        --output text)
    print_warning "IAM policy already exists: $POLICY_ARN"
fi

# Attach policy to user
print_info "Attaching policy to IAM user..."
aws iam attach-user-policy \
    --user-name "$IAM_USER_NAME" \
    --policy-arn "$POLICY_ARN"

print_success "IAM policy attached to user"

echo ""
print_header "ACCESS KEYS GENERATION"

# Create access keys
print_info "Creating access keys for IAM user..."

ACCESS_KEYS=$(aws iam create-access-key \
    --user-name "$IAM_USER_NAME" \
    --query 'AccessKey' \
    --output json)

ACCESS_KEY_ID=$(echo "$ACCESS_KEYS" | jq -r '.AccessKeyId')
SECRET_ACCESS_KEY=$(echo "$ACCESS_KEYS" | jq -r '.SecretAccessKey')

print_success "Access keys generated"

echo ""
print_header "STORAGE SETUP COMPLETE"

echo ""
print_info "📋 SAVE THESE CREDENTIALS:"
echo ""
echo "AWS S3 Bucket Name:"
echo "$BUCKET_NAME"
echo ""
echo "AWS Access Key ID:"
echo "$ACCESS_KEY_ID"
echo ""
echo "AWS Secret Access Key:"
echo "$SECRET_ACCESS_KEY"
echo ""
echo "AWS Region:"
echo "$REGION"
echo ""

print_info "🔧 Add these to your Railway environment variables:"
echo ""
cat << EOF
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=$ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY
AWS_REGION=$REGION
AWS_S3_BUCKET=$BUCKET_NAME
EOF

echo ""
print_header "FOLDER STRUCTURE"

# Create folder structure
print_info "Creating folder structure in S3 bucket..."

FOLDERS=(
    "prescriptions/"
    "prescriptions/original/"
    "prescriptions/processed/"
    "prescriptions/thumbnails/"
    "medical-documents/"
    "medical-documents/patient-records/"
    "medical-documents/test-results/"
    "ai-models/"
    "ai-models/training-data/"
    "ai-models/deployments/"
    "uploads/"
    "uploads/temp/"
    "uploads/avatars/"
    "backups/"
    "backups/database/"
    "backups/files/"
)

for folder in "${FOLDERS[@]}"; do
    aws s3api put-object \
        --bucket "$BUCKET_NAME" \
        --key "$folder" \
        --content-length 0 2>/dev/null || true
done

print_success "Folder structure created"

echo ""
print_header "TESTING STORAGE"

# Test upload
print_info "Testing S3 upload..."
echo "Hello ILS 2.0 Storage Test" > /tmp/test-upload.txt

if aws s3 cp /tmp/test-upload.txt "s3://$BUCKET_NAME/uploads/test/"; then
    print_success "S3 upload test passed"
    
    # Test download
    if aws s3 cp "s3://$BUCKET_NAME/uploads/test/" /tmp/test-download.txt; then
        print_success "S3 download test passed"
        rm -f /tmp/test-upload.txt /tmp/test-download.txt
    else
        print_error "S3 download test failed"
    fi
else
    print_error "S3 upload test failed"
fi

echo ""
print_header "CORS CONFIGURATION"

# Set CORS configuration
print_info "Configuring CORS for S3 bucket..."

CORS_CONFIGURATION=$(cat << EOF
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["https://your-app.railway.app", "https://your-custom-domain.com"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF
)

aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration "$CORS_CONFIGURATION"

print_success "CORS configuration applied"

echo ""
print_success "🎉 AWS S3 Storage setup completed!"
echo ""

print_info "📊 Storage Summary:"
echo "  • Bucket: $BUCKET_NAME"
echo "  • Region: $REGION"
echo "  • IAM User: $IAM_USER_NAME"
echo "  • Folders: ${#FOLDERS[@]} created"
echo "  • Security: Encrypted, versioned, private"
echo ""

print_info "🔗 Next Steps:"
echo "1. Add environment variables to Railway"
echo "2. Update CORS origins with your actual domain"
echo "3. Test file upload in your application"
echo "4. Set up lifecycle policies for cost optimization"
echo ""

print_info "📋 Testing Commands:"
echo ""
echo "# Test S3 connectivity from your app:"
echo "aws s3 ls s3://$BUCKET_NAME"
echo ""
echo "# Upload test file:"
echo "aws s3 cp test.txt s3://$BUCKET_NAME/uploads/"
echo ""
echo "# Check bucket encryption:"
echo "aws s3api get-bucket-encryption --bucket $BUCKET_NAME"
echo ""

echo "🗄️ Your secure file storage is ready for prescription uploads!"

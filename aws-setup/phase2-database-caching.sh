#!/bin/bash

# Phase 2: Database & Caching Setup Master Script
# This script runs all Phase 2 setup steps for RDS PostgreSQL and ElastiCache Redis

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_header "Phase 2: Database & Caching Setup"
print_status "This script will set up RDS PostgreSQL and ElastiCache Redis for your SaaS Automation Platform"
print_status "Estimated time: 45 minutes"

# Check prerequisites
print_status "Checking prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

print_success "AWS CLI is configured"

# Check required tools
if ! command -v jq &> /dev/null; then
    print_warning "jq is not installed. Installing..."
    if command -v brew &> /dev/null; then
        brew install jq
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y jq
    elif command -v yum &> /dev/null; then
        sudo yum install -y jq
    else
        print_error "Please install jq manually"
        exit 1
    fi
fi

print_success "All prerequisites are met"

# Step 1: Security Groups Setup
print_header "Step 1: Setting up Security Groups"
print_status "This will create security groups for EC2, RDS, and Redis..."

# Check if security groups script exists
if [ -f "security-groups-setup.sh" ]; then
    chmod +x security-groups-setup.sh
    ./security-groups-setup.sh
    print_success "Security groups setup completed"
else
    print_error "security-groups-setup.sh not found"
    exit 1
fi

# Step 2: RDS PostgreSQL Setup
print_header "Step 2: Setting up RDS PostgreSQL"
print_status "This will create a PostgreSQL RDS instance (takes 5-10 minutes)..."

# Check if RDS setup script exists
if [ -f "rds-setup.sh" ]; then
    chmod +x rds-setup.sh
    ./rds-setup.sh
    print_success "RDS PostgreSQL setup completed"
else
    print_error "rds-setup.sh not found"
    exit 1
fi

# Step 3: ElastiCache Redis Setup
print_header "Step 3: Setting up ElastiCache Redis"
print_status "This will create a Redis ElastiCache cluster (takes 5-10 minutes)..."

# Check if ElastiCache setup script exists
if [ -f "elasticache-setup.sh" ]; then
    chmod +x elasticache-setup.sh
    ./elasticache-setup.sh
    print_success "ElastiCache Redis setup completed"
else
    print_error "elasticache-setup.sh not found"
    exit 1
fi

# Step 4: Test Connections
print_header "Step 4: Testing Database and Redis Connections"
print_status "This will test all connections and performance..."

# Check if test connections script exists
if [ -f "test-connections.sh" ]; then
    chmod +x test-connections.sh
    ./test-connections.sh
    print_success "Connection testing completed"
else
    print_error "test-connections.sh not found"
    exit 1
fi

# Step 5: Setup Automated Backups
print_header "Step 5: Setting up Automated Backups"
print_status "This will configure automated backups and create backup scripts..."

# Check if backup setup script exists
if [ -f "backup-setup.sh" ]; then
    chmod +x backup-setup.sh
    ./backup-setup.sh
    print_success "Automated backup setup completed"
else
    print_error "backup-setup.sh not found"
    exit 1
fi

# Create environment file for application
print_header "Creating Application Environment File"

# Load configurations
if [ -f "rds-config.env" ] && [ -f "redis-config.env" ]; then
    source rds-config.env
    source redis-config.env
    
    # Create application environment file
    cat > aws-env.env << EOF
# AWS Infrastructure Environment Variables
# Generated on $(date)

# Database Configuration
DATABASE_URL=$DATABASE_URL
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD

# Redis Configuration
REDIS_URL=$REDIS_URL
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT

# AWS Configuration
AWS_REGION=$(aws configure get region)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Application Configuration
NODE_ENV=production
EOF

    print_success "Application environment file created: aws-env.env"
else
    print_error "Configuration files not found"
    exit 1
fi

# Create summary report
print_header "Phase 2 Setup Summary"

cat > phase2-summary.md << EOF
# Phase 2: Database & Caching Setup Summary

## Completed Steps

### ✅ Security Groups
- EC2 Security Group: $(grep EC2_SECURITY_GROUP_ID security-groups-config.env | cut -d'=' -f2)
- RDS Security Group: $(grep RDS_SECURITY_GROUP_ID security-groups-config.env | cut -d'=' -f2)
- Redis Security Group: $(grep REDIS_SECURITY_GROUP_ID security-groups-config.env | cut -d'=' -f2)

### ✅ RDS PostgreSQL
- Instance: saas-automation-db
- Endpoint: $DB_HOST
- Port: $DB_PORT
- Database: $DB_NAME
- Backup Retention: 7 days
- Backup Window: 03:00-04:00

### ✅ ElastiCache Redis
- Cluster: saas-automation-redis
- Endpoint: $REDIS_HOST
- Port: $REDIS_PORT
- Engine: Redis 7.0

### ✅ Automated Backups
- S3 Bucket: saas-automation-backups
- Manual Backup Script: manual-backup.sh
- Restore Script: restore-backup.sh
- Monitoring Script: monitor-backups.sh
- Cron Job: setup-backup-cron.sh

### ✅ Connection Testing
- PostgreSQL: ✓ Connected and tested
- Redis: ✓ Connected and tested
- Performance: ✓ Verified

## Configuration Files Created
- rds-config.env: RDS PostgreSQL configuration
- redis-config.env: ElastiCache Redis configuration
- security-groups-config.env: Security groups configuration
- aws-env.env: Application environment variables

## Next Steps
1. Update your application's environment variables with aws-env.env
2. Run database migrations: npx prisma db push
3. Test your application with the new database and Redis
4. Set up CloudWatch monitoring and alerts
5. Configure your application to use the new endpoints

## Cost Estimate (Monthly)
- RDS PostgreSQL (db.t3.micro): ~$15
- ElastiCache Redis (cache.t3.micro): ~$15
- S3 Storage: ~$1-5
- Total: ~$31-35/month

## Security Notes
- All databases are encrypted at rest
- Security groups restrict access to EC2 only
- Automated backups are enabled
- S3 bucket has versioning and encryption enabled

Generated on: $(date)
EOF

print_success "Summary report created: phase2-summary.md"

print_header "🎉 Phase 2 Setup Complete!"
print_status "Your database and caching infrastructure is ready!"
print_status ""
print_status "Summary:"
print_status "  ✓ RDS PostgreSQL instance created"
print_status "  ✓ ElastiCache Redis cluster created"
print_status "  ✓ Security groups configured"
print_status "  ✓ Connection tests passed"
print_status "  ✓ Automated backups configured"
print_status ""
print_status "Next steps:"
print_status "1. Review phase2-summary.md for details"
print_status "2. Update your application with aws-env.env"
print_status "3. Run database migrations"
print_status "4. Test your application"
print_status "5. Proceed to Phase 3: EC2 Server Setup" 
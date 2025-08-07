#!/bin/bash

# RDS PostgreSQL Setup Script
# This script creates a PostgreSQL RDS instance for the SaaS Automation Platform

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

# Configuration
DB_INSTANCE_IDENTIFIER="saas-automation-db"
DB_NAME="saas_automation"
DB_USERNAME="postgres"
DB_PASSWORD="YourStrongPassword123!"
DB_INSTANCE_CLASS="db.t3.micro"
DB_ENGINE="postgres"
DB_ENGINE_VERSION="15.4"
ALLOCATED_STORAGE="20"
VPC_SECURITY_GROUP_IDS="sg-xxxxxxxxx"  # Replace with your security group
DB_SUBNET_GROUP="default"  # Replace with your subnet group
AVAILABILITY_ZONE="us-east-1a"  # Replace with your preferred AZ

print_header "Setting up RDS PostgreSQL Instance"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "Creating RDS PostgreSQL instance..."

# Create RDS instance
aws rds create-db-instance \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
    --db-instance-class "$DB_INSTANCE_CLASS" \
    --engine "$DB_ENGINE" \
    --engine-version "$DB_ENGINE_VERSION" \
    --master-username "$DB_USERNAME" \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage "$ALLOCATED_STORAGE" \
    --storage-type gp2 \
    --db-name "$DB_NAME" \
    --vpc-security-group-ids "$VPC_SECURITY_GROUP_IDS" \
    --db-subnet-group-name "$DB_SUBNET_GROUP" \
    --availability-zone "$AVAILABILITY_ZONE" \
    --backup-retention-period 7 \
    --preferred-backup-window "03:00-04:00" \
    --preferred-maintenance-window "sun:04:00-sun:05:00" \
    --auto-minor-version-upgrade \
    --storage-encrypted \
    --deletion-protection \
    --tags Key=Project,Value=saas-automation Key=Environment,Value=production

print_status "RDS instance creation initiated. This may take 5-10 minutes..."

# Wait for the instance to be available
print_status "Waiting for RDS instance to become available..."
aws rds wait db-instance-available --db-instance-identifier "$DB_INSTANCE_IDENTIFIER"

# Get the endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

DB_PORT=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
    --query 'DBInstances[0].Endpoint.Port' \
    --output text)

print_status "RDS PostgreSQL instance created successfully!"
print_status "Database Endpoint: $DB_ENDPOINT"
print_status "Database Port: $DB_PORT"
print_status "Database Name: $DB_NAME"
print_status "Database Username: $DB_USERNAME"

# Save configuration to file
cat > rds-config.env << EOF
# RDS PostgreSQL Configuration
DB_HOST=$DB_ENDPOINT
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:$DB_PORT/$DB_NAME
EOF

print_status "Configuration saved to rds-config.env"

# Test database connection
print_status "Testing database connection..."
if command -v psql &> /dev/null; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_ENDPOINT -U $DB_USERNAME -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status "Database connection test successful!"
    else
        print_warning "Database connection test failed. Please check security groups."
    fi
else
    print_warning "psql not found. Skipping connection test."
fi

print_header "RDS Setup Complete!"
print_status "Next steps:"
print_status "1. Update your application's DATABASE_URL with the new endpoint"
print_status "2. Run database migrations: npx prisma db push"
print_status "3. Test your application with the new database" 
#!/bin/bash

# Security Groups Setup Script
# This script creates security groups for RDS and ElastiCache

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
VPC_ID="vpc-xxxxxxxxx"  # Replace with your VPC ID
EC2_SECURITY_GROUP_NAME="saas-automation-ec2-sg"
RDS_SECURITY_GROUP_NAME="saas-automation-rds-sg"
REDIS_SECURITY_GROUP_NAME="saas-automation-redis-sg"
EC2_SECURITY_GROUP_DESCRIPTION="Security group for SaaS Automation EC2 instances"
RDS_SECURITY_GROUP_DESCRIPTION="Security group for SaaS Automation RDS PostgreSQL"
REDIS_SECURITY_GROUP_DESCRIPTION="Security group for SaaS Automation ElastiCache Redis"

print_header "Setting up Security Groups"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Create EC2 Security Group
print_status "Creating EC2 Security Group..."
EC2_SG_ID=$(aws ec2 create-security-group \
    --group-name "$EC2_SECURITY_GROUP_NAME" \
    --description "$EC2_SECURITY_GROUP_DESCRIPTION" \
    --vpc-id "$VPC_ID" \
    --query 'GroupId' \
    --output text)

print_status "EC2 Security Group created: $EC2_SG_ID"

# Create RDS Security Group
print_status "Creating RDS Security Group..."
RDS_SG_ID=$(aws ec2 create-security-group \
    --group-name "$RDS_SECURITY_GROUP_NAME" \
    --description "$RDS_SECURITY_GROUP_DESCRIPTION" \
    --vpc-id "$VPC_ID" \
    --query 'GroupId' \
    --output text)

print_status "RDS Security Group created: $RDS_SG_ID"

# Create Redis Security Group
print_status "Creating Redis Security Group..."
REDIS_SG_ID=$(aws ec2 create-security-group \
    --group-name "$REDIS_SECURITY_GROUP_NAME" \
    --description "$REDIS_SECURITY_GROUP_DESCRIPTION" \
    --vpc-id "$VPC_ID" \
    --query 'GroupId' \
    --output text)

print_status "Redis Security Group created: $REDIS_SG_ID"

# Configure EC2 Security Group Rules
print_status "Configuring EC2 Security Group rules..."

# Allow SSH from your IP (replace with your IP)
aws ec2 authorize-security-group-ingress \
    --group-id "$EC2_SG_ID" \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --description "SSH access"

# Allow HTTP
aws ec2 authorize-security-group-ingress \
    --group-id "$EC2_SG_ID" \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --description "HTTP access"

# Allow HTTPS
aws ec2 authorize-security-group-ingress \
    --group-id "$EC2_SG_ID" \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --description "HTTPS access"

# Allow application port
aws ec2 authorize-security-group-ingress \
    --group-id "$EC2_SG_ID" \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0 \
    --description "Application port"

# Allow outbound traffic
aws ec2 authorize-security-group-egress \
    --group-id "$EC2_SG_ID" \
    --protocol -1 \
    --port -1 \
    --cidr 0.0.0.0/0 \
    --description "All outbound traffic"

# Configure RDS Security Group Rules
print_status "Configuring RDS Security Group rules..."

# Allow PostgreSQL access from EC2
aws ec2 authorize-security-group-ingress \
    --group-id "$RDS_SG_ID" \
    --protocol tcp \
    --port 5432 \
    --source-group "$EC2_SG_ID" \
    --description "PostgreSQL access from EC2"

# Configure Redis Security Group Rules
print_status "Configuring Redis Security Group rules..."

# Allow Redis access from EC2
aws ec2 authorize-security-group-ingress \
    --group-id "$REDIS_SG_ID" \
    --protocol tcp \
    --port 6379 \
    --source-group "$EC2_SG_ID" \
    --description "Redis access from EC2"

# Add tags to security groups
aws ec2 create-tags \
    --resources "$EC2_SG_ID" "$RDS_SG_ID" "$REDIS_SG_ID" \
    --tags Key=Project,Value=saas-automation Key=Environment,Value=production

print_status "Security groups configured successfully!"

# Save configuration to file
cat > security-groups-config.env << EOF
# Security Groups Configuration
EC2_SECURITY_GROUP_ID=$EC2_SG_ID
RDS_SECURITY_GROUP_ID=$RDS_SG_ID
REDIS_SECURITY_GROUP_ID=$REDIS_SG_ID
VPC_ID=$VPC_ID
EOF

print_status "Configuration saved to security-groups-config.env"

print_header "Security Groups Setup Complete!"
print_status "Security Groups created:"
print_status "  - EC2: $EC2_SG_ID"
print_status "  - RDS: $RDS_SG_ID"
print_status "  - Redis: $REDIS_SG_ID"
print_status ""
print_status "Next steps:"
print_status "1. Update the security group IDs in rds-setup.sh and elasticache-setup.sh"
print_status "2. Run the RDS and ElastiCache setup scripts"
print_status "3. Test connectivity from your EC2 instance" 
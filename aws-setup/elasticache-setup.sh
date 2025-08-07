#!/bin/bash

# ElastiCache Redis Setup Script
# This script creates a Redis ElastiCache cluster for the SaaS Automation Platform

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
CACHE_CLUSTER_ID="saas-automation-redis"
CACHE_NODE_TYPE="cache.t3.micro"
CACHE_ENGINE="redis"
CACHE_ENGINE_VERSION="7.0"
NUM_CACHE_NODES="1"
VPC_SECURITY_GROUP_IDS="sg-xxxxxxxxx"  # Replace with your security group
CACHE_SUBNET_GROUP="default"  # Replace with your subnet group
AVAILABILITY_ZONE="us-east-1a"  # Replace with your preferred AZ

print_header "Setting up ElastiCache Redis Cluster"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "Creating ElastiCache Redis cluster..."

# Create ElastiCache cluster
aws elasticache create-cache-cluster \
    --cache-cluster-id "$CACHE_CLUSTER_ID" \
    --cache-node-type "$CACHE_NODE_TYPE" \
    --engine "$CACHE_ENGINE" \
    --engine-version "$CACHE_ENGINE_VERSION" \
    --num-cache-nodes "$NUM_CACHE_NODES" \
    --vpc-security-group-ids "$VPC_SECURITY_GROUP_IDS" \
    --cache-subnet-group-name "$CACHE_SUBNET_GROUP" \
    --preferred-availability-zone "$AVAILABILITY_ZONE" \
    --port 6379 \
    --auto-minor-version-upgrade \
    --tags Key=Project,Value=saas-automation Key=Environment,Value=production

print_status "ElastiCache cluster creation initiated. This may take 5-10 minutes..."

# Wait for the cluster to be available
print_status "Waiting for ElastiCache cluster to become available..."
aws elasticache wait cache-cluster-available --cache-cluster-id "$CACHE_CLUSTER_ID"

# Get the endpoint
CACHE_ENDPOINT=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id "$CACHE_CLUSTER_ID" \
    --show-cache-node-info \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
    --output text)

CACHE_PORT=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id "$CACHE_CLUSTER_ID" \
    --show-cache-node-info \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Port' \
    --output text)

print_status "ElastiCache Redis cluster created successfully!"
print_status "Redis Endpoint: $CACHE_ENDPOINT"
print_status "Redis Port: $CACHE_PORT"

# Save configuration to file
cat > redis-config.env << EOF
# ElastiCache Redis Configuration
REDIS_HOST=$CACHE_ENDPOINT
REDIS_PORT=$CACHE_PORT
REDIS_URL=redis://$CACHE_ENDPOINT:$CACHE_PORT
EOF

print_status "Configuration saved to redis-config.env"

# Test Redis connection
print_status "Testing Redis connection..."
if command -v redis-cli &> /dev/null; then
    redis-cli -h $CACHE_ENDPOINT -p $CACHE_PORT ping > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status "Redis connection test successful!"
        
        # Test basic Redis operations
        redis-cli -h $CACHE_ENDPOINT -p $CACHE_PORT set test "Hello Redis" > /dev/null 2>&1
        redis-cli -h $CACHE_ENDPOINT -p $CACHE_PORT get test > /dev/null 2>&1
        redis-cli -h $CACHE_ENDPOINT -p $CACHE_PORT del test > /dev/null 2>&1
        
        print_status "Redis operations test successful!"
    else
        print_warning "Redis connection test failed. Please check security groups."
    fi
else
    print_warning "redis-cli not found. Skipping connection test."
fi

print_header "ElastiCache Setup Complete!"
print_status "Next steps:"
print_status "1. Update your application's REDIS_URL with the new endpoint"
print_status "2. Test Redis operations in your application"
print_status "3. Configure session storage and caching" 
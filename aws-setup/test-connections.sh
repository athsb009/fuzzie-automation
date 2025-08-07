#!/bin/bash

# Database and Redis Connection Testing Script
# This script tests connections to RDS PostgreSQL and ElastiCache Redis

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

print_failure() {
    echo -e "${RED}✗ $1${NC}"
}

# Load configuration from files
if [ -f "rds-config.env" ]; then
    source rds-config.env
else
    print_error "RDS configuration file not found. Please run rds-setup.sh first."
    exit 1
fi

if [ -f "redis-config.env" ]; then
    source redis-config.env
else
    print_error "Redis configuration file not found. Please run elasticache-setup.sh first."
    exit 1
fi

print_header "Testing Database and Redis Connections"

# Test PostgreSQL Connection
print_status "Testing PostgreSQL connection..."

if command -v psql &> /dev/null; then
    # Test basic connection
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1; then
        print_success "PostgreSQL connection successful"
        
        # Test database operations
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -c "
            CREATE TABLE IF NOT EXISTS connection_test (
                id SERIAL PRIMARY KEY,
                test_column VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        " > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "PostgreSQL write operation successful"
        else
            print_failure "PostgreSQL write operation failed"
        fi
        
        # Test read operation
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -c "
            INSERT INTO connection_test (test_column) VALUES ('test_value') ON CONFLICT DO NOTHING;
            SELECT COUNT(*) FROM connection_test;
        " > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "PostgreSQL read operation successful"
        else
            print_failure "PostgreSQL read operation failed"
        fi
        
        # Clean up test table
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -c "
            DROP TABLE IF EXISTS connection_test;
        " > /dev/null 2>&1
        
    else
        print_failure "PostgreSQL connection failed"
        print_warning "Please check:"
        print_warning "  - Security group rules"
        print_warning "  - Database credentials"
        print_warning "  - Network connectivity"
    fi
else
    print_warning "psql not found. Skipping PostgreSQL tests."
fi

# Test Redis Connection
print_status "Testing Redis connection..."

if command -v redis-cli &> /dev/null; then
    # Test basic connection
    if redis-cli -h $REDIS_HOST -p $REDIS_PORT ping > /dev/null 2>&1; then
        print_success "Redis connection successful"
        
        # Test Redis operations
        redis-cli -h $REDIS_HOST -p $REDIS_PORT set test_key "test_value" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_success "Redis write operation successful"
        else
            print_failure "Redis write operation failed"
        fi
        
        # Test read operation
        redis-cli -h $REDIS_HOST -p $REDIS_PORT get test_key > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_success "Redis read operation successful"
        else
            print_failure "Redis read operation failed"
        fi
        
        # Test delete operation
        redis-cli -h $REDIS_HOST -p $REDIS_PORT del test_key > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_success "Redis delete operation successful"
        else
            print_failure "Redis delete operation failed"
        fi
        
        # Test Redis info
        redis-cli -h $REDIS_HOST -p $REDIS_PORT info server > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_success "Redis info command successful"
        else
            print_failure "Redis info command failed"
        fi
        
    else
        print_failure "Redis connection failed"
        print_warning "Please check:"
        print_warning "  - Security group rules"
        print_warning "  - Redis endpoint"
        print_warning "  - Network connectivity"
    fi
else
    print_warning "redis-cli not found. Skipping Redis tests."
fi

# Test application database URL
print_status "Testing application database URL..."

# Create a simple Node.js test script
cat > test-db-connection.js << 'EOF'
const { Client } = require('pg');

async function testConnection() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✓ Database connection successful');
        
        const result = await client.query('SELECT version()');
        console.log('✓ Database query successful');
        
        await client.end();
        return true;
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
        return false;
    }
}

testConnection();
EOF

# Test with Node.js if available
if command -v node &> /dev/null; then
    print_status "Testing with Node.js..."
    
    # Install pg if not available
    if ! npm list pg &> /dev/null; then
        npm install pg
    fi
    
    # Set environment variable and test
    export DATABASE_URL="postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    node test-db-connection.js
    
    if [ $? -eq 0 ]; then
        print_success "Node.js database connection successful"
    else
        print_failure "Node.js database connection failed"
    fi
else
    print_warning "Node.js not found. Skipping Node.js tests."
fi

# Clean up test file
rm -f test-db-connection.js

# Performance tests
print_status "Running performance tests..."

# PostgreSQL performance test
if command -v psql &> /dev/null; then
    print_status "Testing PostgreSQL performance..."
    
    start_time=$(date +%s.%N)
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1
    end_time=$(date +%s.%N)
    
    duration=$(echo "$end_time - $start_time" | bc -l)
    print_status "PostgreSQL query time: ${duration}s"
    
    if (( $(echo "$duration < 1.0" | bc -l) )); then
        print_success "PostgreSQL performance is good"
    else
        print_warning "PostgreSQL performance might be slow"
    fi
fi

# Redis performance test
if command -v redis-cli &> /dev/null; then
    print_status "Testing Redis performance..."
    
    start_time=$(date +%s.%N)
    redis-cli -h $REDIS_HOST -p $REDIS_PORT ping > /dev/null 2>&1
    end_time=$(date +%s.%N)
    
    duration=$(echo "$end_time - $start_time" | bc -l)
    print_status "Redis ping time: ${duration}s"
    
    if (( $(echo "$duration < 0.1" | bc -l) )); then
        print_success "Redis performance is excellent"
    elif (( $(echo "$duration < 0.5" | bc -l) )); then
        print_success "Redis performance is good"
    else
        print_warning "Redis performance might be slow"
    fi
fi

print_header "Connection Testing Complete!"

# Summary
print_status "Summary:"
print_status "  - PostgreSQL Host: $DB_HOST"
print_status "  - PostgreSQL Port: $DB_PORT"
print_status "  - Redis Host: $REDIS_HOST"
print_status "  - Redis Port: $REDIS_PORT"

print_status ""
print_status "Next steps:"
print_status "1. Update your application's environment variables"
print_status "2. Run database migrations: npx prisma db push"
print_status "3. Test your application with the new database and Redis"
print_status "4. Set up automated backups and monitoring" 
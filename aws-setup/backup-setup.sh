#!/bin/bash

# Automated Backup Setup Script
# This script sets up automated backups for RDS PostgreSQL

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
BACKUP_RETENTION_DAYS="7"
BACKUP_WINDOW="03:00-04:00"
MAINTENANCE_WINDOW="sun:04:00-sun:05:00"
S3_BUCKET="saas-automation-backups"

print_header "Setting up Automated Backups"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Create S3 bucket for backups if it doesn't exist
print_status "Setting up S3 bucket for backups..."
if ! aws s3 ls "s3://$S3_BUCKET" > /dev/null 2>&1; then
    aws s3 mb "s3://$S3_BUCKET"
    print_status "S3 bucket created: $S3_BUCKET"
else
    print_status "S3 bucket already exists: $S3_BUCKET"
fi

# Configure S3 bucket for backups
aws s3api put-bucket-versioning \
    --bucket "$S3_BUCKET" \
    --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
    --bucket "$S3_BUCKET" \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'

print_status "S3 bucket configured for backups"

# Update RDS instance with backup configuration
print_status "Updating RDS instance with backup configuration..."

aws rds modify-db-instance \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
    --backup-retention-period "$BACKUP_RETENTION_DAYS" \
    --preferred-backup-window "$BACKUP_WINDOW" \
    --preferred-maintenance-window "$MAINTENANCE_WINDOW" \
    --apply-immediately

print_status "RDS backup configuration updated"

# Create manual backup script
cat > manual-backup.sh << 'EOF'
#!/bin/bash

# Manual Database Backup Script
# This script creates a manual backup of the RDS PostgreSQL database

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Configuration
DB_INSTANCE_IDENTIFIER="saas-automation-db"
S3_BUCKET="saas-automation-backups"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

print_header "Creating Manual Database Backup"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Load database configuration
if [ -f "rds-config.env" ]; then
    source rds-config.env
else
    print_error "RDS configuration file not found. Please run rds-setup.sh first."
    exit 1
fi

print_status "Creating database backup..."

# Create backup using pg_dump
if command -v pg_dump &> /dev/null; then
    BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
    
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USERNAME -d $DB_NAME \
        --verbose --clean --no-owner --no-privileges \
        --file "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_status "Database backup created: $BACKUP_FILE"
        
        # Compress backup
        gzip "$BACKUP_FILE"
        COMPRESSED_FILE="$BACKUP_FILE.gz"
        
        # Upload to S3
        print_status "Uploading backup to S3..."
        aws s3 cp "$COMPRESSED_FILE" "s3://$S3_BUCKET/database-backups/"
        
        if [ $? -eq 0 ]; then
            print_status "Backup uploaded to S3 successfully"
            
            # Clean up local file
            rm "$COMPRESSED_FILE"
            print_status "Local backup file cleaned up"
        else
            print_error "Failed to upload backup to S3"
        fi
    else
        print_error "Database backup failed"
        exit 1
    fi
else
    print_error "pg_dump not found. Please install PostgreSQL client tools."
    exit 1
fi

print_header "Manual Backup Complete!"
print_status "Backup file: $BACKUP_FILE.gz"
print_status "S3 location: s3://$S3_BUCKET/database-backups/"
EOF

chmod +x manual-backup.sh

# Create restore script
cat > restore-backup.sh << 'EOF'
#!/bin/bash

# Database Restore Script
# This script restores a database backup

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Configuration
S3_BUCKET="saas-automation-backups"
BACKUP_DIR="./backups"

print_header "Database Restore"

# Check if backup file is provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <backup-file>"
    print_error "Example: $0 db_backup_20231201_143022.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Load database configuration
if [ -f "rds-config.env" ]; then
    source rds-config.env
else
    print_error "RDS configuration file not found. Please run rds-setup.sh first."
    exit 1
fi

print_status "Restoring database from backup: $BACKUP_FILE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Download from S3 if it's an S3 path
if [[ "$BACKUP_FILE" == s3://* ]]; then
    print_status "Downloading backup from S3..."
    aws s3 cp "$BACKUP_FILE" "$BACKUP_DIR/"
    BACKUP_FILE="$BACKUP_DIR/$(basename $BACKUP_FILE)"
fi

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    print_status "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
    BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

print_status "Restoring database..."

# Restore database
if command -v psql &> /dev/null; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME < "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_status "Database restored successfully"
    else
        print_error "Database restore failed"
        exit 1
    fi
else
    print_error "psql not found. Please install PostgreSQL client tools."
    exit 1
fi

print_header "Database Restore Complete!"
EOF

chmod +x restore-backup.sh

# Create backup monitoring script
cat > monitor-backups.sh << 'EOF'
#!/bin/bash

# Backup Monitoring Script
# This script monitors and reports on database backups

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
S3_BUCKET="saas-automation-backups"

print_header "Backup Monitoring Report"

# Check RDS automated backups
print_status "Checking RDS automated backups..."

DB_INSTANCE_INFO=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
    --query 'DBInstances[0]')

BACKUP_RETENTION=$(echo "$DB_INSTANCE_INFO" | jq -r '.BackupRetentionPeriod')
LATEST_BACKUP=$(echo "$DB_INSTANCE_INFO" | jq -r '.LatestRestorableTime // "None"')
BACKUP_WINDOW=$(echo "$DB_INSTANCE_INFO" | jq -r '.PreferredBackupWindow')

print_status "Backup Retention Period: $BACKUP_RETENTION days"
print_status "Latest Restorable Time: $LATEST_BACKUP"
print_status "Backup Window: $BACKUP_WINDOW"

# Check S3 manual backups
print_status "Checking S3 manual backups..."

S3_BACKUPS=$(aws s3 ls "s3://$S3_BUCKET/database-backups/" --recursive | wc -l)

if [ "$S3_BACKUPS" -gt 0 ]; then
    print_status "Manual backups in S3: $S3_BACKUPS"
    
    # List recent backups
    print_status "Recent manual backups:"
    aws s3 ls "s3://$S3_BUCKET/database-backups/" --recursive | tail -5
else
    print_warning "No manual backups found in S3"
fi

# Check backup health
print_status "Checking backup health..."

# Check if latest backup is recent (within 24 hours)
if [ "$LATEST_BACKUP" != "None" ]; then
    LATEST_BACKUP_EPOCH=$(date -d "$LATEST_BACKUP" +%s)
    CURRENT_EPOCH=$(date +%s)
    HOURS_SINCE_BACKUP=$(( (CURRENT_EPOCH - LATEST_BACKUP_EPOCH) / 3600 ))
    
    if [ "$HOURS_SINCE_BACKUP" -lt 24 ]; then
        print_status "✓ Latest backup is recent ($HOURS_SINCE_BACKUP hours ago)"
    else
        print_warning "⚠ Latest backup is old ($HOURS_SINCE_BACKUP hours ago)"
    fi
else
    print_error "✗ No automated backups found"
fi

print_header "Backup Monitoring Complete!"
EOF

chmod +x monitor-backups.sh

# Create cron job for automated backups
cat > setup-backup-cron.sh << 'EOF'
#!/bin/bash

# Setup Backup Cron Job
# This script sets up a cron job for automated manual backups

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

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_header "Setting up Backup Cron Job"

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create cron job entry (daily backup at 2 AM)
CRON_JOB="0 2 * * * cd $SCRIPT_DIR && ./manual-backup.sh >> backup.log 2>&1"

print_status "Adding cron job for daily backups at 2 AM..."

# Add to crontab
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

print_status "Cron job added successfully!"
print_status "Backup schedule: Daily at 2:00 AM"
print_status "Log file: backup.log"

print_header "Cron Job Setup Complete!"
EOF

chmod +x setup-backup-cron.sh

print_header "Automated Backup Setup Complete!"

print_status "Created scripts:"
print_status "  - manual-backup.sh: Create manual backups"
print_status "  - restore-backup.sh: Restore from backup"
print_status "  - monitor-backups.sh: Monitor backup health"
print_status "  - setup-backup-cron.sh: Setup automated cron job"

print_status ""
print_status "Next steps:"
print_status "1. Run: ./setup-backup-cron.sh (to enable automated backups)"
print_status "2. Test manual backup: ./manual-backup.sh"
print_status "3. Monitor backups: ./monitor-backups.sh"
print_status "4. Set up CloudWatch alarms for backup monitoring" 
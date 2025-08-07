#!/bin/bash

# Docker Scripts for SaaS Automation Platform
# Usage: ./docker-scripts.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Development commands
dev_start() {
    print_header "Starting Development Environment"
    check_docker
    docker-compose -f docker-compose.dev.yml up --build -d
    print_status "Development environment started!"
    print_status "App: http://localhost:3000"
    print_status "Database: localhost:5432"
    print_status "Redis: localhost:6379"
}

dev_stop() {
    print_header "Stopping Development Environment"
    docker-compose -f docker-compose.dev.yml down
    print_status "Development environment stopped!"
}

dev_logs() {
    print_header "Development Logs"
    docker-compose -f docker-compose.dev.yml logs -f
}

dev_shell() {
    print_header "Opening Development Shell"
    docker-compose -f docker-compose.dev.yml exec app sh
}

# Production commands
prod_start() {
    print_header "Starting Production Environment"
    check_docker
    docker-compose up --build -d
    print_status "Production environment started!"
    print_status "App: https://your-domain.com"
    print_status "Health check: https://your-domain.com/health"
}

prod_stop() {
    print_header "Stopping Production Environment"
    docker-compose down
    print_status "Production environment stopped!"
}

prod_logs() {
    print_header "Production Logs"
    docker-compose logs -f
}

prod_shell() {
    print_header "Opening Production Shell"
    docker-compose exec app sh
}

# Database commands
db_migrate() {
    print_header "Running Database Migrations"
    docker-compose exec app npx prisma db push
    print_status "Database migrations completed!"
}

db_generate() {
    print_header "Generating Prisma Client"
    docker-compose exec app npx prisma generate
    print_status "Prisma client generated!"
}

db_shell() {
    print_header "Opening Database Shell"
    docker-compose exec postgres psql -U postgres -d saas_automation
}

db_backup() {
    print_header "Creating Database Backup"
    timestamp=$(date +%Y%m%d_%H%M%S)
    docker-compose exec postgres pg_dump -U postgres saas_automation > "backup_${timestamp}.sql"
    print_status "Database backup created: backup_${timestamp}.sql"
}

db_restore() {
    if [ -z "$1" ]; then
        print_error "Please provide backup file: ./docker-scripts.sh db_restore backup_file.sql"
        exit 1
    fi
    print_header "Restoring Database from Backup"
    docker-compose exec -T postgres psql -U postgres -d saas_automation < "$1"
    print_status "Database restored from $1"
}

# Utility commands
cleanup() {
    print_header "Cleaning Up Docker Resources"
    docker system prune -a -f
    print_status "Docker cleanup completed!"
}

status() {
    print_header "Container Status"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

stats() {
    print_header "Resource Usage"
    docker stats --no-stream
}

build() {
    print_header "Building Docker Images"
    docker-compose build --no-cache
    print_status "Docker images built!"
}

pull() {
    print_header "Pulling Latest Images"
    docker-compose pull
    print_status "Latest images pulled!"
}

# Health checks
health() {
    print_header "Health Checks"
    
    # Check if containers are running
    if docker ps | grep -q "saas-automation-app"; then
        print_status "App container: Running"
    else
        print_error "App container: Not running"
    fi
    
    if docker ps | grep -q "saas-automation-db"; then
        print_status "Database container: Running"
    else
        print_error "Database container: Not running"
    fi
    
    if docker ps | grep -q "saas-automation-redis"; then
        print_status "Redis container: Running"
    else
        print_error "Redis container: Not running"
    fi
}

# Help function
show_help() {
    print_header "Docker Scripts Help"
    echo "Usage: ./docker-scripts.sh [command]"
    echo ""
    echo "Development Commands:"
    echo "  dev_start    - Start development environment"
    echo "  dev_stop     - Stop development environment"
    echo "  dev_logs     - View development logs"
    echo "  dev_shell    - Open development shell"
    echo ""
    echo "Production Commands:"
    echo "  prod_start   - Start production environment"
    echo "  prod_stop    - Stop production environment"
    echo "  prod_logs    - View production logs"
    echo "  prod_shell   - Open production shell"
    echo ""
    echo "Database Commands:"
    echo "  db_migrate   - Run database migrations"
    echo "  db_generate  - Generate Prisma client"
    echo "  db_shell     - Open database shell"
    echo "  db_backup    - Create database backup"
    echo "  db_restore   - Restore database from backup"
    echo ""
    echo "Utility Commands:"
    echo "  cleanup      - Clean up Docker resources"
    echo "  status       - Show container status"
    echo "  stats        - Show resource usage"
    echo "  build        - Build Docker images"
    echo "  pull         - Pull latest images"
    echo "  health       - Run health checks"
    echo "  help         - Show this help"
}

# Main script logic
case "${1:-help}" in
    # Development commands
    dev_start) dev_start ;;
    dev_stop) dev_stop ;;
    dev_logs) dev_logs ;;
    dev_shell) dev_shell ;;
    
    # Production commands
    prod_start) prod_start ;;
    prod_stop) prod_stop ;;
    prod_logs) prod_logs ;;
    prod_shell) prod_shell ;;
    
    # Database commands
    db_migrate) db_migrate ;;
    db_generate) db_generate ;;
    db_shell) db_shell ;;
    db_backup) db_backup ;;
    db_restore) db_restore "$2" ;;
    
    # Utility commands
    cleanup) cleanup ;;
    status) status ;;
    stats) stats ;;
    build) build ;;
    pull) pull ;;
    health) health ;;
    
    # Help
    help|*) show_help ;;
esac 
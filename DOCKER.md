# Docker Setup for SaaS Automation Platform

This document provides comprehensive instructions for containerizing and deploying the SaaS Automation Platform using Docker.

## 🐳 Overview

The application is containerized with:
- **Multi-stage Docker builds** for optimized production images
- **Docker Compose** for easy orchestration
- **PostgreSQL** for the database
- **Redis** for caching and session storage
- **Nginx** for reverse proxy and SSL termination
- **Development and production** configurations

## 📁 Docker Files

- `Dockerfile` - Production build with multi-stage optimization
- `Dockerfile.dev` - Development build with hot reloading
- `docker-compose.yml` - Production orchestration
- `docker-compose.dev.yml` - Development orchestration
- `nginx.conf` - Nginx reverse proxy configuration
- `.dockerignore` - Optimized build context

## 🚀 Quick Start

### Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/athsb009/fuzzie-automation.git
   cd fuzzie-automation
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

4. **Access the application**
   - App: http://localhost:3000
   - Database: localhost:5432
   - Redis: localhost:6379

### Production Environment

1. **Set up environment variables**
   ```bash
   # Create production environment file
   cp .env.example .env.production
   # Edit with production values
   ```

2. **Build and start production services**
   ```bash
   docker-compose up --build -d
   ```

3. **Run database migrations**
   ```bash
   docker-compose exec app npx prisma db push
   ```

4. **Access the application**
   - App: https://your-domain.com (with SSL)
   - Health check: https://your-domain.com/health

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/saas_automation

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Google Drive
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH2_REDIRECT_URI=https://your-domain.com/api/auth/callback/google

# Discord
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Slack
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Notion
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret

# Webhook URLs
NGROK_URI=https://your-ngrok-url.ngrok.io
CRON_JOB_KEY=your_cron_job_key

# Redis
REDIS_URL=redis://redis:6379
```

### SSL Certificates

For production with SSL, place your certificates in the `certificates/` directory:
```
certificates/
├── cert.pem
└── key.pem
```

## 🛠️ Docker Commands

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop development environment
docker-compose -f docker-compose.dev.yml down

# Rebuild development image
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Production

```bash
# Start production environment
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop production environment
docker-compose down

# Rebuild production image
docker-compose build --no-cache

# Update and restart
docker-compose pull && docker-compose up -d
```

### Database Operations

```bash
# Run migrations
docker-compose exec app npx prisma db push

# Generate Prisma client
docker-compose exec app npx prisma generate

# Open database shell
docker-compose exec postgres psql -U postgres -d saas_automation

# Backup database
docker-compose exec postgres pg_dump -U postgres saas_automation > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres -d saas_automation < backup.sql
```

### Utility Commands

```bash
# View running containers
docker ps

# View container logs
docker logs saas-automation-app

# Execute commands in container
docker exec -it saas-automation-app sh

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

## 📊 Monitoring

### Health Checks

- **Application**: `GET /health`
- **Database**: `docker-compose exec postgres pg_isready`
- **Redis**: `docker-compose exec redis redis-cli ping`

### Logs

```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres

# Redis logs
docker-compose logs -f redis

# Nginx logs
docker-compose logs -f nginx
```

### Performance Monitoring

```bash
# Container resource usage
docker stats

# Disk usage
docker system df

# Network usage
docker network ls
```

## 🔒 Security

### Production Security Checklist

- [ ] Use strong passwords for database
- [ ] Configure SSL certificates
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure security headers
- [ ] Use secrets management
- [ ] Regular security updates

### Security Headers

The Nginx configuration includes:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`

## 🚀 Deployment Options

### 1. Docker Compose (Recommended for small-medium scale)

```bash
# Production deployment
docker-compose up -d

# With custom environment file
docker-compose --env-file .env.production up -d
```

### 2. Docker Swarm (For multi-node deployment)

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml saas-automation
```

### 3. Kubernetes (For large-scale deployment)

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Deploy to specific namespace
kubectl apply -f k8s/ -n saas-automation
```

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   
   # Change ports in docker-compose.yml
   ports:
     - "3001:3000"
   ```

2. **Database connection issues**
   ```bash
   # Check database status
   docker-compose exec postgres pg_isready
   
   # Reset database
   docker-compose down -v
   docker-compose up -d
   ```

3. **Memory issues**
   ```bash
   # Increase memory limits
   docker-compose exec app node --max-old-space-size=4096
   ```

4. **Build failures**
   ```bash
   # Clear Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

### Debug Commands

```bash
# Inspect container
docker inspect saas-automation-app

# View container processes
docker exec saas-automation-app ps aux

# Check environment variables
docker exec saas-automation-app env

# View network configuration
docker network inspect saas-automation_saas-network
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale application instances
docker-compose up -d --scale app=3

# Scale with Docker Swarm
docker service scale saas-automation_app=5
```

### Vertical Scaling

```bash
# Increase memory limits
docker-compose up -d --scale app=1
# Edit docker-compose.yml to add memory limits
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          docker-compose pull
          docker-compose up -d
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/docker)

---

For support, please open an issue on GitHub or contact the development team. 
# SaaS Automation Platform

A powerful workflow automation platform that connects multiple services like Google Drive, Discord, Slack, and Notion to create seamless automation workflows.

## 🚀 Features

- **Visual Workflow Builder**: Drag-and-drop interface for creating automation workflows
- **Multi-Service Integration**: Connect with Google Drive, Discord, Slack, Notion, and more
- **Real-time Execution**: Monitor workflow executions with detailed logging
- **Event-Driven Architecture**: Apache Kafka for scalable, asynchronous workflow processing
- **Credit System**: Pay-per-use model with credit tracking
- **Webhook Support**: Trigger workflows via Google Drive changes
- **Dashboard Analytics**: Real-time insights into workflow performance
- **Asynchronous Processing**: Background workflow execution with event streaming

## 📸 Screenshots
### Landing Page
![Fuzzie Landing Page](./screenshots/landing-page.png)
### Landing Page & Pricing
![Fuzzie Landing Page Price](./screenshots/landing-page-pricing.png)
*Flexible pricing plans: Hobby (Free), Pro ($29/mo), and Unlimited ($99/mo) with credit-based automation system*

### Dashboard Overview
![Dashboard](./screenshots/dashboard-overview.png)
*Comprehensive dashboard showing workflow statistics, execution metrics, success rates, and service connection status*

### Service Connections
![Connections](./screenshots/service-connections.png)
*Easy integration with popular services including Google Drive, Discord, Slack, and Notion*

### Visual Workflow Builder
![Workflow Editor](./screenshots/workflow-editor.png)
*Intuitive drag-and-drop workflow builder with conditional logic, triggers, and actions for seamless automation*

### Billing & Credits
![Billing System](./screenshots/billing-credits.png)
*Transparent credit tracking system with real-time usage monitoring and flexible subscription options*

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js 15 Frontend<br/>React 19 + TypeScript]
        Auth[Clerk Authentication]
        UI --> Auth
    end

    subgraph "API Layer"
        API[Next.js API Routes]
        Webhooks[Webhook Handlers]
        API --> Webhooks
    end

    subgraph "Core Services"
        WE[Workflow Engine]
        EL[Execution Logger]
        CS[Credit System]
        KE[Kafka Event System]
        WE --> EL
        WE --> CS
        WE --> KE
    end

    subgraph "Database Layer"
        DB[(PostgreSQL Database)]
        Prisma[Prisma ORM]
        Prisma --> DB
    end

    subgraph "Event Streaming"
        Kafka[Apache Kafka]
        ZK[Zookeeper]
        Topics[Event Topics]
        Kafka --> ZK
        Kafka --> Topics
    end

    subgraph "External Services"
        Google[Google Drive API]
        Discord[Discord API]
        Slack[Slack API]
        Notion[Notion API]
        Stripe[Stripe Payments]
    end

    subgraph "Monitoring & Analytics"
        Analytics[Real-time Analytics]
        Logs[Activity Logs]
        Metrics[Performance Metrics]
    end

    %% Frontend connections
    UI --> API
    Auth --> API

    %% API to Core Services
    API --> WE
    API --> CS
    API --> Analytics
    API --> KE

    %% Core Services to Database
    WE --> Prisma
    EL --> Prisma
    CS --> Prisma
    Analytics --> Prisma

    %% Event Streaming connections
    KE --> Kafka
    WE --> Kafka
    API --> Kafka

    %% External API connections
    API --> Google
    API --> Discord
    API --> Slack
    API --> Notion
    API --> Stripe

    %% Webhook connections
    Google -.-> Webhooks
    Discord -.-> Webhooks
    Slack -.-> Webhooks
    Notion -.-> Webhooks

    %% Workflow execution flow
    WE --> Google
    WE --> Discord
    WE --> Slack
    WE --> Notion

    %% Monitoring connections
    WE --> Logs
    API --> Metrics

    %% Styling
    classDef frontend fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef core fill:#e8f5e8
    classDef database fill:#fff3e0
    classDef external fill:#fce4ec
    classDef monitoring fill:#f1f8e9

    class UI,Auth frontend
    class API,Webhooks api
    class WE,EL,CS,KE core
    class DB,Prisma database
    class Kafka,ZK,Topics fill:#e3f2fd
    class Google,Discord,Slack,Notion,Stripe external
    class Analytics,Logs,Metrics monitoring
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Payments**: Stripe
- **Event Streaming**: Apache Kafka with Zookeeper
- **Workflow Engine**: Custom execution engine with Kafka integration
- **Integrations**: Google Drive API, Discord API, Slack API, Notion API

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Docker and Docker Compose (for Kafka infrastructure)
- Clerk account for authentication
- Stripe account for payments
- Google Cloud Console project
- Discord/Slack/Notion developer accounts

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd saas_automation
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/saas_automation"

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Google Drive
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH2_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

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

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=saas-automation-app
```

### 4. Set up the database
```bash
npx prisma generate
npx prisma db push
```

### 5. Start Kafka infrastructure
```bash
# Start Kafka and Zookeeper using Docker Compose
docker-compose -f docker-compose.dev.yml up -d kafka zookeeper

# Wait for Kafka to be ready (about 30 seconds)
docker-compose -f docker-compose.dev.yml logs kafka
```

### 6. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
saas_automation/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (main)/            # Main application pages
│   │   │   ├── dashboard/     # Dashboard with analytics
│   │   │   ├── workflows/     # Workflow builder
│   │   │   ├── connections/   # Service connections
│   │   │   ├── billing/       # Payment management
│   │   │   └── settings/      # User settings
│   │   └── api/               # API routes
│   │       ├── kafka/         # Kafka test endpoints
│   │       └── workflow/      # Workflow event endpoints
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utility functions
│   │   ├── kafka.ts          # Kafka client configuration
│   │   ├── workflow-kafka-service.ts  # Workflow event publishing
│   │   └── workflow-consumer.ts       # Event consumers
│   └── providers/             # React context providers
├── prisma/                    # Database schema
├── public/                    # Static assets
└── certificates/              # SSL certificates
```

## 🔧 Configuration

### Database Setup
The application uses PostgreSQL with Prisma ORM. Key models include:
- `User`: User accounts and billing information
- `Workflows`: Workflow definitions and configurations
- `WorkflowExecution`: Execution logs and status
- `WorkflowActivity`: Individual step activities

### Authentication
Clerk handles user authentication with OAuth providers:
- Google (for Drive access)
- Discord
- Slack
- Notion

### Webhook Setup
Google Drive webhooks are configured to trigger workflows when files change. The webhook endpoint is at `/api/drive-activity/notification`.

### Kafka Event System
The platform uses Apache Kafka for event-driven architecture:

#### Event Topics
- **`workflow-events`**: Core workflow lifecycle events
  - `workflow.created`: When a new workflow is created
  - `workflow.published`: When a workflow is published
  - `workflow.template_updated`: When workflow templates are updated

#### Event Flow
1. **Workflow Actions** → **Kafka Producer** → **Event Topics**
2. **Event Topics** → **Kafka Consumers** → **Background Processing**
3. **Real-time Monitoring** → **Dashboard Updates**

#### Kafka Configuration
- **Broker**: `localhost:9092` (development), `kafka:29092` (Docker)
- **Client ID**: `saas-automation-app`
- **Consumer Group**: `workflow-processor-group`

## 🎯 Key Features

### Workflow Builder
- Visual drag-and-drop interface
- Support for multiple service integrations
- Conditional logic and wait steps
- Template system for common workflows

### Execution Engine
- Real-time workflow execution
- Asynchronous processing with Kafka events
- Detailed activity logging
- Error handling and retry logic
- Credit deduction system
- Event-driven workflow triggers

### Dashboard
- Real-time execution statistics
- Success rate monitoring
- Recent activity feed
- Credit usage tracking

## 🔌 API Endpoints

### Workflow Management
- `GET /api/workflows` - List user workflows
- `POST /api/workflows` - Create new workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

### Execution
- `POST /api/workflow/execute` - Execute workflow
- `GET /api/workflow/execute/:id` - Get execution status

### Analytics
- `GET /api/analytics/executions-today` - Today's executions
- `GET /api/analytics/success-rate` - Success rate
- `GET /api/analytics/recent-activities` - Recent activities

### Kafka Testing
- `GET /api/kafka/test` - Test Kafka producer connection
- `POST /api/kafka/test` - Send test message to Kafka
- `POST /api/kafka/consumer` - Start/stop Kafka consumers
- `POST /api/workflow/test-event` - Trigger test workflow event

### Webhooks
- `POST /api/drive-activity/notification` - Google Drive webhook
- `POST /api/discord/callback` - Discord OAuth callback
- `POST /api/slack/callback` - Slack OAuth callback
- `POST /api/notion/callback` - Notion OAuth callback

## 🧪 Testing Kafka Integration

### 1. Start Kafka Infrastructure
```bash
# Start Kafka and Zookeeper
docker-compose -f docker-compose.dev.yml up -d kafka zookeeper

# Check Kafka status
docker-compose -f docker-compose.dev.yml logs kafka
```

### 2. Test Kafka Producer
```bash
# Test producer connection
curl http://localhost:3000/api/kafka/test

# Send test message
curl -X POST http://localhost:3000/api/kafka/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Kafka!", "userId": "test-user"}'
```

### 3. Test Workflow Events
```bash
# Trigger test workflow event
curl -X POST http://localhost:3000/api/workflow/test-event \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "test-workflow-123",
    "userId": "test-user-456",
    "eventType": "workflow.created",
    "data": {"name": "Test Workflow"}
  }'
```

### 4. Monitor Events
Check your application logs to see workflow events being published:
```bash
# Watch application logs
npm run dev

# In another terminal, watch Kafka logs
docker-compose -f docker-compose.dev.yml logs -f kafka
```

### 5. Test Real Workflow Events
1. Create a new workflow in the UI
2. Publish the workflow
3. Update workflow templates
4. Check server logs for event publishing

## 🚀 Deployment

### Development with Docker
```bash
# Start all services including Kafka
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Production Deployment
```bash
# Start production services
docker-compose up -d

# Monitor Kafka
docker-compose logs -f kafka
```

### Vercel (Recommended for Frontend)
1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch
4. Note: Kafka requires separate infrastructure (AWS MSK, Confluent Cloud, etc.)

### Manual Deployment
1. Build the application: `npm run build`
2. Start the production server: `npm start`
3. Set up a reverse proxy (nginx) for SSL termination
4. Deploy Kafka infrastructure separately

## 🔒 Security

- Environment variables for sensitive data
- OAuth 2.0 for service authentication
- Webhook signature verification
- Rate limiting on API endpoints
- Input validation with Zod schemas

## 📊 Monitoring

The application includes comprehensive logging:
- Workflow execution logs
- API request/response logs
- Error tracking and reporting
- Performance metrics
- Kafka event streaming logs
- Real-time event monitoring

## 🎯 Kafka Benefits

### Why Kafka?
- **Scalability**: Handle thousands of concurrent workflow events
- **Reliability**: Guaranteed message delivery with acknowledgments
- **Performance**: Low-latency event processing
- **Decoupling**: Separate event producers from consumers
- **Durability**: Events are persisted and can be replayed

### Use Cases
- **Workflow Lifecycle Events**: Track creation, publishing, and updates
- **Real-time Notifications**: Instant user notifications for workflow status
- **Analytics**: Event-driven analytics and reporting
- **Audit Trail**: Complete history of all workflow activities
- **Background Processing**: Asynchronous workflow execution
- **Integration Events**: Trigger external system integrations

### Event-Driven Architecture Benefits
- **Loose Coupling**: Services communicate through events
- **Extensibility**: Easy to add new event consumers
- **Resilience**: System continues working even if some components fail
- **Observability**: Complete visibility into system events

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

Built with ❤️ using Next.js, React, and TypeScript by Atharva Bibave

# SaaS Automation Platform

A powerful workflow automation platform that connects multiple services like Google Drive, Discord, Slack, and Notion to create seamless automation workflows.

## 🚀 Features

- **Visual Workflow Builder**: Drag-and-drop interface for creating automation workflows
- **Multi-Service Integration**: Connect with Google Drive, Discord, Slack, Notion, and more
- **Real-time Execution**: Monitor workflow executions with detailed logging
- **Credit System**: Pay-per-use model with credit tracking
- **Webhook Support**: Trigger workflows via Google Drive changes
- **Dashboard Analytics**: Real-time insights into workflow performance

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Payments**: Stripe
- **Workflow Engine**: Custom execution engine
- **Integrations**: Google Drive API, Discord API, Slack API, Notion API

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
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
```

### 4. Set up the database
```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server
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
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utility functions
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

## 🎯 Key Features

### Workflow Builder
- Visual drag-and-drop interface
- Support for multiple service integrations
- Conditional logic and wait steps
- Template system for common workflows

### Execution Engine
- Real-time workflow execution
- Detailed activity logging
- Error handling and retry logic
- Credit deduction system

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

### Webhooks
- `POST /api/drive-activity/notification` - Google Drive webhook
- `POST /api/discord/callback` - Discord OAuth callback
- `POST /api/slack/callback` - Slack OAuth callback
- `POST /api/notion/callback` - Notion OAuth callback

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application: `npm run build`
2. Start the production server: `npm start`
3. Set up a reverse proxy (nginx) for SSL termination

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using Next.js, React, and TypeScript

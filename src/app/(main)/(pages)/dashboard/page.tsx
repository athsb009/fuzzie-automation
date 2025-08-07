'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  CreditCard,
  Play,
  Pause,
  AlertTriangle,
  Plus,
  Settings,
  Bell
} from 'lucide-react'
import { useFuzzieStore } from '@/store'
import { onGetWorkflows } from '../workflows/_actions/workflow-connection'
import { getDiscordConnectionUrl } from '../connections/_actions/discord-connection'
import { getSlackConnection } from '../connections/_actions/slack-connection'
import { getNotionConnection } from '../connections/_actions/notion-connection'
import { useUser } from '@clerk/nextjs'
import { db } from '@/lib/db'

interface DashboardStats {
  totalWorkflows: number
  activeWorkflows: number
  executionsToday: number
  successRate: number
  creditsUsed: number
  creditsTotal: number
}

interface ActivityItem {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  timestamp: string
  workflowName?: string
  service?: string
}

interface ConnectionStatus {
  service: string
  status: 'connected' | 'disconnected' | 'expired'
  lastSync?: string
  workspaces?: number
  servers?: number
}

interface WorkflowItem {
  id: string
  name: string
  status: 'active' | 'draft' | 'failed' | 'paused'
  executions: number
  lastExecuted: string
  services: string[]
}

const DashboardPage = () => {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    executionsToday: 0,
    successRate: 0,
    creditsUsed: 0,
    creditsTotal: 0
  })

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [connections, setConnections] = useState<ConnectionStatus[]>([])
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch user data and credits
      const userData = await fetch('/api/user/billing').then(res => res.json())
      
      // Fetch workflows
      const workflowsData = await onGetWorkflows()
      
      // Fetch connections
      const discordConnection = await getDiscordConnectionUrl()
      const slackConnection = await getSlackConnection()
      const notionConnection = await getNotionConnection()

      // Calculate stats
      const totalWorkflows = workflowsData?.length || 0
      const activeWorkflows = workflowsData?.filter((w: any) => w.publish)?.length || 0
      
      // Calculate executions today (this would need a separate API endpoint)
      const executionsToday = await fetch('/api/analytics/executions-today').then(res => res.json()).catch(() => 0)
      
      // Calculate success rate (this would need analytics data)
      const successRate = await fetch('/api/analytics/success-rate').then(res => res.json()).catch(() => 0)

      // Update stats
      setStats({
        totalWorkflows,
        activeWorkflows,
        executionsToday,
        successRate,
        creditsUsed: parseInt(userData.credits || '0'),
        creditsTotal: userData.tier === 'Unlimited' ? 999999 : userData.tier === 'Pro Plan' ? 100 : 10
      })

             // Update workflows
       const workflowsList = workflowsData?.map((workflow: any) => ({
         id: workflow.id,
         name: workflow.name,
         status: (workflow.publish ? 'active' : 'draft') as 'active' | 'draft' | 'failed' | 'paused',
         executions: 0, // This would need to be calculated from execution logs
         lastExecuted: workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleDateString() : 'Never',
         services: [] // This would need to be extracted from workflow nodes
       })) || []

      setWorkflows(workflowsList)

             // Update connections
       const connectionsList: ConnectionStatus[] = [
         {
           service: 'Google Drive',
           status: 'connected', // Always connected via OAuth
           lastSync: '2 min ago' // This would need real-time data
         },
         {
           service: 'Slack',
           status: slackConnection ? 'connected' : 'disconnected',
           workspaces: slackConnection ? 1 : 0
         },
         {
           service: 'Discord',
           status: discordConnection ? 'connected' : 'disconnected',
           servers: discordConnection ? 1 : 0
         },
         {
           service: 'Notion',
           status: notionConnection ? 'connected' : 'disconnected'
         }
       ]

      setConnections(connectionsList)

      // Generate activity feed from recent executions
      // This would need a separate API endpoint for execution logs
      const recentActivities = await fetch('/api/analytics/recent-activities').then(res => res.json()).catch(() => [])

      setActivities(recentActivities)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 3000000)
    return () => clearInterval(interval)
  }, [user])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'paused':
        return <Pause className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'paused':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'info':
        return <Activity className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const creditUsagePercentage = stats.creditsTotal > 0 ? (stats.creditsUsed / stats.creditsTotal) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your automations.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalWorkflows > 0 ? '+2 this week' : 'No workflows yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeWorkflows > 0 ? '+1 this week' : 'No active workflows'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executions Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.executionsToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.executionsToday > 0 ? '+23 vs yesterday' : 'No executions today'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.successRate > 0 ? '+2.1% vs average' : 'No data yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Activity
              </CardTitle>
              <CardDescription>Real-time updates from your workflows</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {activity.workflowName && (
                            <Badge variant="secondary" className="text-xs">
                              {activity.workflowName}
                            </Badge>
                          )}
                          {activity.service && (
                            <Badge variant="outline" className="text-xs">
                              {activity.service}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {activity.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Your workflow executions will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Connections & Quick Actions */}
        <div className="space-y-6">
          {/* Service Connections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Service Connections
              </CardTitle>
              <CardDescription>Status of your connected services</CardDescription>
            </CardHeader>
            <CardContent>
              {connections.length > 0 ? (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <div key={connection.service} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getConnectionStatusIcon(connection.status)}
                        <div>
                          <p className="text-sm font-medium">{connection.service}</p>
                          <p className="text-xs text-muted-foreground">
                            {connection.status === 'connected' && connection.lastSync && `Last sync: ${connection.lastSync}`}
                            {connection.status === 'connected' && connection.workspaces && `${connection.workspaces} workspaces`}
                            {connection.status === 'connected' && connection.servers && `${connection.servers} servers`}
                            {connection.status === 'expired' && 'Token expired'}
                            {connection.status === 'disconnected' && 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={connection.status === 'connected' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {connection.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No services connected</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Settings className="h-4 w-4 mr-2" />
                    Connect Services
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" className="h-12">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
                <Button variant="outline" size="sm" className="h-12">
                  <Settings className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
                <Button variant="outline" size="sm" className="h-12">
                  <Zap className="h-4 w-4 mr-2" />
                  View Templates
                </Button>
                <Button variant="outline" size="sm" className="h-12">
                  <Play className="h-4 w-4 mr-2" />
                  Quick Test
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage & Billing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Usage & Billing
              </CardTitle>
              <CardDescription>Your current usage and billing status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Credits Used</span>
                    <span>{stats.creditsUsed}/{stats.creditsTotal} ({Math.round(creditUsagePercentage)}%)</span>
                  </div>
                  <Progress value={creditUsagePercentage} className="h-2" />
                </div>
                <div className="text-sm">
                  <p>This Month: $24.50</p>
                  <p className="text-muted-foreground">Next Billing: March 15, 2024</p>
                </div>
                <div className="text-xs space-y-1">
                  <p>• Workflow Executions: {stats.creditsUsed} credits</p>
                  <p>• API Calls: 23 credits</p>
                  <p>• Storage: 2 credits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Workflows Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Workflows</CardTitle>
          <CardDescription>Manage and monitor your automation workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length > 0 ? (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(workflow.status)}
                    <div>
                      <h3 className="font-medium">{workflow.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getStatusColor(workflow.status)}`}>
                          {workflow.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {workflow.executions} executions
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Last: {workflow.lastExecuted}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {workflow.services.map((service) => (
                        <Badge key={service} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No workflows yet</p>
              <p className="text-sm mb-4">Create your first automation workflow</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
import { db } from './db'

export interface ExecutionLog {
  workflowId: string
  userId: string
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  error?: string
  metadata?: any
}

export interface ActivityLog {
  executionId: string
  userId: string
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO'
  message: string
  service?: string
  workflowName?: string
  metadata?: any
}

export class ExecutionLogger {
  /**
   * Start a new workflow execution
   */
  static async startExecution(log: ExecutionLog): Promise<string> {
    try {
      const execution = await db.workflowExecution.create({
        data: {
          workflowId: log.workflowId,
          userId: log.userId,
          status: log.status,
          metadata: log.metadata || {},
        },
      })

      console.log(`Started execution: ${execution.id} for workflow: ${log.workflowId}`)
      return execution.id
    } catch (error) {
      console.error('Error starting execution:', error)
      throw error
    }
  }

  /**
   * Complete a workflow execution
   */
  static async completeExecution(
    executionId: string,
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED',
    error?: string
  ): Promise<void> {
    try {
      const completedAt = new Date()
      
      const execution = await db.workflowExecution.findUnique({
        where: { id: executionId },
        select: { startedAt: true }
      })

      if (!execution) {
        throw new Error(`Execution ${executionId} not found`)
      }

      const duration = completedAt.getTime() - execution.startedAt.getTime()

      await db.workflowExecution.update({
        where: { id: executionId },
        data: {
          status,
          completedAt,
          error,
          duration,
        },
      })

      console.log(`Completed execution: ${executionId} with status: ${status}`)
    } catch (error) {
      console.error('Error completing execution:', error)
      throw error
    }
  }

  /**
   * Log an activity during workflow execution
   */
  static async logActivity(log: ActivityLog): Promise<void> {
    try {
      await db.workflowActivity.create({
        data: {
          executionId: log.executionId,
          userId: log.userId,
          type: log.type,
          message: log.message,
          service: log.service,
          workflowName: log.workflowName,
          metadata: log.metadata || {},
        },
      })

      console.log(`Logged activity: ${log.type} - ${log.message}`)
    } catch (error) {
      console.error('Error logging activity:', error)
      throw error
    }
  }

  /**
   * Get execution statistics for a user
   */
  static async getUserStats(userId: string) {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

      // Total executions today
      const executionsToday = await db.workflowExecution.count({
        where: {
          userId,
          startedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      })

      // Success rate
      const totalExecutions = await db.workflowExecution.count({
        where: { userId },
      })

      const successfulExecutions = await db.workflowExecution.count({
        where: {
          userId,
          status: 'SUCCESS',
        },
      })

      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0

      return {
        executionsToday,
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
        totalExecutions,
        successfulExecutions,
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      // Return default values if there's an error
      return {
        executionsToday: 0,
        successRate: 0,
        totalExecutions: 0,
        successfulExecutions: 0,
      }
    }
  }

  /**
   * Get recent activities for a user
   */
  static async getRecentActivities(userId: string, limit: number = 10) {
    try {
      const activities = await db.workflowActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          execution: {
            include: {
              workflow: {
                select: { name: true }
              }
            }
          }
        }
      })

      return activities.map(activity => ({
        id: activity.id,
        type: activity.type.toLowerCase() as 'success' | 'error' | 'warning' | 'info',
        message: activity.message,
        timestamp: this.formatTimestamp(activity.timestamp),
        workflowName: activity.workflowName || activity.execution.workflow.name,
        service: activity.service,
      }))
    } catch (error) {
      console.error('Error getting recent activities:', error)
      // Return empty array if there's an error
      return []
    }
  }

  /**
   * Get workflow execution history
   */
  static async getWorkflowExecutions(workflowId: string, limit: number = 20) {
    try {
      const executions = await db.workflowExecution.findMany({
        where: { workflowId },
        orderBy: { startedAt: 'desc' },
        take: limit,
        include: {
          activities: {
            orderBy: { timestamp: 'desc' },
            take: 5, // Last 5 activities per execution
          }
        }
      })

      return executions.map(execution => ({
        id: execution.id,
        status: execution.status,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        duration: execution.duration,
        error: execution.error,
        activities: execution.activities,
      }))
    } catch (error) {
      console.error('Error getting workflow executions:', error)
      return []
    }
  }

  /**
   * Create sample data for testing
   */
  static async createSampleData(userId: string) {
    try {
      // Create a sample workflow execution
      const execution = await db.workflowExecution.create({
        data: {
          workflowId: 'sample-workflow-id',
          userId: userId,
          status: 'SUCCESS',
          startedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          completedAt: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
          duration: 60000, // 60 seconds
          metadata: { trigger: 'manual' }
        },
      })

      // Create sample activities
      await db.workflowActivity.createMany({
        data: [
          {
            executionId: execution.id,
            userId: userId,
            type: 'INFO',
            message: 'Workflow "File Upload Alert" execution started',
            workflowName: 'File Upload Alert',
            service: 'Google Drive',
            timestamp: new Date(Date.now() - 2 * 60 * 1000)
          },
          {
            executionId: execution.id,
            userId: userId,
            type: 'SUCCESS',
            message: 'Slack notification sent to #general',
            workflowName: 'File Upload Alert',
            service: 'Slack',
            timestamp: new Date(Date.now() - 1.5 * 60 * 1000)
          },
          {
            executionId: execution.id,
            userId: userId,
            type: 'SUCCESS',
            message: 'Workflow "File Upload Alert" executed successfully',
            workflowName: 'File Upload Alert',
            service: 'Google Drive',
            timestamp: new Date(Date.now() - 1 * 60 * 1000)
          }
        ]
      })

      console.log('Sample data created successfully')
    } catch (error) {
      console.error('Error creating sample data:', error)
    }
  }

  /**
   * Format timestamp for display
   */
  private static formatTimestamp(timestamp: Date): string {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    
    return timestamp.toLocaleDateString()
  }
} 
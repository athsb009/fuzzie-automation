import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ExecutionLogger } from '@/lib/execution-logger'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get real success rate from execution logs
    const stats = await ExecutionLogger.getUserStats(userId)
    
    // If no data exists, create sample data for testing
    if (stats.totalExecutions === 0) {
      await ExecutionLogger.createSampleData(userId)
      // Get stats again after creating sample data
      const updatedStats = await ExecutionLogger.getUserStats(userId)
      return NextResponse.json(updatedStats.successRate, { status: 200 })
    }
    
    return NextResponse.json(stats.successRate, { status: 200 })

  } catch (error) {
    console.error('Error fetching success rate:', error)
    return NextResponse.json(0, { status: 200 }) // Return 0 as fallback
  }
} 
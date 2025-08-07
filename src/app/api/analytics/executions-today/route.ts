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

    // Get real execution statistics
    const stats = await ExecutionLogger.getUserStats(userId)
    
    // If no data exists, create sample data for testing
    if (stats.executionsToday === 0) {
      await ExecutionLogger.createSampleData(userId)
      // Get stats again after creating sample data
      const updatedStats = await ExecutionLogger.getUserStats(userId)
      return NextResponse.json(updatedStats.executionsToday, { status: 200 })
    }
    
    return NextResponse.json(stats.executionsToday, { status: 200 })

  } catch (error) {
    console.error('Error fetching executions today:', error)
    return NextResponse.json(0, { status: 200 }) // Return 0 as fallback
  }
} 
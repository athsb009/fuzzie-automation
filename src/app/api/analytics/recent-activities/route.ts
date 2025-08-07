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

    // Get real recent activities from execution logs
    const recentActivities = await ExecutionLogger.getRecentActivities(userId, 10)
    
    // If no activities exist, create sample data for testing
    if (recentActivities.length === 0) {
      await ExecutionLogger.createSampleData(userId)
      // Get activities again after creating sample data
      const updatedActivities = await ExecutionLogger.getRecentActivities(userId, 10)
      return NextResponse.json(updatedActivities, { status: 200 })
    }
    
    return NextResponse.json(recentActivities, { status: 200 })

  } catch (error) {
    console.error('Error fetching recent activities:', error)
    return NextResponse.json([], { status: 200 }) // Return empty array as fallback
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { eventType, workflowId, data } = await request.json();

    if (!eventType || !workflowId) {
      return NextResponse.json(
        { error: 'eventType and workflowId are required' },
        { status: 400 }
      );
    }

    // Simulate workflow event
    const event = {
      type: eventType,
      workflowId,
      userId,
      timestamp: new Date().toISOString(),
      data
    };

    console.log('📨 Manual Workflow Event Triggered:', event);

    // Here you would normally send to Kafka
    // For now, we'll just log it
    console.log('✅ Event logged successfully');

    return NextResponse.json({
      success: true,
      message: 'Workflow event triggered successfully',
      event
    });

  } catch (error) {
    console.error('Error triggering workflow event:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger workflow event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Workflow Event Test Endpoint',
    usage: 'POST with { eventType, workflowId, data }',
    examples: [
      {
        eventType: 'workflow.created',
        workflowId: 'test-workflow-123',
        data: { name: 'Test Workflow', description: 'A test workflow' }
      },
      {
        eventType: 'workflow.published',
        workflowId: 'test-workflow-123',
        data: { published: true }
      },
      {
        eventType: 'workflow.template_updated',
        workflowId: 'test-workflow-123',
        data: { type: 'Discord', template: 'Hello from Discord!' }
      }
    ]
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { simpleKafkaConsumer } from '@/lib/kafka';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'start') {
      // Connect to Kafka if not already connected
      await simpleKafkaConsumer.connect();

      // Start consuming test events
      await simpleKafkaConsumer.subscribeToTestEvents();

      return NextResponse.json({
        success: true,
        message: 'Kafka consumer started successfully',
        timestamp: new Date().toISOString()
      });

    } else if (action === 'stop') {
      await simpleKafkaConsumer.disconnect();

      return NextResponse.json({
        success: true,
        message: 'Kafka consumer stopped successfully',
        timestamp: new Date().toISOString()
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error managing Kafka consumer:', error);
    return NextResponse.json(
      { 
        error: 'Failed to manage Kafka consumer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Test consumer connection
    await simpleKafkaConsumer.connect();
    
    return NextResponse.json({
      success: true,
      message: 'Kafka consumer connection test successful',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing Kafka consumer connection:', error);
    return NextResponse.json(
      { 
        error: 'Kafka consumer connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

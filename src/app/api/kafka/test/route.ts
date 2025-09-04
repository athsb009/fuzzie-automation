import { NextRequest, NextResponse } from 'next/server';
import { simpleKafkaProducer } from '@/lib/kafka';

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Connect to Kafka if not already connected
    await simpleKafkaProducer.connect();

    // Send test message
    const result = await simpleKafkaProducer.sendTestMessage(message, userId);

    return NextResponse.json({
      success: true,
      message: 'Test message sent to Kafka successfully',
      data: result
    });

  } catch (error) {
    console.error('Error sending test message to Kafka:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send message to Kafka',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Test Kafka connection
    await simpleKafkaProducer.connect();
    
    return NextResponse.json({
      success: true,
      message: 'Kafka connection test successful',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing Kafka connection:', error);
    return NextResponse.json(
      { 
        error: 'Kafka connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

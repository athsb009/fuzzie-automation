// Workflow Event Consumer
// This service processes workflow events from Kafka

import { simpleKafkaConsumer, KAFKA_TOPICS, WorkflowEventMessage, consumer } from './kafka';

interface WorkflowEvent {
  type: string;
  workflowId: string;
  userId: string;
  timestamp: string;
  data?: any;
}

class WorkflowEventConsumer {
  private isRunning = false;

  async start() {
    if (this.isRunning) {
      console.log('Workflow consumer already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Workflow Event Consumer...');
    
    try {
      // Connect to Kafka consumer
      await consumer.connect();
      
      // Subscribe to workflow events topic
      await consumer.subscribe({ topic: KAFKA_TOPICS.WORKFLOW_EVENTS });
      
      // Start consuming messages
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageData = JSON.parse(message.value?.toString() || '{}') as WorkflowEventMessage;
            console.log('📨 Received workflow event from Kafka:', {
              topic,
              partition,
              type: messageData.type,
              workflowId: messageData.workflowId
            });
            
            // Process the workflow event
            await this.processWorkflowEvent({
              type: messageData.type,
              workflowId: messageData.workflowId,
              userId: messageData.userId,
              timestamp: messageData.timestamp,
              data: messageData.data
            });
          } catch (error) {
            console.error('❌ Error processing workflow event from Kafka:', error);
          }
        }
      });
      
      console.log('✅ Workflow Event Consumer started and listening for events');
    } catch (error) {
      console.error('❌ Failed to start workflow consumer:', error);
      this.isRunning = false;
      // Fallback to simulation if Kafka is unavailable
      console.log('⚠️ Falling back to simulated event processing');
      this.simulateEventProcessing();
    }
  }

  async stop() {
    this.isRunning = false;
    console.log('🛑 Stopping Workflow Event Consumer...');
    try {
      await consumer.disconnect();
      console.log('✅ Workflow consumer disconnected');
    } catch (error) {
      console.error('Error disconnecting consumer:', error);
    }
  }

  private async simulateEventProcessing() {
    console.log('👂 Workflow consumer is ready to process events...');
    console.log('📨 Listening for workflow events...');
    
    // Simulate processing events every 5 seconds
    const interval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }
      
      console.log('⏰ Workflow consumer is active and ready...');
    }, 5000);
  }

  private async processWorkflowEvent(event: WorkflowEvent) {
    try {
      console.log('🔄 Processing workflow event:', event.type);
      
      switch (event.type) {
        case 'workflow.created':
          await this.handleWorkflowCreated(event);
          break;
        case 'workflow.published':
          await this.handleWorkflowPublished(event);
          break;
        case 'workflow.template_updated':
          await this.handleTemplateUpdated(event);
          break;
        default:
          console.log('Unknown workflow event type:', event.type);
      }
    } catch (error) {
      console.error('Error processing workflow event:', error);
    }
  }

  private async handleWorkflowCreated(event: WorkflowEvent) {
    console.log('✅ Workflow created:', {
      workflowId: event.workflowId,
      userId: event.userId,
      name: event.data?.name,
      description: event.data?.description
    });
    

  }

  private async handleWorkflowPublished(event: WorkflowEvent) {
    console.log('📢 Workflow published:', {
      workflowId: event.workflowId,
      userId: event.userId,
      published: event.data?.published
    });
    
  }

  private async handleTemplateUpdated(event: WorkflowEvent) {
    console.log('📝 Template updated:', {
      workflowId: event.workflowId,
      userId: event.userId,
      type: event.data?.type,
      template: event.data?.template?.substring(0, 50) + '...'
    });

  }
}

// Export singleton instance of WorkflowEventConsumer
export const workflowEventConsumer = new WorkflowEventConsumer();

// Auto-start the consumer in development
if (process.env.NODE_ENV === 'development') workflowEventConsumer.start().catch(console.error);

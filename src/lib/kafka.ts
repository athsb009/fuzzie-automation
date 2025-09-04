import { Kafka, Producer, Consumer } from 'kafkajs';

// Kafka configuration
const kafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'saas-automation-app',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
};

// Create Kafka instance
export const kafka = new Kafka(kafkaConfig);

// Create producer instance
export const producer: Producer = kafka.producer({
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000,
});

// Create consumer instance
export const consumer = kafka.consumer({ 
  groupId: 'saas-automation-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

// Kafka topics - we'll start with just one for testing
export const KAFKA_TOPICS = {
  TEST_EVENTS: 'test-events',
  WORKFLOW_EVENTS: 'workflow-events',
} as const;

// Simple message types for testing
export interface TestEventMessage {
  type: 'test.message';
  message: string;
  timestamp: string;
  userId?: string;
}

export interface WorkflowEventMessage {
  type: 'workflow.created' | 'workflow.updated' | 'workflow.deleted';
  workflowId: string;
  userId: string;
  timestamp: string;
  data?: any;
}

// Simple producer helper
export class SimpleKafkaProducer {
  private producer: Producer;

  constructor() {
    this.producer = producer;
  }

  async connect() {
    try {
      await this.producer.connect();
      console.log('✅ Kafka Producer connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect Kafka Producer:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.producer.disconnect();
      console.log('✅ Kafka Producer disconnected successfully');
    } catch (error) {
      console.error('❌ Failed to disconnect Kafka Producer:', error);
    }
  }

  async sendTestMessage(message: string, userId?: string) {
    try {
      const testMessage: TestEventMessage = {
        type: 'test.message',
        message,
        timestamp: new Date().toISOString(),
        userId
      };

      await this.producer.send({
        topic: KAFKA_TOPICS.TEST_EVENTS,
        messages: [{
          key: userId || 'anonymous',
          value: JSON.stringify(testMessage),
          timestamp: Date.now().toString()
        }]
      });

      console.log('✅ Test message sent successfully:', message);
      return { success: true, message: 'Test message sent' };
    } catch (error) {
      console.error('❌ Failed to send test message:', error);
      throw error;
    }
  }

  async sendWorkflowEvent(message: WorkflowEventMessage) {
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.WORKFLOW_EVENTS,
        messages: [{
          key: message.workflowId,
          value: JSON.stringify(message),
          timestamp: Date.now().toString()
        }]
      });

      console.log('✅ Workflow event sent successfully:', message.type);
      return { success: true, message: 'Workflow event sent' };
    } catch (error) {
      console.error('❌ Failed to send workflow event:', error);
      throw error;
    }
  }
}

// Simple consumer helper
export class SimpleKafkaConsumer {
  private consumer: Consumer;

  constructor() {
    this.consumer = consumer;
  }

  async connect() {
    try {
      await this.consumer.connect();
      console.log('✅ Kafka Consumer connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect Kafka Consumer:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.consumer.disconnect();
      console.log('✅ Kafka Consumer disconnected successfully');
    } catch (error) {
      console.error('❌ Failed to disconnect Kafka Consumer:', error);
    }
  }

  async subscribeToTestEvents() {
    try {
      await this.consumer.subscribe({ topic: KAFKA_TOPICS.TEST_EVENTS });
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageData = JSON.parse(message.value?.toString() || '{}') as TestEventMessage;
            console.log('📨 Received test message:', {
              topic,
              partition,
              key: message.key?.toString(),
              message: messageData.message,
              timestamp: messageData.timestamp,
              userId: messageData.userId
            });
          } catch (error) {
            console.error('❌ Error processing test message:', error);
          }
        }
      });

      console.log('✅ Subscribed to test events successfully');
    } catch (error) {
      console.error('❌ Failed to subscribe to test events:', error);
      throw error;
    }
  }

  async subscribeToWorkflowEvents() {
    try {
      await this.consumer.subscribe({ topic: KAFKA_TOPICS.WORKFLOW_EVENTS });
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageData = JSON.parse(message.value?.toString() || '{}') as WorkflowEventMessage;
            console.log('📨 Received workflow event:', {
              topic,
              partition,
              key: message.key?.toString(),
              type: messageData.type,
              workflowId: messageData.workflowId,
              userId: messageData.userId,
              timestamp: messageData.timestamp
            });
          } catch (error) {
            console.error('❌ Error processing workflow event:', error);
          }
        }
      });

      console.log('✅ Subscribed to workflow events successfully');
    } catch (error) {
      console.error('❌ Failed to subscribe to workflow events:', error);
      throw error;
    }
  }
}

// Export singleton instances
export const simpleKafkaProducer = new SimpleKafkaProducer();
export const simpleKafkaConsumer = new SimpleKafkaConsumer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down Kafka connections...');
  await simpleKafkaProducer.disconnect();
  await simpleKafkaConsumer.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down Kafka connections...');
  await simpleKafkaProducer.disconnect();
  await simpleKafkaConsumer.disconnect();
  process.exit(0);
});

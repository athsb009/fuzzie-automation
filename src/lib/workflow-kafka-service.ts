import { db } from '@/lib/db';
import { auth, currentUser } from '@clerk/nextjs/server';

// Kafka event publisher with actual Kafka integration
class WorkflowEventPublisher {
  private static async publishEvent(eventType: string, workflowId: string, userId: string, data?: any) {
    try {
      const event = {
        type: eventType,
        workflowId,
        userId,
        timestamp: new Date().toISOString(),
        data
      };
      
      console.log('📨 Workflow Event:', event);
      
      // Publish to Kafka
      try {
        const { simpleKafkaProducer } = await import('@/lib/kafka');
        await simpleKafkaProducer.connect();
        await simpleKafkaProducer.sendWorkflowEvent({
          type: eventType as 'workflow.created' | 'workflow.updated' | 'workflow.deleted',
          workflowId,
          userId,
          timestamp: event.timestamp,
          data
        });
        console.log('✅ Event published to Kafka successfully');
      } catch (kafkaError) {
        // Fallback to logging if Kafka is unavailable
        console.warn('⚠️ Kafka unavailable, event logged only:', kafkaError instanceof Error ? kafkaError.message : 'Unknown error');
      }
      
    } catch (error) {
      console.error('Failed to publish workflow event:', error);
    }
  }

  static async publishWorkflowCreated(workflowId: string, userId: string, name: string, description: string) {
    await this.publishEvent('workflow.created', workflowId, userId, { name, description });
  }

  static async publishWorkflowUpdated(workflowId: string, userId: string, updates: any) {
    await this.publishEvent('workflow.updated', workflowId, userId, updates);
  }

  static async publishWorkflowPublished(workflowId: string, userId: string, published: boolean) {
    await this.publishEvent('workflow.published', workflowId, userId, { published });
  }

  static async publishWorkflowTemplateUpdated(workflowId: string, userId: string, type: string, template: string) {
    await this.publishEvent('workflow.template_updated', workflowId, userId, { type, template });
  }
}

// Enhanced workflow actions with Kafka integration
export class WorkflowKafkaService {
  static async createWorkflow(name: string, description: string) {
    const user = await currentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Create workflow in database
      const workflow = await db.workflows.create({
        data: {
          userId: user.id,
          name,
          description,
        },
      });

      // Publish workflow creation event
      await WorkflowEventPublisher.publishWorkflowCreated(
        workflow.id, 
        user.id, 
        name, 
        description
      );

      console.log('✅ Workflow created and event published:', workflow.id);
      return { message: 'Workflow created successfully', workflow };
    } catch (error) {
      console.error('Failed to create workflow:', error);
      throw new Error('Failed to create workflow');
    }
  }

  static async publishWorkflow(workflowId: string, state: boolean) {
    const user = await currentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Update workflow publish state
      const workflow = await db.workflows.update({
        where: {
          id: workflowId,
        },
        data: {
          publish: state,
        },
      });

      // Publish workflow publish event
      await WorkflowEventPublisher.publishWorkflowPublished(
        workflowId, 
        user.id, 
        state
      );

      console.log('✅ Workflow publish state updated and event published:', workflowId);
      return { 
        message: state ? 'Workflow published' : 'Workflow unpublished',
        workflow 
      };
    } catch (error) {
      console.error('Failed to publish workflow:', error);
      throw new Error('Failed to publish workflow');
    }
  }

  static async updateWorkflowTemplate(
    workflowId: string,
    type: string,
    content: string,
    channels?: any[],
    accessToken?: string,
    notionDbId?: string
  ) {
    const user = await currentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      let updateData: any = {};
      let result = '';

      if (type === 'Discord') {
        updateData.discordTemplate = content;
        result = 'Discord template saved';
      } else if (type === 'Slack') {
        updateData.slackTemplate = content;
        updateData.slackAccessToken = accessToken;
        
        if (channels) {
          const channelValues = channels.map((channel) => channel.value);
          updateData.slackChannels = channelValues;
        }
        result = 'Slack template saved';
      } else if (type === 'Notion') {
        updateData.notionTemplate = content;
        updateData.notionAccessToken = accessToken;
        updateData.notionDbId = notionDbId;
        result = 'Notion template saved';
      }

      // Update workflow in database
      const workflow = await db.workflows.update({
        where: {
          id: workflowId,
        },
        data: updateData,
      });

      // Publish template update event
      await WorkflowEventPublisher.publishWorkflowTemplateUpdated(
        workflowId, 
        user.id, 
        type, 
        content
      );

      console.log('✅ Workflow template updated and event published:', workflowId);
      return result;
    } catch (error) {
      console.error('Failed to update workflow template:', error);
      throw new Error('Failed to update workflow template');
    }
  }

  static async getWorkflows() {
    const user = await currentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const workflows = await db.workflows.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return workflows;
    } catch (error) {
      console.error('Failed to get workflows:', error);
      throw new Error('Failed to get workflows');
    }
  }

  static async getWorkflowById(workflowId: string) {
    const user = await currentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const workflow = await db.workflows.findUnique({
        where: {
          id: workflowId,
          userId: user.id, // Ensure user owns the workflow
        },
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      return workflow;
    } catch (error) {
      console.error('Failed to get workflow:', error);
      throw new Error('Failed to get workflow');
    }
  }

  static async getNodesEdges(flowId: string) {
    try {
      const nodesEdges = await db.workflows.findUnique({
        where: {
          id: flowId,
        },
        select: {
          nodes: true,
          edges: true,
        },
      });
      
      if (nodesEdges?.nodes && nodesEdges?.edges) {
        return nodesEdges;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get nodes and edges:', error);
      throw new Error('Failed to get nodes and edges');
    }
  }
}

// Export the service
export const workflowKafkaService = WorkflowKafkaService;

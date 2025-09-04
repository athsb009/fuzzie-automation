'use server'
type Option = {
  label: string
  value: string
}
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { currentUser } from '@clerk/nextjs/server'

// Simple event publisher for workflow events
const publishWorkflowEvent = async (eventType: string, workflowId: string, userId: string, data?: any) => {
  try {
    console.log('📨 Workflow Event:', {
      type: eventType,
      workflowId,
      userId,
      timestamp: new Date().toISOString(),
      data
    });
    
    // TODO: Replace with actual Kafka publishing when API routes are fixed
    // For now, we'll just log the events
  } catch (error) {
    console.error('Failed to publish workflow event:', error);
  }
};

export const getGoogleListener = async () => {
  const { userId } = await auth()

  if (userId) {
    const listener = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
      select: {
        googleResourceId: true,
      },
    })

    if (listener) return listener
  }
}

export const onFlowPublish = async (workflowId: string, state: boolean) => {
  console.log(state)
  const { userId } = await auth()
  
  const published = await db.workflows.update({
    where: {
      id: workflowId,
    },
    data: {
      publish: state,
    },
  })

  // Publish workflow publish event
  if (userId) {
    await publishWorkflowEvent('workflow.published', workflowId, userId, { published: state });
  }

  if (published.publish) return 'Workflow published'
  return 'Workflow unpublished'
}

export const onCreateNodeTemplate = async (
  content: string,
  type: string,
  workflowId: string,
  channels?: Option[],
  accessToken?: string,
  notionDbId?: string
) => {
  const { userId } = await auth()
  
  if (type === 'Discord') {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        discordTemplate: content,
      },
    })

    if (response) {
      // Publish template update event
      if (userId) {
        await publishWorkflowEvent('workflow.template_updated', workflowId, userId, { type, template: content });
      }
      return 'Discord template saved'
    }
  }
  if (type === 'Slack') {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        slackTemplate: content,
        slackAccessToken: accessToken,
      },
    })

    if (response) {
      const channelList = await db.workflows.findUnique({
        where: {
          id: workflowId,
        },
        select: {
          slackChannels: true,
        },
      })

      if (channelList) {
        // Remove duplicates and add new channels
        const existingChannels = channelList.slackChannels || []
        const newChannels = channels!.map((channel) => channel.value)
        const allChannels = [...new Set([...existingChannels, ...newChannels])]
        
        await db.workflows.update({
          where: {
            id: workflowId,
          },
          data: {
            slackChannels: allChannels,
          },
        })

        // Publish template update event
        if (userId) {
          await publishWorkflowEvent('workflow.template_updated', workflowId, userId, { type, template: content });
        }
        return 'Slack template saved'
      }
      // Save all channels at once
      const channelValues = channels!.map((channel) => channel.value)
      await db.workflows.update({
        where: {
          id: workflowId,
        },
        data: {
          slackChannels: channelValues,
        },
      })
      // Publish template update event
      if (userId) {
        await publishWorkflowEvent('workflow.template_updated', workflowId, userId, { type, template: content });
      }
      return 'Slack template saved'
    }
  }

  if (type === 'Notion') {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        notionTemplate: content,
        notionAccessToken: accessToken,
        notionDbId: notionDbId,
      },
    })

    if (response) {
      // Publish template update event
      if (userId) {
        await publishWorkflowEvent('workflow.template_updated', workflowId, userId, { type, template: content });
      }
      return 'Notion template saved'
    }
  }
}

export const onGetWorkflows = async () => {
  const user = await currentUser()
  if (user) {
    const workflow = await db.workflows.findMany({
      where: {
        userId: user.id,
      },
    })

    if (workflow) return workflow
  }
}

export const onCreateWorkflow = async (name: string, description: string) => {
  const user = await currentUser()

  if (user) {
    //create new workflow
    const workflow = await db.workflows.create({
      data: {
        userId: user.id,
        name,
        description,
      },
    })

    // Publish workflow creation event
    if (workflow) {
      await publishWorkflowEvent('workflow.created', workflow.id, user.id, { name, description });
      return { message: 'workflow created' }
    }
    return { message: 'Oops! try again' }
  }
}

export const onGetNodesEdges = async (flowId: string) => {
  const nodesEdges = await db.workflows.findUnique({
    where: {
      id: flowId,
    },
    select: {
      nodes: true,
      edges: true,
    },
  })
  if (nodesEdges?.nodes && nodesEdges?.edges) return nodesEdges
}
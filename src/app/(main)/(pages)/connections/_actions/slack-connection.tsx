'use server'

import { Option } from '@/components/ui/multiple-selector'
import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import axios from 'axios'

export const onSlackConnect = async (
  app_id: string,
  authed_user_id: string,
  authed_user_token: string,
  slack_access_token: string,
  bot_user_id: string,
  team_id: string,
  team_name: string,
  user_id: string
): Promise<void> => {
  if (!slack_access_token) return

  const slackConnection = await db.slack.findFirst({
    where: { slackAccessToken: slack_access_token },
    include: { connections: true },
  })

  if (!slackConnection) {
    await db.slack.create({
      data: {
        userId: user_id,
        appId: app_id,
        authedUserId: authed_user_id,
        authedUserToken: authed_user_token,
        slackAccessToken: slack_access_token,
        botUserId: bot_user_id,
        teamId: team_id,
        teamName: team_name,
        connections: {
          create: { userId: user_id, type: 'Slack' },
        },
      },
    })
  }
}

export const getSlackConnection = async () => {
  const user = await currentUser()
  if (user) {
    return await db.slack.findFirst({
      where: { userId: user.id },
    })
  }
  return null
}

export async function listBotChannels(
  slackAccessToken: string
): Promise<Option[]> {
  const url = `https://slack.com/api/conversations.list?${new URLSearchParams({
    types: 'public_channel,private_channel',
    limit: '200',
  })}`

  const maxRetries = 3
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${slackAccessToken}` },
      })

      console.log(data)

      if (!data.ok) {
        if (data.error === 'rate_limited' && retryCount < maxRetries - 1) {
          retryCount++
          const retryAfter = data.response_metadata?.retry_after || 1
          console.log(`Rate limited, retrying after ${retryAfter} seconds...`)
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
          continue
        }
        throw new Error(data.error)
      }

      if (!data?.channels?.length) return []

      return data.channels
        .filter((ch: any) => ch.is_member)
        .map((ch: any) => {
          return { label: ch.name, value: ch.id }
        })
    } catch (error: any) {
      if (error.response?.status === 429 && retryCount < maxRetries - 1) {
        retryCount++
        const retryAfter = error.response.headers['retry-after'] || 1
        console.log(`Rate limited, retrying after ${retryAfter} seconds...`)
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        continue
      }
      console.error('Error listing bot channels:', error.message)
      throw error
    }
  }

  throw new Error('Max retries exceeded')
}

const postMessageInSlackChannel = async (
  slackAccessToken: string,
  slackChannel: string,
  content: string
): Promise<void> => {
  try {
    console.log(`Posting to Slack channel: ${slackChannel}`)
    const response = await axios.post(
      'https://slack.com/api/chat.postMessage',
      { channel: slackChannel, text: content },
      {
        headers: {
          Authorization: `Bearer ${slackAccessToken}`,
          'Content-Type': 'application/json;charset=utf-8',
        },
      }
    )
    
    if (response.data.ok) {
      console.log(`Message posted successfully to channel ID: ${slackChannel}`)
    } else {
      console.error(`Slack API error:`, response.data)
    }
  } catch (error: any) {
    console.error(
      `Error posting message to Slack channel ${slackChannel}:`,
      error?.response?.data || error.message
    )
    throw error
  }
}

// Wrapper function to post messages to multiple Slack channels
export const postMessageToSlack = async (
  slackAccessToken: string,
  selectedSlackChannels: Option[],
  content: string
): Promise<{ message: string }> => {
  if (!content) return { message: 'Content is empty' }
  if (!selectedSlackChannels?.length) return { message: 'Channel not selected' }

  try {
    console.log('Sending to Slack channels:', selectedSlackChannels.map(c => c.value))
    console.log('Content:', content)
    
    await Promise.all(
      selectedSlackChannels
        .map((channel) => channel?.value)
        .map((channel) => postMessageInSlackChannel(slackAccessToken, channel, content))
    )
  } catch (error) {
    console.error('Slack error:', error)
    return { message: 'Message could not be sent to Slack' }
  }

  return { message: 'Success' }
}
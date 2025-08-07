import axios from 'axios'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (!code) {
    return new NextResponse('No code provided', { status: 400 })
  }

  try {
    const data = new URLSearchParams()
    data.append('client_id', process.env.DISCORD_CLIENT_ID!)
    data.append('client_secret', process.env.DISCORD_CLIENT_SECRET!)
    data.append('grant_type', 'authorization_code')
    data.append('redirect_uri', process.env.DISCORD_REDIRECT_URI!)
    data.append('code', code.toString())

    const output = await axios.post(
      'https://discord.com/api/oauth2/token',
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const access = output.data.access_token

    const userGuildsRes = await axios.get(`https://discord.com/api/users/@me/guilds`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    })

    const matchedGuilds = userGuildsRes.data.filter(
      (guild: any) => guild.id == output.data.webhook.guild_id
    )

    const matchedGuild = matchedGuilds[0]

    if (!matchedGuild) {
      return new NextResponse('Guild not found in user guilds', { status: 404 })
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/connections?webhook_id=${output.data.webhook.id}&webhook_url=${output.data.webhook.url}&webhook_name=${output.data.webhook.name}&guild_id=${output.data.webhook.guild_id}&guild_name=${matchedGuild.name}&channel_id=${output.data.webhook.channel_id}`
    )
  } catch (err: any) {
    console.error('Discord OAuth Error:', err.response?.data || err.message)
    return new NextResponse('Discord OAuth failed', { status: 500 })
  }
}

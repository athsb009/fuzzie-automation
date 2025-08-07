import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

export async function GET() {
    return NextResponse.json({ message: 'Webhook endpoint is working' })
  }

export async function POST(req: Request) {
  console.log('Webhook received!')
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)

  try {
    const evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any
    console.log('Webhook verified successfully:', evt.data)
    const { id, email_addresses, image_url, first_name } = evt.data
    const email = email_addresses[0]?.email_address

    await db.user.upsert({
      where: { clerkId: id },
      update: {
        email,
        name: first_name,
        profileImage: image_url,
      },
      create: {
        clerkId: id,
        email,
        name: first_name || email,
        profileImage: image_url,
      }
    })
    console.log('User updated successfully:', evt.data)
    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 })
  } catch (error) {
    console.error('Webhook verification failed:', error)
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 })
  }
}
import { NextResponse, NextRequest } from 'next/server'
import Stripe from 'stripe'

export async function GET(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET!, {
    typescript: true,
    apiVersion: '2025-07-30.basil',
  })

  try {
    // Fetch prices with product information
    const prices = await stripe.prices.list({
      limit: 10,
      expand: ['data.product'],
      active: true,
    })

    // Transform the data to include product information
    const products = prices.data.map(price => ({
      id: price.id,
      nickname: price.nickname || (price.product as any)?.name || 'Unknown',
      unit_amount: price.unit_amount,
      currency: price.currency,
      recurring: price.recurring,
      product: price.product,
    }))

    console.log('Fetched products:', products)
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching Stripe products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET!, {
    typescript: true,
    apiVersion: '2025-07-30.basil',
  })
  const data = await req.json()
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: data.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url:
      `${process.env.NEXT_PUBLIC_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/billing`,
  })
  return NextResponse.json(session.url)
}
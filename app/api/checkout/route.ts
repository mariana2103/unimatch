import Stripe from 'stripe'
import { isAllowed, getIP, rateLimitedResponse } from '@/lib/rate-limit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://unimatch.pt'

export async function POST(req: Request) {
  // Rate limit: 10 checkout attempts per hour per IP
  const ip = getIP(req)
  if (!isAllowed(`checkout:${ip}`, 10, 60 * 60 * 1000)) return rateLimitedResponse()

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Pagamentos não configurados.' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const euros = Number(body.amount)

  if (!euros || euros < 1 || euros > 500) {
    return Response.json({ error: 'Valor inválido. Mínimo €1, máximo €500.' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'paypal'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(euros * 100), // cents
          product_data: {
            name: 'Apoiar o UniMatch',
            description: 'Obrigada pelo apoio! O UniMatch é gratuito e sem anúncios. 💙',
          },
        },
      },
    ],
    success_url: `${SITE_URL}/?apoio=obrigada`,
    cancel_url:  `${SITE_URL}/apoio`,
    locale: 'pt-PT',
  })

  return Response.json({ url: session.url })
}

// src/app/api/create-checkout-session/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY is not set in environment variables.');
  // Do not throw here directly as it might crash the server start process for some setups.
  // Instead, handle it in the POST request.
}

let stripe: Stripe | null = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20', 
    typescript: true,
  });
}


export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured on the server. STRIPE_SECRET_KEY is missing.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing required parameters: priceId, successUrl, or cancelUrl' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription', // Ensure this matches your product type in Stripe
      success_url: successUrl,
      cancel_url: cancelUrl,
      // If you want to prefill email or associate with a Stripe customer:
      // customer_email: body.customerEmail, // Example: pass customerEmail in request body
      // customer: existing_stripe_customer_id, // If you manage Stripe Customers
    });

    // The client expects 'sessionId' and 'url'
    // session.url is typically for Stripe Hosted Checkout pages
    // session.id is for when you use stripe.redirectToCheckout({ sessionId }) on client
    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error('Stripe API error during session creation:', error);
    // Send a more generic error message to the client, but log the details
    let clientErrorMessage = 'Failed to create Stripe session.';
    if (error.type === 'StripeInvalidRequestError' && error.message.includes('No such price')) {
        clientErrorMessage = `Failed to create Stripe session: The Price ID '${error.param || 'provided'}' is invalid or does not exist in your Stripe account in the current mode (test/live). Please verify it.`;
    } else if (error.message) {
        clientErrorMessage = `Failed to create Stripe session: ${error.message}`;
    }
    
    return NextResponse.json({ error: clientErrorMessage }, { status: error.statusCode || 500 });
  }
}

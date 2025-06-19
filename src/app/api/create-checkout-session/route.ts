// src/app/api/create-checkout-session/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY is not set in environment variables.');
}

let stripe: Stripe | null = null;
if (stripeSecretKey && !stripeSecretKey.includes("YOUR_STRIPE_TEST_SECRET_KEY_HERE")) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
    typescript: true,
  });
}


export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured on the server. STRIPE_SECRET_KEY is missing or invalid.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { priceId, successUrl, cancelUrl, userId } = body; // userId can be passed for client_reference_id

    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing required parameters: priceId, successUrl, or cancelUrl' }, { status: 400 });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl, // Use the successUrl passed from the client
      cancel_url: cancelUrl,   // Use the cancelUrl passed from the client
    };

    // Optionally, include client_reference_id if you plan to use webhooks to map sessions to users
    // For example, if you pass userId in the request body:
    // if (userId) {
    //   sessionParams.client_reference_id = userId;
    // }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error('Stripe API error during session creation:', error);
    let clientErrorMessage = 'Failed to create Stripe session.';
    if (error.type === 'StripeInvalidRequestError' && error.message.includes('No such price')) {
        clientErrorMessage = `Failed to create Stripe session: The Price ID '${error.param || 'provided'}' is invalid or does not exist in your Stripe account in the current mode (test/live). Please verify it.`;
    } else if (error.message) {
        clientErrorMessage = `Failed to create Stripe session: ${error.message}`;
    }

    return NextResponse.json({ error: clientErrorMessage }, { status: error.statusCode || 500 });
  }
}

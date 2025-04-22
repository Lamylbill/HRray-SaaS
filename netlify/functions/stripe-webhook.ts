import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { buffer } from 'micro';

// Secret keys stored in Netlify's environment settings
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  let stripeEvent;

  try {
    const sig = event.headers['stripe-signature'] as string;
    const body = event.body!;

    stripeEvent = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }

  // Handle the event
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      console.log('✅ Payment successful!');
      break;
    case 'invoice.payment_succeeded':
      console.log('✅ Invoice paid.');
      break;
    case 'invoice.payment_failed':
      console.log('❌ Invoice payment failed.');
      break;
    // Add more cases as needed
    default:
      console.log(`Unhandled event type ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};

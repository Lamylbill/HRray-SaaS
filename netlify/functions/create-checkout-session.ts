import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import Stripe from "stripe";

// Initialize Stripe with the secret key from environment variables.
// The '!' is used to tell TypeScript that STRIPE_SECRET_KEY will always be defined.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Netlify function handler for creating a Stripe Checkout session.
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests.
  if (event.httpMethod !== "POST") {
    console.error(`Method ${event.httpMethod} not allowed`);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
      headers: { Allow: "POST" },
    };
  }
  
  console.log("Received request to create checkout session");

  try {
    // Parse the JSON data from the request body.
    const data = JSON.parse(event.body || "{}");
    const { priceId, userId } = data;

    // Check if priceId and userId are provided.
    if (!priceId || !userId) {
      console.error("Missing priceId or userId in request body");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing priceId or userId" }),
      };
    }
    console.log(`Creating checkout session for user: ${userId} with priceId: ${priceId}`);

    // Create a Stripe Checkout session.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          // Set the quantity of items to 1.
          quantity: 1,
        },
      ],
      // Define the success and cancel URLs.
      success_url: "https://hrray.netlify.app/success",
      cancel_url: "https://hrray.netlify.app/cancel",
      // Include user_id in the metadata for tracking.
      metadata: {
        user_id: userId,
      },
    });
    console.log(`Checkout session created with id: ${session.id}`);

    // Return the session ID to the client.
    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (error) {
    // Log any errors and return a 500 Internal Server Error.
    console.error("Error creating checkout session:", error);
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

export { handler };
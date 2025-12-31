
# Backend Webhook Implementation Guide

To fix the "Verification Timeout" error, you need to implement the Stripe webhook endpoint in your backend. This allows Stripe to notify your database when a payment is successful.

## 1. Create the Webhook Route

Create a new file: `backend/routes/webhooks.js`

```javascript
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const Trip = require('../models/Trip'); // Adjust path to your Trip model
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// IMPORTANT: This route needs the raw body to verify the signature
// We handle the parsing inside this route or ensure app.use('/webhook') comes before express.json()
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`⚠️  Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  console.log(`🔔  Webhook received: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // We stored the tripId in metadata when creating the checkout session
    const tripId = session.metadata?.tripId;

    if (!tripId) {
      console.error('❌  No tripId found in session metadata');
      return res.status(400).send('No tripId provided');
    }

    console.log(`💰  Payment confirmed for Trip ID: ${tripId}`);

    try {
      // Update the trip status in the database
      const updatedTrip = await Trip.findByIdAndUpdate(
        tripId,
        {
          status: 'confirmed',
          paymentStatus: 'paid',
          // Optionally save Stripe info
          paymentMetadata: {
            sessionId: session.id,
            paymentIntent: session.payment_intent,
            customerEmail: session.customer_details?.email,
            amountTotal: session.amount_total
          }
        },
        { new: true }
      );

      if (updatedTrip) {
        console.log('✅  Trip status updated to CONFIRMED');
        
        // If you are using Socket.IO, emit the update here
        if (req.io) {
            req.io.to(`trip_${tripId}`).emit('tripStatusUpdate', {
                tripId: updatedTrip._id,
                status: 'confirmed',
                paymentStatus: 'paid'
            });
        }
      } else {
        console.error('❌  Trip not found in database');
      }

    } catch (dbError) {
      console.error('❌  Database Error:', dbError);
      return res.status(500).send('Internal Server Error');
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

module.exports = router;
```

## 2. Register the Route in `server.js` (or `app.js`)

Open your main server file (usually `backend/server.js`) and add natural handling for the webhook **BEFORE** your global `express.json()` middleware if possible, or use the setup below which isolates it.

```javascript
const webhookRoutes = require('./routes/webhooks');

// ... other imports

const app = express();

// Mount the webhook route. 
// Note: We mount it BEFORE express.json() if we didn't use express.raw() inside the route specific file.
// But since we used express.raw() in the router, we can just mount it.
app.use('/webhook', webhookRoutes);

// Global Middleware
app.use(express.json()); // This typically comes after specific route overrides if needed
// ...
```

## 3. Environment Variables

Make sure your `.env` file in the backend has:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  <-- Get this from Stripe Dashboard > Developers > Webhooks
```

## 4. Testing Locally

1. Install Stripe CLI.
2. Login: `stripe login`
3. Forward events to your local server:
   ```bash
   stripe listen --forward-to localhost:5000/webhook/stripe
   ```
4. Copy the "webhook signing secret" (begins with `whsec_`) from the CLI output and put it in your backend `.env` as `STRIPE_WEBHOOK_SECRET`.
5. Restart your backend server.

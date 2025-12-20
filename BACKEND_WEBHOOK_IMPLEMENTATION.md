# 🚨 Backend Implementation Required: Stripe Webhook Endpoint

## Status: ❌ Endpoint Not Found (404)

The Stripe CLI is correctly forwarding events, but the backend endpoint doesn't exist yet.

```
✅ Stripe CLI: Working
✅ Webhook Secret: whsec_ab26de4d7082c5b12f8f83e0f14e588c96c753dbfde3a09cb6a05dc9ebef5e48
❌ Backend Endpoint: Missing (returns 404)
```

---

## 📋 Backend Implementation (COPY & PASTE READY)

### Step 1: Create Webhook Route File

Create file: `backend/routes/webhooks.js`

```javascript
const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip'); // Adjust path to your Trip model

// Initialize Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe Webhook Handler
 * IMPORTANT: This route MUST use raw body parsing for signature verification
 */
router.post('/stripe', async (req, res) => {
  // Get the signature from headers
  const sig = req.headers['stripe-signature'];
  
  let event;

  try {
    // Construct and verify the event using the raw body and signature
    event = stripe.webhooks.constructEvent(
      req.body, // This must be the raw body (Buffer)
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log('✅ Webhook verified successfully:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).json({ 
      success: false, 
      message: `Webhook Error: ${err.message}` 
    });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('💳 Payment successful!');
        console.log('Session ID:', session.id);
        console.log('Payment Status:', session.payment_status);
        
        // Get trip ID from session metadata
        const tripId = session.metadata?.tripId || session.client_reference_id;
        
        if (!tripId) {
          console.error('❌ No tripId found in session metadata');
          return res.json({ received: true, warning: 'No tripId in metadata' });
        }

        console.log('Looking for trip:', tripId);

        // Find and update the trip
        const trip = await Trip.findById(tripId);
        
        if (!trip) {
          console.error('❌ Trip not found:', tripId);
          return res.json({ received: true, error: 'Trip not found' });
        }

        console.log('Found trip:', {
          _id: trip._id,
          currentStatus: trip.status,
          currentPaymentStatus: trip.paymentStatus
        });

        // Get payment intent details
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent
        );

        console.log('Payment Intent:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status
        });

        // Update trip status
        trip.status = 'confirmed';
        trip.paymentStatus = 'paid';
        trip.stripePaymentIntentId = paymentIntent.id;
        trip.stripeCheckoutSessionId = session.id;
        trip.paidAt = new Date();

        await trip.save();

        console.log('✅ Trip updated successfully:', {
          _id: trip._id,
          status: trip.status,
          paymentStatus: trip.paymentStatus,
          stripePaymentIntentId: trip.stripePaymentIntentId
        });

        // Optional: Send confirmation email to tourist
        // await sendPaymentConfirmationEmail(trip);

        // Optional: Notify guide
        // await notifyGuideOfPayment(trip);

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('❌ Payment failed:', paymentIntent.id);
        
        // Try to find trip by payment intent or session
        const trip = await Trip.findOne({
          $or: [
            { stripePaymentIntentId: paymentIntent.id },
            { stripeCheckoutSessionId: paymentIntent.metadata?.sessionId }
          ]
        });

        if (trip) {
          trip.paymentStatus = 'failed';
          trip.paymentFailureReason = paymentIntent.last_payment_error?.message;
          await trip.save();
          
          console.log('Trip payment marked as failed:', trip._id);
        }

        break;
      }

      case 'charge.succeeded':
        console.log('💰 Charge succeeded:', event.data.object.id);
        // Already handled by checkout.session.completed
        break;

      case 'payment_intent.succeeded':
        console.log('✓ Payment intent succeeded:', event.data.object.id);
        // Already handled by checkout.session.completed
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    // Still return 200 to Stripe to acknowledge receipt
    return res.json({ 
      received: true, 
      error: error.message 
    });
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true, event: event.type });
});

module.exports = router;
```

---

### Step 2: Register Webhook Route in Main App

Edit your `backend/server.js` or `backend/app.js`:

```javascript
const express = require('express');
const app = express();

// Import webhook routes
const webhookRoutes = require('./routes/webhooks');

// ⚠️ CRITICAL: Register webhook route BEFORE express.json()
// Webhooks need raw body for signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// THEN register other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Other routes...
const touristRoutes = require('./routes/tourist');
const guideRoutes = require('./routes/guide');
app.use('/api/tourist', touristRoutes);
app.use('/api/guide', guideRoutes);

// ... rest of your server setup
```

**⚠️ ORDER MATTERS**: The webhook route must be registered BEFORE `express.json()` because Stripe needs the raw request body for signature verification.

---

### Step 3: Update .env File

Make sure your backend `.env` has:

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

---

### Step 4: Ensure Trip Model Has Required Fields

Your `Trip` model should have these fields:

```javascript
const tripSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Payment fields
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  negotiatedPrice: {
    type: Number,
    required: true
  },
  stripeCheckoutSessionId: String,
  stripePaymentIntentId: String,
  paidAt: Date,
  paymentFailureReason: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'guide_selected', 'awaiting_payment', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  }
});
```

---

### Step 5: Restart Backend

```bash
# Stop backend (Ctrl+C)
# Start again
npm start
# or
node server.js
```

---

## 🧪 Testing After Implementation

### Terminal 1: Keep Stripe CLI Running
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

### Terminal 2: Backend Logs
Watch for these logs when payment completes:
```
✅ Webhook verified successfully: checkout.session.completed
💳 Payment successful!
Session ID: cs_test_xxx
Looking for trip: 6945b686451a85722d185ca0
Found trip: { _id: ..., currentStatus: 'awaiting_payment' }
✅ Trip updated successfully: { status: 'confirmed', paymentStatus: 'paid' }
```

### Stripe CLI Should Show:
```
[200] POST http://localhost:5000/api/webhooks/stripe [evt_xxx]
```
✅ **200** instead of 404!

---

## 🔍 Verification Checklist

After implementing, verify:

- [ ] File `backend/routes/webhooks.js` created
- [ ] Webhook route registered in `server.js` **BEFORE** `express.json()`
- [ ] Using `express.raw()` for webhook route
- [ ] `STRIPE_WEBHOOK_SECRET` in `.env`
- [ ] Backend restarted
- [ ] Stripe CLI showing `[200]` responses
- [ ] Backend logs showing "Webhook verified successfully"
- [ ] Test payment updates trip status within 2-5 seconds

---

## 📊 What Should Happen

**Before Implementation:**
```
stripe listen: [404] POST http://localhost:5000/api/webhooks/stripe ❌
Trip status: awaiting_payment (stays forever)
Frontend: Stuck on "Verifying Payment..."
```

**After Implementation:**
```
stripe listen: [200] POST http://localhost:5000/api/webhooks/stripe ✅
Trip status: confirmed (updated immediately)
Payment status: paid
Frontend: Shows "Payment Successful!" within 2-5 seconds
```

---

## 🐛 Common Issues

### Issue 1: Still getting 404
**Fix:** Make sure you registered the route:
```javascript
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
```

### Issue 2: "Webhook signature verification failed"
**Fix:** Route must be registered BEFORE `express.json()` and use `express.raw()`

### Issue 3: "Trip not found"
**Fix:** Make sure checkout session has trip ID in metadata:
```javascript
// When creating checkout session:
metadata: {
  tripId: tripId.toString()
},
client_reference_id: tripId.toString()
```

### Issue 4: Webhook works but trip not updating
**Debug:** Add more console.logs to see what's happening:
```javascript
console.log('Session metadata:', session.metadata);
console.log('Trip before update:', trip);
console.log('Trip after save:', trip);
```

---

## ⚡ Quick Test Command

After implementing, test with:

```bash
stripe trigger checkout.session.completed
```

This simulates a payment completion and should update a test trip.

---

## 📞 Need Help?

1. Check backend console logs
2. Check Stripe CLI output
3. Verify route registration order
4. Make sure raw body parsing is used
5. Confirm webhook secret is correct

**Estimated Time to Implement:** 15-20 minutes

**Priority:** 🔴 CRITICAL - Payments can't be confirmed without this!

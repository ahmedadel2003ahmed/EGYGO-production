# Quick Fix Guide: 404 Webhook Error

## Current Status
```
✅ Stripe CLI: Running and forwarding events
✅ Payment: Successful on Stripe  
❌ Backend: Returns 404 for webhook endpoint
❌ Trip Status: Stuck in "awaiting_payment"
```

---

## The Problem
```
Stripe CLI → POST /api/webhooks/stripe → Backend
                                          ↓
                                        404 Not Found ❌
```

---

## The Solution (5 Steps)

### 1️⃣ Create webhook file
**File:** `backend/routes/webhooks.js`

```javascript
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Trip = require('../models/Trip');

router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const tripId = session.metadata.tripId;
    
    const trip = await Trip.findById(tripId);
    if (trip) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent
      );
      
      trip.status = 'confirmed';
      trip.paymentStatus = 'paid';
      trip.stripePaymentIntentId = paymentIntent.id;
      trip.paidAt = new Date();
      await trip.save();
      
      console.log('✅ Trip confirmed:', tripId);
    }
  }

  res.json({ received: true });
});

module.exports = router;
```

### 2️⃣ Register route in server.js
**File:** `backend/server.js`

```javascript
const webhookRoutes = require('./routes/webhooks');

// ⚠️ MUST be BEFORE express.json()
app.use('/api/webhooks', 
  express.raw({ type: 'application/json' }), 
  webhookRoutes
);

// Then other middleware
app.use(express.json());
```

### 3️⃣ Check .env
```bash
STRIPE_SECRET_KEY=sk_test_51ScnomPQAVx313em...
STRIPE_WEBHOOK_SECRET=whsec_ab26de4d7082c5b12f8f83e0f14e588c96c753dbfde3a09cb6a05dc9ebef5e48
```

### 4️⃣ Restart backend
```bash
# Ctrl+C to stop
npm start
```

### 5️⃣ Test
Make a payment and watch:
- Stripe CLI should show: `[200] POST ...` (not 404!)
- Backend logs: "✅ Trip confirmed: ..."
- Frontend success page: Shows "Payment Successful!"

---

## After Fix
```
Stripe CLI → POST /api/webhooks/stripe → Backend
                                          ↓
                                        200 OK ✅
                                          ↓
                                    Trip Updated ✅
                                          ↓
                                    Frontend Shows Success ✅
```

---

## Test Command
```bash
stripe trigger checkout.session.completed
```

---

See `BACKEND_WEBHOOK_IMPLEMENTATION.md` for complete code with error handling.

**Time to fix:** 10-15 minutes  
**Files to create:** 1 (`routes/webhooks.js`)  
**Files to edit:** 1 (`server.js`)

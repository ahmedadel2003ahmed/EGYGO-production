# Backend Integration Checklist for Stripe Payment

## ✅ Required Backend Changes

### 1. Guide Accept Trip Endpoint
**Endpoint:** `PUT /api/guide/trips/:tripId/accept`

**Current Behavior:**
- Guide accepts trip request

**Required Changes:**
```javascript
// After successful acceptance, update trip status
trip.status = 'awaiting_payment';
trip.paymentStatus = 'pending';
trip.negotiatedPrice = <agreed_price>;
await trip.save();
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "trip": {
      "_id": "trip_id",
      "status": "awaiting_payment",
      "paymentStatus": "pending",
      "negotiatedPrice": 500
    }
  }
}
```

---

### 2. Create Checkout Session Endpoint
**Endpoint:** `POST /api/tourist/trips/:tripId/create-checkout-session`

**Request Body:**
```json
{
  "successUrl": "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}&trip_id={tripId}",
  "cancelUrl": "http://localhost:3000/payment/cancel?trip_id={tripId}"
}
```

**Required Implementation:**
```javascript
// 1. Verify user owns the trip
if (trip.touristId.toString() !== req.user._id.toString()) {
  return res.status(403).json({ message: 'Unauthorized' });
}

// 2. Check if trip is in correct status
if (trip.status !== 'awaiting_payment') {
  return res.status(400).json({ 
    message: 'Trip is not awaiting payment' 
  });
}

// 3. Check for existing session (IDEMPOTENCY)
if (trip.stripeCheckoutSessionId) {
  const existingSession = await stripe.checkout.sessions.retrieve(
    trip.stripeCheckoutSessionId
  );
  
  // If session is still valid, return it
  if (existingSession.status === 'open') {
    return res.json({
      data: {
        checkoutUrl: existingSession.url,
        sessionId: existingSession.id
      }
    });
  }
}

// 4. Create new Stripe checkout session
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'egp',
      product_data: {
        name: `Trip to ${trip.destination}`,
        description: `Guide: ${trip.guide.name}`,
        images: [trip.guide.photo?.url]
      },
      unit_amount: trip.negotiatedPrice * 100 // Convert to cents
    },
    quantity: 1
  }],
  mode: 'payment',
  success_url: req.body.successUrl,
  cancel_url: req.body.cancelUrl,
  metadata: {
    tripId: trip._id.toString(),
    touristId: trip.touristId.toString(),
    guideId: trip.guideId.toString()
  },
  client_reference_id: trip._id.toString()
});

// 5. Save session ID to trip
trip.stripeCheckoutSessionId = session.id;
await trip.save();

// 6. Return checkout URL
res.json({
  data: {
    checkoutUrl: session.url,
    sessionId: session.id
  }
});
```

**Response Format:**
```json
{
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
    "sessionId": "cs_test_xxx"
  }
}
```

---

### 3. Stripe Webhook Handler
**Endpoint:** `POST /api/webhooks/stripe`

**Required Implementatfion:**
```javascript
// 1. Verify Stripe signature
const sig = req.headers['stripe-signature'];
let event;

try {
  event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (err) {
  return res.status(400).send(`Webhook Error: ${err.message}`);
}

// 2. Handle checkout.session.completed event
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  
  // Get trip ID from metadata
  const tripId = session.metadata.tripId || session.client_reference_id;
  
  // Get payment intent
  const paymentIntent = await stripe.paymentIntents.retrieve(
    session.payment_intent
  );
  
  // Update trip
  const trip = await Trip.findById(tripId);
  
  if (trip) {
    trip.status = 'confirmed';
    trip.paymentStatus = 'paid';
    trip.stripePaymentIntentId = paymentIntent.id;
    trip.paidAt = new Date();
    trip.stripeCheckoutSessionId = session.id;
    
    await trip.save();
    
    // Optional: Send confirmation email
    // await sendConfirmationEmail(trip);
    
    // Optional: Notify guide
    // await notifyGuide(trip);
  }
}

// 3. Handle payment_intent.payment_failed event
if (event.type === 'payment_intent.payment_failed') {
  const paymentIntent = event.data.object;
  
  // Find trip by payment intent or session
  const trip = await Trip.findOne({
    $or: [
      { stripePaymentIntentId: paymentIntent.id },
      { stripeCheckoutSessionId: paymentIntent.metadata.sessionId }
    ]
  });
  
  if (trip) {
    trip.paymentStatus = 'failed';
    trip.paymentFailureReason = paymentIntent.last_payment_error?.message;
    await trip.save();
  }
}

res.json({ received: true });
```

**Webhook Events to Handle:**
- ✅ `checkout.session.completed` - Payment successful
- ✅ `payment_intent.payment_failed` - Payment failed

---

### 4. Get Trip Details Endpoint
**Endpoint:** `GET /api/trips/:tripId`

**Required Fields in Response:**
```json
{
  "data": {
    "trip": {
      "_id": "trip_id",
      "status": "confirmed",
      "paymentStatus": "paid",
      "negotiatedPrice": 500,
      "stripePaymentIntentId": "pi_xxx",
      "stripeCheckoutSessionId": "cs_xxx",
      "paidAt": "2025-12-19T10:30:00Z",
      "startAt": "2025-01-15T09:00:00Z",
      "guide": {
        "_id": "guide_id",
        "name": "Ahmed Mohamed",
        "photo": { "url": "..." }
      }
    }
  }
}
```

**Authorization:**
- Tourist must own the trip OR
- Guide must be assigned to the trip

---

## 🗂️ Database Schema Updates

### Trip Model Additions
```javascript
{
  // Existing fields...
  
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
  stripeCheckoutSessionId: {
    type: String
  },
  stripePaymentIntentId: {
    type: String
  },
  paidAt: {
    type: Date
  },
  paymentFailureReason: {
    type: String
  }
}
```

---

## 🔐 Environment Variables

### Required in .env
```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...           # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...         # From Stripe Webhook settings

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://...

# JWT
JWT_SECRET=...
```

---

## 🔧 Stripe Dashboard Configuration

### 1. Get API Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy "Publishable key" (for frontend if needed)
3. Copy "Secret key" → Add to backend .env as `STRIPE_SECRET_KEY`

### 2. Configure Webhook
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Set URL: `http://localhost:5000/api/webhooks/stripe` (or production URL)
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. Copy "Signing secret" → Add to .env as `STRIPE_WEBHOOK_SECRET`

### 3. Test with Stripe CLI (Optional)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# Copy webhook signing secret to .env
```

---

## 🧪 Testing Instructions

### Test Cards
```
✅ Success:              4242 4242 4242 4242
❌ Card Declined:        4000 0000 0000 0002
🔐 Requires 3D Secure:   4000 0027 6000 3184
⚠️ Insufficient Funds:   4000 0000 0000 9995
```

Use any:
- Future expiry date (e.g., 12/30)
- Any 3-digit CVC (e.g., 123)
- Any billing ZIP (e.g., 12345)

### Test Flow
1. **Create a trip** as tourist
2. **Select guide** and negotiate price
3. **Guide accepts** via API:
   ```bash
   curl -X PUT http://localhost:5000/api/guide/trips/{tripId}/accept \
     -H "Authorization: Bearer {guideToken}"
   ```
4. **Verify trip status** = `awaiting_payment`
5. **Tourist creates checkout session** (frontend does this)
6. **Complete payment** with test card
7. **Verify webhook received** in backend logs
8. **Check trip status** = `confirmed`
9. **Check payment status** = `paid`

---

## 📋 API Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes
- `400` - Bad request (invalid data)
- `401` - Unauthorized (no token)
- `403` - Forbidden (not trip owner)
- `404` - Trip not found
- `500` - Server error

---

## 🔒 Security Checklist

- [ ] Verify user owns trip before creating checkout session
- [ ] Validate trip status is `awaiting_payment`
- [ ] Verify Stripe webhook signature
- [ ] Store session ID for idempotency
- [ ] Don't expose Stripe secret key to frontend
- [ ] Use HTTPS in production for webhooks
- [ ] Implement rate limiting on checkout endpoint
- [ ] Log all payment events for audit trail
- [ ] Handle webhook retries (idempotent processing)

---

## 🚀 Production Checklist

Before going live:

- [ ] Switch to live Stripe keys (sk_live_...)
- [ ] Update webhook URL to production domain
- [ ] Configure production webhook secret
- [ ] Update success/cancel URLs to production domain
- [ ] Enable webhook monitoring in Stripe Dashboard
- [ ] Set up error alerting for failed payments
- [ ] Configure backup webhook endpoints
- [ ] Test production flow with real card
- [ ] Document refund process
- [ ] Set up payment reconciliation process

---

## 📞 Support & Resources

### Stripe Documentation
- [Checkout Session API](https://stripe.com/docs/api/checkout/sessions)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Cards](https://stripe.com/docs/testing)

### Common Issues

**Issue:** Webhook not receiving events  
**Solution:** Check webhook URL is accessible, verify signing secret

**Issue:** Session expires  
**Solution:** Sessions expire after 24 hours, create new one

**Issue:** Payment succeeds but trip not updated  
**Solution:** Check webhook handler, verify event type, check logs

---

## 📝 Backend Implementation Summary

Total endpoints to implement/modify:
1. ✅ `PUT /api/guide/trips/:tripId/accept` - Add payment status
2. ✅ `POST /api/tourist/trips/:tripId/create-checkout-session` - New endpoint
3. ✅ `POST /api/webhooks/stripe` - New webhook handler
4. ✅ `GET /api/trips/:tripId` - Ensure payment fields returned

Database changes:
- ✅ Add payment fields to Trip model

Configuration:
- ✅ Add Stripe environment variables
- ✅ Configure webhook in Stripe Dashboard

---

**Estimated Implementation Time:** 4-6 hours  
**Priority:** High (blocks trip confirmation flow)

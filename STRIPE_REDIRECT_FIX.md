# 🔴 URGENT: Stripe Redirect URL Issue

## Problem
After successful payment, Stripe redirects to the **WRONG URL**:
```
❌ Wrong: http://localhost:5173/trips/{tripId}/payment/success
✅ Correct: http://localhost:3000/payment/success?trip_id={tripId}&session_id={sessionId}
```

## Root Cause
The **backend is ignoring the success/cancel URLs** sent from the frontend and using hardcoded URLs instead.

---

## 🛠️ Backend Fix Required

### Find the checkout session creation code:
```javascript
// In: backend/routes/tourist.js or similar
router.post('/tourist/trips/:tripId/create-checkout-session', async (req, res) => {
  // ...
  
  const session = await stripe.checkout.sessions.create({
    // ... other config ...
    
    // ❌ WRONG - Backend is using hardcoded URLs:
    success_url: `${process.env.FRONTEND_URL}/trips/${tripId}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/trips/${tripId}/payment/cancel`,
    
    // ✅ CORRECT - Use the URLs from request body:
    success_url: req.body.successUrl,
    cancel_url: req.body.cancelUrl,
  });
});
```

### Replace with:
```javascript
router.post('/tourist/trips/:tripId/create-checkout-session', async (req, res) => {
  const { successUrl, cancelUrl } = req.body;
  const tripId = req.params.tripId;
  
  // Validate URLs are provided
  if (!successUrl || !cancelUrl) {
    return res.status(400).json({
      success: false,
      message: 'successUrl and cancelUrl are required'
    });
  }
  
  console.log('Creating Stripe session with URLs:', { successUrl, cancelUrl });
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'egp',
        product_data: {
          name: `Trip to ${trip.destination || trip.province?.name}`,
          description: `Guide: ${trip.guide?.name || 'TBD'}`,
        },
        unit_amount: trip.negotiatedPrice * 100, // Convert to cents
      },
      quantity: 1,
    }],
    mode: 'payment',
    
    // ✅ Use URLs from request body
    success_url: successUrl,
    cancel_url: cancelUrl,
    
    metadata: {
      tripId: tripId,
      touristId: trip.touristId.toString(),
      guideId: trip.guideId?.toString(),
    },
    client_reference_id: tripId,
  });
  
  // Save session ID for idempotency
  trip.stripeCheckoutSessionId = session.id;
  await trip.save();
  
  res.json({
    data: {
      checkoutUrl: session.url,
      sessionId: session.id,
    },
  });
});
```

---

## 🔍 Also Check .env File

The backend might have wrong `FRONTEND_URL`:

```bash
# backend/.env

# ❌ WRONG (if you see this):
FRONTEND_URL=http://localhost:5173

# ✅ CORRECT:
FRONTEND_URL=http://localhost:3000
```

**After fixing, restart the backend server!**

---

## 🧪 Test After Fix

1. **Create checkout session** (click "Proceed to Payment")
2. **Check console logs** - should show:
   ```
   Sending success URL: http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}&trip_id=...
   ```
3. **Complete payment** on Stripe
4. **Should redirect to:** `http://localhost:3000/payment/success?...`
5. **Page should load** and show "Verifying Payment..."

---

## 🎯 Summary

**Action Required:** Backend developer needs to:
1. ✅ Use `req.body.successUrl` and `req.body.cancelUrl` 
2. ✅ NOT hardcode the redirect URLs
3. ✅ Update `FRONTEND_URL` in .env if needed
4. ✅ Restart backend server

The frontend is already sending the correct URLs - the backend just needs to use them!

---

## 📞 Temporary Workaround

If you can't modify the backend immediately, you can manually navigate after payment:

1. After payment succeeds, you'll see connection refused
2. Manually change the URL in browser to:
   ```
   http://localhost:3000/payment/success?session_id={sessionId}&trip_id={tripId}
   ```
3. Replace `{sessionId}` and `{tripId}` with the actual values from the URL

But this is not a real solution - the backend must be fixed!

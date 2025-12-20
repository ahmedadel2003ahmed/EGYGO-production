# 🔧 Payment Integration Troubleshooting Guide

## ❌ Error: "Failed to create payment session" (500 Internal Server Error)

### Common Causes and Solutions

---

## 1️⃣ Backend Endpoint Not Implemented

### Check if endpoint exists:
```bash
curl -X POST http://localhost:5000/api/tourist/trips/{tripId}/create-checkout-session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**If you get 404:** The endpoint doesn't exist yet.  
**Solution:** Implement the endpoint following `BACKEND_INTEGRATION_CHECKLIST.md`

---

## 2️⃣ Missing Stripe Configuration

### Check backend environment variables:
```bash
# .env file should have:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

**If missing:** Add Stripe keys from https://dashboard.stripe.com/test/apikeys

---

## 3️⃣ Trip Missing Required Fields

### Check trip data in database:
```javascript
// Trip must have:
{
  status: 'awaiting_payment',
  paymentStatus: 'pending',
  negotiatedPrice: 500, // Required!
  guideId: '...',       // Required!
  touristId: '...'      // Required!
}
```

**If missing:** Ensure guide acceptance updates these fields:
```javascript
// When guide accepts:
trip.status = 'awaiting_payment';
trip.paymentStatus = 'pending';
trip.negotiatedPrice = <price>;
```

---

## 4️⃣ Stripe Package Not Installed

### Backend needs Stripe SDK:
```bash
cd backend
npm install stripe
# or
yarn add stripe
```

---

## 5️⃣ Authorization Issues

### Check token in localStorage:
Open browser console:
```javascript
localStorage.getItem('access_token')
// Should return: "eyJhbGc..."
```

**If null/undefined:** You're not logged in. Login first.

---

## 🔍 Debug Steps

### Step 1: Check Browser Console
After clicking "Proceed to Payment", check console logs:
```
Creating checkout session for trip: 6735...
Request URL: http://localhost:5000/api/tourist/trips/.../create-checkout-session
Auth token: Present
Failed to create checkout session: {...}
```

Look for detailed error in the logs.

---

### Step 2: Check Backend Logs
In your backend terminal, you should see:
```
POST /api/tourist/trips/.../create-checkout-session 500
Error: Missing STRIPE_SECRET_KEY
  or
Error: Trip not found
  or
Error: negotiatedPrice is required
```

---

### Step 3: Test Backend Directly

#### Get your auth token:
```javascript
// In browser console:
console.log(localStorage.getItem('access_token'));
```

#### Test endpoint with curl:
```bash
curl -X POST http://localhost:5000/api/tourist/trips/YOUR_TRIP_ID/create-checkout-session \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"successUrl": "http://localhost:3000/payment/success", "cancelUrl": "http://localhost:3000/payment/cancel"}' \
  -v
```

Look at the response for specific error details.

---

### Step 4: Verify Trip Status
```bash
curl http://localhost:5000/api/trips/YOUR_TRIP_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Response should include:
```json
{
  "data": {
    "trip": {
      "status": "awaiting_payment",
      "negotiatedPrice": 500,
      "paymentStatus": "pending"
    }
  }
}
```

---

## 🛠️ Quick Fixes

### Fix 1: Stripe Not Configured
```javascript
// backend/routes/tourist.js or similar
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// If undefined, you'll get 500 error
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not set in environment variables');
}
```

### Fix 2: Missing negotiatedPrice
```javascript
// When guide accepts trip:
router.put('/guide/trips/:tripId/accept', async (req, res) => {
  const trip = await Trip.findById(req.params.tripId);
  
  trip.status = 'awaiting_payment';
  trip.paymentStatus = 'pending';
  trip.negotiatedPrice = trip.proposedPrice || 500; // Must be set!
  
  await trip.save();
  res.json({ data: { trip } });
});
```

### Fix 3: Wrong Trip Status
```javascript
// In create-checkout-session endpoint:
if (trip.status !== 'awaiting_payment') {
  return res.status(400).json({
    message: `Trip must be in awaiting_payment status. Current: ${trip.status}`
  });
}
```

---

## 📋 Implementation Checklist

If the endpoint isn't implemented yet, you need:

- [ ] Install Stripe package: `npm install stripe`
- [ ] Add Stripe keys to `.env`
- [ ] Create endpoint: `POST /api/tourist/trips/:tripId/create-checkout-session`
- [ ] Implement session creation logic
- [ ] Handle errors properly
- [ ] Return `checkoutUrl` and `sessionId`

See `BACKEND_INTEGRATION_CHECKLIST.md` for full implementation details.

---

## 🔥 Most Common Issues

### 1. **"STRIPE_SECRET_KEY is not defined"**
**Fix:** Add to backend `.env`:
```
STRIPE_SECRET_KEY=sk_test_51...
```

### 2. **"negotiatedPrice is required"**
**Fix:** Ensure guide acceptance sets the price:
```javascript
trip.negotiatedPrice = agreedPrice;
```

### 3. **"Trip not in awaiting_payment status"**
**Fix:** Trip status flow should be:
```
negotiating → (guide accepts) → awaiting_payment
```

### 4. **"Cannot read property 'create' of undefined"**
**Fix:** Stripe not initialized:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

---

## 🆘 Still Not Working?

### Check these in order:

1. **Backend running?**
   - Visit http://localhost:5000 - should respond
   
2. **Stripe keys correct?**
   - Test keys start with `sk_test_`
   - Get from: https://dashboard.stripe.com/test/apikeys

3. **Trip exists and accessible?**
   - GET `/api/trips/:tripId` should return trip data
   
4. **User authorized?**
   - Token must belong to trip owner (tourist)

5. **Endpoint implemented?**
   - Check backend routes for `create-checkout-session`

---

## 📞 Get Backend Error Details

Add this temporarily to see exact error:

```javascript
// In trip details page, after checkout mutation definition:
console.log('Trip ID:', tripId);
console.log('Trip data:', trip);
console.log('Trip status:', trip?.status);
console.log('Negotiated price:', trip?.negotiatedPrice);
console.log('Payment status:', trip?.paymentStatus);
```

This will show if the trip has the required data.

---

## ✅ Verification Test

Once fixed, this should work:

1. Click "💳 Proceed to Payment"
2. See console log: "Creating checkout session..."
3. See console log: "Checkout session created successfully"
4. Browser redirects to Stripe checkout page
5. ✅ Success!

---

## 🎯 Expected Backend Response

When working correctly:
```json
{
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
    "sessionId": "cs_test_..."
  }
}
```

---

**Need more help?** Check the detailed logs in browser console after clicking the payment button. The enhanced error messages will guide you to the specific issue.

# 🔴 URGENT: Stripe Webhook Not Configured

## Issue
Payment succeeds on Stripe, but the trip status is not being updated on the backend. The success page keeps polling forever because the webhook isn't configured.

---

## 🛠️ Quick Fix: Configure Stripe Webhook

### Method 1: Using Stripe CLI (Recommended for Development)

#### Step 1: Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (using Scoop)
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

#### Step 2: Login to Stripe
```bash
stripe login
```
This will open your browser to authenticate.

#### Step 3: Forward Webhooks to Local Backend
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

#### Step 4: Copy the Webhook Secret
Update your backend `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### Step 5: Restart Backend
```bash
# Stop backend (Ctrl+C)
# Start again
npm start
```

#### Step 6: Keep Stripe CLI Running
Leave the `stripe listen` command running in a terminal while testing.

---

### Method 2: Using Stripe Dashboard (For Testing Without CLI)

#### Step 1: Create Webhook Endpoint
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Set **Endpoint URL**: `http://localhost:5000/api/webhooks/stripe`
   - Note: This won't work for localhost unless you use ngrok or similar
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.payment_failed`
5. Click **"Add endpoint"**

#### Step 2: Get Signing Secret
1. Click on the webhook you just created
2. Click **"Reveal"** under **Signing secret**
3. Copy the secret (starts with `whsec_`)

#### Step 3: Update Backend .env
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### Step 4: Restart Backend

---

## 🔧 Backend Webhook Handler Implementation

Make sure this endpoint exists in your backend:

```javascript
// backend/routes/webhooks.js or similar
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// IMPORTANT: Use raw body for webhook verification
router.post('/stripe', 
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      console.log('✅ Webhook verified:', event.type);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('💳 Payment successful for session:', session.id);
        
        // Get trip ID from metadata
        const tripId = session.metadata.tripId || session.client_reference_id;
        
        if (!tripId) {
          console.error('❌ No tripId in session metadata');
          return res.json({ received: true });
        }

        try {
          // Update trip in database
          const trip = await Trip.findById(tripId);
          
          if (trip) {
            // Get payment intent to get payment ID
            const paymentIntent = await stripe.paymentIntents.retrieve(
              session.payment_intent
            );

            trip.status = 'confirmed';
            trip.paymentStatus = 'paid';
            trip.stripePaymentIntentId = paymentIntent.id;
            trip.paidAt = new Date();
            
            await trip.save();
            
            console.log('✅ Trip updated:', tripId, {
              status: trip.status,
              paymentStatus: trip.paymentStatus
            });

            // Optional: Send confirmation email
            // await sendConfirmationEmail(trip);
          } else {
            console.error('❌ Trip not found:', tripId);
          }
        } catch (error) {
          console.error('❌ Error updating trip:', error);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        console.log('❌ Payment failed:', failedIntent.id);
        
        // Handle failed payment
        // Find trip and update status
        break;

      default:
        console.log('⚠️ Unhandled event type:', event.type);
    }

    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
  }
);

module.exports = router;
```

### Register the Webhook Route
```javascript
// backend/server.js or app.js
const webhookRoutes = require('./routes/webhooks');

// IMPORTANT: Register webhook route BEFORE express.json() middleware
app.use('/api/webhooks', webhookRoutes);

// Then other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

---

## 🧪 Testing the Webhook

### Step 1: Start Everything
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Stripe CLI
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# Terminal 3: Frontend
cd frontend
npm run dev
```

### Step 2: Make a Test Payment
1. Click "Proceed to Payment"
2. Use test card: `4242 4242 4242 4242`
3. Complete payment

### Step 3: Check Webhook Logs
In the Stripe CLI terminal, you should see:
```
2025-12-19 10:30:00  --> checkout.session.completed [evt_xxx]
2025-12-19 10:30:00  <-- [200] POST http://localhost:5000/api/webhooks/stripe [evt_xxx]
```

### Step 4: Check Backend Logs
Your backend should log:
```
✅ Webhook verified: checkout.session.completed
💳 Payment successful for session: cs_test_xxx
✅ Trip updated: 6945b686451a85722d185ca0
```

### Step 5: Check Frontend
The success page should stop polling and show "Payment Successful!"

---

## 🔍 Troubleshooting

### Issue: "Webhook signature verification failed"
**Cause:** Wrong `STRIPE_WEBHOOK_SECRET` or raw body not used

**Fix:**
```javascript
// Make sure webhook route uses raw body
app.use('/api/webhooks/stripe', 
  express.raw({ type: 'application/json' }),
  webhookHandler
);

// Other routes use JSON
app.use(express.json());
```

### Issue: "Trip not updating"
**Check:**
1. Console logs - is webhook being called?
2. Trip ID in session metadata
3. Database connection
4. Trip update logic

**Debug:**
```javascript
console.log('Session metadata:', session.metadata);
console.log('Trip ID:', tripId);
console.log('Trip before update:', trip);
console.log('Trip after update:', trip);
```

### Issue: "No webhook events received"
**Check:**
1. Stripe CLI is running
2. Backend endpoint is accessible
3. Webhook URL is correct
4. Backend logs for incoming requests

---

## ✅ Verification Checklist

- [ ] Stripe CLI installed and running `stripe listen`
- [ ] `STRIPE_WEBHOOK_SECRET` added to backend `.env`
- [ ] Webhook endpoint implemented at `/api/webhooks/stripe`
- [ ] Webhook uses `express.raw()` for body parsing
- [ ] Webhook verifies signature
- [ ] Webhook updates trip status to `confirmed`
- [ ] Webhook sets payment status to `paid`
- [ ] Backend restarted after config changes
- [ ] Test payment completes successfully
- [ ] Success page shows confirmation within 5 seconds

---

## 🎯 Expected Flow After Fix

1. User completes payment on Stripe ✓
2. Stripe sends webhook to backend ✓
3. Backend verifies webhook signature ✓
4. Backend updates trip: `status=confirmed`, `paymentStatus=paid` ✓
5. Frontend polls trip status (every 2 seconds) ✓
6. Frontend detects payment is confirmed ✓
7. Success page shows "Payment Successful!" ✓

---

## 📞 Still Not Working?

### Check in this order:

1. **Is Stripe CLI running?**
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```

2. **Does webhook endpoint exist?**
   ```bash
   curl -X POST http://localhost:5000/api/webhooks/stripe
   # Should NOT return 404
   ```

3. **Is backend logging anything?**
   - Check console for webhook logs
   - Add more console.log statements

4. **Manual webhook test:**
   ```bash
   stripe trigger checkout.session.completed
   ```

5. **Check Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/logs
   - Look for recent webhook events
   - Check if they succeeded or failed

---

**Priority:** CRITICAL - Users can't confirm trips without this!

**Time to fix:** 15-30 minutes

**See also:** `BACKEND_INTEGRATION_CHECKLIST.md` section 3

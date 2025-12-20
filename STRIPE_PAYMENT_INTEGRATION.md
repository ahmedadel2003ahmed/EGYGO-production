# Stripe Payment Integration - EGYGO Trips

## Overview
This document describes the complete Stripe Checkout payment flow integration for EGYGO trip bookings. The integration follows a secure, user-friendly flow that handles payment processing, redirects, and status verification.

---

## Payment Flow Architecture

### Flow Steps

#### Step 1: Guide Accepts Trip
**Actor:** Guide  
**Endpoint:** `PUT /api/guide/trips/{tripId}/accept`  
**Authorization:** Guide's Bearer Token

**Action:**
- Guide reviews and accepts the trip request
- Backend updates trip status to `awaiting_payment`
- Backend sets `paymentStatus` to `pending`

**Expected Result:**
```json
{
  "trip": {
    "status": "awaiting_payment",
    "paymentStatus": "pending",
    "negotiatedPrice": 500
  }
}
```

---

#### Step 2: Tourist Creates Checkout Session
**Actor:** Tourist  
**Endpoint:** `POST /api/tourist/trips/{tripId}/create-checkout-session`  
**Authorization:** Tourist's Bearer Token

**Request Body:**
```json
{
  "successUrl": "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}&trip_id={tripId}",
  "cancelUrl": "http://localhost:3000/payment/cancel?trip_id={tripId}"
}
```

**Response:**
```json
{
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
    "sessionId": "cs_test_xxx"
  }
}
```

**Key Features:**
- **Idempotency:** Calling this endpoint multiple times returns the same session ID
- **Frontend redirects** to `checkoutUrl` using `window.location.href`

**Implementation Location:**  
`src/app/(pages)/my-trips/[tripId]/page.jsx` (lines 239-269)

---

#### Step 3: Stripe Checkout Page
**Actor:** Stripe  
**Action:** User is redirected to Stripe's hosted checkout page

**User Actions:**
- Enters payment information
- Completes or cancels payment

**Stripe handles:**
- Card validation
- Payment processing
- Redirect back to success or cancel URL

---

#### Step 4: Webhook Updates Trip
**Actor:** Stripe Webhook (Backend)  
**Event:** `checkout.session.completed`

**Backend Action:**
When Stripe webhook receives successful payment:
```json
{
  "trip": {
    "status": "confirmed",
    "paymentStatus": "paid",
    "stripePaymentIntentId": "pi_xxx",
    "paidAt": "2025-12-19T10:30:00Z"
  }
}
```

**Security:** Only backend can update payment status (not exposed to frontend)

---

#### Step 5: Frontend Verifies Status
**Actor:** Frontend  
**Endpoint:** `GET /api/trips/{tripId}`  
**Authorization:** Tourist's Bearer Token

**Implementation:**
- Success page polls the trip status every 2 seconds
- Stops polling when `paymentStatus` changes from `pending`
- Displays confirmation when status is `paid` and trip is `confirmed`

**Implementation Location:**  
`src/app/(pages)/payment/success/page.jsx` (lines 19-45)

---

## Frontend Components

### 1. Trip Details Page - Payment Section
**File:** `src/app/(pages)/my-trips/[tripId]/page.jsx`

**Features:**
- ✅ Shows negotiated price
- ✅ Displays payment features (SSL, money-back, instant confirmation)
- ✅ Loading state with spinner during redirect
- ✅ Payment status indicator
- ✅ Confirmed section for successful payments

**UI States:**
- `awaiting_payment` → Shows "Complete Payment" section
- `confirmed` + `paid` → Shows "Trip Confirmed" section

---

### 2. Payment Success Page
**File:** `src/app/(pages)/payment/success/page.jsx`

**Features:**
- ✅ Polls trip status until payment confirmed
- ✅ Shows verification steps
- ✅ Displays trip summary and payment details
- ✅ "What's Next" guidance
- ✅ Error handling with session ID reference

**Query Parameters:**
- `session_id`: Stripe checkout session ID
- `trip_id`: Trip identifier

**States:**
- `verifying`: Shows spinner and verification steps
- `success`: Shows confirmation with trip details
- `failed`: Shows error with retry options

---

### 3. Payment Cancel Page
**File:** `src/app/(pages)/payment/cancel/page.jsx`

**Features:**
- ✅ Explains no charges were made
- ✅ Shows trip is still reserved
- ✅ Displays trip details
- ✅ "Why complete payment" reasons
- ✅ Quick retry button

**Query Parameters:**
- `trip_id`: Trip identifier

---

### 4. My Trips List
**File:** `src/app/(pages)/my-trips/page.jsx`

**Enhanced Features:**
- ✅ Payment status badges alongside trip status
- ✅ Visual indicators for pending payments
- ✅ Includes `awaiting_payment` in upcoming trips filter
- ✅ Animated pulse effect on payment badges

**Status Badges:**
- 💳 Payment Required (awaiting_payment + pending)
- ✓ Paid (confirmed + paid)

---

## Security Implementation

### Authorization
- **Only trip owner** (tourist) can create checkout session
- Backend validates user owns the trip
- Returns 403 for unauthorized attempts

### Idempotency
- Multiple calls to create checkout return same session
- Prevents duplicate charges
- Handled by backend logic

### Webhook Verification
- Backend verifies webhook signature from Stripe
- Only trusted Stripe events update payment status
- Frontend cannot manipulate payment status

### Secure Redirects
- Success/cancel URLs include trip ID
- Frontend verifies trip ownership before displaying
- Session ID used only for reference, not authorization

---

## Environment Configuration

### Required Environment Variables
```env
# Backend (.env)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## API Endpoints Summary

### Tourist Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/tourist/trips/{tripId}/create-checkout-session` | Create Stripe session |
| `GET` | `/trips/{tripId}` | Get trip and payment status |

### Guide Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `PUT` | `/guide/trips/{tripId}/accept` | Accept trip (triggers payment) |

---

## Trip Status Flow

```
pending
  ↓
guide_selected (Guide applies)
  ↓
negotiating (Price discussion)
  ↓
awaiting_payment (Guide accepts) ← PAYMENT REQUIRED
  ↓
[Stripe Checkout] → payment completed
  ↓
confirmed (Webhook updates) ← TRIP CONFIRMED
  ↓
in_progress (Trip day)
  ↓
completed
```

---

## Payment Status Values

| Status | Description | Visible To |
|--------|-------------|------------|
| `pending` | Awaiting payment | Tourist |
| `paid` | Payment successful | Tourist & Guide |
| `failed` | Payment failed | Tourist (support contact) |

---

## User Experience

### Tourist Journey
1. Selects guide and negotiates price
2. Guide accepts trip → sees "Payment Required" banner
3. Clicks "Proceed to Payment" → redirects to Stripe
4. Completes payment on Stripe
5. Redirected to success page → sees verification
6. Trip status updates to "Confirmed"
7. Can view payment reference ID

### Guide Journey
1. Reviews trip request
2. Accepts trip → trip moves to `awaiting_payment`
3. Waits for tourist to complete payment
4. Receives notification when payment confirmed
5. Trip status becomes `confirmed`

---

## Error Handling

### Payment Cancellation
- User clicks "Back" on Stripe page
- Redirected to `/payment/cancel`
- Trip remains in `awaiting_payment` state
- Can retry payment anytime

### Payment Failure
- Stripe declines payment (card issue)
- Webhook notifies backend
- Backend sets `paymentStatus` to `failed`
- Tourist sees error on success page with support info

### Network Issues
- Success page keeps polling for 30 seconds
- Shows "verifying" state with loader
- If timeout, shows retry button
- Session ID preserved for support reference

---

## Testing Checklist

### Happy Path
- [ ] Guide accepts trip → status becomes `awaiting_payment`
- [ ] Tourist creates checkout session successfully
- [ ] Redirects to Stripe checkout page
- [ ] Complete payment with test card `4242 4242 4242 4242`
- [ ] Redirected to success page
- [ ] Success page shows verification → confirmation
- [ ] Trip status becomes `confirmed`
- [ ] Payment status becomes `paid`
- [ ] Trip appears with "✓ Paid" badge in list

### Cancel Flow
- [ ] Tourist initiates payment
- [ ] Clicks "Back" on Stripe page
- [ ] Redirected to cancel page
- [ ] Can retry payment from cancel page
- [ ] Trip still shows as `awaiting_payment`

### Error Handling
- [ ] Declined card shows error
- [ ] Network timeout handled gracefully
- [ ] Invalid trip ID shows error
- [ ] Unauthorized access returns 403
- [ ] Duplicate session creation returns same ID

### UI/UX
- [ ] Loading states show spinners
- [ ] All buttons disabled during processing
- [ ] Success animations play correctly
- [ ] Payment badges display correctly
- [ ] Mobile responsive design works

---

## Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

Use any future expiry date and any 3-digit CVC.

---

## Files Modified/Created

### New Files
- `src/app/(pages)/payment/success/page.jsx`
- `src/app/(pages)/payment/success/PaymentSuccess.module.css`
- `src/app/(pages)/payment/cancel/page.jsx`
- `src/app/(pages)/payment/cancel/PaymentCancel.module.css`

### Modified Files
- `src/app/(pages)/my-trips/[tripId]/page.jsx`
- `src/app/(pages)/my-trips/[tripId]/TripDetails.module.css`
- `src/app/(pages)/my-trips/page.jsx`
- `src/app/(pages)/my-trips/MyTrips.module.css`

---

## Future Enhancements

### Phase 2 Considerations
- [ ] Email confirmation after payment
- [ ] SMS notifications
- [ ] Invoice generation (PDF)
- [ ] Refund functionality
- [ ] Partial payment support
- [ ] Multiple payment methods
- [ ] Save card for future bookings
- [ ] Payment plan options

---

## Support & Troubleshooting

### Common Issues

**Issue:** Payment stuck in "Verifying" state  
**Solution:** Check webhook is properly configured and backend is receiving events

**Issue:** Session expired error  
**Solution:** Sessions expire after 24 hours. Create new checkout session

**Issue:** Payment succeeded but trip not confirmed  
**Solution:** Check backend logs for webhook processing errors

### Debug Tips
1. Check browser console for API errors
2. Verify localStorage contains valid `access_token`
3. Test webhook with Stripe CLI: `stripe listen --forward-to localhost:5000/api/webhooks/stripe`
4. Check backend logs for webhook signature verification

---

## Contact
For integration questions or issues, contact the development team or refer to Stripe documentation at https://stripe.com/docs

---

**Last Updated:** December 19, 2025  
**Version:** 1.0.0

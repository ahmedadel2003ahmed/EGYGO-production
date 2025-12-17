# Video Call & Guide Booking Flow - Technical Specification

## Overview
Complete implementation of real-time video call negotiation system for guide booking, using Agora RTC for video communication. Tourist and guide negotiate trip details and price during live video call, followed by guide acceptance/rejection and payment processing.

---

## User Flow Sequence

### Phase 1: Pre-Call Setup
1. Tourist creates trip (status: `selecting_guide`)
2. Tourist selects guide from compatible list (status: `awaiting_call`)
3. Tourist initiates video call

### Phase 2: Video Call & Negotiation
4. System creates call session with Agora tokens
5. Both parties join video call room
6. Tourist and guide negotiate price, itinerary, and trip details via video
7. Either party ends call with negotiated price and summary

### Phase 3: Post-Call Confirmation
8. Trip status changes to `pending_confirmation`
9. Guide reviews and accepts/rejects trip
10. If accepted: Trip status changes to `awaiting_payment`
11. Tourist completes payment via Stripe
12. Trip confirmed (status: `confirmed`)

---

## API Endpoints

### 1. Initiate Video Call
**POST** `/api/trips/{tripId}/calls/initiate`

**Authentication:** Required (Tourist)

**Request Path Parameters:**
- `tripId` (string, required): Trip ID

**Validation:**
- Tourist must own the trip
- Trip status must be `awaiting_call`
- Trip must have `selectedGuide` assigned
- Guide must exist and be active

**Process Flow:**
1. Validate trip ownership and status
2. Retrieve selected guide user ID
3. Create Agora call session (channel name, tokens)
4. Update trip status to `in_call`
5. Add call record to trip's `callSessions` array
6. Generate Agora RTC token for tourist
7. Log audit trail

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Call initiated",
  "callId": "call_session_id",
  "tripId": "trip_id",
  "token": {
    "token": "agora_rtc_token",
    "channelName": "channel_name",
    "uid": 123456,
    "appId": "agora_app_id"
  },
  "nextStep": "join_call"
}
```

**Error Responses:**
- `400`: Invalid trip ID format
- `403`: Not trip owner
- `404`: Trip or guide not found
- `409`: Invalid trip status transition

---

### 2. Join Video Call
**GET** `/api/calls/{callId}/join`

**Authentication:** Required (Tourist or Guide)

**Request Path Parameters:**
- `callId` (string, required): Call session ID

**Process Flow:**
1. Retrieve call session by ID
2. Verify user is participant (tourist or guide)
3. Auto-detect role based on user ID
4. Generate Agora RTC token for user's role
5. Return call credentials

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "appId": "agora_app_id",
    "channelName": "channel_name",
    "uid": 123456,
    "token": "agora_rtc_token",
    "role": "tourist",
    "callStatus": "active"
  }
}
```

**Error Responses:**
- `403`: User not participant in call
- `404`: Call session not found

---

### 3. End Call with Negotiation
**POST** `/api/calls/{callId}/end`

**Authentication:** Required (Tourist or Guide)

**Request Path Parameters:**
- `callId` (string, required): Call session ID

**Request Body:**
```json
{
  "endReason": "completed",
  "summary": "Discussed visiting pyramids and sphinx. Agreed on 4-hour tour with lunch break.",
  "negotiatedPrice": 500
}
```

**Fields:**
- `endReason` (string, required): Reason for ending (`completed`, `cancelled`, `technical_issue`)
- `summary` (string, optional): Call summary and discussion points
- `negotiatedPrice` (number, optional): Final agreed price in EGP

**Validation:**
- User must be call participant
- `negotiatedPrice` must be positive number if provided

**Process Flow:**
1. Retrieve call session and associated trip
2. Verify user is participant (tourist or guide)
3. Update call session in trip's `callSessions` array:
   - Set `endedAt` timestamp
   - Calculate call duration
   - Store summary
   - Store negotiated price
4. Update trip status to `pending_confirmation`
5. Save `negotiatedPrice` to trip document
6. End Agora call session
7. Notify guide of pending confirmation
8. Log audit trail

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Call ended. Waiting for confirmation.",
  "trip": {
    "_id": "trip_id",
    "status": "pending_confirmation",
    "negotiatedPrice": 500,
    "callSessions": [...]
  },
  "callSummary": {
    "callId": "call_id",
    "negotiatedPrice": 500
  },
  "nextStep": "awaiting_guide_confirmation"
}
```

**Error Responses:**
- `403`: Not call participant
- `404`: Call or trip not found
- `400`: Invalid negotiated price

---

### 4. Guide Accept Trip
**PUT** `/api/guide/trips/{tripId}/accept`

**Authentication:** Required (Guide)

**Request Path Parameters:**
- `tripId` (string, required): Trip ID

**Validation:**
- User must be the selected guide for this trip
- Trip status must be `pending_confirmation`
- Trip must have `negotiatedPrice` set

**Process Flow:**
1. Verify guide is selected guide for trip
2. Validate trip status allows acceptance
3. Update trip status to `awaiting_payment`
4. Set `paymentStatus` to `pending`
5. Notify tourist to complete payment
6. Log audit trail

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Trip accepted. Awaiting payment from tourist.",
  "trip": {
    "_id": "trip_id",
    "status": "awaiting_payment",
    "paymentStatus": "pending",
    "negotiatedPrice": 500
  }
}
```

**Error Responses:**
- `403`: Not the selected guide
- `404`: Trip not found
- `409`: Invalid status transition

---

### 5. Guide Reject Trip
**PUT** `/api/guide/trips/{tripId}/reject`

**Authentication:** Required (Guide)

**Request Path Parameters:**
- `tripId` (string, required): Trip ID

**Request Body:**
```json
{
  "reason": "Schedule conflict - cannot accommodate requested time"
}
```

**Fields:**
- `reason` (string, required): Rejection reason

**Validation:**
- User must be the selected guide
- Trip status must be `pending_confirmation`

**Process Flow:**
1. Verify guide is selected guide
2. Validate status transition
3. Update trip status to `rejected`
4. Set `cancellationReason` and `cancelledBy`
5. Clear `selectedGuide` (allows tourist to select another guide)
6. Notify tourist of rejection
7. Log audit trail

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Trip rejected.",
  "trip": {
    "_id": "trip_id",
    "status": "rejected",
    "cancellationReason": "Schedule conflict",
    "cancelledBy": "guide",
    "selectedGuide": null
  }
}
```

---

### 6. Create Payment Checkout
**POST** `/api/tourist/trips/{tripId}/create-checkout-session`

**Authentication:** Required (Tourist)

**Request Path Parameters:**
- `tripId` (string, required): Trip ID

**Validation:**
- User must be trip owner
- Trip status must be `awaiting_payment`
- Trip must have `negotiatedPrice` set

**Process Flow:**
1. Verify trip ownership and status
2. Create Stripe Checkout Session with:
   - Line item: Trip with guide (price, description)
   - Success URL: `/trips/{tripId}?payment=success`
   - Cancel URL: `/trips/{tripId}?payment=cancelled`
   - Metadata: tripId, touristId, guideId
3. Return checkout URL

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/...",
    "sessionId": "cs_test_..."
  }
}
```

---

### 7. Payment Webhook Handler
**POST** `/api/webhooks/stripe`

**Authentication:** Stripe signature verification

**Process Flow:**
1. Verify Stripe webhook signature
2. Handle `checkout.session.completed` event
3. Extract tripId from metadata
4. Update trip:
   - Set `paymentStatus` to `paid`
   - Set status to `confirmed`
   - Store payment details
5. Notify guide of confirmed booking
6. Send confirmation to tourist

---

## Video Call Integration (Agora RTC)

### Agora Setup Requirements

**Environment Variables:**
```env
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
```

**NPM Packages:**
- Backend: `agora-token` (for token generation)
- Frontend: `agora-rtc-sdk-ng` (for RTC client)

### Token Generation Logic

**Function:** `buildRtcToken(channelName, uid, expirySeconds)`

**Parameters:**
- `channelName`: Unique channel identifier (use callId)
- `uid`: Numeric user ID (convert MongoDB ObjectId to number)
- `expirySeconds`: Token validity duration (default: 3600)

**Process:**
1. Retrieve Agora App ID and Certificate from environment
2. Set role as `PUBLISHER` (allows both publish and subscribe)
3. Calculate privilege expiry timestamp
4. Generate token using `RtcTokenBuilder.buildTokenWithUid()`
5. Return token string

### Frontend Video Call Implementation

**Technology Stack:**
- `agora-rtc-sdk-ng`: Real-time communication SDK
- React hooks for state management
- HTML5 video elements for display

**Call Initialization Flow:**

1. **Create Agora Client**
```javascript
const client = AgoraRTC.createClient({ 
  mode: 'rtc',  // Real-time communication
  codec: 'vp8'  // Video codec
});
```

2. **Setup Event Listeners**
   - `user-published`: Remote user starts video/audio
   - `user-unpublished`: Remote user stops media
   - `user-left`: Remote user leaves call
   - `connection-state-change`: Monitor connection status
   - `exception`: Handle errors

3. **Join Channel**
```javascript
await client.join(appId, channelName, token, uid);
```

4. **Create Local Media Tracks**
```javascript
const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
  { 
    encoderConfig: { sampleRate: 48000, stereo: true } 
  },
  { 
    encoderConfig: { 
      width: 640, 
      height: 480, 
      frameRate: 15,
      bitrateMax: 600 
    } 
  }
);
```

5. **Publish Tracks**
```javascript
await client.publish([audioTrack, videoTrack]);
```

6. **Display Video**
   - Local video: `videoTrack.play('local-player')`
   - Remote video: `user.videoTrack.play(containerId)`

**Call Controls:**
- **Toggle Microphone**: `audioTrack.setEnabled(!micOn)`
- **Toggle Camera**: `videoTrack.setEnabled(!cameraOn)`
- **End Call**: Unpublish tracks → Close tracks → Leave channel

**Cleanup Process:**
1. Unpublish all tracks from channel
2. Stop and close audio/video tracks
3. Leave Agora channel
4. Remove event listeners
5. Call backend end endpoint with negotiation data

---

## Frontend Components Structure

### 1. TripDetailPage Component

**Responsibilities:**
- Display trip information
- Show guide selection interface (if status = `selecting_guide`)
- Display "Start Call" button (if status = `awaiting_call`)
- Show payment button (if status = `awaiting_payment`)
- Display status-specific actions

**Key State:**
- `trip`: Current trip data
- `guidesData`: Available guides list
- `paymentLoading`: Payment process state

**Actions:**
- `handleSelectGuide(guideId)`: Select guide for trip
- `handleStartCall()`: Navigate to call page
- `handlePayNow()`: Initiate Stripe checkout

### 2. CallPage Component

**Responsibilities:**
- Initialize Agora client
- Join video call room
- Display local and remote video streams
- Provide call controls (mic, camera, hang up)
- Handle call end with negotiation modal

**Key State:**
- `joined`: Call join status
- `localVideoTrack`: User's camera stream
- `localAudioTrack`: User's microphone stream
- `remoteUsers`: Other participants in call
- `micOn/cameraOn`: Media toggle states
- `showEndModal`: End call modal visibility
- `summary/negotiatedPrice`: Negotiation data

**Actions:**
- `toggleMic()`: Mute/unmute microphone
- `toggleCamera()`: Enable/disable camera
- `handleHangUpClick()`: Show end call modal
- `submitEndCall()`: End call with negotiation data

---

## Data Models

### Trip Status Flow
```
creating 
  → selecting_guide 
  → awaiting_call 
  → in_call 
  → pending_confirmation 
  → awaiting_payment 
  → confirmed 
  → in_progress 
  → completed
```

**Alternative paths:**
- `rejected` (guide rejects)
- `cancelled` (tourist/guide cancels)

### Trip Document Structure
```javascript
{
  _id: ObjectId,
  tourist: ObjectId (ref: User),
  selectedGuide: ObjectId (ref: Guide),
  candidateGuides: [ObjectId],
  status: String (enum),
  startAt: Date,
  meetingPoint: { type: "Point", coordinates: [lng, lat] },
  meetingAddress: String,
  totalDurationMinutes: Number,
  itinerary: [{ placeId, placeName, durationMinutes, notes }],
  notes: String,
  negotiatedPrice: Number,
  paymentStatus: String (enum: pending, paid, refunded),
  callSessions: [{
    callId: ObjectId (ref: CallSession),
    guideId: ObjectId,
    startedAt: Date,
    endedAt: Date,
    duration: Number,
    summary: String,
    negotiatedPrice: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### CallSession Document Structure
```javascript
{
  _id: ObjectId,
  tripId: ObjectId (ref: Trip),
  touristUser: ObjectId (ref: User),
  guideUser: ObjectId (ref: User),
  channelName: String,
  status: String (enum: active, ended),
  startedAt: Date,
  endedAt: Date,
  duration: Number,
  endReason: String,
  maxDurationSeconds: Number (default: 3600),
  createdAt: Date
}
```

---

## Error Handling

### Common Error Scenarios

1. **Camera/Microphone Access Denied**
   - Error: `NotAllowedError`
   - Solution: Prompt user to grant permissions in browser settings

2. **Device Already in Use**
   - Error: `NotReadableError`
   - Solution: Close other applications/tabs using camera/mic

3. **No Devices Found**
   - Error: `NotFoundError`
   - Solution: Prompt user to connect camera/microphone

4. **Invalid Trip Status**
   - Error: `409 Conflict`
   - Solution: Refresh trip data, show current status

5. **Token Expired**
   - Error: Agora token expiry
   - Solution: Request new token from backend

6. **Network Issues**
   - Error: Connection failures
   - Solution: Implement retry logic, show reconnecting state

---

## Security Considerations

### Authentication & Authorization
- All endpoints require JWT authentication
- Verify user roles (tourist/guide) for specific actions
- Validate trip ownership before modifications
- Ensure guide is selected guide before acceptance

### Agora Token Security
- Generate tokens server-side only
- Set reasonable expiry times (1 hour)
- Never expose App Certificate to client
- Use HTTPS for all API calls

### Payment Security
- Use Stripe Checkout (PCI compliant)
- Verify webhook signatures
- Store minimal payment data
- Handle refunds through Stripe API

---

## Testing Checklist

### Video Call Flow
- [ ] Tourist can initiate call successfully
- [ ] Guide receives call notification
- [ ] Both parties can see/hear each other
- [ ] Camera/mic toggles work correctly
- [ ] Call ends properly with negotiation data
- [ ] System handles network interruptions

### Booking Flow
- [ ] Guide can accept with negotiated price
- [ ] Guide can reject with reason
- [ ] Tourist receives payment prompt after acceptance
- [ ] Stripe checkout completes successfully
- [ ] Trip status updates after payment
- [ ] Both parties receive confirmation notifications

### Edge Cases
- [ ] Call initiated when guide offline
- [ ] Payment fails or cancelled
- [ ] Guide rejects after call
- [ ] Tourist cancels during awaiting_payment
- [ ] Multiple call sessions for same trip
- [ ] Token expiry during active call

---

## Performance Optimization

### Video Quality Settings
- Default: 640x480 @ 15fps
- Adaptive bitrate: 400-600 kbps
- Audio: 48kHz stereo

### Network Requirements
- Minimum: 600 kbps upload/download
- Recommended: 1 Mbps+ for stable connection
- Agora automatically adjusts quality based on network

### Scalability
- Agora handles up to 17 participants per channel
- For 1-on-1 calls, system is highly scalable
- Consider Redis for call session caching
- Use database indexes on trip status and callSessions

---

## Success Metrics

### Key Performance Indicators
- Call connection success rate
- Average call duration
- Call completion rate (with negotiation)
- Guide acceptance rate post-call
- Payment completion rate
- End-to-end booking time

### User Experience Metrics
- Time to join call
- Audio/video quality ratings
- Call drop/reconnection rates
- User satisfaction scores

# AI Tour Guide Chat System - Nefertiti

## Overview

Production-ready AI Tour Guide Chat System integrated into EgyGo Tourism Platform.

## Features

- ✅ AI-powered chat assistant (Nefertiti)
- ✅ MongoDB database integration (Places, Hotels, Events)
- ✅ Arabic-only responses
- ✅ Floating chat widget
- ✅ Context-aware responses from database only
- ✅ Secure OpenAI API integration

## Backend Implementation

### 1. AI Chat Service

**File:** `backend/src/services/aiChatService.js`

- Database search before AI call
- OpenAI GPT-4 integration
- Arabic system prompt
- Response length limiting (300 chars)
- Input sanitization

### 2. Chat Controller

**File:** `backend/src/controllers/chatController.js`

- Added `aiChat` function
- POST /api/chat endpoint
- Error handling with Arabic fallback

### 3. Chat Routes

**File:** `backend/src/routes/chatRoutes.js`

- Public endpoint: `POST /api/chat`
- Request body: `{ message: string }`
- Response: `{ success: boolean, reply: string }`

## Frontend Implementation

### AI Chat Widget

**File:** `frontend/src/components/chat/AIChatWidget.tsx`

- Floating chat button (bottom-right)
- Modal chat interface
- Real-time messaging
- Arabic RTL support
- EGYGO branding with "Nefertiti" bot name

### Integration

**File:** `frontend/src/App.tsx`

- Global widget available on all pages
- Non-blocking user experience

## Configuration

### Backend Environment Variables

Add to `backend/.env`:

```env
OPENAI_API_KEY=your-openai-api-key-here
```

### Database Collections Used

- `places` (archaeological, entertainment, hotels, events)
- Search fields: name, description, tags
- Province relationship for location context

## API Endpoints

### POST /api/chat

**Request:**

```json
{
  "message": "ما هي أفضل الأماكن السياحية في المنيا؟"
}
```

**Response:**

```json
{
  "success": true,
  "reply": "مرحباً! في المنيا توجد أماكن رائعة..."
}
```

## System Behavior

1. **User sends message** → Chat widget
2. **Database search** → MongoDB full-text search
3. **No results?** → Return fallback message (no AI call)
4. **Results found?** → Format context + Call OpenAI
5. **AI Response** → Arabic-only, max 300 chars
6. **Display** → User sees response

## Error Messages (Arabic)

- No data found: `لا توجد معلومات متاحة حالياً عن هذا السؤال.`
- API error: `حدث خطأ في الاتصال بخدمة الدردشة.`

## Security Features

- ✅ Input sanitization
- ✅ API key in environment variables
- ✅ Rate limiting (via existing middleware)
- ✅ Response length limiting
- ✅ No external data allowed

## Testing

### Manual Test:

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Click floating chat button (bottom-right)
4. Send Arabic message about Minya tourism
5. Verify Arabic response from database context

### Example Test Messages:

- `أين الفنادق في المنيا؟`
- `ما هي الأماكن الأثرية؟`
- `أخبرني عن الفعاليات`

## Dependencies Installed

- Backend: `openai` (npm package)
- Frontend: No new dependencies (uses existing axios)

## File Changes Summary

- ✅ Created: `backend/src/services/aiChatService.js`
- ✅ Modified: `backend/src/controllers/chatController.js`
- ✅ Modified: `backend/src/routes/chatRoutes.js`
- ✅ Created: `frontend/src/components/chat/AIChatWidget.tsx`
- ✅ Modified: `frontend/src/App.tsx`
- ✅ Modified: `backend/.env`
- ✅ Created: `backend/.eslintrc.json`

## Notes

- Bot name displayed: "EGYGO"
- Internal AI name: "Nefertiti"
- Scope: Minya province tourism only
- Language: Arabic only (enforced by system prompt)
- No authentication required for chat

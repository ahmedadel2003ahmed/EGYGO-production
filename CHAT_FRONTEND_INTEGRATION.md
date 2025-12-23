# Frontend Integration Guide - Chat System

## 🎯 Quick Integration for Frontend Developers

This guide shows how to integrate the chat system with price finalization into your frontend application.

---

## 📦 Install Socket.io Client

```bash
npm install socket.io-client
```

---

## 🏗️ Architecture Overview

The chat system is split into two services:

1. **`chatService.ts`** - REST API for message history and access validation
2. **`socketChatService.ts`** - Real-time messaging with Socket.io
3. **`TripChat.tsx`** - Main chat UI component with price finalization

---

## 🔌 Service Layer Implementation

### 1. REST API Service - `api/services/chatService.ts`

```typescript
import { apiClient } from "../client";
import type { ApiResponse } from "../../types";

export interface ChatMessage {
  _id: string;
  trip: string;
  sender: {
    user: string;
    role: "tourist" | "guide";
  };
  receiver: {
    user: string;
    role: "tourist" | "guide";
  };
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
}

export interface ChatAccessResponse {
  canAccess: boolean;
  tripId: string;
}

export const chatService = {
  /**
   * Get chat message history for a trip
   */
  getMessages: async (tripId: string, limit = 100, skip = 0) => {
    const response = await apiClient.get<ApiResponse<ChatHistoryResponse>>(
      `/chat/${tripId}/messages`,
      { params: { limit, skip } }
    );
    return response.data;
  },

  /**
   * Check if current user can access chat for a trip
   */
  checkAccess: async (tripId: string) => {
    const response = await apiClient.get<ApiResponse<ChatAccessResponse>>(
      `/chat/${tripId}/access`
    );
    return response.data;
  },
};
```

---

### 2. Socket.io Service - `services/socketChatService.ts`

### 2. Socket.io Service - `services/socketChatService.ts`

```typescript
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

class SocketChatService {
  private socket: Socket | null = null;

  /**
   * Connect to chat server with JWT token
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log("[SocketChat] Already connected");
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupListeners();
  }

  /**
   * Setup base event listeners
   */
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("[SocketChat] Connected");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[SocketChat] Disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("[SocketChat] Connection error:", error.message);
    });
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Join a trip chat room
   */
  joinChat(
    tripId: string,
    onSuccess?: (data: any) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.socket?.connected) {
      onError?.("Not connected to chat server");
      return;
    }

    this.socket.emit("join_trip_chat", { tripId });

    this.socket.once("joined_chat", (data) => {
      console.log("[SocketChat] Joined:", data);
      onSuccess?.(data);
    });

    this.socket.once("chat_error", (error) => {
      console.error("[SocketChat] Join error:", error);
      onError?.(error.error);
    });
  }

  /**
   * Send a message
   */
  sendMessage(
    tripId: string,
    message: string,
    onError?: (error: string) => void
  ): void {
    if (!this.socket?.connected) {
      onError?.("Not connected to chat server");
      return;
    }

    if (!message?.trim()) {
      onError?.("Message cannot be empty");
      return;
    }

    this.socket.emit("send_message", { tripId, message: message.trim() });

    const errorHandler = (error: any) => {
      if (error.event === "send_message") {
        console.error("[SocketChat] Send error:", error);
        onError?.(error.error);
      }
    };

    this.socket.once("chat_error", errorHandler);

    // Clean up error listener after 5 seconds
    setTimeout(() => {
      this.socket?.off("chat_error", errorHandler);
    }, 5000);
  }

  /**
   * Listen for new messages
   */
  onNewMessage(callback: (message: any) => void): void {
    if (!this.socket) return;
    this.socket.on("new_message", callback);
  }

  /**
   * Remove new message listener
   */
  offNewMessage(callback: (message: any) => void): void {
    if (!this.socket) return;
    this.socket.off("new_message", callback);
  }

  /**
   * Leave chat room
   */
  leaveChat(tripId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit("leave_trip_chat", { tripId });
  }

  /**
   * Disconnect from chat server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export singleton instance
export const socketChatService = new SocketChatService();
```

---

## ⚛️ React Component with Price Finalization

### `components/chat/TripChat.tsx`

### `components/chat/TripChat.tsx`

```typescript
import { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
  X,
  DollarSign,
} from "lucide-react";
import { chatService, type ChatMessage } from "../../api/services/chatService";
import { socketChatService } from "../../services/socketChatService";
import { callService } from "../../api/services/callService";
import { tripService } from "../../api/services/tripService";
import { useAuth } from "../../features/auth/AuthContext";
import type { Trip } from "../../types";

interface TripChatProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}

export const TripChat = ({ trip, isOpen, onClose }: TripChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceData, setPriceData] = useState({
    negotiatedPrice: "",
    summary: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasJoinedRef = useRef(false);
  const messageListenersSetup = useRef(false);

  const isTourist = user?.role === "tourist";
  const canFinalizePrice = isTourist && trip.status === "awaiting_call";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize chat
  useEffect(() => {
    if (!isOpen) return;

    const initChat = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        // Check access
        const accessResult = await chatService.checkAccess(trip._id);
        if (!accessResult.data.canAccess) {
          setError("You cannot access this chat");
          setLoading(false);
          return;
        }

        // Load message history
        const historyResult = await chatService.getMessages(trip._id);
        setMessages(historyResult.data.messages);

        // Connect to socket
        socketChatService.connect(token);

        // Wait for connection before joining
        let attempts = 0;
        while (!socketChatService.isConnected() && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        if (!socketChatService.isConnected()) {
          setError("Failed to connect to chat server");
          setLoading(false);
          return;
        }

        // Join chat room
        if (!hasJoinedRef.current) {
          socketChatService.joinChat(
            trip._id,
            () => {
              setConnected(true);
              setLoading(false);
              hasJoinedRef.current = true;
            },
            (err) => {
              setError(err);
              setLoading(false);
            }
          );
        }

        // Setup message listener once
        if (!messageListenersSetup.current) {
          const handleNewMessage = (msg: ChatMessage) => {
            setMessages((prev) => [...prev, msg]);
          };
          socketChatService.onNewMessage(handleNewMessage);
          messageListenersSetup.current = true;
        }
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    initChat();

    // Cleanup on close
    return () => {
      if (!isOpen) {
        socketChatService.leaveChat(trip._id);
        hasJoinedRef.current = false;
        messageListenersSetup.current = false;
      }
    };
  }, [isOpen, trip._id]);

  // Send message
  const handleSend = useCallback(() => {
    if (!inputMessage.trim() || !connected || sending) return;

    setSending(true);
    socketChatService.sendMessage(trip._id, inputMessage.trim(), (err) => {
      setError(err);
      setSending(false);
    });

    setInputMessage("");
    setSending(false);
  }, [inputMessage, connected, sending, trip._id]);

  // Price finalization handler
  const handlePriceSubmit = async () => {
    const price = parseFloat(priceData.negotiatedPrice);
    if (!price || price <= 0) {
      alert("Please enter a valid price");
      return;
    }

    setSubmitting(true);
    try {
      // Get the most recent call ID from trip
      let callId =
        trip.meta?.callId ||
        trip.callSessions?.[trip.callSessions.length - 1]?.callId;

      // If no call exists, create one automatically
      if (!callId) {
        console.log(
          "[TripChat] No call found, initiating call for price finalization..."
        );
        const callResponse = await tripService.initiateCall(trip._id);
        callId = callResponse.callId;
        console.log("[TripChat] Call initiated:", callId);
      }

      // End the call with the negotiated price
      // IMPORTANT: endReason must be one of: 'completed', 'timeout', 'cancelled', 'no_answer', 'technical_issue'
      await callService.endCall(callId, {
        endReason: "completed",
        summary:
          priceData.summary || "Price negotiated through chat conversation",
        negotiatedPrice: price,
        agreedToTerms: true,
      });

      setShowPriceModal(false);
      setPriceData({ negotiatedPrice: "", summary: "" });
      alert(
        "Price proposal submitted successfully! Please wait for the guide to confirm."
      );
      onClose();
    } catch (err: unknown) {
      console.error("Failed to submit price:", err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(
        error?.response?.data?.message || "Failed to submit price proposal"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Chat</h3>
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading chat...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {!loading &&
            !error &&
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${
                  msg.sender.user === user?.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender.user === user?.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {msg.sender.role} •{" "}
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="break-words">{msg.message}</div>
                </div>
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t">
          {canFinalizePrice && (
            <button
              onClick={() => setShowPriceModal(true)}
              className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <DollarSign className="w-5 h-5" />
              Finalize Price
            </button>
          )}

          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              maxLength={5000}
              rows={2}
              className="flex-1 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!connected || sending}
            />
            <button
              onClick={handleSend}
              disabled={!connected || !inputMessage.trim() || sending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Price Finalization Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Finalize Price</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Negotiated Price ($)
                </label>
                <input
                  type="number"
                  value={priceData.negotiatedPrice}
                  onChange={(e) =>
                    setPriceData({
                      ...priceData,
                      negotiatedPrice: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Summary (Optional)
                </label>
                <textarea
                  value={priceData.summary}
                  onChange={(e) =>
                    setPriceData({ ...priceData, summary: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  rows={3}
                  placeholder="Brief summary of what was discussed..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPriceModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePriceSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {submitting ? "Submitting..." : "Submit Proposal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 🔗 Integration Points

## 🔗 Integration Points

The chat can be accessed from multiple pages:

### 1. CallPage.tsx (Video Call Page)

```typescript
import { TripChat } from "../components/chat/TripChat";

const CallPage = () => {
  const [showChat, setShowChat] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);

  // ... other code ...

  const chatAvailable =
    trip?.selectedGuide &&
    ["awaiting_call", "in_call", "pending_confirmation"].includes(trip.status);

  return (
    <div>
      {/* Video call UI */}

      {chatAvailable && (
        <button onClick={() => setShowChat(true)}>
          <MessageCircle /> Chat
        </button>
      )}

      {showChat && trip && (
        <TripChat
          trip={trip}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};
```

### 2. GuideDetailPage.tsx (Guide Profile)

### 2. GuideDetailPage.tsx (Guide Profile)

```typescript
import { TripChat } from "../components/chat/TripChat";

const GuideDetailPage = () => {
  const [showChat, setShowChat] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);

  const handleChatFirst = async () => {
    // Select guide if not already selected
    if (!trip?.selectedGuide) {
      await selectGuideMutation.mutateAsync({
        tripId: trip._id,
        guideId: guideId,
      });
      // Refetch trip to get updated data
      await refetch();
    }
    setShowChat(true);
  };

  return (
    <div>
      <button onClick={handleChatFirst}>
        <MessageCircle /> Chat First
      </button>
      <button onClick={handleVideoCall}>
        <Video /> Video Call
      </button>

      {showChat && trip?.selectedGuide && (
        <TripChat
          trip={trip}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};
```

### 3. TripDetailPage.tsx (Trip Details)

```typescript
import { TripChat } from "../components/chat/TripChat";

const TripDetailPage = () => {
  const [showChat, setShowChat] = useState(false);
  const { data: trip } = useQuery(["trips", tripId]);

  const canChat =
    trip?.selectedGuide &&
    ["awaiting_call", "in_call", "pending_confirmation"].includes(trip.status);

  return (
    <div>
      {/* Trip details */}

      {canChat && (
        <button onClick={() => setShowChat(true)}>
          {isTourist ? "Chat with Guide" : "Chat with Tourist"}
        </button>
      )}

      {showChat && trip && (
        <TripChat
          trip={trip}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};
```

---

## 💰 Price Finalization Flow

### How It Works

1. **Tourist negotiates price** via chat messages
2. **Tourist clicks "Finalize Price"** button (only visible in `awaiting_call` status)
3. **System automatically creates call** if no call exists
4. **System ends call** with negotiated price
5. **Trip status changes** to `pending_confirmation`
6. **Guide receives notification** to accept or reject
7. **After guide accepts**, tourist proceeds to payment

### Backend Request Format

```typescript
// Initiate call (automatic if needed)
POST /api/trips/:tripId/calls/initiate
Response: { success: true, callId: "...", token: "..." }

// End call with price
POST /api/calls/:callId/end
Body: {
    endReason: "completed",  // MUST be one of: completed, timeout, cancelled, no_answer, technical_issue
    summary: "Price negotiated through chat conversation",
    negotiatedPrice: 50,
    agreedToTerms: true
}
```

### Valid End Reasons

**IMPORTANT**: The `endReason` field MUST be one of these exact values:

- `"completed"` - Normal completion
- `"timeout"` - Call timed out
- `"cancelled"` - Manually cancelled
- `"no_answer"` - No answer from other party
- `"technical_issue"` - Technical problems

Any other value will result in a 422 Unprocessable Entity error.

---

## 🌐 Environment Variables

## 🌐 Environment Variables

### Vite (`.env`)

```bash
VITE_API_BASE_URL=http://localhost:5001
```

For production:

```bash
VITE_API_BASE_URL=https://your-api-domain.com
```

---

## 🧪 Testing the Chat System

### Manual Testing Checklist

**Prerequisites:**

- Backend running on port 5001
- Frontend running on port 5173
- Tourist account logged in
- Guide account logged in (separate browser)
- Trip created with guide selected

**Test Flow:**

1. **Connection Test**

   - Open chat from any integration point
   - Verify green connection indicator appears
   - Check browser console for `[SocketChat] Connected`

2. **Message Exchange**

   - Tourist sends message
   - Verify guide receives it in real-time
   - Guide replies
   - Verify tourist receives it

3. **Price Finalization (Tourist)**

   - Negotiate price via chat
   - Click "Finalize Price" button
   - Enter price (e.g., 50) and summary
   - Submit
   - Verify success message

4. **Guide Confirmation**

   - Guide sees trip in `pending_confirmation` status
   - Guide clicks Accept
   - Trip moves to `awaiting_payment`

5. **Error Scenarios**
   - Disconnect network → verify reconnection
   - Invalid price (0 or negative) → verify validation
   - Unauthorized access → verify error message

---

## 🐛 Common Issues & Solutions

### Issue: "Not connected to chat server"

**Cause**: Socket connection failed or not established before joining

**Solution**: Wait for connection before joining chat. The component includes a 3-second wait loop:

```typescript
// Wait up to 3 seconds for connection
let attempts = 0;
while (!socketChatService.isConnected() && attempts < 30) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  attempts++;
}
```

### Issue: 422 Error on Price Finalization

**Cause**: Invalid `endReason` value

**Solution**: Use only valid enum values:

```typescript
endReason: "completed"; // ✅ Valid
endReason: "Price agreed via chat"; // ❌ Invalid
```

### Issue: "Cannot read properties of undefined (reading 'callId')"

**Cause**: Response format mismatch

**Solution**: Check response structure:

```typescript
const callResponse = await tripService.initiateCall(trip._id);
const callId = callResponse.callId; // Direct access, not .data.callId
```

### Issue: 429 Too Many Requests

**Cause**: Rate limiting (default: 100 requests per 15 minutes)

**Solution**: Increase rate limit in development:

```javascript
// backend/src/middlewares/rateLimiterMiddleware.js
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Increased for development
  // ...
});
```

### Issue: Messages not appearing in real-time

**Cause**: Message listener not set up or cleaned up prematurely

**Solution**: Use ref to track listener setup:

```typescript
const messageListenersSetup = useRef(false);

if (!messageListenersSetup.current) {
  socketChatService.onNewMessage(handleNewMessage);
  messageListenersSetup.current = true;
}
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Tourist   │ ──1───> │   Frontend   │ <──2──  │    Guide    │
│   Browser   │         │              │         │   Browser   │
└─────────────┘         └──────────────┘         └─────────────┘
                              │    ▲
                         3│    │4
                              ▼    │
                        ┌──────────────┐
                        │   Backend    │
                        │  Socket.io   │
                        └──────────────┘
                              │    ▲
                         5│    │6
                              ▼    │
                        ┌──────────────┐
                        │   MongoDB    │
                        │   Messages   │
                        └──────────────┘

1. Tourist types message
2. Guide receives real-time
3. Message sent via socket
4. Server broadcasts to room
5. Message saved to DB
6. History loaded on connect
```

---

## 🔐 Security Best Practices

### Token Management

```typescript
// ✅ Good - Secure storage
const token = localStorage.getItem("token");
if (!token) {
  setError("Authentication required");
  return;
}

// ❌ Bad - Token in URL
const url = `/chat?token=${token}`; // Don't do this!
```

### Input Validation

```typescript
// ✅ Good - Validate and sanitize
const message = inputMessage.trim();
if (message.length === 0 || message.length > 5000) {
  setError("Invalid message length");
  return;
}

// ❌ Bad - No validation
socketChatService.sendMessage(tripId, inputMessage);
```

### Connection Security

```typescript
// ✅ Good - Authenticated connection
socketChatService.connect(token); // Token in auth header

// ❌ Bad - Token in query
io(url + `?token=${token}`); // Exposed in URL
```

---

## 📱 Mobile (React Native) Considerations

### Connection Setup

```typescript
// Use websocket transport only for mobile
io(SOCKET_URL, {
  auth: { token },
  transports: ["websocket"], // Skip polling on mobile
  jsonp: false,
});
```

### Background Handling

```typescript
import { AppState } from "react-native";

useEffect(() => {
  const subscription = AppState.addEventListener("change", (nextAppState) => {
    if (nextAppState === "background") {
      socketChatService.disconnect();
    } else if (nextAppState === "active") {
      socketChatService.connect(token);
    }
  });

  return () => subscription.remove();
}, []);
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "socket.io-client": "^4.7.2",
    "lucide-react": "^0.555.0",
    "react": "^19.2.0"
  },
  "devDependencies": {
    "typescript": "^5.5.3",
    "@types/react": "^18.3.3"
  }
}
```

---

## 📚 Related Documentation

- [CHAT_SYSTEM_DOCUMENTATION.md](CHAT_SYSTEM_DOCUMENTATION.md) - Backend architecture
- [CHAT_TESTING_GUIDE.md](CHAT_TESTING_GUIDE.md) - Comprehensive testing guide
- [CHAT_PRICE_FINALIZATION.md](CHAT_PRICE_FINALIZATION.md) - Price negotiation feature

---

## ⚠️ Important Notes

### Authentication

- JWT token required for all operations
- Token must not be expired
- User must be tourist or guide (not admin)

### Access Control

- Only trip participants can access chat
- Guide must be selected before chat available
- Chat not available for draft/cancelled trips

### Trip Status Requirements

- Chat available in: `awaiting_call`, `in_call`, `pending_confirmation`
- Price finalization only for tourists in `awaiting_call` status

### Performance

- Messages auto-scroll to bottom
- Connection wait loop prevents race conditions
- Cleanup on component unmount prevents memory leaks

### Error Handling

- Always handle socket errors
- Show user-friendly error messages
- Implement reconnection logic

---

## 📞 Support

For integration issues:

1. Check [CHAT_SYSTEM_DOCUMENTATION.md](CHAT_SYSTEM_DOCUMENTATION.md)
2. Review backend console logs
3. Check browser console for errors
4. Verify JWT token validity

---

**Happy Coding! 🚀**

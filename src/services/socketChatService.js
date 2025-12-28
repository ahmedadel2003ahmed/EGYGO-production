/**
 * Socket.io Chat Service - Real-time messaging
 */
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://egygo-backend-production.up.railway.app";

class SocketChatService {
  constructor() {
    this.socket = null;
  }

  /**
   * Connect to chat server with JWT token
   */
  connect(token) {
    if (this.socket?.connected) {
      console.log("[SocketChat] Already connected");
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["polling", "websocket"], // Try polling first, then upgrade to websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: true,
    });

    this.setupListeners();
  }

  /**
   * Setup base event listeners
   */
  setupListeners() {
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
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Join a trip chat room
   */
  joinChat(tripId, onSuccess, onError) {
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
  sendMessage(tripId, message, onError) {
    if (!this.socket?.connected) {
      onError?.("Not connected to chat server");
      return;
    }

    if (!message?.trim()) {
      onError?.("Message cannot be empty");
      return;
    }

    this.socket.emit("send_message", { tripId, message: message.trim() });

    const errorHandler = (error) => {
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
  onNewMessage(callback) {
    if (!this.socket) return;
    this.socket.on("new_message", callback);
  }

  /**
   * Remove new message listener
   */
  offNewMessage(callback) {
    if (!this.socket) return;
    this.socket.off("new_message", callback);
  }

  /**
   * Leave chat room
   */
  leaveChat(tripId) {
    if (!this.socket?.connected) return;
    this.socket.emit("leave_trip_chat", { tripId });
  }

  /**
   * Disconnect from chat server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export singleton instance
export const socketChatService = new SocketChatService();

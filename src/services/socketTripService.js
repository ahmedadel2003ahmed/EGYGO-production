/**
 * Socket.IO Trip Status Service - Real-time trip status updates
 * 
 * This service handles real-time trip status updates from the backend.
 * It connects to the Socket.IO server and listens for trip status changes.
 * 
 * IMPORTANT: This is Frontend ONLY - Backend is READ-ONLY reference
 */
import { io } from "socket.io-client";

// Backend runs on port 5000 for both REST API and Socket.IO
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

class SocketTripService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.joinedRooms = new Set(); // Track joined trip rooms
  }

  /**
   * Connect to Socket.IO server with JWT token
   * @param {string} token - JWT authentication token
   */
  connect(token) {
    if (this.socket && this.connected) {
      console.log("[SocketTrip] Already connected");
      return;
    }

    if (!token) {
      console.warn("[SocketTrip] No token provided, cannot connect");
      return;
    }

    console.log("[SocketTrip] Connecting to:", SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ["polling", "websocket"], // Try polling first, then upgrade to websocket
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
    });

    this.setupListeners();
  }

  /**
   * Setup base event listeners for connection management
   */
  setupListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.connected = true;
      console.log("✅ [SocketTrip] Connected:", this.socket.id);
      console.log("[SocketTrip] Socket URL:", SOCKET_URL);
      console.log("[SocketTrip] Transport:", this.socket.io.engine.transport.name);
      
      // Rejoin all previously joined rooms on reconnect
      this.joinedRooms.forEach((tripId) => {
        console.log(`[SocketTrip] Rejoining trip room: ${tripId}`);
        this.socket.emit("join_trip_room", { tripId });
      });
    });

    this.socket.on("disconnect", (reason) => {
      this.connected = false;
      console.log("❌ [SocketTrip] Disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("[SocketTrip] Connection error:", error.message);
      console.error("[SocketTrip] Error details:", {
        type: error.type,
        description: error.description,
        context: error.context,
        url: SOCKET_URL,
      });
      
      // Don't throw error, just log it - socket will retry automatically
      if (error.message === "websocket error") {
        console.warn("[SocketTrip] WebSocket connection failed, will try polling...");
      }
    });

    this.socket.on("error", (error) => {
      console.error("[SocketTrip] Socket error:", error);
    });

    // Add listener for trip_status_updated to debug if events are being received
    this.socket.on("trip_status_updated", (payload) => {
      console.log("🔔 [SocketTrip] RAW trip_status_updated event received:", payload);
    });

    // Listen for trip room confirmation events for debugging
    this.socket.on("trip_room_joined", (data) => {
      console.log("🚪 [SocketTrip] Room joined confirmation:", data);
    });

    this.socket.on("trip_room_left", (data) => {
      console.log("🚪 [SocketTrip] Room left confirmation:", data);
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.joinedRooms.clear();
      console.log("[SocketTrip] Disconnected manually");
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  /**
   * Join a trip room to receive real-time updates
   * @param {string} tripId - Trip ID to monitor
   */
  joinTripRoom(tripId) {
    if (!this.socket || !this.connected) {
      console.warn("[SocketTrip] Socket not connected. Cannot join trip room:", {
        hasSocket: !!this.socket,
        connected: this.connected,
        tripId
      });
      return;
    }

    if (!tripId) {
      console.warn("[SocketTrip] No tripId provided");
      return;
    }

    console.log(`[SocketTrip] Emitting join_trip_room for trip: ${tripId}`);
    this.socket.emit("join_trip_room", { tripId });
    this.joinedRooms.add(tripId);
    console.log(`[SocketTrip] Joined rooms:`, Array.from(this.joinedRooms));
  }

  /**
   * Leave a trip room
   * @param {string} tripId - Trip ID to stop monitoring
   */
  leaveTripRoom(tripId) {
    if (!this.socket || !this.connected) {
      return;
    }

    if (!tripId) {
      return;
    }

    this.socket.emit("leave_trip_room", { tripId });
    this.joinedRooms.delete(tripId);
    console.log(`📍 [SocketTrip] Left trip room: ${tripId}`);
  }

  /**
   * Listen for trip status updates
   * Event: 'trip_status_updated'
   * Payload: { tripId, status, timestamp, paymentStatus?, confirmedAt?, cancelledAt?, cancelledBy? }
   * 
   * @param {Function} callback - Function to call when status updates
   */
  onTripStatusUpdate(callback) {
    if (!this.socket) {
      console.warn("[SocketTrip] Socket not initialized");
      return;
    }

    this.socket.on("trip_status_updated", callback);
    console.log("[SocketTrip] Registered trip_status_updated listener");
  }

  /**
   * Remove trip status update listener
   * @param {Function} callback - The callback to remove
   */
  offTripStatusUpdate(callback) {
    if (!this.socket) {
      return;
    }

    this.socket.off("trip_status_updated", callback);
    console.log("[SocketTrip] Removed trip_status_updated listener");
  }

  /**
   * Listen for room join confirmation
   * Event: 'trip_room_joined'
   * @param {Function} callback - Function to call when joined
   */
  onTripRoomJoined(callback) {
    if (!this.socket) {
      return;
    }

    this.socket.on("trip_room_joined", callback);
  }

  /**
   * Remove room join listener
   * @param {Function} callback - The callback to remove
   */
  offTripRoomJoined(callback) {
    if (!this.socket) {
      return;
    }

    this.socket.off("trip_room_joined", callback);
  }

  /**
   * Listen for room leave confirmation
   * Event: 'trip_room_left'
   * @param {Function} callback - Function to call when left
   */
  onTripRoomLeft(callback) {
    if (!this.socket) {
      return;
    }

    this.socket.on("trip_room_left", callback);
  }

  /**
   * Remove room leave listener
   * @param {Function} callback - The callback to remove
   */
  offTripRoomLeft(callback) {
    if (!this.socket) {
      return;
    }

    this.socket.off("trip_room_left", callback);
  }

  /**
   * Get list of currently joined trip rooms
   * @returns {string[]}
   */
  getJoinedRooms() {
    return Array.from(this.joinedRooms);
  }
}

// Export singleton instance
const socketTripService = new SocketTripService();
export default socketTripService;

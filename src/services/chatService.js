/**
 * Chat Service - REST API for message history and access validation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const chatService = {
  /**
   * Get chat message history for a trip
   */
  getMessages: async (tripId, limit = 100, skip = 0) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${API_BASE_URL}/chat/${tripId}/messages?limit=${limit}&skip=${skip}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // If endpoint doesn't exist, return empty messages
      if (response.status === 404) {
        return { success: true, data: { messages: [] } };
      }
      throw new Error("Failed to fetch messages");
    }

    return await response.json();
  },

  /**
   * Check if current user can access chat for a trip
   */
  checkAccess: async (tripId) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE_URL}/chat/${tripId}/access`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to check chat access");
    }

    return await response.json();
  },
};

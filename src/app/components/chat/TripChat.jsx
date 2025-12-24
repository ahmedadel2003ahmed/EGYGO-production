"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { chatService } from "../../../services/chatService";
import { socketChatService } from "../../../services/socketChatService";
import { useAuth } from "../../context/AuthContext";
import styles from "./TripChat.module.css";

export default function TripChat({ tripId, guideName, onClose, isOpen }) {
  const authContext = useAuth();
  const user = authContext?.user || null;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const hasJoinedRef = useRef(false);
  const messageListenersSetup = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize chat
  useEffect(() => {
    if (!isOpen || !tripId) {
      // Clear loading state when chat is closed
      setLoading(true);
      return;
    }

    const initChat = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        // Load message history (skip access check - already validated by trip lookup)
        try {
          const historyResult = await chatService.getMessages(tripId);
          if (historyResult.success) {
            setMessages(historyResult.data.messages || []);
          }
        } catch (historyErr) {
          console.warn('Could not load message history:', historyErr);
          // Continue anyway - allow new messages even if history fails
          setMessages([]);
        }

        // Connect to socket
        socketChatService.connect(token);

        // Wait for connection before joining
        let attempts = 0;
        while (!socketChatService.isConnected() && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        if (!socketChatService.isConnected()) {
          setError("Chat server is not available. Please ensure the backend Socket.IO server is running on port 5000.");
          setLoading(false);
          return;
        }

        // Join chat room
        if (!hasJoinedRef.current) {
          socketChatService.joinChat(
            tripId,
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
          const handleNewMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
          };
          socketChatService.onNewMessage(handleNewMessage);
          messageListenersSetup.current = true;
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initChat();

    // Cleanup on unmount or when tripId changes
    return () => {
      // Only cleanup when component unmounts or tripId changes, not when chat just closes
      socketChatService.leaveChat(tripId);
      hasJoinedRef.current = false;
      messageListenersSetup.current = false;
    };
  }, [tripId, isOpen]); // Depend on both tripId and isOpen

  // Send message
  const handleSend = useCallback(() => {
    if (!inputMessage.trim() || !connected || sending) return;

    setSending(true);
    socketChatService.sendMessage(tripId, inputMessage.trim(), (err) => {
      setError(err);
      setSending(false);
    });

    setInputMessage("");
    setSending(false);
  }, [inputMessage, connected, sending, tripId]);

  // Handle Enter key
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.chatContainer}>
        {/* Header - WhatsApp Style */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className={styles.avatar}>
              {guideName?.charAt(0).toUpperCase() || "G"}
            </div>
            <div className={styles.headerInfo}>
              <h3 className={styles.headerTitle}>{guideName || "Guide"}</h3>
              <span
                className={`${styles.status} ${
                  connected ? styles.online : styles.offline
                }`}
              >
                {connected ? "Online" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>

        {/* Messages Area - WhatsApp Style */}
        <div className={styles.messagesArea}>
          {loading && (
            <div className={styles.centerMessage}>
              <div className={styles.loader}></div>
              <span>Loading chat...</span>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <span>⚠️ {error}</span>
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className={styles.centerMessage}>
              <div className={styles.emptyChat}>
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="35" stroke="#E5E7EB" strokeWidth="2" />
                  <path
                    d="M30 35L40 45L50 35"
                    stroke="#9CA3AF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <p>Start a conversation with your guide</p>
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            messages.map((msg) => {
              const isMyMessage = msg.sender.user === user?.id;
              return (
                <div
                  key={msg._id}
                  className={`${styles.messageWrapper} ${
                    isMyMessage ? styles.myMessage : styles.otherMessage
                  }`}
                >
                  <div className={styles.messageBubble}>
                    <div className={styles.messageContent}>{msg.message}</div>
                    <div className={styles.messageTime}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - WhatsApp Style */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              maxLength={5000}
              className={styles.input}
              disabled={!connected || sending}
            />
            <button
              onClick={handleSend}
              disabled={!connected || !inputMessage.trim() || sending}
              className={styles.sendButton}
            >
              {sending ? (
                <div className={styles.miniLoader}></div>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2L15 22L11 13M22 2L2 8L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

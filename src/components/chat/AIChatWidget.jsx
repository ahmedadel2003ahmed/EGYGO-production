"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './AIChatWidget.module.css';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

export default function AIChatWidget() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    // Initial message
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            text: "Hello! I'm LocalGuide AI. I can help you plan your trip, find hotels, or suggest places to visit in Egypt. How can I help you today?", 
            sender: 'bot', 
            type: 'text' 
        }
    ]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        // 1. Add user message
        const newUserMessage = {
            id: Date.now(),
            text: inputText,
            sender: 'user',
            type: 'text'
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputText("");
        setIsTyping(true);

        try {
            // 2. Prepare history for API
            // Map internal state to API format: role 'user'|'model', content string
            const history = messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                content: msg.text || '' 
            }));

            // 3. Call API
            const response = await axios.post('/api/chat', {
                message: newUserMessage.text,
                history: history
            });

            if (response.data && response.data.success) {
                const { reply, data, source } = response.data;

                // 4. Add Bot Response
                const newBotMessage = {
                    id: Date.now() + 1,
                    sender: 'bot',
                    text: reply || "I'm sorry, I couldn't process that.",
                    places: Array.isArray(data) ? data : [],
                    source: source // 'gemini' or 'database'
                };

                setMessages(prev => [...prev, newBotMessage]);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Chat Error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "Sorry, something went wrong. Please try again later.",
                sender: 'bot',
                isError: true,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handlePlaceClick = (placeId) => {
        // setIsOpen(false); // Optional: keep chat open or close it
        router.push(`/place/${placeId}`);
    };

    return (
        <>
            {/* Widget Container (Chat Window) */}
            <div className={styles.container} style={{ pointerEvents: isOpen ? 'auto' : 'none' }}>
                <div className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerInfo}>
                            <div className={styles.avatar}>
                                <Image
                                    src="/images/chatbot_icon.png"
                                    alt="Nefertiti"
                                    width={45}
                                    height={45}
                                />
                            </div>
                            <div className={styles.titles}>
                                <span className={styles.name}>Nefertiti AI</span>
                                <span className={styles.status}>Online</span>
                            </div>
                        </div>
                        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 1L1 13M1 1L13 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className={styles.messagesContainer}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`${styles.message} ${msg.sender === 'user' ? styles.sent : styles.received} ${msg.isError ? styles.error : ''}`}
                                dir="auto"
                            >
                                {/* Text Content with Markdown */}
                                {msg.text && (
                                    <div className="markdown-content">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                )}

                                {/* Places Carousel */}
                                {msg.places && msg.places.length > 0 && (
                                    <div className={styles.placesContainer}>
                                        {msg.places.map((place, idx) => (
                                            <div key={place.id || idx} className={styles.placeCard}>
                                                {/* Image */}
                                                <div className={styles.cardImageContainer}>
                                                     {place.images && place.images.length > 0 ? (
                                                        <Image 
                                                            src={place.images[0]} 
                                                            alt={place.name}
                                                            fill
                                                            sizes="240px"
                                                            className={styles.cardImage}
                                                        />
                                                     ) : (
                                                        <div style={{width:'100%', height:'100%', background:'#374151', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:'2rem'}}>
                                                            📷
                                                        </div>
                                                     )}
                                                </div>

                                                {/* Content */}
                                                <div className={styles.placeContent}>
                                                    <div className={styles.placeHeader}>
                                                        <h4 className={styles.placeName}>{place.name}</h4>
                                                    </div>

                                                    {place.rating && (
                                                        <div style={{color: '#fbbf24', fontSize: '0.8rem', marginBottom: '4px'}}>
                                                            {'★'.repeat(Math.round(place.rating))} <span style={{color:'#9ca3af'}}>({place.rating})</span>
                                                        </div>
                                                    )}

                                                    <p className={styles.placeDescription}>
                                                        {place.description || "View details to see more about this place."}
                                                    </p>

                                                    <button
                                                        className={styles.viewBtn}
                                                        onClick={() => handlePlaceClick(place.id || place._id)}
                                                    >
                                                        Details
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className={`${styles.message} ${styles.received}`}>
                                <span className={styles.typingDot}>.</span>
                                <span className={styles.typingDot}>.</span>
                                <span className={styles.typingDot}>.</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className={styles.inputArea}>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Ask Nefertiti..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isTyping}
                            />
                            <button
                                className={styles.sendBtn}
                                onClick={handleSendMessage}
                                disabled={!inputText.trim() || isTyping}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Toggle Button */}
            <div className={styles.floatingBtnWrapper}>
                <button
                    className={`${styles.floatingBtn} ${isOpen ? styles.opened : styles.closed}`}
                    onClick={toggleChat}
                    aria-label="Toggle Chat"
                >
                    {isOpen ? (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <Image
                                src="/images/chatbot_icon.png"
                                alt="Chat"
                                fill
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                    )}
                </button>
            </div>
        </>
    );
}

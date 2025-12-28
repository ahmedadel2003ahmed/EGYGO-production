"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './AIChatWidget.module.css';
import axios from 'axios';

import { useRouter } from 'next/navigation';

export default function AIChatWidget() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "مرحباً! أنا نفرتيتي، مرشدتك السياحية الذكية. كيف يمكنني مساعدتك في رحلتك اليوم؟", sender: 'bot', type: 'text' }
    ]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

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
            const response = await axios.post('http://localhost:5000/api/chat', {
                message: newUserMessage.text
            });

            if (response.data && response.data.success) {
                const { type, content, reply } = response.data;

                let newBotMessage = {
                    id: Date.now() + 1,
                    sender: 'bot',
                };

                if (type === 'places' && Array.isArray(content)) {
                    newBotMessage.type = 'places';
                    newBotMessage.places = content;
                    // Optional: Add a text intro if needed, or just render cards
                    newBotMessage.text = "وجدنا لك هذه الأماكن المميزة:";
                } else {
                    newBotMessage.type = 'text';
                    // Fallback to 'reply' or 'content' if it's a string
                    newBotMessage.text = reply || (typeof content === 'string' ? content : "عذراً، لم أستطع فهم الرد.");
                }

                setMessages(prev => [...prev, newBotMessage]);
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            console.error('Chat Error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: error.message === 'Network Error'
                    ? "يبدو أن هناك مشكلة في الاتصال بالخادم. تأكد من تشغيل الباك إند."
                    : "عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
                sender: 'bot',
                isError: true,
                type: 'text'
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
        setIsOpen(false); // Close chat to view page
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
                                <span className={styles.name}>Nefertiti</span>
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
                                style={msg.type === 'places' ? { background: 'transparent', padding: 0 } : {}}
                            >
                                {msg.type === 'text' && msg.text}

                                {msg.type === 'places' && (
                                    <div className={styles.placesContainer}>
                                        {msg.text && <div style={{ color: '#fff', marginBottom: '8px', padding: '0 4px' }}>{msg.text}</div>}
                                        {msg.places.map((place, idx) => (
                                            <div key={idx} className={styles.placeCard}>
                                                <div className={styles.placeContent}>
                                                    <div className={styles.placeHeader}>
                                                        <h4 className={styles.placeName}>{place.name}</h4>
                                                        {place.category && <span className={styles.placeCategory}>{place.category}</span>}
                                                    </div>

                                                    {place.province && (
                                                        <div className={styles.provinceBadge}>
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                                <circle cx="12" cy="10" r="3"></circle>
                                                            </svg>
                                                            {place.province}
                                                        </div>
                                                    )}

                                                    <p className={styles.placeDescription}>
                                                        {place.description || "استمتع بزيارة هذا المكان الرائع وتعرف على تاريخه."}
                                                    </p>

                                                    <button
                                                        className={styles.viewBtn}
                                                        onClick={() => handlePlaceClick(place._id || place.id)}
                                                    >
                                                        عرض التفاصيل
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
                                placeholder="Chat Place holder"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                dir="auto"
                            />
                            <button
                                className={styles.sendBtn}
                                onClick={handleSendMessage}
                                disabled={!inputText.trim()}
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
                        // X Icon
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

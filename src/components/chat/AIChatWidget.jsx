"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './AIChatWidget.module.css';
import axios from 'axios';

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "مرحباً! أنا نفرتيتي، مرشدتك السياحية الذكية. كيف يمكنني مساعدتك في رحلتك اليوم؟", sender: 'bot' }
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
            sender: 'user'
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputText("");
        setIsTyping(true);

        try {
            const response = await axios.post('http://localhost:5000/api/chat', {
                message: newUserMessage.text
            });

            if (response.data && response.data.success) {
                let botText = "";

                // Case 1: Backend returns a direct AI text reply
                if (response.data.reply) {
                    botText = response.data.reply;
                }
                // Case 2: Backend returns raw content (places/hotels) but no AI text
                // We format this data on the client side to simulate the AI response
                else if (response.data.content && Array.isArray(response.data.content)) {
                    if (response.data.content.length > 0) {
                        botText = "وجدنا لك هذه الأماكن المميزة:\n\n";
                        response.data.content.forEach(item => {
                            // Try to get Arabic name/desc if available, otherwise English
                            const name = item.name;
                            botText += `🔹 **${name}**\n`;
                        });
                        botText += "\nهل تود معرفة تفاصيل أكثر عن أي منها؟";
                    } else {
                        botText = "عذراً، لم أجد معلومات دقيقة حول طلبك في قاعدتي البيانات. هل يمكنك التوضيح أكثر؟";
                    }
                } else {
                    botText = "عذراً، لم أستطع فهم الرد. يرجى المحاولة مرة أخرى.";
                }

                const newBotMessage = {
                    id: Date.now() + 1,
                    text: botText,
                    sender: 'bot'
                };
                setMessages(prev => [...prev, newBotMessage]);
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            console.error('Chat Error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                // Customized error for connection refused vs other errors
                text: error.message === 'Network Error'
                    ? "يبدو أن هناك مشكلة في الاتصال بالخادم. تأكد من تشغيل الباك إند."
                    : "عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
                sender: 'bot',
                isError: true
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
                            >
                                {msg.text}
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
                        <div style={{ width: '35px', height: '35px', position: 'relative' }}>
                            <Image
                                src="/images/chatbot_icon.png"
                                alt="Chat"
                                fill
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                    )}
                </button>
            </div>
        </>
    );
}

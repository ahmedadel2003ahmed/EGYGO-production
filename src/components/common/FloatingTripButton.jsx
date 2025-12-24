"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './FloatingTripButton.module.css';

export default function FloatingTripButton({ onClick }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            className={styles.floatingBtn}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="Start your trip"
        >
            <div className={styles.iconContainer}>
                <Image
                    src="/images/chatbot_icon.png"
                    alt="Start Trip"
                    width={60}
                    height={60}
                    className={styles.icon}
                    priority
                />
            </div>
            <span className={styles.text}>
                Start your trip
            </span>
        </button>
    );
}

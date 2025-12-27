"use client";

import React, { useState } from 'react';
import { FaPlane } from 'react-icons/fa';
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
                <FaPlane size={24} color="#053147" />
            </div>
            <span className={styles.text}>
                Start your trip
            </span>
        </button>
    );
}

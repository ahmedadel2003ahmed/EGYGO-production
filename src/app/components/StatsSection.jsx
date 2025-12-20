"use client";

import React, { useEffect, useState, useRef } from 'react';
import styles from './StatsSection.module.css';

const StatCard = ({ number, label, suffix = '+' }) => {
    const [count, setCount] = useState(0);
    const cardRef = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;

                    let startTime;
                    const duration = 2000; // 2 seconds animation
                    const endValue = number;

                    const animate = (currentTime) => {
                        if (!startTime) startTime = currentTime;
                        const progress = currentTime - startTime;

                        // Ease out quart
                        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

                        const timeFraction = Math.min(progress / duration, 1);
                        const value = Math.floor(easeOutQuart(timeFraction) * endValue);

                        setCount(value);

                        if (progress < duration) {
                            requestAnimationFrame(animate);
                        } else {
                            setCount(endValue);
                        }
                    };

                    requestAnimationFrame(animate);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [number]);

    return (
        <div className={styles.card} ref={cardRef}>
            <div className={styles.number}>{count}{suffix}</div>
            <div className={styles.label}>{label}</div>
        </div>
    );
};

const StatsSection = () => {
    const stats = [
        { number: 23, label: 'Attractions' },
        { number: 14, label: 'Articles' },
        { number: 17, label: 'Hotels' },
        { number: 40, label: 'Restaurants' },
        { number: 23, label: 'Services' },
    ];

    return (
        <section className={styles.container}>
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </section>
    );
};

export default StatsSection;

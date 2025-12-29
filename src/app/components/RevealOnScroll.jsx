"use client";

import React, { useEffect, useRef, useState } from 'react';
import styles from './RevealOnScroll.module.css';

const RevealOnScroll = ({ children, delay = 0, className = "" }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Trigger when 10% of the element is visible
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target); // Performance: Stop observing once visible
                }
            },
            {
                threshold: 0.1,
                rootMargin: "0px 0px -50px 0px" // Trigger slightly before it's fully in view
            }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.disconnect();
            }
        };
    }, []);

    const style = delay ? { transitionDelay: `${delay}ms` } : {};

    return (
        <div
            ref={ref}
            className={`${styles.revealContainer} ${isVisible ? styles.isVisible : ''} ${className}`}
            style={style}
        >
            {children}
        </div>
    );
};

export default RevealOnScroll;

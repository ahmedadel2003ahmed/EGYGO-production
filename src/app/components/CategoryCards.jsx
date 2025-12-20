"use client";

import React from 'react';
import styles from './CategoryCards.module.css';
import { FaMapMarkerAlt, FaBed, FaUtensils, FaCalendarAlt } from 'react-icons/fa';

const categories = [
    {
        id: 1,
        icon: <FaMapMarkerAlt />,
        title: 'Attractions',
        subtitle: 'Discover Ancient Sites'
    },
    {
        id: 2,
        icon: <FaBed />,
        title: 'Hotels',
        subtitle: 'Find Accommodation'
    },
    {
        id: 3,
        icon: <FaUtensils />,
        title: 'Restaurants',
        subtitle: 'Taste Local Cuisine'
    },
    {
        id: 4,
        icon: <FaCalendarAlt />,
        title: 'Events',
        subtitle: 'Cultural Experiences'
    }
];

const CategoryCards = () => {
    return (
        <div className={styles.sectionWrapper}>
            <div className={styles.whiteSheet}>
                <div className="container">
                    <div className={styles.grid}>
                        {categories.map((cat) => (
                            <div key={cat.id} className={styles.card}>
                                <div className={styles.iconCircle}>
                                    {cat.icon}
                                </div>
                                <h3 className={styles.title}>{cat.title}</h3>
                                <p className={styles.subtitle}>{cat.subtitle}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryCards;

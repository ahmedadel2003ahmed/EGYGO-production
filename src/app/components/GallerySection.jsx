"use client";

import React from 'react';
import Image from 'next/image';
import styles from './GallerySection.module.css';

const galleryItems = [
    {
        id: 1,
        src: '/images/1.svg',
        alt: 'Khan El Khalili Bazaar',
        areaClass: styles['item-one'],
        caption: 'Vibrant Bazaars'
    },
    {
        id: 2,
        src: '/images/destination/CitadelofSaladin.jpeg',
        alt: 'Red Sea Diving',
        areaClass: styles['item-two'],
        caption: 'Deep Blue Sea'
    },
    {
        id: 3,
        src: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
        alt: 'Great Sphinx',
        areaClass: styles['item-three'],
        caption: 'Ancient Guardians'
    },
    {
        id: 4,
        src: '/images/AdventureActivities.jpeg',
        alt: 'Pyramids of Giza',
        areaClass: styles['item-four'],
        caption: 'Timeless Wonders'
    },
    {
        id: 5,
        src: '/images/2.svg',
        alt: 'Desert Safari',
        areaClass: styles['item-five'],
        caption: 'Golden Sands'
    },
    {
        id: 6,
        src: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=800&q=80',
        alt: 'Luxor Temple',
        areaClass: styles['item-six'],
        caption: 'Sacred Temples'
    },
    {
        id: 7,
        src: '/images/destination/KhanelKhaliliBazaar.jpeg',
        alt: 'Nile River',
        areaClass: styles['item-seven'],
        caption: 'The Lifeblood'
    }
];

const GallerySection = () => {
    return (
        <section className={styles.section}>
            <div className="container">
                <h2 className={styles.title}>
                    Visual <span>Journey</span>
                </h2>
                <div className={styles.galleryGrid}>
                    {galleryItems.map((item) => (
                        <div
                            key={item.id}
                            className={`${styles.galleryItem} ${item.areaClass}`}
                        >
                            <Image
                                src={item.src}
                                alt={item.alt}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className={styles.image}
                            />
                            <div className={styles.overlay}>
                                <span className={styles.caption}>{item.caption}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GallerySection;

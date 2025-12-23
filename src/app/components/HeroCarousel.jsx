"use client";

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import styles from './HeroCarousel.module.css';

const slides = [
    {
        id: 1,
        image: '/images/destination/Giza.jpeg',
        title: 'DISCOVER',
        subtitle: 'THE PYRAMIDS',
        desc: 'Witness the wonders of the ancient world in Giza'
    },
    {
        id: 2,
        image: '/images/destination/luxor.jpeg',
        title: 'EXPERIENCE',
        subtitle: 'ANCIENT THEBES',
        desc: 'Walk through history in the open-air museum of Luxor'
    },
    {
        id: 3,
        image: '/images/destination/sharm.jpeg',
        title: 'RELAX',
        subtitle: 'BY THE RED SEA',
        desc: 'Dive into the crystal clear waters of Sharm El Sheikh'
    },
    {
        id: 4,
        image: '/images/destination/siwa.jpeg',
        title: 'ADVENTURE',
        subtitle: 'IN SIWA OASIS',
        desc: 'Escape to the serene beauty of the Western Desert'
    },
    {
        id: 5,
        image: '/images/destination/alex.jpeg',
        title: 'EXPLORE',
        subtitle: 'THE MEDITERRANEAN BRIDE',
        desc: 'Enjoy the classic charm of Alexandria'
    }
];

const HeroCarousel = ({ onExploreClick }) => {
    return (
        <div className={styles.heroSection}>
            <Swiper
                modules={[Autoplay, EffectFade, Pagination]}
                effect="fade"
                speed={1000}
                loop={true}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                pagination={{ clickable: true }}
                className={styles.swiper}
            >
                {slides.map((slide) => (
                    <SwiperSlide key={slide.id} className={styles.slide}>
                        <Image
                            src={slide.image}
                            alt={`${slide.title} ${slide.subtitle}`}
                            fill
                            priority={slide.id === 1}
                            className={styles.slideImage}
                        />
                        {/* Dark Overlay */}
                        <div className={styles.overlay}></div>

                        {/* Text Content */}
                        <div className={`container ${styles.contentContainer}`}>
                            <div className={styles.content}>
                                <div className={styles.title}>{slide.title}</div>
                                <div className={styles.subtitle}>{slide.subtitle}</div>
                                <p className={styles.description}>{slide.desc}</p>
                                <button
                                    className={`btn ${styles.exploreBtn}`}
                                    onClick={onExploreClick}
                                >
                                    Explore More
                                </button>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default HeroCarousel;

"use client";

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import styles from './HeroCarousel.module.css';

const slides = [
    {
        id: 1,
        image: '/images/banner.png',
        title: 'EXPLORE',
        subtitle: 'THE MOUNTAIN',
        desc: 'Live your dream and explore'
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1600&q=80',
        title: 'DISCOVER',
        subtitle: 'THE PYRAMIDS',
        desc: 'Witness the wonders of the ancient world'
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1528659587786-e24c2543e3f3?auto=format&fit=crop&w=1600&q=80',
        title: 'EXPERIENCE',
        subtitle: 'THE NILE',
        desc: 'Sail through the heart of Egypt'
    }
];

const HeroCarousel = ({ onExploreClick }) => {
    return (
        <div className={styles.heroSection}>
            <Swiper
                modules={[Autoplay, EffectFade, Navigation, Pagination]}
                effect="fade"
                speed={1000}
                loop={true}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                navigation={true}
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

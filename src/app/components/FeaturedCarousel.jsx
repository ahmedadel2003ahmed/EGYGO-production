"use client";

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { FaStar, FaHeart } from 'react-icons/fa';
import { useSuspenseQuery } from '@tanstack/react-query';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import styles from './FeaturedCarousel.module.css';

const FeaturedCarousel = () => {
    // Suspense Query triggers the nearest Suspense boundary (loading.jsx)
    const { data: attractions } = useSuspenseQuery({
        queryKey: ['featured-attractions'],
        queryFn: async () => {
            // Use absolute URL for server-side fetching compatibility
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://egygo-backend-production.up.railway.app';
            const response = await fetch(`${baseUrl}/api/provinces/giza`);
            const contentType = response.headers.get("content-type");
            if (!response.ok || !contentType || !contentType.includes("application/json")) {
                throw new Error('Failed to fetch data or invalid response format');
            }

            const result = await response.json();
            const sites = result.data?.sections?.archaeological || [];

            // Take the first 5 items
            return sites.slice(0, 5).map(item => ({
                id: item._id,
                title: item.name || item.title || 'Unknown Site',
                description: item.shortDescription || item.description || 'No description available.',
                image: Array.isArray(item.images) ? item.images[0] : (item.image || '/images/destination/placeholder.jpg'),
                rating: item.rating || 4.5,
                tag: 'Archaeological Site',
                price: item.ticketPrice ? `${item.ticketPrice} $` : 'Free'
            }));
        },
        // Inherits global cache settings (Infinity)
    });

    if (!attractions || attractions.length === 0) {
        return null;
    }

    return (
        <section className={styles.section} id="featured">
            <div className="container">
                <h2 className={styles.title}>Featured Attractions</h2>

                <div className={styles.swiperContainer}>
                    <Swiper
                        modules={[Navigation, Pagination, EffectCoverflow]}
                        effect={'coverflow'}
                        grabCursor={true}
                        centeredSlides={true}
                        slidesPerView={'auto'}
                        coverflowEffect={{
                            rotate: 50,
                            stretch: 0,
                            depth: 100,
                            modifier: 1,
                            slideShadows: true,
                        }}
                        navigation
                        pagination={{ clickable: true }}
                        loop={true}
                    >
                        {attractions.map((item) => (
                            <SwiperSlide key={item.id} className={styles.slide}>
                                {/* Image Section */}
                                <div className={styles.imageWrapper}>
                                    <div className={styles.ratingBadge}>
                                        <FaStar /> {item.rating}
                                    </div>
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className={styles.image}
                                        // Add error handling for images if using external URLs
                                        onError={(e) => { e.target.src = '/images/destination/placeholder.jpg'; }}
                                    />
                                </div>

                                {/* Content Section */}
                                <div className={styles.content}>
                                    <h3 className={styles.cardTitle}>{item.title}</h3>
                                    <p className={styles.description}>
                                        {item.description.length > 100
                                            ? `${item.description.substring(0, 100)}...`
                                            : item.description}
                                    </p>

                                    <div className={styles.cardFooter}>
                                        <span className={styles.tag}>{item.tag}</span>
                                        <span className={styles.price}>{item.price}</span>
                                    </div>

                                    <div className={styles.actionRow}>
                                        <Link href={`/place/${item.id}`} className={styles.learnMoreBtn}>
                                            Learn More
                                        </Link>
                                        <button className={styles.heartBtn} aria-label="Add to favorites">
                                            <FaHeart />
                                        </button>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    );
};

export default FeaturedCarousel;

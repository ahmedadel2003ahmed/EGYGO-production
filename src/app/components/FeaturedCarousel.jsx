"use client";

import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { FaStar, FaHeart } from 'react-icons/fa';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import styles from './FeaturedCarousel.module.css';

const FeaturedCarousel = () => {
    const [attractions, setAttractions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Use the proxied API route or direct backend URL
                // The user originally tried localhost:3000/Governorate/giza which failed (HTML).
                // The correct data endpoint is /api/provinces/giza (proxied to production backend)
                const response = await fetch('/api/provinces/giza');

                // Check content type to avoid parsing HTML as JSON
                const contentType = response.headers.get("content-type");
                if (!response.ok || !contentType || !contentType.includes("application/json")) {
                    throw new Error('Failed to fetch data or invalid response format');
                }

                const result = await response.json();

                // Navigate the JSON structure: { success: true, data: { sections: { archaeological: [...] } } }
                const sites = result.data?.sections?.archaeological || [];

                // Take the first 5 items
                const topSites = sites.slice(0, 5).map(item => ({
                    id: item._id,
                    title: item.name || item.title || 'Unknown Site',
                    description: item.shortDescription || item.description || 'No description available.',
                    // Check if image is an array or string, handle accordingly
                    image: Array.isArray(item.images) ? item.images[0] : (item.image || '/images/destination/placeholder.jpg'),
                    rating: item.rating || 4.5,
                    tag: 'Archaeological Site',
                    price: item.ticketPrice ? `${item.ticketPrice} $` : 'Free'
                }));

                setAttractions(topSites);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching featured attractions:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <section className={styles.section} id="featured">
                <div className="container">
                    <h2 className={styles.title}>Featured Attractions</h2>
                    <div className={styles.loading}>Loading featured places...</div>
                </div>
            </section>
        );
    }

    if (error || attractions.length === 0) {
        return null; // Or render a fallback/error message
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

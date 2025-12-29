"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import styles from './GovernorateDetails.module.css';

// Category types
const CATEGORIES = [
  {
    id: 'archaeological',
    title: 'Archaeological Sites',
    icon: '🏛️',
    description: 'Explore ancient monuments and historical sites',
    color: '#D4AF37',
  },
  {
    id: 'entertainment',
    title: 'Entertainment',
    icon: '🎭',
    description: 'Discover fun activities and attractions',
    color: '#FF6B6B',
  },
  {
    id: 'hotels',
    title: 'Hotels',
    icon: '🏨',
    description: 'Find the best accommodations',
    color: '#4ECDC4',
  },
  {
    id: 'events',
    title: 'Events',
    icon: '🎉',
    description: 'Check out upcoming events and festivals',
    color: '#95E1D3',
  },
];

// Fetch governorate data from API
const fetchGovernorateData = async (slug) => {
  console.time(`fetchGovernorate:${slug}`);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://egygo-backend-production.up.railway.app';
    const response = await axios.get(`${baseUrl}/api/provinces/${slug}`);
    console.timeEnd(`fetchGovernorate:${slug}`);
    return response.data;
  } catch (error) {
    console.timeEnd(`fetchGovernorate:${slug}`);
    console.error("Fetch error:", error);
    throw error;
  }
};

export default function GovernorateDetailsPage() {
  const params = useParams();
  const slug = params?.slug;
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch data using React Query - useSuspenseQuery to trigger GlobalLoader via suspense
  const { data } = useSuspenseQuery({
    queryKey: ['governorate', slug],
    queryFn: () => fetchGovernorateData(slug),
  });

  const province = data?.data?.province;
  const sections = data?.data?.sections;

  // Get category count
  const getCategoryCount = (categoryId) => {
    if (!sections || !sections[categoryId]) return 0;
    return sections[categoryId].length;
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  // Render selected category items
  const renderCategoryItems = () => {
    if (!selectedCategory || !sections || !sections[selectedCategory]) {
      return null;
    }

    const items = sections[selectedCategory];
    const category = CATEGORIES.find(c => c.id === selectedCategory);

    return (
      <section className={styles.itemsSection}>
        <div className="container">
          <div className={styles.categoryHeader}>
            <button
              onClick={() => setSelectedCategory(null)}
              className={styles.backToCategoriesBtn}
            >
              ← Back to Categories
            </button>
            <h2 className={styles.categoryHeaderTitle}>
              {category.icon} {category.title}
            </h2>
            <p className={styles.categoryHeaderSubtitle}>
              {items.length} {items.length === 1 ? 'place' : 'places'} found in {province?.name}
            </p>
          </div>

          <div className="row g-4">
            {items.map((item) => (
              <div className="col-lg-4 col-md-6" key={item._id}>
                <div className={styles.placeCard}>
                  <div className={styles.placeImageWrapper}>
                    <Image
                      src={item.images?.[0] || '/images/placeholder.jpg'}
                      alt={item.name}
                      width={400}
                      height={280}
                      className={styles.placeImage}
                    />
                    <div className={styles.placeRating}>
                      ⭐ {item.rating || 'N/A'}
                    </div>
                  </div>
                  <div className={styles.placeContent}>
                    <h3 className={styles.placeName}>{item.name}</h3>
                    <p className={styles.placeDescription}>
                      {item.shortDescription}
                    </p>

                    <div className={styles.placeDetails}>
                      {item.openingHours && (
                        <div className={styles.placeDetail}>
                          <span className={styles.detailIcon}>🕐</span>
                          <span className={styles.detailText}>{item.openingHours}</span>
                        </div>
                      )}
                      {item.ticketPrice && (
                        <div className={styles.placeDetail}>
                          <span className={styles.detailIcon}>💰</span>
                          <span className={styles.detailText}>{item.ticketPrice} $</span>
                        </div>
                      )}
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div className={styles.placeTags}>
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className={styles.placeTag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={styles.placeActions}>
                      {item.googleMapsUrl && (
                        <a
                          href={item.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.mapButton}
                        >
                          📍 View on Map
                        </a>
                      )}
                      <Link href={`/place/${item._id}`} className={styles.detailsButton}>
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  if (!province) {
    return (
      <div className={styles.errorContainer}>
        <div className="container text-center">
          <h2>Governorate not found</h2>
          <Link href="/ExploreDestinations" className={styles.backButton}>
            ← Back to All Governorates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Visual Loader is now handled by Next.js Suspense boundary (loading.tsx) */}

      {/* Hero Section with province cover image */}
      <section
        className={styles.heroSection}
        style={{
          backgroundImage: province.coverImage
            ? `url(${province.coverImage})`
            : 'linear-gradient(135deg, #0A2342, #00797C)'
        }}
      >
        <div className={styles.heroOverlay}></div>
        <div className="container">
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{province.name}</h1>
            <p className={styles.heroSubtitle}>{province.description}</p>
            <div className={styles.provinceStats}>
              {province.population && (
                <div className={styles.stat}>
                  <span className={styles.statIcon}>👥</span>
                  <span className={styles.statValue}>
                    {(province.population / 1000000).toFixed(1)}M
                  </span>
                  <span className={styles.statLabel}>Population</span>
                </div>
              )}
              {province.area && (
                <div className={styles.stat}>
                  <span className={styles.statIcon}>📏</span>
                  <span className={styles.statValue}>{province.area.toLocaleString()}</span>
                  <span className={styles.statLabel}>km²</span>
                </div>
              )}
              {province.capital && (
                <div className={styles.stat}>
                  <span className={styles.statIcon}>🏛️</span>
                  <span className={styles.statValue}>{province.capital}</span>
                  <span className={styles.statLabel}>Capital</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Show category items if selected, otherwise show category cards */}
      {selectedCategory ? (
        renderCategoryItems()
      ) : (
        <section className={styles.categoriesSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>What are you looking for?</h2>
            <p className={styles.sectionSubtitle}>
              Choose a category to explore {province.name}
            </p>

            <div className="row g-4 mt-4">
              {CATEGORIES.map((category) => {
                const count = getCategoryCount(category.id);
                return (
                  <div className="col-lg-3 col-md-6 col-sm-6" key={category.id}>
                    <div
                      className={`${styles.categoryCard} ${count === 0 ? styles.categoryCardDisabled : ''}`}
                      onClick={() => count > 0 && handleCategoryClick(category.id)}
                      style={{ '--category-color': category.color }}
                    >
                      <div className={styles.categoryIcon}>{category.icon}</div>
                      <h3 className={styles.categoryTitle}>{category.title}</h3>
                      <p className={styles.categoryDescription}>
                        {category.description}
                      </p>
                      <div className={styles.categoryCount}>
                        {count} {count === 1 ? 'Place' : 'Places'}
                      </div>
                      {count > 0 && (
                        <div className={styles.categoryArrow}>→</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back Button */}
            <div className="text-center mt-5">
              <Link href="/ExploreDestinations" className={styles.backButton}>
                ← Back to All Governorates
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

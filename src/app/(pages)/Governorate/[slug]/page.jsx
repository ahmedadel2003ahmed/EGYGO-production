"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
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

export default function GovernorateDetailsPage() {
  const params = useParams();
  const slug = params?.slug;
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Format slug to display name
  const governorateName = slug
    ? slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Governorate';

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    // TODO: Navigate to category page or fetch category data
    console.log(`Selected category: ${categoryId} for ${slug}`);
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay}></div>
        <div className="container">
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Explore {governorateName}</h1>
            <p className={styles.heroSubtitle}>
              Discover the best attractions, hotels, and events in {governorateName}
            </p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className={styles.categoriesSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>What are you looking for?</h2>
          <p className={styles.sectionSubtitle}>
            Choose a category to explore {governorateName}
          </p>

          <div className="row g-4 mt-4">
            {CATEGORIES.map((category) => (
              <div className="col-lg-3 col-md-6 col-sm-6" key={category.id}>
                <div
                  className={styles.categoryCard}
                  onClick={() => handleCategoryClick(category.id)}
                  style={{ '--category-color': category.color }}
                >
                  <div className={styles.categoryIcon}>{category.icon}</div>
                  <h3 className={styles.categoryTitle}>{category.title}</h3>
                  <p className={styles.categoryDescription}>
                    {category.description}
                  </p>
                  <div className={styles.categoryArrow}>→</div>
                </div>
              </div>
            ))}
          </div>

          {/* Back Button */}
          <div className="text-center mt-5">
            <Link href="/ExploreDestinations" className={styles.backButton}>
              ← Back to All Governorates
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

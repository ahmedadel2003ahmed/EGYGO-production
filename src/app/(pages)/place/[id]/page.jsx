'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import styles from './placeDetail.module.css';

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/places/${params.id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Place not found');
        }

        const data = await response.json();
        setPlace(data.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPlace();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h2 className={styles.errorTitle}>Place Not Found</h2>
          <Link href="/ExploreDestinations" className={styles.errorLink}>
            ← Back to Places
          </Link>
        </div>
      </div>
    );
  }

  const images = Array.isArray(place.images) && place.images.length > 0
    ? place.images
    : ['https://via.placeholder.com/1920x1080?text=No+Image+Available'];

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.round(rating));
  };

  const getRatingPercentage = (star) => {
    if (!place.rating) return 0;
    const percentage = ((place.rating - (5 - star)) / star) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const getDefaultDuration = (type) => {
    switch (type) {
      case 'archaeological': return '2-3 hours';
      case 'entertainment': return '3-5 hours';
      case 'hotels': return 'Overnight stay';
      default: return 'Event duration varies';
    }
  };

  const defaultTips = [
    'Arrive early to avoid crowds',
    'Bring water and sun protection',
    'Photography may be restricted',
    'Guided tours are recommended',
  ];

  const tips = place.tips && place.tips.length > 0 ? place.tips : defaultTips.map(text => ({ text }));

  return (
    <div className={styles.pageContainer}>
      {/* Breadcrumb - Overlaid on Hero via CSS */}
      <div className={styles.breadcrumbContainer}>
        <div className={styles.breadcrumb}>
          <Link href="/" className={styles.breadcrumbLink}>Home</Link>
          <span className={styles.separator}>/</span>
          <Link href="/ExploreDestinations" className={styles.breadcrumbLink}>Places</Link>
          <span className={styles.separator}>/</span>
          <span className={styles.breadcrumbCurrent}>{place.name}</span>
        </div>
      </div>

      {/* Hero Carousel Section */}
      <section className={styles.heroSection}>
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectFade]}
          effect="fade"
          slidesPerView={1}
          loop={true}
          speed={1000}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          className={styles.swiper}
        >
          {images.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div className={styles.slideContent}>
                <img
                  src={img}
                  alt={place.name}
                  className={styles.heroImage}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/1920x1080?text=Image+Load+Error'; }}
                />
                <div className={styles.heroOverlay}>
                  <div className={styles.heroText}>
                    {place.type && (
                      <span className={styles.typeBadge}>{place.type}</span>
                    )}
                    <h1 className={styles.title}>{place.name}</h1>
                    <div className={styles.metadata}>
                      <span className={styles.rating}>
                        ⭐ {place.rating || 'N/A'} ({place.reviewsCount || 0} reviews)
                      </span>
                      {place.address && (
                        <span className={styles.address}>📍 {place.address}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Main Content */}
      <div className={styles.container}>
        <div className={styles.contentGrid}>
          {/* Left Column */}
          <div className={styles.mainContent}>
            {/* Tabs */}
            <div className={styles.tabNav}>
              <button
                className={`${styles.tabButton} ${activeTab === 'overview' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'details' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details & Hours
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className={styles.overview}>
                  {place.description && (
                    <section className={styles.section}>
                      <h2 className={styles.sectionTitle}>About This Place</h2>
                      <p className={styles.description}>{place.description}</p>
                    </section>
                  )}

                  {/* Quick Facts */}
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Quick Facts</h2>
                    <div className={styles.factsGrid}>
                      <div className={styles.fact}>
                        <span className={styles.factLabel}>🎫 Admission</span>
                        <span className={styles.factValue}>
                          {place.ticketPrice ? `${place.ticketPrice} ${place.currency || 'EGP'}` : 'Free'}
                        </span>
                      </div>
                      <div className={styles.fact}>
                        <span className={styles.factLabel}>⏰ Opening Hours</span>
                        <span className={styles.factValue}>
                          {place.openingHours || 'Check locally'}
                        </span>
                      </div>
                      {place.rating && (
                        <div className={styles.fact}>
                          <span className={styles.factLabel}>⭐ Rating</span>
                          <span className={styles.factValue}>{place.rating} / 5</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Amenities */}
                  {place.amenities && place.amenities.length > 0 && (
                    <section className={styles.section}>
                      <h3 className={styles.sectionTitle}>Amenities</h3>
                      <div className={styles.amenitiesGrid}>
                        {place.amenities.map((amenity, idx) => (
                          <div key={idx} className={styles.amenityItem}>
                            <span className={styles.checkmark}>✓</span> {amenity}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className={styles.details}>
                  <h2 className={styles.sectionTitle}>Key Details</h2>
                  <div className={styles.detailsTable}>
                    {place.openingHours && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Opening Hours</span>
                        <span className={styles.detailValue}>{place.openingHours}</span>
                      </div>
                    )}
                    {place.ticketPrice && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Ticket Price</span>
                        <span className={styles.detailValue}>
                          {place.ticketPrice} {place.currency || 'EGP'}
                        </span>
                      </div>
                    )}
                    {place.phone && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Phone</span>
                        <a href={`tel:${place.phone}`} className={styles.detailLink}>
                          {place.phone}
                        </a>
                      </div>
                    )}
                    {place.website && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Website</span>
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.detailLink}
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className={styles.reviews}>
                  <h2 className={styles.sectionTitle}>Visitor Reviews</h2>
                  <p className={styles.reviewsSubtitle}>
                    Based on {place.reviewsCount || 0} reviews • Rating: {place.rating || 'N/A'}/5
                  </p>

                  {/* Rating Breakdown */}
                  <div className={styles.ratingBreakdown}>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className={styles.ratingBar}>
                        <span className={styles.starLabel}>{star} ⭐</span>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${getRatingPercentage(star)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reviews List */}
                  {place.reviews && place.reviews.length > 0 ? (
                    <div className={styles.reviewsList}>
                      {place.reviews.map((review, idx) => (
                        <div key={idx} className={styles.reviewItem}>
                          <div className={styles.reviewHeader}>
                            <img
                              src={review.userAvatar || `https://ui-avatars.com/api/?name=${review.userName}&background=random`}
                              alt={review.userName}
                              className={styles.reviewAvatar}
                            />
                            <div className={styles.reviewMeta}>
                              <span className={styles.reviewerName}>{review.userName}</span>
                              <span className={styles.reviewDate}>
                                {new Date(review.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className={styles.reviewComment}>{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <p>No reviews yet. Be the first to share your experience!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            {/* Plan Your Visit Card */}
            <div className={styles.planCard}>
              <h3 className={styles.planTitle}>Plan Your Visit</h3>

              {/* Map */}
              {place.location && place.location.coordinates && (
                <div className={styles.mapContainer}>
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${place.location.coordinates[0]},${place.location.coordinates[1]},13,0/400x300?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                    alt="Location Map"
                    className={styles.mapImage}
                    onError={(e) => {
                      // Fallback if Mapbox token is missing or fails
                      e.target.src = 'https://via.placeholder.com/400x300?text=Map+View';
                    }}
                  />
                  <div className={styles.mapAddress}>
                    <a
                      href={`https://www.google.com/maps?q=${place.location.coordinates[1]},${place.location.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapLink}
                    >
                      {place.address || 'View on Google Maps'} →
                    </a>
                  </div>
                </div>
              )}

              <div className={styles.contactInfo}>
                {place.phone && (
                  <a href={`tel:${place.phone}`} className={styles.contactItem}>
                    Phone: {place.phone}
                  </a>
                )}
                {place.website && (
                  <a href={place.website} target="_blank" className={styles.contactItem}>
                    Official Website
                  </a>
                )}
              </div>

              <div className={styles.actionButtons}>
                <button className={styles.bookButton}>Book Now</button>
                <button className={styles.saveButton}>Save to Trip</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

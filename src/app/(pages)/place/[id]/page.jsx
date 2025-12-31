'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  const [lightboxImage, setLightboxImage] = useState(null);

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
    : ['data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"%3E%3Crect width="1920" height="1080" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="64" fill="%23555"%3ENo Image Available%3C/text%3E%3C/svg%3E'];

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
                <Image
                  src={img}
                  alt={place.name}
                  className={styles.heroImage}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority={idx === 0}
                />
                <div className={styles.heroOverlay}></div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Hero Content - Moved Text/Overlay outside Swiper to prevent duplication and glitches */}
        <div className={styles.heroOverlayContent}>
          <div className={styles.heroText}>
            {place.type && (
              <span className={styles.typeBadge}>{place.type}</span>
            )}
            <h1 className={styles.title}>{place.name}</h1>
            <div className={styles.metadata}>
              <span className={styles.rating}>
                {place.reviewsCount > 0 ? (
                  <>⭐ {place.rating} ({place.reviewsCount} reviews)</>
                ) : (
                  <span className={styles.newBadge}>⭐ New Destination</span>
                )}
              </span>
              {place.address && (
                <span className={styles.address}>📍 {place.address}</span>
              )}
            </div>
          </div>
        </div>
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
              <button
                className={`${styles.tabButton} ${activeTab === 'gallery' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('gallery')}
              >
                Gallery
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
                          {place.ticketPrice ? `${place.ticketPrice} ${place.currency || '$'}` : 'Free'}
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
                          {place.ticketPrice} {place.currency || '$'}
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
                            <Image
                              src={review.userAvatar || `https://ui-avatars.com/api/?name=${review.userName}&background=random`}
                              alt={review.userName}
                              className={styles.reviewAvatar}
                              width={50}
                              height={50}
                              unoptimized
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

              {/* Gallery Tab */}
              {activeTab === 'gallery' && (
                <div className={styles.gallery}>
                  <h2 className={styles.sectionTitle}>Photo Gallery</h2>
                  <p className={styles.description}>
                    Explore the beauty of {place.name} through our curated image collection.
                  </p>

                  <div className={styles.galleryGrid}>
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={styles.galleryItem}
                        onClick={() => setLightboxImage(img)}
                      >
                        <Image
                          src={img}
                          alt={`${place.name} view ${idx + 1}`}
                          className={styles.galleryImage}
                          width={400}
                          height={300}
                          style={{ objectFit: 'cover' }}
                          unoptimized
                        />
                        <div className={styles.galleryOverlay}>
                          <span className={styles.zoomIcon}>🔍</span>
                        </div>
                      </div>
                    ))}
                    {/* Fallback pattern if only 1 image exists, repeat it to show grid effect (Optional, removed for now to stay authentic) */}
                  </div>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${place.location.coordinates[0]},${place.location.coordinates[1]},13,0/400x300?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                    alt="Location Map"
                    className={styles.mapImage}
                    onError={(e) => {
                      // Fallback if Mapbox token is missing or fails
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23888"%3EMap View%3C/text%3E%3C/svg%3E';
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

      {/* Lightbox Modal */}
      {
        lightboxImage && (
          <div className={styles.lightboxOverlay} onClick={() => setLightboxImage(null)}>
            <button className={styles.closeLightbox} aria-label="Close gallery">×</button>
            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <Image
                src={lightboxImage}
                alt="Full screen view"
                className={styles.lightboxImage}
                width={1200}
                height={800}
                style={{ objectFit: 'contain' }}
                unoptimized
              />
            </div>
          </div>
        )
      }
    </div >
  );
}

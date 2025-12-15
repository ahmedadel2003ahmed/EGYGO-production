"use client";

import React, { useEffect, useState } from "react";
import styles from "./GuideProfile.module.css";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaCheckCircle, FaStar } from "react-icons/fa";

export default function GuideProfileClient() {
  const { slug } = useParams();
  const router = useRouter();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGuideData() {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('access_token');
        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const res = await fetch(`http://localhost:5000/api/tourist/guides/${slug}`, {
          headers
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch guide data");
        }
        
        const response = await res.json();
        console.log('Guide API Response:', response);
        
        if (!response.success || !response.data) {
          throw new Error("Guide not found");
        }
        
        setGuide(response.data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching guide:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (slug) {
      fetchGuideData();
    }
  }, [slug]);

  // Handle booking navigation
  const handleBookNow = () => {
    if (guide && guide.slug) {
      router.push(`/booking/${guide.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading guide details...</span>
        </div>
        <p className="mt-3">Loading guide details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-5">
        <div className="alert alert-danger" role="alert">
          <h4>Error Loading Guide</h4>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="text-center mt-5">
        <div className="alert alert-warning" role="alert">
          <h4>Guide Not Found</h4>
          <p>The guide you&apos;re looking for doesn&apos;t exist.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => router.push('/guides')}
          >
            Browse All Guides
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.pageWrapper} container`}>
      <div className="row">
        {/* LEFT SIDEBAR */}
        <div className="col-lg-3 mb-4">
          <div className={styles.sidebarCard}>
            <div className="text-center">
              <Image
                src={guide.photo?.url || '/images/default-avatar.png'}
                alt={guide.name}
                width={130}
                height={130}
                className={styles.avatar}
              />
              <h4 className={styles.name}>{guide.name}</h4>

              {guide.isVerified && (
                <p className={styles.verified}>
                  <FaCheckCircle /> Verified Guide
                </p>
              )}

              {guide.isLicensed && (
                <p className={styles.verified}>
                  <FaCheckCircle style={{ color: '#10b981' }} /> Licensed
                </p>
              )}

              {guide.canEnterArchaeologicalSites && (
                <p className={styles.university}>🏛️ Can Enter Archaeological Sites</p>
              )}

              {/* LANGUAGES */}
              <div className={styles.languages}>
                {guide.languages?.map((lang) => (
                  <span key={lang} className={styles.langBadge}>
                    {lang}
                  </span>
                ))}
              </div>

              {/* RATING */}
              {guide.rating > 0 && (
                <div className={styles.ratingSection}>
                  <div className={styles.stars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FaStar 
                        key={i} 
                        color={i < Math.round(guide.rating) ? '#ffc107' : '#e0e0e0'}
                      />
                    ))}
                  </div>
                  <p className={styles.ratingText}>
                    {guide.rating.toFixed(1)} ({guide.ratingCount} reviews)
                  </p>
                </div>
              )}

              {/* PRICE */}
              <p className={styles.price}>${guide.pricePerHour} / hour</p>

              {/* STATS */}
              <div className={styles.statsBox}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{guide.totalTrips || 0}</span>
                  <span className={styles.statLabel}>Total Trips</span>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="d-grid gap-2 mt-3">
                <button className={styles.btnOutline}>Start Chat</button>
                <button className={styles.btnOutline}>Voice Call</button>
                <button className={styles.btnOutline}>Video Call</button>
                <button 
                  className={styles.btnPrimary}
                  onClick={handleBookNow}
                  disabled={!guide}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="col-lg-9">
          {/* ABOUT ME */}
          <div className={styles.sectionCard}>
            <h5 className={styles.sectionTitle}>About Me</h5>
            <p className={styles.aboutText}>{guide.bio || 'No bio available'}</p>
            
            {guide.user?.email && (
              <div className={styles.contactInfo}>
                <p><strong>📧 Email:</strong> {guide.user.email}</p>
                {guide.user.phone && (
                  <p><strong>📱 Phone:</strong> {guide.user.phone}</p>
                )}
              </div>
            )}
          </div>

          {/* LOCATION */}
          {guide.location && (
            <div className={styles.sectionCard}>
              <h5 className={styles.sectionTitle}>Location</h5>
              <p className={styles.aboutText}>
                📍 Coordinates: {guide.location.coordinates[1]}, {guide.location.coordinates[0]}
              </p>
              <a
                href={`https://www.google.com/maps?q=${guide.location.coordinates[1]},${guide.location.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnOutline}
                style={{ display: 'inline-block', marginTop: '10px' }}
              >
                🗺️ View on Map
              </a>
            </div>
          )}

          {/* GALLERY */}
          {guide.gallery && guide.gallery.length > 0 && (
            <div className={styles.sectionCard}>
              <h5 className={styles.sectionTitle}>Gallery ({guide.gallery.length})</h5>

              <div className="row">
                {guide.gallery.map((item, i) => (
                  <div className="col-lg-4 col-md-4 col-6 mb-3" key={item._id || i}>
                    <Image
                      src={item.url}
                      width={400}
                      height={300}
                      alt={`Gallery image ${i + 1}`}
                      className={styles.galleryImg}
                    />
                    <p className={styles.galleryDate}>
                      {new Date(item.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITY STATUS */}
          <div className={styles.sectionCard}>
            <h5 className={styles.sectionTitle}>Status</h5>
            <div className={styles.statusBadges}>
              <span className={guide.isActive ? styles.badgeActive : styles.badgeInactive}>
                {guide.isActive ? '✅ Active' : '❌ Inactive'}
              </span>
              {guide.user?.isActive && (
                <span className={styles.badgeActive}>
                  ✅ Account Active
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

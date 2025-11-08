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
        const res = await fetch("/data/guides.json");
        
        if (!res.ok) {
          throw new Error("Failed to fetch guide data");
        }
        
        const allGuides = await res.json();
        const selected = allGuides.find((g) => g.slug === slug);
        
        if (!selected) {
          throw new Error("Guide not found");
        }
        
        setGuide(selected);
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
          <p>The guide you're looking for doesn't exist.</p>
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

  const { card, profile } = guide;

  return (
    <div className={`${styles.pageWrapper} container`}>
      <div className="row">
        {/* LEFT SIDEBAR */}
        <div className="col-lg-3 mb-4">
          <div className={styles.sidebarCard}>
            <div className="text-center">
              <Image
                src={card.avatar}
                alt={card.name}
                width={130}
                height={130}
                className={styles.avatar}
              />
              <h4 className={styles.name}>{card.name}</h4>

              {profile.verified && (
                <p className={styles.verified}>
                  <FaCheckCircle /> Verified
                </p>
              )}

              <p className={styles.university}>{card.specialization}</p>

              {/* LANGUAGES */}
              <div className={styles.languages}>
                {profile.languages.map((lang) => (
                  <span key={lang} className={styles.langBadge}>
                    {lang}
                  </span>
                ))}
              </div>

              {/* PRICE */}
              <p className={styles.price}>${card.pricePerHour} / hour</p>

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
            <p className={styles.aboutText}>{profile.aboutMe}</p>
          </div>

          {/* REVIEWS */}
          <div className={styles.sectionCard}>
            <h5 className={styles.sectionTitle}>
              Reviews ({profile.reviews.length})
            </h5>

            {profile.reviews.map((review, index) => (
              <div key={index} className={styles.reviewItem}>
                <p className={styles.reviewName}>{review.name}</p>
                <div className={styles.stars}>
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <FaStar key={i} />
                  ))}
                </div>
                <p className={styles.reviewText}>{review.review}</p>
              </div>
            ))}
          </div>

          {/* GALLERY */}
          <div className={styles.sectionCard}>
            <h5 className={styles.sectionTitle}>Latest Trips Gallery</h5>

            <div className="row">
              {profile.gallery.map((img, i) => (
                <div className="col-lg-4 col-md-4 col-6 mb-3" key={i}>
                  <Image
                    src={img}
                    width={400}
                    height={300}
                    alt="Gallery image"
                    className={styles.galleryImg}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

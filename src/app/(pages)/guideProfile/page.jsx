// /app/guides/[slug]/page.jsx
"use client";

import React from "react";
import styles from "./guideProfile.module.css";
import guides from "@/data/guides.json"; // ✅ adjust path if different
import Link from "next/link";

export default function GuideProfilePage({ params }) {
  const { slug } = params;
  const guide = guides.find((g) => g.slug === slug);

  if (!guide) {
    return (
      <div className="container py-5">
        <h3>Guide not found</h3>
        <Link href="/Governorate" className="btn btn-secondary mt-3">
          ← Back to Guides
        </Link>
      </div>
    );
  }

  const { card = {}, profile = {}, filters = {} } = guide;

  return (
    <div className={`container py-5 ${styles.pageWrapper}`}>
      <div className="row g-4">
        {/* LEFT CARD (PROFILE SIDEBAR) */}
        <div className="col-md-4 col-lg-3">
          <div className={styles.profileCard}>
            <img src={card.avatar} alt={card.name} className={styles.avatar} />

            <h3 className={styles.name}>{card.name}</h3>
            <p className={styles.specialization}>{card.specialization}</p>

            {profile.verified && <span className={styles.verified}>✅ Verified</span>}

            <hr />

            <div className={styles.infoBlock}>
              <p><strong>⭐ Rating:</strong> {card.rating?.toFixed(1)}</p>
              <p><strong>Reviews:</strong> {card.reviewsCount}</p>
              <p><strong>Price:</strong> ${card.pricePerHour} / hr</p>
            </div>

            <button className="btn btn-success w-100 mt-3">Book Now</button>

            <Link href="/Governorate" className={styles.backLink}>
              ← Back to Guides
            </Link>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="col-md-8 col-lg-9">
          {/* About Me */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>About Me</h4>
            <p className={styles.sectionText}>{profile.aboutMe}</p>
          </div>

          {/* Reviews */}
          {profile.reviews && profile.reviews.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>
                Reviews ({profile.reviews.length})
              </h4>

              {profile.reviews.map((review, i) => (
                <div key={i} className={styles.reviewCard}>
                  <div className="d-flex justify-content-between">
                    <strong>{review.name}</strong>
                    <span>{"⭐".repeat(review.rating)}</span>
                  </div>
                  <p className={styles.reviewText}>{review.review}</p>
                </div>
              ))}
            </div>
          )}

          {/* Gallery */}
          {profile.gallery && profile.gallery.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Latest Trips Gallery</h4>

              <div className="row g-3">
                {profile.gallery.map((img, i) => (
                  <div key={i} className="col-6 col-md-4 col-lg-3">
                    <img src={img} alt="trip" className={styles.galleryImage} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags: Languages / Locations / etc */}
          {filters.languages && (
            <div className={styles.badgeSection}>
              {filters.languages.map((lang, i) => (
                <span key={i} className={styles.badge}>
                  🌍 {lang}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

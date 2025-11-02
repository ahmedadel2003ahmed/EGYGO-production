"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./Governorate.module.css";

export default function GovernorateClient({ initialGuides = [] }) {
  // 🏙️ Extract unique cities
  const cities = useMemo(() => {
    const set = new Set();

    
    initialGuides.forEach((g) => {
      (g.filters?.serviceLocations || []).forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [initialGuides]);

  const [selectedCity, setSelectedCity] = useState(cities[0] || null);
  const [query, setQuery] = useState("");

  // 🔍 Filter guides
  const filteredGuides = useMemo(() => {
    if (!selectedCity) return initialGuides;
    return initialGuides
      .filter((g) =>
        (g.filters?.serviceLocations || []).includes(selectedCity)
      )
      .filter((g) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          g.card?.name?.toLowerCase().includes(q) ||
          g.card?.specialization?.toLowerCase().includes(q)
        );
      });
  }, [initialGuides, selectedCity, query]);

  return (
    <div className={`row ${styles.grid}`}>
      {/* Left Column: Cities */}
      <aside className={`col-lg-3 col-md-4 ${styles.leftCol}`}>
        <h3 className={styles.columnTitle}>Choose a Governorate</h3>
        <div className={styles.citiesWrap}>
          {cities.map((city) => (
            <button
              key={city}
              className={`${styles.cityItem} ${
                selectedCity === city ? styles.activeCity : ""
              }`}
              onClick={() => setSelectedCity(city)}
            >
              <div>
                <strong>{city}</strong>
                <div className={styles.cityDesc}>Explore guides in {city}.</div>
              </div>
              <span className={styles.bell}>🔔</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Right Column: Guides */}
      <section className={`col-lg-9 col-md-8 ${styles.rightCol}`}>
        <div className={styles.rightHeader}>
          <h3 className={styles.columnTitle}>
            Local Guides {selectedCity ? `in ${selectedCity}` : ""}
          </h3>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.search}
              placeholder="Search by name or specialization..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredGuides.length === 0 ? (
          <div className={styles.empty}>
            No guides found for <strong>{selectedCity}</strong>.
          </div>
        ) : (
          <div className={`row g-3 ${styles.cardsGrid}`}>
            {filteredGuides.map((g) => (
              <div className="col-xl-4 col-lg-6 col-md-12" key={`${g.id}-${g.slug || g.card?.name}`}>
                <article className={styles.card}>
                  <div className={styles.cardTop}>
                    <img
                      src={g.card?.avatar || "/images/guides/default.png"}
                      alt={g.card?.name}
                      className={styles.avatar}
                      loading="lazy"
                    />
                    <div className={styles.cardTitleWrap}>
                      <h4 className={styles.cardName}>{g.card?.name}</h4>
                      <div className={styles.ratingWrap}>
                        <span className={styles.stars}>⭐</span>
                        <span className={styles.rating}>
                          {g.card?.rating?.toFixed(1)}
                        </span>
                        <span className={styles.reviews}>
                          ({g.card?.reviewsCount} reviews)
                        </span>
                      </div>
                      <div className={styles.spec}>
                        {g.card?.specialization}
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardBottom}>
                    <div className={styles.price}>
                      ${g.card?.pricePerHour} <small>/ hour</small>
                    </div>
                    <Link href={`/guides/${g.slug}`} className={styles.viewBtn}>
                      View Profile
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

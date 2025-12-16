"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Governorate.module.css";

export default function GovernorateClient({ initialGuides = [] }) {
  // 🏙️ Extract unique governorates from all guides
  const governorates = useMemo(() => {
    const governorateMap = new Map();

    initialGuides.forEach((guide) => {
      // Handle guides with provinces array
      if (guide.provinces && Array.isArray(guide.provinces) && guide.provinces.length > 0) {
        guide.provinces.forEach((province) => {
          if (province?.name && province?._id) {
            governorateMap.set(province.name, {
              id: province._id,
              name: province.name,
              slug: province.slug || province.name.toLowerCase(),
            });
          }
        });
      }
      
      // Handle guides with single province object
      if (guide.province?.name && guide.province?._id) {
        governorateMap.set(guide.province.name, {
          id: guide.province._id,
          name: guide.province.name,
          slug: guide.province.slug || guide.province.name.toLowerCase(),
        });
      }
    });

    // Convert map to sorted array
    return Array.from(governorateMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }, [initialGuides]);

  const [selectedGovernorate, setSelectedGovernorate] = useState(governorates[0]?.name || null);
  const [query, setQuery] = useState("");

  // Get guide count per governorate
  const getGuideCount = (governorateName) => {
    return initialGuides.filter((g) => {
      const provinces = g.provinces || [];
      const province = g.province;
      
      const hasProvince = provinces.some(p => p?.name === governorateName);
      const hasMainProvince = province?.name === governorateName;
      
      return hasProvince || hasMainProvince;
    }).length;
  };

  // 🔍 Filter guides
  const filteredGuides = useMemo(() => {
    let filtered = initialGuides;

    // Filter by selected governorate
    if (selectedGovernorate) {
      filtered = filtered.filter((g) => {
        const provinces = g.provinces || [];
        const province = g.province;
        
        // Check if guide works in selected governorate
        const hasProvince = provinces.some(p => p?.name === selectedGovernorate);
        const hasMainProvince = province?.name === selectedGovernorate;
        
        return hasProvince || hasMainProvince;
      });
    }

    // Filter by search query
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter((g) => {
        return (
          g.name?.toLowerCase().includes(q) ||
          g.bio?.toLowerCase().includes(q) ||
          g.languages?.some(lang => lang.toLowerCase().includes(q))
        );
      });
    }

    return filtered;
  }, [initialGuides, selectedGovernorate, query]);

  return (
    <div className={`row ${styles.grid}`}>
      {/* Left Column: Governorates */}
      <aside className={`col-lg-3 col-md-4 ${styles.leftCol}`}>
        <h3 className={styles.columnTitle}>Choose a Governorate</h3>
        <div className={styles.citiesWrap}>
          {governorates.map((gov) => (
            <button
              key={gov.id}
              className={`${styles.cityItem} ${
                selectedGovernorate === gov.name ? styles.activeCity : ""
              }`}
              onClick={() => setSelectedGovernorate(gov.name)}
            >
              <div>
                <strong>{gov.name}</strong>
                <div className={styles.cityDesc}>
                  {getGuideCount(gov.name)} {getGuideCount(gov.name) === 1 ? 'guide' : 'guides'} available
                </div>
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
            Local Guides {selectedGovernorate ? `in ${selectedGovernorate}` : ""}
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
              <div className="col-xl-4 col-lg-6 col-md-12" key={g._id}>
                <article className={styles.card}>
                  <div className={styles.cardTop}>
                    <Image
                      src={g.photo?.url || "/images/guides/default.png"}
                      alt={g.name || "Guide avatar"}
                      className={styles.avatar}
                      width={80}
                      height={80}
                    />
                    <div className={styles.cardTitleWrap}>
                      <h4 className={styles.cardName}>{g.name}</h4>
                      <div className={styles.ratingWrap}>
                        <span className={styles.stars}>⭐</span>
                        <span className={styles.rating}>
                          {g.rating > 0 ? g.rating.toFixed(1) : '0.0'}
                        </span>
                        <span className={styles.reviews}>
                          ({g.ratingCount || 0} reviews)
                        </span>
                      </div>
                      <div className={styles.spec}>
                        {g.languages?.join(', ') || 'No languages specified'}
                      </div>
                      {g.isVerified && (
                        <div className={styles.verifiedBadge}>
                          ✓ Verified
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardBottom}>
                    <div className={styles.price}>
                      ${g.pricePerHour} <small>/ hour</small>
                    </div>
                    <Link href={`/guides/${g._id}`} className={styles.viewBtn}>
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

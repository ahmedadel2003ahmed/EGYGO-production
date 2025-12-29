"use client";

import React, { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import styles from "./Governorate.module.css";
import GlobalLoader from "@/components/common/GlobalLoader";

// Fetch function for React Query
const fetchGuides = async () => {
  const response = await axios.get("/api/tourist/guides");
  return response.data?.data || [];
};

export default function GovernorateClient({ initialGuides = [] }) {
  // 🔄 React Query for efficient data fetching, caching, and state management
  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["guides"],
    queryFn: fetchGuides,
    initialData: initialGuides.length > 0 ? initialGuides : undefined,
  });

  // 🏙️ Optimized: Extract unique governorates and calculate counts in a SINGLE pass O(N)
  const { governorates, counts } = useMemo(() => {
    if (!guides.length) return { governorates: [], counts: {} };

    const govMap = new Map(); // key: name, value: governorate object
    const countMap = {};      // key: name, value: count

    guides.forEach((guide) => {
      // Create a set of unique province names for this guide to avoid double counting
      const guideProvinceNames = new Set();
      const guideProvinces = [];

      if (guide.provinces && Array.isArray(guide.provinces)) {
        guide.provinces.forEach(p => {
          if (p?.name && p?._id) guideProvinces.push(p);
        });
      }
      if (guide.province?.name && guide.province?._id) {
        guideProvinces.push(guide.province);
      }

      guideProvinces.forEach((province) => {
        if (!guideProvinceNames.has(province.name)) {
          guideProvinceNames.add(province.name);

          // Add to governorates map if new
          if (!govMap.has(province.name)) {
            govMap.set(province.name, {
              id: province._id,
              name: province.name,
              slug: province.slug || province.name.toLowerCase(),
            });
          }

          // Increment count
          countMap[province.name] = (countMap[province.name] || 0) + 1;
        }
      });
    });

    // Convert map to sorted array
    const sortedGovernorates = Array.from(govMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return { governorates: sortedGovernorates, counts: countMap };
  }, [guides]);

  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [query, setQuery] = useState("");

  // Initialize selected governorate once data is ready
  React.useEffect(() => {
    if (governorates.length > 0 && !selectedGovernorate) {
      setSelectedGovernorate(governorates[0].name);
    }
  }, [governorates, selectedGovernorate]);

  // Memoized handlers
  const handleGovernorateSelect = useCallback((name) => {
    setSelectedGovernorate(name);
  }, []);

  const handleQueryChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  // 🔍 Filter guides efficiently
  const filteredGuides = useMemo(() => {
    let filtered = guides;

    // Filter by selected governorate
    if (selectedGovernorate) {
      filtered = filtered.filter((g) => {
        // Check if guide works in selected governorate
        // Optimization: checking specific properties first
        if (g.province?.name === selectedGovernorate) return true;
        if (g.provinces && Array.isArray(g.provinces)) {
          return g.provinces.some(p => p?.name === selectedGovernorate);
        }
        return false;
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
  }, [guides, selectedGovernorate, query]);

  if (isLoading && guides.length === 0) {
    return <GlobalLoader isLoading={true} />;
  }

  return (
    <div className={`row ${styles.grid}`}>
      {/* Left Column: Governorates */}
      <aside className={`col-lg-3 col-md-4 ${styles.leftCol}`}>
        <h3 className={styles.columnTitle}>Choose a Governorate</h3>
        <div className={styles.citiesWrap}>
          {governorates.map((gov) => (
            <button
              key={gov.id}
              className={`${styles.cityItem} ${selectedGovernorate === gov.name ? styles.activeCity : ""}`}
              onClick={() => handleGovernorateSelect(gov.name)}
            >
              <div>
                <strong>{gov.name}</strong>
                <div className={styles.cityDesc}>
                  {counts[gov.name] || 0} {(counts[gov.name] || 0) === 1 ? 'guide' : 'guides'} available
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
              onChange={handleQueryChange}
            />
          </div>
        </div>

        {filteredGuides.length === 0 ? (
          <div className={styles.empty}>
            {guides.length === 0 ? "No guides available at the moment." :
              `No guides found for ${selectedGovernorate || "your search"}.`}
          </div>
        ) : (
          <div className={`row g-3 ${styles.cardsGrid}`}>
            {filteredGuides.map((g) => (
              <div className="col-xl-4 col-lg-6 col-md-12" key={g._id}>
                <article className={styles.card}>
                  <div className={styles.cardTop}>
                    {/* Using Next.js Image with optimizations */}
                    <div style={{ position: "relative", width: "80px", height: "80px" }}>
                      <Image
                        src={g.photo?.url || "/images/guides/default.png"}
                        alt={g.name || "Guide avatar"}
                        className={styles.avatar}
                        fill
                        sizes="80px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className={styles.cardTitleWrap}>
                      <h4 className={styles.cardName}>
                        {g.name}
                        {g.isVerified && (
                          <span className={styles.verifiedIcon} title="Verified Guide">✓</span>
                        )}
                      </h4>
                      <div className={styles.ratingWrap}>
                        <span className={styles.stars}>⭐</span>
                        <span className={styles.rating}>
                          {g.rating > 0 ? Number(g.rating).toFixed(1) : '0.0'}
                        </span>
                        <span className={styles.reviews}>
                          ({g.ratingCount || 0} reviews)
                        </span>
                      </div>
                      <div className={styles.spec}>
                        {g.languages?.join(', ') || 'No languages specified'}
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardBottom}>
                    <div className={styles.price}>
                      ${g.pricePerHour} <small>/ hour</small>
                    </div>
                    {/* Prefetching implicitly handled by Next.js Link */}
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

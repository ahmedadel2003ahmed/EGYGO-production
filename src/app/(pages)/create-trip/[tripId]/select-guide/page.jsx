"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import styles from './SelectGuide.module.css';

export default function SelectGuidePage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId;

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('laqtaha_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const [filters, setFilters] = useState({
    language: '',
    maxDistance: '',
    minRating: 0,
    sortBy: 'distance', // distance, rating, price
  });

  // Fetch compatible guides
  const {
    data: guidesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['trip-guides', tripId, filters],
    queryFn: async () => {
      const response = await axios.get(
        `http://localhost:5000/api/tourist/trips/${tripId}/guides`,
        {
          params: {
            language: filters.language || undefined,
            maxDistance: filters.maxDistance || undefined,
            minRating: filters.minRating || undefined,
            sortBy: filters.sortBy,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('laqtaha_token')}`,
          },
        }
      );
      return response.data?.data || [];
    },
    enabled: !!tripId,
  });

  // Select guide mutation
  const selectGuideMutation = useMutation({
    mutationFn: async (guideId) => {
      const response = await axios.post(
        `http://localhost:5000/api/tourist/trips/${tripId}/select-guide`,
        { guideId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('laqtaha_token')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      router.push(`/my-trips/${tripId}`);
    },
  });

  const handleSelectGuide = async (guideId) => {
    if (window.confirm('Select this guide for your trip?')) {
      selectGuideMutation.mutate(guideId);
    }
  };

  const guides = guidesData?.guides || [];
  const trip = guidesData?.trip;

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <section className={styles.headerSection}>
        <div className="container">
          <button onClick={() => router.back()} className={styles.backBtn}>
            ← Back
          </button>
          <h1 className={styles.pageTitle}>Select Your Guide</h1>
          {trip && (
            <div className={styles.tripInfo}>
              <span>📅 {new Date(trip.startAt).toLocaleDateString()}</span>
              <span>⏱️ {trip.totalDurationMinutes} min</span>
              <span>📍 {trip.meetingAddress}</span>
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className={styles.filtersSection}>
        <div className="container">
          <div className={styles.filtersCard}>
            <div className={styles.filterGroup}>
              <label>Language</label>
              <select
                value={filters.language}
                onChange={(e) =>
                  setFilters({ ...filters, language: e.target.value })
                }
                className={styles.filterSelect}
              >
                <option value="">All Languages</option>
                <option value="English">English</option>
                <option value="Arabic">Arabic</option>
                <option value="French">French</option>
                <option value="Spanish">Spanish</option>
                <option value="German">German</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Max Distance (km)</label>
              <select
                value={filters.maxDistance}
                onChange={(e) =>
                  setFilters({ ...filters, maxDistance: e.target.value })
                }
                className={styles.filterSelect}
              >
                <option value="">Any Distance</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="20">Within 20 km</option>
                <option value="50">Within 50 km</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Min Rating</label>
              <select
                value={filters.minRating}
                onChange={(e) =>
                  setFilters({ ...filters, minRating: Number(e.target.value) })
                }
                className={styles.filterSelect}
              >
                <option value="0">Any Rating</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value })
                }
                className={styles.filterSelect}
              >
                <option value="distance">Distance</option>
                <option value="rating">Rating</option>
                <option value="price">Price</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Guides List */}
      <section className={styles.guidesSection}>
        <div className="container">
          {isLoading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Finding compatible guides...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>⚠️</div>
              <p>{error.response?.data?.message || 'Failed to load guides'}</p>
            </div>
          )}

          {!isLoading && !error && guides.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3>No Guides Found</h3>
              <p>Try adjusting your filters to see more results</p>
            </div>
          )}

          {!isLoading && !error && guides.length > 0 && (
            <>
              <div className={styles.resultCount}>
                Found {guides.length} compatible guide{guides.length !== 1 ? 's' : ''}
              </div>

              <div className={styles.guidesGrid}>
                {guides.map((guide) => (
                  <div key={guide._id} className={styles.guideCard}>
                    <div className={styles.guideHeader}>
                      <div className={styles.guideAvatar}>
                        {guide.profilePicture ? (
                          <img
                            src={guide.profilePicture}
                            alt={guide.name}
                            className={styles.avatarImg}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {guide.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className={styles.guideBasicInfo}>
                        <h3 className={styles.guideName}>{guide.name}</h3>
                        <div className={styles.guideRating}>
                          ⭐ {guide.rating?.toFixed(1) || 'N/A'} ({guide.reviewCount || 0} reviews)
                        </div>
                      </div>
                    </div>

                    <div className={styles.guideDetails}>
                      {guide.distance && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailIcon}>📍</span>
                          <span>{guide.distance.toFixed(1)} km away</span>
                        </div>
                      )}

                      {guide.languages && guide.languages.length > 0 && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailIcon}>🗣️</span>
                          <span>{guide.languages.join(', ')}</span>
                        </div>
                      )}

                      {guide.experienceYears && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailIcon}>🎓</span>
                          <span>{guide.experienceYears} years experience</span>
                        </div>
                      )}

                      {guide.pricePerHour && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailIcon}>💰</span>
                          <span>EGP {guide.pricePerHour}/hour</span>
                        </div>
                      )}
                    </div>

                    {guide.bio && (
                      <p className={styles.guideBio}>{guide.bio}</p>
                    )}

                    {guide.specializations && guide.specializations.length > 0 && (
                      <div className={styles.specializations}>
                        {guide.specializations.map((spec, index) => (
                          <span key={index} className={styles.specTag}>
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={styles.cardActions}>
                      <button
                        onClick={() =>
                          router.push(`/guides/${guide._id}`)
                        }
                        className={styles.viewProfileBtn}
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleSelectGuide(guide._id)}
                        disabled={selectGuideMutation.isPending}
                        className={styles.selectBtn}
                      >
                        {selectGuideMutation.isPending
                          ? 'Selecting...'
                          : 'Select Guide'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

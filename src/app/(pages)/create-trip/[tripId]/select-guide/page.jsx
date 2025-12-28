"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import styles from './SelectGuide.module.css';
import { useAuth } from '@/app/context/AuthContext';

export default function SelectGuidePage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId;
  const [toast, setToast] = useState(null);
  const auth = useAuth();

  console.log('SelectGuidePage - params:', params);
  console.log('SelectGuidePage - tripId:', tripId);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Check authentication and tripId
  useEffect(() => {
    if (!auth?.loading && !auth?.token) {
      router.push('/');
      return;
    }

    if (!tripId || tripId === 'undefined') {
      console.error('Invalid tripId:', tripId);
      router.push('/my-trips');
      return;
    }
  }, [router, tripId]);

  const [filters, setFilters] = useState({
    language: '',
    maxDistance: '',
    minRating: 0,
    sortBy: 'distance', // distance, rating, price
  });

  // Fetch trip details
  const {
    data: tripData,
    isLoading: loadingTrip,
    error: tripError,
  } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/tourist/trips/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      return response.data?.data?.trip || response.data?.data || null;
    },
    enabled: !!tripId,
  });

  // Fetch all guides
  const {
    data: allGuidesData,
    isLoading: loadingGuides,
    error: guidesError,
  } = useQuery({
    queryKey: ['all-guides'],
    queryFn: async () => {
      const response = await axios.get(
        '/api/tourist/guides',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      const guides = response.data?.data || [];
      // Log first guide to check field names
      if (guides.length > 0) {
        console.log('Guide data sample:', guides[0]);
        console.log('Available image fields:', {
          profilePicture: guides[0].profilePicture,
          profileImage: guides[0].profileImage,
          avatar: guides[0].avatar,
          image: guides[0].image,
          photo: guides[0].photo
        });
      }
      return guides;
    },
  });

  const isLoading = loadingTrip || loadingGuides;
  const error = tripError || guidesError;

  // Filter guides based on trip's provinceId
  const getFilteredGuides = () => {
    if (!tripData || !allGuidesData) return [];

    const tripProvinceId = tripData.provinceId || tripData.province?._id;

    if (!tripProvinceId) {
      console.log('No provinceId found in trip:', tripData);
      return allGuidesData;
    }

    // Filter guides by province
    const filteredByProvince = allGuidesData.filter(guide => {
      // Check if guide works in this province
      if (guide.provinces && Array.isArray(guide.provinces)) {
        return guide.provinces.some(p => p._id === tripProvinceId || p === tripProvinceId);
      }
      if (guide.province) {
        return guide.province._id === tripProvinceId || guide.province === tripProvinceId;
      }
      return false;
    });

    // Apply additional filters
    let filtered = filteredByProvince;

    if (filters.language) {
      filtered = filtered.filter(guide =>
        guide.languages?.includes(filters.language)
      );
    }

    if (filters.minRating > 0) {
      filtered = filtered.filter(guide =>
        (guide.rating || 0) >= filters.minRating
      );
    }

    // Sort guides
    if (filters.sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sortBy === 'price') {
      filtered.sort((a, b) => (a.pricePerHour || 0) - (b.pricePerHour || 0));
    }

    return filtered;
  };

  const guides = getFilteredGuides();
  const trip = tripData;

  // Select guide mutation
  const selectGuideMutation = useMutation({
    mutationFn: async (guideId) => {
      const response = await axios.post(
        `/api/tourist/trips/${tripId}/select-guide`,
        { guideId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      showToast('Guide selected successfully! Redirecting...', 'success');
      setTimeout(() => {
        router.push(`/my-trips/${tripId}`);
      }, 1500);
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Failed to select guide', 'error');
    },
  });

  const handleSelectGuide = async (guideId) => {
    selectGuideMutation.mutate(guideId);
  };

  // Show error if tripId is invalid
  if (!tripId || tripId === 'undefined') {
    return (
      <div className={styles.pageWrapper}>
        <section className={styles.headerSection}>
          <div className="container">
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>⚠️</div>
              <h2>Invalid Trip</h2>
              <p>Trip ID is missing or invalid. Please create a trip first.</p>
              <button onClick={() => router.push('/my-trips')} className={styles.backBtn}>
                Go to My Trips
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          <span className={styles.toastIcon}>
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span className={styles.toastMessage}>{toast.message}</span>
        </div>
      )}

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
              {trip.province && (
                <span>🗺️ {trip.province.name || 'Province not set'}</span>
              )}
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
                {guides.map((guide) => {
                  // Check for different possible field names for profile picture
                  const profileImage = guide.profilePicture || guide.profileImage || guide.avatar || guide.image || guide.photo;

                  return (
                    <div key={guide._id} className={styles.guideCard}>
                      <div className={styles.guideHeader}>
                        <div className={styles.guideAvatar}>
                          {profileImage ? (
                            <img
                              src={profileImage}
                              alt={guide.name}
                              className={styles.avatarImg}
                              onError={(e) => {
                                console.log('Failed to load image:', profileImage);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={styles.avatarPlaceholder}
                            style={{ display: profileImage ? 'none' : 'flex' }}
                          >
                            {guide.name?.charAt(0) || '?'}
                          </div>
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
                            <span>$ {guide.pricePerHour}/hour</span>
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
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

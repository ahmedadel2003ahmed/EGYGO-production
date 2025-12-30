"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Image from 'next/image';
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
  }, [router, tripId, auth?.loading, auth?.token]);

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
          <button onClick={() => router.push('/my-trips')} className={styles.backBtn}>
            ← Back to Trips
          </button>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Select Your Perfect Guide</h1>
            <p className={styles.pageSubtitle}>Browse and choose from our top-rated local experts for your trip.</p>
            
            {trip && (
              <div className={styles.tripSummaryCard}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryIcon}>📅</span>
                  <div className={styles.summaryText}>
                    <span className={styles.summaryLabel}>Date</span>
                    <span className={styles.summaryValue}>{new Date(trip.startAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryIcon}>⏱️</span>
                  <div className={styles.summaryText}>
                    <span className={styles.summaryLabel}>Duration</span>
                    <span className={styles.summaryValue}>{trip.totalDurationMinutes} min</span>
                  </div>
                </div>
                {trip.province && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryIcon}>🗺️</span>
                    <div className={styles.summaryText}>
                      <span className={styles.summaryLabel}>Location</span>
                      <span className={styles.summaryValue}>{trip.province.name || 'Egypt'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className={styles.filtersSection}>
        <div className="container">
          <div className={styles.filtersBar}>
            <div className={styles.filterTitle}>Filter Guides By:</div>
            
            <div className={styles.filterGroup}>
              <select
                value={filters.language}
                onChange={(e) =>
                  setFilters({ ...filters, language: e.target.value })
                }
                className={styles.filterSelect}
              >
                <option value="">🌐 All Languages</option>
                <option value="English">English</option>
                <option value="Arabic">Arabic</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Spanish">Spanish</option>
                <option value="Italian">Italian</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <select
                value={filters.minRating}
                onChange={(e) =>
                  setFilters({ ...filters, minRating: Number(e.target.value) })
                }
                className={styles.filterSelect}
              >
                <option value="0">⭐ Any Rating</option>
                <option value="4">⭐ 4+ Stars</option>
                <option value="4.5">⭐ 4.5+ Stars</option>
                <option value="5">⭐ 5 Stars</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value })
                }
                className={styles.filterSelect}
              >
                <option value="distance">📍 Nearest First</option>
                <option value="rating">⭐ Highest Rated</option>
                <option value="price">💰 Price: Low to High</option>
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
              <p>We couldn&apos;t find any guides matching your criteria in this area.</p>
              <button 
                onClick={() => setFilters({ language: '', maxDistance: '', minRating: 0, sortBy: 'distance' })}
                className={styles.resetBtn}
              >
                Clear Filters
              </button>
            </div>
          )}

          {!isLoading && !error && guides.length > 0 && (
            <>
              <div className={styles.resultsHeader}>
                <h2>Available Guides</h2>
                <span className={styles.resultBadge}>{guides.length} found</span>
              </div>

              <div className={styles.guidesGrid}>
                {guides.map((guide) => {
                  // ROBUST IMAGE RESOLUTION
                  // Prioritize url field if photo is an object, otherwise treat as string
                  const resolveImage = (src) => {
                    if (!src) return null;
                    if (typeof src === 'object' && src.url) return src.url;
                    if (typeof src === 'string' && src.trim().length > 0) return src;
                    return null;
                  };

                  const profileImage = 
                    resolveImage(guide.profilePicture) || 
                    resolveImage(guide.profileImage) || 
                    resolveImage(guide.avatar) || 
                    resolveImage(guide.image) || 
                    resolveImage(guide.photo);

                  return (
                    <div key={guide._id} className={styles.guideCard}>
                      <div className={styles.guideCardContent}>
                        <div className={styles.guideHeader}>
                          <div className={styles.guideAvatarWrapper}>
                            {profileImage ? (
                              <Image
                                src={profileImage}
                                alt={guide.name}
                                className={styles.avatarImg}
                                width={80}
                                height={80}
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  // Show placeholder sibling
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className={styles.avatarPlaceholder}
                              style={{ display: profileImage ? 'none' : 'flex' }}
                            >
                              {guide.name?.charAt(0) || '?'}
                            </div>
                            <div className={styles.verifiedBadge} title="Verified Guide">✓</div>
                          </div>
                          
                          <div className={styles.guideInfoMain}>
                            <h3 className={styles.guideName}>{guide.name}</h3>
                            <div className={styles.ratingRow}>
                              <span className={styles.starIcon}>⭐</span>
                              <span className={styles.ratingValue}>{guide.rating?.toFixed(1) || 'New'}</span>
                              <span className={styles.reviewCount}>({guide.reviewCount || 0} reviews)</span>
                            </div>
                            <div className={styles.priceTag}>
                              ${guide.pricePerHour}<span className={styles.priceUnit}>/hr</span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.guideBioSection}>
                          <p className={styles.guideBio}>{guide.bio || 'No bio available.'}</p>
                        </div>

                        <div className={styles.guideTagsWrapper}>
                           {guide.languages && guide.languages.length > 0 && (
                              <div className={styles.tagGroup}>
                                <span className={styles.tagIcon}>🗣️</span>
                                {guide.languages.slice(0, 3).map(lang => (
                                  <span key={lang} className={styles.langTag}>{lang}</span>
                                ))}
                                {guide.languages.length > 3 && <span className={styles.moreTag}>+{guide.languages.length - 3}</span>}
                              </div>
                           )}
                        </div>

                        <div className={styles.cardFooter}>
                           <div className={styles.footerDetail}>
                             <span className={styles.footerIcon}>📍</span>
                             <span>{guide.distance ? `${guide.distance.toFixed(1)} km away` : (guide.province?.name || 'Local')}</span>
                           </div>
                           <div className={styles.footerDetail}>
                             <span className={styles.footerIcon}>🎓</span>
                             <span>{guide.experienceYears ? `${guide.experienceYears}y exp` : 'Experienced'}</span>
                           </div>
                        </div>

                        <div className={styles.cardActions}>
                          <button
                            onClick={() => router.push(`/guides/${guide._id}`)}
                            className={styles.viewProfileBtn}
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => handleSelectGuide(guide._id)}
                            disabled={selectGuideMutation.isPending}
                            className={styles.selectBtn}
                          >
                            {selectGuideMutation.isPending ? 'Selecting...' : 'Select Guide'}
                          </button>
                        </div>
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

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import styles from './TripDetails.module.css';

export default function TripDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId;
  const queryClient = useQueryClient();
  const [guideFilters, setGuideFilters] = useState({
    language: '',
    maxDistanceKm: '',
  });

  // Debug logging
  useEffect(() => {
    console.log('TripDetailsPage mounted');
    console.log('Trip ID from params:', tripId);
    console.log('Full params:', params);
  }, [tripId, params]);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('laqtaha_token');
    if (!token) {
      console.log('No token found, redirecting to login');
      router.push('/login');
    }
  }, [router]);

  // Fetch trip details
  const {
    data: tripData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await axios.get(
        `http://localhost:5000/api/tourist/trips/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      console.log('Trip details API response:', response.data);
      console.log('Extracted trip data:', response.data?.data);
      return response.data?.data;
    },
    enabled: !!tripId,
  });

  // Fetch compatible guides (only if trip status is selecting_guide)
  const {
    data: guidesData = [],
    isLoading: guidesLoading,
  } = useQuery({
    queryKey: ['trip-guides', tripId, guideFilters],
    queryFn: async () => {
      const response = await axios.get(
        `http://localhost:5000/api/tourist/trips/${tripId}/guides`,
        {
          params: {
            language: guideFilters.language || undefined,
            maxDistanceKm: guideFilters.maxDistanceKm || undefined,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      return response.data?.data || [];
    },
    enabled: !!tripId && tripData?.status === 'selecting_guide',
  });

  // Cancel trip mutation
  const cancelTripMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `http://localhost:5000/api/tourist/trips/${tripId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trip', tripId]);
      alert('Trip cancelled successfully');
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({ rating, comment }) => {
      const response = await axios.post(
        `http://localhost:5000/api/tourist/trips/${tripId}/review`,
        { rating, comment },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trip', tripId]);
      alert('Review submitted successfully');
    },
  });

  // Select guide mutation
  const selectGuideMutation = useMutation({
    mutationFn: async (guideId) => {
      const response = await axios.post(
        `http://localhost:5000/api/tourist/trips/${tripId}/select-guide`,
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
      queryClient.invalidateQueries(['trip', tripId]);
      queryClient.invalidateQueries(['trip-guides', tripId]);
      alert('Guide selected successfully!');
    },
  });

  const handleSelectGuide = (guideId) => {
    if (window.confirm('Select this guide for your trip?')) {
      selectGuideMutation.mutate(guideId);
    }
  };

  const handleCancelTrip = () => {
    if (
      window.confirm(
        'Are you sure you want to cancel this trip? This action cannot be undone.'
      )
    ) {
      cancelTripMutation.mutate();
    }
  };

  const handleSubmitReview = () => {
    const rating = prompt('Rate this trip (1-5 stars):');
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      alert('Please enter a valid rating between 1 and 5');
      return;
    }

    const comment = prompt('Write your review:');
    if (!comment) return;

    submitReviewMutation.mutate({
      rating: Number(rating),
      comment,
    });
  };

  const trip = tripData?.trip || tripData;

  console.log('Trip data received:', tripData);
  console.log('Extracted trip:', trip);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);

  if (isLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading trip details...</p>
      </div>
    );
  }

  if (error || !trip) {
    console.log('Showing error state');
    console.log('Error object:', error);
    return (
      <div className={styles.errorWrapper}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>Trip Not Found</h2>
        <p>{error?.response?.data?.message || error?.message || 'Unable to load trip details'}</p>
        <button onClick={() => router.push('/my-trips')} className={styles.backBtn}>
          Go to My Trips
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending Guide', color: 'orange', icon: '⏳' },
      guide_selected: { label: 'Guide Selected', color: 'blue', icon: '👤' },
      negotiating: { label: 'Negotiating', color: 'purple', icon: '💬' },
      confirmed: { label: 'Confirmed', color: 'green', icon: '✅' },
      in_progress: { label: 'In Progress', color: 'teal', icon: '🚀' },
      completed: { label: 'Completed', color: 'gray', icon: '✔️' },
      cancelled: { label: 'Cancelled', color: 'red', icon: '❌' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`${styles.statusBadge} ${styles[`status${config.color}`]}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <section className={styles.headerSection}>
        <div className="container">
          <button onClick={() => router.push('/my-trips')} className={styles.backBtnHeader}>
            ← Back to My Trips
          </button>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Trip Details</h1>
            {getStatusBadge(trip.status)}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className={styles.contentSection}>
        <div className="container">
          <div className={styles.contentGrid}>
            {/* Main Info */}
            <div className={styles.mainCard}>
              <h2 className={styles.cardTitle}>Trip Information</h2>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>📅 Date & Time</div>
                  <div className={styles.infoValue}>
                    {new Date(trip.startAt).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>⏱️ Duration</div>
                  <div className={styles.infoValue}>
                    {Math.floor(trip.totalDurationMinutes / 60)}h {trip.totalDurationMinutes % 60}m
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>📍 Meeting Point</div>
                  <div className={styles.infoValue}>{trip.meetingAddress}</div>
                  {trip.meetingPoint && (
                    <a
                      href={`https://www.google.com/maps?q=${trip.meetingPoint.coordinates[1]},${trip.meetingPoint.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapLink}
                    >
                      🗺️ View on Map
                    </a>
                  )}
                </div>

                {trip.notes && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>📝 Notes</div>
                    <div className={styles.infoValue}>{trip.notes}</div>
                  </div>
                )}
              </div>

              {/* Itinerary */}
              {trip.itinerary && trip.itinerary.length > 0 && (
                <div className={styles.itinerarySection}>
                  <h3 className={styles.sectionTitle}>Itinerary</h3>
                  <div className={styles.itineraryList}>
                    {trip.itinerary.map((item, index) => (
                      <div key={index} className={styles.itineraryItem}>
                        <div className={styles.itineraryNumber}>{index + 1}</div>
                        <div className={styles.itineraryContent}>
                          <div className={styles.itineraryName}>
                            {item.placeId?.name || 'Unknown Place'}
                          </div>
                          <div className={styles.itineraryMeta}>
                            <span>⏱️ {item.visitDurationMinutes} min</span>
                            {item.ticketRequired && <span>🎫 Ticket Required</span>}
                            {item.notes && <span>📝 {item.notes}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guide Selection Section */}
              {trip.status === 'selecting_guide' && (
                <div className={styles.guideSelectionSection}>
                  <h3 className={styles.sectionTitle}>Select a Guide</h3>
                  
                  {/* Filters */}
                  <div className={styles.guideFilters}>
                    <div className={styles.filterGroup}>
                      <label>Language (Optional)</label>
                      <select
                        value={guideFilters.language}
                        onChange={(e) =>
                          setGuideFilters({ ...guideFilters, language: e.target.value })
                        }
                        className={styles.filterSelect}
                      >
                        <option value="">All Languages</option>
                        <option value="English">English</option>
                        <option value="Arabic">Arabic</option>
                        <option value="French">French</option>
                      </select>
                    </div>
                    <div className={styles.filterGroup}>
                      <label>Max Distance (km) (Optional)</label>
                      <select
                        value={guideFilters.maxDistanceKm}
                        onChange={(e) =>
                          setGuideFilters({ ...guideFilters, maxDistanceKm: e.target.value })
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
                  </div>

                  {/* Loading State */}
                  {guidesLoading && (
                    <div className={styles.loadingGuides}>
                      <div className={styles.smallSpinner}></div>
                      <p>Finding available guides...</p>
                    </div>
                  )}

                  {/* Empty State */}
                  {!guidesLoading && guidesData.length === 0 && (
                    <div className={styles.emptyGuidesState}>
                      <div className={styles.emptyIcon}>🔍</div>
                      <p>No compatible guides available. Try adjusting filters.</p>
                    </div>
                  )}

                  {/* Guides List */}
                  {!guidesLoading && guidesData.length > 0 && (
                    <div className={styles.guidesList}>
                      {guidesData.map((guide) => (
                        <div key={guide._id} className={styles.guideCard}>
                          <div className={styles.guideCardHeader}>
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
                            <div className={styles.guideHeaderInfo}>
                              <div className={styles.guideName}>{guide.name}</div>
                              <div className={styles.guideRating}>
                                ⭐ {guide.rating?.toFixed(1) || 'N/A'} ({guide.reviewCount || 0} reviews)
                              </div>
                            </div>
                          </div>

                          <div className={styles.guideDetails}>
                            {guide.languages && (
                              <div className={styles.detailItem}>
                                <span>🗣️ {guide.languages.join(', ')}</span>
                              </div>
                            )}
                            {guide.pricePerHour && (
                              <div className={styles.detailItem}>
                                <span>💰 EGP {guide.pricePerHour}/hour</span>
                              </div>
                            )}
                            {guide.experienceYears && (
                              <div className={styles.detailItem}>
                                <span>🎓 {guide.experienceYears} years experience</span>
                              </div>
                            )}
                          </div>

                          {guide.bio && (
                            <p className={styles.guideBio}>{guide.bio}</p>
                          )}

                          <button
                            onClick={() => handleSelectGuide(guide._id)}
                            disabled={selectGuideMutation.isPending}
                            className={styles.selectGuideBtn}
                          >
                            {selectGuideMutation.isPending
                              ? 'Selecting...'
                              : 'Select Guide'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className={styles.sidebar}>
              {/* Guide Info */}
              {trip.guide && (
                <div className={styles.sidebarCard}>
                  <h3 className={styles.cardTitle}>Your Guide</h3>
                  <div className={styles.guideInfo}>
                    <div className={styles.guideAvatar}>
                      {trip.guide.profilePicture ? (
                        <img
                          src={trip.guide.profilePicture}
                          alt={trip.guide.name}
                          className={styles.avatarImg}
                        />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {trip.guide.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className={styles.guideDetails}>
                      <div className={styles.guideName}>{trip.guide.name}</div>
                      {trip.guide.rating && (
                        <div className={styles.guideRating}>
                          ⭐ {trip.guide.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/guides/${trip.guide._id}`)}
                    className={styles.viewProfileBtn}
                  >
                    View Profile
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className={styles.sidebarCard}>
                <h3 className={styles.cardTitle}>Actions</h3>
                <div className={styles.actionsList}>
                  {trip.status === 'pending' && (
                    <button
                      onClick={() =>
                        router.push(`/create-trip/${tripId}/select-guide`)
                      }
                      className={styles.actionBtn}
                    >
                      Select Guide
                    </button>
                  )}

                  {['pending', 'guide_selected', 'negotiating'].includes(
                    trip.status
                  ) && (
                    <button
                      onClick={handleCancelTrip}
                      disabled={cancelTripMutation.isPending}
                      className={styles.cancelBtn}
                    >
                      {cancelTripMutation.isPending ? 'Cancelling...' : 'Cancel Trip'}
                    </button>
                  )}

                  {trip.status === 'completed' && !trip.review && (
                    <button
                      onClick={handleSubmitReview}
                      disabled={submitReviewMutation.isPending}
                      className={styles.reviewBtn}
                    >
                      {submitReviewMutation.isPending
                        ? 'Submitting...'
                        : 'Write Review'}
                    </button>
                  )}
                </div>
              </div>

              {/* Review */}
              {trip.review && (
                <div className={styles.sidebarCard}>
                  <h3 className={styles.cardTitle}>Your Review</h3>
                  <div className={styles.reviewCard}>
                    <div className={styles.reviewRating}>
                      {'⭐'.repeat(trip.review.rating)}
                    </div>
                    <p className={styles.reviewComment}>{trip.review.comment}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

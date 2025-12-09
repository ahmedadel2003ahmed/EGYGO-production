"use client";

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import styles from './TripDetails.module.css';

export default function TripDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId;
  const queryClient = useQueryClient();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('laqtaha_token');
    if (!token) {
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
            Authorization: `Bearer ${localStorage.getItem('laqtaha_token')}`,
          },
        }
      );
      return response.data?.data;
    },
    enabled: !!tripId,
  });

  // Cancel trip mutation
  const cancelTripMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `http://localhost:5000/api/tourist/trips/${tripId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('laqtaha_token')}`,
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
            Authorization: `Bearer ${localStorage.getItem('laqtaha_token')}`,
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

  const trip = tripData?.trip;

  if (isLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading trip details...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className={styles.errorWrapper}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>Trip Not Found</h2>
        <p>{error?.response?.data?.message || 'Unable to load trip details'}</p>
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

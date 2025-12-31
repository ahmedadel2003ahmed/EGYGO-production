"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import axios from 'axios';
import styles from './TripDetails.module.css';
import { useAuth } from '@/app/context/AuthContext';
import socketTripService from '@/services/socketTripService';
import ReviewModal from '@/components/trip/ReviewModal';

export default function TripDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId;
  const queryClient = useQueryClient();
  const [guideFilters, setGuideFilters] = useState({
    language: '',
  });
  const auth = useAuth();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [toast, setToast] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };


  // Debug logging
  useEffect(() => {
    console.log('TripDetailsPage mounted');
    console.log('Trip ID from params:', tripId);
    console.log('Full params:', params);
  }, [tripId, params]);

  // Redirect to home if not authenticated (this page requires auth)
  useEffect(() => {
    if (!auth?.loading && !auth?.token) {
      router.push('/');
    }
  }, [auth?.loading, auth?.token, router]);

  // Monitor socket connection status
  useEffect(() => {
    const checkConnection = setInterval(() => {
      setIsSocketConnected(socketTripService.isConnected());
    }, 1000);

    return () => clearInterval(checkConnection);
  }, []);

  // Handle real-time trip status updates
  const handleTripStatusUpdate = useCallback((payload) => {
    console.log('📡 [TripDetails] Received trip status update:', payload);

    // Only process updates for this trip
    if (payload.tripId !== tripId) {
      console.log('[TripDetails] Update is for different trip, ignoring');
      return;
    }

    // Update the trip data in cache
    queryClient.setQueryData(['trip', tripId], (oldData) => {
      if (!oldData) return oldData;

      const updatedTrip = {
        ...(oldData.trip || oldData),
        status: payload.status,
        paymentStatus: payload.paymentStatus || (oldData.trip || oldData).paymentStatus,
        negotiatedPrice: payload.negotiatedPrice || (oldData.trip || oldData).negotiatedPrice, // Capture price
        confirmedAt: payload.confirmedAt || (oldData.trip || oldData).confirmedAt,
        cancelledAt: payload.cancelledAt || (oldData.trip || oldData).cancelledAt,
        cancelledBy: payload.cancelledBy || (oldData.trip || oldData).cancelledBy,
      };

      // Maintain the same structure as the original data
      return oldData.trip ? { ...oldData, trip: updatedTrip } : updatedTrip;
    });

    // Immediately refetch to ensure we have the complete latest data (including any fields not in socket payload)
    queryClient.invalidateQueries(['trip', tripId]);

    console.log(`✅ [TripDetails] Trip status updated to: ${payload.status}`);
  }, [tripId, queryClient]);

  // Setup real-time updates via Socket.IO
  useEffect(() => {
    if (!tripId || !isSocketConnected) {
      return;
    }

    console.log('[TripDetails] Setting up real-time updates for trip:', tripId);

    // Join the trip room
    socketTripService.joinTripRoom(tripId);

    // Register status update listener
    socketTripService.onTripStatusUpdate(handleTripStatusUpdate);

    // Optional: Handle room join confirmation
    const handleRoomJoined = (data) => {
      console.log('✅ [TripDetails] Joined trip room:', data);
    };
    socketTripService.onTripRoomJoined(handleRoomJoined);

    // Cleanup
    return () => {
      console.log('[TripDetails] Cleaning up socket listeners for trip:', tripId);
      socketTripService.offTripStatusUpdate(handleTripStatusUpdate);
      socketTripService.offTripRoomJoined(handleRoomJoined);
      socketTripService.leaveTripRoom(tripId);
    };
  }, [tripId, isSocketConnected, handleTripStatusUpdate]);

  // Fallback: Poll for status changes to ensure data consistency
  // This ensures updates happen even if Socket.IO events are missed or blocked
  useEffect(() => {
    if (!tripId) return;

    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries(['trip', tripId]);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [tripId, queryClient]);

  // Fetch trip details
  const {
    data: tripData,
    isLoading,
    error,
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
      console.log('Trip details API response:', response.data);
      console.log('Extracted trip data:', response.data?.data);
      return response.data?.data;
    },
    enabled: !!tripId,
  });

  // Extract trip from response data
  const trip = tripData?.trip || tripData;

  // Fetch selected guide details if guideId exists but guide object doesn't
  const {
    data: selectedGuideData,
    isLoading: selectedGuideLoading,
  } = useQuery({
    queryKey: ['selected-guide', trip?.guideId],
    queryFn: async () => {
      if (!trip?.guideId) return null;
      const response = await axios.get(
        `/api/tourist/guides/${trip.guideId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      return response.data?.data;
    },
    enabled: !!trip?.guideId && !trip?.guide,
  });

  // Use the populated guide or fetch it separately
  const tripGuide = trip?.guide || selectedGuideData;

  // Fetch all guides and filter based on trip itinerary provinces
  const {
    data: guidesData = [],
    isLoading: guidesLoading,
  } = useQuery({
    queryKey: ['guides-for-trip', tripId, guideFilters],
    queryFn: async () => {
      // First, get all guides
      const guidesResponse = await axios.get(
        '/api/tourist/guides',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      let guides = guidesResponse.data?.data || [];

      // Extract unique provinces from trip itinerary
      const tripProvinces = new Set();
      if (tripData?.itinerary && Array.isArray(tripData.itinerary)) {
        tripData.itinerary.forEach(item => {
          if (item.placeId?.province?._id) {
            tripProvinces.add(item.placeId.province._id);
          }
        });
      }

      // Filter guides by provinces if we have any
      if (tripProvinces.size > 0) {
        guides = guides.filter(guide => {
          // Check if guide works in any of the trip provinces
          if (guide.provinces && Array.isArray(guide.provinces)) {
            return guide.provinces.some(p => tripProvinces.has(p._id));
          }
          if (guide.province?._id) {
            return tripProvinces.has(guide.province._id);
          }
          return false;
        });
      }

      // Apply language filter if selected
      if (guideFilters.language) {
        guides = guides.filter(guide =>
          guide.languages?.includes(guideFilters.language)
        );
      }

      return guides;
    },
    enabled: !!tripId && !!tripData && !tripGuide,
  });

  // Cancel trip mutation
  const cancelTripMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `/api/tourist/trips/${tripId}/cancel`,
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
      showToast('Trip cancelled successfully');
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({ rating, comment }) => {
      const response = await axios.post(
        `/api/tourist/trips/${tripId}/review`,
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
      showToast('Review submitted successfully');
    },
  });

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
      // Invalidate all related queries to refetch updated data
      queryClient.invalidateQueries(['trip', tripId]);
      queryClient.invalidateQueries(['guides-for-trip', tripId]);
      queryClient.invalidateQueries(['selected-guide']);
      showToast('Guide selected successfully!');
    },
  });

  const handleSelectGuide = (guideId) => {
    if (window.confirm('Select this guide for your trip?')) {
      selectGuideMutation.mutate(guideId);
    }
  };

  // Initiate video call mutation
  const initiateCallMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `/api/trips/${tripId}/calls/initiate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Navigate to call page
      router.push(`/call/${data.callId}`);
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || 'Failed to start call';
      console.error('Call initiation error:', err.response?.data);

      // If trip is already in_call, try to get the existing call
      if (errorMsg.includes('in_call')) {
        showToast('This trip already has an active call. Please refresh the page or check your call history.', 'error');
      } else {
        showToast(errorMsg, 'error');
      }
    },
  });

  // Create payment checkout mutation
  const createCheckoutMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `/api/tourist/trips/${tripId}/create-checkout-session`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data?.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        showToast('Failed to get checkout URL', 'error');
      }
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to create checkout session', 'error');
    },
  });

  // Start Trip Mutation (Guide Only)
  const startTripMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `/api/trips/${tripId}/start`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trip', tripId]);
      showToast('Trip started successfully! 🚀');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to start trip', 'error');
    },
  });

  // Complete Trip Mutation (Guide Only)
  const endTripMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `/api/trips/${tripId}/end`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trip', tripId]);
      showToast('Trip completed successfully! 🎉');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to complete trip', 'error');
    },
  });

  const handleStartCall = () => {
    initiateCallMutation.mutate();
  };

  const handlePayNow = () => {
    createCheckoutMutation.mutate();
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

  const handleStartTrip = () => {
    if (window.confirm('Are you ready to start this trip?')) {
      startTripMutation.mutate();
    }
  };

  const handleEndTrip = () => {
    if (window.confirm('Are you sure you want to mark this trip as completed?')) {
      endTripMutation.mutate();
    }
  };

  const openReviewModal = () => {
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = (reviewData) => {
    submitReviewMutation.mutate(reviewData);
    setIsReviewModalOpen(false);
  };

  console.log('Trip data received:', tripData);
  console.log('Extracted trip:', trip);
  console.log('Trip guide:', trip?.guide);
  console.log('Trip guideId:', trip?.guideId);
  console.log('Trip status:', trip?.status);
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
      awaiting_call: { label: 'Ready for Call', color: 'purple', icon: '📹' },
      in_call: { label: 'In Video Call', color: 'green', icon: '🎥' },
      pending_confirmation: { label: 'Awaiting Guide', color: 'yellow', icon: '⏰' },
      awaiting_payment: { label: 'Payment Required', color: 'orange', icon: '💳' },
      negotiating: { label: 'Negotiating', color: 'purple', icon: '💬' },
      confirmed: { label: 'Confirmed', color: 'green', icon: '✅' },
      upcoming: { label: 'Upcoming', color: 'indigo', icon: '🔜' },
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

  // Check if current user is the assigned guide
  const isGuide = auth.user?._id && (
    auth.user._id === trip.guide?._id ||
    auth.user._id === trip.guideId
  );

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

      {/* Real-time Connection Indicator */}
      {isSocketConnected && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 1000,
          background: '#10b981',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#fff',
            animation: 'pulse 2s infinite'
          }}></span>
          Real-time updates active
        </div>
      )}


      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
        isSubmitting={submitReviewMutation.isPending}
      />

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
              {!tripGuide && !trip.guideId && trip.status !== 'cancelled' && trip.status !== 'completed' && trip.status !== 'awaiting_call' && (
                <div className={styles.guideSelectionSection}>
                  <h3 className={styles.sectionTitle}>Select a Guide</h3>

                  {/* Filters */}
                  <div className={styles.guideFilters}>
                    <div className={styles.filterGroup}>
                      <label>Filter by Language</label>
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
                        <option value="German">German</option>
                        <option value="Spanish">Spanish</option>
                        <option value="Italian">Italian</option>
                      </select>
                    </div>
                  </div>

                  {/* Province Info */}
                  {tripData?.itinerary && tripData.itinerary.length > 0 && (
                    <div className={styles.provinceInfo}>
                      <p className={styles.infoText}>
                        📍 Showing guides available in: {' '}
                        <strong>
                          {Array.from(
                            new Set(
                              tripData.itinerary
                                .map(item => item.placeId?.province?.name)
                                .filter(Boolean)
                            )
                          ).join(', ') || 'your selected areas'}
                        </strong>
                      </p>
                    </div>
                  )}

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
                      <h3>No Guides Available</h3>
                      <p>
                        {guideFilters.language
                          ? 'No guides found with the selected language filter. Try selecting "All Languages".'
                          : 'No guides are available in the governorates where your trip destinations are located.'}
                      </p>
                      {tripData?.itinerary && tripData.itinerary.length === 0 && (
                        <p className={styles.warningText}>
                          ⚠️ Your trip doesnt have any destinations yet. Please add destinations to find suitable guides.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Guides List */}
                  {!guidesLoading && guidesData.length > 0 && (
                    <div className={styles.guidesList}>
                      {guidesData.map((guide) => (
                        <div key={guide._id} className={styles.guideCard}>
                          <div className={styles.guideCardHeader}>
                            <div className={styles.guideAvatar} style={{ position: 'relative' }}>
                              {guide.profilePicture ? (
                                <Image
                                  src={guide.profilePicture}
                                  alt={guide.name}
                                  fill
                                  className={styles.avatarImg}
                                  sizes="50px"
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
                                <span>💰 $ {guide.pricePerHour}/hour</span>
                              </div>
                            )}
                            {(guide.provinces?.length > 0 || guide.province) && (
                              <div className={styles.detailItem}>
                                <span>📍 {guide.provinces?.map(p => p.name).join(', ') || guide.province?.name}</span>
                              </div>
                            )}
                            {guide.totalTrips > 0 && (
                              <div className={styles.detailItem}>
                                <span>🎯 {guide.totalTrips} trips completed</span>
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
              {tripGuide && (
                <div className={styles.sidebarCard}>
                  <h3 className={styles.cardTitle}>Your Guide</h3>
                  <div className={styles.guideInfo}>
                    <div className={styles.guideAvatar} style={{ position: 'relative' }}>
                      {tripGuide.photo?.url || tripGuide.profilePicture ? (
                        <Image
                          src={tripGuide.photo?.url || tripGuide.profilePicture}
                          alt={tripGuide.name}
                          fill
                          className={styles.avatarImg}
                          sizes="64px"
                        />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {tripGuide.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className={styles.guideDetails}>
                      <div className={styles.guideName}>{tripGuide.name}</div>
                      {tripGuide.rating && (
                        <div className={styles.guideRating}>
                          ⭐ {tripGuide.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/guides/${tripGuide._id}`)}
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

                  {(trip.status === 'awaiting_call' || trip.status === 'in_call') && tripGuide && (
                    <button
                      onClick={handleStartCall}
                      disabled={initiateCallMutation.isPending}
                      className={`${styles.actionBtn} ${styles.callBtn}`}
                    >
                      {initiateCallMutation.isPending ? 'Starting Call...' : trip.status === 'in_call' ? '📹 Rejoin Video Call' : '📹 Start Video Call'}
                    </button>
                  )}

                  {(trip.status === 'pending_confirmation' || trip.status === 'awaiting_payment') && (
                    <>
                      {trip.negotiatedPrice ? (
                        <>
                          <div className={styles.priceInfo}>
                            <span className={styles.priceLabel}>Negotiated Price:</span>
                            <span className={styles.priceValue}>$ {trip.negotiatedPrice}</span>
                          </div>
                          {!isGuide && (
                            <button
                              onClick={handlePayNow}
                              disabled={createCheckoutMutation.isPending}
                              className={`${styles.actionBtn} ${styles.payBtn}`}
                            >
                              {createCheckoutMutation.isPending ? 'Processing...' : '💳 Pay Now'}
                            </button>
                          )}
                          {isGuide && (
                            <div className={styles.waitingText}>
                              ⏳ Waiting for payment...
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={styles.waitingText}>
                          ⏳ {isGuide ? 'Please set a price via call/chat' : 'Waiting for guide to set price...'}
                        </div>
                      )}
                    </>
                  )}

                  {/* Guide Actions */}
                  {isGuide && (
                    <>
                      {trip.status === 'upcoming' && (
                        <div className={styles.guideActionBox}>
                          <p className={styles.guideActionText}>Trip is starting soon!</p>
                          <button
                            onClick={handleStartTrip}
                            disabled={startTripMutation.isPending}
                            className={`${styles.actionBtn} ${styles.startTripBtn}`}
                            style={{ backgroundColor: '#10b981', color: 'white' }}
                          >
                            {startTripMutation.isPending ? 'Starting...' : '🚀 Start Trip'}
                          </button>
                        </div>
                      )}

                      {trip.status === 'in_progress' && (
                        <div className={styles.guideActionBox}>
                          <p className={styles.guideActionText}>Trip is in progress</p>
                          <button
                            onClick={handleEndTrip}
                            disabled={endTripMutation.isPending}
                            className={`${styles.actionBtn} ${styles.completeTripBtn}`}
                            style={{ backgroundColor: '#3b82f6', color: 'white' }}
                          >
                            {endTripMutation.isPending ? 'Completing...' : '✅ Complete Trip'}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Tourist Actions */}
                  {!isGuide && trip.status === 'completed' && !trip.review && (
                    <button
                      onClick={openReviewModal}
                      className={`${styles.actionBtn} ${styles.reviewBtn}`}
                      style={{ backgroundColor: '#f59e0b', color: 'white' }}
                    >
                      ⭐ Leave a Review
                    </button>
                  )}

                  {!isGuide && trip.status === 'completed' && trip.review && (
                    <div className={styles.reviewedBadge}>
                      ✓ You reviewed this trip
                    </div>
                  )}

                  {trip.status === 'confirmed' && trip.paymentStatus === 'paid' && (
                    <div className={styles.successMessage}>
                      <div className={styles.successIcon}>✅</div>
                      <div className={styles.successContent}>
                        <h4 className={styles.successTitle}>Trip Confirmed!</h4>
                        <p className={styles.successText}>
                          Your payment has been processed successfully.
                        </p>
                        {trip.negotiatedPrice && (
                          <div className={styles.priceInfo}>
                            <span className={styles.priceLabel}>Amount Paid:</span>
                            <span className={styles.priceValue}>$ {trip.negotiatedPrice}</span>
                          </div>
                        )}
                        <p className={styles.successNote}>
                          Your guide will contact you before the trip.
                        </p>
                      </div>
                    </div>
                  )}

                  {['pending', 'guide_selected', 'negotiating', 'awaiting_call'].includes(trip.status) && (
                    <button
                      onClick={handleCancelTrip}
                      disabled={cancelTripMutation.isPending}
                      className={styles.cancelBtn}
                    >
                      {cancelTripMutation.isPending ? 'Cancelling...' : 'Cancel Trip'}
                    </button>
                  )}
                </div>
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
      </section >
    </div >
  );
}

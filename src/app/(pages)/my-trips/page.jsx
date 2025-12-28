"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import styles from './MyTrips.module.css';
import TripModal from '@/components/trip/TripModal';
import { useAuth } from '@/app/context/AuthContext';
import socketTripService from '@/services/socketTripService';

export default function MyTripsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const auth = useAuth();
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Governorate lookup map
  const GOVERNORATE_MAP = {
    '6935efa247a0b161dbdeee4e': 'Alexandria',
    '6935efa347a0b161dbdeee50': 'Aswan',
    '6935efa747a0b161dbdeee59': 'Beheira',
    '6935efaa47a0b161dbdeee62': 'Beni Suef',
    '6935efa247a0b161dbdeee4c': 'Cairo',
    '6935efa847a0b161dbdeee5d': 'Damietta',
    '6935efaa47a0b161dbdeee63': 'Fayoum',
    '6935efa847a0b161dbdeee5b': 'Gharbia',
    '6935efa247a0b161dbdeee4d': 'Giza',
    '6935efa747a0b161dbdeee58': 'Ismailia',
    '6935efa847a0b161dbdeee5a': 'Kafr El Sheikh',
    '6935efa347a0b161dbdeee4f': 'Luxor',
    '6935efaa47a0b161dbdeee64': 'Matrouh',
    '6935efaa47a0b161dbdeee65': 'North Sinai',
    '6935efa647a0b161dbdeee55': 'Qalyubia',
    '6935efa947a0b161dbdeee61': 'Qena',
    '6935efa447a0b161dbdeee51': 'Red Sea',
    '6935efa547a0b161dbdeee54': 'Sharqia',
    '6935efa747a0b161dbdeee57': 'Suez',
  };

  // Fetch user's trips (only if authenticated)
  // Replaced useQuery with useSuspenseQuery to trigger Global Loading State
  const { data: trips } = useSuspenseQuery({
    queryKey: ['my-trips'],
    queryFn: async () => {
      console.time('fetchMyTrips');
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.timeEnd('fetchMyTrips');
        return [];
      }

      try {
        const response = await axios.get(
          '/api/tourist/trips',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const tripsData = response.data?.data || [];
        console.log('Trips data:', tripsData);
        console.timeEnd('fetchMyTrips');
        return tripsData;
      } catch (error) {
        console.timeEnd('fetchMyTrips');
        console.error('Failed to fetch trips:', error);
        throw error; // Throw error to trigger error boundary
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Monitor socket connection status
  useEffect(() => {
    const checkConnection = setInterval(() => {
      setIsSocketConnected(socketTripService.isConnected());
    }, 1000);

    return () => clearInterval(checkConnection);
  }, []);

  // Handle real-time trip status updates for all trips
  const handleTripStatusUpdate = useCallback((payload) => {
    console.log('📡 [MyTrips] Received trip status update:', payload);

    // Update the trips list in cache
    queryClient.setQueryData(['my-trips'], (oldTrips) => {
      if (!oldTrips || !Array.isArray(oldTrips)) return oldTrips;

      return oldTrips.map((trip) => {
        if (trip._id === payload.tripId) {
          console.log(`✅ [MyTrips] Updating trip ${trip._id} status to: ${payload.status}`);
          return {
            ...trip,
            status: payload.status,
            paymentStatus: payload.paymentStatus || trip.paymentStatus,
            confirmedAt: payload.confirmedAt || trip.confirmedAt,
            cancelledAt: payload.cancelledAt || trip.cancelledAt,
            cancelledBy: payload.cancelledBy || trip.cancelledBy,
          };
        }
        return trip;
      });
    });
  }, [queryClient]);

  // Setup real-time updates for all user trips
  useEffect(() => {
    if (!isSocketConnected || !trips || trips.length === 0) {
      return;
    }

    console.log('[MyTrips] Setting up real-time updates for trips:', trips.map(t => t._id));

    // Join all trip rooms
    trips.forEach((trip) => {
      socketTripService.joinTripRoom(trip._id);
    });

    // Register status update listener
    socketTripService.onTripStatusUpdate(handleTripStatusUpdate);

    // Cleanup
    return () => {
      console.log('[MyTrips] Cleaning up socket listeners');
      socketTripService.offTripStatusUpdate(handleTripStatusUpdate);

      // Leave all trip rooms
      trips.forEach((trip) => {
        socketTripService.leaveTripRoom(trip._id);
      });
    };
  }, [trips, isSocketConnected, handleTripStatusUpdate]);

  // WORKAROUND: Poll for status changes (since CORS may block Socket.IO events)
  // This is a temporary fix until backend adds port 3001 to CORS whitelist
  useEffect(() => {
    if (!trips || trips.length === 0) return;

    const pollInterval = setInterval(() => {
      console.log('[MyTrips] Polling for status changes...');
      queryClient.invalidateQueries(['my-trips']);
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [trips?.length, queryClient]);

  const filterTrips = (status) => {
    if (status === 'all') return trips;
    if (status === 'upcoming')
      return trips.filter((t) =>
        ['pending', 'guide_selected', 'negotiating', 'confirmed'].includes(t.status)
      );
    if (status === 'active')
      return trips.filter((t) => t.status === 'in_progress');
    if (status === 'past')
      return trips.filter((t) => ['completed', 'cancelled'].includes(t.status));
    return trips.filter((t) => t.status === status);
  };

  const filteredTrips = filterTrips(activeTab);

  const handleTripCreated = () => {
    // Refetch trips after creating a new one
    queryClient.invalidateQueries(['my-trips']);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'orange', icon: '⏳' },
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
    <>
      <TripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTripCreated}
      />

      <div className={styles.pageWrapper}>
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

        {/* Header */}
        <section className={styles.headerSection}>
          <div className="container">
            <div className={styles.headerContent}>
              <div>
                <h1 className={styles.pageTitle}>My Trips</h1>
                <p className={styles.pageSubtitle}>Manage and track your travel experiences</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className={styles.createBtn}
              >
                + Create New Trip
              </button>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className={styles.tabsSection}>
          <div className="container">
            <div className={styles.tabs}>
              {[
                { key: 'all', label: 'All Trips' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'active', label: 'Active' },
                { key: 'past', label: 'Past' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''
                    }`}
                >
                  {tab.label}
                  <span className={styles.tabCount}>
                    {filterTrips(tab.key).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className={styles.contentSection}>
          <div className="container">
            {/* Suspense handles loading state now, so we remove the explicit isLoading check */}

            {filteredTrips.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  {activeTab === 'all' ? '✈️' : '🔍'}
                </div>
                <h3>
                  {activeTab === 'all'
                    ? 'No trips yet'
                    : `No ${activeTab} trips`}
                </h3>
                <p>
                  {activeTab === 'all'
                    ? 'Create your first trip to start exploring Egypt!'
                    : `You don't have any ${activeTab} trips.`}
                </p>
                {activeTab === 'all' && (
                  <button
                    onClick={() => {
                      if (!auth?.token) {
                        auth?.requireAuth?.(() => setIsModalOpen(true));
                      } else {
                        setIsModalOpen(true);
                      }
                    }}
                    className={styles.emptyActionBtn}
                  >
                    Create Your First Trip
                  </button>
                )}
              </div>
            )}

            {filteredTrips.length > 0 && (
              <div className={styles.tripsGrid}>
                {filteredTrips.map((trip) => (
                  <div key={trip._id} className={styles.tripCard}>
                    <div className={styles.tripCardHeader}>
                      {getStatusBadge(trip.status)}
                      <span className={styles.tripDate}>
                        {new Date(trip.startAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className={styles.tripCardBody}>
                      <div className={styles.tripMainInfo}>

                        {(trip.province || trip.provinceId || trip.provinces) && (
                          <div className={styles.tripInfoRow}>
                            <span className={styles.infoIcon}>🏛️</span>
                            <div className={styles.infoContent}>
                              <span className={styles.infoLabel}>Governorate</span>
                              <span className={styles.infoText}>
                                {(() => {
                                  // Handle different API response structures
                                  // 1. Check if province is populated with name
                                  if (trip.province?.name) return trip.province.name;
                                  // 2. Check if province is a string name
                                  if (typeof trip.province === 'string' && trip.province.length < 30) return trip.province;
                                  // 3. Check if provinceId is populated with name
                                  if (trip.provinceId?.name) return trip.provinceId.name;
                                  // 4. Check if provinceId is a string ID and map it to name
                                  if (typeof trip.provinceId === 'string') {
                                    const provinceName = GOVERNORATE_MAP[trip.provinceId];
                                    if (provinceName) return provinceName;
                                  }
                                  // 5. Check if provinces array exists
                                  if (trip.provinces && trip.provinces.length > 0) {
                                    const firstProvince = trip.provinces[0];
                                    if (firstProvince?.name) return firstProvince.name;
                                    if (typeof firstProvince === 'string') {
                                      const mapped = GOVERNORATE_MAP[firstProvince];
                                      if (mapped) return mapped;
                                      if (firstProvince.length < 30) return firstProvince;
                                    }
                                  }
                                  return 'Not specified';
                                })()}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className={styles.tripInfoRow}>
                          <span className={styles.infoIcon}>📅</span>
                          <div className={styles.infoContent}>
                            <span className={styles.infoLabel}>Date & Time</span>
                            <span className={styles.infoText}>
                              {new Date(trip.startAt).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                              {' at '}
                              {new Date(trip.startAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </span>
                          </div>
                        </div>

                        <div className={styles.tripInfoRow}>
                          <span className={styles.infoIcon}>⏱️</span>
                          <div className={styles.infoContent}>
                            <span className={styles.infoLabel}>Duration</span>
                            <span className={styles.infoText}>
                              {Math.floor(trip.totalDurationMinutes / 60)} hour{Math.floor(trip.totalDurationMinutes / 60) !== 1 ? 's' : ''}{' '}
                              {trip.totalDurationMinutes % 60 > 0 && `${trip.totalDurationMinutes % 60} min`}
                            </span>
                          </div>
                        </div>


                        <div className={styles.tripInfoRow}>
                          <span className={styles.infoIcon}>📍</span>
                          <div className={styles.infoContent}>
                            <span className={styles.infoLabel}>Meeting Point</span>
                            <span className={styles.infoText}>
                              {trip.meetingAddress?.substring(0, 60)}
                              {trip.meetingAddress?.length > 60 ? '...' : ''}
                            </span>
                          </div>
                        </div>


                      </div>

                      {trip.guide && (
                        <div
                          className={styles.guidePreview}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (trip.guide._id) {
                              router.push(`/guides/${trip.guide._id}`);
                            }
                          }}
                          style={{ cursor: trip.guide._id ? 'pointer' : 'default' }}
                        >
                          <div className={styles.guideAvatar}>
                            {(trip.guide.photo?.url || trip.guide.profilePicture) ? (
                              <img
                                src={trip.guide.photo?.url || trip.guide.profilePicture}
                                alt={trip.guide.name}
                                className={styles.avatarImg}
                              />
                            ) : (
                              <div className={styles.avatarPlaceholder}>
                                {trip.guide.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className={styles.guideInfo}>
                            <div className={styles.guideName}>
                              {trip.guide.name}
                            </div>
                            {trip.guide.rating && (
                              <div className={styles.guideRating}>
                                ⭐ {trip.guide.rating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {trip.itinerary && trip.itinerary.length > 0 && (
                        <div className={styles.itineraryPreview}>
                          <span className={styles.itineraryLabel}>
                            📋 {trip.itinerary.length} place
                            {trip.itinerary.length !== 1 ? 's' : ''} planned
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={styles.tripCardFooter}>
                      <button
                        onClick={() => router.push(`/my-trips/${trip._id}`)}
                        className={styles.viewDetailsBtn}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

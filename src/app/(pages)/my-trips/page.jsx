"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import styles from './MyTrips.module.css';
import TripModal from '@/components/trip/TripModal';

export default function MyTripsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Fetch user's trips
  const {
    data: trips = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['my-trips'],
    queryFn: async () => {
      try {
        const response = await axios.get(
          'http://localhost:5000/api/tourist/trips',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );
        const tripsData = response.data?.data || [];
        console.log('Trips data:', tripsData);
        if (tripsData.length > 0) {
          console.log('First trip province data:', {
            province: tripsData[0].province,
            provinceId: tripsData[0].provinceId,
            provinces: tripsData[0].provinces
          });
        }
        return tripsData;
      } catch (error) {
        console.error('Failed to fetch trips:', error);
        return [];
      }
    },
  });

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
                className={`${styles.tab} ${
                  activeTab === tab.key ? styles.tabActive : ''
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
          {isLoading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading your trips...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>⚠️</div>
              <p>Failed to load trips. Please try again.</p>
            </div>
          )}

          {!isLoading && !error && filteredTrips.length === 0 && (
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
                  onClick={() => setIsModalOpen(true)}
                  className={styles.emptyActionBtn}
                >
                  Create Your First Trip
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && filteredTrips.length > 0 && (
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

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import styles from './MyTrips.module.css';

export default function MyTripsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('laqtaha_token');
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
              Authorization: `Bearer ${localStorage.getItem('laqtaha_token')}`,
            },
          }
        );
        return response.data?.data || [];
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
              onClick={() => router.push('/create-trip')}
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
                  onClick={() => router.push('/create-trip')}
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
                        <span className={styles.infoText}>
                          {new Date(trip.startAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className={styles.tripInfoRow}>
                        <span className={styles.infoIcon}>⏱️</span>
                        <span className={styles.infoText}>
                          {Math.floor(trip.totalDurationMinutes / 60)}h{' '}
                          {trip.totalDurationMinutes % 60}m
                        </span>
                      </div>
                      <div className={styles.tripInfoRow}>
                        <span className={styles.infoIcon}>📍</span>
                        <span className={styles.infoText}>
                          {trip.meetingAddress?.substring(0, 50)}
                          {trip.meetingAddress?.length > 50 ? '...' : ''}
                        </span>
                      </div>
                    </div>

                    {trip.guide && (
                      <div className={styles.guidePreview}>
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
  );
}

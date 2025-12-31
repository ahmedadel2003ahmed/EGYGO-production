"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Image from 'next/image';
import styles from '@/app/(pages)/my-trips/MyTrips.module.css'; // Reuse styles
import { useAuth } from '@/app/context/AuthContext';
import socketTripService from '@/services/socketTripService';

export default function GuideDashboardPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('upcoming');
    const auth = useAuth();
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Redirect if not guide (logic can be improved)
    useEffect(() => {
        if (!auth.loading && auth.user && auth.user.role !== 'guide') {
            // router.push('/'); // Uncomment to enforce role
        }
    }, [auth.loading, auth.user, router]);

    // Fetch Guide Trips
    const { data: trips = [], isLoading } = useQuery({
        queryKey: ['guide-trips'],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return [];
            // Attempt to hit guide specific endpoint. 
            // If this doesn't exist, we might need to rely on filtered tourist trips or a different strategy.
            try {
                const response = await axios.get('/api/guide/trips', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                return response.data?.data || [];
            } catch (err) {
                console.error("Failed to fetch guide trips", err);
                return [];
            }
        },
        enabled: !!auth.token,
    });

    // Start Trip Mutation
    const startTripMutation = useMutation({
        mutationFn: async (tripId) => {
            const response = await axios.post(`/api/trips/${tripId}/start`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['guide-trips']);
            showToast('Trip started successfully! 🚀');
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to start trip', 'error'),
    });

    // Complete Trip Mutation
    const endTripMutation = useMutation({
        mutationFn: async (tripId) => {
            const response = await axios.post(`/api/trips/${tripId}/end`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['guide-trips']);
            showToast('Trip completed successfully! 🎉');
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to complete trip', 'error'),
    });

    // Filter Trips
    const filterTrips = (status) => {
        if (status === 'all') return trips;
        if (status === 'upcoming')
            return trips.filter((t) => ['confirmed', 'upcoming'].includes(t.status));
        if (status === 'active')
            return trips.filter((t) => t.status === 'in_progress');
        if (status === 'requests')
            return trips.filter((t) => ['pending_confirmation', 'awaiting_call'].includes(t.status));
        if (status === 'past')
            return trips.filter((t) => ['completed', 'cancelled', 'rejected'].includes(t.status));
        return trips;
    };

    const filteredTrips = filterTrips(activeTab);

    // Status Badge
    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'Pending', color: 'orange', icon: '⏳' },
            guide_selected: { label: 'Selected', color: 'blue', icon: '👤' },
            negotiating: { label: 'Negotiating', color: 'purple', icon: '💬' },
            confirmed: { label: 'Confirmed', color: 'green', icon: '✅' },
            upcoming: { label: 'Upcoming', color: 'indigo', icon: '🔜' },
            in_progress: { label: 'In Progress', color: 'teal', icon: '🚀' },
            completed: { label: 'Completed', color: 'gray', icon: '✔️' },
            cancelled: { label: 'Cancelled', color: 'red', icon: '❌' },
            awaiting_call: { label: 'Call Request', color: 'purple', icon: '📹' },
            pending_confirmation: { label: 'Confirm?', color: 'yellow', icon: '❓' },
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
            {toast && (
                <div className={`${styles.toast} ${styles[toast.type]}`}>
                    {toast.message}
                </div>
            )}

            <section className={styles.headerSection}>
                <div className="container">
                    <div className={styles.headerContent}>
                        <div>
                            <h1 className={styles.pageTitle}>Guide Dashboard</h1>
                            <p className={styles.pageSubtitle}>Manage your trips and requests</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.tabsSection}>
                <div className="container">
                    <div className={styles.tabs}>
                        {[
                            { key: 'upcoming', label: 'Upcoming' },
                            { key: 'active', label: 'In Progress' },
                            { key: 'requests', label: 'Requests' },
                            { key: 'past', label: 'Past' },
                            { key: 'all', label: 'All' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                            >
                                {tab.label}
                                <span className={styles.tabCount}>{filterTrips(tab.key).length}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.contentSection}>
                <div className="container">
                    {isLoading && <div className={styles.loader}>Loading...</div>}

                    {!isLoading && filteredTrips.length === 0 && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📭</div>
                            <h3>No {activeTab} trips found</h3>
                        </div>
                    )}

                    <div className={styles.tripsGrid}>
                        {filteredTrips.map((trip) => (
                            <div key={trip._id} className={styles.tripCard}>
                                <div className={styles.tripCardHeader}>
                                    {getStatusBadge(trip.status)}
                                    <span className={styles.tripDate}>
                                        {new Date(trip.startAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className={styles.tripCardBody}>
                                    <div className={styles.tripMainInfo}>
                                        <h3 className={styles.tripTitle} style={{ marginTop: 0 }}>
                                            Trip with {trip.tourist?.name || 'Tourist'}
                                        </h3>
                                        {/* More details can go here */}
                                    </div>
                                </div>

                                <div className={styles.tripCardFooter} style={{ flexWrap: 'wrap', gap: '8px' }}>
                                    <button
                                        onClick={() => router.push(`/my-trips/${trip._id}`)} // Link to details (might need guide-specific link)
                                        className={styles.viewDetailsBtn}
                                    >
                                        View Details
                                    </button>

                                    {trip.status === 'upcoming' && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Start this trip?')) startTripMutation.mutate(trip._id);
                                            }}
                                            className={styles.viewDetailsBtn}
                                            style={{ backgroundColor: '#10b981', color: 'white' }}
                                        >
                                            🚀 Start Trip
                                        </button>
                                    )}

                                    {trip.status === 'in_progress' && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Complete this trip?')) endTripMutation.mutate(trip._id);
                                            }}
                                            className={styles.viewDetailsBtn}
                                            style={{ backgroundColor: '#3b82f6', color: 'white' }}
                                        >
                                            ✅ End Trip
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

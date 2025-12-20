"use client";

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import styles from './PaymentCancel.module.css';

export default function PaymentCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tripId = searchParams.get('trip_id');

  // Fetch trip details
  const {
    data: tripData,
    isLoading,
  } = useQuery({
    queryKey: ['trip-cancel', tripId],
    queryFn: async () => {
      const response = await axios.get(
        `http://localhost:5000/api/trips/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      return response.data?.data;
    },
    enabled: !!tripId,
  });

  const trip = tripData?.trip || tripData;

  const handleRetryPayment = () => {
    if (tripId) {
      router.push(`/my-trips/${tripId}`);
    } else {
      router.push('/my-trips');
    }
  };

  const handleBackToTrips = () => {
    router.push('/my-trips');
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <div className={styles.iconWrapper}>
            <span className={styles.cancelIcon}>⚠️</span>
          </div>
          
          <h1 className={styles.title}>Payment Cancelled</h1>
          
          <p className={styles.message}>
            Your payment was cancelled. No charges have been made to your account.
          </p>

          {isLoading && (
            <div className={styles.loadingTrip}>
              <div className={styles.smallSpinner}></div>
              <span>Loading trip details...</span>
            </div>
          )}

          {trip && (
            <div className={styles.tripInfo}>
              <h3 className={styles.tripTitle}>Your Trip is Still Reserved</h3>
              <p className={styles.tripDescription}>
                Your trip reservation is still active and waiting for payment.
              </p>
              
              <div className={styles.tripDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>📅 Date:</span>
                  <span className={styles.detailValue}>
                    {new Date(trip.startAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                
                {trip.negotiatedPrice && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>💰 Price:</span>
                    <span className={styles.detailValue}>EGP {trip.negotiatedPrice}</span>
                  </div>
                )}
                
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>⚡ Status:</span>
                  <span className={`${styles.detailValue} ${styles.statusBadge}`}>
                    Awaiting Payment
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.reasonsSection}>
            <h4 className={styles.reasonsTitle}>Why complete your payment?</h4>
            <ul className={styles.reasonsList}>
              <li>✓ Secure your spot with an experienced local guide</li>
              <li>✓ Lock in your negotiated price</li>
              <li>✓ Get full trip confirmation</li>
              <li>✓ Ensure your guide is available on your date</li>
            </ul>
          </div>

          <div className={styles.actionButtons}>
            <button onClick={handleRetryPayment} className={styles.primaryBtn}>
              Complete Payment
            </button>
            <button onClick={handleBackToTrips} className={styles.secondaryBtn}>
              Back to My Trips
            </button>
          </div>

          <div className={styles.helpSection}>
            <p className={styles.helpText}>
              Need help? Contact our support team or check our payment FAQ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

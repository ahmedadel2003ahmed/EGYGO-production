"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import socketTripService from '@/services/socketTripService';
import styles from './PaymentSuccess.module.css';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'failed', 'timeout'
  const [pollAttempts, setPollAttempts] = useState(0);
  const maxPollAttempts = 60; // 60 attempts * 2 seconds = 120 seconds max

  const sessionId = searchParams.get('session_id');
  const tripId = searchParams.get('trip_id');

  // Fetch trip details to verify payment status
  const {
    data: tripData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['trip-payment-status', tripId],
    queryFn: async () => {
      console.log(`Polling attempt ${pollAttempts + 1}/${maxPollAttempts} for trip status...`);
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
      const response = await axios.get(
        `/api/trips/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Trip data received:', response.data?.data);
      return response.data?.data;
    },
    enabled: !!tripId,
    refetchInterval: (data) => {
      // Check if we've exceeded max attempts
      if (pollAttempts >= maxPollAttempts) {
        console.warn('Max polling attempts reached. Webhook may not be configured.');
        return false;
      }

      // Keep refetching if payment is still pending
      const trip = data?.trip || data;
      console.log('Current payment status:', trip?.paymentStatus, 'Trip status:', trip?.status);

      if (trip?.paymentStatus === 'pending' || !trip?.paymentStatus) {
        setPollAttempts(prev => prev + 1);
        return 2000; // Poll every 2 seconds
      }
      return false; // Stop polling
    },
  });

  const trip = tripData?.trip || tripData;

  useEffect(() => {
    if (!tripId) {
      setVerificationStatus('failed');
      return;
    }

    // Check for timeout
    if (pollAttempts >= maxPollAttempts) {
      console.error('Polling timeout reached. Webhook likely not configured.');
      setVerificationStatus('timeout');
      return;
    }

    if (trip) {
      console.log('Checking trip status:', {
        paymentStatus: trip.paymentStatus,
        status: trip.status,
        pollAttempts
      });

      if (trip.paymentStatus === 'paid') {
        console.log('Payment verified successfully!');
        setVerificationStatus('success');
      } else if (trip.paymentStatus === 'failed') {
        setVerificationStatus('failed');
      }
      // Keep verifying if still pending
    }
  }, [trip, tripId, pollAttempts, maxPollAttempts]);

  // Socket.IO integration for real-time updates
  useEffect(() => {
    if (!tripId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    if (!token) return;

    // Connect and join room
    socketTripService.connect(token);
    socketTripService.joinTripRoom(tripId);

    const handleStatusUpdate = (data) => {
      console.log('🔔 Socket update received:', data);
      if (data.tripId === tripId) {
        // If we get an update, force a refetch immediately
        refetch();

        // Optimistically check if this is the payment success
        if (data.paymentStatus === 'paid') {
          setVerificationStatus('success');
        }
      }
    };

    socketTripService.onTripStatusUpdate(handleStatusUpdate);

    return () => {
      socketTripService.offTripStatusUpdate(handleStatusUpdate);
      socketTripService.leaveTripRoom(tripId);
    };
  }, [tripId, refetch]);

  const handleViewTrip = () => {
    router.push(`/my-trips/${tripId}`);
  };

  const handleBackToTrips = () => {
    router.push('/my-trips');
  };

  if (!tripId) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={`${styles.resultCard} ${styles.errorCard}`}>
            <div className={styles.iconWrapper}>
              <span className={styles.errorIcon}>⚠️</span>
            </div>
            <h1 className={styles.title}>Invalid Payment Link</h1>
            <p className={styles.message}>
              This payment link is invalid or has expired.
            </p>
            <button onClick={handleBackToTrips} className={styles.primaryBtn}>
              Go to My Trips
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || verificationStatus === 'verifying') {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.resultCard}>
            <div className={styles.loaderWrapper}>
              <div className={styles.spinner}></div>
            </div>
            <h1 className={styles.title}>Verifying Payment</h1>
            <p className={styles.message}>
              Please wait while we confirm your payment...
            </p>
            <div className={styles.verificationSteps}>
              <div className={styles.step}>
                <span className={styles.stepIcon}>✓</span>
                <span>Payment processed by Stripe</span>
              </div>
              <div className={styles.step}>
                <span className={`${styles.stepIcon} ${styles.loading}`}>⏳</span>
                <span>Confirming with our servers... (Attempt {pollAttempts}/{maxPollAttempts})</span>
              </div>
            </div>

            {pollAttempts > 15 && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#fef3c7',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#92400e',
                textAlign: 'left'
              }}>
                <strong>⚠️ Taking longer than expected...</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem' }}>
                  Your payment was successful, but we&apos;re still waiting for confirmation from our servers.
                  This usually means the webhook needs to be configured on the backend.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Timeout state - webhook not configured
  if (verificationStatus === 'timeout') {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={`${styles.resultCard} ${styles.errorCard}`}>
            <div className={styles.iconWrapper}>
              <span className={styles.errorIcon}>⏰</span>
            </div>
            <h1 className={styles.title}>Verification Timeout</h1>
            <p className={styles.message}>
              Your payment was successful on Stripe, but we couldn&apos;t automatically verify it.
              This is likely a backend configuration issue.
            </p>

            <div style={{
              background: '#fef3c7',
              borderRadius: '12px',
              padding: '20px',
              margin: '24px 0',
              textAlign: 'left',
              fontSize: '0.95rem',
              color: '#78350f'
            }}>
              <strong style={{ display: 'block', marginBottom: '12px', fontSize: '1.1rem' }}>
                🔧 Backend Team: Webhook Endpoint Missing (404)
              </strong>
              <p style={{ margin: '0 0 12px 0' }}>
                Stripe CLI is working, but the backend endpoint doesn&apos;t exist:
              </p>
              <code style={{
                display: 'block',
                background: '#FFF',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '12px',
                fontSize: '0.85rem'
              }}>
                POST /webhook/stripe → 404 Not Found
              </code>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Required Actions:</strong>
              <ol style={{ margin: '8px 0', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Create <code>backend/routes/webhooks.js</code></li>
                <li>Handle <code>checkout.session.completed</code> event</li>
                <li>Update trip: <code>status=&apos;confirmed&apos;</code>, <code>paymentStatus=&apos;paid&apos;</code></li>
                <li>Register route in <code>server.js</code> with <code>express.raw()</code></li>
                <li>Restart backend server</li>
              </ol>
              <p style={{ margin: '12px 0 0 0', fontSize: '0.875rem', background: '#FFF', padding: '8px', borderRadius: '4px' }}>
                📄 <strong>Complete implementation:</strong> See <code>BACKEND_WEBHOOK_IMPLEMENTATION.md</code>
                <br />
                (Copy & paste ready code provided)
              </p>
            </div>

            <div className={styles.actionButtons}>
              <button onClick={handleViewTrip} className={styles.primaryBtn}>
                View Trip Details
              </button>
              <button onClick={handleBackToTrips} className={styles.secondaryBtn}>
                Back to My Trips
              </button>
              <button
                onClick={() => {
                  setPollAttempts(0);
                  setVerificationStatus('verifying');
                  refetch();
                }}
                className={styles.secondaryBtn}
              >
                🔄 Try Again
              </button>
            </div>

            <div className={styles.helpSection}>
              <p className={styles.helpText}>
                Don&apos;t worry - your payment was successful. Check your trip details or contact support with this session ID:
              </p>
              {sessionId && (
                <code className={styles.sessionId}>{sessionId}</code>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={`${styles.resultCard} ${styles.successCard}`}>
            <div className={styles.iconWrapper}>
              <span className={styles.successIcon}>✅</span>
            </div>
            <h1 className={styles.title}>Payment Successful!</h1>
            <p className={styles.message}>
              Your trip has been confirmed. Get ready for an amazing experience!
            </p>

            {trip && (
              <div className={styles.tripSummary}>
                <h3 className={styles.summaryTitle}>Trip Details</h3>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Date:</span>
                  <span className={styles.summaryValue}>
                    {new Date(trip.startAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {trip.negotiatedPrice && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Amount Paid:</span>
                    <span className={styles.summaryValue}>$ {trip.negotiatedPrice}</span>
                  </div>
                )}
                {trip.guide?.name && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Guide:</span>
                    <span className={styles.summaryValue}>{trip.guide.name}</span>
                  </div>
                )}
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Status:</span>
                  <span className={`${styles.summaryValue} ${styles.confirmedBadge}`}>
                    ✓ Confirmed
                  </span>
                </div>
              </div>
            )}

            <div className={styles.actionButtons}>
              <button onClick={handleViewTrip} className={styles.primaryBtn}>
                View Trip Details
              </button>
              <button onClick={handleBackToTrips} className={styles.secondaryBtn}>
                Back to My Trips
              </button>
            </div>

            <div className={styles.nextSteps}>
              <h4 className={styles.nextStepsTitle}>What&apos;s Next?</h4>
              <ul className={styles.nextStepsList}>
                <li>Your guide will contact you before the trip</li>
                <li>Check your trip details for meeting point information</li>
                <li>You&apos;ll receive a confirmation email shortly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={`${styles.resultCard} ${styles.errorCard}`}>
          <div className={styles.iconWrapper}>
            <span className={styles.errorIcon}>❌</span>
          </div>
          <h1 className={styles.title}>Payment Verification Failed</h1>
          <p className={styles.message}>
            {error?.message ||
              'We couldn&apos;t verify your payment at this time. Please check your trip status or contact support.'}
          </p>

          <div className={styles.actionButtons}>
            <button onClick={handleViewTrip} className={styles.primaryBtn}>
              Check Trip Status
            </button>
            <button onClick={handleBackToTrips} className={styles.secondaryBtn}>
              Back to My Trips
            </button>
          </div>

          <div className={styles.helpSection}>
            <p className={styles.helpText}>
              If you were charged but the trip isn&apos;t confirmed, please contact our support team with session ID:
            </p>
            {sessionId && (
              <code className={styles.sessionId}>{sessionId}</code>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

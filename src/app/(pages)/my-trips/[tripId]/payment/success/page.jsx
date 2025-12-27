"use client";

import React, { useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import styles from './PaymentSuccess.module.css';

/**
 * PaymentSuccess Page - Backend Contract Compliant
 * 
 * RULES:
 * - NO API calls allowed
 * - NO polling
 * - Wait exactly 2000ms then redirect to /my-trips/{tripId}
 * - Payment confirmation happens via Stripe webhook (backend only)
 * - Socket will update trip status on the trip details page
 */
export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  const sessionId = searchParams.get('session_id');
  const tripId = params.tripId;

  useEffect(() => {
    if (!tripId) {
      return;
    }

    console.log('✅ [PaymentSuccess] Stripe returned successfully with session:', sessionId);
    console.log('⏳ [PaymentSuccess] Webhook will confirm payment in backend...');
    console.log('🔄 [PaymentSuccess] Redirecting to trip details in 2 seconds...');

    // Wait 2 seconds then redirect - webhook will have processed by then
    const redirectTimer = setTimeout(() => {
      router.push(`/my-trips/${tripId}`);
    }, 2000);

    return () => clearTimeout(redirectTimer);
  }, [tripId, sessionId, router]);

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
            <button onClick={() => router.push('/my-trips')} className={styles.primaryBtn}>
              Go to My Trips
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <div className={styles.iconWrapper}>
            <span className={styles.successIcon}>✅</span>
          </div>
          <h1 className={styles.title}>Payment Successful!</h1>
          <p className={styles.message}>
            Your payment has been processed successfully.
          </p>
          <p className={styles.subMessage}>
            Redirecting you to your trip details...
          </p>
          <div className={styles.loaderWrapper}>
            <div className={styles.spinner}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

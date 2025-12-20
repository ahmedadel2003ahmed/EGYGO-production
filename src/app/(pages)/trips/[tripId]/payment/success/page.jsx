"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LegacyPaymentSuccessRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Extract session_id from URL
    const sessionId = searchParams.get('session_id');
    
    // Get trip ID from the current path
    const pathParts = window.location.pathname.split('/');
    const tripIdIndex = pathParts.indexOf('trips') + 1;
    const tripId = pathParts[tripIdIndex];
    
    console.log('Detected incorrect redirect. Fixing...');
    console.log('Extracted tripId:', tripId);
    console.log('Extracted sessionId:', sessionId);
    
    if (sessionId && tripId) {
      // Redirect to correct URL
      const correctUrl = `/payment/success?session_id=${sessionId}&trip_id=${tripId}`;
      console.log('Redirecting to:', correctUrl);
      
      // Small delay to show message
      setTimeout(() => {
        router.push(correctUrl);
      }, 1500);
    } else {
      // If we can't extract IDs, go to trips list
      setTimeout(() => {
        router.push('/my-trips');
      }, 3000);
    }
  }, [searchParams, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '50px 40px',
        textAlign: 'center',
        maxWidth: '500px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔄</div>
        <h1 style={{ 
          fontSize: '1.8rem', 
          fontWeight: '700', 
          color: '#1f2937', 
          margin: '0 0 16px 0' 
        }}>
          Redirecting...
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          lineHeight: '1.6',
          margin: 0
        }}>
          Payment successful! We&apos;re redirecting you to the correct page.
        </p>
        
        <div style={{
          marginTop: '30px',
          padding: '16px',
          background: '#fef3c7',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#92400e'
        }}>
          <strong>Note for backend team:</strong><br />
          Please update redirect URLs in Stripe checkout session.
          <br />
          See <code>STRIPE_REDIRECT_FIX.md</code>
        </div>
      </div>
    </div>
  );
}

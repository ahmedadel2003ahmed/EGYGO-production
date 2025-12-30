"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
// AgoraRTC imported dynamically to avoid SSR window error
import axios from 'axios';
import styles from './CallPage.module.css';
import socketTripService from '@/services/socketTripService';

export default function CallPage() {
  const router = useRouter();
  const params = useParams();
  const callId = params.callId;

  // Agora client and tracks
  const clientRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null }); // Live track references
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);

  // Call state
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  // Negotiation modal
  const [showEndModal, setShowEndModal] = useState(false);
  const [summary, setSummary] = useState('');
  const [negotiatedPrice, setNegotiatedPrice] = useState('');
  const [endingCall, setEndingCall] = useState(false);

  // Call info
  const [callInfo, setCallInfo] = useState(null);
  const [tripInfo, setTripInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Guards to prevent duplicate joins
  const isInitializingRef = useRef(false);
  const hasJoinedRef = useRef(false);
  const cleanupCalledRef = useRef(false);
  const statusPollingIntervalRef = useRef(null);
  const isEndingCallRef = useRef(false);

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };


  useEffect(() => {
    // Prevent duplicate initialization (React StrictMode, hot reload)
    if (isInitializingRef.current || hasJoinedRef.current) {
      console.log('[Agora] Skipping duplicate initialization');
      return;
    }

    initializeCall();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  const initializeCall = async () => {
    // Guard: Prevent duplicate calls
    if (isInitializingRef.current || hasJoinedRef.current) {
      console.log('[Agora] Already initializing or joined, skipping...');
      return;
    }

    isInitializingRef.current = true;

    try {
      setLoading(true);
      setConnectionStatus('connecting');

      console.log('[Agora] Fetching call credentials...');
      // Fetch call credentials from backend
      const response = await axios.get(
        `/api/calls/${callId}/join`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      const callData = response.data?.data;
      console.log('[Agora] Call data received:', {
        appId: callData.appId,
        channelName: callData.channelName,
        uid: callData.uid,
        role: callData.role
      });

      setCallInfo(callData);
      setTripInfo(callData.trip);

      // Guard: Don't create a new client if one exists
      // Let the cleanup function handle leaving when component unmounts
      if (clientRef.current) {
        console.log('[Agora] Client already exists. Connection state:', clientRef.current.connectionState);
        console.log('[Agora] Skipping re-initialization to avoid conflicts');
        setLoading(false);
        return;
      }

      // Initialize Agora client
      console.log('[Agora] Creating Agora client...');
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      const client = AgoraRTC.createClient({
        mode: 'rtc',
        codec: 'vp8',
      });

      // Store client reference BEFORE setting up listeners or joining
      clientRef.current = client;
      console.log('[Agora] Client created and stored in ref');

      // Setup event listeners
      setupAgoraListeners(client);

      // Join channel with unique UID from backend
      console.log('[Agora] Joining channel...', {
        channelName: callData.channelName,
        uid: callData.uid
      });

      await client.join(
        callData.appId,
        callData.channelName,
        callData.token,
        callData.uid // Use UID from backend (guaranteed unique per session)
      );

      console.log('[Agora] Successfully joined channel');
      console.log('[Agora] Client connection state:', client.connectionState);
      hasJoinedRef.current = true;

      // Verify we're actually connected before proceeding
      if (client.connectionState !== 'CONNECTED' && client.connectionState !== 'CONNECTING') {
        throw new Error(`Failed to connect to channel. State: ${client.connectionState}`);
      }

      // Create local tracks
      console.log('[Agora] Creating local tracks...');
      console.log('[Agora] Connection state before track creation:', client.connectionState);

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        {
          encoderConfig: { sampleRate: 48000, stereo: true },
        },
        {
          encoderConfig: {
            width: 640,
            height: 480,
            frameRate: 15,
            bitrateMax: 600,
          },
        }
      );

      console.log('[Agora] Tracks created successfully');
      console.log('[Agora] Connection state after track creation:', client.connectionState);

      // Store in ref for cleanup access (prevents stale closure issues)
      localTracksRef.current.audio = audioTrack;
      localTracksRef.current.video = videoTrack;

      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      // Play local video
      videoTrack.play('local-player');

      // Wait a moment and check connection state
      console.log('[Agora] About to publish. Connection state:', client.connectionState);

      // If we're connecting, wait for connected state
      if (client.connectionState === 'CONNECTING') {
        console.log('[Agora] Still connecting, waiting for CONNECTED state...');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout waiting for connection'));
          }, 5000);

          const checkState = () => {
            console.log('[Agora] Checking state:', client.connectionState);
            if (client.connectionState === 'CONNECTED') {
              clearTimeout(timeout);
              resolve();
            } else if (client.connectionState === 'DISCONNECTED' || client.connectionState === 'DISCONNECTING') {
              clearTimeout(timeout);
              reject(new Error('Connection lost while waiting'));
            } else {
              setTimeout(checkState, 100);
            }
          };
          checkState();
        });
      }

      if (client.connectionState !== 'CONNECTED') {
        console.error('[Agora] Connection state is not CONNECTED:', client.connectionState);
        throw new Error(`Cannot publish: Connection state is ${client.connectionState}`);
      }

      // Publish tracks
      console.log('[Agora] Publishing tracks...');
      await client.publish([audioTrack, videoTrack]);
      console.log('[Agora] Tracks published successfully');

      setJoined(true);
      setConnectionStatus('connected');
      setLoading(false);
      console.log('[Agora] Call initialization complete');

      // Start status polling to detect remote call end (3-second interval)
      console.log('[Agora] Starting status polling...');
      statusPollingIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(
            `/api/calls/${callId}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.data?.status === 'ended') {
              console.log('[Agora] Remote call end detected via polling');
              clearInterval(statusPollingIntervalRef.current);
              statusPollingIntervalRef.current = null;

              // Use toast instead of alert
              showToast('The call has been ended by the other participant.', 'error');


              // Cleanup and navigate
              await cleanup();

              if (callData.trip?._id) {
                router.push(`/my-trips/${callData.trip._id}`);
              } else {
                router.push('/my-trips');
              }
            }
          }
        } catch (e) {
          console.error('[Agora] Error checking call status:', e);
        }
      }, 3000);

      // Connect to socket for trip status updates (fallback mechanism)
      if (callData.trip?._id && localStorage.getItem('access_token')) {
        const token = localStorage.getItem('access_token');
        if (!socketTripService.isConnected()) {
          socketTripService.connect(token);
        }
        socketTripService.joinTripRoom(callData.trip._id);
        console.log('[Socket] Joined trip room:', callData.trip._id);
      }
    } catch (err) {
      console.error('[Agora] Failed to initialize call:', err);

      // Extract meaningful error message
      let errorMessage = 'Failed to join call. Please check your camera and microphone permissions.';
      if (err.code === 'UID_CONFLICT') {
        errorMessage = 'Connection conflict detected. Please refresh and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setConnectionStatus('failed');
      setLoading(false);

      // Reset guards on error to allow retry
      isInitializingRef.current = false;
      hasJoinedRef.current = false;
    }
  };

  const setupAgoraListeners = (client) => {
    console.log('[Agora] Setting up event listeners...');

    // Remote user published media
    client.on('user-published', async (user, mediaType) => {
      console.log('[Agora] User published:', user.uid, mediaType);
      try {
        await client.subscribe(user, mediaType);
        console.log('[Agora] Subscribed to user:', user.uid, mediaType);

        if (mediaType === 'video') {
          setRemoteUsers((prev) => {
            const exists = prev.find(u => u.uid === user.uid);
            if (exists) {
              console.log('[Agora] User already in list:', user.uid);
              return prev;
            }
            console.log('[Agora] Adding user to list:', user.uid);
            return [...prev, user];
          });

          // Play remote video with delay to ensure DOM is ready
          setTimeout(() => {
            const element = document.getElementById(`remote-player-${user.uid}`);
            if (element && user.videoTrack) {
              user.videoTrack.play(`remote-player-${user.uid}`);
              console.log('[Agora] Playing remote video for:', user.uid);
            }
          }, 100);
        }

        if (mediaType === 'audio') {
          user.audioTrack?.play();
          console.log('[Agora] Playing remote audio for:', user.uid);
        }
      } catch (err) {
        console.error('[Agora] Error subscribing to user:', err);
      }
    });

    // Remote user unpublished media
    client.on('user-unpublished', (user, mediaType) => {
      console.log('[Agora] User unpublished:', user.uid, mediaType);
      if (mediaType === 'video') {
        setRemoteUsers((prev) => prev.filter(u => u.uid !== user.uid));
      }
    });

    // Remote user left
    client.on('user-left', (user) => {
      console.log('[Agora] User left:', user.uid);
      setRemoteUsers((prev) => prev.filter(u => u.uid !== user.uid));
    });

    // Connection state change
    client.on('connection-state-change', (curState, prevState) => {
      console.log('Connection state:', curState);
      setConnectionStatus(curState);
    });

    // Handle exceptions
    client.on('exception', (event) => {
      // Ignore exceptions during intentional call cleanup
      if (isEndingCallRef.current) {
        return;
      }

      // Filter out non-critical warnings (audio bitrate, network quality, etc.)
      const nonCriticalCodes = [2003, 2004, 2005]; // SEND_AUDIO_BITRATE_TOO_LOW, etc.

      if (event?.code && nonCriticalCodes.includes(event.code)) {
        console.warn('Agora quality warning:', event.msg || event);
      } else if (event && Object.keys(event).length > 0) {
        console.error('Agora exception:', event);
      }
      // Ignore empty exception objects
    });
  };

  const toggleMic = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!micOn);
      setMicOn(!micOn);
    }
  };

  const toggleCamera = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!cameraOn);
      setCameraOn(!cameraOn);
    }
  };

  const handleHangUpClick = () => {
    // Show confirmation dialog
    if (confirm('Are you sure you want to end the call?')) {
      setShowEndModal(true);
    }
  };

  const submitEndCall = async () => {
    if (!callId) return;

    setEndingCall(true);
    try {
      const currentClient = clientRef.current;
      const audioTrack = localTracksRef.current.audio;
      const videoTrack = localTracksRef.current.video;

      console.log('[Call] Starting end call process...');

      // Step 1: Unpublish tracks from channel
      if (currentClient && (audioTrack || videoTrack)) {
        const tracks = [];
        if (audioTrack) tracks.push(audioTrack);
        if (videoTrack) tracks.push(videoTrack);

        if (tracks.length > 0 && currentClient.connectionState !== 'DISCONNECTED') {
          console.log('[Call] Unpublishing tracks...');
          await currentClient.unpublish(tracks).catch(err =>
            console.warn("Error unpublishing:", err)
          );
        }
      }

      // Step 2: Stop and close tracks (release hardware)
      if (audioTrack) {
        console.log('[Call] Stopping audio track...');
        audioTrack.stop();
        audioTrack.close();
      }
      if (videoTrack) {
        console.log('[Call] Stopping video track...');
        videoTrack.stop();
        videoTrack.close();
      }

      // Step 3: Leave channel
      if (currentClient) {
        const state = currentClient.connectionState;
        if (state === 'CONNECTED' || state === 'CONNECTING' || state === 'RECONNECTING') {
          console.log('[Call] Leaving channel...');
          await currentClient.leave().catch(err =>
            console.warn("Error leaving:", err)
          );
        }
      }

      // Step 4: Call backend to end session
      console.log('[Call] Calling backend to end call...');
      await axios.post(
        `/api/calls/${callId}/end`,
        {
          endReason: 'completed',
          summary: summary.trim() || undefined,
          negotiatedPrice: negotiatedPrice ? parseFloat(negotiatedPrice) : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      // Close modal
      setShowEndModal(false);

      // Navigate back to trip details
      if (tripInfo?._id) {
        router.push(`/my-trips/${tripInfo._id}`);
      } else {
        router.push('/my-trips');
      }
    } catch (error) {
      console.error("Error ending call:", error);
      showToast("Failed to submit call details. Please try again.", "error");
      setEndingCall(false);
    }
  };

  // Quick end call without modal (for emergency exit)
  const quickEndCall = async () => {
    if (!callId) return;

    setEndingCall(true);
    try {
      const currentClient = clientRef.current;
      const audioTrack = localTracksRef.current.audio;
      const videoTrack = localTracksRef.current.video;

      console.log('[Call] Quick ending call...');

      // Unpublish tracks
      if (currentClient && (audioTrack || videoTrack)) {
        const tracks = [];
        if (audioTrack) tracks.push(audioTrack);
        if (videoTrack) tracks.push(videoTrack);

        if (tracks.length > 0 && currentClient.connectionState !== 'DISCONNECTED') {
          await currentClient.unpublish(tracks).catch(err =>
            console.warn("Error unpublishing:", err)
          );
        }
      }

      // Stop and close tracks
      if (audioTrack) {
        audioTrack.stop();
        audioTrack.close();
      }
      if (videoTrack) {
        videoTrack.stop();
        videoTrack.close();
      }

      // Leave channel
      if (currentClient) {
        const state = currentClient.connectionState;
        if (state === 'CONNECTED' || state === 'CONNECTING' || state === 'RECONNECTING') {
          await currentClient.leave().catch(err =>
            console.warn("Error leaving:", err)
          );
        }
      }

      // Call backend
      await axios.post(
        `/api/calls/${callId}/end`,
        {
          endReason: 'completed',
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      // Close modal and navigate
      setShowEndModal(false);

      if (tripInfo?._id) {
        router.push(`/my-trips/${tripInfo._id}`);
      } else {
        router.push('/my-trips');
      }
    } catch (err) {
      console.error('Failed to end call:', err);
      showToast('Call ended locally. Please refresh to see updates.', 'error');
      setTimeout(() => router.push('/my-trips'), 1000);
    }
  };

  const cleanup = async () => {
    // Guard: Prevent duplicate cleanup
    if (cleanupCalledRef.current) {
      console.log('[Agora] Cleanup already called, skipping...');
      return;
    }

    cleanupCalledRef.current = true;
    isEndingCallRef.current = true;
    console.log('[Agora] Starting cleanup...');

    try {
      // Check if client is still valid and connected
      const clientState = clientRef.current?.connectionState;
      const canUnpublish = clientState === 'CONNECTED' || clientState === 'CONNECTING';

      // Get live track instances from ref (not stale state)
      const audioTrack = localTracksRef.current.audio;
      const videoTrack = localTracksRef.current.video;

      // Unpublish tracks only if client is still connected
      if (canUnpublish && (audioTrack || videoTrack)) {
        const tracks = [audioTrack, videoTrack].filter(Boolean);
        if (tracks.length > 0 && clientRef.current) {
          console.log('[Agora] Unpublishing tracks...');
          try {
            await Promise.race([
              clientRef.current.unpublish(tracks),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Unpublish timeout')), 2000))
            ]);
          } catch (e) {
            console.warn('[Agora] Error unpublishing (ignored):', e.message);
          }
        }
      }

      // Stop and close tracks (always safe to do)
      console.log('[Agora] Stopping and closing tracks...');
      try {
        if (audioTrack) {
          audioTrack.stop();
          audioTrack.close();
          console.log('[Agora] Audio track stopped and closed');
        }
        if (videoTrack) {
          videoTrack.stop();
          videoTrack.close();
          console.log('[Agora] Video track stopped and closed');
        }
      } catch (e) {
        console.warn('[Agora] Error stopping/closing tracks:', e.message);
      }

      // Leave channel only if still connected
      if (clientRef.current) {
        const currentState = clientRef.current.connectionState;
        if (currentState === 'CONNECTED' || currentState === 'CONNECTING') {
          console.log('[Agora] Leaving channel...');
          try {
            await Promise.race([
              clientRef.current.leave(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Leave timeout')), 2000))
            ]);
          } catch (e) {
            console.warn('[Agora] Error leaving channel (ignored):', e.message);
          }
        } else {
          console.log('[Agora] Client already disconnected, skipping leave');
        }

        // Remove all event listeners to prevent memory leaks
        console.log('[Agora] Removing event listeners...');
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }

      // Clear status polling interval
      if (statusPollingIntervalRef.current) {
        console.log('[Agora] Clearing status polling interval...');
        clearInterval(statusPollingIntervalRef.current);
        statusPollingIntervalRef.current = null;
      }

      // Leave socket trip room
      if (tripInfo?._id) {
        console.log('[Socket] Leaving trip room:', tripInfo._id);
        socketTripService.leaveTripRoom(tripInfo._id);
      }

      // Clear track refs
      localTracksRef.current.audio = null;
      localTracksRef.current.video = null;

      // Reset state
      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setRemoteUsers([]);
      setJoined(false);

      // Reset guards
      isInitializingRef.current = false;
      hasJoinedRef.current = false;

      console.log('[Agora] Cleanup complete');
    } catch (err) {
      console.warn('[Agora] Cleanup error (non-critical):', err.message);
      // Force reset state even if cleanup fails
      clientRef.current = null;
      localTracksRef.current.audio = null;
      localTracksRef.current.video = null;
      if (statusPollingIntervalRef.current) {
        clearInterval(statusPollingIntervalRef.current);
        statusPollingIntervalRef.current = null;
      }
      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setRemoteUsers([]);
      setJoined(false);
      isInitializingRef.current = false;
      hasJoinedRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Connecting to video call...</p>
        <p className={styles.statusText}>Status: {connectionStatus}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>Unable to Join Call</h2>
        <p>{error}</p>
        <button
          onClick={() => router.back()}
          className={styles.backButton}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.callContainer}>
      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          <span className={styles.toastIcon}>
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span className={styles.toastMessage}>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.callHeader}>
        <div className={styles.callInfo}>
          <h2>Video Call with {callInfo?.role === 'tourist' ? 'Guide' : 'Tourist'}</h2>
          <span className={`${styles.statusBadge} ${styles[connectionStatus]}`}>
            {connectionStatus === 'connected' ? '🟢 Connected' : '🟡 Connecting...'}
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div className={styles.videoContainer}>
        {/* Remote Video (Large) */}
        <div className={styles.remoteVideoSection}>
          {remoteUsers.length > 0 ? (
            remoteUsers.map((user) => (
              <div
                key={user.uid}
                id={`remote-player-${user.uid}`}
                className={styles.remotePlayer}
              ></div>
            ))
          ) : (
            <div className={styles.waitingMessage}>
              <div className={styles.waitingIcon}>⏳</div>
              <p>Waiting for the other participant to join...</p>
            </div>
          )}
        </div>

        {/* Local Video (Small - Picture in Picture) */}
        <div className={styles.localVideoSection}>
          <div id="local-player" className={styles.localPlayer}></div>
          <span className={styles.localLabel}>You</span>
        </div>
      </div>

      {/* Controls */}
      {/* Controls */}
      <div className={styles.controlsBar}>
        <button
          onClick={toggleMic}
          className={`${styles.controlButton} ${!micOn ? styles.disabled : ''}`}
          title={micOn ? 'Mute' : 'Unmute'}
        >
          {micOn ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          )}
        </button>

        <button
          onClick={toggleCamera}
          className={`${styles.controlButton} ${!cameraOn ? styles.disabled : ''}`}
          title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {cameraOn ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16"/><path d="M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5"/><path d="M14.121 15.121A3 3 0 1 1 9.88 10.88"/></svg>
          )}
        </button>

        <button
          onClick={handleHangUpClick}
          className={`${styles.controlButton} ${styles.hangUpButton}`}
          title="End call"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform: 'rotate(135deg)'}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </button>
      </div>

      {/* End Call Modal */}
      {showEndModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Call Summary (Optional)</h3>

            <div className={styles.modalBody}>
              <p className={styles.infoText}>
                You can add notes and pricing details, or skip to end immediately.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Call Summary
                  <span className={styles.optional}>(Optional)</span>
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Summarize what was discussed during the call..."
                  className={styles.textarea}
                  rows={4}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Negotiated Price ($)
                  <span className={styles.optional}>(Optional)</span>
                </label>
                <input
                  type="number"
                  value={negotiatedPrice}
                  onChange={(e) => setNegotiatedPrice(e.target.value)}
                  placeholder="Enter agreed price..."
                  className={styles.input}
                  min="0"
                  step="50"
                />
              </div>

              <p className={styles.infoText}>
                After ending the call, the guide will review and confirm the trip details.
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowEndModal(false)}
                className={styles.cancelButton}
                disabled={endingCall}
              >
                Cancel
              </button>
              <button
                onClick={quickEndCall}
                className={styles.skipButton}
                disabled={endingCall}
                title="End call without adding details"
              >
                Skip & End
              </button>
              <button
                onClick={submitEndCall}
                className={styles.submitButton}
                disabled={endingCall}
              >
                {endingCall ? 'Ending...' : 'Save & End'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

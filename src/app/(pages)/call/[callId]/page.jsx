"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import styles from './CallPage.module.css';

export default function CallPage() {
  const router = useRouter();
  const params = useParams();
  const callId = params.callId;

  // Agora client and tracks
  const clientRef = useRef(null);
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

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, [callId]);

  const initializeCall = async () => {
    try {
      setLoading(true);
      setConnectionStatus('connecting');

      // Fetch call credentials from backend
      const response = await axios.get(
        `http://localhost:5000/api/calls/${callId}/join`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      const callData = response.data?.data;
      setCallInfo(callData);
      setTripInfo(callData.trip);

      // Initialize Agora client
      const client = AgoraRTC.createClient({
        mode: 'rtc',
        codec: 'vp8',
      });
      clientRef.current = client;

      // Setup event listeners
      setupAgoraListeners(client);

      // Join channel
      await client.join(
        callData.appId,
        callData.channelName,
        callData.token,
        callData.uid
      );

      // Create local tracks
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

      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      // Play local video
      videoTrack.play('local-player');

      // Publish tracks
      await client.publish([audioTrack, videoTrack]);

      setJoined(true);
      setConnectionStatus('connected');
      setLoading(false);
    } catch (err) {
      console.error('Failed to initialize call:', err);
      setError(err.message || 'Failed to join call. Please check your camera and microphone permissions.');
      setConnectionStatus('failed');
      setLoading(false);
    }
  };

  const setupAgoraListeners = (client) => {
    // Remote user published media
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        setRemoteUsers((prev) => {
          const exists = prev.find(u => u.uid === user.uid);
          if (exists) return prev;
          return [...prev, user];
        });
        
        // Play remote video
        setTimeout(() => {
          user.videoTrack?.play(`remote-player-${user.uid}`);
        }, 100);
      }

      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });

    // Remote user unpublished media
    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        setRemoteUsers((prev) => prev.filter(u => u.uid !== user.uid));
      }
    });

    // Remote user left
    client.on('user-left', (user) => {
      setRemoteUsers((prev) => prev.filter(u => u.uid !== user.uid));
    });

    // Connection state change
    client.on('connection-state-change', (curState, prevState) => {
      console.log('Connection state:', curState);
      setConnectionStatus(curState);
    });

    // Handle exceptions
    client.on('exception', (event) => {
      console.error('Agora exception:', event);
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
    setShowEndModal(true);
  };

  const submitEndCall = async () => {
    try {
      setEndingCall(true);

      // End call via backend
      await axios.post(
        `http://localhost:5000/api/calls/${callId}/end`,
        {
          endReason: 'completed',
          summary: summary,
          negotiatedPrice: negotiatedPrice ? parseFloat(negotiatedPrice) : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      // Cleanup Agora
      await cleanup();

      // Navigate back to trip details
      if (tripInfo?._id) {
        router.push(`/my-trips/${tripInfo._id}`);
      } else {
        router.push('/my-trips');
      }
    } catch (err) {
      console.error('Failed to end call:', err);
      alert(err.response?.data?.message || 'Failed to end call');
      setEndingCall(false);
    }
  };

  const cleanup = async () => {
    try {
      // Unpublish tracks
      if (localAudioTrack || localVideoTrack) {
        const tracks = [localAudioTrack, localVideoTrack].filter(Boolean);
        if (tracks.length > 0 && clientRef.current) {
          await clientRef.current.unpublish(tracks);
        }
      }

      // Close tracks
      localAudioTrack?.close();
      localVideoTrack?.close();

      // Leave channel
      if (clientRef.current) {
        await clientRef.current.leave();
      }

      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setRemoteUsers([]);
      setJoined(false);
    } catch (err) {
      console.error('Cleanup error:', err);
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
      <div className={styles.controlsBar}>
        <button
          onClick={toggleMic}
          className={`${styles.controlButton} ${!micOn ? styles.disabled : ''}`}
          title={micOn ? 'Mute' : 'Unmute'}
        >
          {micOn ? '🎤' : '🔇'}
          <span>{micOn ? 'Mute' : 'Unmuted'}</span>
        </button>

        <button
          onClick={toggleCamera}
          className={`${styles.controlButton} ${!cameraOn ? styles.disabled : ''}`}
          title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {cameraOn ? '📹' : '🚫'}
          <span>{cameraOn ? 'Camera' : 'No Camera'}</span>
        </button>

        <button
          onClick={handleHangUpClick}
          className={`${styles.controlButton} ${styles.hangUpButton}`}
          title="End call"
        >
          📞
          <span>End Call</span>
        </button>
      </div>

      {/* End Call Modal */}
      {showEndModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>End Call & Submit Details</h3>
            
            <div className={styles.modalBody}>
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
                  Negotiated Price (EGP)
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
                onClick={submitEndCall}
                className={styles.submitButton}
                disabled={endingCall}
              >
                {endingCall ? 'Ending Call...' : 'End Call & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

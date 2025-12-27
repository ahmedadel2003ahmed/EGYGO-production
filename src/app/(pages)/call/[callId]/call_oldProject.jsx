import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { callService } from '../api/services/callService';
import { tripService } from '../api/services/tripService';
import { Mic, MicOff, Video, VideoOff, PhoneOff, X, MessageCircle } from 'lucide-react';
import { TripChat } from '../components/chat/TripChat';
import type { Trip } from '../types';

// Disable Agora logs and stats collection globally to prevent ad-blocker issues
AgoraRTC.disableLogUpload();
AgoraRTC.setLogLevel(3); // Only show errors

export const CallPage = () => {
    const { callId: paramCallId, tripId: paramTripId } = useParams<{ callId?: string; tripId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // State for call logic
    const [activeCallId, setActiveCallId] = useState<string | null>(paramCallId || null);
    const [joined, setJoined] = useState(false);
    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [isInitiating, setIsInitiating] = useState(false);

    // State for End Call Modal
    const [showEndModal, setShowEndModal] = useState(false);
    const [summary, setSummary] = useState('');
    const [negotiatedPrice, setNegotiatedPrice] = useState('');
    const [isEnding, setIsEnding] = useState(false);

    // State for Chat
    const [showChat, setShowChat] = useState(false);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [chatAvailable, setChatAvailable] = useState(false);

    const client = useRef<IAgoraRTCClient | null>(null);
    const localTracksRef = useRef<{ audio: IMicrophoneAudioTrack | null; video: ICameraVideoTrack | null }>({ audio: null, video: null });
    const hasJoinedRef = useRef(false);

    // Effect to fetch trip data and check chat availability
    useEffect(() => {
        const fetchTrip = async () => {
            if (paramTripId) {
                try {
                    const tripResponse = await tripService.getTrip(paramTripId);
                    if (tripResponse.success && tripResponse.data) {
                        setTrip(tripResponse.data);
                        
                        // Check if chat should be available
                        const chatAllowedStates = [
                            'awaiting_call', 'in_call', 'pending_confirmation',
                            'awaiting_payment', 'confirmed', 'in_progress', 'completed'
                        ];
                        const hasGuideSelected = !!(tripResponse.data.selectedGuide);
                        const statusAllowsChat = chatAllowedStates.includes(tripResponse.data.status);
                        const chatAvail = hasGuideSelected && statusAllowsChat;
                        
                        console.log('[CallPage] Chat availability check:', {
                            tripId: tripResponse.data._id,
                            status: tripResponse.data.status,
                            hasGuideSelected,
                            statusAllowsChat,
                            chatAvailable: chatAvail
                        });
                        
                        setChatAvailable(chatAvail);
                    }
                } catch (error) {
                    console.error('Failed to fetch trip:', error);
                }
            }
        };
        fetchTrip();
    }, [paramTripId]);

    // Effect to initiate call if tripId is provided but no callId
    useEffect(() => {
        const initiateCall = async () => {
            if (paramTripId && !activeCallId && !isInitiating) {
                setIsInitiating(true);
                try {
                    console.log("CallPage: Initiating call for trip:", paramTripId);
                    const response = await tripService.initiateCall(paramTripId);
                    console.log("CallPage: Call initiated:", response);
                    
                    setActiveCallId(response.callId);
                    // Update URL without reloading
                    window.history.replaceState(null, '', `/calls/${response.callId}?tripId=${paramTripId}`);
                } catch (error: any) {
                    console.error("CallPage: Failed to initiate call:", error);
                    console.error("CallPage: Error response:", error?.response);
                    
                    let errorMessage = "Failed to initiate call. Please try again.";
                    
                    if (error?.response?.data?.message) {
                        errorMessage = error.response.data.message;
                    } else if (error?.message) {
                        errorMessage = error.message;
                    }
                    
                    // Add specific error messages for common issues
                    if (error?.response?.status === 401) {
                        errorMessage = "Your session has expired. Please log in again.";
                    } else if (error?.response?.status === 404) {
                        errorMessage = "Trip not found. Please check the trip ID.";
                    } else if (error?.response?.status === 400) {
                        errorMessage = error?.response?.data?.message || "Cannot initiate call. Please check trip status.";
                    }
                    
                    alert(errorMessage);
                    navigate(`/trips/${paramTripId}`);
                } finally {
                    setIsInitiating(false);
                }
            }
        };

        initiateCall();
    }, [paramTripId, activeCallId, navigate, isInitiating]);

    // Effect to join call once we have a callId
    useEffect(() => {
        if (!activeCallId) return;

        let mounted = true;
        let isJoining = false;
        let isJoined = false;
        let statusCheckInterval: NodeJS.Timeout | null = null;

        const checkCallStatus = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/calls/${activeCallId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.data?.status === 'ended' && mounted) {
                        console.log('Call has been ended, navigating away...');
                        if (statusCheckInterval) clearInterval(statusCheckInterval);
                        
                        alert('The call has been ended by the other participant.');
                        
                        // Cleanup
                        if (client.current) {
                            await client.current.leave().catch(() => {});
                        }
                        
                        const tripId = paramTripId || new URLSearchParams(location.search).get('tripId');
                        if (tripId) navigate(`/trips/${tripId}`);
                        else navigate('/trips');
                    }
                }
            } catch (e) {
                console.error('Error checking call status:', e);
            }
        };

        const joinCall = async () => {
            try {
                // 1. Get Token and Join Details
                console.log('[CallPage] Requesting join data for callId:', activeCallId);
                const joinData = await callService.joinCall(activeCallId);
                console.log('[CallPage] Received join data:', joinData);
                
                const { appId, channelName, uid, token } = (joinData as any).data || joinData;
                
                console.log('[CallPage] Extracted credentials:', {
                    appId: appId ? `${appId.substring(0, 8)}...` : 'missing',
                    channelName,
                    uid,
                    token: token ? `${token.substring(0, 20)}...` : 'missing'
                });

                if (!appId || !token) {
                    throw new Error("Missing Agora credentials");
                }

                if (!mounted) return;

                // 2. Create Client
                client.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

                // 3. Setup Event Listeners
                client.current.on('user-published', async (user, mediaType) => {
                    console.log('[CallPage] Remote user published:', { uid: user.uid, mediaType });
                    await client.current?.subscribe(user, mediaType);
                    if (mediaType === 'video') {
                        console.log('[CallPage] Adding remote video user to UI');
                        setRemoteUsers(prev => {
                            if (prev.find(u => u.uid === user.uid)) return prev;
                            return [...prev, user];
                        });
                    }
                    if (mediaType === 'audio') {
                        console.log('[CallPage] Playing remote audio');
                        user.audioTrack?.play();
                    }
                });

                client.current.on('user-unpublished', (user, mediaType) => {
                    console.log('[CallPage] Remote user unpublished:', { uid: user.uid, mediaType });
                    if (mediaType === 'video') {
                        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                    }
                });

                client.current.on('user-left', async (user) => {
                    console.log('[CallPage] Remote user left the call:', user.uid);
                    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                    // Note: Status check will be handled by the periodic interval
                });

                // Handle connection state changes and errors
                client.current.on('connection-state-change', (curState, prevState) => {
                    console.log(`Connection state changed from ${prevState} to ${curState}`);
                    
                    if (curState === 'DISCONNECTED') {
                        console.warn('Connection disconnected');
                    } else if (curState === 'RECONNECTING') {
                        console.log('Attempting to reconnect...');
                    }
                });

                client.current.on('exception', (event) => {
                    console.error('Agora exception:', event);
                });

                // 4. Join Channel
                console.log('[CallPage] Attempting to join Agora channel:', {
                    channelName,
                    uid,
                    appId: appId.substring(0, 8) + '...'
                });
                isJoining = true;
                await client.current.join(appId, channelName, token, uid);
                console.log('[CallPage] Successfully joined Agora channel!');
                isJoining = false;
                isJoined = true;
                hasJoinedRef.current = true;
                if (mounted) setJoined(true);

                // 5. Create and Publish Local Tracks
                try {
                    // Check for available devices first
                    const devices = await AgoraRTC.getDevices();
                    const hasMicrophone = devices.some(device => device.kind === 'audioinput');
                    const hasCamera = devices.some(device => device.kind === 'videoinput');
                    
                    if (!hasMicrophone || !hasCamera) {
                        throw new Error(`Missing devices: ${!hasMicrophone ? 'microphone' : ''} ${!hasCamera ? 'camera' : ''}`);
                    }
                    
                    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
                        {
                            encoderConfig: {
                                sampleRate: 48000,
                                stereo: true,
                                sampleSize: 16,
                            },
                        },
                        {
                            encoderConfig: {
                                width: 640,
                                height: 480,
                                frameRate: 15,
                                bitrateMax: 600,
                                bitrateMin: 400,
                            },
                        }
                    );

                    if (mounted) {
                        localTracksRef.current.audio = audioTrack;
                        localTracksRef.current.video = videoTrack;
                        setLocalAudioTrack(audioTrack);
                        setLocalVideoTrack(videoTrack);
                        console.log('[CallPage] Publishing local audio and video tracks...');
                        await client.current.publish([audioTrack, videoTrack]);
                        console.log('[CallPage] Local tracks published successfully!');
                        
                        // Start periodic status checking to detect if call was ended by other party
                        statusCheckInterval = setInterval(checkCallStatus, 3000); // Check every 3 seconds
                    } else {
                        audioTrack.close();
                        videoTrack.close();
                    }
                } catch (mediaError: any) {
                    console.error("Media device error:", mediaError);
                    
                    // Specific error messages for device issues
                    let errorMessage = "Failed to access camera/microphone. ";
                    
                    if (mediaError.message?.includes("NotReadableError") || 
                        mediaError.message?.includes("Device in use")) {
                        errorMessage += "Your camera or microphone is already in use by another application or browser tab. Please:\n" +
                                       "1. Close other applications using your camera/microphone\n" +
                                       "2. Close other browser tabs that might be using the camera/microphone\n" +
                                       "3. Refresh this page and try again";
                    } else if (mediaError.message?.includes("NotAllowedError") || 
                               mediaError.message?.includes("Permission denied")) {
                        errorMessage += "Please allow camera and microphone permissions in your browser settings and refresh the page.";
                    } else if (mediaError.message?.includes("NotFoundError") || 
                               mediaError.message?.includes("Missing devices")) {
                        errorMessage += "No camera or microphone found. Please connect a camera and microphone to your device.";
                    } else {
                        errorMessage += mediaError.message || "Unknown error occurred.";
                    }
                    
                    alert(errorMessage);
                    
                    // Leave the channel if already joined
                    if (client.current) {
                        await client.current.leave();
                    }
                    
                    const tripId = paramTripId || new URLSearchParams(location.search).get('tripId');
                    if (tripId) navigate(`/trips/${tripId}`);
                    else navigate('/trips');
                    return;
                }

            } catch (error: any) {
                isJoining = false;
                console.error("Error joining call:", error);
                
                // Don't show error if component was unmounted
                if (!mounted) return;
                
                let errorMessage = "Error joining call. ";
                
                // Handle specific Agora errors
                if (error.code === 'INVALID_PARAMS') {
                    errorMessage += "Invalid call parameters. Please try again.";
                } else if (error.code === 'INVALID_OPERATION') {
                    errorMessage += "Invalid operation. You may already be in a call.";
                } else if (error.code === 'WS_ABORT' || error.code === 'OPERATION_ABORTED') {
                    // These errors happen during cleanup - ignore them
                    console.warn("Call was aborted during cleanup");
                    return;
                } else if (error.message) {
                    errorMessage += error.message;
                } else {
                    errorMessage += "Please try again.";
                }
                
                alert(errorMessage);
                
                // Try to go back to trip details if possible
                const tripId = paramTripId || new URLSearchParams(location.search).get('tripId');
                if (tripId) navigate(`/trips/${tripId}`);
                else navigate('/trips');
            }
        };

        joinCall();

        return () => {
            mounted = false;
            
            // Clear status check interval
            if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
                statusCheckInterval = null;
            }
            
            // Cleanup function to be called asynchronously
            const cleanup = async () => {
                try {
                    // Wait a bit if currently joining to avoid abort errors
                    if (isJoining) {
                        console.log("Waiting for join to complete before cleanup...");
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    
                    const currentClient = client.current;
                    const audioTrack = localTracksRef.current.audio;
                    const videoTrack = localTracksRef.current.video;
                    
                    // First, unpublish tracks if they exist
                    if (currentClient && (audioTrack || videoTrack)) {
                        const tracks = [];
                        if (audioTrack) tracks.push(audioTrack);
                        if (videoTrack) tracks.push(videoTrack);
                        
                        if (tracks.length > 0 && currentClient.connectionState !== 'DISCONNECTED') {
                            await currentClient.unpublish(tracks).catch(err => 
                                console.warn("Error unpublishing tracks:", err)
                            );
                        }
                    }
                    
                    // Stop and close media tracks
                    if (audioTrack) {
                        audioTrack.stop();
                        audioTrack.close();
                    }
                    if (videoTrack) {
                        videoTrack.stop();
                        videoTrack.close();
                    }
                    
                    // Leave the channel if connected - but only if we actually joined
                    if (currentClient && hasJoinedRef.current) {
                        const state = currentClient.connectionState;
                        if (state === 'CONNECTED' || state === 'CONNECTING' || state === 'RECONNECTING') {
                            await currentClient.leave().catch(err => {
                                // Ignore abort errors during cleanup
                                if (err.code !== 'WS_ABORT' && err.code !== 'OPERATION_ABORTED') {
                                    console.warn("Error leaving channel:", err);
                                }
                            });
                        }
                        
                        // Remove all listeners and cleanup client
                        currentClient.removeAllListeners();
                        client.current = null;
                    }
                    
                    // Clear refs
                    localTracksRef.current = { audio: null, video: null };
                    hasJoinedRef.current = false;
                } catch (err: any) {
                    // Ignore abort errors during cleanup
                    if (err.code !== 'WS_ABORT' && err.code !== 'OPERATION_ABORTED') {
                        console.error("Error during cleanup:", err);
                    }
                }
            };
            
            cleanup();
        };
    }, [activeCallId, paramTripId, navigate, location.search]);

    // Track playing effects
    useEffect(() => {
        if (localVideoTrack && joined) {
            localVideoTrack.play('local-player');
        }
    }, [localVideoTrack, joined]);

    useEffect(() => {
        remoteUsers.forEach(user => {
            const containerId = `remote-player-${user.uid}`;
            const container = document.getElementById(containerId);
            if (container && user.videoTrack) {
                user.videoTrack.play(container);
            }
        });
    }, [remoteUsers]);

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

    const submitEndCall = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCallId) return;

        setIsEnding(true);
        try {
            const currentClient = client.current;
            const audioTrack = localTracksRef.current.audio;
            const videoTrack = localTracksRef.current.video;
            
            // Properly cleanup: unpublish, close tracks, then leave
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
            
            // Leave channel if still connected
            if (currentClient) {
                const state = currentClient.connectionState;
                if (state === 'CONNECTED' || state === 'CONNECTING' || state === 'RECONNECTING') {
                    await currentClient.leave().catch(err => 
                        console.warn("Error leaving:", err)
                    );
                }
            }

            // Call backend to end the session
            await callService.endCall(activeCallId, {
                endReason: 'completed',
                summary,
                negotiatedPrice: negotiatedPrice ? Number(negotiatedPrice) : undefined
            });

            // Navigate back to trip details
            const tripId = paramTripId || new URLSearchParams(location.search).get('tripId');
            if (tripId) navigate(`/trips/${tripId}`);
            else navigate('/trips');

        } catch (error) {
            console.error("Error ending call:", error);
            alert("Failed to submit call details. Please try again.");
            setIsEnding(false);
        }
    };

    if (isInitiating) {
        return (
            <div className="h-screen bg-gray-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                    <p>Initiating secure call...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-900 flex flex-col relative">
            {/* Debug Info (remove in production) */}
            {process.env.NODE_ENV === 'development' && activeCallId && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded z-30 max-w-xs">
                    <div><strong>Call ID:</strong> {activeCallId}</div>
                    <div><strong>Joined:</strong> {joined ? 'Yes' : 'No'}</div>
                    <div><strong>Remote Users:</strong> {remoteUsers.length}</div>
                </div>
            )}
            
            <div className="flex-1 relative">
                {/* Remote Videos Grid */}
                <div className="absolute inset-0 flex flex-wrap items-center justify-center p-4 gap-4">
                    {remoteUsers.length === 0 && (
                        <div className="text-white text-xl">Waiting for others to join...</div>
                    )}
                    {remoteUsers.map(user => (
                        <div key={user.uid} id={`remote-player-${user.uid}`} className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden relative border border-gray-700">
                            <span className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm z-10">User {user.uid}</span>
                        </div>
                    ))}
                </div>

                {/* Local Video (PiP) */}
                <div className="absolute bottom-24 right-4 w-48 aspect-video bg-black rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg z-20">
                    <div id="local-player" className="w-full h-full"></div>
                    <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-1 rounded z-10">You</span>
                </div>
            </div>

            {/* Controls */}
            <div className="h-20 bg-gray-800 flex items-center justify-center space-x-6 z-30">
                <button onClick={toggleMic} className={`p-4 rounded-full ${micOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}>
                    {micOn ? <Mic /> : <MicOff />}
                </button>
                <button onClick={handleHangUpClick} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors">
                    <PhoneOff />
                </button>
                <button onClick={toggleCamera} className={`p-4 rounded-full ${cameraOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}>
                    {cameraOn ? <Video /> : <VideoOff />}
                </button>
                {chatAvailable && (
                    <button 
                        onClick={() => setShowChat(true)} 
                        className="p-4 rounded-full bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                        title="Open Chat"
                    >
                        <MessageCircle />
                    </button>
                )}
            </div>

            {/* Trip Chat */}
            {chatAvailable && trip && (
                <TripChat 
                    trip={trip} 
                    isOpen={showChat} 
                    onClose={() => setShowChat(false)} 
                />
            )}

            {/* End Call Modal */}
            {showEndModal && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">End Call & Summary</h2>
                            <button onClick={() => setShowEndModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={submitEndCall} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Call Summary</label>
                                <textarea
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                    rows={3}
                                    placeholder="What did you discuss?"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Price (EGP)</label>
                                <input
                                    type="number"
                                    value={negotiatedPrice}
                                    onChange={(e) => setNegotiatedPrice(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                    placeholder="e.g. 500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter the final price agreed upon during the call.</p>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isEnding}
                                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-70"
                                >
                                    {isEnding ? 'Ending Call...' : 'Confirm & End Call'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

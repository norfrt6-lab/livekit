import { useState, useEffect, useRef, useCallback } from "react";
import {
  Room,
  RoomEvent,
  ConnectionState,
  VideoPresets,
  Track,
  RemoteParticipant,
} from "livekit-client";

// Import types from shared package
import {
  ParticipantRole,
  DataMessageType,
  ParticipantMetadata,
} from "@livekit-show/shared";

// Import API client
import { api, ShowApiError } from "./api";

// ============================================
// Types
// ============================================

interface ViewerInfo {
  identity: string;
  name: string;
  handRaised: boolean;
}

// ============================================
// Helper Components
// ============================================

function VideoRenderer({
  track,
  isLocal = false,
  participantName,
  role,
}: {
  track: Track;
  isLocal?: boolean;
  participantName: string;
  role?: ParticipantRole;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && track) {
      track.attach(videoRef.current);
    }
    return () => {
      if (track) {
        track.detach();
      }
    };
  }, [track]);

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{ transform: isLocal ? "scaleX(-1)" : "none" }}
      />
      <div className="video-label">
        <span className="participant-name">
          {participantName} {isLocal && "(You)"}
        </span>
        {role && (
          <span className={`role-badge role-${role}`}>
            {role}
          </span>
        )}
      </div>
    </div>
  );
}

function AudioRenderer({ track }: { track: Track }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && track) {
      track.attach(audioRef.current);
    }
    return () => {
      if (track) {
        track.detach();
      }
    };
  }, [track]);

  return <audio ref={audioRef} autoPlay />;
}

// ============================================
// Main App
// ============================================

function App() {
  // Form state
  const [roomName, setRoomName] = useState("my-show");
  const [participantName, setParticipantName] = useState("");
  const [selectedRole, setSelectedRole] = useState<ParticipantRole>(ParticipantRole.VIEWER);

  // Connection state
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [currentRole, setCurrentRole] = useState<ParticipantRole>(ParticipantRole.VIEWER);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Media state
  const [localVideoTrack, setLocalVideoTrack] = useState<Track | null>(null);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);

  // Invitation state
  const [handRaised, setHandRaised] = useState(false);
  const [viewers, setViewers] = useState<ViewerInfo[]>([]);
  const [pendingInvite, setPendingInvite] = useState<{ from: string; fromName: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Refs
  const roomRef = useRef<Room | null>(null);
  const isConnectingRef = useRef(false);

  // Generate random participant name on mount
  useEffect(() => {
    const randomId = Math.floor(Math.random() * 10000);
    setParticipantName(`user-${randomId}`);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, []);

  // Show notification
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  // Parse participant metadata
  const getParticipantMetadata = (participant: RemoteParticipant): ParticipantMetadata | null => {
    try {
      if (participant.metadata) {
        return JSON.parse(participant.metadata);
      }
    } catch { /* ignore */ }
    return null;
  };

  // Update viewers list from remote participants
  const updateViewersList = useCallback((participants: RemoteParticipant[]) => {
    const viewerList: ViewerInfo[] = [];

    participants.forEach((p) => {
      const metadata = getParticipantMetadata(p);
      if (metadata && metadata.role === ParticipantRole.VIEWER) {
        viewerList.push({
          identity: p.identity,
          name: metadata.displayName || p.identity,
          handRaised: metadata.handRaised || false,
        });
      }
    });

    viewerList.sort((a, b) => {
      if (a.handRaised && !b.handRaised) return -1;
      if (!a.handRaised && b.handRaised) return 1;
      return a.name.localeCompare(b.name);
    });

    setViewers(viewerList);
  }, []);

  // Send data message
  const sendDataMessage = useCallback((message: object) => {
    if (room && room.localParticipant) {
      const data = new TextEncoder().encode(JSON.stringify(message));
      room.localParticipant.publishData(data, { reliable: true });
    }
  }, [room]);

  // Handle incoming data messages
  const handleDataReceived = useCallback((payload: Uint8Array) => {
    try {
      const message = JSON.parse(new TextDecoder().decode(payload));

      switch (message.type) {
        case DataMessageType.HAND_RAISE:
        case DataMessageType.HAND_LOWER:
          if (roomRef.current) {
            setRemoteParticipants(Array.from(roomRef.current.remoteParticipants.values()));
          }
          break;

        case DataMessageType.GUEST_INVITE:
          if (message.targetParticipantId === participantName) {
            setPendingInvite({ from: message.senderId, fromName: message.senderName });
          }
          break;

        case DataMessageType.GUEST_PROMOTED:
          showNotification(`${message.newGuestName} is now a guest`);
          break;

        case DataMessageType.GUEST_DEMOTED:
          showNotification(`${message.demotedName} is now a viewer`);
          break;
      }
    } catch (e) {
      console.error("Error parsing data message:", e);
    }
  }, [participantName]);

  // Setup room event listeners
  const setupRoomListeners = useCallback((newRoom: Room) => {
    newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
      setConnectionState(state);
    });

    newRoom.on(RoomEvent.ParticipantConnected, () => {
      const participants = Array.from(newRoom.remoteParticipants.values());
      setRemoteParticipants(participants);
      updateViewersList(participants);
    });

    newRoom.on(RoomEvent.ParticipantDisconnected, () => {
      const participants = Array.from(newRoom.remoteParticipants.values());
      setRemoteParticipants(participants);
      updateViewersList(participants);
    });

    newRoom.on(RoomEvent.TrackSubscribed, () => {
      setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
    });

    newRoom.on(RoomEvent.TrackUnsubscribed, () => {
      setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
    });

    newRoom.on(RoomEvent.ParticipantMetadataChanged, () => {
      const participants = Array.from(newRoom.remoteParticipants.values());
      setRemoteParticipants(participants);
      updateViewersList(participants);
    });

    newRoom.on(RoomEvent.LocalTrackPublished, (publication) => {
      if (publication.kind === Track.Kind.Video && publication.track) {
        setLocalVideoTrack(publication.track);
      }
    });

    newRoom.on(RoomEvent.LocalTrackUnpublished, (publication) => {
      if (publication.kind === Track.Kind.Video) {
        setLocalVideoTrack(null);
      }
    });

    newRoom.on(RoomEvent.DataReceived, handleDataReceived);

    newRoom.on(RoomEvent.Disconnected, () => {
      setConnectionState(ConnectionState.Disconnected);
      setLocalVideoTrack(null);
      setRemoteParticipants([]);
      setViewers([]);
      isConnectingRef.current = false;
    });
  }, [handleDataReceived, updateViewersList]);

  // Connect to room
  const handleConnect = async () => {
    if (isConnectingRef.current || isConnecting) return;
    if (!roomName.trim() || !participantName.trim()) {
      setError("Please enter room name and your name");
      return;
    }

    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
    }

    isConnectingRef.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      // Join room via API
      const response = await api.joinRoom({
        roomName: roomName.trim(),
        participantName: participantName.trim(),
        role: selectedRole,
      });

      const { token, wsUrl, role } = response;
      setCurrentRole(role);

      // Create and configure room
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
      });

      roomRef.current = newRoom;
      setupRoomListeners(newRoom);

      // Connect to LiveKit
      await newRoom.connect(wsUrl, token);
      setRoom(newRoom);

      const participants = Array.from(newRoom.remoteParticipants.values());
      setRemoteParticipants(participants);
      updateViewersList(participants);

      // Enable media for HOST
      if (role === ParticipantRole.HOST) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (newRoom.state === ConnectionState.Connected) {
          try {
            await newRoom.localParticipant.setCameraEnabled(true);
            await newRoom.localParticipant.setMicrophoneEnabled(true);
          } catch (mediaError: unknown) {
            const message = mediaError instanceof Error ? mediaError.message : 'Unknown error';
            setError(`Could not access camera/mic: ${message}`);
          }
        }
      }
    } catch (err) {
      const message = err instanceof ShowApiError ? err.message : 'Failed to connect';
      setError(message);
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    } finally {
      isConnectingRef.current = false;
      setIsConnecting(false);
    }
  };

  // Disconnect
  const handleDisconnect = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setRoom(null);
    setConnectionState(ConnectionState.Disconnected);
    setLocalVideoTrack(null);
    setRemoteParticipants([]);
    setViewers([]);
    setHandRaised(false);
    setPendingInvite(null);
    setError(null);
  };

  // Toggle video/audio
  const toggleVideo = async () => {
    if (room) {
      const newState = !localVideoEnabled;
      await room.localParticipant.setCameraEnabled(newState);
      setLocalVideoEnabled(newState);
    }
  };

  const toggleAudio = async () => {
    if (room) {
      const newState = !localAudioEnabled;
      await room.localParticipant.setMicrophoneEnabled(newState);
      setLocalAudioEnabled(newState);
    }
  };

  // Hand raise (for viewers)
  const toggleHandRaise = async () => {
    const newState = !handRaised;

    try {
      await api.setHandRaised(roomName, {
        participantIdentity: participantName,
        raised: newState,
      });

      setHandRaised(newState);

      sendDataMessage({
        type: newState ? DataMessageType.HAND_RAISE : DataMessageType.HAND_LOWER,
        senderId: participantName,
        senderName: participantName,
        timestamp: Date.now(),
      });

      showNotification(newState ? "Hand raised!" : "Hand lowered");
    } catch (err) {
      console.error("Error toggling hand raise:", err);
    }
  };

  // Invite viewer as guest (for host)
  const inviteAsGuest = async (viewerIdentity: string) => {
    try {
      await api.inviteGuest(roomName, {
        viewerIdentity,
        hostIdentity: participantName,
      });

      sendDataMessage({
        type: DataMessageType.GUEST_INVITE,
        senderId: participantName,
        senderName: participantName,
        targetParticipantId: viewerIdentity,
        targetParticipantName: viewerIdentity,
        timestamp: Date.now(),
      });

      showNotification(`Invitation sent to ${viewerIdentity}`);
    } catch (err) {
      const message = err instanceof ShowApiError ? err.message : 'Failed to invite';
      setError(message);
    }
  };

  // Accept guest invitation (for viewer)
  const acceptInvitation = async () => {
    if (!pendingInvite) return;

    try {
      handleDisconnect();

      const response = await api.inviteGuest(roomName, {
        viewerIdentity: participantName,
        hostIdentity: pendingInvite.from,
      });

      const { token, wsUrl } = response;

      setCurrentRole(ParticipantRole.GUEST);
      setPendingInvite(null);

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
      });

      roomRef.current = newRoom;
      setupRoomListeners(newRoom);

      await newRoom.connect(wsUrl, token);
      setRoom(newRoom);
      setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));

      // Enable media as guest
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (newRoom.state === ConnectionState.Connected) {
        await newRoom.localParticipant.setCameraEnabled(true);
        await newRoom.localParticipant.setMicrophoneEnabled(true);
      }

      showNotification("You are now a guest!");
    } catch (err) {
      const message = err instanceof ShowApiError ? err.message : 'Failed to accept invitation';
      setError(message);
      setPendingInvite(null);
    }
  };

  const declineInvitation = () => {
    setPendingInvite(null);
    showNotification("Invitation declined");
  };

  const removeGuestFromRoom = async (guestIdentity: string) => {
    try {
      await api.removeGuest(roomName, {
        guestIdentity,
        hostIdentity: participantName,
      });
      showNotification(`${guestIdentity} has been removed`);
    } catch (err) {
      const message = err instanceof ShowApiError ? err.message : 'Failed to remove guest';
      setError(message);
    }
  };

  // Computed state
  const isConnected = connectionState === ConnectionState.Connected;
  const isHost = currentRole === ParticipantRole.HOST;
  const isGuest = currentRole === ParticipantRole.GUEST;
  const isViewer = currentRole === ParticipantRole.VIEWER;
  const canBroadcast = isHost || isGuest;

  const hostParticipant = remoteParticipants.find((p) => {
    const meta = getParticipantMetadata(p);
    return meta?.role === ParticipantRole.HOST;
  });

  const guestParticipant = remoteParticipants.find((p) => {
    const meta = getParticipantMetadata(p);
    return meta?.role === ParticipantRole.GUEST;
  });

  // ============================================
  // Render: Join Form
  // ============================================

  if (!isConnected) {
    return (
      <div className="app">
        <header className="header">
          <div className="logo">LiveKit Show</div>
        </header>

        <div className="join-form">
          <h1>Join a Show</h1>
          <p className="subtitle">Enter the room details to get started</p>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
            />
          </div>

          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label>Join as</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ParticipantRole)}
            >
              <option value={ParticipantRole.HOST}>Host (start a show)</option>
              <option value={ParticipantRole.VIEWER}>Viewer (watch the show)</option>
            </select>
            <p className="hint">
              {selectedRole === ParticipantRole.HOST
                ? "As host, you can broadcast and invite guests"
                : "As viewer, you can watch and raise your hand to become a guest"}
            </p>
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Join Show"}
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // Render: Connected View
  // ============================================

  return (
    <div className="app">
      {/* Notification */}
      {notification && <div className="notification">{notification}</div>}

      {/* Invitation Modal */}
      {pendingInvite && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon">🎤</div>
            <h2>You're Invited!</h2>
            <p>{pendingInvite.fromName} wants you to join as a guest</p>
            <div className="modal-buttons">
              <button className="btn btn-primary" onClick={acceptInvitation}>Accept</button>
              <button className="btn btn-secondary" onClick={declineInvitation}>Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">LiveKit Show</div>
          <div className="live-badge">
            <span className="live-dot"></span>
            LIVE
          </div>
          <span className="separator">|</span>
          <span className="room-name">{roomName}</span>
        </div>
        <div className="header-right">
          <span className={`role-badge role-${currentRole}`}>{currentRole}</span>
          <button className="btn btn-danger" onClick={handleDisconnect}>Leave</button>
        </div>
      </header>

      <div className="main">
        {/* Video Section */}
        <div className="video-section">
          {error && <div className="error-message">{error}</div>}

          <div className="video-grid">
            {/* Local Video (Host or Guest) */}
            {localVideoTrack && canBroadcast && (
              <VideoRenderer
                track={localVideoTrack}
                isLocal={true}
                participantName={participantName}
                role={currentRole}
              />
            )}

            {/* Host Video (if we're not the host) */}
            {!isHost && hostParticipant && (() => {
              const videoTrack = hostParticipant.getTrackPublication(Track.Source.Camera)?.track;
              const audioTrack = hostParticipant.getTrackPublication(Track.Source.Microphone)?.track;
              const meta = getParticipantMetadata(hostParticipant);
              return videoTrack ? (
                <div key={hostParticipant.sid}>
                  <VideoRenderer
                    track={videoTrack}
                    participantName={meta?.displayName || hostParticipant.identity}
                    role={ParticipantRole.HOST}
                  />
                  {audioTrack && <AudioRenderer track={audioTrack} />}
                </div>
              ) : null;
            })()}

            {/* Guest Video (if we're not the guest) */}
            {!isGuest && guestParticipant && (() => {
              const videoTrack = guestParticipant.getTrackPublication(Track.Source.Camera)?.track;
              const audioTrack = guestParticipant.getTrackPublication(Track.Source.Microphone)?.track;
              const meta = getParticipantMetadata(guestParticipant);
              return videoTrack ? (
                <div key={guestParticipant.sid}>
                  <VideoRenderer
                    track={videoTrack}
                    participantName={meta?.displayName || guestParticipant.identity}
                    role={ParticipantRole.GUEST}
                  />
                  {audioTrack && <AudioRenderer track={audioTrack} />}
                </div>
              ) : null;
            })()}
          </div>

          {/* Empty state */}
          {!localVideoTrack && !hostParticipant && !guestParticipant && (
            <div className="empty-state">
              <div className="empty-icon">📺</div>
              <h3>{isViewer ? "Waiting for host..." : "No video stream"}</h3>
              <p>{isViewer ? "The host will start broadcasting soon" : "Enable your camera to start broadcasting"}</p>
            </div>
          )}

          {/* Controls (for Host/Guest) */}
          {canBroadcast && (
            <div className="controls">
              <button
                className={`control-btn ${!localAudioEnabled ? 'off' : ''}`}
                onClick={toggleAudio}
                title={localAudioEnabled ? "Mute" : "Unmute"}
              >
                {localAudioEnabled ? "🎤" : "🔇"}
              </button>
              <button
                className={`control-btn ${!localVideoEnabled ? 'off' : ''}`}
                onClick={toggleVideo}
                title={localVideoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {localVideoEnabled ? "📹" : "🚫"}
              </button>
            </div>
          )}

          {/* Hand Raise Button (for Viewers) */}
          {isViewer && (
            <div className="viewer-actions">
              <button
                className={`btn ${handRaised ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleHandRaise}
              >
                <span>✋</span>
                {handRaised ? "Lower Hand" : "Raise Hand to Join"}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar (Host only) */}
        {isHost && (
          <div className="sidebar">
            <div className="card">
              <h3 className="card-title">Viewers ({viewers.length})</h3>
              {viewers.length === 0 ? (
                <p className="empty-text">No viewers yet</p>
              ) : (
                <div className="viewer-list">
                  {viewers.map((viewer) => (
                    <div key={viewer.identity} className="viewer-item">
                      <div className="viewer-info">
                        {viewer.handRaised && <span className="hand-icon">✋</span>}
                        <span className="viewer-name">{viewer.name}</span>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => inviteAsGuest(viewer.identity)}
                      >
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Guest */}
            {guestParticipant && (
              <div className="card">
                <h3 className="card-title">Current Guest</h3>
                <div className="viewer-item">
                  <div className="viewer-info">
                    <span className="guest-icon">🎤</span>
                    <span className="viewer-name">
                      {getParticipantMetadata(guestParticipant)?.displayName || guestParticipant.identity}
                    </span>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeGuestFromRoom(guestParticipant.identity)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="card-title">Room Info</h3>
              <div className="room-info">
                <p><strong>Total:</strong> {1 + remoteParticipants.length} participants</p>
                <p><strong>Viewers:</strong> {viewers.length}</p>
                <p><strong>Guest:</strong> {guestParticipant ? "Yes" : "None"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

# LiveKit Interactive Show - Frontend Integration Guide

This guide helps your frontend team integrate the LiveKit Show SDK into your product.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [Implementation Guide](#implementation-guide)
5. [Code Examples](#code-examples)
6. [Event Handling](#event-handling)
7. [UI Components](#ui-components)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install livekit-client
```

### 2. Get a Token from Backend

```typescript
const response = await fetch('http://localhost:3001/api/rooms/join', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomName: 'my-show',
    participantName: 'user-123',
    role: 'viewer', // or 'host'
  }),
});

const { token, wsUrl } = await response.json();
```

### 3. Connect to Room

```typescript
import { Room, RoomEvent } from 'livekit-client';

const room = new Room();
await room.connect(wsUrl, token);
```

### 4. Display Video

```typescript
room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
  if (track.kind === 'video') {
    const videoElement = document.createElement('video');
    track.attach(videoElement);
    document.body.appendChild(videoElement);
  }
});
```

---

## Installation

### NPM

```bash
npm install livekit-client
```

### Yarn

```bash
yarn add livekit-client
```

### Required Peer Dependencies (React)

```bash
npm install react react-dom
```

---

## Core Concepts

### Roles

| Role | Can Publish | Can Subscribe | Can Invite |
|------|-------------|---------------|------------|
| **Host** | ✅ Video/Audio | ✅ All streams | ✅ Yes |
| **Guest** | ✅ Video/Audio | ✅ All streams | ❌ No |
| **Viewer** | ❌ No | ✅ All streams | ❌ No |

### Room Lifecycle

```
1. DISCONNECTED  →  User opens app
2. CONNECTING    →  Calling room.connect()
3. CONNECTED     →  Successfully joined
4. RECONNECTING  →  Network issues, auto-retry
5. DISCONNECTED  →  Left room or connection failed
```

### Participant Types

```typescript
// Local participant (you)
room.localParticipant

// Remote participants (others in room)
room.remoteParticipants // Map<string, RemoteParticipant>
```

---

## Implementation Guide

### Step 1: Create Room Manager

```typescript
// roomManager.ts
import { Room, RoomEvent, ConnectionState, VideoPresets } from 'livekit-client';

export class RoomManager {
  private room: Room | null = null;
  
  async connect(wsUrl: string, token: string): Promise<Room> {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
    });
    
    await this.room.connect(wsUrl, token);
    return this.room;
  }
  
  disconnect(): void {
    this.room?.disconnect();
    this.room = null;
  }
  
  getRoom(): Room | null {
    return this.room;
  }
}
```

### Step 2: Handle Events

```typescript
// setupRoomEvents.ts
import { Room, RoomEvent, RemoteParticipant, Track } from 'livekit-client';

export function setupRoomEvents(
  room: Room,
  callbacks: {
    onParticipantConnected?: (participant: RemoteParticipant) => void;
    onParticipantDisconnected?: (participant: RemoteParticipant) => void;
    onTrackSubscribed?: (track: Track, participant: RemoteParticipant) => void;
    onConnectionStateChanged?: (state: ConnectionState) => void;
  }
) {
  room.on(RoomEvent.ParticipantConnected, (participant) => {
    callbacks.onParticipantConnected?.(participant);
  });

  room.on(RoomEvent.ParticipantDisconnected, (participant) => {
    callbacks.onParticipantDisconnected?.(participant);
  });

  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    callbacks.onTrackSubscribed?.(track, participant);
  });

  room.on(RoomEvent.ConnectionStateChanged, (state) => {
    callbacks.onConnectionStateChanged?.(state);
  });
}
```

### Step 3: Video Rendering

```typescript
// VideoRenderer.tsx (React)
import { useEffect, useRef } from 'react';
import { Track } from 'livekit-client';

interface VideoRendererProps {
  track: Track;
  isLocal?: boolean;
}

export function VideoRenderer({ track, isLocal = false }: VideoRendererProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && track) {
      track.attach(videoRef.current);
    }
    return () => {
      track?.detach();
    };
  }, [track]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: isLocal ? 'scaleX(-1)' : 'none', // Mirror local video
      }}
    />
  );
}
```

### Step 4: Enable Camera/Microphone (Host/Guest)

```typescript
// Enable camera
await room.localParticipant.setCameraEnabled(true);

// Enable microphone
await room.localParticipant.setMicrophoneEnabled(true);

// Toggle camera
const isEnabled = room.localParticipant.isCameraEnabled;
await room.localParticipant.setCameraEnabled(!isEnabled);

// Toggle microphone
const isMicEnabled = room.localParticipant.isMicrophoneEnabled;
await room.localParticipant.setMicrophoneEnabled(!isMicEnabled);
```

### Step 5: Send Data Messages

```typescript
// Send to all participants
const message = {
  type: 'hand_raise',
  senderId: room.localParticipant.identity,
  timestamp: Date.now(),
};

const data = new TextEncoder().encode(JSON.stringify(message));
await room.localParticipant.publishData(data, { reliable: true });
```

### Step 6: Receive Data Messages

```typescript
room.on(RoomEvent.DataReceived, (payload, participant) => {
  const message = JSON.parse(new TextDecoder().decode(payload));
  
  switch (message.type) {
    case 'hand_raise':
      console.log(`${participant?.identity} raised their hand`);
      break;
    case 'guest_invite':
      if (message.targetParticipantId === room.localParticipant.identity) {
        // Show invitation modal
        showInvitationModal(message);
      }
      break;
  }
});
```

---

## Code Examples

### Complete React Hook

```typescript
// useRoom.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Room,
  RoomEvent,
  ConnectionState,
  RemoteParticipant,
  Track,
  VideoPresets,
} from 'livekit-client';

interface UseRoomOptions {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export function useRoom(options: UseRoomOptions = {}) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [localVideoTrack, setLocalVideoTrack] = useState<Track | null>(null);
  const roomRef = useRef<Room | null>(null);

  const connect = useCallback(async (wsUrl: string, token: string) => {
    const newRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
    });

    roomRef.current = newRoom;

    // Setup event listeners
    newRoom.on(RoomEvent.ConnectionStateChanged, setConnectionState);
    
    newRoom.on(RoomEvent.ParticipantConnected, () => {
      setParticipants(Array.from(newRoom.remoteParticipants.values()));
    });
    
    newRoom.on(RoomEvent.ParticipantDisconnected, () => {
      setParticipants(Array.from(newRoom.remoteParticipants.values()));
    });
    
    newRoom.on(RoomEvent.TrackSubscribed, () => {
      setParticipants(Array.from(newRoom.remoteParticipants.values()));
    });
    
    newRoom.on(RoomEvent.LocalTrackPublished, (publication) => {
      if (publication.kind === Track.Kind.Video) {
        setLocalVideoTrack(publication.track);
      }
    });
    
    newRoom.on(RoomEvent.Disconnected, () => {
      options.onDisconnected?.();
    });

    try {
      await newRoom.connect(wsUrl, token);
      setRoom(newRoom);
      setParticipants(Array.from(newRoom.remoteParticipants.values()));
      options.onConnected?.();
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }, [options]);

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect();
    setRoom(null);
    setConnectionState(ConnectionState.Disconnected);
    setParticipants([]);
    setLocalVideoTrack(null);
  }, []);

  const enableCamera = useCallback(async (enabled: boolean) => {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setCameraEnabled(enabled);
    }
  }, []);

  const enableMicrophone = useCallback(async (enabled: boolean) => {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
    };
  }, []);

  return {
    room,
    connectionState,
    participants,
    localVideoTrack,
    connect,
    disconnect,
    enableCamera,
    enableMicrophone,
    isConnected: connectionState === ConnectionState.Connected,
  };
}
```

### Usage in Component

```tsx
// ShowRoom.tsx
import { useRoom } from './useRoom';
import { VideoRenderer } from './VideoRenderer';

function ShowRoom({ roomName, userName, role }) {
  const {
    room,
    participants,
    localVideoTrack,
    connect,
    disconnect,
    enableCamera,
    enableMicrophone,
    isConnected,
  } = useRoom({
    onConnected: () => console.log('Connected!'),
    onDisconnected: () => console.log('Disconnected'),
    onError: (err) => console.error('Error:', err),
  });

  const handleJoin = async () => {
    // Get token from your backend
    const response = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName, participantName: userName, role }),
    });
    const { token, wsUrl } = await response.json();
    
    await connect(wsUrl, token);
    
    // Enable media for host
    if (role === 'host') {
      await enableCamera(true);
      await enableMicrophone(true);
    }
  };

  if (!isConnected) {
    return <button onClick={handleJoin}>Join Room</button>;
  }

  return (
    <div>
      {/* Local video */}
      {localVideoTrack && (
        <VideoRenderer track={localVideoTrack} isLocal />
      )}
      
      {/* Remote participants */}
      {participants.map((participant) => {
        const videoTrack = participant.getTrackPublication('camera')?.track;
        return videoTrack ? (
          <VideoRenderer key={participant.sid} track={videoTrack} />
        ) : null;
      })}
      
      <button onClick={disconnect}>Leave</button>
    </div>
  );
}
```

---

## Event Handling

### Key Events to Handle

| Event | When | Action |
|-------|------|--------|
| `ConnectionStateChanged` | Connection status changes | Update UI loading state |
| `ParticipantConnected` | New participant joins | Add to participants list |
| `ParticipantDisconnected` | Participant leaves | Remove from list |
| `TrackSubscribed` | New track available | Render video/audio |
| `TrackUnsubscribed` | Track removed | Stop rendering |
| `LocalTrackPublished` | Local camera/mic enabled | Show local preview |
| `DataReceived` | Data message received | Handle hand raise, invites |
| `MediaDevicesError` | Camera/mic access denied | Show permission error |

---

## UI Components

### Recommended Component Structure

```
components/
├── Room/
│   ├── RoomProvider.tsx      # Context provider
│   ├── VideoGrid.tsx         # Grid of video tiles
│   ├── VideoTile.tsx         # Single video tile
│   ├── Controls.tsx          # Mute/camera/leave buttons
│   └── ParticipantList.tsx   # Sidebar participant list
├── Invitation/
│   ├── InviteModal.tsx       # Invitation popup
│   └── HandRaiseButton.tsx   # Hand raise for viewers
└── Host/
    ├── ViewerList.tsx        # List of viewers (host only)
    └── GuestControls.tsx     # Invite/remove guest (host only)
```

---

## Best Practices

### 1. Connection Management

```typescript
// Always store room in a ref for cleanup
const roomRef = useRef<Room | null>(null);

// Cleanup on unmount
useEffect(() => {
  return () => {
    roomRef.current?.disconnect();
  };
}, []);
```

### 2. Error Handling

```typescript
try {
  await room.connect(wsUrl, token);
} catch (error) {
  if (error.message.includes('permission')) {
    showError('Please allow camera/microphone access');
  } else if (error.message.includes('network')) {
    showError('Network error. Please check your connection.');
  } else {
    showError('Failed to connect. Please try again.');
  }
}
```

### 3. Reconnection

```typescript
room.on(RoomEvent.Reconnecting, () => {
  showToast('Reconnecting...');
});

room.on(RoomEvent.Reconnected, () => {
  showToast('Reconnected!');
});
```

### 4. Track Handling

```typescript
// Always detach tracks when done
useEffect(() => {
  if (videoRef.current && track) {
    track.attach(videoRef.current);
  }
  return () => {
    track?.detach(); // Important: prevent memory leaks
  };
}, [track]);
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Black video | Camera permissions denied | Check browser permissions |
| No audio | Microphone not enabled | Call `setMicrophoneEnabled(true)` |
| Connection fails | Invalid token | Check token expiry, regenerate |
| Viewers can't see host | Host not publishing | Ensure `setCameraEnabled(true)` called |
| Multiple connections | React StrictMode | Use refs to prevent double connect |

### Debug Mode

```typescript
// Enable LiveKit debug logging
import { setLogLevel, LogLevel } from 'livekit-client';
setLogLevel(LogLevel.debug);
```

### Check Connection State

```typescript
console.log('Connection state:', room.state);
console.log('Local participant:', room.localParticipant.identity);
console.log('Remote participants:', room.remoteParticipants.size);
console.log('Is publishing video:', room.localParticipant.isCameraEnabled);
```

---

## Support

- **LiveKit Documentation**: https://docs.livekit.io
- **LiveKit Discord**: https://livekit.io/discord
- **GitHub Issues**: Report bugs in this repository

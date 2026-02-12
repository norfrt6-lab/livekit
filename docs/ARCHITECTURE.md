# LiveKit Interactive Show - Architecture Documentation

## Overview

This project implements an MVP for a live interactive show format using LiveKit SDK. It supports:
- **1 Host** - Creates and controls the show, can broadcast video/audio
- **1 Guest** - Invited by host to co-broadcast (promoted from viewer)
- **~5,000 Viewers** - Watch-only participants

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATIONS                            │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────────┐  │
│  │     HOST     │   │    GUEST     │   │     VIEWERS (up to 5000)     │  │
│  │  (1 per room)│   │ (1 per room) │   │        (watch only)          │  │
│  └──────┬───────┘   └──────┬───────┘   └─────────────┬────────────────┘  │
│         │                  │                         │                   │
│         │     WebRTC (video/audio/data)              │                   │
│         └──────────────────┼─────────────────────────┘                   │
└────────────────────────────┼─────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        LIVEKIT CLOUD (SFU)                              │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Selective Forwarding Unit                                         │ │
│  │  - Receives streams from Host & Guest                              │ │
│  │  - Forwards to all Viewers                                         │ │
│  │  - Handles adaptive bitrate                                        │ │
│  │  - Manages WebRTC connections                                      │ │
│  │  - Scales automatically for 5000+ viewers                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ REST API (Room Management)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVER                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  Token Service  │  │  Room Service   │  │    Room State Store     │  │
│  │  - JWT tokens   │  │  - Join room    │  │  - Track host/guest     │  │
│  │  - Permissions  │  │  - Invite guest │  │  - In-memory (MVP)      │  │
│  │  - Role-based   │  │  - Remove guest │  │  - Redis (production)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
livekit/
├── packages/
│   ├── shared/               # Shared TypeScript types
│   │   └── src/
│   │       └── index.ts      # Types, enums, interfaces
│   │
│   ├── server/               # Backend API server
│   │   └── src/
│   │       ├── index.ts      # Express app entry
│   │       ├── config.ts     # Environment configuration
│   │       ├── routes/
│   │       │   └── room.routes.ts   # API endpoints
│   │       └── services/
│   │           ├── token.service.ts  # JWT token generation
│   │           └── room.service.ts   # Room management
│   │
│   └── client/               # React SDK (optional)
│       └── src/
│           ├── context/      # React context providers
│           ├── hooks/        # Custom React hooks
│           └── components/   # UI components
│
├── apps/
│   ├── demo/                 # Demo client application
│   │   └── src/
│   │       └── App.tsx       # Main demo app
│   │
│   └── dashboard/            # Analytics dashboard (bonus)
│
└── docs/                     # Documentation
    ├── ARCHITECTURE.md       # This file
    ├── API.md                # API documentation
    └── INTEGRATION.md        # Frontend integration guide
```

## Data Flow

### 1. Join Flow (Host)

```
Host Client                    Backend Server                 LiveKit Cloud
     │                              │                              │
     │  POST /api/rooms/join        │                              │
     │  {roomName, name, role:host} │                              │
     │ ─────────────────────────────>                              │
     │                              │                              │
     │                              │  Generate JWT with           │
     │                              │  HOST permissions            │
     │                              │                              │
     │  {token, wsUrl}              │                              │
     │ <─────────────────────────────                              │
     │                              │                              │
     │  WebSocket Connect (token)   │                              │
     │ ─────────────────────────────────────────────────────────────>
     │                              │                              │
     │  Publish Video/Audio         │                              │
     │ ─────────────────────────────────────────────────────────────>
     │                              │                              │
```

### 2. Join Flow (Viewer)

```
Viewer Client                  Backend Server                 LiveKit Cloud
     │                              │                              │
     │  POST /api/rooms/join        │                              │
     │  {roomName, name, role:viewer}                              │
     │ ─────────────────────────────>                              │
     │                              │                              │
     │                              │  Generate JWT with           │
     │                              │  VIEWER permissions          │
     │                              │  (subscribe only)            │
     │                              │                              │
     │  {token, wsUrl}              │                              │
     │ <─────────────────────────────                              │
     │                              │                              │
     │  WebSocket Connect (token)   │                              │
     │ ─────────────────────────────────────────────────────────────>
     │                              │                              │
     │  Subscribe to Host streams   │                              │
     │ <─────────────────────────────────────────────────────────────
     │                              │                              │
```

### 3. Guest Invitation Flow

```
Host          Viewer           Backend                    LiveKit
  │              │                │                          │
  │              │                │                          │
  │  Viewer raises hand (data message)                       │
  │ <────────────────────────────────────────────────────────│
  │              │                │                          │
  │  Click "Invite"               │                          │
  │ ──────────────────────────────>                          │
  │  POST /api/rooms/{name}/invite                           │
  │              │                │                          │
  │              │                │  Validate host           │
  │              │                │  Generate GUEST token    │
  │              │                │                          │
  │  {success, token, wsUrl}      │                          │
  │ <──────────────────────────────                          │
  │              │                │                          │
  │  Send GUEST_INVITE (data)     │                          │
  │ ─────────────────────────────────────────────────────────>
  │              │                │                          │
  │              │  Receive invitation                       │
  │              │ <─────────────────────────────────────────│
  │              │                │                          │
  │              │  Accept invitation                        │
  │              │  Disconnect as viewer                     │
  │              │  Reconnect with GUEST token               │
  │              │ ─────────────────────────────────────────>│
  │              │                │                          │
  │              │  Publish video/audio as guest             │
  │              │ ─────────────────────────────────────────>│
  │              │                │                          │
```

## Role Permissions

| Permission           | Host | Guest | Viewer |
|---------------------|------|-------|--------|
| Join room           | ✅   | ✅    | ✅    |
| Publish video/audio | ✅   | ✅    | ❌     |
| Subscribe to streams| ✅   | ✅    | ✅    |
| Send data messages  | ✅   | ✅    | ✅    |
| Invite guests       | ✅   | ❌     | ❌     |
| Remove guests       | ✅   | ❌     | ❌     |
| Create room         | ✅   | ❌     | ❌     |
| Room admin          | ✅   | ❌     | ❌     |

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Streaming | LiveKit Cloud | WebRTC SFU, handles scaling |
| Backend | Node.js + Express | API server, token generation |
| Client SDK | livekit-client | WebRTC client library |
| Types | TypeScript | Type safety across packages |
| State | In-memory Map | Room state (use Redis in production) |

## Scalability Considerations

### Current MVP (In-Memory State)
- Room state stored in Node.js memory
- Suitable for single-server deployment
- Handles ~100 concurrent rooms

### Production Recommendations
1. **State Store**: Replace in-memory Map with Redis
2. **Load Balancing**: Multiple backend servers behind load balancer
3. **Database**: PostgreSQL for persistent room/user data
4. **Authentication**: Add JWT auth for API endpoints
5. **Rate Limiting**: Add rate limiting for API endpoints

## Security Considerations

1. **Token Security**: LiveKit tokens are short-lived JWTs
2. **Role Validation**: Server validates role assignments
3. **Host Verification**: Only hosts can invite/remove guests
4. **Single Host/Guest**: Server enforces one host and one guest per room

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# LiveKit Cloud Credentials
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_WS_URL=wss://your-project.livekit.cloud

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

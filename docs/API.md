# LiveKit Interactive Show - API Documentation

## Base URL

```
Development: http://localhost:3001/api
Production:  https://your-api-domain.com/api
```

## Authentication

Currently, the API does not require authentication (MVP). For production, implement:
- JWT Bearer tokens for API endpoints
- API key authentication for server-to-server calls

---

## Room Endpoints

### Join Room

Join a room and receive a LiveKit access token.

```http
POST /api/rooms/join
```

**Request Body:**
```json
{
  "roomName": "my-show",
  "participantName": "john-doe",
  "role": "host"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| roomName | string | Yes | Unique room identifier |
| participantName | string | Yes | Display name for participant |
| role | string | Yes | `"host"` or `"viewer"` (guest assigned via invite) |

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "wsUrl": "wss://your-project.livekit.cloud",
  "roomName": "my-show",
  "role": "host"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `roomName and participantName are required` | Missing required fields |
| 409 | `Room already has a host` | Another host is already in the room |

---

### List Rooms

Get all active rooms.

```http
GET /api/rooms
```

**Response (200 OK):**
```json
{
  "rooms": [
    {
      "name": "my-show",
      "sid": "RM_xxxxx",
      "numParticipants": 5,
      "creationTime": "1704067200"
    }
  ]
}
```

---

### Get Room Info

Get detailed information about a specific room.

```http
GET /api/rooms/:roomName
```

**Response (200 OK):**
```json
{
  "room": {
    "name": "my-show",
    "sid": "RM_xxxxx",
    "numParticipants": 5,
    "hasHost": true,
    "hasGuest": false
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | `Room not found` | Room does not exist |

---

### Delete Room

End a room and disconnect all participants.

```http
DELETE /api/rooms/:roomName
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## Participant Endpoints

### List Participants

Get all participants in a room.

```http
GET /api/rooms/:roomName/participants
```

**Response (200 OK):**
```json
{
  "participants": [
    {
      "sid": "PA_xxxxx",
      "identity": "john-doe",
      "name": "John Doe",
      "metadata": "{\"role\":\"host\",\"displayName\":\"John Doe\"}",
      "joinedAt": "1704067200"
    }
  ]
}
```

---

### Remove Participant

Remove a participant from a room.

```http
DELETE /api/rooms/:roomName/participants/:identity
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## Guest Invitation Endpoints

### Invite Viewer as Guest

Host invites a viewer to become a guest (co-broadcaster).

```http
POST /api/rooms/:roomName/invite
```

**Request Body:**
```json
{
  "viewerIdentity": "viewer-123",
  "hostIdentity": "host-456"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| viewerIdentity | string | Yes | Identity of viewer to invite |
| hostIdentity | string | Yes | Identity of the host making the invitation |

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "wsUrl": "wss://your-project.livekit.cloud",
  "message": "viewer-123 has been promoted to guest"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `viewerIdentity and hostIdentity are required` | Missing required fields |
| 403 | `Only the host can promote viewers to guest` | Requester is not the host |
| 403 | `Room already has a guest` | A guest is already in the room |

---

### Demote Guest to Viewer

Host demotes a guest back to viewer status.

```http
POST /api/rooms/:roomName/demote
```

**Request Body:**
```json
{
  "guestIdentity": "guest-123",
  "hostIdentity": "host-456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "wsUrl": "wss://your-project.livekit.cloud",
  "message": "guest-123 has been demoted to viewer"
}
```

---

### Remove Guest

Host removes a guest from the room completely.

```http
POST /api/rooms/:roomName/remove-guest
```

**Request Body:**
```json
{
  "guestIdentity": "guest-123",
  "hostIdentity": "host-456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "guest-123 has been removed from the room"
}
```

---

## Hand Raise Endpoint

### Toggle Hand Raise

Viewer raises or lowers their hand to request guest invitation.

```http
POST /api/rooms/:roomName/hand-raise
```

**Request Body:**
```json
{
  "participantIdentity": "viewer-123",
  "raised": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| participantIdentity | string | Yes | Identity of the participant |
| raised | boolean | Yes | `true` to raise hand, `false` to lower |

**Response (200 OK):**
```json
{
  "success": true,
  "handRaised": true
}
```

---

## Health Check

### Check Server Status

```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Data Message Types (WebRTC Data Channel)

These messages are sent between clients via LiveKit's data channel, not HTTP.

### Message Format

```typescript
interface DataMessage {
  type: DataMessageType;
  senderId: string;
  senderName: string;
  timestamp: number;
}
```

### Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `hand_raise` | Viewer → All | Viewer raised their hand |
| `hand_lower` | Viewer → All | Viewer lowered their hand |
| `guest_invite` | Host → Viewer | Host sends invitation to specific viewer |
| `guest_invite_response` | Viewer → Host | Viewer accepts/declines invitation |
| `guest_promoted` | Broadcast | Announces new guest |
| `guest_demoted` | Broadcast | Announces guest removal |
| `chat_message` | All → All | Chat message (optional feature) |

### Example: Hand Raise Message

```json
{
  "type": "hand_raise",
  "senderId": "viewer-123",
  "senderName": "John Viewer",
  "timestamp": 1704067200000
}
```

### Example: Guest Invite Message

```json
{
  "type": "guest_invite",
  "senderId": "host-456",
  "senderName": "Host Jane",
  "targetParticipantId": "viewer-123",
  "targetParticipantName": "John Viewer",
  "timestamp": 1704067200000
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

## Rate Limits (Production Recommendation)

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/rooms/join | 10 | 1 minute |
| POST /api/rooms/:name/invite | 5 | 1 minute |
| POST /api/rooms/:name/hand-raise | 10 | 1 minute |
| All other endpoints | 100 | 1 minute |

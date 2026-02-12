# LiveKit Interactive Show

MVP for a live interactive show platform supporting ~5,000 viewers with one host and one guest at a time.

## Features

- **Host Broadcasting**: Host can start a show and broadcast video/audio
- **Guest Invitation**: Host can invite viewers to become a guest
- **Hand Raise**: Viewers can raise their hand to request guest access
- **Role-based Permissions**: HOST (publish + admin), GUEST (publish), VIEWER (subscribe only)
- **Scalable**: Built on LiveKit SFU architecture for 5,000+ concurrent viewers

## Project Structure

```
livekit/
├── packages/
│   ├── server/          # Backend API (Express.js)
│   │   ├── src/
│   │   │   ├── index.ts           # Server entry point
│   │   │   ├── config.ts          # LiveKit credentials
│   │   │   ├── routes/
│   │   │   │   └── room.routes.ts # API endpoints
│   │   │   └── services/
│   │   │       ├── token.service.ts   # JWT token generation
│   │   │       └── room.service.ts    # Room state management
│   │   └── package.json
│   │
│   └── shared/          # Shared TypeScript types
│       ├── src/
│       │   └── index.ts  # ParticipantRole, DataMessageType, etc.
│       └── package.json
│
├── apps/
│   ├── demo/            # Working demo application
│   │   ├── src/
│   │   │   ├── App.tsx       # Main React component
│   │   │   ├── api/          # API client module
│   │   │   └── index.css     # Styles
│   │   └── package.json
│   │
│   └── dashboard/       # Admin dashboard (optional)
│
└── docs/                # Documentation
    ├── ARCHITECTURE.md  # System design
    ├── API.md           # API reference
    └── INTEGRATION.md   # Frontend integration guide
```

## Quick Start

### Prerequisites

- Node.js 18+
- LiveKit Cloud account (or self-hosted LiveKit server)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure LiveKit Credentials

Edit `packages/server/.env`:

```env
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_WS_URL=wss://your-project.livekit.cloud
PORT=3001
```

### 3. Build Packages

```bash
npm run build:shared
npm run build:server
```

### 4. Start Server

```bash
npm run dev:server
```

Server runs at `http://localhost:3001`

### 5. Start Demo App

In a new terminal:

```bash
npm run dev:demo
```

Demo runs at `http://localhost:5173`

### 6. Test the Flow

1. Open `http://localhost:5173` in browser
2. Enter room name and your name
3. Select "Host" and click "Join Show"
4. Open another browser tab
5. Join same room as "Viewer"
6. As host, click "Invite" to invite the viewer
7. Viewer accepts and becomes a guest

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rooms/join` | POST | Join room as HOST or VIEWER |
| `/api/rooms/:roomName/invite` | POST | Invite viewer to become guest |
| `/api/rooms/:roomName/remove-guest` | POST | Remove current guest |
| `/api/rooms/:roomName/hand-raise` | POST | Toggle hand raise status |

See [docs/API.md](docs/API.md) for full API documentation.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Browser   │────▶│   Server    │────▶│  LiveKit Cloud  │
│  (Demo App) │     │  (Express)  │     │     (SFU)       │
└─────────────┘     └─────────────┘     └─────────────────┘
       │                   │                     │
       │   1. Get Token    │                     │
       │──────────────────▶│                     │
       │   2. Token + URL  │                     │
       │◀──────────────────│                     │
       │                   │                     │
       │   3. Connect WebSocket                  │
       │────────────────────────────────────────▶│
       │   4. Publish/Subscribe Media            │
       │◀───────────────────────────────────────▶│
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture.

## For Frontend Team

See [docs/INTEGRATION.md](docs/INTEGRATION.md) for:

- React integration examples
- API client usage
- Event handling
- Best practices

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:server` | Start server in dev mode |
| `npm run dev:demo` | Start demo app in dev mode |
| `npm run build:shared` | Build shared types |
| `npm run build:server` | Build server |
| `npm run build:demo` | Build demo app |

## Tech Stack

- **Server**: Express.js, livekit-server-sdk
- **Demo**: React, Vite, livekit-client
- **Shared**: TypeScript
- **Infrastructure**: LiveKit Cloud (SFU)

## License

MIT

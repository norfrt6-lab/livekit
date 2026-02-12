import { RoomServiceClient, Room, ParticipantInfo } from 'livekit-server-sdk';
import { config } from '../config';
import { generateToken, generatePromotionToken, TokenOptions } from './token.service';
import {
  ParticipantRole,
  RoomInfo,
  parseParticipantMetadata,
  stringifyParticipantMetadata,
  ParticipantMetadata
} from '@livekit-show/shared';

// Initialize Room Service Client
const roomService = new RoomServiceClient(
  config.livekit.wsUrl.replace('wss://', 'https://'),
  config.livekit.apiKey,
  config.livekit.apiSecret
);

// Track active rooms and their hosts/guests (in-memory for MVP)
// In production, use Redis or database
const roomState = new Map<string, {
  hostId: string | null;
  guestId: string | null;
}>();

export interface JoinRoomResult {
  token: string;
  wsUrl: string;
  roomName: string;
  role: ParticipantRole;
}

export async function joinRoom(options: TokenOptions): Promise<JoinRoomResult> {
  const { roomName, participantName, role } = options;

  // Initialize room state if needed
  if (!roomState.has(roomName)) {
    roomState.set(roomName, { hostId: null, guestId: null });
  }

  const state = roomState.get(roomName)!;

  // Validate role assignment
  if (role === ParticipantRole.HOST) {
    // Check if room already has a host
    if (state.hostId && state.hostId !== participantName) {
      // Check if the existing host is still in the room
      const participants = await listParticipants(roomName);
      const hostStillPresent = participants.some(p => p.identity === state.hostId);

      if (hostStillPresent) {
        throw new Error('Room already has a host');
      }
    }
    state.hostId = participantName;
  }

  if (role === ParticipantRole.GUEST) {
    // Check if room already has a guest
    if (state.guestId && state.guestId !== participantName) {
      const participants = await listParticipants(roomName);
      const guestStillPresent = participants.some(p => p.identity === state.guestId);

      if (guestStillPresent) {
        throw new Error('Room already has a guest. Please join as viewer.');
      }
    }
    state.guestId = participantName;
  }

  const token = await generateToken(options);

  return {
    token,
    wsUrl: config.livekit.wsUrl,
    roomName: options.roomName,
    role,
  };
}

// Promote a viewer to guest (called by host)
export async function promoteToGuest(
  roomName: string,
  viewerIdentity: string,
  hostIdentity: string
): Promise<{ token: string; wsUrl: string }> {
  const state = roomState.get(roomName);

  if (!state) {
    throw new Error('Room not found');
  }

  // Verify the requester is the host
  if (state.hostId !== hostIdentity) {
    throw new Error('Only the host can promote viewers to guest');
  }

  // Check if there's already a guest
  if (state.guestId) {
    const participants = await listParticipants(roomName);
    const guestStillPresent = participants.some(p => p.identity === state.guestId);

    if (guestStillPresent) {
      throw new Error('Room already has a guest. Remove current guest first.');
    }
  }

  // Update state
  state.guestId = viewerIdentity;

  // Generate new token with guest permissions
  const token = await generatePromotionToken({
    roomName,
    participantName: viewerIdentity,
    newRole: ParticipantRole.GUEST,
  });

  return {
    token,
    wsUrl: config.livekit.wsUrl,
  };
}

// Demote guest back to viewer (called by host)
export async function demoteToViewer(
  roomName: string,
  guestIdentity: string,
  hostIdentity: string
): Promise<{ token: string; wsUrl: string }> {
  const state = roomState.get(roomName);

  if (!state) {
    throw new Error('Room not found');
  }

  // Verify the requester is the host
  if (state.hostId !== hostIdentity) {
    throw new Error('Only the host can demote guests');
  }

  // Clear guest from state
  if (state.guestId === guestIdentity) {
    state.guestId = null;
  }

  // Generate new token with viewer permissions
  const token = await generatePromotionToken({
    roomName,
    participantName: guestIdentity,
    newRole: ParticipantRole.VIEWER,
  });

  return {
    token,
    wsUrl: config.livekit.wsUrl,
  };
}

// Remove guest from room completely (kick)
export async function removeGuest(
  roomName: string,
  guestIdentity: string,
  hostIdentity: string
): Promise<boolean> {
  const state = roomState.get(roomName);

  if (!state) {
    throw new Error('Room not found');
  }

  // Verify the requester is the host
  if (state.hostId !== hostIdentity) {
    throw new Error('Only the host can remove guests');
  }

  // Remove from LiveKit room
  const removed = await removeParticipant(roomName, guestIdentity);

  if (removed && state.guestId === guestIdentity) {
    state.guestId = null;
  }

  return removed;
}

// Update participant metadata (e.g., hand raised status)
export async function updateParticipantMetadata(
  roomName: string,
  identity: string,
  metadata: Partial<ParticipantMetadata>
): Promise<boolean> {
  try {
    const participants = await roomService.listParticipants(roomName);
    const participant = participants.find(p => p.identity === identity);

    if (!participant) {
      return false;
    }

    const currentMetadata = parseParticipantMetadata(participant.metadata) || {
      role: ParticipantRole.VIEWER,
      displayName: identity,
    };

    const newMetadata = { ...currentMetadata, ...metadata };

    await roomService.updateParticipant(roomName, identity, stringifyParticipantMetadata(newMetadata));
    return true;
  } catch (error) {
    console.error('Error updating participant metadata:', error);
    return false;
  }
}

export async function listRooms(): Promise<Room[]> {
  try {
    const rooms = await roomService.listRooms();
    return rooms;
  } catch (error) {
    console.error('Error listing rooms:', error);
    return [];
  }
}

export async function getRoom(roomName: string): Promise<Room | null> {
  try {
    const rooms = await roomService.listRooms([roomName]);
    return rooms.length > 0 ? rooms[0] : null;
  } catch (error) {
    console.error('Error getting room:', error);
    return null;
  }
}

export async function getRoomInfo(roomName: string): Promise<RoomInfo | null> {
  try {
    const room = await getRoom(roomName);
    if (!room) return null;

    const state = roomState.get(roomName);

    return {
      name: room.name,
      sid: room.sid,
      numParticipants: room.numParticipants,
      hasHost: !!state?.hostId,
      hasGuest: !!state?.guestId,
    };
  } catch (error) {
    console.error('Error getting room info:', error);
    return null;
  }
}

export async function deleteRoom(roomName: string): Promise<boolean> {
  try {
    await roomService.deleteRoom(roomName);
    roomState.delete(roomName);
    return true;
  } catch (error) {
    console.error('Error deleting room:', error);
    return false;
  }
}

export async function listParticipants(roomName: string): Promise<ParticipantInfo[]> {
  try {
    const participants = await roomService.listParticipants(roomName);
    return participants;
  } catch (error) {
    console.error('Error listing participants:', error);
    return [];
  }
}

export async function removeParticipant(roomName: string, identity: string): Promise<boolean> {
  try {
    await roomService.removeParticipant(roomName, identity);

    // Update room state
    const state = roomState.get(roomName);
    if (state) {
      if (state.hostId === identity) state.hostId = null;
      if (state.guestId === identity) state.guestId = null;
    }

    return true;
  } catch (error) {
    console.error('Error removing participant:', error);
    return false;
  }
}

// Clean up room state when room is empty
export async function cleanupRoomState(roomName: string): Promise<void> {
  const participants = await listParticipants(roomName);
  if (participants.length === 0) {
    roomState.delete(roomName);
  }
}

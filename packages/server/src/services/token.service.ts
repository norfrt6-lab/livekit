import { AccessToken } from 'livekit-server-sdk';
import { config } from '../config';
import { ParticipantRole, ParticipantMetadata, stringifyParticipantMetadata } from '@livekit-show/shared';

export interface TokenOptions {
  roomName: string;
  participantName: string;
  role: ParticipantRole;
  metadata?: Partial<ParticipantMetadata>;
}

export async function generateToken(options: TokenOptions): Promise<string> {
  const { roomName, participantName, role, metadata } = options;

  // Build participant metadata
  const participantMetadata: ParticipantMetadata = {
    role,
    displayName: participantName,
    handRaised: false,
    ...metadata,
  };

  const token = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
    identity: participantName,
    name: participantName,
    metadata: stringifyParticipantMetadata(participantMetadata),
  });

  // Set permissions based on role
  switch (role) {
    case ParticipantRole.HOST:
      // Host has full permissions including room admin
      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,  // For sending invitations, chat, etc.
        roomAdmin: true,       // Can kick participants
        roomCreate: true,      // Can create the room
      });
      break;

    case ParticipantRole.GUEST:
      // Guest can publish but cannot admin the room
      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,  // For chat messages
        roomAdmin: false,
        roomCreate: false,
      });
      break;

    case ParticipantRole.VIEWER:
    default:
      // Viewer can only watch and send data (for hand raise)
      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: false,     // Cannot broadcast video/audio
        canSubscribe: true,    // Can watch streams
        canPublishData: true,  // Can send hand raise, chat
        roomAdmin: false,
        roomCreate: false,
      });
      break;
  }

  // toJwt() returns a Promise in livekit-server-sdk v2
  return await token.toJwt();
}

// Generate a new token for role promotion (viewer -> guest)
export async function generatePromotionToken(options: {
  roomName: string;
  participantName: string;
  newRole: ParticipantRole;
}): Promise<string> {
  return generateToken({
    roomName: options.roomName,
    participantName: options.participantName,
    role: options.newRole,
  });
}

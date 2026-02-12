/**
 * LiveKit Interactive Show - Shared Types
 *
 * This package contains shared types and utilities used by both
 * the server and client applications.
 */

// ============================================
// Participant Roles
// ============================================

/**
 * Roles that a participant can have in a show
 * - HOST: Can broadcast, manage room, invite guests (1 per room)
 * - GUEST: Can broadcast alongside host (1 per room)
 * - VIEWER: Can only watch the show (unlimited)
 */
export enum ParticipantRole {
  HOST = 'host',
  GUEST = 'guest',
  VIEWER = 'viewer',
}

// ============================================
// Participant Metadata
// ============================================

/**
 * Metadata stored with each participant in LiveKit
 * This is serialized to JSON and attached to the participant
 */
export interface ParticipantMetadata {
  role: ParticipantRole;
  displayName: string;
  handRaised?: boolean;
  handRaisedAt?: number;
}

/**
 * Serialize participant metadata to JSON string
 */
export function stringifyParticipantMetadata(metadata: ParticipantMetadata): string {
  return JSON.stringify(metadata);
}

/**
 * Parse participant metadata from JSON string
 */
export function parseParticipantMetadata(json: string | undefined): ParticipantMetadata | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as ParticipantMetadata;
  } catch {
    return null;
  }
}

// ============================================
// Room Info
// ============================================

/**
 * Information about a room
 */
export interface RoomInfo {
  name: string;
  sid: string;
  numParticipants: number;
  hasHost: boolean;
  hasGuest: boolean;
}

// ============================================
// Data Channel Message Types
// ============================================

/**
 * Types of messages sent via LiveKit data channels
 * Used for real-time communication between participants
 */
export enum DataMessageType {
  // Hand raise system
  HAND_RAISE = 'hand_raise',
  HAND_LOWER = 'hand_lower',

  // Guest invitation system
  GUEST_INVITE = 'guest_invite',
  GUEST_INVITE_RESPONSE = 'guest_invite_response',
  GUEST_PROMOTED = 'guest_promoted',
  GUEST_DEMOTED = 'guest_demoted',
}

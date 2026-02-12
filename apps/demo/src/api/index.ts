/**
 * API Client for LiveKit Show
 *
 * Clean, centralized API module for all server communication.
 * Uses the shared types from @livekit-show/shared.
 */

import { ParticipantRole } from '@livekit-show/shared';

// ============================================
// Configuration
// ============================================

// API URL - can be overridden via environment variable VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ============================================
// Types
// ============================================

export interface JoinRoomRequest {
  roomName: string;
  participantName: string;
  role: ParticipantRole;
}

export interface JoinRoomResponse {
  token: string;
  wsUrl: string;
  roomName: string;
  role: ParticipantRole;
}

export interface InviteGuestRequest {
  viewerIdentity: string;
  hostIdentity: string;
}

export interface InviteGuestResponse {
  success: boolean;
  token: string;
  wsUrl: string;
  message: string;
}

export interface RemoveGuestRequest {
  guestIdentity: string;
  hostIdentity: string;
}

export interface HandRaiseRequest {
  participantIdentity: string;
  raised: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
}

// ============================================
// Error Handling
// ============================================

export class ShowApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ShowApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ShowApiError(
      data.error || 'Request failed',
      response.status,
      data.code
    );
  }
  return response.json();
}

// ============================================
// API Functions
// ============================================

/**
 * Join a room as HOST or VIEWER
 * - HOST: Creates room if doesn't exist, gets publish permissions
 * - VIEWER: Joins existing room, subscribe-only permissions
 */
export async function joinRoom(request: JoinRoomRequest): Promise<JoinRoomResponse> {
  const response = await fetch(`${API_BASE_URL}/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<JoinRoomResponse>(response);
}

/**
 * Invite a viewer to become a guest (HOST only)
 * Returns a new token with publish permissions for the viewer
 */
export async function inviteGuest(
  roomName: string,
  request: InviteGuestRequest
): Promise<InviteGuestResponse> {
  const response = await fetch(`${API_BASE_URL}/rooms/${encodeURIComponent(roomName)}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<InviteGuestResponse>(response);
}

/**
 * Remove a guest from the room (HOST only)
 * Guest will be disconnected
 */
export async function removeGuest(
  roomName: string,
  request: RemoveGuestRequest
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/rooms/${encodeURIComponent(roomName)}/remove-guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse(response);
}

/**
 * Toggle hand raise status (VIEWER only)
 * Updates participant metadata so host can see raised hands
 */
export async function setHandRaised(
  roomName: string,
  request: HandRaiseRequest
): Promise<{ success: boolean; handRaised: boolean }> {
  const response = await fetch(`${API_BASE_URL}/rooms/${encodeURIComponent(roomName)}/hand-raise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse(response);
}

// ============================================
// Convenience Exports
// ============================================

export const api = {
  joinRoom,
  inviteGuest,
  removeGuest,
  setHandRaised,
};

export default api;

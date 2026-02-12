import { Router, Request, Response, NextFunction } from 'express';
import { ParticipantRole } from '@livekit-show/shared';
import {
  joinRoom,
  listRooms,
  getRoom,
  getRoomInfo,
  deleteRoom,
  listParticipants,
  removeParticipant,
  promoteToGuest,
  demoteToViewer,
  removeGuest,
  updateParticipantMetadata,
} from '../services/room.service';

const router = Router();

// ============================================
// Room Management
// ============================================

// POST /api/rooms/join - Join a room and get a token
router.post('/join', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomName, participantName, role } = req.body;

    if (!roomName || !participantName) {
      res.status(400).json({ error: 'roomName and participantName are required' });
      return;
    }

    // Validate role - only allow HOST and VIEWER for initial join
    // GUEST role is assigned through promotion
    const validRoles = [ParticipantRole.HOST, ParticipantRole.VIEWER];
    let participantRole = role as ParticipantRole;

    if (!validRoles.includes(participantRole)) {
      // Default to VIEWER if invalid role
      participantRole = ParticipantRole.VIEWER;
    }

    const result = await joinRoom({
      roomName,
      participantName,
      role: participantRole,
    });

    res.json(result);
  } catch (error: any) {
    if (error.message.includes('already has')) {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// GET /api/rooms - List all rooms
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rooms = await listRooms();
    res.json({ rooms });
  } catch (error) {
    next(error);
  }
});

// GET /api/rooms/:roomName - Get room info
router.get('/:roomName', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomName } = req.params;
    const roomInfo = await getRoomInfo(roomName);

    if (!roomInfo) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.json({ room: roomInfo });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/rooms/:roomName - Delete a room
router.delete('/:roomName', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomName } = req.params;
    const success = await deleteRoom(roomName);

    if (!success) {
      res.status(500).json({ error: 'Failed to delete room' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Participant Management
// ============================================

// GET /api/rooms/:roomName/participants - List participants in a room
router.get('/:roomName/participants', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomName } = req.params;
    const participants = await listParticipants(roomName);
    res.json({ participants });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/rooms/:roomName/participants/:identity - Remove a participant
router.delete('/:roomName/participants/:identity', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomName, identity } = req.params;
    const success = await removeParticipant(roomName, identity);

    if (!success) {
      res.status(500).json({ error: 'Failed to remove participant' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Guest Invitation System
// ============================================

// POST /api/rooms/:roomName/invite - Host invites a viewer to become guest
router.post('/:roomName/invite', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomName } = req.params;
    const { viewerIdentity, hostIdentity } = req.body;

    if (!viewerIdentity || !hostIdentity) {
      res.status(400).json({ error: 'viewerIdentity and hostIdentity are required' });
      return;
    }

    const result = await promoteToGuest(roomName, viewerIdentity, hostIdentity);
    res.json({
      success: true,
      ...result,
      message: `${viewerIdentity} has been promoted to guest`,
    });
  } catch (error: any) {
    if (error.message.includes('Only the host') || error.message.includes('already has')) {
      res.status(403).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// POST /api/rooms/:roomName/demote - Host demotes guest back to viewer
router.post('/:roomName/demote', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomName } = req.params;
    const { guestIdentity, hostIdentity } = req.body;

    if (!guestIdentity || !hostIdentity) {
      res.status(400).json({ error: 'guestIdentity and hostIdentity are required' });
      return;
    }

    const result = await demoteToViewer(roomName, guestIdentity, hostIdentity);
    res.json({
      success: true,
      ...result,
      message: `${guestIdentity} has been demoted to viewer`,
    });
  } catch (error: any) {
    if (error.message.includes('Only the host')) {
      res.status(403).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// POST /api/rooms/:roomName/remove-guest - Host removes guest from room
router.post('/:roomName/remove-guest', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomName } = req.params;
    const { guestIdentity, hostIdentity } = req.body;

    if (!guestIdentity || !hostIdentity) {
      res.status(400).json({ error: 'guestIdentity and hostIdentity are required' });
      return;
    }

    const success = await removeGuest(roomName, guestIdentity, hostIdentity);

    if (!success) {
      res.status(500).json({ error: 'Failed to remove guest' });
      return;
    }

    res.json({
      success: true,
      message: `${guestIdentity} has been removed from the room`,
    });
  } catch (error: any) {
    if (error.message.includes('Only the host')) {
      res.status(403).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// ============================================
// Hand Raise System
// ============================================

// POST /api/rooms/:roomName/hand-raise - Viewer raises hand
router.post('/:roomName/hand-raise', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomName } = req.params;
    const { participantIdentity, raised } = req.body;

    if (!participantIdentity || raised === undefined) {
      res.status(400).json({ error: 'participantIdentity and raised are required' });
      return;
    }

    const success = await updateParticipantMetadata(roomName, participantIdentity, {
      handRaised: raised,
      handRaisedAt: raised ? Date.now() : undefined,
    });

    if (!success) {
      res.status(500).json({ error: 'Failed to update hand raise status' });
      return;
    }

    res.json({
      success: true,
      handRaised: raised,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Error Handler
// ============================================

export function roomErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error('Room route error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
}

export default router;

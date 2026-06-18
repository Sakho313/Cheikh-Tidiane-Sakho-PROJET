import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../shared/utils/jwt';

/**
 * Serveur temps réel (Socket.IO) pour le suivi live de la flotte.
 *
 * - Les clients s'authentifient via `socket.handshake.auth.token` (JWT d'accès).
 * - Chaque client rejoint la room `org:<organizationId>` ; les positions,
 *   événements et alertes ne sont diffusés qu'aux membres de l'organisation.
 * - Les services backend émettent via les helpers `emit*` ci-dessous (l'ingestion
 *   de positions déclenche `emitVehiclePosition`, etc.).
 */
let io: SocketIOServer | null = null;

function roomFor(organizationId: string): string {
  return `org:${organizationId}`;
}

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    },
  });

  io.use((socket: Socket, nextFn: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        nextFn(new Error('Authentication token required'));
        return;
      }
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      nextFn();
    } catch {
      nextFn(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const orgId = socket.data.user?.organizationId as string | null;
    if (orgId) {
      void socket.join(roomFor(orgId));
    }
    // Permet à un client de suivre un véhicule précis.
    socket.on('subscribe:vehicle', (vehicleId: string) => {
      void socket.join(`vehicle:${vehicleId}`);
    });
    socket.on('unsubscribe:vehicle', (vehicleId: string) => {
      void socket.leave(`vehicle:${vehicleId}`);
    });
  });

  return io;
}

export function getIo(): SocketIOServer | null {
  return io;
}

function emit(organizationId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(roomFor(organizationId)).emit(event, payload);
}

export function emitVehiclePosition(organizationId: string, payload: unknown): void {
  emit(organizationId, 'vehicle:position', payload);
}

export function emitDrivingEvent(organizationId: string, payload: unknown): void {
  emit(organizationId, 'driving:event', payload);
}

export function emitAlert(organizationId: string, payload: unknown): void {
  emit(organizationId, 'alert:new', payload);
}

export function emitGeofenceEvent(organizationId: string, payload: unknown): void {
  emit(organizationId, 'geofence:event', payload);
}

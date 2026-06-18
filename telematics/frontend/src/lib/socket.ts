import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/api/client';

// Le serveur Socket.IO partage le port HTTP du backend (:4000 en dev). On se
// connecte donc à l'origine de l'API (sans le suffixe /api/v1), pas au proxy Vite.
function resolveSocketUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) return 'http://localhost:4000';
  return (/^https?:\/\//.test(raw) ? raw : `https://${raw}`).replace(/\/api\/v1\/?$/, '');
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
      auth: { token: getAccessToken() },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/api/client';

// Le serveur Socket.IO partage le port HTTP du backend. On résout son origine
// selon le contexte :
//  - VITE_API_URL défini (déploiement cross-origin, ex. Render) → cette origine.
//  - sinon en dev : connexion directe à l'API (:4000), car le proxy Vite ne
//    relaie pas /socket.io.
//  - sinon en prod (même origine derrière nginx) : l'origine courante ; nginx
//    relaie /socket.io vers l'API.
function resolveSocketUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (raw) {
    return (/^https?:\/\//.test(raw) ? raw : `https://${raw}`).replace(/\/api\/v1\/?$/, '');
  }
  if (import.meta.env.DEV) return 'http://localhost:4000';
  return window.location.origin;
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

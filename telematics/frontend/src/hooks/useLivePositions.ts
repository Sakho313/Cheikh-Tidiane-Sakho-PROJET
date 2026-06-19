import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import type { LivePosition } from '@/types';

/**
 * Maintient la dernière position connue de chaque véhicule, alimentée en
 * temps réel par l'événement Socket.IO `vehicle:position`.
 */
export function useLivePositions(): Map<string, LivePosition> {
  const [positions, setPositions] = useState<Map<string, LivePosition>>(new Map());

  useEffect(() => {
    const socket = getSocket();
    const onPosition = (payload: LivePosition): void => {
      setPositions((prev) => {
        const next = new Map(prev);
        next.set(payload.vehicleId, payload);
        return next;
      });
    };
    socket.on('vehicle:position', onPosition);
    return () => {
      socket.off('vehicle:position', onPosition);
    };
  }, []);

  return positions;
}

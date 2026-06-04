'use client';

import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';

type UsePusherOptions = {
  channelName?: string;
  eventName?: string;
  enabled?: boolean;
};

export function usePusher(
  userId?: string,
  onEvent?: (data: any) => void,
  options?: UsePusherOptions,
) {
  const pusherRef = useRef<Pusher | null>(null);
  const callbackRef = useRef(onEvent);
  const channelName =
    options?.channelName ?? (userId ? `user-${userId}` : undefined);
  const eventName = options?.eventName ?? 'new-notification';
  const enabled = options?.enabled ?? Boolean(channelName);
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !channelName || !key) {
      return;
    }

    if (!pusherRef.current) {
      pusherRef.current = new Pusher(key, {
        cluster,
        forceTLS: true,
      });
    }

    const pusher = pusherRef.current;
    const channel = pusher.subscribe(channelName);

    const handleEvent = (data: any) => {
      callbackRef.current?.(data);
    };

    channel.bind(eventName, handleEvent);

    // Log utile en dev si le channel refuse l'abonnement.
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('Pusher subscription error:', error);
    });

    return () => {
      channel.unbind(eventName, handleEvent);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
      pusherRef.current = null;
    };
  }, [enabled, channelName, eventName, key, cluster]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NODE_ENV === 'development') {
      console.warn('NEXT_PUBLIC_PUSHER_KEY manquant: realtime desactive.');
    }
    return;
  }, []);

  return pusherRef.current;
}

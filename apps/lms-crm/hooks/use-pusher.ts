'use client';

import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';

type UsePusherOptions = {
  channelName?: string;
  eventName?: string;
  enabled?: boolean;
};

type PusherChannel = ReturnType<Pusher['subscribe']>;

/** Une seule connexion Pusher partagée (évite disconnect/reconnect à chaque hook). */
let sharedClient: Pusher | null = null;
const channelRefCounts = new Map<string, number>();

function getSharedPusher(key: string, cluster: string): Pusher {
  if (!sharedClient) {
    sharedClient = new Pusher(key, {
      cluster,
      forceTLS: true,
    });
  }
  return sharedClient;
}

function retainChannel(pusher: Pusher, channelName: string): PusherChannel {
  const next = (channelRefCounts.get(channelName) ?? 0) + 1;
  channelRefCounts.set(channelName, next);
  return pusher.subscribe(channelName);
}

function releaseChannel(pusher: Pusher, channelName: string) {
  const next = (channelRefCounts.get(channelName) ?? 1) - 1;
  if (next <= 0) {
    channelRefCounts.delete(channelName);
    pusher.unsubscribe(channelName);
  } else {
    channelRefCounts.set(channelName, next);
  }
}

export function isPusherClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY?.trim());
}

export function usePusher(
  userId?: string,
  onEvent?: (data: unknown) => void,
  options?: UsePusherOptions,
) {
  const callbackRef = useRef(onEvent);
  const channelName =
    options?.channelName ?? (userId ? `user-${userId}` : undefined);
  const eventName = options?.eventName ?? 'new-notification';
  const enabled = options?.enabled ?? Boolean(channelName);
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY?.trim();
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim() || 'eu';

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !channelName || !key) {
      return;
    }

    const pusher = getSharedPusher(key, cluster);
    const channel = retainChannel(pusher, channelName);

    const handleEvent = (data: unknown) => {
      callbackRef.current?.(data);
    };

    channel.bind(eventName, handleEvent);
    channel.bind('pusher:subscription_error', (error: unknown) => {
      console.error('Pusher subscription error:', error);
    });

    return () => {
      channel.unbind(eventName, handleEvent);
      releaseChannel(pusher, channelName);
    };
  }, [enabled, channelName, eventName, key, cluster]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NODE_ENV === 'development') {
      console.warn('NEXT_PUBLIC_PUSHER_KEY manquant: realtime desactive.');
    }
  }, []);

  return sharedClient;
}

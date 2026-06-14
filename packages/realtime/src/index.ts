import Pusher from 'pusher';

let client: Pusher | null = null;

export function isPusherConfigured(): boolean {
  return Boolean(
    process.env.PUSHER_APP_ID?.trim() &&
      process.env.PUSHER_KEY?.trim() &&
      process.env.PUSHER_SECRET?.trim(),
  );
}

function getPusherClient(): Pusher | null {
  if (!isPusherConfigured()) return null;
  if (!client) {
    client = new Pusher({
      appId: process.env.PUSHER_APP_ID!.trim(),
      key: process.env.PUSHER_KEY!.trim(),
      secret: process.env.PUSHER_SECRET!.trim(),
      cluster: process.env.PUSHER_CLUSTER?.trim() || 'eu',
      useTLS: true,
    });
  }
  return client;
}

export type RealtimePayload = Record<string, unknown>;

/** Canal cloche utilisateur — écouté par `use-pusher.ts` (défaut `user-{id}` / `new-notification`). */
export async function triggerUserNotification(
  userId: string,
  payload: RealtimePayload,
): Promise<boolean> {
  const pusher = getPusherClient();
  if (!pusher || !userId) return false;
  try {
    await pusher.trigger(`user-${userId}`, 'new-notification', payload);
    return true;
  } catch (error) {
    console.error('[Pusher] triggerUserNotification failed:', error);
    return false;
  }
}

/** Historique activité fiche (formation, collaborateur, inventaire, etc.). */
export async function triggerActivityEvent(
  channelName: string,
  eventName: string,
  payload: RealtimePayload,
): Promise<boolean> {
  const pusher = getPusherClient();
  if (!pusher || !channelName || !eventName) return false;
  try {
    await pusher.trigger(channelName, eventName, payload);
    return true;
  } catch (error) {
    console.error('[Pusher] triggerActivityEvent failed:', error);
    return false;
  }
}

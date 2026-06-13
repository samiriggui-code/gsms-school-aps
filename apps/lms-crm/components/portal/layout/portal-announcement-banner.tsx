'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Megaphone, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { E_FORMATION_ANNOUNCEMENTS_API } from '@/lib/portal/e-formation-paths';
import { cn } from '@/lib/utils';

type Announcement = {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  scope: 'formation' | 'session';
  sessionLabel: string | null;
};

const DISMISS_KEY = 'portal-announcement-dismissed';

function loadDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  localStorage.setItem(DISMISS_KEY, JSON.stringify(Array.from(ids)));
}

/** Bandeau en haut du portail stagiaire — dernière annonce non lue. */
export function PortalAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(E_FORMATION_ANNOUNCEMENTS_API);
        const json = (await res.json()) as {
          success?: boolean;
          data?: { announcements: Announcement[] };
        };
        if (cancelled || !res.ok || !json.success) return;
        const list = json.data?.announcements ?? [];
        const latest = list.find((a) => !dismissed.has(a.id)) ?? null;
        setAnnouncement(latest);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dismissed]);

  if (!announcement) return null;

  const dismiss = () => {
    const next = new Set(dismissed);
    next.add(announcement.id);
    saveDismissed(next);
    setDismissed(next);
    setAnnouncement(null);
  };

  return (
    <div
      role="status"
      className="border-b border-primary/20 bg-primary/5 px-4 py-3"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground">{announcement.title}</p>
          <p className={cn('mt-0.5 line-clamp-2 text-[12px] text-muted-foreground')}>
            {announcement.content}
          </p>
          <Link
            href="/e-formation?tab=annonces"
            className="mt-1 inline-block text-[12px] font-medium text-primary hover:underline"
          >
            Voir toutes les annonces →
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Masquer cette annonce"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { E_FORMATION_API } from '@/lib/portal/e-formation-paths';
import {
  parseMarkdownContent,
  parseYoutubeContent,
  type LmsActivityRow,
} from '@/lib/portal/lms-types';
import { LmsQuizBlock } from '@/components/portal/lms/lms-quiz-block';

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false });

function LmsMarkdownBlock({ content }: { content: unknown }) {
  const markdown = parseMarkdownContent(content);
  if (!markdown) return null;
  return (
    <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-20">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </article>
  );
}

function LmsVideoBlock({
  chapterId,
  fallbackContent,
}: {
  chapterId: string;
  fallbackContent: unknown;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playback, setPlayback] = useState<
    | { provider: 'mux'; playbackId: string; src?: string; token?: string; signed?: boolean }
    | { provider: 'youtube'; youtubeId: string; caption?: string }
    | { provider: 'url'; url: string }
    | null
  >(null);

  const fallbackYoutube = useMemo(() => parseYoutubeContent(fallbackContent), [fallbackContent]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`${E_FORMATION_API}/playback?chapterId=${chapterId}`);
        const json = (await res.json()) as {
          success?: boolean;
          data?: typeof playback;
          error?: { message?: string };
        };
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error?.message ?? 'Vidéo indisponible');
        }
        if (!cancelled) setPlayback(json.data);
      } catch (e) {
        if (fallbackYoutube && !cancelled) {
          setPlayback({
            provider: 'youtube',
            youtubeId: fallbackYoutube.youtubeId,
            caption: fallbackYoutube.caption,
          });
        } else if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Vidéo indisponible');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chapterId, fallbackYoutube]);

  if (loading) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border bg-muted/30">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !playback) {
    return <p className="text-sm text-muted-foreground">{error ?? 'Vidéo indisponible.'}</p>;
  }

  if (playback.provider === 'mux') {
    return (
      <div className="aspect-video overflow-hidden rounded-xl border bg-black">
        <MuxPlayer
          {...(playback.src
            ? { src: playback.src }
            : {
                playbackId: playback.playbackId,
                ...(playback.token ? { tokens: { playback: playback.token } } : {}),
              })}
          className="size-full"
          accentColor="var(--primary)"
          onError={() => {
            if (fallbackYoutube) {
              setPlayback({
                provider: 'youtube',
                youtubeId: fallbackYoutube.youtubeId,
                caption: fallbackYoutube.caption,
              });
              return;
            }
            setError('Lecture vidéo impossible.');
          }}
        />
      </div>
    );
  }

  if (playback.provider === 'url') {
    return (
      <div className="aspect-video overflow-hidden rounded-xl border bg-black">
        <video src={playback.url} controls className="size-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="aspect-video overflow-hidden rounded-xl border bg-black">
        <iframe
          title="Vidéo de formation"
          src={`https://www.youtube.com/embed/${playback.youtubeId}`}
          className="size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {playback.caption ? (
        <p className="text-xs text-muted-foreground">{playback.caption}</p>
      ) : null}
    </div>
  );
}

export function LmsActivityList({
  courseId,
  chapterId,
  activities,
  onQuizPassed,
  excludeQuiz = false,
}: {
  courseId: string;
  chapterId: string;
  activities: LmsActivityRow[];
  onQuizPassed?: () => void;
  excludeQuiz?: boolean;
}) {
  const reloadAfterQuiz = useCallback(() => {
    onQuizPassed?.();
  }, [onQuizPassed]);

  const visibleActivities = useMemo(
    () =>
      excludeQuiz
        ? activities.filter((a) => a.subType !== 'QUIZ_MULTIPLE_CHOICE')
        : activities,
    [activities, excludeQuiz],
  );

  return (
    <div className="space-y-8">
      {visibleActivities.map((activity) => (
        <section key={activity.id} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {activity.name}
          </h3>
          {activity.subType === 'DYNAMIC_MARKDOWN' ? (
            <LmsMarkdownBlock content={activity.content} />
          ) : null}
          {activity.subType === 'VIDEO_YOUTUBE' || activity.subType === 'VIDEO_HOSTED' ? (
            <LmsVideoBlock chapterId={chapterId} fallbackContent={activity.content} />
          ) : null}
          {!excludeQuiz && activity.subType === 'QUIZ_MULTIPLE_CHOICE' ? (
            <LmsQuizBlock
              activityId={activity.id}
              content={activity.content}
              onPassed={reloadAfterQuiz}
            />
          ) : null}
        </section>
      ))}
    </div>
  );
}

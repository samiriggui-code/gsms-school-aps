'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { instructorCoursePlaybackApi } from '@/lib/instructor/instructor-paths';
import { parseMarkdownContent, parseYoutubeContent } from '@/lib/portal/lms-types';
import { sanitizeQuizForClient } from '@/lib/portal/lms-quiz';
import { portalMuted } from '@/components/portal/layout/portal-ui';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false });

type PreviewActivity = {
  id: string;
  name: string;
  subType: string;
  position: number;
  isPublished: boolean;
  reviewStatus?: string;
  content: unknown;
  details: unknown;
};

type PreviewChapter = {
  id: string;
  title: string;
  muxData?: { playbackId: string | null } | null;
  activities: PreviewActivity[];
};

type PlaybackPayload =
  | { provider: 'mux'; playbackId: string; src?: string; token?: string; signed?: boolean }
  | { provider: 'url'; url: string };

function InstructorPreviewMux({ courseId, chapterId }: { courseId: string; chapterId: string }) {
  const [loading, setLoading] = useState(true);
  const [playback, setPlayback] = useState<PlaybackPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(instructorCoursePlaybackApi(courseId, chapterId));
        const json = (await res.json()) as { success?: boolean; data?: PlaybackPayload };
        if (!cancelled && res.ok && json.success && json.data) setPlayback(json.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, chapterId]);

  if (loading) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted/30">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!playback) return null;

  if (playback.provider === 'mux') {
    return (
      <div className="aspect-video overflow-hidden rounded-lg border bg-black">
        <MuxPlayer
          {...(playback.src
            ? { src: playback.src }
            : {
                playbackId: playback.playbackId,
                ...(playback.token ? { tokens: { playback: playback.token } } : {}),
              })}
          className="size-full"
        />
      </div>
    );
  }

  if (playback.provider === 'url') {
    return (
      <video className="aspect-video w-full rounded-lg border" controls src={playback.url} />
    );
  }

  return null;
}

export function InstructorCoursePreview({
  open,
  onOpenChange,
  previewUrl,
  courseId,
  chapterId,
  chapterTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string;
  courseId: string;
  chapterId: string;
  chapterTitle: string;
}) {
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<PreviewChapter | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await apiFetch(previewUrl);
        const json = (await res.json()) as { success?: boolean; data?: { chapter: PreviewChapter } };
        if (!cancelled && res.ok && json.success && json.data) {
          setChapter(json.data.chapter);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, previewUrl]);

  const hasHostedVideo = chapter?.activities.some((a) => a.subType === 'VIDEO_HOSTED');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Aperçu stagiaire — {chapterTitle}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-6 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Chargement…
            </div>
          ) : !chapter ? (
            <p className={portalMuted}>Aperçu indisponible.</p>
          ) : (
            <>
              {hasHostedVideo ? (
                <section className="rounded-xl border p-4">
                  <h3 className="mb-3 text-sm font-semibold">Vidéo Mux (UV)</h3>
                  <InstructorPreviewMux courseId={courseId} chapterId={chapterId} />
                </section>
              ) : null}
              {chapter.activities.map((act) => (
                <section key={act.id} className="rounded-xl border p-4">
                  <h3 className="mb-3 text-sm font-semibold">{act.name}</h3>
                  {!act.isPublished ? (
                    <p className={cn('mb-2 text-[11px] text-amber-600')}>Brouillon (non visible en prod)</p>
                  ) : null}
                  {act.reviewStatus && act.reviewStatus !== 'APPROVED' ? (
                    <p className={cn('mb-2 text-[11px] text-amber-600')}>
                      Statut validation : {act.reviewStatus}
                    </p>
                  ) : null}
                  {act.subType === 'DYNAMIC_MARKDOWN' ? (
                    <article className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{parseMarkdownContent(act.content) ?? ''}</ReactMarkdown>
                    </article>
                  ) : null}
                  {act.subType === 'VIDEO_YOUTUBE' ? (
                    (() => {
                      const y = parseYoutubeContent(act.content);
                      if (!y) return <p className={portalMuted}>Vidéo non configurée.</p>;
                      return (
                        <div className="aspect-video overflow-hidden rounded-lg border">
                          <iframe
                            title={act.name}
                            className="size-full"
                            src={`https://www.youtube.com/embed/${y.youtubeId}`}
                            allowFullScreen
                          />
                        </div>
                      );
                    })()
                  ) : null}
                  {act.subType === 'VIDEO_HOSTED' ? (
                    <p className={cn('text-[12px]', portalMuted)}>Flux Mux affiché en tête d&apos;UV.</p>
                  ) : null}
                  {act.subType === 'QUIZ_MULTIPLE_CHOICE' ? (
                    (() => {
                      const quiz = sanitizeQuizForClient(act.content, act.details);
                      if (!quiz) return <p className={portalMuted}>Quiz vide.</p>;
                      return (
                        <ul className="space-y-3 text-[13px]">
                          {quiz.questions.map((q, i) => (
                            <li key={q.id}>
                              <p className="font-medium">
                                {i + 1}. {q.prompt}
                              </p>
                              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                                {q.choices.map((c) => (
                                  <li key={c}>{c}</li>
                                ))}
                              </ul>
                            </li>
                          ))}
                          <p className={cn('text-[11px]', portalMuted)}>
                            Score requis : {quiz.passScore} %
                          </p>
                        </ul>
                      );
                    })()
                  ) : null}
                </section>
              ))}
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { canAccessChapter } from '@/lib/portal/lms-access';
import { createMuxPlaybackToken, isMuxPlaybackConfigured } from '@/lib/portal/mux-playback';
import { getPortalLearnerContext } from '@/lib/portal/portal-auth';
import { prisma } from '@/lib/prisma';
import { resolveMuxPlayback } from '@/lib/portal/mux-playback';
export async function GET(request: NextRequest) {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const chapterId = request.nextUrl.searchParams.get('chapterId')?.trim();
  if (!chapterId) return fail('chapterId requis.', 400);

  const { access, candidature } = auth.ctx;
  const primaryCourseId = candidature?.formation?.courseId ?? null;

  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, isPublished: true, course: { isPublished: true } },
    select: {
      id: true,
      courseId: true,
      isFree: true,
      isPublished: true,
      position: true,
      videoUrl: true,
      muxData: { select: { playbackId: true } },
      activities: {
        where: { isPublished: true, type: 'VIDEO' },
        orderBy: { position: 'asc' },
        take: 1,
        select: { subType: true, content: true },
      },
    },
  });

  if (!chapter) return fail('Leçon introuvable.', 404);

  if (primaryCourseId && chapter.courseId !== primaryCourseId) {
    return fail('Formation non accessible.', 403);
  }

  if (!canAccessChapter(access, chapter)) {
    return fail('Vidéo verrouillée.', 403);
  }

  const playbackId = chapter.muxData?.playbackId?.trim() ?? null;
  if (playbackId && isMuxPlaybackConfigured()) {
    const token = await createMuxPlaybackToken(playbackId);
    if (token) {
      return ok({
        provider: 'mux' as const,
        playbackId,
        token,
        expiresInSeconds: 3600,
      });
    }
  }

  const videoActivity = chapter.activities[0];
  if (videoActivity?.subType === 'VIDEO_YOUTUBE') {
    const content = videoActivity.content as Record<string, unknown>;
    const youtubeId = typeof content.youtubeId === 'string' ? content.youtubeId : null;
    if (youtubeId) {
      return ok({
        provider: 'youtube' as const,
        youtubeId,
        caption: typeof content.caption === 'string' ? content.caption : undefined,
      });
    }
  }

  if (chapter.videoUrl) {
    return ok({ provider: 'url' as const, url: chapter.videoUrl });
  }

  return fail('Aucune vidéo disponible pour cette leçon.', 404);
}


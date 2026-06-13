import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import { assertInstructorOwnsCourse } from '@/lib/instructor/instructor-courses-data';
import { resolveMuxPlayback } from '@/lib/portal/mux-playback';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ courseId: string }> };

/** Lecture Mux pour aperçu formateur (brouillons inclus). */
export async function GET(request: NextRequest, context: Ctx) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { courseId } = await context.params;
  const chapterId = request.nextUrl.searchParams.get('chapterId')?.trim();
  if (!chapterId) return fail('chapterId requis.', 400);

  const access = await assertInstructorOwnsCourse(auth.ctx.userId, courseId);
  if (!access.ok) return fail(access.message, access.status);

  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, courseId },
    select: {
      muxData: { select: { playbackId: true } },
      videoUrl: true,
    },
  });

  if (!chapter) return fail('UV introuvable.', 404);

  const playbackId = chapter.muxData?.playbackId?.trim() ?? null;
  if (playbackId) {
    const mux = await resolveMuxPlayback(playbackId);
    if (mux) return ok(mux);
  }

  if (chapter.videoUrl) {
    return ok({ provider: 'url' as const, url: chapter.videoUrl });
  }

  return fail('Aucune vidéo Mux sur cette UV.', 404);
}

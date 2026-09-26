import type { Metadata } from 'next';
import { LeconClient } from './lecon-client';

type Props = { params: Promise<{ courseId: string; chapterId: string }> };

export const metadata: Metadata = {
  title: 'Leçon',
};

export default async function LeconPage({ params }: Props) {
  const { courseId, chapterId } = await params;
  return <LeconClient courseId={courseId} chapterId={chapterId} />;
}

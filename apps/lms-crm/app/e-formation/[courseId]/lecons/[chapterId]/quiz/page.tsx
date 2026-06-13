import type { Metadata } from 'next';
import { LeconQuizClient } from './lecon-quiz-client';

export const metadata: Metadata = {
  title: 'Quiz UV',
};

type Props = {
  params: Promise<{ courseId: string; chapterId: string }>;
};

export default async function LeconQuizPage({ params }: Props) {
  const { courseId, chapterId } = await params;
  return <LeconQuizClient courseId={courseId} chapterId={chapterId} />;
}

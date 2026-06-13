import type { Metadata } from 'next';
import { CoursClient } from './cours-client';

type Props = { params: Promise<{ courseId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  return { title: `Parcours · ${courseId}` };
}

export default async function CoursPage({ params }: Props) {
  const { courseId } = await params;
  return <CoursClient courseId={courseId} />;
}

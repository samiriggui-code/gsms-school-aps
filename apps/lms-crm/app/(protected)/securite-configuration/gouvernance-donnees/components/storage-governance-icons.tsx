import type { LucideIcon } from 'lucide-react';
import {
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type IconTone = {
  bg: string;
  icon: string;
  border: string;
};

const FOLDER_ROOT_TONES: Record<string, IconTone> = {
  ecole: {
    bg: 'bg-amber-100 dark:bg-amber-950/50',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/80 dark:border-amber-800/60',
  },
  rh: {
    bg: 'bg-blue-100 dark:bg-blue-950/50',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200/80 dark:border-blue-800/60',
  },
  academique: {
    bg: 'bg-violet-100 dark:bg-violet-950/50',
    icon: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200/80 dark:border-violet-800/60',
  },
  finance: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/50',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/80 dark:border-emerald-800/60',
  },
  communication: {
    bg: 'bg-fuchsia-100 dark:bg-fuchsia-950/50',
    icon: 'text-fuchsia-600 dark:text-fuchsia-400',
    border: 'border-fuchsia-200/80 dark:border-fuchsia-800/60',
  },
  portail: {
    bg: 'bg-cyan-100 dark:bg-cyan-950/50',
    icon: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200/80 dark:border-cyan-800/60',
  },
  utilisateurs: {
    bg: 'bg-indigo-100 dark:bg-indigo-950/50',
    icon: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200/80 dark:border-indigo-800/60',
  },
  equipements: {
    bg: 'bg-slate-200 dark:bg-slate-800/60',
    icon: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300/80 dark:border-slate-600/60',
  },
  crm: {
    bg: 'bg-orange-100 dark:bg-orange-950/50',
    icon: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200/80 dark:border-orange-800/60',
  },
  company: {
    bg: 'bg-sky-100 dark:bg-sky-950/50',
    icon: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200/80 dark:border-sky-800/60',
  },
  company_admin_docs: {
    bg: 'bg-sky-100 dark:bg-sky-950/50',
    icon: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200/80 dark:border-sky-800/60',
  },
  avatars: {
    bg: 'bg-rose-100 dark:bg-rose-950/50',
    icon: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200/80 dark:border-rose-800/60',
  },
  archives: {
    bg: 'bg-stone-200 dark:bg-stone-800/60',
    icon: 'text-stone-600 dark:text-stone-400',
    border: 'border-stone-300/80 dark:border-stone-600/60',
  },
  rapports: {
    bg: 'bg-teal-100 dark:bg-teal-950/50',
    icon: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200/80 dark:border-teal-800/60',
  },
  misc: {
    bg: 'bg-zinc-200 dark:bg-zinc-800/60',
    icon: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-300/80 dark:border-zinc-600/60',
  },
};

const FILE_KIND_TONES: Record<string, IconTone & { Icon: LucideIcon }> = {
  pdf: {
    Icon: FileText,
    bg: 'bg-red-100 dark:bg-red-950/50',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-200/80 dark:border-red-800/60',
  },
  image: {
    Icon: FileImage,
    bg: 'bg-sky-100 dark:bg-sky-950/50',
    icon: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200/80 dark:border-sky-800/60',
  },
  excel: {
    Icon: FileSpreadsheet,
    bg: 'bg-green-100 dark:bg-green-950/50',
    icon: 'text-green-600 dark:text-green-400',
    border: 'border-green-200/80 dark:border-green-800/60',
  },
  csv: {
    Icon: FileSpreadsheet,
    bg: 'bg-teal-100 dark:bg-teal-950/50',
    icon: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200/80 dark:border-teal-800/60',
  },
  other: {
    Icon: File,
    bg: 'bg-slate-200 dark:bg-slate-800/60',
    icon: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-300/80 dark:border-slate-600/60',
  },
};

const ALL_FILES_TONE: IconTone = {
  bg: 'bg-primary/10',
  icon: 'text-primary',
  border: 'border-primary/25',
};

function folderToneForPrefix(prefix?: string): IconTone {
  if (!prefix) return FOLDER_ROOT_TONES.misc;
  const root = prefix.split('/').filter(Boolean)[0] ?? 'misc';
  return FOLDER_ROOT_TONES[root] ?? FOLDER_ROOT_TONES.misc;
}

function fileKindTone(previewKind?: string, mimeType?: string) {
  if (previewKind && FILE_KIND_TONES[previewKind]) {
    return FILE_KIND_TONES[previewKind];
  }
  const m = (mimeType ?? '').toLowerCase();
  if (m === 'application/pdf') return FILE_KIND_TONES.pdf;
  if (m.startsWith('image/')) return FILE_KIND_TONES.image;
  if (m.includes('spreadsheet') || m.includes('excel')) return FILE_KIND_TONES.excel;
  if (m.includes('csv')) return FILE_KIND_TONES.csv;
  return FILE_KIND_TONES.other;
}

type StorageIconBadgeProps = {
  className?: string;
  size?: 'sm' | 'md';
};

export function StorageAllFilesIcon({ className, size = 'sm' }: StorageIconBadgeProps) {
  const box = size === 'sm' ? 'size-7' : 'size-9';
  const icon = size === 'sm' ? 'size-4' : 'size-5';
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md border',
        box,
        ALL_FILES_TONE.bg,
        ALL_FILES_TONE.border,
        className,
      )}
    >
      <LayoutGrid className={cn(icon, ALL_FILES_TONE.icon)} />
    </span>
  );
}

export function StorageFolderIcon({
  prefix,
  open,
  className,
  size = 'sm',
}: StorageIconBadgeProps & { prefix?: string; open?: boolean }) {
  const tone = folderToneForPrefix(prefix);
  const Icon = open ? FolderOpen : Folder;
  const box = size === 'sm' ? 'size-7' : 'size-9';
  const icon = size === 'sm' ? 'size-4' : 'size-5';

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md border',
        box,
        tone.bg,
        tone.border,
        className,
      )}
    >
      <Icon className={cn(icon, tone.icon)} />
    </span>
  );
}

export function StorageFileIcon({
  previewKind,
  mimeType,
  className,
  size = 'sm',
}: StorageIconBadgeProps & { previewKind?: string; mimeType?: string }) {
  const tone = fileKindTone(previewKind, mimeType);
  const { Icon } = tone;
  const box = size === 'sm' ? 'size-8' : 'size-10';
  const icon = size === 'sm' ? 'size-4' : 'size-5';

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md border',
        box,
        tone.bg,
        tone.border,
        className,
      )}
    >
      <Icon className={cn(icon, tone.icon)} />
    </span>
  );
}

/** Pastille colorée pour le compteur de fichiers dans l’arborescence. */
export function folderCountBadgeClass(prefix: string): string {
  const tone = folderToneForPrefix(prefix);
  return cn(tone.bg, tone.icon, 'border', tone.border);
}

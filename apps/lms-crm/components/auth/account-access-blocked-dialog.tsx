'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog';
import {
  accountBlockMessage,
  accountBlockTitle,
  type AccountBlockReason,
} from '@/lib/auth/account-access';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  reason: AccountBlockReason;
  onConfirm: () => void;
};

/** Popup obligatoire — compte suspendu / désactivé (OK pour continuer). */
export function AccountAccessBlockedDialog({ open, reason, onConfirm }: Props) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className="max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AlertDialogHeader className="items-center text-center">
          <img
            src={toAbsoluteUrl('/media/illustrations/23.svg')}
            className="mx-auto mb-2 max-h-[120px] dark:hidden"
            alt=""
          />
          <img
            src={toAbsoluteUrl('/media/illustrations/23-dark.svg')}
            className="mx-auto mb-2 hidden max-h-[120px] dark:block"
            alt=""
          />
          <AlertDialogTitle>{accountBlockTitle(reason)}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {accountBlockMessage(reason)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={onConfirm}>OK, j&apos;ai compris</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type ShellProps = {
  blocked: boolean;
  reason: AccountBlockReason;
  onAcknowledge: () => void;
  children: React.ReactNode;
  className?: string;
};

/** Enveloppe l’app avec flou + popup si accès bloqué. */
export function AccountAccessBlockedShell({
  blocked,
  reason,
  onAcknowledge,
  children,
  className,
}: ShellProps) {
  return (
    <>
      <div className={cn(blocked && 'pointer-events-none select-none', className)}>
        <div className={cn(blocked && 'blur-[6px] opacity-50 transition-all duration-300')}>
          {children}
        </div>
      </div>
      <AccountAccessBlockedDialog
        open={blocked}
        reason={reason}
        onConfirm={onAcknowledge}
      />
    </>
  );
}

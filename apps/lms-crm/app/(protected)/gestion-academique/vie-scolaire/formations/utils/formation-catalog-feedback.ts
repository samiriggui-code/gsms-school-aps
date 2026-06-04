import { toast } from 'sonner';
import i18n from 'i18next';

const t = (key: string, options?: Record<string, string>) =>
  i18n.t(key, options as Record<string, string>);

/** Retours Sonner homogènes pour le catalogue formations (confirmation / annulation). */

export function toastFormationCreationSuccess(name?: string) {
  toast.success(t('formations.created'), {
    description: name
      ? t('formations.createdDescNamed', { name })
      : t('formations.createdDesc'),
  });
}

export function toastFormationCreationCancelled() {
  toast.info(t('formations.creationCancelled'), {
    description: t('formations.creationCancelledDesc'),
  });
}

export function toastFormationSuspendSuccess(name: string) {
  toast.success(t('formations.suspended'), {
    description: t('formations.suspendedDesc', { name }),
  });
}

export function toastFormationSuspendCancelled() {
  toast.info(t('formations.suspendCancelled'), {
    description: t('formations.suspendCancelledDesc'),
  });
}

export function toastFormationActivateSuccess(name: string) {
  toast.success(t('formations.activated'), {
    description: t('formations.activatedDesc', { name }),
  });
}

export function toastFormationActivateCancelled() {
  toast.info(t('formations.activateCancelled'), {
    description: t('formations.activateCancelledDesc'),
  });
}

export function toastFormationUpdateSuccess(name?: string) {
  toast.success(t('formations.updated'), {
    description: name
      ? t('formations.updatedDescNamed', { name })
      : t('formations.updatedDesc'),
  });
}

export function toastFormationUpdateCancelled() {
  toast.info(t('formations.updateCancelled'), {
    description: t('formations.updateCancelledDesc'),
  });
}

export function toastFormationError(message: string) {
  toast.error(t('formations.actionFailed'), { description: message });
}

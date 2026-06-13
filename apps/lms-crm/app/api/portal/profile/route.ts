import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { isPortalRole } from '@/lib/auth/app-routing';
import { PORTAL_CNAPS_MODULE } from '@/lib/portal/cnaps-portal';
import { prisma } from '@/lib/prisma';
import { uploadFile, deleteFileByKey, resolveKeyFromUrl } from '@repo/storage';

async function requirePortalUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false as const, response: fail('Unauthorized request', 401) };
  if (!isPortalRole(session.user.roleSlug ?? null)) {
    return { ok: false as const, response: fail('Espace réservé aux candidats et stagiaires.', 403) };
  }
  return { ok: true as const, userId: session.user.id, session };
}

function serializeProfile(user: {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatar: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  birthDate: Date | null;
  createdAt: Date;
}) {
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.name || user.email;
  return {
    id: user.id,
    email: user.email,
    name: displayName,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatar: user.avatar,
    address: user.address,
    city: user.city,
    postalCode: user.postalCode,
    birthDate: user.birthDate?.toISOString().slice(0, 10) ?? null,
    accountCreatedAt: user.createdAt.toISOString(),
  };
}

export async function GET() {
  const auth = await requirePortalUserId();
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      address: true,
      city: true,
      postalCode: true,
      birthDate: true,
      createdAt: true,
    },
  });

  if (!user) return fail('Utilisateur introuvable.', 404);
  return ok({ profile: serializeProfile(user) });
}

export async function POST(request: Request) {
  const auth = await requirePortalUserId();
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const firstName = String(formData.get('firstName') ?? '').trim() || undefined;
    const lastName = String(formData.get('lastName') ?? '').trim() || undefined;
    const phone = String(formData.get('phone') ?? '').trim() || undefined;
    const avatarFile = formData.get('avatarFile');
    const removeAvatar = formData.get('removeAvatar') === '1';

    const current = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { avatar: true, firstName: true, lastName: true },
    });
    if (!current) return fail('Utilisateur introuvable.', 404);

    let avatarUrl = current.avatar;

    if (removeAvatar && current.avatar) {
      const key = resolveKeyFromUrl(current.avatar);
      if (key) await deleteFileByKey(key).catch(() => undefined);
      avatarUrl = null;
    }

    if (avatarFile instanceof File && avatarFile.size > 0) {
      const uploaded = await uploadFile({
        file: avatarFile,
        module: PORTAL_CNAPS_MODULE,
        entityType: 'User',
        entityId: auth.userId,
        category: 'AVATAR',
        visibility: 'public',
      });
      avatarUrl = uploaded.url;
    }

    const fn = firstName ?? current.firstName ?? '';
    const ln = lastName ?? current.lastName ?? '';
    const composedName = [fn, ln].filter(Boolean).join(' ').trim() || undefined;

    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(composedName ? { name: composedName } : {}),
        ...(removeAvatar ? { avatar: null } : avatarFile instanceof File && avatarFile.size > 0 ? { avatar: avatarUrl } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        address: true,
        city: true,
        postalCode: true,
        birthDate: true,
        createdAt: true,
      },
    });

    return ok({ profile: serializeProfile(updated) });
  } catch (e) {
    console.error('[portal/profile]', e);
    return fail(e instanceof Error ? e.message : 'Mise à jour impossible.', 500);
  }
}

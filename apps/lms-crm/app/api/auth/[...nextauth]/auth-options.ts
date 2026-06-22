import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcrypt';
import { NextAuthOptions, Session, User } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import { JWT } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/prisma';
import { getClientIP } from '@/lib/api';
import {
  accountBlockMessage,
  assertLoginAllowed,
  resolveAccountBlockReason,
} from '@/lib/auth/account-access';
import {
  logAuthSignIn,
  logAuthSignInFailed,
  logAuthSignOut,
} from '@/lib/auth/auth-audit';
import { loadRolePermissionSlugs } from '@/lib/auth/load-role-permission-slugs';

const adapter: Adapter = PrismaAdapter(prisma as never);

export function getAuthOptions(req?: NextRequest): NextAuthOptions {
  const clientIp = req ? getClientIP(req) : undefined;

  return {
    adapter,
    providers: [
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'text' },
          password: { label: 'Password', type: 'password' },
          rememberMe: { label: 'Remember me', type: 'boolean' },
        },
        async authorize(credentials) {
          const email = credentials?.email?.trim() || '';

          if (!credentials || !credentials.email || !credentials.password) {
            await logAuthSignInFailed({
              email: email || 'inconnu',
              reason: 'Email et mot de passe requis',
              code: 400,
              ipAddress: clientIp,
            });
            throw new Error(
              JSON.stringify({
                code: 400,
                message: 'Please enter both email and password.',
              }),
            );
          }

          const login = email.toLowerCase();

          const user = await prisma.user.findFirst({
            where: {
              isTrashed: false,
              proEmail: { equals: login, mode: 'insensitive' },
            },
            select: {
              id: true,
              email: true,
              proEmail: true,
              password: true,
              name: true,
              roleId: true,
              avatar: true,
              status: true,
              isTrashed: true,
            },
          });

          if (!user) {
            await logAuthSignInFailed({
              email: credentials.email,
              reason: 'Utilisateur inconnu',
              code: 404,
              ipAddress: clientIp,
            });
            throw new Error(
              JSON.stringify({
                code: 404,
                message: 'User not found. Please register first.',
              }),
            );
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password || '',
          );

          if (!isPasswordValid) {
            await logAuthSignInFailed({
              email: credentials.email,
              reason: 'Mot de passe incorrect',
              code: 401,
              ipAddress: clientIp,
              userId: user.id,
            });
            throw new Error(
              JSON.stringify({
                code: 401,
                message: 'Invalid credentials. Incorrect password.',
              }),
            );
          }

          const blockReason = resolveAccountBlockReason(user);
          if (blockReason) {
            await logAuthSignInFailed({
              email: credentials.email,
              reason: accountBlockMessage(blockReason),
              code: 'ACCOUNT_DEACTIVATED',
              ipAddress: clientIp,
              userId: user.id,
            });
            assertLoginAllowed(user);
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastSignInAt: new Date() },
          });

          return {
            id: user.id,
            status: user.status,
            email: user.proEmail ?? login,
            name: user.name || 'Anonymous',
            roleId: user.roleId,
            avatar: user.avatar,
          };
        },
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        allowDangerousEmailAccountLinking: true,
        async profile(profile) {
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          if (existingUser) {
            const blockReason = resolveAccountBlockReason(existingUser);
            if (blockReason) {
              await logAuthSignInFailed({
                email: profile.email,
                reason: accountBlockMessage(blockReason),
                code: 'ACCOUNT_DEACTIVATED',
                ipAddress: clientIp,
                userId: existingUser.id,
              });
              assertLoginAllowed(existingUser);
            }

            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: profile.name,
                avatar: profile.picture || null,
                lastSignInAt: new Date(),
              },
            });

            return {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name || 'Anonymous',
              status: existingUser.status,
              roleId: existingUser.roleId,
              roleName: existingUser.role.name,
              avatar: existingUser.avatar,
            };
          }

          const defaultRole = await prisma.userRole.findFirst({
            where: { isDefault: true },
          });

          if (!defaultRole) {
            await logAuthSignInFailed({
              email: profile.email,
              reason: 'Rôle par défaut introuvable',
              code: 500,
              ipAddress: clientIp,
            });
            throw new Error(
              'Default role not found. Unable to create a new user.',
            );
          }

          const newUser = await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name,
              password: '',
              avatar: profile.picture || null,
              emailVerifiedAt: new Date(),
              roleId: defaultRole.id,
              status: 'ACTIVE',
            },
          });

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name || 'Anonymous',
            status: newUser.status,
            avatar: newUser.avatar,
            roleId: newUser.roleId,
            roleName: defaultRole.name,
          };
        },
      }),
    ],
    session: {
      strategy: 'jwt',
      maxAge: 24 * 60 * 60,
    },
    events: {
      async signIn({ user, account }) {
        if (!user?.id) return;
        await logAuthSignIn({
          userId: user.id,
          provider: account?.provider || 'credentials',
          ipAddress: clientIp,
        });
      },
      async signOut({ token }) {
        const userId = (token?.id ?? token?.sub) as string | undefined;
        if (!userId) return;
        await logAuthSignOut({
          userId,
          ipAddress: clientIp,
        });
      },
    },
    callbacks: {
      async jwt({
        token,
        user,
        session,
        trigger,
      }: {
        token: JWT;
        user: User;
        session?: Session;
        trigger?: 'signIn' | 'signUp' | 'update';
      }) {
        if (trigger === 'update' && session?.user) {
          token = session.user as unknown as JWT;
        } else if (user && user.roleId) {
          const role = await prisma.userRole.findUnique({
            where: { id: user.roleId },
          });

          token.id = (user.id || token.sub) as string;
          token.email = user.email;
          token.name = user.name;
          token.avatar = user.avatar;
          token.status = user.status;
          token.roleId = user.roleId;
          token.roleName = role?.name ?? token.roleName;
          token.roleSlug = role?.slug ?? null;
          token.permissionSlugs = await loadRolePermissionSlugs(user.roleId);
        }

        if (token.roleId && !token.roleSlug) {
          const role = await prisma.userRole.findUnique({
            where: { id: token.roleId },
            select: { slug: true, name: true },
          });
          if (role) {
            token.roleSlug = role.slug;
            if (!token.roleName) token.roleName = role.name ?? undefined;
          }
        }

        if (
          token.roleId &&
          (!token.permissionSlugs || token.permissionSlugs.length === 0)
        ) {
          token.permissionSlugs = await loadRolePermissionSlugs(
            token.roleId as string,
          );
        }

        return token;
      },
      async session({ session, token }: { session: Session; token: JWT }) {
        if (session.user) {
          session.user.id = token.id;
          session.user.email = token.email;
          session.user.name = token.name;
          session.user.avatar = token.avatar;
          session.user.status = token.status;
          session.user.roleId = token.roleId;
          session.user.roleName = token.roleName;
          session.user.roleSlug = token.roleSlug;
          session.user.permissionSlugs = token.permissionSlugs ?? [];

          if (token.id) {
            const fresh = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: {
                avatar: true,
                name: true,
                status: true,
                isTrashed: true,
              },
            });
            if (fresh) {
              session.user.avatar = fresh.avatar;
              if (fresh.name) session.user.name = fresh.name;
              session.user.status = fresh.status;
              const reason = resolveAccountBlockReason(fresh);
              (session.user as { accessBlocked?: boolean }).accessBlocked =
                reason !== null;
              (session.user as { accessBlockReason?: string }).accessBlockReason =
                reason ?? undefined;
            }
          }
        }
        return session;
      },
      async redirect({ url, baseUrl }) {
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        if (new URL(url).origin === baseUrl) return url;
        return `${baseUrl}/accueil`;
      },
    },
    pages: {
      signIn: '/signin',
    },
  };
}

const authOptions = getAuthOptions();

export default authOptions;

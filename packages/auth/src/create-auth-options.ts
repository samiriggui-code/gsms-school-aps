import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcrypt';
import { NextAuthOptions, Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';

type PrismaLike = {
  user: {
    findFirst: (args: {
      where: { isTrashed: boolean; proEmail: { equals: string; mode: 'insensitive' } };
    }) => Promise<any>;
    update: (args: { where: { id: string }; data: { lastSignInAt: Date } }) => Promise<any>;
  };
  userRole: {
    findUnique: (args: { where: { id: string } }) => Promise<{ name?: string } | null>;
  };
};

export function createAuthOptions(prisma: PrismaLike): NextAuthOptions {
  return {
    adapter: PrismaAdapter(prisma as any),
    providers: [
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'text' },
          password: { label: 'Password', type: 'password' },
          rememberMe: { label: 'Remember me', type: 'boolean' },
        },
        async authorize(credentials) {
          if (!credentials || !credentials.email || !credentials.password) {
            throw new Error(
              JSON.stringify({
                code: 400,
                message: 'Please enter both email and password.',
              }),
            );
          }

          const login = credentials.email.trim().toLowerCase();
          const user = await prisma.user.findFirst({
            where: {
              isTrashed: false,
              proEmail: { equals: login, mode: 'insensitive' },
            },
          });

          if (!user) {
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
            throw new Error(
              JSON.stringify({
                code: 401,
                message: 'Invalid credentials. Incorrect password.',
              }),
            );
          }

          if (user.status !== 'ACTIVE') {
            throw new Error(
              JSON.stringify({
                code: 403,
                message: 'Account not activated. Please verify your email.',
              }),
            );
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastSignInAt: new Date() },
          });

          return {
            id: user.id,
            status: user.status,
            email: user.proEmail,
            name: user.name || 'Anonymous',
            roleId: user.roleId,
            avatar: user.avatar,
          };
        },
      }),
    ],
    session: {
      strategy: 'jwt',
      maxAge: 24 * 60 * 60,
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
          token = session.user;
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
          token.roleName = role?.name;
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
        }
        return session;
      },
    },
    pages: {
      signIn: '/signin',
    },
  };
}

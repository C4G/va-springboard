import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import GoogleProvider from 'next-auth/providers/google';
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authOptions: NextAuthConfig = {
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email || '' },
      });

      if (!existingUser) {
        return '/unauthorized';
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            role: true,
            schoolId: true,
          },
        });

        if (existingUser) {
          token.id = existingUser.id;
          token.role = existingUser.role || 'USER';
          token.schoolId = existingUser.schoolId ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = (token.role as string) || 'USER';
        session.user.id = token.id as string;
        session.user.schoolId = (token.schoolId as string | null) ?? null;
      }
      return session;
    },
  },
  pages: {
    signOut: '/',
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

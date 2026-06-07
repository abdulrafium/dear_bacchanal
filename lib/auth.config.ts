import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.provider = user.provider || (account?.provider === "google" ? "google" : "credentials");
        token.isAdmin = !!user.isAdmin;
        token.isPurchased = !!user.isPurchased;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.provider = token.provider;
        session.user.isPurchased = token.isPurchased;
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative paths
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      // Allow redirects to our specific approved domains
      const approvedDomains = [
        baseUrl,
        "https://dearbacchanal.com",
        "https://dear-bacchanal.vercel.app"
      ];
      
      if (approvedDomains.some(domain => url.startsWith(domain))) {
        return url;
      }
      
      return baseUrl;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "your-development-secret-is-set-here-for-localhost-only",
  trustHost: true,
} satisfies NextAuthConfig;

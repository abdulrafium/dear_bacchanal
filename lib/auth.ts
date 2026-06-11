import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { getDatabase } from "./db";
import { signInSchema } from "./validators";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        oneTimeToken: { label: "One-time token", type: "text" },
      },
      async authorize(credentials) {
        try {
          const parsed = signInSchema.safeParse(credentials);
          if (!parsed.success) return null;
          const { email, password, oneTimeToken } = parsed.data;

          const db = await getDatabase();
          const usersCollection = db.collection("users");
          const user = await usersCollection.findOne({
            email: { $regex: new RegExp(`^${email}$`, "i") }
          });

          if (!user) return null;

          // Post-payment one-time token login (no password)
          if (oneTimeToken) {
            if (
              user.oneTimeToken !== oneTimeToken ||
              !user.oneTimeTokenExpiry ||
              new Date() > new Date(user.oneTimeTokenExpiry)
            ) {
              return null;
            }
            await usersCollection.updateOne(
              { _id: user._id },
              { $unset: { oneTimeToken: "", oneTimeTokenExpiry: "" }, $set: { updatedAt: new Date() } }
            );
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              image: user.image || null,
              provider: (user.provider as "credentials" | "google") || "credentials",
              isAdmin: !!user.isAdmin,
              isPurchased: !!user.isPurchased,
            };
          }

          // Normal password login
          if (!user.password) throw new Error("Please sign in with Google");
          const isPasswordValid = await compare(password!, user.password);
          if (!isPasswordValid) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image || null,
            provider: "credentials" as const,
            isAdmin: !!user.isAdmin,
            isPurchased: !!user.isPurchased,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          if (!user.email) {
            console.error("Google Sign-in error: No email returned from Google");
            return false;
          }

          const db = await getDatabase();
          const usersCollection = db.collection("users");

          const existingUser = await usersCollection.findOne({
            email: { $regex: new RegExp(`^${user.email}$`, "i") }
          });

          if (!existingUser) {
            console.log(`Creating new Google user: ${user.email}`);
            await usersCollection.insertOne({
              email: user.email.toLowerCase(),
              name: user.name,
              image: user.image,
              provider: "google",
              password: null,
              isAdmin: false,
              isPurchased: false,
              emailVerified: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          } else {
            console.log(`Synching existing Google user: ${user.email}`);
            await usersCollection.updateOne(
              { _id: existingUser._id },
              {
                $set: {
                  name: user.name || existingUser.name,
                  image: user.image || existingUser.image,
                  updatedAt: new Date(),
                },
              }
            );
          }
          return true;
        } catch (error) {
          console.error("Critical Google Sign-in callback error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // First, handle the initial login (this part is Edge-compatible if it doesn't use DB)
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.provider = u.provider || (account?.provider === "google" ? "google" : "credentials");
        token.isAdmin = u.isAdmin;
        token.isPurchased = u.isPurchased;
        token.lastSynced = Date.now();
      }

      // ONLY if we are NOT in the Edge Runtime, we can perform DB refreshes
      // In Next.js, process.env.NEXT_RUNTIME === 'nodejs' means we are in Node.js
      if (process.env.NEXT_RUNTIME === "nodejs") {
        const email = token?.email as string;
        const lastSynced = token.lastSynced as number || 0;
        const shouldSync = !lastSynced || (Date.now() - lastSynced > 5 * 60 * 1000);

        if (email && shouldSync) {
          try {
            const db = await getDatabase();
            const usersCollection = db.collection("users");
            const dbUser = await usersCollection.findOne({
              email: { $regex: new RegExp(`^${email}$`, "i") }
            });

            if (dbUser) {
              token.id = dbUser._id.toString();
              token.isPurchased = !!dbUser.isPurchased;
              token.lastSynced = Date.now();

              // Administrative override logic
              const envAdmins = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.split(',') : [];
              const hardcodedAdmins = [
                "admin@dearbacchanal.com"
              ];
              const allAdmins = [...envAdmins, ...hardcodedAdmins].map(e => e.trim().toLowerCase());

              const isAdminEmail = allAdmins.includes(email.toLowerCase());
              token.isAdmin = !!dbUser.isAdmin || isAdminEmail;

              // Sync database if hardcoded admin but not marked in DB
              if (isAdminEmail && !dbUser.isAdmin) {
                await usersCollection.updateOne(
                  { _id: dbUser._id },
                  { $set: { isAdmin: true, updatedAt: new Date() } }
                );
              }
            }
          } catch (error) {
            console.error("JWT sync error:", error);
          }
        }
      }

      return token;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "your-development-secret-is-set-here-for-localhost-only",
  trustHost: true,
});
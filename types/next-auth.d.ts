import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      provider: "credentials" | "google";
      isPurchased?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    provider?: "credentials" | "google";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    provider: "credentials" | "google";
    isPurchased?: boolean;
  }
}
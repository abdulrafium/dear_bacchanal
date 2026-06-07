"use client";

import { useSession, signOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status, update } = useSession();

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    logout: () => signOut({ callbackUrl: "/" }),
    refreshUser: async () => {
      await update();
    }
  };
}
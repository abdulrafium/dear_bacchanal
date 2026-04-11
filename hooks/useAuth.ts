"use client";

import { useFirebase } from "@/providers/FirebaseAuthProvider";

export function useAuth() {
  const { user, loading, isAuthenticated, getToken } = useFirebase();

  return {
    user,
    isLoading: loading,
    isAuthenticated,
    getToken,
  };
}
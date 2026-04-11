"use client";

import { useFirebase } from "@/providers/FirebaseAuthProvider";

export function useAuth() {
  const { user, loading, isAuthenticated } = useFirebase();

  return {
    user,
    isLoading: loading,
    isAuthenticated,
  };
}
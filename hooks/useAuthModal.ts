"use client";

import { useContext } from "react";
import { AuthModalContext } from "@/components/auth/AuthProvider";

export function useAuthModal() {
  const context = useContext(AuthModalContext);

  if (context === undefined) {
    throw new Error("useAuthModal must be used within an AuthProvider");
  }

  return context;
}
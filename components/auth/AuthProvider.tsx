"use client";

import { createContext, useState, ReactNode, useCallback } from "react";
import { AuthModalState } from "@/types/auth";

interface AuthModalContextType extends AuthModalState {
  openModal: (view: "signin" | "signup") => void;
  closeModal: () => void;
  toggleView: () => void;
}

export const AuthModalContext = createContext<AuthModalContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<AuthModalState>({
    isOpen: false,
    view: "signin",
  });

  const openModal = useCallback((view: "signin" | "signup") => {
    setModalState({ isOpen: true, view });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const toggleView = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      view: prev.view === "signin" ? "signup" : "signin",
    }));
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        ...modalState,
        openModal,
        closeModal,
        toggleView,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}
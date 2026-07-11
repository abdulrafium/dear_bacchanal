"use client";

import { createContext, useState, ReactNode, useCallback } from "react";
import { AuthModalState } from "@/types/auth";

interface AuthModalContextType extends AuthModalState {
  openModal: (view: "signin" | "signup" | "forgot-password") => void;
  closeModal: () => void;
  toggleView: () => void;
  setView: (view: "signin" | "signup" | "forgot-password") => void;
}

export const AuthModalContext = createContext<AuthModalContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<AuthModalState>({
    isOpen: false,
    view: "signin",
  });

  const openModal = useCallback((view: "signin" | "signup" | "forgot-password") => {
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

  const setView = useCallback((view: "signin" | "signup" | "forgot-password") => {
    setModalState((prev) => ({ ...prev, view }));
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        ...modalState,
        openModal,
        closeModal,
        toggleView,
        setView,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}
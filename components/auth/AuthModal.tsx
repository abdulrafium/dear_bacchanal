"use client";

import { useAuthModal } from "@/hooks/useAuthModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

export function AuthModal() {
  const { isOpen, view, closeModal } = useAuthModal();

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {view === "signin" ? "Welcome Back" : "Join BACCHANAL"}
          </DialogTitle>
          <DialogDescription>
            {view === "signin"
              ? "Sign in to access your carnival experience"
              : "Create an account to start your carnival journey"}
          </DialogDescription>
        </DialogHeader>

        {view === "signin" ? <SignInForm /> : <SignUpForm />}
      </DialogContent>
    </Dialog>
  );
}
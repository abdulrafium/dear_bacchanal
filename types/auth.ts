export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  provider: "credentials" | "google";
  emailVerified?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  isPurchased?: boolean;
}

export interface AuthModalState {
  isOpen: boolean;
  view: "signin" | "signup";
}
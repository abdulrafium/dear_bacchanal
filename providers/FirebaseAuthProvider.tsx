"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
    onAuthStateChanged, 
    signInWithPopup, 
    signOut, 
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { toast } from "sonner";

interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    isPurchased: boolean;
    isAdmin: boolean;
    id: string; // Database ID
}

interface FirebaseAuthContextType {
    user: AuthUser | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const syncUserToDb = async (firebaseUser: User) => {
        try {
            const res = await fetch("/api/auth/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: firebaseUser.email,
                    name: firebaseUser.displayName,
                    image: firebaseUser.photoURL,
                    uid: firebaseUser.uid
                })
            });
            const data = await res.json();
            if (data.success) {
                const authedUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    isPurchased: !!data.user.isPurchased,
                    isAdmin: !!data.user.isAdmin,
                    id: data.user._id?.toString() || data.user.id
                };
                setUser(authedUser);
                
                // Keep for API requests
                const token = await firebaseUser.getIdToken();
                localStorage.setItem("fb_user_id", authedUser.id || "");
                localStorage.setItem("fb_token", token);

                // Sync to Firestore for real-time dashboard
                await setDoc(doc(db, "users", firebaseUser.uid), {
                    email: firebaseUser.email,
                    name: firebaseUser.displayName,
                    image: firebaseUser.photoURL,
                    provider: firebaseUser.providerData[0]?.providerId || "credentials",
                    isPurchased: !!data.user.isPurchased,
                    lastLogin: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
        } catch (error) {
            console.error("User sync error:", error);
            // Even if sync fails, keep the base firebase info
            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                isPurchased: false,
                isAdmin: false,
                id: ""
            });
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Pre-fetch token
                const token = await firebaseUser.getIdToken();
                localStorage.setItem("fb_token", token);
                syncUserToDb(firebaseUser).finally(() => setLoading(false));
            } else {
                setUser(null);
                localStorage.removeItem("fb_user_email");
                localStorage.removeItem("fb_user_id");
                localStorage.removeItem("fb_token");
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        try {
            setLoading(true);
            await signInWithPopup(auth, googleProvider);
            toast.success("Login Successful!");
        } catch (error: any) {
            console.error("Google Login Error:", error);
            toast.error(error.message || "Failed to login with Google");
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            toast.success("Logged out successfully");
        } catch (error: any) {
            console.error("Logout Error:", error);
            toast.error("Failed to logout");
        }
    };

    const refreshUser = async () => {
        if (auth.currentUser) {
            await syncUserToDb(auth.currentUser);
        }
    };

    return (
        <FirebaseAuthContext.Provider value={{
            user,
            loading,
            loginWithGoogle,
            logout,
            refreshUser,
            isAuthenticated: !!user
        }}>
            {children}
        </FirebaseAuthContext.Provider>
    );
}

export function useFirebase() {
    const context = useContext(FirebaseAuthContext);
    if (context === undefined) {
        throw new Error("useFirebase must be used within a FirebaseAuthProvider");
    }
    return context;
}

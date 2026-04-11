"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { 
    onAuthStateChanged, 
    signInWithPopup, 
    signOut, 
    User,
    onIdTokenChanged
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
    getToken: (forceRefresh?: boolean) => Promise<string | null>;
    isAuthenticated: boolean;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
    // Optimistic hydration from local storage for instant perceived speed
    const [user, setUser] = useState<AuthUser | null>(() => {
        if (typeof window !== "undefined") {
            const cached = localStorage.getItem("fb_user_cache");
            return cached ? JSON.parse(cached) : null;
        }
        return null;
    });
    const [loading, setLoading] = useState(true);

    const syncUserToDb = useCallback(async (firebaseUser: User) => {
        // Use a simple guard to prevent double syncs in quick succession
        const lastSyncId = localStorage.getItem("last_sync_uid");
        const lastSyncTime = localStorage.getItem("last_sync_time");
        const now = Date.now();

        // If we synced this UID in the last 5 seconds, skip unless it's a different user
        if (lastSyncId === firebaseUser.uid && lastSyncTime && (now - parseInt(lastSyncTime)) < 5000) {
            setLoading(false);
            return;
        }

        // Set basic info optimistically immediately
        const baseUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            isPurchased: false, 
            isAdmin: false,
            id: ""
        };
        
        // Update state but don't finish loading until DB confirms
        setUser((prev) => prev?.uid === firebaseUser.uid ? { ...baseUser, ...prev } : baseUser);

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
                    ...baseUser,
                    isPurchased: !!data.user.isPurchased,
                    isAdmin: !!data.user.isAdmin,
                    id: data.user._id?.toString() || data.user.id
                };
                
                setUser(authedUser);
                localStorage.setItem("fb_user_cache", JSON.stringify(authedUser));
                localStorage.setItem("fb_user_id", authedUser.id || "");
                localStorage.setItem("last_sync_uid", firebaseUser.uid);
                localStorage.setItem("last_sync_time", now.toString());
                
                // Firestore sync in background (non-blocking)
                setDoc(doc(db, "users", firebaseUser.uid), {
                    email: firebaseUser.email,
                    name: firebaseUser.displayName,
                    image: firebaseUser.photoURL,
                    provider: firebaseUser.providerData[0]?.providerId || "credentials",
                    isPurchased: !!data.user.isPurchased,
                    lastLogin: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }, { merge: true }).catch(err => console.error("Firestore sync error:", err));
            }
        } catch (error) {
            console.error("User sync error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                firebaseUser.getIdToken().then(token => {
                    localStorage.setItem("fb_token", token);
                    syncUserToDb(firebaseUser);
                });
            } else {
                setUser(null);
                localStorage.removeItem("fb_user_cache");
                localStorage.removeItem("fb_user_id");
                localStorage.removeItem("fb_token");
                localStorage.removeItem("last_sync_uid");
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [syncUserToDb]);

    const getToken = async (forceRefresh = false) => {
        if (!auth.currentUser) return null;
        const token = await auth.currentUser.getIdToken(forceRefresh);
        localStorage.setItem("fb_token", token);
        return token;
    };

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
            setUser(null);
            localStorage.removeItem("fb_user_cache");
            toast.success("Logged out successfully");
        } catch (error: any) {
            console.error("Logout Error:", error);
            toast.error("Failed to logout");
        }
    };

    const refreshUser = useCallback(async () => {
        if (auth.currentUser) {
            await syncUserToDb(auth.currentUser);
        }
    }, [syncUserToDb]);

    return (
        <FirebaseAuthContext.Provider value={{
            user,
            loading,
            loginWithGoogle,
            logout,
            refreshUser,
            getToken,
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

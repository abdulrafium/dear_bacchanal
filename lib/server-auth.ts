import { NextRequest } from "next/server";
import { auth as nextAuth } from "@/lib/auth";
import * as admin from "firebase-admin";

// Initialize Firebase Admin once
const firebaseAdmin = admin.apps.length 
  ? admin.app() 
  : admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "dear-bacchanal",
    });

// Memory cache for user sessions to speed up requests
const userCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function getServerAuth(req: NextRequest) {
    // 1. Try Firebase Token (Most Secure)
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const idToken = authHeader.split("Bearer ")[1];
        try {
            const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            // Check cache first
            const cached = userCache.get(uid);
            if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
                return cached.data;
            }
            
            // Look up in MongoDB to get the _id and other fields (isAdmin, isPurchased)
            const { getDatabase } = await import("@/lib/db");
            const db = await getDatabase();
            const dbUser = await db.collection("users").findOne({ firebaseUid: uid });

            const userData = {
                id: dbUser ? dbUser._id.toString() : uid,
                email: decodedToken.email,
                name: decodedToken.name,
                image: decodedToken.picture,
                uid: uid,
                isAdmin: dbUser?.isAdmin || false,
                isPurchased: dbUser?.isPurchased || false,
                isFirebase: true
            };

            // Update cache
            userCache.set(uid, { data: userData, timestamp: Date.now() });

            return userData;
        } catch (error) {
            console.error("Firebase Token Verification Failed:", error);
            // Fallback to NextAuth or Headers if verification fails
        }
    }

    // 2. Try NextAuth session (Legacy fallback)
    const session = await nextAuth();
    if (session?.user) {
        return {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
            isAdmin: (session.user as any).isAdmin,
            isPurchased: (session.user as any).isPurchased,
        };
    }

    // 3. Try Insecure Headers (Transition phase - ONLY for local dev)
    if (process.env.NODE_ENV === "development") {
        const fbEmail = req.headers.get("x-user-email");
        const fbId = req.headers.get("x-user-id");

        if (fbEmail || fbId) {
            return {
                id: fbId || fbEmail,
                email: fbEmail,
                name: fbEmail?.split("@")[0],
                isInsecure: true
            };
        }
    }

    return null;
}

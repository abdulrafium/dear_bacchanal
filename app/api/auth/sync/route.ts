import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: NextRequest) {
    try {
        const { email, name, image, uid } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        // Get document reference
        const userRef = doc(db, "users", uid);
        const userDoc = await getDoc(userRef);

        let userData;
        if (userDoc.exists()) {
            userData = userDoc.data();
            // Update lastLogin and name/image if provided
            await updateDoc(userRef, {
                name: name || userData.name,
                image: image || userData.image,
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            userData = { ...userData, id: uid };
        } else {
            // Create new
            userData = {
                id: uid,
                email,
                name: name || email.split("@")[0],
                image: image || null,
                provider: "firebase",
                isPurchased: false,
                isAdmin: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            };
            await setDoc(userRef, userData);
        }

        return NextResponse.json({ success: true, user: userData });
    } catch (error: any) {
        console.error("Sync user error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { auth as nextAuth } from "@/lib/auth";

export async function getServerAuth() {
    // Session check using NextAuth
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

    return null;
}

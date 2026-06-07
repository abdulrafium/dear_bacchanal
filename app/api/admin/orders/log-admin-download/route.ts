import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
    try {
        const authError = await adminAuthMiddleware();
        if (authError) return authError;

        const user = await getServerAuth();
        const { templateName, spreadsCount } = await req.json();

        const db = await getDatabase();
        const ordersCollection = db.collection("orders");
        
        const orderRecord = {
            orderId: `ADMIN_TEST_${Date.now()}`,
            userId: user?.id,
            email: user?.email,
            templateName: templateName || "Admin Test Book",
            orderType: "admin_test",
            status: "completed",
            amount: 0, 
            currency: "USD",
            pagesCount: spreadsCount || 20,
            addonsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await ordersCollection.insertOne(orderRecord);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Log admin download error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail-service";
import { getContactAdminNotification, getContactUserConfirmation } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
    try {
        const { name, email, subject, message } = await req.json();

        if (!name || !email || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Send confirmation to User
        await sendEmail({
            to: email,
            subject: "We've received your message - Dear Bacchanal",
            html: getContactUserConfirmation(name)
        });

        // 2. Send notification to Admin
        await sendEmail({
            to: process.env.ADMIN_EMAIL || "admin@dearbacchanal.com",
            subject: `Contact Form: ${subject || 'General Inquiry'}`,
            html: getContactAdminNotification({
                name,
                email,
                subject: subject || 'N/A',
                message
            })
        });

        return NextResponse.json({ success: true, message: "Emails sent successfully" });
    } catch (error: any) {
        console.error("Contact API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = req.nextUrl.searchParams.get("isAdmin") === "true";
    const templateName = req.nextUrl.searchParams.get("templateName");

    if (!session?.user?.id && !session?.user?.email && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session?.user?.id || session?.user?.email || "anonymous-dev-user";
    const db = await getDatabase();

    if (isAdmin) {
      const templatesCollection = db.collection("global_templates");
      const template = await templatesCollection.findOne({ templateName: templateName || "New Template" });
      
      return NextResponse.json({ template }, { status: 200 });
    } else {
      const userBooksCollection = db.collection("user_books");
      let book = await userBooksCollection.findOne({ userId });
      
      if (!book) {
        // Find the canonical template in DB first (so admin fixes are live)
        const templatesCollection = db.collection("global_templates");
        const dbTemplate = await templatesCollection.findOne({ templateName: "Bacchanal 2026" });
        
        let initialSpreads = [];
        let templateName = "Bacchanal 2026";

        if (dbTemplate && dbTemplate.spreads) {
          initialSpreads = dbTemplate.spreads;
          templateName = dbTemplate.templateName;
        } else {
          // Hard fallback to code definition
          const { getAvailableTemplates } = await import('@/lib/book-templates');
          const defaultTemplate = getAvailableTemplates().find(t => t.id === "bacchanal-2026");
          initialSpreads = defaultTemplate?.spreads || [];
        }
        
        book = {
          _id: "preview-id" as any,
          userId,
          spreads: initialSpreads,
          activeTemplateName: templateName,
          currentSpreadIndex: 0
        } as any;
      }
      
      return NextResponse.json({ book }, { status: 200 });
    }
  } catch (error) {
    console.error("Error loading data:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

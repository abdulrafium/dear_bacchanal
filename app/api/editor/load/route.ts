import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = req.nextUrl.searchParams.get("isAdmin") === "true";
    const templateName = req.nextUrl.searchParams.get("templateName");
    const isNew = req.nextUrl.searchParams.get("new") === "true";

    if (!session?.user?.id && !session?.user?.email && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session?.user?.id || session?.user?.email || "anonymous-dev-user";
    const db = await getDatabase();

    if (isAdmin) {
      if (isNew) {
        const { createBlankTemplate } = await import('@/lib/book-templates');
        const blank = createBlankTemplate();
        return NextResponse.json({ 
          template: {
            templateName: "New Template",
            description: "Custom template created via editor",
            spreads: blank.spreads,
            currentSpreadIndex: 0
          }
        }, { status: 200 });
      }

      const templatesCollection = db.collection("global_templates");
      let template = null;
      
      if (templateName) {
        template = await templatesCollection.findOne({ templateName });
      }
      
      if (!template) {
        // Fallback to Bacchanal if no specific template requested or found
        template = await templatesCollection.findOne({ 
          templateName: { $in: ["Bacchanal 2026", "Bacchanal"] } 
        });
      }
      
      return NextResponse.json({ template }, { status: 200 });
    } else {
      const userBooksCollection = db.collection("user_books");
      const templatesCollection = db.collection("global_templates");
      
      if (isNew) {
        const { createBlankTemplate } = await import('@/lib/book-templates');
        const blank = createBlankTemplate();
        const book = {
          userId,
          spreads: blank.spreads,
          activeTemplateName: "Untitled Book",
          currentSpreadIndex: 0,
          templateDescription: "Custom blank canvas"
        };
        return NextResponse.json({ book }, { status: 200 });
      }

      let query: any = { userId };
      if (templateName) {
        query.activeTemplateName = templateName;
      }
      
      let book = await userBooksCollection.findOne(query);
      
      // FOR TESTING & SYNC: In development or for new users, only try to pull the latest Bacchanal template if no specific template is requested
      const isDevUser = userId === "anonymous-dev-user";
      
      if (!book || (isDevUser && !templateName)) {
        // Find the canonical template in DB (Admin's latest work)
        const dbTemplate = await templatesCollection.findOne({ 
            templateName: { $in: ["Bacchanal 2026", "Bacchanal"] } 
        });
        
        if (dbTemplate && dbTemplate.spreads) {
          // If it's a dev user, we want to see the latest admin changes even if we had a book before
          if (isDevUser && book) {
             book.spreads = dbTemplate.spreads;
             book.activeTemplateName = dbTemplate.templateName;
          } else if (!book) {
            book = {
              _id: "preview-id" as any,
              userId,
              spreads: dbTemplate.spreads,
              activeTemplateName: dbTemplate.templateName,
              currentSpreadIndex: 0,
              templateDescription: dbTemplate.description
            } as any;
          }
        } else if (!book) {
          // Hard fallback to code definition if DB is empty
          const { getAvailableTemplates } = await import('@/lib/book-templates');
          const defaultTemplate = getAvailableTemplates().find(t => t.id === "bacchanal-2026");
          book = {
            _id: "preview-id" as any,
            userId,
            spreads: defaultTemplate?.spreads || [],
            activeTemplateName: defaultTemplate?.name || "Bacchanal 2026",
            currentSpreadIndex: 0,
            templateDescription: defaultTemplate?.description
          } as any;
        }
      }
      
      return NextResponse.json({ book }, { status: 200 });
    }
  } catch (error) {
    console.error("Error loading data:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

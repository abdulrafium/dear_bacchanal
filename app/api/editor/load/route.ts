import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const user = await getServerAuth(req);
    const isAdmin = req.nextUrl.searchParams.get("isAdmin") === "true";
    const templateName = req.nextUrl.searchParams.get("templateName");
    const isNew = req.nextUrl.searchParams.get("new") === "true";

    if (!user && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIdFromAuth = user?.id || user?.email || "anonymous-dev-user";
    const targetUserId = req.nextUrl.searchParams.get("userId");
    
    // Check if the requester is an admin
    const isRequesterAdmin = userIdFromAuth === "admin@dearbacchanal.com" || process.env.NODE_ENV === "development";
    
    // Determine which userId's data to load
    const userId = (isRequesterAdmin && targetUserId) ? targetUserId : userIdFromAuth;
    
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
          templateName: { $in: ["Bacchanal 2026", "Bacchanal", "Dear Bacchanal"] } 
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
      
      // MASTER SMART-SYNC LOGIC: Deeply merge Admin design updates while protecting User personal content
      const dbTemplate = await templatesCollection.findOne({ 
          templateName: { $in: ["Bacchanal 2026", "Bacchanal", "Dear Bacchanal"] } 
      });

      if (dbTemplate && dbTemplate.spreads) {
        if (book) {
          // If the book matches the template series, perform the smart merge
          const currentBook = book; // Local reference to help TS narrow the type
          if (currentBook.activeTemplateName?.includes("Bacchanal") || currentBook.activeTemplateName === "Untitled Book") {
            const mergedSpreads = dbTemplate.spreads.map((adminSpread: any, index: number) => {
              const userSpread = currentBook.spreads && currentBook.spreads[index];
              if (!userSpread) return adminSpread;

              const mergePage = (adminPage: any, userPage: any) => {
                if (!userPage) return adminPage;
                const adminElements = adminPage.elements || [];
                const userElements = userPage.elements || [];
                
                const mergedElements = adminElements.map((ae: any) => {
                  const ue = userElements.find((e: any) => e.id === ae.id);
                  // Preserve user content in admin placeholders
                  if (ue && (ae.type === "image" || ae.type === "photo-card") && ue.src) {
                     return { ...ae, src: ue.src };
                  }
                  if (ue && ae.type === "text" && ue.text && ue.text !== ae.text) {
                     return { ...ae, text: ue.text };
                  }
                  return ae;
                });

                // Add user's custom added elements (extra stickers, text, etc. not in template)
                userElements.forEach((ue: any) => {
                  const isAdminElement = adminElements.some((ae: any) => ae.id === ue.id);
                  if (!isAdminElement) mergedElements.push(ue);
                });

                return {
                  ...adminPage,
                  elements: mergedElements,
                  background: adminPage.background || userPage.background
                };
              };

              return {
                ...adminSpread,
                leftPage: mergePage(adminSpread.leftPage, userSpread.leftPage),
                rightPage: mergePage(adminSpread.rightPage, userSpread.rightPage),
              };
            });

            book.spreads = mergedSpreads;
            book.templateDescription = dbTemplate.description;
          }
        } else {
          // New user: load template directly
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
      
      return NextResponse.json({ book }, { status: 200 });
    }
  } catch (error) {
    console.error("Error loading data:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

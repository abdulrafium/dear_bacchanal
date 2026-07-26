import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// --- In-memory template cache (5 minutes) ---
// The global template is the same for every user and rarely changes.
// Caching it eliminates one MongoDB round-trip on every single editor load.
const templateCache = new Map<string, { data: any; expires: number }>();
const TEMPLATE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCachedTemplate(name: string | null, db: any): Promise<any> {
  const key = name || "__default__";
  const cached = templateCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  // Cache miss — fetch from MongoDB
  const templatesCollection = db.collection("global_templates");
  let template = null;
  if (name) {
    template = await templatesCollection.findOne({ templateName: name });
  }
  if (!template) {
    template = await templatesCollection.findOne({
      templateName: { $in: ["Bacchanal 2026", "Bacchanal", "Dear Bacchanal"] }
    });
  }
  if (template) {
    templateCache.set(key, { data: template, expires: Date.now() + TEMPLATE_CACHE_TTL_MS });
  }
  return template;
}

/** Call this when admin saves a template so the cache is immediately invalidated */
export function invalidateTemplateCache(name?: string) {
  if (name) templateCache.delete(name);
  templateCache.delete("__default__");
}

export async function GET(req: NextRequest) {
  try {
    const user = await getServerAuth();
    const isAdmin = req.nextUrl.searchParams.get("isAdmin") === "true";
    const templateName = req.nextUrl.searchParams.get("templateName");
    const isNew = req.nextUrl.searchParams.get("new") === "true";

    if (!user && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIdFromAuth = user?.id || user?.email || "anonymous-dev-user";
    const targetUserId = req.nextUrl.searchParams.get("userId");

    // Check if the requester is an admin
    const isRequesterAdmin = !!user?.isAdmin || process.env.NODE_ENV === "development";

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

      // Admin: use cache for template fetch
      const template = await getCachedTemplate(templateName, db);
      return NextResponse.json({ template }, { status: 200 });
    } else {
      const userBooksCollection = db.collection("user_books");

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

      const bookId = req.nextUrl.searchParams.get("bookId");
      const fresh = req.nextUrl.searchParams.get("fresh") === "true";

      let query: any = { 
        $or: [
          { userId },
          ...(user?.email ? [{ email: user.email }] : [])
        ]
      };

      if (bookId) {
        try {
          const { ObjectId } = require('mongodb');
          query = { ...query, _id: new ObjectId(bookId) };
        } catch (e) {
          query.activeTemplateName = templateName;
        }
      } else if (templateName && !fresh) {
        query.activeTemplateName = templateName;
      } else if (fresh) {
        query = null;
      }

      console.log(`[API Load Debug] bookId: ${bookId}, fresh: ${fresh}, query:`, query ? JSON.stringify(query) : 'null');

      let book = query ? await userBooksCollection.findOne(query) : null;
      console.log(`[API Load Debug] found book:`, book ? book._id.toString() : 'null');

      // MASTER SMART-SYNC LOGIC: Deeply merge Admin design updates while protecting User personal content
      const templateToSync = book ? book.activeTemplateName : templateName;
      // Use cache — avoids a full MongoDB round-trip for the global template on every editor load
      const dbTemplate = await getCachedTemplate(templateToSync, db);

      if (dbTemplate && dbTemplate.spreads) {
        // Ensure all checkboxes in the global template are unchecked by default
        dbTemplate.spreads = dbTemplate.spreads.map((s: any) => ({
          ...s,
          leftPage: { ...s.leftPage, elements: s.leftPage?.elements?.map((e: any) => e.type === 'checkbox' ? { ...e, isChecked: false } : e) },
          rightPage: { ...s.rightPage, elements: s.rightPage?.elements?.map((e: any) => e.type === 'checkbox' ? { ...e, isChecked: false } : e) }
        }));

        if (book) {
          // If the book matches the template series, perform the smart merge
          const currentBook = book;
          if (currentBook.activeTemplateName) {
            const mergedSpreads = currentBook.spreads.map((userSpread: any) => {
              // Find matching admin spread by ID. If not found, it's a custom user spread.
              const adminSpread = dbTemplate.spreads.find((as: any) => as.id === userSpread.id);

              if (!adminSpread) {
                return userSpread;
              }

              const mergePage = (adminPage: any, userPage: any) => {
                if (!userPage) return adminPage;
                const adminElements = adminPage.elements || [];
                const userElements = userPage.elements || [];

                const mergedElements = adminElements.map((ae: any) => {
                  const ue = userElements.find((e: any) => e.id === ae.id);
                  if (!ue) return ae;
                  
                  // Preserve the user's exact element (x, y, width, height, text, image, rotation)
                  // Spread admin element first just in case a new schema property was added globally
                  return { ...ae, ...ue };
                });

                // Add user's custom added elements (extra stickers, text, etc. not in template)
                userElements.forEach((ue: any) => {
                  const isAdminElement = adminElements.some((ae: any) => ae.id === ue.id);
                  if (!isAdminElement) mergedElements.push(ue);
                });

                return {
                  ...adminPage,
                  ...userPage, // Ensure user's page-level properties are kept
                  elements: mergedElements,
                  background: userPage.background || adminPage.background // User background wins
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
          // New user or fresh template: load template directly without an ID
          // The save API will handle inserting this as a new document when the user makes their first edit.
          book = {
            userId,
            email: user?.email,
            spreads: dbTemplate.spreads,
            activeTemplateName: dbTemplate.templateName,
            currentSpreadIndex: 0,
            templateDescription: dbTemplate.description,
            templateCountry: dbTemplate.country,
            templateYear: dbTemplate.year
          } as any;
        }
      } else if (!book) {
        // Hard fallback to code definition if DB is empty
        const { getAvailableTemplates } = await import('@/lib/book-templates');
        const defaultTemplate = getAvailableTemplates().find(t => t.id === "bacchanal-2026");
        book = {
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

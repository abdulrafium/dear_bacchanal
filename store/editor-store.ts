import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import Konva from "konva";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/uploadthing-client";

// Element types that can be placed on a page
export type ElementType = "image" | "text" | "shape" | "sticker" | "qrcode" | "calendar" | "photo-card" | "checkbox";
export type ShapeType = "rectangle" | "ellipse";

export interface CalendarSettings {
  month: number; // 0-11
  year: number;
  data: Record<string, string>; // "YYYY-MM-DD" -> text
  backgroundColor?: string;
  textColor?: string;
  titleColor?: string;
  hideTitle?: boolean;
}

export interface EditorElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isLocked?: boolean;
  // Image-specific
  src?: string;
  // Text-specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fill?: string;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  options?: string[]; // For dropdown text fields
  // Shape-specific
  shapeType?: ShapeType;
  stroke?: string;
  strokeWidth?: number;
  shapeFill?: string;
  cornerRadius?: number;
  // QR Code
  qrData?: string;
  // Calendar
  calendarSettings?: CalendarSettings;
  // Others
  opacity?: number;
  // Checkbox-specific
  isChecked?: boolean;
}

export interface BookPage {
  id: string;
  label: string;
  elements: EditorElement[];
  background: string; // color or image URL
  isLocked: boolean;
}

export interface BookSpread {
  id: string;
  leftPage: BookPage;
  rightPage: BookPage;
  isV2?: boolean;
  isOriginalTemplate?: boolean;
  originalTemplateIndex?: number;
}

export const isFullyLockedSpread = (spread: BookSpread | undefined, isAdmin: boolean, currentIndex?: number) => {
  if (!spread) return false;
  const isOriginal = spread.isOriginalTemplate !== false; // Backwards compat: undefined means true
  const indexToCheck = spread.originalTemplateIndex ?? currentIndex ?? 0;
  return !isAdmin && isOriginal && [0, 2, 3, 15, 16].includes(indexToCheck);
};

export const isTemplateSpread = (spread: BookSpread | undefined, isAdmin: boolean, currentIndex?: number) => {
  if (!spread) return false;
  const isOriginal = spread.isOriginalTemplate !== false;
  return !isAdmin && isOriginal && !isFullyLockedSpread(spread, isAdmin, currentIndex);
};

export type SidebarPanel = "images" | "templates" | "layouts" | "backgrounds" | "stickers" | "calendar" | "text" | null;
export type RightTool = "text" | "photo" | "qrcode" | "layout" | "rectangle" | "ellipse" | "checkbox" | null;

interface HistoryEntry {
  spreads: BookSpread[];
  currentSpreadIndex: number;
}

interface EditorState {
  // Book data
  spreads: BookSpread[];
  currentSpreadIndex: number;
  isPageTransitioning: boolean;

  // Template
  templateLoaded: boolean;
  activeTemplateId: string | null;
  activeTemplateName: string | null;
  templateDescription: string | null;
  templateCountry: string | null;
  templateYear: string | null;

  // UI state
  isAdmin: boolean;
  isPreviewMode: boolean;
  selectedElementId: string | null;
  activeSidebarPanel: SidebarPanel;
  activeRightTool: RightTool;
  zoom: number;
  showThumbnails: boolean;
  viewMode: "spread" | "single";
  previewElement: { id: string, updates: Partial<EditorElement> } | null;
  stageRef: Konva.Stage | null;
  isOrderModalOpen: boolean;

  // History
  history: HistoryEntry[];
  historyIndex: number;
  version: number;

  // Actions - Navigation
  setCurrentSpread: (index: number, skipDirty?: boolean) => void;
  nextSpread: () => void;
  prevSpread: () => void;

  // Actions - Elements
  addElement: (pageId: string, element: Omit<EditorElement, "id">) => void;
  updateElement: (pageId: string, elementId: string, updates: Partial<EditorElement>) => void;
  removeElement: (pageId: string, elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  setPreviewElement: (elementId: string | null, updates: Partial<EditorElement> | null) => void;
  toggleElementLock: (pageId: string, elementId: string) => void;
  applyLayout: (pageId: string, frames: { x: number; y: number; width: number; height: number; type: "image" | "text" }[]) => void;

  // Actions - Pages & Templates
  addSpread: () => void;
  duplicateSpread: (index: number) => void;
  removeSpread: (index: number) => void;
  updatePageBackground: (pageId: string, background: string) => void;
  loadTemplate: (spreads: BookSpread[], name: string, description?: string | null, country?: string | null, year?: string | null, id?: string | null) => void;
  setTemplateMetadata: (name: string | null, description: string | null, country?: string | null, year?: string | null) => void;

  // Actions - UI
  setSidebarPanel: (panel: SidebarPanel) => void;
  setRightTool: (tool: RightTool) => void;
  setZoom: (zoom: number) => void;
  toggleThumbnails: () => void;
  setViewMode: (mode: "spread" | "single") => void;
  togglePreview: () => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setStageRef: (ref: Konva.Stage | null) => void;
  setIsOrderModalOpen: (open: boolean) => void;
  setIsPageTransitioning: (isTransitioning: boolean) => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  resetEditor: () => void;
  save: (isAdmin?: boolean) => Promise<boolean>;
  isGeneratingPdf: boolean;
  pdfGenerationProgress: {
    current: number;
    total: number;
    status: string;
    isSoftCopy?: boolean;
    pdfType?: 'cover' | 'inner' | 'both';
    coverCurrent?: number;
    coverTotal?: number;
    innerCurrent?: number;
    innerTotal?: number;
  } | null;
  generatePdfBook: (isHardCopy?: boolean, keepOverlayOpen?: boolean, pdfType?: 'cover' | 'inner' | 'both') => Promise<void>;
}

function createDefaultPage(label: string, isLocked = false): BookPage {
  return {
    id: uuidv4(),
    label,
    elements: [],
    background: "#ffffff",
    isLocked,
  };
}

function createDefaultSpread(): BookSpread {
  return {
    id: uuidv4(),
    leftPage: createDefaultPage("Left Page"),
    rightPage: createDefaultPage("Right Page"),
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  spreads: [],
  currentSpreadIndex: 0,
  isPageTransitioning: false,
  templateLoaded: false,
  activeTemplateId: null,
  activeTemplateName: null,
  templateDescription: null,
  templateCountry: "Trinidad",
  templateYear: "2026",
  isAdmin: false,
  isPreviewMode: false,
  selectedElementId: null,
  activeSidebarPanel: "templates",
  activeRightTool: null,
  zoom: 100,
  showThumbnails: true,
  viewMode: "spread",
  previewElement: null,
  stageRef: null,
  isOrderModalOpen: false,
  history: [],
  historyIndex: -1,
  version: 0,
  isDirty: false,
  setDirty: (dirty) => set({ isDirty: dirty }),
  setStageRef: (ref) => set({ stageRef: ref }),
  setIsOrderModalOpen: (open) => set({ isOrderModalOpen: open }),
  setIsPageTransitioning: (isTransitioning) => set({ isPageTransitioning: isTransitioning }),

  // Navigation
  setCurrentSpread: (index) => set(() => ({
    currentSpreadIndex: index,
    selectedElementId: null,
  })),
  nextSpread: () => {
    const { currentSpreadIndex, spreads } = get();
    if (currentSpreadIndex < spreads.length - 1) {
      set({ currentSpreadIndex: currentSpreadIndex + 1, selectedElementId: null });
    }
  },
  prevSpread: () => {
    const { currentSpreadIndex } = get();
    if (currentSpreadIndex > 0) {
      set({ currentSpreadIndex: currentSpreadIndex - 1, selectedElementId: null });
    }
  },

  // Elements
  addElement: (pageId, element) => {
    const state = get();
    state.pushHistory();
    const newId = Math.random().toString(36).substring(2, 11).toUpperCase();
    set({
      spreads: state.spreads.map((spread) => ({
        ...spread,
        leftPage: spread.leftPage.id === pageId
          ? { ...spread.leftPage, elements: [...spread.leftPage.elements, { ...element, id: newId }] }
          : spread.leftPage,
        rightPage: spread.rightPage.id === pageId
          ? { ...spread.rightPage, elements: [...spread.rightPage.elements, { ...element, id: newId }] }
          : spread.rightPage,
      })),
    });
  },

  updateElement: (pageId, elementId, updates) => {
    const state = get();
    state.pushHistory();
    set({
      spreads: state.spreads.map((spread) => ({
        ...spread,
        leftPage: spread.leftPage.id === pageId
          ? { ...spread.leftPage, elements: spread.leftPage.elements.map((el) => el.id === elementId ? { ...el, ...updates } : el) }
          : spread.leftPage,
        rightPage: spread.rightPage.id === pageId
          ? { ...spread.rightPage, elements: spread.rightPage.elements.map((el) => el.id === elementId ? { ...el, ...updates } : el) }
          : spread.rightPage,
      })),
    });
  },

  removeElement: (pageId, elementId) => {
    const state = get();
    state.pushHistory();
    set({
      spreads: state.spreads.map((spread) => ({
        ...spread,
        leftPage: spread.leftPage.id === pageId
          ? { ...spread.leftPage, elements: spread.leftPage.elements.filter((el) => el.id !== elementId) }
          : spread.leftPage,
        rightPage: spread.rightPage.id === pageId
          ? { ...spread.rightPage, elements: spread.rightPage.elements.filter((el) => el.id !== elementId) }
          : spread.rightPage,
      })),
      selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId,
    });
  },

  selectElement: (elementId) => set({ selectedElementId: elementId }),

  setPreviewElement: (elementId, updates) => set({
    previewElement: elementId ? { id: elementId, updates: updates || {} } : null
  }),

  toggleElementLock: (pageId, elementId) => {
    const state = get();
    state.pushHistory();
    set({
      spreads: state.spreads.map((spread) => ({
        ...spread,
        leftPage: spread.leftPage.id === pageId
          ? { ...spread.leftPage, elements: spread.leftPage.elements.map(e => e.id === elementId ? { ...e, isLocked: !e.isLocked } : e) }
          : spread.leftPage,
        rightPage: spread.rightPage.id === pageId
          ? { ...spread.rightPage, elements: spread.rightPage.elements.map(e => e.id === elementId ? { ...e, isLocked: !e.isLocked } : e) }
          : spread.rightPage,
      }))
    });
  },

  applyLayout: (pageId, frames) => {
    const state = get();
    state.pushHistory();
    const newElements = frames.map((frame) => ({
      ...frame,
      id: uuidv4(),
      rotation: 0,
    } as EditorElement));

    set({
      spreads: state.spreads.map((spread) => ({
        ...spread,
        leftPage: spread.leftPage.id === pageId
          ? { ...spread.leftPage, elements: newElements }
          : spread.leftPage,
        rightPage: spread.rightPage.id === pageId
          ? { ...spread.rightPage, elements: newElements }
          : spread.rightPage,
      })),
      selectedElementId: null,
    });
  },

  // Pages
  addSpread: () => {
    const state = get();
    const len = state.spreads.length;
    const pageNum = len * 2;
    state.pushHistory();
    set({
      spreads: [
        ...state.spreads,
        {
          id: uuidv4(),
          isOriginalTemplate: false,
          leftPage: createDefaultPage(`Page ${pageNum}`),
          rightPage: createDefaultPage(`Page ${pageNum + 1}`),
        },
      ],
    });
    get().save();
  },

  duplicateSpread: (index) => {
    const state = get();
    const spreadToDupe = state.spreads[index];
    if (!spreadToDupe) return;
    state.pushHistory();

    const duped: BookSpread = {
      id: uuidv4(),
      isOriginalTemplate: false,
      leftPage: { ...spreadToDupe.leftPage, id: uuidv4(), elements: spreadToDupe.leftPage.elements.map(el => ({ ...el, id: uuidv4() })) },
      rightPage: { ...spreadToDupe.rightPage, id: uuidv4(), elements: spreadToDupe.rightPage.elements.map(el => ({ ...el, id: uuidv4() })) },
    };

    const newSpreads = [...state.spreads];
    newSpreads.splice(index + 1, 0, duped);
    set({ spreads: newSpreads });
    get().save();
  },

  removeSpread: (index) => {
    const state = get();
    if (state.spreads.length <= 1) return;
    state.pushHistory();
    const newSpreads = state.spreads.filter((_, i) => i !== index);
    set({
      spreads: newSpreads,
      currentSpreadIndex: Math.min(state.currentSpreadIndex, newSpreads.length - 1),
    });
    get().save();
  },

  updatePageBackground: (pageId, background) => {
    const state = get();
    state.pushHistory();
    set({
      spreads: state.spreads.map((spread) => ({
        ...spread,
        leftPage: spread.leftPage.id === pageId ? { ...spread.leftPage, background } : spread.leftPage,
        rightPage: spread.rightPage.id === pageId ? { ...spread.rightPage, background } : spread.rightPage,
      })),
    });
  },

  loadTemplate: (spreads: BookSpread[], name: string, description?: string | null, country?: string | null, year?: string | null, id?: string | null) => {
    // Deep clone and force-lock the cover spread (index 0) for all non-admin users.
    // The isAdmin flag is checked at render time to allow admins to bypass this.
    const loadedSpreads: BookSpread[] = JSON.parse(JSON.stringify(spreads)).map((spread: BookSpread, i: number) => ({
      ...spread,
      isOriginalTemplate: true,
      originalTemplateIndex: i,
    }));
    if (loadedSpreads.length > 0) {
      loadedSpreads[0] = {
        ...loadedSpreads[0],
        leftPage: { ...loadedSpreads[0].leftPage, isLocked: true },
        rightPage: { ...loadedSpreads[0].rightPage, isLocked: true },
      };
    }

    set({
      spreads: loadedSpreads,
      currentSpreadIndex: 0,
      templateLoaded: true,
      activeTemplateId: id || null,
      activeTemplateName: name,
      templateDescription: description || null,
      templateCountry: country || "Trinidad",
      templateYear: year || "2026",
      selectedElementId: null,
      history: [],
      historyIndex: -1,
      version: get().version + 1,
      isDirty: false,
      activeSidebarPanel: "layouts",
    });
  },


  setTemplateMetadata: (name: string | null, description: string | null, country?: string | null, year?: string | null) => set((s) => ({
    activeTemplateName: name !== null ? name : s.activeTemplateName,
    templateDescription: description !== null ? description : s.templateDescription,
    templateCountry: country !== undefined ? country : s.templateCountry,
    templateYear: year !== undefined ? year : s.templateYear,
    isDirty: true,
    version: s.version + 1
  })),

  save: async (isAdminParam?: boolean) => {
    const { spreads, isAdmin, activeTemplateId, activeTemplateName, templateDescription, templateCountry, templateYear, currentSpreadIndex, version: startVersion } = get();

    try {
      const res = await fetch("/api/editor/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreads,
          isAdmin: isAdminParam !== undefined ? isAdminParam : isAdmin,
          activeTemplateId: activeTemplateId === "undefined" ? null : activeTemplateId,
          activeTemplateName: activeTemplateName || "My Book",
          templateDescription,
          templateCountry,
          templateYear,
          currentSpreadIndex
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      const data = await res.json();

      if (data.templateId) {
        set({ activeTemplateId: data.templateId });
      }

      if (get().version === startVersion) {
        set({ isDirty: false });
      }

      return true;
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(`Save failed: ${error.message}`);
      return false;
    }
  },

  // UI
  setSidebarPanel: (panel) => set((s) => ({ activeSidebarPanel: s.activeSidebarPanel === panel ? null : panel })),
  setRightTool: (tool) => set({ activeRightTool: tool }),
  setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(200, zoom)) }),
  toggleThumbnails: () => set((s) => ({ showThumbnails: !s.showThumbnails })),
  setViewMode: (mode) => set({ viewMode: mode }),
  togglePreview: () => set((s) => ({ isPreviewMode: !s.isPreviewMode, selectedElementId: null })),
  setIsAdmin: (isAdmin) => set({ isAdmin }),

  // History
  pushHistory: () => {
    const state = get();
    const entry: HistoryEntry = {
      spreads: JSON.parse(JSON.stringify(state.spreads)),
      currentSpreadIndex: state.currentSpreadIndex,
    };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(entry);
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1, isDirty: true });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < 0) return;
    const entry = history[historyIndex];
    set({
      spreads: JSON.parse(JSON.stringify(entry.spreads)),
      currentSpreadIndex: entry.currentSpreadIndex,
      historyIndex: historyIndex - 1,
      selectedElementId: null,
      isDirty: true,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const entry = history[nextIndex];
    set({
      spreads: JSON.parse(JSON.stringify(entry.spreads)),
      currentSpreadIndex: entry.currentSpreadIndex,
      historyIndex: nextIndex,
      selectedElementId: null,
      isDirty: true,
    });
  },

  resetEditor: () => set({
    spreads: [createDefaultSpread()],
    currentSpreadIndex: 0,
    activeSidebarPanel: "layouts",
    activeTemplateName: null,
    selectedElementId: null,
    history: [],
    historyIndex: -1,
    isDirty: false, // Reset should be clean
  }),

  isGeneratingPdf: false,
  pdfGenerationProgress: null,
  generatePdfBook: async (isHardCopy = false, keepOverlayOpen = false, pdfType = 'both') => {
    const state = get();
    const { spreads, setCurrentSpread, stageRef, activeTemplateName, currentSpreadIndex, selectElement } = state;

    if (!stageRef) {
      toast.error("Editor canvas not ready. Please wait a moment and try again.");
      return;
    }

    if (spreads.length === 0) {
      toast.error("No pages to generate PDF from.");
      return;
    }

    set({ isGeneratingPdf: true });
    const originalIndex = currentSpreadIndex;
    const originalViewMode = state.viewMode;

    // Force spread (dual-page) view for PDF export
    if (originalViewMode === 'single') {
      set({ viewMode: 'spread' });
      await new Promise(r => setTimeout(r, 500));
    }

    // Clear selection so the transformer box doesn't appear in the PDF
    selectElement(null);

    // Eagerly pre-load the TTF font and massive pdf-lib libraries in the background
    // This allows the network fetch and WASM parsing to complete in parallel with the canvas image generation loop
    let fontPreloadPromise: Promise<any> | null = null;
    if (isHardCopy) {
      fontPreloadPromise = (async () => {
        try {
          const [pdfLibModule, fontkitModule, fontRes] = await Promise.all([
            import('pdf-lib'),
            import('@pdf-lib/fontkit'),
            fetch('/api/font-embed')
          ]);
          const { fontBase64 } = await fontRes.json();
          const fontBinary = atob(fontBase64);
          const fontBytes = new Uint8Array(fontBinary.length);
          for (let i = 0; i < fontBinary.length; i++) fontBytes[i] = fontBinary.charCodeAt(i);
          return { pdfLibModule, fontkitModule, fontBytes };
        } catch (e) {
          console.error("Font preload failed", e);
          return null;
        }
      })();
    }

    try {
      const { jsPDF } = await import("jspdf");
      const PAGE_WIDTH = 500;
      const PAGE_HEIGHT = 500;

      // SiteFlow precise dimensions in points
      // Cover Template: 260mm (Back) + 10mm (Spine) + 260mm (Front) + 40mm (Bleed left/right) = 570mm
      // Cover Template: 260mm (Height) + 40mm (Bleed top/bottom) = 300mm
      // 1 mm = 2.83465 pt
      const COVER_WIDTH = 570 * 2.83465; // 1615.75
      const COVER_HEIGHT = 300 * 2.83465; // 850.39
      // Inner Page Template: 254mm safe zone + 3mm Bleed on all sides = 260mm x 260mm per page
      const TEXT_PAGE_WIDTH = 260 * 2.83465; // 737.009
      const TEXT_PAGE_HEIGHT = 260 * 2.83465; // 737.009

      let coverPdf: InstanceType<typeof jsPDF> | null = null;
      let textPdf: InstanceType<typeof jsPDF> | null = null;
      let softPdf: InstanceType<typeof jsPDF> | null = null;

      if (isHardCopy) {
        coverPdf = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: [COVER_WIDTH, COVER_HEIGHT],
          compress: true
        });

        textPdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: [TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT],
          compress: true
        });
      } else {
        // SOFT COPY: Always use the Inner Page cropped dimensions as the uniform PDF page size
        softPdf = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: [988.46, 488.46],
          compress: true
        });
      }

      // ── Embed a real TTF font so printer pre-flight checks pass ──
      // Determine the cover's background color to paint the bleed and spine (Hard Copy only)
      let coverBg = '#ffffff';
      if (spreads.length > 0 && spreads[0].rightPage?.background) {
        coverBg = spreads[0].rightPage.background;
      }
      
      if (isHardCopy && coverPdf && textPdf) {
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 255, g: 255, b: 255 };
        };
        const bgRgb = hexToRgb(coverBg.startsWith('#') ? coverBg : '#ffffff');
        
        coverPdf.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
        coverPdf.rect(0, 0, COVER_WIDTH, COVER_HEIGHT, 'F');
      }

      const embedFontIntoPdf = async (doc: InstanceType<typeof jsPDF> | null) => {
        if (!doc) return;
        try {
          // Use API route — server reads the file and returns clean base64 (no browser binary conversion)
          const fontRes = await fetch('/api/font-embed');
          if (!fontRes.ok) return;
          const { fontBase64 } = await fontRes.json();
          if (!fontBase64) return;
          doc.addFileToVFS('EmbedFont.ttf', fontBase64);
          doc.addFont('EmbedFont.ttf', 'EmbedFont', 'normal');
          doc.setFont('EmbedFont');
          doc.setFontSize(0.1);
          doc.setTextColor(255, 255, 255);
          doc.text('.', 0, 0);
          console.log('[PDF] Font embedded successfully');
        } catch (e) {
          console.warn('[PDF] Font embedding skipped:', e);
        }
      };

      if (isHardCopy) {
        await embedFontIntoPdf(coverPdf);
        await embedFontIntoPdf(textPdf);
      } else {
        await embedFontIntoPdf(softPdf);
      }

      // Title page: Generated ONLY for USER hard copy purchases, NOT admin PDF downloads.
      // Admin downloads must be clean print-ready files.
      const isAdminDownload = get().isAdmin;
      if (!isAdminDownload && isHardCopy && textPdf && (pdfType === 'inner' || pdfType === 'both')) {
        try {
          const titleCanvas = document.createElement('canvas');
          const PIXEL_RATIO = 5;
          titleCanvas.width = TEXT_PAGE_WIDTH * PIXEL_RATIO;
          titleCanvas.height = TEXT_PAGE_HEIGHT * PIXEL_RATIO;
          const ctx = titleCanvas.getContext('2d');
          if (ctx) {
            ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = coverBg.startsWith('#') ? coverBg : '#b5251a';
            ctx.font = '70px "Luckiest Guy", cursive';
            ctx.fillText('DEAR BACCHANAL', TEXT_PAGE_WIDTH / 2, TEXT_PAGE_HEIGHT / 2 - 40);
            ctx.fillStyle = '#666666';
            ctx.font = 'italic 35px "Caveat", cursive';
            ctx.fillText('Trinidad Carnival 2026', TEXT_PAGE_WIDTH / 2, TEXT_PAGE_HEIGHT / 2 + 60);
            const titleDataUrl = titleCanvas.toDataURL('image/jpeg', 0.92);
            textPdf.addImage(titleDataUrl, 'JPEG', 0, 0, TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT);
          }
        } catch (e) {
          console.error('Failed to generate title page', e);
        }
      }

      // ── Compute per-mode totals for accurate progress display ──
      // Cover = 1 page. Inner = all spreads minus cover spread.
      const coverTotal = 1;
      const innerTotal = Math.max(1, spreads.length - 1);
      const softTotal  = spreads.length; // cover + all inner in one PDF

      // Which pages does this export include?
      const exportingCover = pdfType === 'cover' || pdfType === 'both' || !isHardCopy;
      const exportingInner = pdfType === 'inner' || pdfType === 'both' || !isHardCopy;

      const totalForProgress =
        pdfType === 'cover' ? coverTotal :
        pdfType === 'inner' ? innerTotal :
        !isHardCopy         ? softTotal  : // soft copy = all pages
        /* both */            spreads.length;

      toast.info(
        pdfType === 'cover' ? `Generating Cover PDF (1 page)...` :
        pdfType === 'inner' ? `Generating Inner Pages PDF (${innerTotal} pages)...` :
        `Generating PDFs — ${spreads.length} spreads...`,
        { duration: 3000 }
      );

      set({
        pdfGenerationProgress: {
          current: 0,
          total: totalForProgress,
          status: 'Preparing pages...',
          isSoftCopy: !isHardCopy,
          pdfType,
          coverCurrent: 0,
          coverTotal,
          innerCurrent: 0,
          innerTotal,
        }
      });

      // Track relative (1-based) page numbers within each section
      let coverPageNum = 0;
      let innerPageNum = 0;

      for (let i = 0; i < spreads.length; i++) {
        if (pdfType === 'inner' && i === 0) continue; // skip cover for inner-only export
        if (pdfType === 'cover' && i > 0) break;      // only cover spread


        // Compute relative page numbers for progress display
        if (i === 0) {
          coverPageNum = 1;
        } else {
          innerPageNum = i; // spread index 1..N → inner page 1..N-1
        }

        // What is the "current page" number in the context of this specific export?
        const relCurrent = pdfType === 'cover' ? coverPageNum :
                           pdfType === 'inner' ? innerPageNum :
                           !isHardCopy         ? i + 1 :       // soft: all pages in order
                           /* both */            i + 1;

        const relTotal = pdfType === 'cover' ? coverTotal :
                         pdfType === 'inner' ? innerTotal :
                         !isHardCopy         ? softTotal  :
                         /* both */            spreads.length;

        const pageLabel = !isHardCopy 
          ? `page ${relCurrent} of ${relTotal}` 
          : (i === 0 ? 'Cover' : `Inner page ${innerPageNum} of ${innerTotal}`);
          
        const toastLabel = !isHardCopy
          ? `Rendering page ${relCurrent} of ${relTotal}...`
          : pdfType === 'cover'
          ? `Rendering cover (1 of 1)...`
          : pdfType === 'inner'
          ? `Rendering inner page ${innerPageNum} of ${innerTotal}...`
          : i === 0
          ? `Rendering cover (1 of 1)...`
          : `Rendering inner page ${innerPageNum} of ${innerTotal}...`;

        set({
          pdfGenerationProgress: {
            ...get().pdfGenerationProgress!,
            current: relCurrent - 1,
            status: `Preparing ${pageLabel}...`,
            coverCurrent: i === 0 ? 0 : coverPageNum,
            innerCurrent: i > 0 ? innerPageNum - 1 : 0,
          }
        });
        toast.info(toastLabel, { duration: 2000, id: 'pdf-progress' });

        setCurrentSpread(i, true);

        // Preload all image assets directly from the spread data model
        // This ensures they are fully cached before we even ask Konva to render them
        const spread = spreads[i];
        const urlsToPreload: string[] = [];
        
        const isValidUrl = (url?: string) => url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:'));
        const extractUrls = (page: BookPage | null) => {
          if (!page) return;
          if (isValidUrl(page.background)) urlsToPreload.push(page.background!);
          page.elements.forEach(el => {
            if (isValidUrl(el.src)) urlsToPreload.push(el.src!);
          });
        };
        
        extractUrls(spread.leftPage);
        extractUrls(spread.rightPage);

        const preloadPromises = urlsToPreload.map(url => new Promise<void>(resolve => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          const onDone = () => resolve();
          img.onload = onDone;
          img.onerror = onDone;
          img.src = url;
          setTimeout(onDone, 15000); // 15s timeout
        }));

        if (preloadPromises.length > 0) {
           await Promise.all(preloadPromises);
        }

        // Wait for React to mount components and images to start loading
        // 800ms gives React enough time to flush the new spread nodes into the Konva Stage
        // before we query them for loading completion.
        await new Promise(resolve => setTimeout(resolve, 800));

        // 2. Re-fetch stageRef from store (it updates when canvas re-renders)
        const currentStageRef = get().stageRef;
        if (!currentStageRef) {
          console.warn(`stageRef lost on spread ${i}, skipping...`);
          continue;
        }

        // 3. Force a full redraw
        currentStageRef.batchDraw();

        const exportBg = new Konva.Rect({
          x: -100,
          y: -100,
          width: PAGE_WIDTH * 2 + 200,
          height: PAGE_HEIGHT + 200,
          fill: 'white',
          listening: false
        });

        const layers = currentStageRef.getLayers();
        if (layers.length > 0) {
          const firstLayer = layers[0];
          firstLayer.add(exportBg);
          exportBg.moveToBottom();

          // 4. DEEP-WAIT FOR ALL ASSETS
          // Wait for web fonts
          await document.fonts.ready;

          // Find all image/pattern nodes and wait for them
          const allNodes = currentStageRef.find('Image, Rect, Text, Group');
          const loadPromises: Promise<void>[] = [];

          allNodes.forEach((node: any) => {
            // Standard Image nodes (photos, stickers)
            if (node.getClassName() === 'Image') {
              const img = node.image();
              if (img instanceof HTMLImageElement) {
                if (!img.complete || img.naturalWidth === 0) {
                  loadPromises.push(new Promise<void>(resolve => {
                    const onDone = () => resolve();
                    img.addEventListener('load', onDone, { once: true });
                    img.addEventListener('error', onDone, { once: true });
                    setTimeout(onDone, 15000); // 15s max per asset
                  }));
                }
              }
            }
            // Background pattern images in Rects
            if (node.getClassName() === 'Rect') {
              const patternImg = (node as Konva.Rect).fillPatternImage();
              if (patternImg instanceof HTMLImageElement) {
                if (!patternImg.complete || patternImg.naturalWidth === 0) {
                  loadPromises.push(new Promise<void>(resolve => {
                    const onDone = () => resolve();
                    patternImg.addEventListener('load', onDone, { once: true });
                    patternImg.addEventListener('error', onDone, { once: true });
                    setTimeout(onDone, 15000);
                  }));
                }
              }
            }
          });

          if (loadPromises.length > 0) {
            toast.info(`Waiting for ${loadPromises.length} assets on spread ${i + 1}...`, { duration: 2000, id: 'pdf-progress' });
            await Promise.all(loadPromises);
          }

          // 5. Extra settling time for SVG renders, complex stickers, etc.
          await new Promise(r => setTimeout(r, 400));

          // 6. Final redraw after everything is loaded
          currentStageRef.batchDraw();
          await new Promise(r => setTimeout(r, 50)); // Let the draw flush

          // 7. Capture high-quality snapshot for the ENTIRE continuous spread (Left + Right, gap is removed in UI)
          set({
            pdfGenerationProgress: {
              ...get().pdfGenerationProgress!,
              current: relCurrent,
              status: `Finalizing ${pageLabel}...`,
              coverCurrent: i === 0 ? 1 : coverPageNum,
              innerCurrent: i > 0 ? innerPageNum : 0,
            }
          });

          // Clean up the white background
          exportBg.destroy();

          // ─── FIX: Temporarily set stage to 1:1 scale for pixel-perfect capture ───
          // When scale < 1 (canvas fits on screen), the stage canvas is physically
          // smaller than PAGE_WIDTH*2 × PAGE_HEIGHT. toDataURL works in pixel coords,
          // so anything beyond the canvas bounds renders as black.
          // Setting to natural size ensures the full spread is captured with no black areas.
          const originalScaleX = currentStageRef.scaleX();
          const originalScaleY = currentStageRef.scaleY();
          const originalWidth  = currentStageRef.width();
          const originalHeight = currentStageRef.height();

          currentStageRef.scaleX(1);
          currentStageRef.scaleY(1);
          currentStageRef.width(PAGE_WIDTH * 2);
          currentStageRef.height(PAGE_HEIGHT);
          currentStageRef.batchDraw();
          await new Promise(r => setTimeout(r, 150)); // Allow redraw to flush

          currentStageRef.batchDraw();

          if (!isHardCopy && softPdf) {
            // SOFT COPY - Unified Document, exact canvas size without bleed cropping
            let cropX = 0, cropY = 0, cropW = PAGE_WIDTH * 2, cropH = PAGE_HEIGHT;
            
            if (i === 0) {
              // Cover: crop out 20mm bleed (35.08px x, 33.33px y)
              cropX = 35.08;
              cropY = 33.33;
              cropW = (PAGE_WIDTH * 2) - 35.08 - 35.08;
              cropH = PAGE_HEIGHT - 33.33 - 33.33;
            } else {
              // Inner pages: crop out 3mm bleed (5.77px)
              cropX = 5.77;
              cropY = 5.77;
              cropW = (PAGE_WIDTH * 2) - 5.77 - 5.77;
              cropH = PAGE_HEIGHT - 5.77 - 5.77;
            }

            const spreadDataUrl = currentStageRef.toDataURL({
              x: cropX, y: cropY, width: cropW, height: cropH,
              pixelRatio: 5, mimeType: "image/jpeg", quality: 0.92
            });
            const isFirstIteration = (pdfType === 'inner') ? (i === 1) : (i === 0);
            if (!isFirstIteration) {
              softPdf.addPage([988.46, 488.46], "landscape");
            }
            // Force the cropped image to scale and perfectly fill the uniform PDF page dimensions
            softPdf.addImage(spreadDataUrl, 'JPEG', 0, 0, 988.46, 488.46);
          } else if (isHardCopy && coverPdf && textPdf) {
            // HARD COPY - Strict layout for Pureprint factory requirements
            if (i === 0) {
              // Spread 0 is the Cover.
              const spreadDataUrl = currentStageRef.toDataURL({
                x: 0, y: 0, width: PAGE_WIDTH * 2, height: PAGE_HEIGHT,
                pixelRatio: 5, mimeType: "image/jpeg", quality: 0.92
              });
              coverPdf.addImage(spreadDataUrl, 'JPEG', 0, 0, COVER_WIDTH, COVER_HEIGHT);
            } else {
              // INNER PAGES (Spreads 1..N) - Output as single 260x260mm pages with 3mm bleed borrowing
              const bleedPx = 5.77;

              // Left Page
              const leftDataUrl = currentStageRef.toDataURL({
                x: 0,
                y: 0,
                width: PAGE_WIDTH + bleedPx,
                height: PAGE_HEIGHT,
                pixelRatio: 5,
                mimeType: "image/jpeg",
                quality: 0.92
              });
              textPdf.addPage([TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT], "portrait");
              textPdf.addImage(leftDataUrl, 'JPEG', 0, 0, TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT);

              // Right Page
              const rightDataUrl = currentStageRef.toDataURL({
                x: PAGE_WIDTH - bleedPx,
                y: 0,
                width: PAGE_WIDTH + bleedPx,
                height: PAGE_HEIGHT,
                pixelRatio: 5,
                mimeType: "image/jpeg",
                quality: 0.92
              });
              textPdf.addPage([TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT], "portrait");
              textPdf.addImage(rightDataUrl, 'JPEG', 0, 0, TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT);
            }
          }

          // ─── Restore stage to original display scale ───
          currentStageRef.scaleX(originalScaleX);
          currentStageRef.scaleY(originalScaleY);
          currentStageRef.width(originalWidth);
          currentStageRef.height(originalHeight);
          currentStageRef.batchDraw();
        }
      }

      // Add a final beautiful "The End" spread to ensure the back page of the book is clean
      // Add a final beautiful "The End" spread to ensure the back page of the book is clean (HARD COPY ONLY)
      if (isHardCopy && textPdf && (pdfType === 'inner' || pdfType === 'both')) {
        try {
          textPdf.addPage([TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT], "portrait");
          const endCanvas = document.createElement('canvas');
          const PIXEL_RATIO = 5;
          endCanvas.width = TEXT_PAGE_WIDTH * PIXEL_RATIO; 
          endCanvas.height = TEXT_PAGE_HEIGHT * PIXEL_RATIO;
          const ctx = endCanvas.getContext('2d');
          if (ctx) {
            ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT);
            
            // Draw subtle closing logo/text on the LEFT side of the final spread
            ctx.fillStyle = '#666666'; // Match Trinidad text color
            ctx.font = 'italic 24px "Caveat", cursive';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Created with Dear Bacchanal', TEXT_PAGE_WIDTH / 2, TEXT_PAGE_HEIGHT - 100);
            
            const endDataUrl = endCanvas.toDataURL('image/jpeg', 0.92);
            textPdf.addImage(endDataUrl, 'JPEG', 0, 0, TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT);
          }
        } catch(e) {}
      }

      const baseFileName = activeTemplateName?.replace(/\s+/g, '_') || 'Carnival_Book';

      // ── Post-process with pdf-lib to guarantee font embedding at binary level ──
      const embedFontWithPdfLib = async (inputBlob: Blob): Promise<Blob> => {
        try {
          if (!fontPreloadPromise) return inputBlob;
          const preloaded = await fontPreloadPromise;
          if (!preloaded) return inputBlob;
          
          const { pdfLibModule: { PDFDocument, rgb }, fontkitModule, fontBytes } = preloaded;

          const inputBytes = await inputBlob.arrayBuffer();
          const pdfDoc = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
          
          // Must register fontkit to embed custom TTF fonts
          const fontkit = fontkitModule.default || fontkitModule;
          pdfDoc.registerFontkit(fontkit);

          // Embed our custom TTF — this is a real embed, not a standard font reference
          const font = await pdfDoc.embedFont(fontBytes, { subset: false });
          // Draw a dot with standard opacity off-screen or tiny so strict parsers don't strip it
          const pages = pdfDoc.getPages();
          pages.forEach((page: any) => {
            page.drawText('.', {
              x: -50, y: -50, // Off-screen
              size: 12,
              font,
              color: rgb(0, 0, 0), // Solid black
            });
          });
          const pdfBytes = await pdfDoc.save();
          // Use ArrayBuffer to avoid TypeScript Uint8Array/BlobPart compat issue
          return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        } catch (e) {
          console.warn('[PDF] pdf-lib post-processing failed, using original:', e);
          return inputBlob;
        }
      };

      let coverBlob: Blob | null = null;
      let textBlob: Blob | null = null;
      let softBlob: Blob | null = null;

      if (isHardCopy && coverPdf && textPdf) {
        const rawCoverBlob = coverPdf.output('blob');
        const rawTextBlob = textPdf.output('blob');
        coverBlob = await embedFontWithPdfLib(rawCoverBlob);
        textBlob = await embedFontWithPdfLib(rawTextBlob);
        
        if (!coverBlob) coverBlob = rawCoverBlob;
        if (!textBlob) textBlob = rawTextBlob;

        // Note: We DO NOT trigger local downloads for Hard Copies. 
        // Hard copy files are massive and are strictly meant for the Pureprint factory,
        // so they are only uploaded directly to the S3 bucket in the background.
      } else if (!isHardCopy && softPdf) {
        // For soft copies, we DO NOT need to embed fonts for printer pre-flight checks!
        // This saves massive amounts of processing time at the end of the generation.
        softBlob = softPdf.output('blob');
        // Trigger Single Unified Download for Soft Copy (or specific Admin no-bleed export)
        const softBlobUrl = URL.createObjectURL(softBlob);
        const softLink = document.createElement('a');
        softLink.href = softBlobUrl;
        
        if (pdfType === 'cover') {
          softLink.download = `${baseFileName}_Cover_NoBleed.pdf`;
        } else if (pdfType === 'inner') {
          softLink.download = `${baseFileName}_Inner_NoBleed.pdf`;
        } else {
          softLink.download = `${baseFileName}_Digital_Book.pdf`;
        }
        
        document.body.appendChild(softLink);
        softLink.click();
        document.body.removeChild(softLink);
        setTimeout(() => URL.revokeObjectURL(softBlobUrl), 5000);
        
        toast.success("PDF downloaded successfully!", { duration: 5000 });
      }

      // ─── Upload to UploadThing so SiteFlow can fetch it (HARD COPY ONLY) ──────────
      if (isHardCopy && pdfType === 'both' && coverBlob && textBlob) {
        try {
          const { activeTemplateId: bookId, activeTemplateName: tmplName } = get();
          
          // Update the full-screen loading overlay text so the user knows why it's waiting
          set((state) => ({
            pdfGenerationProgress: state.pdfGenerationProgress 
              ? { ...state.pdfGenerationProgress, status: "Uploading Print Files to Factory..." }
              : null
          }));

          const coverPdfFile = new File([coverBlob], `${baseFileName}_Cover.pdf`, { type: "application/pdf" });
          const textPdfFile = new File([textBlob], `${baseFileName}_Text.pdf`, { type: "application/pdf" });

            // 1. Upload files DIRECTLY to UploadThing from the browser (bypasses Next.js 4.5MB body limit)
            const uploadResult = await uploadFiles("bookPdfUploader", {
              files: [coverPdfFile, textPdfFile]
            });

            if (uploadResult && uploadResult.length === 2) {
              const coverUrl = uploadResult.find(r => r.name.includes("_Cover"))?.url || uploadResult[0].url;
              const textUrl = uploadResult.find(r => r.name.includes("_Text"))?.url || uploadResult[1].url;

              // 2. Send the resulting URLs to the backend to save in the database
              const uploadResponse = await fetch("/api/editor/upload-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  coverUrl,
                  textUrl,
                  bookId,
                  templateName: tmplName
                }),
              });
              
              const data = await uploadResponse.json();
              
              if (data.success) {
                console.log("[editor] PDFs uploaded for SiteFlow!");
              toast.success("Print files securely uploaded to factory!", { duration: 5000 });
            } else {
              console.error("[editor] Failed to save URLs to DB:", data);
              toast.error("Failed to link print files to order. Please contact support.", { duration: 8000 });
            }
          } else {
            toast.error("File upload failed. Please contact support.", { duration: 8000 });
          }
        } catch (e: any) {
          console.error("[editor] Background PDF upload failed:", e);
          toast.error(`Upload error: ${e.message || "Network issue"}. Contact support.`, { duration: 8000 });
        }
      }

      // Consume purchase - MUST PAY AGAIN FOR NEXT DOWNLOAD
      try {
        await fetch("/api/auth/consume-purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          }
        });
      } catch (consumeError) {
        console.error("Failed to consume purchase:", consumeError);
      }
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      try {
        fetch('/api/log-error', {
          method: 'POST',
          body: JSON.stringify({ message: err?.message, stack: err?.stack, stringified: String(err) })
        });
      } catch(e){}
      toast.error("PDF generation failed. Please try again.");
    } finally {
      toast.dismiss('pdf-progress');
      toast.dismiss('pdf-start');
      set({ isGeneratingPdf: false });
      if (!keepOverlayOpen) {
        set({ pdfGenerationProgress: null });
      } else {
        set((state) => ({
          pdfGenerationProgress: state.pdfGenerationProgress
            ? { ...state.pdfGenerationProgress, current: state.pdfGenerationProgress.total + 1, status: "Complete! Redirecting..." }
            : null
        }));
      }

      // Restore selection and view mode
      setCurrentSpread(originalIndex, true);
      if (originalViewMode !== get().viewMode) {
        set({ viewMode: originalViewMode });
      }
    }
  },
}));

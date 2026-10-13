import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type Konva from "konva";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/uploadthing-client";
import { saveCleanPdfToCache, getCleanPdfFromCache } from "@/lib/pdf-cache";

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
  cropX?: number;
  cropY?: number;
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

  // Copy Selection & Book Preview
  selectedCopyType: 'soft' | 'hard';
  setSelectedCopyType: (type: 'soft' | 'hard') => void;
  isCopySelectionModalOpen: boolean;
  setIsCopySelectionModalOpen: (open: boolean) => void;
  isPreviewModalOpen: boolean;
  setIsPreviewModalOpen: (open: boolean) => void;
  previewSpreadCache: Record<number, { fingerprint: string; previewUrl: string; leftWatermarkedUrl?: string; rightWatermarkedUrl?: string }>;
  cleanSpreadCache: Record<number, { fingerprint: string; cleanUrl: string; leftCleanUrl?: string; rightCleanUrl?: string }>;
  isRenderingPreview: boolean;
  previewRenderProgress: { current: number; total: number; status: string } | null;
  renderBookPreview: (copyType?: 'soft' | 'hard', options?: { forceAll?: boolean; section?: 'all' | 'cover' | 'inner' }) => Promise<void>;

  // Post Payment Modal
  isPostPaymentModalOpen: boolean;
  postPaymentType: 'soft' | 'hard' | null;
  setPostPaymentModal: (open: boolean, type?: 'soft' | 'hard' | null) => void;

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
  moveElementToBack: (pageId: string, elementId: string) => void;
  moveElementToFront: (pageId: string, elementId: string) => void;
  selectElement: (elementId: string | null) => void;

  // User Images (Global state for preloading)
  userImages: { id: string; url: string }[];
  isFetchingImages: boolean;
  fetchUserImages: () => Promise<void>;
  addUserImage: (image: { id: string; url: string }) => void;
  removeUserImage: (imageId: string) => void;
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

  croppingElementId: string | null;
  setCroppingElement: (id: string | null) => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  isDirty: boolean;
  isSaving: boolean;
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
  generatePdfBook: (isHardCopy?: boolean, keepOverlayOpen?: boolean, pdfType?: 'cover' | 'inner' | 'both', downloadHardCopyLocally?: boolean) => Promise<void>;
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
  selectedCopyType: 'soft',
  setSelectedCopyType: (type) => set({ selectedCopyType: type }),
  isCopySelectionModalOpen: false,
  setIsCopySelectionModalOpen: (open) => set({ isCopySelectionModalOpen: open }),
  isPreviewModalOpen: false,
  setIsPreviewModalOpen: (open) => set({ isPreviewModalOpen: open }),
  previewSpreadCache: {},
  cleanSpreadCache: {},
  isRenderingPreview: false,
  previewRenderProgress: null,
  isPostPaymentModalOpen: false,
  postPaymentType: null,
  setPostPaymentModal: (open, type = null) => set({ isPostPaymentModalOpen: open, postPaymentType: type }),
  userImages: [],
  isFetchingImages: false,

  fetchUserImages: async () => {
    set({ isFetchingImages: true });
    try {
      const dbRes = await fetch("/api/book-images", { cache: "no-store" });
      let dbImages: {id: string, url: string}[] = [];
      if (dbRes.ok) {
        const data = await dbRes.json();
        if (data.images) {
          dbImages = Object.entries(data.images)
            .filter(([_, url]) => !(url as string).startsWith("blob:"))
            .map(([id, url]) => ({
              id,
              url: url as string,
            }));
        }
      }
      set({ userImages: dbImages });
    } catch (err) {
      console.error("Failed to fetch user images", err);
    } finally {
      set({ isFetchingImages: false });
    }
  },
  addUserImage: (image) => set((state) => ({ userImages: [image, ...state.userImages] })),
  removeUserImage: (imageId) => set((state) => ({ userImages: state.userImages.filter(img => img.id !== imageId) })),

  // History
  history: [],
  historyIndex: -1,
  version: 0,
  isDirty: false,
  isSaving: false,
  setDirty: (dirty) => set({ isDirty: dirty }),
  setStageRef: (ref) => set({ stageRef: ref }),
  setIsOrderModalOpen: (open) => set({ isOrderModalOpen: open }),
  setIsPageTransitioning: (isTransitioning) => set({ isPageTransitioning: isTransitioning }),
  croppingElementId: null,
  setCroppingElement: (id) => set({ croppingElementId: id }),

  // Navigation
  setCurrentSpread: (index, skipDirty) => set((s) => ({
    currentSpreadIndex: index,
    selectedElementId: null,
    croppingElementId: null,
    isDirty: skipDirty ? s.isDirty : true,
  })),
  nextSpread: () => {
    const { currentSpreadIndex, spreads } = get();
    if (currentSpreadIndex < spreads.length - 1) {
      set({ currentSpreadIndex: currentSpreadIndex + 1, selectedElementId: null, croppingElementId: null });
    }
  },
  prevSpread: () => {
    const { currentSpreadIndex } = get();
    if (currentSpreadIndex > 0) {
      set({ currentSpreadIndex: currentSpreadIndex - 1, selectedElementId: null, croppingElementId: null });
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

  moveElementToBack: (pageId, elementId) => {
    const state = get();
    state.pushHistory();
    set({
      spreads: state.spreads.map((spread) => {
        const moveBack = (elements: EditorElement[]) => {
          const idx = elements.findIndex(el => el.id === elementId);
          if (idx <= 0) return elements;
          const el = elements[idx];
          const newElements = [...elements];
          newElements.splice(idx, 1);
          newElements.unshift(el); // send to very beginning (bottom)
          return newElements;
        };
        return {
          ...spread,
          leftPage: spread.leftPage.id === pageId ? { ...spread.leftPage, elements: moveBack(spread.leftPage.elements) } : spread.leftPage,
          rightPage: spread.rightPage.id === pageId ? { ...spread.rightPage, elements: moveBack(spread.rightPage.elements) } : spread.rightPage,
        };
      }),
    });
  },

  moveElementToFront: (pageId, elementId) => {
    const state = get();
    state.pushHistory();
    set({
      spreads: state.spreads.map((spread) => {
        const moveFront = (elements: EditorElement[]) => {
          const idx = elements.findIndex(el => el.id === elementId);
          if (idx === -1 || idx === elements.length - 1) return elements;
          const el = elements[idx];
          const newElements = [...elements];
          newElements.splice(idx, 1);
          newElements.push(el); // send to very end (top)
          return newElements;
        };
        return {
          ...spread,
          leftPage: spread.leftPage.id === pageId ? { ...spread.leftPage, elements: moveFront(spread.leftPage.elements) } : spread.leftPage,
          rightPage: spread.rightPage.id === pageId ? { ...spread.rightPage, elements: moveFront(spread.rightPage.elements) } : spread.rightPage,
        };
      }),
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
    if (get().isSaving) return false;
    const { spreads, isAdmin, activeTemplateId, activeTemplateName, templateDescription, templateCountry, templateYear, currentSpreadIndex, version: startVersion } = get();

    set({ isSaving: true });
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
    } finally {
      set({ isSaving: false });
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
      spreads: state.spreads,
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
      spreads: entry.spreads,
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
      spreads: entry.spreads,
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
  generatePdfBook: async (isHardCopy = false, keepOverlayOpen = false, pdfType: 'cover' | 'inner' | 'both' = 'both', downloadHardCopyLocally = false) => {
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

    const bookId = state.activeTemplateId || 'current_book';
    const baseFileName = activeTemplateName ? activeTemplateName.replace(/[^a-zA-Z0-9_-]/g, "_") : "Dear_Bacchanal_Book";

    // ── Instant Delivery / Upload from IndexedDB Cache (0s Canvas Re-render!) ──
    try {
      const cachedCleanPdfs = await getCleanPdfFromCache(bookId);

      if (!isHardCopy && cachedCleanPdfs?.softPdfBlob) {
        const softBlobUrl = URL.createObjectURL(cachedCleanPdfs.softPdfBlob);
        const softLink = document.createElement('a');
        softLink.href = softBlobUrl;
        softLink.download = `${baseFileName}_Soft_Copy_NoBleed.pdf`;
        document.body.appendChild(softLink);
        softLink.click();
        document.body.removeChild(softLink);
        setTimeout(() => URL.revokeObjectURL(softBlobUrl), 5000);

        toast.success("PDF downloaded successfully!", { duration: 5000 });

        // Background cloud backup for orders
        try {
          const softFile = new File([cachedCleanPdfs.softPdfBlob], `${baseFileName}_Soft.pdf`, { type: "application/pdf" });
          const uploadRes = await uploadFiles("bookPdfUploader", { files: [softFile] });
          if (uploadRes && uploadRes.length > 0) {
            await fetch("/api/editor/upload-pdf", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                softUrl: uploadRes[0].url,
                bookId,
                templateName: activeTemplateName,
              }),
            });
          }
        } catch (e) {
          console.warn("[editor] Background soft copy cloud backup failed:", e);
        }

        set({ isGeneratingPdf: false, pdfGenerationProgress: null });
        return;
      }
    } catch (cacheErr) {
      console.warn("[editor] IndexedDB cache check skipped:", cacheErr);
    }

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

      // Title page: Generated for hard copy exports so the printed book has the title spread.
      if (isHardCopy && textPdf && (pdfType === 'inner' || pdfType === 'both')) {
        try {
          const titleCanvas = document.createElement('canvas');
          const PIXEL_RATIO = 6.25;
          titleCanvas.width = TEXT_PAGE_WIDTH * PIXEL_RATIO;
          titleCanvas.height = TEXT_PAGE_HEIGHT * PIXEL_RATIO;
          const ctx = titleCanvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
            // Fill this page with solid color #a02e2d
            const pageColor = '#a02e2d';
            ctx.fillStyle = pageColor;
            ctx.fillRect(0, 0, TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT);

            /*
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
            */
            const titleDataUrl = titleCanvas.toDataURL('image/jpeg', 0.98);
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
      const softTotal = spreads.length; // cover + all inner in one PDF

      // Which pages does this export include?
      const exportingCover = pdfType === 'cover' || pdfType === 'both' || !isHardCopy;
      const exportingInner = pdfType === 'inner' || pdfType === 'both' || !isHardCopy;

      const totalForProgress =
        pdfType === 'cover' ? coverTotal :
          pdfType === 'inner' ? innerTotal :
            !isHardCopy ? softTotal : // soft copy = all pages
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
            !isHardCopy ? i + 1 :       // soft: all pages in order
                           /* both */            i + 1;

        const relTotal = pdfType === 'cover' ? coverTotal :
          pdfType === 'inner' ? innerTotal :
            !isHardCopy ? softTotal :
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
            coverCurrent: i === 0 ? 0.5 : 1,
            coverTotal: 1,
            innerCurrent: i > 0 ? innerPageNum : 0,
            innerTotal: innerTotal,
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

        // Dynamic import — reuses the same Konva instance already loaded by EditorCanvas
        const KonvaLib = (await import("konva")).default;
        const exportBg = new KonvaLib.Rect({
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
              const patternImg = (node as any).fillPatternImage();
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
          const originalWidth = currentStageRef.width();
          const originalHeight = currentStageRef.height();

          currentStageRef.scaleX(1);
          currentStageRef.scaleY(1);
          currentStageRef.width(PAGE_WIDTH * 2);
          currentStageRef.height(PAGE_HEIGHT);
          currentStageRef.batchDraw();
          await new Promise(r => setTimeout(r, 150)); // Allow redraw to flush

          // Ensure high-quality image smoothing on all Konva layers for pristine render
          try {
            currentStageRef.getLayers().forEach((layer: any) => {
              const canvas = layer.getCanvas();
              const ctx = canvas?._canvas?.getContext?.('2d') || canvas?.getContext?.('2d');
              if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
              }
            });
          } catch (e) {
            // Ignore if layer context cannot be modified directly
          }

          currentStageRef.batchDraw();

          // 300+ DPI Commercial Print settings (PurePrint HP Indigo press standard)
          // PAGE_WIDTH (500) * 6.25 = 3125px -> 305.3 DPI on 260mm (10.24") inner page
          // PAGE_WIDTH*2 (1000) * 6.25 = 6250px -> 280+ DPI on 570mm cover spread
          const PRINT_PIXEL_RATIO = 6.25;
          const PRINT_JPEG_QUALITY = 0.98; // Highest fidelity, zero DCT compression grain

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
              pixelRatio: 4, mimeType: "image/jpeg", quality: 0.95
            });
            const isFirstIteration = (pdfType === 'inner') ? (i === 1) : (i === 0);
            if (!isFirstIteration) {
              softPdf.addPage([988.46, 488.46], "landscape");
            }
            // Force the cropped image to scale and perfectly fill the uniform PDF page dimensions
            softPdf.addImage(spreadDataUrl, 'JPEG', 0, 0, 988.46, 488.46);
          } else if (isHardCopy && coverPdf && textPdf) {
            // HARD COPY - Strict layout for Pureprint factory requirements (300+ DPI, zero grain)
            if (i === 0) {
              // Spread 0 is the Cover.
              const spreadDataUrl = currentStageRef.toDataURL({
                x: 0, y: 0, width: PAGE_WIDTH * 2, height: PAGE_HEIGHT,
                pixelRatio: PRINT_PIXEL_RATIO, mimeType: "image/jpeg", quality: PRINT_JPEG_QUALITY
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
                pixelRatio: PRINT_PIXEL_RATIO,
                mimeType: "image/jpeg",
                quality: PRINT_JPEG_QUALITY
              });
              textPdf.addPage([TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT], "portrait");
              textPdf.addImage(leftDataUrl, 'JPEG', 0, 0, TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT);

              // Right Page
              const rightDataUrl = currentStageRef.toDataURL({
                x: PAGE_WIDTH - bleedPx,
                y: 0,
                width: PAGE_WIDTH + bleedPx,
                height: PAGE_HEIGHT,
                pixelRatio: PRINT_PIXEL_RATIO,
                mimeType: "image/jpeg",
                quality: PRINT_JPEG_QUALITY
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
          const PIXEL_RATIO = 6.25;
          endCanvas.width = TEXT_PAGE_WIDTH * PIXEL_RATIO;
          endCanvas.height = TEXT_PAGE_HEIGHT * PIXEL_RATIO;
          const ctx = endCanvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
            // Fill this page with solid color #a02e2d
            const pageColor = '#a02e2d';
            ctx.fillStyle = pageColor;
            ctx.fillRect(0, 0, TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT);

            /*
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT);

            // Draw subtle closing logo/text on the LEFT side of the final spread
            ctx.fillStyle = '#666666'; // Match Trinidad text color
            ctx.font = 'italic 24px "Caveat", cursive';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Created with Dear Bacchanal', TEXT_PAGE_WIDTH / 2, TEXT_PAGE_HEIGHT - 100);
            */

            const endDataUrl = endCanvas.toDataURL('image/jpeg', 0.98);
            textPdf.addImage(endDataUrl, 'JPEG', 0, 0, TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT);
          }
        } catch (e) { }
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
        if (pdfType === 'cover' || pdfType === 'both') {
          const rawCoverBlob = coverPdf.output('blob');
          coverBlob = await embedFontWithPdfLib(rawCoverBlob);
          if (!coverBlob) coverBlob = rawCoverBlob;
        }

        if (pdfType === 'inner' || pdfType === 'both') {
          const rawTextBlob = textPdf.output('blob');
          textBlob = await embedFontWithPdfLib(rawTextBlob);
          if (!textBlob) textBlob = rawTextBlob;
        }

        // Local downloads for Hard Copies (when admin tests or local download is requested)
        const shouldDownloadLocally = downloadHardCopyLocally || get().isAdmin;
        if (shouldDownloadLocally) {
          if (coverBlob && (pdfType === 'cover' || pdfType === 'both')) {
            const coverBlobUrl = URL.createObjectURL(coverBlob);
            const coverLink = document.createElement('a');
            coverLink.href = coverBlobUrl;
            coverLink.download = `${baseFileName}_HardCopy_Cover.pdf`;
            document.body.appendChild(coverLink);
            coverLink.click();
            document.body.removeChild(coverLink);
            setTimeout(() => URL.revokeObjectURL(coverBlobUrl), 5000);
          }

          if (textBlob && (pdfType === 'inner' || pdfType === 'both')) {
            const delay = (pdfType === 'both' && coverBlob) ? 800 : 0;
            setTimeout(() => {
              const textBlobUrl = URL.createObjectURL(textBlob!);
              const textLink = document.createElement('a');
              textLink.href = textBlobUrl;
              textLink.download = `${baseFileName}_HardCopy_Inner_Pages.pdf`;
              document.body.appendChild(textLink);
              textLink.click();
              document.body.removeChild(textLink);
              setTimeout(() => URL.revokeObjectURL(textBlobUrl), 5000);
            }, delay);
          }

          toast.success(
            pdfType === 'cover' ? "Hard Copy Cover PDF downloaded!" :
            pdfType === 'inner' ? "Hard Copy Inner Pages PDF downloaded!" :
            "Hard Copy Cover and Inner Pages PDFs downloaded!",
            { duration: 5000 }
          );
        }
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
          softLink.download = `${baseFileName}_Soft_Copy_NoBleed.pdf`;
        }

        document.body.appendChild(softLink);
        softLink.click();
        document.body.removeChild(softLink);
        setTimeout(() => URL.revokeObjectURL(softBlobUrl), 5000);

        toast.success("PDF downloaded successfully!", { duration: 5000 });

        // Background upload soft copy to UploadThing so URL is saved in database & admin orders
        try {
          const { activeTemplateId: bookId, activeTemplateName: tmplName } = get();
          const softPdfFile = new File([softBlob], `${baseFileName}_Digital.pdf`, { type: "application/pdf" });
          const uploadRes = await uploadFiles("bookPdfUploader", { files: [softPdfFile] });
          if (uploadRes && uploadRes.length > 0) {
            await fetch("/api/editor/upload-pdf", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                softUrl: uploadRes[0].url,
                bookId,
                templateName: tmplName,
              }),
            });
            console.log("[editor] Soft copy digital PDF uploaded to cloud:", uploadRes[0].url);
          }
        } catch (e) {
          console.warn("[editor] Soft copy cloud upload failed:", e);
        }
      }

      // ─── Upload to UploadThing so SiteFlow can fetch it (HARD COPY ONLY FOR REAL CUSTOMER PURCHASES) ──────────
      const isRealCustomerOrder = !downloadHardCopyLocally && !get().isAdmin;
      if (isRealCustomerOrder && isHardCopy && pdfType === 'both' && coverBlob && textBlob) {
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

      // Consume purchase - ONLY FOR REAL CUSTOMER PURCHASES
      if (isRealCustomerOrder) {
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
      }
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      try {
        fetch('/api/log-error', {
          method: 'POST',
          body: JSON.stringify({ message: err?.message, stack: err?.stack, stringified: String(err) })
        });
      } catch (e) { }
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

  renderBookPreview: async (copyType?: 'soft' | 'hard', options?: { forceAll?: boolean; section?: 'all' | 'cover' | 'inner' }) => {
    const state = get();
    const { spreads, setCurrentSpread, selectElement } = state;
    const targetType = copyType || state.selectedCopyType || 'soft';
    set({ selectedCopyType: targetType });

    if (spreads.length === 0) {
      toast.error("No pages to preview.");
      return;
    }

    const stage = get().stageRef;
    if (!stage) {
      toast.error("Canvas is initializing. Please wait a moment and try again.");
      return;
    }

    // Deselect active element so bounding box isn't rendered
    selectElement(null);

    const bookId = state.activeTemplateId || 'current_book';

    // Compute deterministic fingerprint of a spread to know if it actually changed
    const computeSpreadFingerprint = (spread: BookSpread) => {
      return JSON.stringify({
        v: `small_wm_v2_${targetType}`,
        lBg: spread.leftPage?.background,
        rBg: spread.rightPage?.background,
        lEl: spread.leftPage?.elements?.map(e => ({
          id: e.id,
          type: e.type,
          x: e.x,
          y: e.y,
          w: e.width,
          h: e.height,
          r: e.rotation,
          src: e.src,
          text: (e as any).text,
          fill: (e as any).fill || (e as any).color,
          fontSize: (e as any).fontSize,
          fontFamily: (e as any).fontFamily,
        })),
        rEl: spread.rightPage?.elements?.map(e => ({
          id: e.id,
          type: e.type,
          x: e.x,
          y: e.y,
          w: e.width,
          h: e.height,
          r: e.rotation,
          src: e.src,
          text: (e as any).text,
          fill: (e as any).fill || (e as any).color,
          fontSize: (e as any).fontSize,
          fontFamily: (e as any).fontFamily,
        })),
      });
    };

    const currentCache = { ...get().previewSpreadCache };
    const currentCleanCache = { ...get().cleanSpreadCache };
    let dirtyIndices: number[] = [];

    if (options?.forceAll) {
      if (targetType === 'soft' || options.section === 'all' || !options.section) {
        dirtyIndices = spreads.map((_, i) => i);
      } else if (options.section === 'cover') {
        dirtyIndices = [0];
      } else if (options.section === 'inner') {
        dirtyIndices = spreads.slice(1).map((_, i) => i + 1);
      }
      dirtyIndices.forEach(idx => {
        delete currentCache[idx];
        delete currentCleanCache[idx];
      });
    } else {
      spreads.forEach((spread, idx) => {
        const fp = computeSpreadFingerprint(spread);
        if (!currentCache[idx] || currentCache[idx].fingerprint !== fp || !currentCleanCache[idx]) {
          dirtyIndices.push(idx);
        }
      });

      // Check if clean PDF already exists in IndexedDB
      const existingCachedPdf = await getCleanPdfFromCache(bookId);

      // If zero spreads changed and clean PDF exists in cache, show preview IMMEDIATELY (0ms)!
      if (dirtyIndices.length === 0 && Object.keys(currentCache).length >= spreads.length && existingCachedPdf) {
        set({ isPreviewModalOpen: true });
        return;
      }
    }

    const pdfTypeMode: 'cover' | 'inner' | 'both' =
      targetType === 'soft' ? 'both' :
      options?.section === 'cover' ? 'cover' :
      options?.section === 'inner' ? 'inner' : 'both';

    set({
      isPreviewModalOpen: false,
      isGeneratingPdf: true,
      isRenderingPreview: true,
      pdfGenerationProgress: {
        current: 0,
        total: dirtyIndices.length,
        status: targetType === 'soft'
          ? "Preparing Digital PDF Generation..."
          : options?.section === 'cover'
            ? "Preparing Hardcover Cover Jacket (570×300mm)..."
            : options?.section === 'inner'
              ? "Preparing Hardcover Inner Signatures (260×260mm)..."
              : "Preparing Hardcover Print Generation...",
        isSoftCopy: targetType === 'soft',
        pdfType: pdfTypeMode,
        coverCurrent: pdfTypeMode === 'inner' ? 1 : 0,
        coverTotal: 1,
        innerCurrent: 0,
        innerTotal: Math.max(1, pdfTypeMode === 'inner' ? dirtyIndices.length : (spreads.length - 1)),
      },
      previewRenderProgress: {
        current: 0,
        total: dirtyIndices.length,
        status: `Preparing preview... (0/${dirtyIndices.length})`,
      },
    });

    const originalIndex = state.currentSpreadIndex;
    const originalViewMode = state.viewMode;

    // Ensure spread view mode for 2-page capture
    if (originalViewMode === 'single') {
      set({ viewMode: 'spread' });
      await new Promise(r => setTimeout(r, 400));
    }

    const PAGE_WIDTH = 500;
    const PAGE_HEIGHT = 500;
    const CAPTURE_PIXEL_RATIO = 4; // Ultra-crisp 4000x2000 resolution (identical to 10MB admin export)

    try {
      for (let d = 0; d < dirtyIndices.length; d++) {
        const spreadIdx = dirtyIndices[d];
        const spread = spreads[spreadIdx];

        const hasCoverInQueue = dirtyIndices.includes(0);
        const isCoverFinished = !hasCoverInQueue || (hasCoverInQueue && spreadIdx > 0);
        const isCoverActive = spreadIdx === 0;

        set({
          pdfGenerationProgress: {
            current: d + 1,
            total: dirtyIndices.length,
            status: spreadIdx === 0
              ? (targetType === 'soft' ? 'Rendering Digital Cover Spread...' : 'Rendering 570mm Hardcover Wrap Jacket...')
              : `Rendering Inner Signature Spread ${spreadIdx} of ${spreads.length - 1}...`,
            isSoftCopy: targetType === 'soft',
            pdfType: pdfTypeMode,
            coverCurrent: isCoverFinished ? 1 : (isCoverActive ? 0.5 : 0),
            coverTotal: 1,
            innerCurrent: spreadIdx > 0 ? (pdfTypeMode === 'inner' ? d + 1 : spreadIdx) : 0,
            innerTotal: Math.max(1, pdfTypeMode === 'inner' ? dirtyIndices.length : (spreads.length - 1)),
          },
          previewRenderProgress: {
            current: d + 1,
            total: dirtyIndices.length,
            status: spreadIdx === 0
              ? (targetType === 'soft' ? 'Rendering Digital Cover Spread...' : 'Rendering 570mm Hardcover Wrap Jacket...')
              : `Rendering Inner Signature Spread ${spreadIdx} of ${spreads.length - 1}...`,
          },
        });

        setCurrentSpread(spreadIdx, true);

        // Preload any remote images in this spread
        const urlsToPreload: string[] = [];
        const isValidUrl = (url?: string) => url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:'));
        [spread.leftPage, spread.rightPage].forEach(page => {
          if (!page) return;
          if (isValidUrl(page.background)) urlsToPreload.push(page.background!);
          page.elements.forEach(el => {
            if (isValidUrl(el.src)) urlsToPreload.push(el.src!);
          });
        });

        if (urlsToPreload.length > 0) {
          await Promise.all(urlsToPreload.map(url => new Promise<void>(resolve => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = url;
            setTimeout(resolve, 8000);
          })));
        }

        // Wait for React Konva DOM to flush
        await new Promise(r => setTimeout(r, 450));

        const curStage = get().stageRef;
        if (!curStage) continue;

        curStage.batchDraw();
        await document.fonts.ready;
        await new Promise(r => setTimeout(r, 150));

        // Temporarily set stage to 1:1 scale for capture
        const origScaleX = curStage.scaleX();
        const origScaleY = curStage.scaleY();
        const origW = curStage.width();
        const origH = curStage.height();

        curStage.scaleX(1);
        curStage.scaleY(1);
        curStage.width(PAGE_WIDTH * 2);
        curStage.height(PAGE_HEIGHT);
        curStage.batchDraw();
        await new Promise(r => setTimeout(r, 100));

        // Exact PDF dimensions and bleed cropping
        let cropX = 0;
        let cropY = 0;
        let cropW = PAGE_WIDTH * 2;
        let cropH = PAGE_HEIGHT;

        if (targetType === 'soft') {
          // Soft Copy PDF exact dimensions: crop out 20mm bleed on cover, 3mm bleed on inner pages
          if (spreadIdx === 0) {
            cropX = 35.08;
            cropY = 33.33;
            cropW = (PAGE_WIDTH * 2) - 70.16;
            cropH = PAGE_HEIGHT - 66.66;
          } else {
            cropX = 5.77;
            cropY = 5.77;
            cropW = (PAGE_WIDTH * 2) - 11.54;
            cropH = PAGE_HEIGHT - 11.54;
          }
        }

        const cleanSpreadDataUrl = curStage.toDataURL({
          x: cropX,
          y: cropY,
          width: cropW,
          height: cropH,
          pixelRatio: CAPTURE_PIXEL_RATIO,
          mimeType: "image/jpeg",
          quality: 0.95,
        });

        // Restore original stage dimensions immediately
        curStage.scaleX(origScaleX);
        curStage.scaleY(origScaleY);
        curStage.width(origW);
        curStage.height(origH);
        curStage.batchDraw();

        // Save clean image in clean cache for PDF compilation
        const spreadFp = computeSpreadFingerprint(spread);
        currentCleanCache[spreadIdx] = {
          fingerprint: spreadFp,
          cleanUrl: cleanSpreadDataUrl,
        };

        // Load the clean image to bake rotated watermarks on offscreen canvas
        const img = new Image();
        img.src = cleanSpreadDataUrl;
        await new Promise(resolve => {
          img.onload = () => resolve(null);
          img.onerror = () => resolve(null);
        });

        const totalW = PAGE_WIDTH * 2 * CAPTURE_PIXEL_RATIO; // 2000
        const totalH = PAGE_HEIGHT * CAPTURE_PIXEL_RATIO;     // 1000
        const halfW = totalW / 2;                            // 1000

        const canvas = document.createElement("canvas");
        canvas.width = totalW;
        canvas.height = totalH;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0, totalW, totalH);

          // Watermark drawing helper: Applies small subtle rotated diagonal "PREVIEW" watermarks
          const applyPageWatermark = (startX: number, pWidth: number, pHeight: number) => {
            ctx.save();
            ctx.beginPath();
            ctx.rect(startX, 0, pWidth, pHeight);
            ctx.clip();

            // Repeating diagonal grid of subtle small PREVIEW text across the page
            ctx.save();
            ctx.translate(startX, 0);
            ctx.font = "bold 22px sans-serif";
            ctx.fillStyle = "rgba(255, 255, 255, 0.30)";
            ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
            ctx.lineWidth = 1.5;
            for (let y = -pHeight; y < pHeight * 2; y += 130) {
              for (let x = -pWidth; x < pWidth * 2; x += 200) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(-35 * Math.PI / 180);
                ctx.strokeText("PREVIEW", 0, 0);
                ctx.fillText("PREVIEW", 0, 0);
                ctx.restore();
              }
            }
            ctx.restore();

            ctx.restore();
          };

          // Apply rotated watermark on Left Page
          applyPageWatermark(0, halfW, totalH);
          // Apply rotated watermark on Right Page
          applyPageWatermark(halfW, halfW, totalH);

          const watermarkedSpreadUrl = canvas.toDataURL("image/jpeg", 0.9);

          // Separate Left Page slice
          const leftCanvas = document.createElement("canvas");
          leftCanvas.width = halfW;
          leftCanvas.height = totalH;
          const leftCtx = leftCanvas.getContext("2d");
          if (leftCtx) {
            leftCtx.drawImage(canvas, 0, 0, halfW, totalH, 0, 0, halfW, totalH);
          }
          const leftWatermarkedUrl = leftCanvas.toDataURL("image/jpeg", 0.9);

          // Separate Right Page slice
          const rightCanvas = document.createElement("canvas");
          rightCanvas.width = halfW;
          rightCanvas.height = totalH;
          const rightCtx = rightCanvas.getContext("2d");
          if (rightCtx) {
            rightCtx.drawImage(canvas, halfW, 0, halfW, totalH, 0, 0, halfW, totalH);
          }
          const rightWatermarkedUrl = rightCanvas.toDataURL("image/jpeg", 0.9);

          currentCache[spreadIdx] = {
            fingerprint: spreadFp,
            previewUrl: watermarkedSpreadUrl,
            leftWatermarkedUrl,
            rightWatermarkedUrl,
          };
        }
      }

      // ─── Compile Clean Production PDF to IndexedDB ───
      set({
        previewRenderProgress: {
          current: dirtyIndices.length,
          total: dirtyIndices.length,
          status: "Compiling production PDF...",
        },
      });

      const { jsPDF } = await import("jspdf");

      if (targetType === "soft") {
        const softPdf = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: [988.46, 488.46],
          compress: true,
        });

        for (let i = 0; i < spreads.length; i++) {
          const cleanItem = currentCleanCache[i];
          if (cleanItem?.cleanUrl) {
            if (i > 0) {
              softPdf.addPage([988.46, 488.46], "landscape");
            }
            softPdf.addImage(cleanItem.cleanUrl, "JPEG", 0, 0, 988.46, 488.46);
          }
        }

        const cleanSoftBlob = softPdf.output("blob");
        await saveCleanPdfToCache(bookId, {
          type: "soft",
          softPdfBlob: cleanSoftBlob,
        });
      } else {
        // Hard Copy compilation
        const COVER_WIDTH = 570 * 2.83465;
        const COVER_HEIGHT = 300 * 2.83465;
        const TEXT_PAGE_WIDTH = 260 * 2.83465;
        const TEXT_PAGE_HEIGHT = 260 * 2.83465;

        const coverPdf = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: [COVER_WIDTH, COVER_HEIGHT],
          compress: true,
        });

        const textPdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: [TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT],
          compress: true,
        });

        // Cover Spread (Spread 0)
        if (currentCleanCache[0]?.cleanUrl) {
          coverPdf.addImage(currentCleanCache[0].cleanUrl, "JPEG", 0, 0, COVER_WIDTH, COVER_HEIGHT);
        }

        // Inner Spreads (1..N)
        for (let i = 1; i < spreads.length; i++) {
          const cleanItem = currentCleanCache[i];
          if (cleanItem?.cleanUrl) {
            // Left page
            textPdf.addPage([TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT], "portrait");
            textPdf.addImage(cleanItem.cleanUrl, "JPEG", 0, 0, TEXT_PAGE_WIDTH * 2, TEXT_PAGE_HEIGHT);
            // Right page
            textPdf.addPage([TEXT_PAGE_WIDTH, TEXT_PAGE_HEIGHT], "portrait");
            textPdf.addImage(cleanItem.cleanUrl, "JPEG", -TEXT_PAGE_WIDTH, 0, TEXT_PAGE_WIDTH * 2, TEXT_PAGE_HEIGHT);
          }
        }

        const coverBlob = coverPdf.output("blob");
        const textBlob = textPdf.output("blob");

        await saveCleanPdfToCache(bookId, {
          type: "hard",
          coverPdfBlob: coverBlob,
          textPdfBlob: textBlob,
        });
      }

      set({
        cleanSpreadCache: currentCleanCache,
        previewSpreadCache: currentCache,
        isPreviewModalOpen: true,
      });
    } catch (err) {
      console.error("Preview render failed:", err);
      toast.error("Failed to generate preview. Please try again.");
    } finally {
      set({
        isGeneratingPdf: false,
        isRenderingPreview: false,
        pdfGenerationProgress: null,
        previewRenderProgress: null,
      });
      setCurrentSpread(originalIndex, true);
      if (originalViewMode !== get().viewMode) {
        set({ viewMode: originalViewMode });
      }
    }
  },
}));

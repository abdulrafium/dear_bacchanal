import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import Konva from "konva";
import { toast } from "sonner";

// Element types that can be placed on a page
export type ElementType = "image" | "text" | "shape" | "sticker" | "qrcode" | "calendar" | "photo-card";
export type ShapeType = "rectangle" | "ellipse";

export interface CalendarSettings {
  month: number; // 0-11
  year: number;
  data: Record<string, string>; // "YYYY-MM-DD" -> text
  backgroundColor?: string;
  textColor?: string;
  titleColor?: string;
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
}

export type SidebarPanel = "images" | "templates" | "layouts" | "backgrounds" | "stickers" | "calendar" | "text" | null;
export type RightTool = "text" | "photo" | "qrcode" | "layout" | "rectangle" | "ellipse" | null;

interface HistoryEntry {
  spreads: BookSpread[];
  currentSpreadIndex: number;
}

interface EditorState {
  // Book data
  spreads: BookSpread[];
  currentSpreadIndex: number;

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

  // Actions - History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  resetEditor: () => void;
  save: (isAdmin?: boolean) => Promise<boolean>;
  isGeneratingPdf: boolean;
  pdfGenerationProgress: { current: number; total: number; status: string } | null;
  generatePdfBook: (isHardCopy?: boolean) => Promise<void>;
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

  // Navigation
  setCurrentSpread: (index, skipDirty = false) => set((s) => ({ 
    currentSpreadIndex: index, 
    selectedElementId: null, 
    isDirty: skipDirty ? s.isDirty : true 
  })),
  nextSpread: () => {
    const { currentSpreadIndex, spreads } = get();
    if (currentSpreadIndex < spreads.length - 1) {
      set({ currentSpreadIndex: currentSpreadIndex + 1, selectedElementId: null, isDirty: true });
    }
  },
  prevSpread: () => {
    const { currentSpreadIndex } = get();
    if (currentSpreadIndex > 0) {
      set({ currentSpreadIndex: currentSpreadIndex - 1, selectedElementId: null, isDirty: true });
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
    set({
      spreads: JSON.parse(JSON.stringify(spreads)),
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
  generatePdfBook: async (isHardCopy = false) => {
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

    try {
        const { jsPDF } = await import("jspdf");
        const PAGE_WIDTH = 400;
        const PAGE_HEIGHT = 550;
        const spreadWidth = PAGE_WIDTH * 2 + 8;
        const spreadHeight = PAGE_HEIGHT;
        
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [spreadWidth, spreadHeight]
        });

        toast.info(`Generating PDF — ${spreads.length} spreads to process...`, { duration: 3000 });

        set({ pdfGenerationProgress: { current: 0, total: spreads.length, status: "Preparing pages..." } });

        for (let i = 0; i < spreads.length; i++) {
            set({ pdfGenerationProgress: { current: i + 1, total: spreads.length, status: `Rendering page ${i + 1} of ${spreads.length}...` } });
            toast.info(`Rendering spread ${i + 1} of ${spreads.length}...`, { duration: 2000, id: 'pdf-progress' });
            
            setCurrentSpread(i, true);
            
            // 1. Wait for React to mount components and images to start loading
            await new Promise(resolve => setTimeout(resolve, 3000)); 
            
            // 2. Re-fetch stageRef from store (it updates when canvas re-renders)
            const currentStageRef = get().stageRef;
            if (!currentStageRef) {
                console.warn(`stageRef lost on spread ${i}, skipping...`);
                continue;
            }
            
            // 3. Force a full redraw
            currentStageRef.batchDraw();

            // 4. Calculate export dimensions from the CURRENT stage
            const stageWidthExport = currentStageRef.width() / currentStageRef.scaleX();
            const stageHeightExport = currentStageRef.height() / currentStageRef.scaleY();

            const exportBg = new Konva.Rect({
                x: -100,
                y: -100,
                width: stageWidthExport + 200, 
                height: stageHeightExport + 200,
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
                await new Promise(r => setTimeout(r, 1000));
                
                // 6. Final redraw after everything is loaded
                currentStageRef.batchDraw();
                await new Promise(r => setTimeout(r, 300)); // Let the draw flush
                
                // 7. Capture high-quality snapshot
                set({ pdfGenerationProgress: { current: i + 1, total: spreads.length, status: `Finalizing page ${i + 1}...` } });

                const dataUrl = currentStageRef.toDataURL({ 
                    x: 0,
                    y: 0,
                    width: stageWidthExport,
                    height: stageHeightExport,
                    pixelRatio: 4, 
                    mimeType: "image/jpeg",
                    quality: 1.0
                });

                // Clean up the white background
                exportBg.destroy();
                currentStageRef.batchDraw();

                if (i > 0) pdf.addPage([spreadWidth, spreadHeight], "landscape");
                pdf.addImage(dataUrl, 'JPEG', 0, 0, spreadWidth, spreadHeight);
            }
        }

        const fileName = `${activeTemplateName?.replace(/\s+/g, '_') || 'Carnival_Book'}_Book.pdf`;
        
        const pdfBlob = pdf.output('blob');
        
        if (!isHardCopy) {
          // Manual download to force correct .pdf filename for soft copies
          const blobUrl = URL.createObjectURL(pdfBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = fileName;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
          toast.success("PDF downloaded successfully!", { duration: 5000 });
        }

        // ─── Background upload to UploadThing so SiteFlow can fetch it ──────────
        // This runs silently after the download — any failure is non-blocking.
        try {
          const { activeTemplateId: bookId, activeTemplateName: tmplName } = get();
          const uploadFormData = new FormData();
          uploadFormData.append(
            "file",
            new File([pdfBlob], `${tmplName?.replace(/\s+/g, '_') || 'book'}.pdf`, { type: "application/pdf" })
          );
          if (bookId) uploadFormData.append("bookId", bookId);
          if (tmplName) uploadFormData.append("templateName", tmplName);

          fetch("/api/editor/upload-pdf", {
            method: "POST",
            body: uploadFormData,
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.success) {
                console.log("[editor] PDF uploaded for SiteFlow:", data.url);
              } else {
                console.warn("[editor] PDF upload for SiteFlow failed:", data.error);
              }
            })
            .catch((uploadErr) => {
              console.warn("[editor] PDF upload for SiteFlow error (non-blocking):", uploadErr);
            });
        } catch (uploadSetupErr) {
          console.warn("[editor] Could not start PDF upload:", uploadSetupErr);
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
    } catch (err) {
        console.error("PDF Export Error:", err);
        toast.error("PDF generation failed. Please try again.");
    } finally {
        set({ isGeneratingPdf: false, pdfGenerationProgress: null });
        
        // Restore selection and view mode
        setCurrentSpread(originalIndex, true);
        if (originalViewMode !== get().viewMode) {
          set({ viewMode: originalViewMode });
        }
    }
  },
}));

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

// Element types that can be placed on a page
export type ElementType = "image" | "text" | "shape" | "sticker" | "qrcode";
export type ShapeType = "rectangle" | "ellipse";

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
  align?: string;
  // Shape-specific
  shapeType?: ShapeType;
  stroke?: string;
  strokeWidth?: number;
  shapeFill?: string;
  // QR Code
  qrData?: string;
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

export type SidebarPanel = "images" | "templates" | "layouts" | "backgrounds" | "stickers" | null;
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
  activeTemplateName: string | null;

  // UI state
  isAdmin: boolean;
  isPreviewMode: boolean;
  selectedElementId: string | null;
  activeSidebarPanel: SidebarPanel;
  activeRightTool: RightTool;
  zoom: number;
  showThumbnails: boolean;
  viewMode: "spread" | "single";

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // Actions - Navigation
  setCurrentSpread: (index: number) => void;
  nextSpread: () => void;
  prevSpread: () => void;

  // Actions - Elements
  addElement: (pageId: string, element: Omit<EditorElement, "id">) => void;
  updateElement: (pageId: string, elementId: string, updates: Partial<EditorElement>) => void;
  removeElement: (pageId: string, elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  toggleElementLock: (pageId: string, elementId: string) => void;
  applyLayout: (pageId: string, frames: { x: number; y: number; width: number; height: number; type: "image" | "text" }[]) => void;

  // Actions - Pages & Templates
  addSpread: () => void;
  duplicateSpread: (index: number) => void;
  removeSpread: (index: number) => void;
  updatePageBackground: (pageId: string, background: string) => void;
  loadTemplate: (spreads: BookSpread[], name: string) => void;

  // Actions - UI
  setSidebarPanel: (panel: SidebarPanel) => void;
  setRightTool: (tool: RightTool) => void;
  setZoom: (zoom: number) => void;
  toggleThumbnails: () => void;
  setViewMode: (mode: "spread" | "single") => void;
  togglePreview: () => void;
  setIsAdmin: (isAdmin: boolean) => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
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

function createInitialSpreads(): BookSpread[] {
  return [
    {
      id: uuidv4(),
      leftPage: { ...createDefaultPage("Cover"), background: "#9f2e2b", isLocked: true },
      rightPage: createDefaultPage("Page 1"),
    },
    {
      id: uuidv4(),
      leftPage: createDefaultPage("Page 2"),
      rightPage: createDefaultPage("Page 3"),
    },
    {
      id: uuidv4(),
      leftPage: createDefaultPage("Page 4"),
      rightPage: createDefaultPage("Page 5"),
    },
    {
      id: uuidv4(),
      leftPage: createDefaultPage("Page 6"),
      rightPage: createDefaultPage("Page 7"),
    },
    {
      id: uuidv4(),
      leftPage: createDefaultPage("Page 8"),
      rightPage: createDefaultPage("Page 9"),
    },
  ];
}

export const useEditorStore = create<EditorState>((set, get) => ({
  spreads: [],
  currentSpreadIndex: 0,
  templateLoaded: false,
  activeTemplateName: null,
  isAdmin: false,
  isPreviewMode: false,
  selectedElementId: null,
  activeSidebarPanel: "templates",
  activeRightTool: null,
  zoom: 100,
  showThumbnails: true,
  viewMode: "spread",
  history: [],
  historyIndex: -1,
  isDirty: false,
  setDirty: (dirty) => set({ isDirty: dirty }),

  // Navigation
  setCurrentSpread: (index) => set({ currentSpreadIndex: index, selectedElementId: null, isDirty: true }),
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
    set({
      spreads: state.spreads.map((spread) => ({
        ...spread,
        leftPage: spread.leftPage.id === pageId
          ? { ...spread.leftPage, elements: [...spread.leftPage.elements, { ...element, id: uuidv4() }] }
          : spread.leftPage,
        rightPage: spread.rightPage.id === pageId
          ? { ...spread.rightPage, elements: [...spread.rightPage.elements, { ...element, id: uuidv4() }] }
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

  loadTemplate: (spreads, name) => {
    set({
      spreads: JSON.parse(JSON.stringify(spreads)),
      currentSpreadIndex: 0,
      templateLoaded: true,
      activeTemplateName: name,
      selectedElementId: null,
      history: [],
      historyIndex: -1,
      activeSidebarPanel: "layouts",
    });
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
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];
    set({
      spreads: JSON.parse(JSON.stringify(entry.spreads)),
      currentSpreadIndex: entry.currentSpreadIndex,
      historyIndex: historyIndex + 1,
      selectedElementId: null,
    });
  },
}));

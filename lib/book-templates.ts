import { BookSpread, BookPage, EditorElement } from "@/store/editor-store";
import { v4 as uuidv4 } from "uuid";

export interface BookTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  year: number;
  country: string;
  spreads: BookSpread[];
  isActive?: boolean;
}

const PAGE_WIDTH = 500;
const PAGE_HEIGHT = 500;

function createText(text: string, x: number, y: number, fontSize: number, fill: string, width: number = PAGE_WIDTH, align: "left" | "center" | "right" = "center"): EditorElement {
  return {
    id: uuidv4(),
    type: "text",
    x,
    y,
    width,
    height: fontSize * 2,
    rotation: 0,
    text,
    fontSize,
    fontFamily: "Arial", // using arial as a fallback since google fonts might need loading in canvas
    fill,
    align,
  };
}

function createBgImage(src: string): EditorElement {
  return {
    id: uuidv4(),
    type: "image",
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    rotation: 0,
    src,
  };
}

function createPage(
  label: string,
  bg: string,
  elements: EditorElement[] = [],
  isLocked: boolean = false
): BookPage {
  return {
    id: uuidv4(),
    label,
    elements,
    background: bg,
    isLocked,
  };
}

export function createBacchanaleTemplate(): BookTemplate {
  const spreads: BookSpread[] = [
    // Spread 0 — Cover (FirstPage is back cover, EigthPage is front cover)
    {
      id: uuidv4(),
      leftPage: createPage("Back cover", "#b5251a", [
        {...createBgImage("/assets/layer-12.png"), isLocked: true, opacity: 0.25},
        { ...createText("The tabanka is real\nThank you Carnival 2026", 60, PAGE_HEIGHT / 2 - 30, 22, "#ffffff", PAGE_WIDTH - 120, "left"), fontFamily: "Kalam", fontStyle: "italic" },
      ], true),
      rightPage: createPage("Front cover", "#b5251a", [
        {...createBgImage("/assets/layer-12.png"), isLocked: true},
        createText("DEAR", 40, PAGE_HEIGHT / 2 - 80, 88, "#ffffff", PAGE_WIDTH * 0.5, "left"),
        createText("BACCHANAL", 40, PAGE_HEIGHT / 2 + 20, 88, "#ffffff", PAGE_WIDTH * 0.55, "left"),
      ], true),
    },
    // Spread 1 — Quote + Letter (TenthPage equivalent split across two pages)
    {
      id: uuidv4(),
      leftPage: createPage("Page 1", "#ffffff", [
        { ...createText("❝", 10, 120, 100, "#c8413d", 60, "left"), fontFamily: "Kalam" },
        {
          ...createText(
            "Dear Bacchanal, you never warn us. You just show\nup. You take our sleep, our voices, our sense of time.\nYou leave glitter in our bags and stories we can’t\nfully explain. This book is proof that we were there,\nthat it happened, that we lived it.",
            35, 180, 20, "#3a1010", PAGE_WIDTH - 70, "center"
          ),
          fontFamily: "Kalam"
        },
        { ...createText("❞", PAGE_WIDTH - 70, 360, 100, "#c8413d", 60, "right"), fontFamily: "Kalam" },
      ]),
      rightPage: createPage("Page 2", "#ffffff", [
        { ...createText("Dear Bacchanal,", 60, 220, 44, "#e5a7a7", PAGE_WIDTH - 80, "left"), fontFamily: "Kalam" },
        { ...createText("This is my Trinidad Carnival 2026.", 60, 320, 28, "#e5a7a7", PAGE_WIDTH - 80, "left"), fontFamily: "Kalam" },
        { ...createText("( Your Name )", PAGE_WIDTH - 200, 420, 28, "#c8413d", 160, "right"), fontFamily: "Kalam" },
      ]),
    },
    // Spread 2 — THE GREATEST (NinthPage)
    {
      id: uuidv4(),
      leftPage: createPage("Page 3", "#ffffff", [
        {...createBgImage("/assets/layer-14.png"), isLocked: true},
        createText("THE GREATEST", 40, 100, 40, "#000000", PAGE_WIDTH - 80, "left"),
        createText("✓ Vibes", 40, 200, 20, "#000000", PAGE_WIDTH - 80, "left"),
        createText("✓ Costume from ya band", 40, 240, 20, "#000000", PAGE_WIDTH - 80, "left"),
        createText("✓ Fete-in time", 40, 280, 20, "#000000", PAGE_WIDTH - 80, "left"),
      ]),
      rightPage: createPage("Page 4", "#ffffff", [
        {...createBgImage("/assets/layer-14.png"), isLocked: true},
        createText("SHOW ON EARTH", 40, 100, 40, "#000000", PAGE_WIDTH - 80, "left"),
        createText("✓ Friends", 40, 200, 20, "#000000", PAGE_WIDTH - 80, "left"),
        createText("✓ Soca tunes loaded", 40, 240, 20, "#000000", PAGE_WIDTH - 80, "left"),
        createText("✓ Waist ready to wine", 40, 280, 20, "#000000", PAGE_WIDTH - 80, "left"),
      ]),
    },
    // Spread 3 - Photo Layouts
    {
      id: uuidv4(),
      leftPage: createPage("Page 5", "#ffffff", [
        {...createBgImage("/assets/layer-15.png"), isLocked: true},
        createText("MUMMY", 40, 40, 32, "#ffffff", PAGE_WIDTH, "left"),
      ]),
      rightPage: createPage("Page 6", "#ffffff", [
        {...createBgImage("/assets/layer-15.png"), isLocked: true},
        createText("AND DADDY...", 40, 40, 32, "#ffffff", PAGE_WIDTH, "left"),
      ]),
    },
    // Spread 4 - Fete In Time
    {
      id: uuidv4(),
      leftPage: createPage("Page 7", "#ffffff", [
        {...createBgImage("/assets/layer-20.png"), isLocked: true},
        {...createBgImage("/assets/FEte-ing.png"), isLocked: true, width: 200, height: 60, x: 20, y: 20},
        {...createBgImage("/assets/layer-21.png"), isLocked: true, width: 140, height: 200, x: 0, y: PAGE_HEIGHT - 200},
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 100, y: 160, width: 120, height: 160, rotation: 4, shapeFill: "#2d2d2d", stroke: "#ffffff", strokeWidth: 8, isLocked: false },
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 240, y: 110, width: 120, height: 160, rotation: -4, shapeFill: "#2d2d2d", stroke: "#ffffff", strokeWidth: 8, isLocked: false },
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 220, y: 310, width: 120, height: 160, rotation: -7, shapeFill: "#2d2d2d", stroke: "#ffffff", strokeWidth: 8, isLocked: false },
      ]),
      rightPage: createPage("Page 8", "#ffffff", [
        {...createBgImage("/assets/layer-20.png"), isLocked: true},
        {...createBgImage("/assets/layer-22.png"), isLocked: true, width: 140, height: 200, x: PAGE_WIDTH - 140, y: PAGE_HEIGHT - 200},
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 40, y: 90, width: 120, height: 160, rotation: 5, shapeFill: "#2d2d2d", stroke: "#ffffff", strokeWidth: 8, isLocked: false },
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 200, y: 130, width: 120, height: 160, rotation: 9, shapeFill: "#2d2d2d", stroke: "#ffffff", strokeWidth: 8, isLocked: false },
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 80, y: 300, width: 120, height: 160, rotation: 8, shapeFill: "#2d2d2d", stroke: "#ffffff", strokeWidth: 8, isLocked: false },
      ]),
    },
    // Spread 5 - We Limin' Design (Page 9 & 10)
    {
      id: uuidv4(),
      leftPage: createPage("Page 9", "#ffffff", [
        // Background Lime Pattern
        { id: uuidv4(), type: "image", src: "/assets/lime.png", x: -80, y: -40, width: 200, height: 200, rotation: -15, isLocked: true, opacity: 0.3 },
        { id: uuidv4(), type: "image", src: "/assets/lime.png", x: PAGE_WIDTH - 120, y: -80, width: 250, height: 250, rotation: 140, isLocked: true, opacity: 0.2 },
        { id: uuidv4(), type: "image", src: "/assets/lime.png", x: -100, y: 200, width: 300, height: 300, rotation: 15, isLocked: true, opacity: 0.2 },
        { id: uuidv4(), type: "image", src: "/assets/lime.png", x: PAGE_WIDTH - 150, y: PAGE_HEIGHT - 180, width: 280, height: 280, rotation: -30, isLocked: true, opacity: 0.3 },
        { id: uuidv4(), type: "image", src: "/assets/lime.png", x: -50, y: PAGE_HEIGHT - 120, width: 180, height: 180, rotation: 45, isLocked: true, opacity: 0.4 },

        // Heading "We Limin'"
        { ...createText("We", 80, 50, 85, "#fac041", 200, "left"), fontFamily: "Poppins" },
        { ...createText("LIMIN'", 100, 70, 85, "#ffffff", 300, "center"), fontFamily: "Poppins", rotation: 5 },
        
        // Definition
        { ...createText("Trinidadian slang (pronounced lime-in) means to hang out in relaxed leisurely manner, often with food, drinks and music without specific agenda.", 40, 160, 18, "#ffffff", PAGE_WIDTH - 80, "center"), fontFamily: "Kalam" },

        // Prompts
        { ...createText("My drink of choice this Carnival:", 40, 240, 15, "#ffffff", PAGE_WIDTH - 80, "left"), fontFamily: "Poppins" },
        { ...createText("Who I limed with the most:", 40, 280, 15, "#ffffff", PAGE_WIDTH - 80, "left"), fontFamily: "Poppins" },
        { ...createText("I spent this epic time with:", 40, 320, 15, "#ffffff", PAGE_WIDTH - 80, "left"), fontFamily: "Poppins" },
        { ...createText("The best part of Carnival I'll be telling stories about for years:", 40, 360, 15, "#ffffff", PAGE_WIDTH - 80, "left"), fontFamily: "Poppins" },

        // Writing Lines (Shapes)
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 40, y: 400, width: PAGE_WIDTH - 80, height: 1, rotation: 0, shapeFill: "#ffffff", opacity: 0.6 },
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 40, y: 440, width: PAGE_WIDTH - 80, height: 1, rotation: 0, shapeFill: "#ffffff", opacity: 0.6 },
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 40, y: 480, width: PAGE_WIDTH - 80, height: 1, rotation: 0, shapeFill: "#ffffff", opacity: 0.6 },
      ]),
      rightPage: createPage("Page 10", "#ffffff", [
        // Background Lime Pattern (Symmetrical)
        { id: uuidv4(), type: "image", src: "/assets/lime.png", x: -40, y: -40, width: 220, height: 220, rotation: 45, isLocked: true, opacity: 0.3 },
        { id: uuidv4(), type: "image", src: "/assets/lime.png", x: PAGE_WIDTH - 150, y: -60, width: 200, height: 200, rotation: -15, isLocked: true, opacity: 0.2 },
        { id: uuidv4(), type: "image", src: "/assets/lime.png", x: PAGE_WIDTH / 2, y: PAGE_HEIGHT / 2, width: 350, height: 350, rotation: 10, isLocked: true, opacity: 0.1 },
        
        { ...createText("LIME MOMENTS", 40, 40, 32, "#fac041", PAGE_WIDTH - 80, "center"), fontFamily: "Poppins" },
        
        // Large Polaroid-style frame for the photo
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 30, y: 110, width: PAGE_WIDTH - 60, height: PAGE_HEIGHT - 180, rotation: -2, shapeFill: "#ffffff", stroke: "#000000", strokeWidth: 1 },
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 45, y: 125, width: PAGE_WIDTH - 90, height: PAGE_HEIGHT - 260, rotation: -2, shapeFill: "#2d2d2d" }, // Photo Area
        
        { ...createText("❝ Good times & tan lines ❞", 40, PAGE_HEIGHT - 120, 24, "#ffffff", PAGE_WIDTH - 80, "center"), fontFamily: "Kalam", rotation: -2 },
      ]),
    },
    // Spread 6
    {
      id: uuidv4(),
      leftPage: createPage("Page 11", "#ffffff", [
        {...createBgImage("/assets/layer-22.png"), isLocked: true},
      ]),
      rightPage: createPage("Page 12", "#ffffff", [
        {...createBgImage("/assets/layer-21.png"), isLocked: true},
      ]),
    },
    // Spread 7
    {
      id: uuidv4(),
      leftPage: createPage("Page 13", "#ffffff", [
        {...createBgImage("/assets/layer-8.png"), isLocked: true},
      ]),
      rightPage: createPage("Page 14", "#ffffff", [
        {...createBgImage("/assets/layer-9.png"), isLocked: true},
      ]),
    },
    // Spread 8
    {
      id: uuidv4(),
      leftPage: createPage("Page 15", "#ffffff", [
        {...createBgImage("/assets/layer-13.png"), isLocked: true},
      ]),
      rightPage: createPage("Page 16", "#ffffff", [
        {...createBgImage("/assets/layer-3.png"), isLocked: true},
      ]),
    },
  ];

  return {
    id: "bacchanal-2026",
    name: "Bacchanal 2026",
    description: "The official Dear Bacchanal carnival memory book template with full layouts.",
    thumbnail: "/assets/layer-12.png",
    year: 2026,
    country: "Trinidad",
    spreads,
  };
}

// All available templates
export function getAvailableTemplates(): BookTemplate[] {
  return [createBacchanaleTemplate()];
}

export function createBlankTemplate(): BookTemplate {
  return {
    id: "blank-template",
    name: "New Template",
    description: "Start from scratch with a blank book.",
    thumbnail: "/assets/layer-12.png",
    year: 2026,
    country: "Trinidad",
    spreads: [
      {
        id: uuidv4(),
        leftPage: createPage("Page 1", "#ffffff", []),
        rightPage: createPage("Page 2", "#ffffff", []),
      }
    ],
  };
}

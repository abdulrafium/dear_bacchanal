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
}

const PAGE_WIDTH = 400;
const PAGE_HEIGHT = 550;

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
    // Spread 0 — Cover (FirstPage is actually back cover, EigthPage is front cover)
    {
      id: uuidv4(),
      leftPage: createPage("Back cover", "#ff0400", [
        {...createBgImage("/assets/layer-2.png"), isLocked: true, x: PAGE_WIDTH * 0.2, y: PAGE_HEIGHT * 0.4, width: PAGE_WIDTH * 0.8, height: PAGE_HEIGHT * 0.6},
        createText("Dear Bacchanal", 30, 70, 16, "#ffffff", 250, "left"),
        createText("First edition 2023\nSecond edition 2026", 30, 120, 12, "#ffffff", 250, "left"),
        createText("Copyright © SAFFA Trinidad Ltd.\nAll rights reserved.\nNo part of this book may be reproduced\nin any form or by any means without\nthe written permission of the copyright owner.", 30, 180, 11, "#ffffff", 250, "left"),
        createText("Ami Aqui Sirjoo, Creative Director\nAarad Homer, Assistant Creative Director\nAya Ataeva, Web Development and Design", 30, 290, 11, "#ffffff", 250, "left"),
      ], true),
      rightPage: createPage("Front cover", "#9f2e2b", [
        createBgImage("/assets/layer-12.png"),
        createText("We tried to behave.", 0, 100, 20, "#ffffff", PAGE_WIDTH, "center"),
        createText("DEAR", 0, 210, 52, "#ffffff", PAGE_WIDTH, "center"),
        createText("BACCHANAL", 0, 270, 72, "#ffffff", PAGE_WIDTH, "center"),
      ], true),
    },
    // Spread 1 — Quote + Letter (TenthPage equivalent split across two pages)
    {
      id: uuidv4(),
      leftPage: createPage("Page 1", "#9F2E2B", [
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
      leftPage: createPage("Page 3", "#d13430", [
        {...createBgImage("/assets/layer-14.png"), isLocked: true},
        createText("THE GREATEST", 40, 100, 40, "#ffffff", PAGE_WIDTH - 80, "left"),
        createText("✓ Vibes", 40, 200, 20, "#000000", PAGE_WIDTH - 80, "left"),
        createText("✓ Costume from ya band", 40, 240, 20, "#000000", PAGE_WIDTH - 80, "left"),
        createText("✓ Fete-in time", 40, 280, 20, "#000000", PAGE_WIDTH - 80, "left"),
      ]),
      rightPage: createPage("Page 4", "#d13430", [
        {...createBgImage("/assets/layer-14.png"), isLocked: true},
        createText("SHOW ON EARTH", 40, 100, 40, "#ffffff", PAGE_WIDTH - 80, "left"),
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
      leftPage: createPage("Page 7", "#643676", [
        {...createBgImage("/assets/layer-20.png"), isLocked: true},
        {...createBgImage("/assets/FEte-ing.png"), isLocked: true, width: 200, height: 60, x: 20, y: 20},
        {...createBgImage("/assets/layer-21.png"), isLocked: true, width: 140, height: 200, x: 0, y: PAGE_HEIGHT - 200},
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 100, y: 160, width: 120, height: 160, rotation: 4, shapeFill: "#2d2d2d", stroke: "#ffffff", strokeWidth: 8, isLocked: false },
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 240, y: 110, width: 120, height: 160, rotation: -4, shapeFill: "#2d2d2d", stroke: "#ffffff", strokeWidth: 8, isLocked: false },
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 220, y: 310, width: 120, height: 160, rotation: -7, shapeFill: "#2d2d2d", stroke: "#ffffff", strokeWidth: 8, isLocked: false },
      ]),
      rightPage: createPage("Page 8", "#643676", [
        {...createBgImage("/assets/layer-20.png"), isLocked: true},
        {...createBgImage("/assets/layer-22.png"), isLocked: true, width: 140, height: 200, x: PAGE_WIDTH - 140, y: PAGE_HEIGHT - 200},
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 40, y: 90, width: 120, height: 160, rotation: 5, shapeFill: "#2d2d2d", stroke: "#ffffff", strokeWidth: 8, isLocked: false },
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 200, y: 130, width: 120, height: 160, rotation: 9, shapeFill: "#2d2d2d", stroke: "#ffffff", strokeWidth: 8, isLocked: false },
        { id: uuidv4(), type: "shape", shapeType: "rectangle", x: 80, y: 300, width: 120, height: 160, rotation: 8, shapeFill: "#2d2d2d", stroke: "#ffffff", strokeWidth: 8, isLocked: false },
      ]),
    },
    // Spread 5 - Costume Photos
    {
      id: uuidv4(),
      leftPage: createPage("Page 9", "#111111", [
        {...createBgImage("/assets/layer-20.png"), isLocked: true},
        createText("ROAD\nREADY", 40, PAGE_HEIGHT - 120, 42, "#ffffff"),
      ]),
      rightPage: createPage("Page 10", "#111111", [
         {...createBgImage("/assets/layer-10.png"), isLocked: true},
      ]),
    },
    // Spread 6
    {
      id: uuidv4(),
      leftPage: createPage("Page 11", "#111111", [
        {...createBgImage("/assets/layer-22.png"), isLocked: true},
      ]),
      rightPage: createPage("Page 12", "#111111", [
        {...createBgImage("/assets/layer-21.png"), isLocked: true},
      ]),
    },
    // Spread 7
    {
      id: uuidv4(),
      leftPage: createPage("Page 13", "#9f2e2b", [
        {...createBgImage("/assets/layer-8.png"), isLocked: true},
      ]),
      rightPage: createPage("Page 14", "#9f2e2b", [
        {...createBgImage("/assets/layer-9.png"), isLocked: true},
      ]),
    },
    // Spread 8
    {
      id: uuidv4(),
      leftPage: createPage("Page 15", "#222222", [
        {...createBgImage("/assets/layer-13.png"), isLocked: true},
      ]),
      rightPage: createPage("Page 16", "#222222", [
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

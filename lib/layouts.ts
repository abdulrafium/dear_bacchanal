// Define layouts and their frame configurations relative to a page (percentages or 0-1 relative values)
export type LayoutFrame = {
  id: string; // unique within layout
  x: number; // 0-1
  y: number; // 0-1
  width: number; // 0-1
  height: number; // 0-1
};

export type PageLayout = {
  id: string;
  name: string;
  frames: LayoutFrame[];
};

export const PAGE_LAYOUTS: PageLayout[] = [
  {
    id: "l_full",
    name: "Full Page",
    frames: [
      { id: "f1", x: 0.05, y: 0.05, width: 0.9, height: 0.9 }
    ]
  },
  {
    id: "l_2_horizontal",
    name: "2 Horizontal",
    frames: [
      { id: "f1", x: 0.05, y: 0.05, width: 0.9, height: 0.425 },
      { id: "f2", x: 0.05, y: 0.525, width: 0.9, height: 0.425 }
    ]
  },
  {
    id: "l_2_vertical",
    name: "2 Vertical",
    frames: [
      { id: "f1", x: 0.05, y: 0.05, width: 0.425, height: 0.9 },
      { id: "f2", x: 0.525, y: 0.05, width: 0.425, height: 0.9 }
    ]
  },
  {
    id: "l_3_horizontal",
    name: "3 Horizontal",
    frames: [
      { id: "f1", x: 0.05, y: 0.05, width: 0.9, height: 0.28 },
      { id: "f2", x: 0.05, y: 0.36, width: 0.9, height: 0.28 },
      { id: "f3", x: 0.05, y: 0.67, width: 0.9, height: 0.28 }
    ]
  },
  {
    id: "l_grid_4",
    name: "4 Grid",
    frames: [
      { id: "f1", x: 0.05, y: 0.05, width: 0.425, height: 0.425 },
      { id: "f2", x: 0.525, y: 0.05, width: 0.425, height: 0.425 },
      { id: "f3", x: 0.05, y: 0.525, width: 0.425, height: 0.425 },
      { id: "f4", x: 0.525, y: 0.525, width: 0.425, height: 0.425 }
    ]
  },
  {
    id: "l_1_top_2_bottom",
    name: "1 Top, 2 Bottom",
    frames: [
      { id: "f1", x: 0.05, y: 0.05, width: 0.9, height: 0.425 },
      { id: "f2", x: 0.05, y: 0.525, width: 0.425, height: 0.425 },
      { id: "f3", x: 0.525, y: 0.525, width: 0.425, height: 0.425 }
    ]
  },
  {
    id: "l_2_top_1_bottom",
    name: "2 Top, 1 Bottom",
    frames: [
      { id: "f1", x: 0.05, y: 0.05, width: 0.425, height: 0.425 },
      { id: "f2", x: 0.525, y: 0.05, width: 0.425, height: 0.425 },
      { id: "f3", x: 0.05, y: 0.525, width: 0.9, height: 0.425 }
    ]
  },
  {
    id: "l_offset_overlap",
    name: "Offset Overlap",
    frames: [
      { id: "f1", x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
      { id: "f2", x: 0.4, y: 0.4, width: 0.5, height: 0.5 }
    ]
  },
  {
    id: "l_polaroid_scatter",
    name: "Polaroid Scatter",
    frames: [
      { id: "f1", x: 0.1, y: 0.05, width: 0.4, height: 0.4 },
      { id: "f2", x: 0.5, y: 0.2, width: 0.4, height: 0.4 },
      { id: "f3", x: 0.2, y: 0.5, width: 0.4, height: 0.4 }
    ]
  },
  {
    id: "l_six_grid",
    name: "6 Grid",
    frames: [
      { id: "f1", x: 0.05, y: 0.05, width: 0.425, height: 0.28 },
      { id: "f2", x: 0.525, y: 0.05, width: 0.425, height: 0.28 },
      { id: "f3", x: 0.05, y: 0.36, width: 0.425, height: 0.28 },
      { id: "f4", x: 0.525, y: 0.36, width: 0.425, height: 0.28 },
      { id: "f5", x: 0.05, y: 0.67, width: 0.425, height: 0.28 },
      { id: "f6", x: 0.525, y: 0.67, width: 0.425, height: 0.28 }
    ]
  },
  {
    id: "l_large_center_small_sides",
    name: "Large Center, Small Sides",
    frames: [
      { id: "f1", x: 0.05, y: 0.3, width: 0.2, height: 0.4 },
      { id: "f2", x: 0.3, y: 0.1, width: 0.4, height: 0.8 },
      { id: "f3", x: 0.75, y: 0.3, width: 0.2, height: 0.4 }
    ]
  },
  {
    id: "l_film_strip",
    name: "Film Strip",
    frames: [
      { id: "f1", x: 0.1, y: 0.05, width: 0.8, height: 0.2 },
      { id: "f2", x: 0.1, y: 0.28, width: 0.8, height: 0.2 },
      { id: "f3", x: 0.1, y: 0.51, width: 0.8, height: 0.2 },
      { id: "f4", x: 0.1, y: 0.74, width: 0.8, height: 0.2 }
    ]
  },
  {
    id: "l_asymmetric_3",
    name: "Asymmetric 3",
    frames: [
      { id: "f1", x: 0.05, y: 0.05, width: 0.6, height: 0.5 },
      { id: "f2", x: 0.7, y: 0.05, width: 0.25, height: 0.25 },
      { id: "f3", x: 0.7, y: 0.35, width: 0.25, height: 0.5 }
    ]
  },
  {
    id: "l_mosaic_5",
    name: "Mosaic 5",
    frames: [
      { id: "f1", x: 0.05, y: 0.05, width: 0.425, height: 0.5 },
      { id: "f2", x: 0.525, y: 0.05, width: 0.425, height: 0.25 },
      { id: "f3", x: 0.525, y: 0.325, width: 0.425, height: 0.225 },
      { id: "f4", x: 0.05, y: 0.6, width: 0.6, height: 0.35 },
      { id: "f5", x: 0.7, y: 0.6, width: 0.25, height: 0.35 }
    ]
  }
];

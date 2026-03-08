"use client";

import { useEditorStore } from "@/store/editor-store";
import { getAvailableTemplates } from "@/lib/book-templates";
import { ChevronDown, Star, Grid3X3, Image, Paintbrush, Sticker, LayoutGrid, BookOpen, CheckCircle2, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import { PAGE_LAYOUTS } from "@/lib/layouts";

function LayoutsPanel() {
  const [activeTab, setActiveTab] = useState<"layouts" | "ideas">("layouts");

  const handleDragStart = (e: React.DragEvent, layoutId: string) => {
    e.dataTransfer.setData("application/layout-id", layoutId);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4 flex-shrink-0">
        <button
          onClick={() => setActiveTab("layouts")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "layouts"
              ? "border-[#2d2d2d] text-[#2d2d2d]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          Layouts
        </button>
        <button
          onClick={() => setActiveTab("ideas")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "ideas"
              ? "border-[#2d2d2d] text-[#2d2d2d]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          💡 Ideas
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Favorites */}
        <div>
          <button className="flex items-center justify-between w-full py-2 text-sm text-gray-600 hover:text-gray-800">
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5" />
              <span>Favorites</span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Photo Layouts */}
        <div>
          <button className="flex items-center justify-between w-full py-2 text-sm text-gray-600 hover:text-gray-800">
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5" />
              <span>Photo Layouts</span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PAGE_LAYOUTS.map((layout) => (
              <div
                key={layout.id}
                draggable
                onDragStart={(e) => handleDragStart(e, layout.id)}
                className="aspect-[3/4] bg-white border-2 border-gray-200 rounded-lg p-1.5 cursor-grab hover:border-[#2d2d2d] hover:shadow-md transition-all group relative"
                title={layout.name}
              >
                {/* Render tiny representation of the layout frames */}
                <div className="absolute inset-1.5 pointer-events-none">
                  {layout.frames.map((frame) => (
                    <div
                      key={frame.id}
                      className="absolute bg-gray-200 rounded-sm group-hover:bg-[#2d2d2d]/20 transition-colors border border-white/50"
                      style={{
                        left: `${frame.x * 100}%`,
                        top: `${frame.y * 100}%`,
                        width: `${frame.width * 100}%`,
                        height: `${frame.height * 100}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagesPanel() {
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const addElement = useEditorStore((s) => s.addElement);
  const spreads = useEditorStore((s) => s.spreads);
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages = Array.from(files).map((file) => ({
      id: Math.random().toString(36).slice(2),
      url: URL.createObjectURL(file),
    }));
    
    setImages((prev) => [...newImages, ...prev]);
  };

  const currentSpread = spreads[currentSpreadIndex];
  const targetPage = currentSpread && !currentSpread.rightPage.isLocked ? currentSpread.rightPage : currentSpread?.leftPage;

  const handleDragStart = (e: React.DragEvent, url: string) => {
    // We could set drag data, but image drops are handled differently via canvas logic.
    // For now, let's just create an image blob and set it to dataTransfer
    // A simpler way for clicking:
  };

  const handleImageClick = (url: string) => {
    if (targetPage && !targetPage.isLocked) {
      addElement(targetPage.id, {
        type: "image",
        x: 50 + Math.random() * 50,
        y: 50 + Math.random() * 50,
        width: 200,
        height: 150,
        rotation: 0,
        src: url,
      });
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 border-b border-gray-200">
        <label className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl p-6 text-center hover:border-[#2d2d2d] hover:bg-gray-100 transition-colors cursor-pointer flex flex-col items-center justify-center">
          <Image className="w-6 h-6 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-600 mb-1">Upload Images</span>
          <span className="text-xs text-gray-400">Click to browse files</span>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            className="hidden" 
            onChange={handleFileUpload}
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2">
          {images.map((img) => (
            <div 
              key={img.id} 
              className="relative aspect-square group cursor-pointer border border-gray-200 rounded-lg overflow-hidden"
              onClick={() => handleImageClick(img.url)}
              draggable
              onDragStart={(e) => {
                // Konva drop relies on files, so we can't easily drag internal URLs into it without custom logic in EditorCanvas.
                // We'll rely on simply clicking the image to add it.
                e.preventDefault();
                handleImageClick(img.url);
              }}
            >
              <img src={img.url} alt="upload" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Plus className="text-white w-6 h-6" />
              </div>
            </div>
          ))}
          {images.length === 0 && (
            <div className="col-span-2 text-center text-sm text-gray-400 py-10">
              No images uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplatesPanel() {
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const activeTemplateName = useEditorStore((s) => s.activeTemplateName);
  const templates = getAvailableTemplates();

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#2d2d2d] flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Book Templates
        </h3>
        <p className="text-xs text-gray-400 mt-1">Choose a template to start editing</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {templates.map((template) => {
          const isActive = activeTemplateName === template.name;
          return (
            <div
              key={template.id}
              className={`rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                isActive
                  ? "border-green-500 shadow-lg shadow-green-500/10"
                  : "border-gray-200 hover:border-[#2d2d2d] hover:shadow-md"
              }`}
            >
              {/* Thumbnail */}
              <div
                className="h-36 relative overflow-hidden"
                style={{ backgroundColor: "#9f2e2b" }}
              >
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="text-white font-bold text-lg">{template.name}</h4>
                  <p className="text-white/70 text-[10px] mt-0.5">
                    {template.country} • {template.year}
                  </p>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    ACTIVE
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 bg-white">
                <p className="text-xs text-gray-500 mb-3">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {template.spreads.length} spreads • {template.spreads.length * 2} pages
                  </span>
                  <button
                    onClick={() => loadTemplate(template.spreads, template.name)}
                    className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "bg-[#2d2d2d] text-white hover:bg-[#404040]"
                    }`}
                  >
                    {isActive ? "Active ✓" : "Use Template"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Blank template */}
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-[#2d2d2d] transition-all cursor-pointer group"
          onClick={() => {
            loadTemplate([
              {
                id: "blank-spread",
                leftPage: { id: "blank-left", label: "Cover", elements: [], background: "#ffffff", isLocked: false },
                rightPage: { id: "blank-right", label: "Page 1", elements: [], background: "#ffffff", isLocked: false },
              }
            ], "Blank Book");
          }}
        >
          <Plus className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:text-[#2d2d2d] transition-colors" />
          <p className="text-sm font-medium text-gray-500 group-hover:text-[#2d2d2d]">Start Blank</p>
          <p className="text-xs text-gray-400 mt-1">Create your own layout from scratch</p>
        </div>
      </div>
    </div>
  );
}

function BackgroundsPanel() {
  const updatePageBackground = useEditorStore((s) => s.updatePageBackground);
  const spreads = useEditorStore((s) => s.spreads);
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex);
  const currentSpread = spreads[currentSpreadIndex];

  const colors = [
    "#ffffff", "#f5f5f5", "#e5e7eb", "#2d2d2d", "#1a1a1a",
    "#9f2e2b", "#dc2626", "#ea580c", "#d97706", "#65a30d",
    "#0891b2", "#2563eb", "#7c3aed", "#db2777", "#f43f5e",
  ];

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium text-gray-600">Colors</h3>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => {
              if (currentSpread && !currentSpread.rightPage.isLocked) {
                updatePageBackground(currentSpread.rightPage.id, color);
              }
            }}
            className="w-full aspect-square rounded-lg border-2 border-gray-200 hover:border-[#2d2d2d] transition-all hover:scale-110"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

function StickersPanel() {
  const addElement = useEditorStore((s) => s.addElement);
  const spreads = useEditorStore((s) => s.spreads);
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex);
  
  const currentSpread = spreads[currentSpreadIndex];

  const [stickers, setStickers] = useState<{ _id: string; url: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStickers = async () => {
      try {
        const res = await fetch("/api/admin/stickers");
        if (res.ok) {
          const data = await res.json();
          setStickers(data.stickers || []);
        }
      } catch (err) {
        console.error("Failed to load stickers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStickers();
  }, []);

  const selectedElementId = useEditorStore((s) => s.selectedElementId);

  const handleStickerClick = (url: string) => {
    if (!currentSpread) return;
    
    let targetPage = null;

    if (selectedElementId) {
      if (currentSpread.leftPage.elements.some((e) => e.id === selectedElementId)) {
        targetPage = currentSpread.leftPage;
      } else if (currentSpread.rightPage.elements.some((e) => e.id === selectedElementId)) {
        targetPage = currentSpread.rightPage;
      }
    }

    if (!targetPage) {
      if (!currentSpread.rightPage.isLocked) {
        targetPage = currentSpread.rightPage;
      } else if (!currentSpread.leftPage.isLocked) {
        targetPage = currentSpread.leftPage;
      }
    }

    if (!targetPage || targetPage.isLocked) return;

    addElement(targetPage.id, {
      type: "image",
      src: url,
      x: 50,
      y: 50,
      width: 150,
      height: 150,
      rotation: 0,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#2d2d2d] flex items-center gap-2">
          <Sticker className="w-4 h-4" />
          Stickers & Graphics
        </h3>
        <p className="text-xs text-gray-400 mt-1">Tap a graphic to add to active page</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : stickers.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-10 border border-dashed border-gray-200 rounded-xl">
            No stickers found.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stickers.map((sticker) => (
              <div 
                key={sticker._id} 
                className="relative aspect-square group cursor-pointer border border-gray-100 bg-gray-50 rounded-xl overflow-hidden hover:border-[#2d2d2d] hover:shadow-md transition-all flex items-center justify-center p-2"
                onClick={() => handleStickerClick(sticker.url)}
              >
                <img src={sticker.url} alt={sticker.name} className="w-full h-full object-contain pointer-events-none drop-shadow-sm" />
                <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm p-1 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-[10px] text-center font-medium truncate">{sticker.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function EditorLeftPanel() {
  const activeSidebarPanel = useEditorStore((s) => s.activeSidebarPanel);

  return (
    <div className="w-full md:w-72 h-full bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
      {activeSidebarPanel === "layouts" && <LayoutsPanel />}
      {activeSidebarPanel === "images" && <ImagesPanel />}
      {activeSidebarPanel === "templates" && <TemplatesPanel />}
      {activeSidebarPanel === "backgrounds" && <BackgroundsPanel />}
      {activeSidebarPanel === "stickers" && <StickersPanel />}
    </div>
  );
}

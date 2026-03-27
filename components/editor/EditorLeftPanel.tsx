import { useEditorStore } from "@/store/editor-store";
import { getAvailableTemplates } from "@/lib/book-templates";
import { ChevronDown, Star, Grid3X3, Image, Paintbrush, Sticker, LayoutGrid, BookOpen, CheckCircle2, Plus, Loader2, Trash2, Upload, Sparkles, Filter, MoreHorizontal, History } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { PAGE_LAYOUTS } from "@/lib/layouts";
import { useUploadThing } from "@/lib/uploadthing-client";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(true);
  const addElement = useEditorStore((s) => s.addElement);
  const spreads = useEditorStore((s) => s.spreads);
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex);

  // Fetch images on mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch("/api/book-images");
        if (res.ok) {
          const data = await res.json();
          const imageMap = data.images || {};
          const loadedImages = Object.entries(imageMap).map(([id, url]) => ({
            id,
            url: url as string,
          }));
          // Sort by newest first (approximate if no timestamp, but let's just show them)
          setImages(loadedImages.reverse());
        }
      } catch (err) {
        console.error("Failed to load images", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);
  
  const { startUpload, isUploading } = useUploadThing("bookImageUploader", {
    onClientUploadComplete: async (res) => {
      const newImages = res.map((file) => ({
        id: file.key,
        url: file.url,
      }));

      // Save to database
      for (const img of newImages) {
        try {
          await fetch("/api/book-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageId: img.id, imageUrl: img.url }),
          });
        } catch (err) {
          console.error("Failed to save image metadata", err);
        }
      }

      setImages((prev) => [...newImages, ...prev]);
      toast.success(`${res.length} images uploaded and saved!`);
    },
    onUploadError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    await startUpload(Array.from(files));
  };

  const currentSpread = spreads[currentSpreadIndex];
  const targetPage = currentSpread && !currentSpread.rightPage.isLocked ? currentSpread.rightPage : currentSpread?.leftPage;

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

  const handleDeleteImage = async (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    try {
      const res = await fetch(`/api/book-images?imageId=${imageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        toast.success("Image deleted");
      }
    } catch (err) {
      toast.error("Failed to delete image");
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 border-b border-gray-200">
        <label className={`border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl p-6 text-center hover:border-[#2d2d2d] hover:bg-gray-100 transition-colors cursor-pointer flex flex-col items-center justify-center ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-[#2d2d2d] animate-spin mb-2" />
          ) : (
            <Image className="w-6 h-6 text-gray-400 mb-2" />
          )}
          <span className="text-sm font-medium text-gray-600 mb-1">
            {isUploading ? 'Uploading...' : 'Upload Images'}
          </span>
          <span className="text-xs text-gray-400">Click to browse files</span>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Waking Library...</p>
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square bg-gray-50 rounded-xl overflow-hidden cursor-pointer border border-gray-100 hover:border-[#2d2d2d] hover:shadow-lg transition-all"
                onClick={() => handleImageClick(image.url)}
              >
                <img
                  src={image.url}
                  alt="Uploaded"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <button
                  onClick={(e) => handleDeleteImage(e, image.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg z-10"
                  title="Delete image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium">No images uploaded yet.</p>
            <p className="text-xs mt-1">Uploaded images will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplatesPanel() {
  const isAdmin = useEditorStore((s) => s.isAdmin);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const activeTemplateName = useEditorStore((s) => s.activeTemplateName);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hardTemplates] = useState(getAvailableTemplates());

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`/api/admin/templates?t=${Date.now()}`, {
           cache: 'no-store',
           headers: { 'Pragma': 'no-cache' }
        });
        if (res.ok) {
          const data = await res.json();
          const dbTemplates = data.templates || [];
          
          // Merge hard templates with DB ones (DB wins on name match)
          const merged = [...dbTemplates];
          hardTemplates.forEach(ht => {
            if (!merged.find(m => (m.templateName || m.name) === ht.name)) {
              merged.push({
                _id: ht.id,
                templateName: ht.name,
                thumbnail: ht.thumbnail,
                country: ht.country,
                year: ht.year,
                description: ht.description,
                spreads: ht.spreads,
                isHardCoded: true
              });
            }
          });
          
          setTemplates(merged);
        } else {
          // Fallback if API fails
          setTemplates(hardTemplates.map(ht => ({
             _id: ht.id,
             templateName: ht.name,
             thumbnail: ht.thumbnail,
             country: ht.country,
             year: ht.year,
             description: ht.description,
             spreads: ht.spreads,
             isHardCoded: true
          })));
        }
      } catch (err) {
        console.error("Failed to load templates", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [hardTemplates]);

  const handleDeleteTemplate = async (e: React.MouseEvent, templateName: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${templateName}" permanently? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/templates/${encodeURIComponent(templateName)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.templateName !== templateName));
        toast.success("Template deleted permanently");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete template");
      }
    } catch (err) {
      toast.error("Failed to delete template");
    }
  };

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
        {loading && (
          <div className="flex justify-center p-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        
        {!loading && templates.map((template) => {
          const isActive = activeTemplateName === template.templateName;
          return (
            <div
              key={template._id}
              className={`rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                isActive
                  ? "border-green-500 shadow-lg shadow-green-500/10"
                  : "border-gray-200 hover:border-[#2d2d2d] hover:shadow-md"
              }`}
            >
              {/* Thumbnail */}
              <div
                className="h-36 relative overflow-hidden bg-[#9f2e2b]"
              >
                <img
                  src={template.thumbnail}
                  alt={template.templateName}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="text-white font-bold text-lg">{template.templateName}</h4>
                  <p className="text-white/70 text-[10px] mt-0.5">
                    {template.country} • {template.year}
                  </p>
                </div>
                 <div className="absolute top-2 right-2 flex gap-1">
                    {isAdmin && !template.isHardCoded && (
                        <button
                            onClick={(e) => handleDeleteTemplate(e, template.templateName)}
                            className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                            title="Delete template permanently"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                    {isActive && (
                        <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                            <CheckCircle2 className="w-3 h-3" />
                            ACTIVE
                        </div>
                    )}
                 </div>
                {template.isHardCoded && (
                   <div className="absolute top-2 left-2 bg-gray-500/50 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      LOCAL
                   </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 bg-white">
                <p className="text-xs text-gray-500 mb-3">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {template.spreads?.length || 0} spreads • {(template.spreads?.length || 0) * 2} pages
                  </span>
                  <button
                    onClick={() => {
                        if (confirm("Switching templates will overwrite your current book. Are you sure?")) {
                            loadTemplate(template.spreads, template.templateName);
                        }
                    }}
                    className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "bg-[#2d2d2d] text-white hover:bg-[#404040]"
                    }`}
                  >
                    {isActive ? "Use Again" : "Use Template"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Blank template */}
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-[#2d2d2d] transition-all cursor-pointer group"
          onClick={() => {
            if (confirm("Start as blank book? Your current work will be lost.")) {
              loadTemplate([
                {
                  id: "blank-spread",
                  leftPage: { id: "blank-left", label: "Cover", elements: [], background: "#ffffff", isLocked: false },
                  rightPage: { id: "blank-right", label: "Page 1", elements: [], background: "#ffffff", isLocked: false },
                }
              ], "Blank Book");
            }
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
  const [targetSide, setTargetSide] = useState<"left" | "right">("right");

  const colors = [
    "#ffffff", "#f5f5f5", "#e5e7eb", "#2d2d2d", "#1a1a1a",
    "#9f2e2b", "#dc2626", "#ea580c", "#d97706", "#65a30d",
    "#0891b2", "#2563eb", "#7c3aed", "#db2777", "#f43f5e",
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex bg-gray-100 p-1 rounded-lg">
        <button 
          onClick={() => setTargetSide("left")}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${targetSide === "left" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
        >
          LEFT PAGE
        </button>
        <button 
          onClick={() => setTargetSide("right")}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${targetSide === "right" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
        >
          RIGHT PAGE
        </button>
      </div>

      <h3 className="text-sm font-medium text-gray-600">Colors</h3>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color) => {
          const targetPage = targetSide === "left" ? currentSpread?.leftPage : currentSpread?.rightPage;
          return (
            <button
              key={color}
              onClick={() => {
                if (targetPage && !targetPage.isLocked) {
                  updatePageBackground(targetPage.id, color);
                }
              }}
              className="w-full aspect-square rounded-lg border-2 border-gray-200 hover:border-[#2d2d2d] transition-all hover:scale-110"
              style={{ backgroundColor: color }}
             />
          );
        })}
      </div>
    </div>
  );
}

function StickersPanel() {
  const isAdmin = useEditorStore((s) => s.isAdmin);
  const addElement = useEditorStore((s) => s.addElement);
  const spreads = useEditorStore((s) => s.spreads);
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex);
  const currentSpread = spreads[currentSpreadIndex];
  const [targetSide, setTargetSide] = useState<"left" | "right">("right");

  const [stickers, setStickers] = useState<{ _id: string; url: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"premium" | "custom">("premium");

  // Premium Carnival Stickers (14 Curated High-End Stickers)
  const premiumStickers = [
    { id: "p1", url: "https://images.unsplash.com/photo-1543160732-23720935794b?q=80&w=300&auto=format&fit=crop", name: "Carnival Mask Gold" },
    { id: "p2", url: "https://images.unsplash.com/photo-1521404094228-56960b73c914?q=80&w=300&auto=format&fit=crop", name: "Beads & Jewelry" },
    { id: "p3", url: "https://images.unsplash.com/photo-1517457373958-b7bdd058a548?q=80&w=300&auto=format&fit=crop", name: "Feathered Headpiece" },
    { id: "p4", url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=300&auto=format&fit=crop", name: "Samba Costume" },
    { id: "p5", url: "https://images.unsplash.com/photo-1555436169-20d9321f92f6?q=80&w=300&auto=format&fit=crop", name: "Royal Crown" },
    { id: "p6", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=300&auto=format&fit=crop", name: "Festival Dancers" },
    { id: "p7", url: "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?q=80&w=300&auto=format&fit=crop", name: "Explosive Confetti" },
    { id: "p8", url: "https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=300&auto=format&fit=crop", name: "Mystic Mask Red" },
    { id: "p9", url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=300&auto=format&fit=crop", name: "Exotic Plumage" },
    { id: "p10", url: "https://images.unsplash.com/photo-1531058022187-017e408fc048?q=80&w=300&auto=format&fit=crop", name: "Midnight Mask" },
    { id: "p11", url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=300&auto=format&fit=crop", name: "Rhythm Drums" },
    { id: "p12", url: "https://images.unsplash.com/photo-1520110120305-6672fc927163?q=80&w=300&auto=format&fit=crop", name: "Tropical Paradise" },
    { id: "p13", url: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=300&auto=format&fit=crop", name: "Bright Feathers" },
    { id: "p14", url: "https://images.unsplash.com/photo-1514525253344-f814d0743b15?q=80&w=300&auto=format&fit=crop", name: "Party Vibe" },
  ];

  const fetchStickers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stickers?t=" + Date.now());
      if (res.ok) {
        const data = await res.json();
        setStickers(data.stickers || []);
      }
    } catch (err) {
      console.error("Failed to load stickers library", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStickers();
  }, [fetchStickers]);

  const { startUpload, isUploading } = useUploadThing("stickerUploader", {
    onClientUploadComplete: async (res) => {
      for (const file of res) {
        await fetch("/api/admin/stickers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: file.url, name: file.name }),
        });
      }
      toast.success(`${res.length} graphics uploaded and saved!`);
      fetchStickers();
    },
    onUploadError: (err) => toast.error(`Bulk upload failed: ${err.message}`),
  });

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
       targetPage = targetSide === "left" ? currentSpread.leftPage : currentSpread.rightPage;
    }

    if (!targetPage || targetPage.isLocked) return;

    addElement(targetPage.id, {
      type: "image",
      src: url,
      x: 100,
      y: 100,
      width: 150,
      height: 150,
      rotation: 0,
    });
    toast.message("Sticker added to spread", {
      description: "Graphic has been placed on the " + (targetPage === currentSpread.leftPage ? "left" : "right") + " page.",
    });
  };

  const currentStickers = activeTab === "premium" ? premiumStickers : stickers;

  return (
    <div className="flex flex-col h-full bg-[#fafafa]">
      <div className="border-b border-gray-100 px-5 py-4 bg-white shadow-sm">
        <h3 className="text-sm font-bold text-[#2d2d2d] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          Graphics Library
        </h3>
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1.5">Premium Carnival Assets</p>
      </div>

      <div className="px-5 pt-4 space-y-4 bg-white pb-4 border-b border-gray-100">
        <div>
          <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Target Page</label>
          <div className="grid grid-cols-2 bg-gray-50 border border-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setTargetSide("left")}
              className={`py-1 text-[9px] font-black rounded-lg transition-all ${targetSide === "left" ? "bg-white text-black shadow-sm ring-1 ring-gray-100" : "text-gray-400 hover:text-gray-600"}`}
            >
              LEFT PAGE
            </button>
            <button 
              onClick={() => setTargetSide("right")}
              className={`py-1 text-[9px] font-black rounded-lg transition-all ${targetSide === "right" ? "bg-white text-black shadow-sm ring-1 ring-gray-100" : "text-gray-400 hover:text-gray-600"}`}
            >
              RIGHT PAGE
            </button>
          </div>
        </div>

        {isAdmin && (
          <div>
            <label className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest block mb-1">Admin Tools</label>
            <label className={`w-full py-2 bg-orange-50 text-orange-600 border border-orange-200 border-dashed rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-orange-100 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
               {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
               <span className="text-[10px] font-bold uppercase tracking-tight">{isUploading ? 'Uploading...' : 'Bulk Add Graphics'}</span>
               <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => e.target.files?.length && startUpload(Array.from(e.target.files))}
               />
            </label>
          </div>
        )}

        <div className="flex bg-gray-50 border border-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab("premium")}
            className={`flex-1 py-1 text-[10px] font-extrabold rounded-md transition-all ${activeTab === "premium" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            PREMIUM
          </button>
          <button 
            onClick={() => setActiveTab("custom")}
            className={`flex-1 py-1 text-[10px] font-extrabold rounded-md transition-all ${activeTab === "custom" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            CUSTOM ({stickers.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {loading && activeTab === "custom" ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <p className="text-[10px] uppercase font-bold tracking-widest mt-3">Syncing Graphics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {currentStickers.map((sticker: any) => (
                <div 
                  key={sticker.id || sticker._id} 
                  className="relative aspect-square group cursor-pointer border border-gray-100 bg-white rounded-2xl overflow-hidden hover:border-[#2d2d2d] hover:shadow-xl transition-all flex items-center justify-center p-3"
                  onClick={() => handleStickerClick(sticker.url)}
                >
                  <img src={sticker.url} alt={sticker.name} className="w-full h-full object-contain pointer-events-none drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
            
            {activeTab === "custom" && stickers.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#2d2d2d]">No Custom Graphics</p>
                <p className="text-[9px] font-medium text-gray-400 mt-2 px-4 italic leading-relaxed">Admins can upload graphics above.</p>
              </div>
            )}
          </>
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

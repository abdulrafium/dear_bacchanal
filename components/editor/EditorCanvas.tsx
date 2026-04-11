"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group, Line } from "react-konva";
import { Html } from "react-konva-utils";
import { useEditorStore, EditorElement, BookPage } from "@/store/editor-store";
import Konva from "konva";
import { PAGE_LAYOUTS } from "@/lib/layouts";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { EditorPageTools } from "./EditorPageTools";
import { toast } from "sonner";

const PAGE_WIDTH = 400;
const PAGE_HEIGHT = 550;
const BLEED = 12;
const SAFE_MARGIN = 24;

function PageElement({
  el,
  pageId,
  isSelected,
  onSelect,
  pageIsLocked,
}: {
  el: EditorElement;
  pageId: string;
  isSelected: boolean;
  onSelect: () => void;
  pageIsLocked?: boolean;
}) {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const updateElement = useEditorStore((s) => s.updateElement);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(el.text || "");

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: any) => {
    updateElement(pageId, el.id, { x: e.target.x(), y: e.target.y() });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    updateElement(pageId, el.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const isAdmin = useEditorStore((s) => s.isAdmin);

  const canInteract = !isPreviewMode && (!pageIsLocked && !el.isLocked || isAdmin);

  const commonProps = {
    ref: shapeRef,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation,
    draggable: canInteract,
    onClick: canInteract ? onSelect : undefined,
    onTap: canInteract ? onSelect : undefined,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
  };

  const previewElement = useEditorStore((s) => s.previewElement);
  const displayEl = previewElement?.id === el.id ? { ...el, ...previewElement.updates } : el;

  const renderElement = () => {
    switch (displayEl.type) {
      case "text":
        return (
          <Text
            {...commonProps}
            text={displayEl.text || "Enter text"}
            fontSize={displayEl.fontSize || 18}
            fontFamily={displayEl.fontFamily || "Arial"}
            fill={displayEl.fill || "#000000"}
            align={displayEl.align || "left"}
            fontStyle={`${displayEl.fontStyle || ""}`.includes("bold") && `${displayEl.fontStyle || ""}`.includes("italic") ? "bold italic" : (`${displayEl.fontStyle || ""}`.includes("bold") ? "bold" : (`${displayEl.fontStyle || ""}`.includes("italic") ? "italic" : "normal"))}
            textDecoration={displayEl.fontStyle?.includes("underline") ? "underline" : "none"}
            padding={8}
            onDblClick={() => {
              if (!canInteract) return;
              setIsEditing(true);
              setEditValue(displayEl.text || "");
            }}
            visible={!isEditing}
          />
        );

      case "image":
        return <ImageElement {...commonProps} src={el.src || ""} />;

      case "sticker":
        return <ImageElement {...commonProps} src={el.src || ""} />;

      case "calendar":
        return <CalendarElement {...commonProps} el={el} pageId={pageId} canInteract={canInteract} />;

      case "shape":
        if (el.shapeType === "ellipse") {
          return (
            <Rect
              {...commonProps}
              fill={el.shapeFill || "transparent"}
              stroke={el.stroke || "#333"}
              strokeWidth={el.strokeWidth || 2}
              cornerRadius={Math.min(el.width, el.height) / 2}
            />
          );
        }
        return (
          <Rect
            {...commonProps}
            fill={el.shapeFill || "transparent"}
            stroke={el.stroke || "#333"}
            strokeWidth={el.strokeWidth || 2}
          />
        );

      case "qrcode":
        return (
          <Group {...commonProps}>
            <Rect
              width={el.width}
              height={el.height}
              fill="#ffffff"
              stroke="#000"
              strokeWidth={2}
            />
            <Rect
              x={el.width * 0.1} y={el.height * 0.1}
              width={el.width * 0.2} height={el.height * 0.2}
              fill="#000"
            />
            <Rect
              x={el.width * 0.7} y={el.height * 0.1}
              width={el.width * 0.2} height={el.height * 0.2}
              fill="#000"
            />
            <Rect
              x={el.width * 0.1} y={el.height * 0.7}
              width={el.width * 0.2} height={el.height * 0.2}
              fill="#000"
            />
            <Text
              text="QR CODE"
              width={el.width}
              y={el.height / 2 - 6}
              align="center"
              fontSize={12}
              fontStyle="bold"
              fill="#000"
            />
          </Group>
        );

      default:
        return (
          <Rect
            {...commonProps}
            fill="#ccc"
            stroke="#999"
            strokeWidth={1}
          />
        );
    }
  };

  return (
    <>
      {renderElement()}
      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
          anchorSize={typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 10}
          anchorCornerRadius={4}
          borderStroke="#3b82f6"
          borderStrokeWidth={2}
          anchorStroke="#3b82f6"
          anchorFill="#ffffff"
          rotateEnabled={!el.isLocked}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
        />
      )}
      {isEditing && (
         <Group
            x={el.x}
            y={el.y}
            width={el.width}
            height={el.height}
            rotation={el.rotation}
         >
            <Html>
               <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                     setIsEditing(false);
                     updateElement(pageId, el.id, { text: editValue });
                  }}
                  autoFocus
                  style={{
                     width: `${el.width}px`,
                     height: `${el.height}px`,
                     fontSize: `${el.fontSize || 18}px`,
                     fontFamily: el.fontFamily || "Arial",
                     color: el.fill || "#000000",
                     textAlign: (el.align as any) || "left",
                     fontWeight: el.fontStyle?.includes("bold") ? "bold" : "normal",
                     fontStyle: el.fontStyle?.includes("italic") ? "italic" : "normal",
                      textDecoration: el.fontStyle?.includes("underline") ? "underline" : "none",
                     background: (el.fill?.toLowerCase() === "#ffffff" || el.fill?.toLowerCase() === "white" || el.fill?.toLowerCase() === "#fff") ? "#1a1a1a" : "#f8fafc",
                     border: "2px solid #3b82f6",
                     borderRadius: "4px",
                     padding: "4px",
                     resize: "none",
                     overflow: "hidden",
                     outline: "none",
                     boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                     caretColor: el.fill || "#000000",
                     zIndex: 1000,
                  }}
                  onKeyDown={(e) => {
                     if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        setIsEditing(false);
                        updateElement(pageId, el.id, { text: editValue });
                     }
                     if (e.key === "Escape") {
                        setIsEditing(false);
                        setEditValue(el.text || "");
                     }
                  }}
               />
            </Html>
         </Group>
      )}
    </>
  );
}

function ImageElement(props: any) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (props.src) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = props.src;
      img.onload = () => setImage(img);
    }
  }, [props.src]);

  if (!image) {
    return (
      <Rect
        {...props}
        fill="#e5e7eb"
        stroke="#d1d5db"
        strokeWidth={1}
      />
    );
  }

  return <KonvaImage {...props} image={image} />;
}

function CalendarElement({
  el,
  pageId,
  canInteract,
  ...props
}: {
  el: EditorElement;
  pageId: string;
  canInteract: boolean;
  [key: string]: any;
}) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const settings = el.calendarSettings || { month: 0, year: 2026, data: {} };
  
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
  
  const days = Array.from({ length: daysInMonth(settings.month, settings.year) }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth(settings.month, settings.year) }, (_, i) => i);
  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  
  const cellWidth = el.width / 7;
  const headerHeight = 40;
  const subHeaderHeight = 25;
  const gridY = headerHeight + subHeaderHeight;
  const cellHeight = (el.height - gridY) / 6;

  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");


  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  return (
    <Group {...props} x={el.x} y={el.y} width={el.width} height={el.height} rotation={el.rotation} draggable={canInteract}>
      {/* Background with Grid */}
      <Rect
        width={el.width}
        height={el.height}
        fill="transparent"
        cornerRadius={8}
      />
      
      {/* Title */}
      <Text
        text={months[settings.month]}
        width={el.width}
        y={10}
        align="center"
        fontSize={24}
        fontStyle="bold"
        fill="#000"
        fontFamily="Boogaloo"
      />

      {/* WeekDays */}
      {weekDays.map((day, i) => (
        <Text
          key={day}
          text={day}
          x={i * cellWidth}
          y={headerHeight}
          width={cellWidth}
          align="center"
          fontSize={10}
          fontStyle="bold"
          fill="#000"
        />
      ))}

      {/* Days Grid */}
      {blanks.map((_, i) => (
        <Rect
          key={`blank-${i}`}
          x={(i % 7) * cellWidth}
          y={gridY + Math.floor(i / 7) * cellHeight}
          width={cellWidth}
          height={cellHeight}
          fill="transparent"
        />
      ))}

      {days.map((day, i) => {
        const index = i + blanks.length;
        const x = (index % 7) * cellWidth;
        const y = gridY + Math.floor(index / 7) * cellHeight;
        const dateKey = `${settings.year}-${String(settings.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const note = settings.data[dateKey] || "";

        return (
          <Group 
            key={day} 
            x={x} 
            y={y}
            onClick={() => {
              if (!canInteract) return;
              setEditingDate(dateKey);
              setEditValue(note);
            }}
          >
            <Rect
              width={cellWidth}
              height={cellHeight}
              fill={note ? "rgba(251,186,0,0.2)" : "transparent"} // Use brand yellow for filled nodes
            />
            <Text
              text={day.toString()}
              width={cellWidth}
              padding={4}
              fontSize={14}
              fill="#000"
              fontFamily="Boogaloo"
            />
            {note && (
              <Text
                text={note}
                width={cellWidth - 8}
                x={4}
                y={22}
                fontSize={8}
                fill="#2d2d2d"
                fontStyle="normal"
                wrap="char"
                fontFamily="Outfit"
              />
            )}
          </Group>
        );
      })}

      {editingDate && (
        <Html>
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Note for {editingDate}
              </h4>
              <textarea
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full h-32 p-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="What's happening today?..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingDate(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const newData = { ...settings.data };
                    if (editValue.trim()) {
                      newData[editingDate] = editValue;
                    } else {
                      delete newData[editingDate];
                    }
                    updateElement(pageId, el.id, {
                      calendarSettings: { ...settings, data: newData }
                    });
                    setEditingDate(null);
                    toast.success("Note saved!");
                  }}
                  className="flex-1 py-2.5 bg-[#2d2d2d] hover:bg-black text-white rounded-xl text-sm font-bold transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </Html>
      )}
    </Group>
  );
}

function PageCanvas({
  page,
  offsetX,
  isLocked,
}: {
  page: BookPage;
  offsetX: number;
  isLocked: boolean;
}) {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);

  return (
    <Group x={offsetX} y={0}>
      {/* Page background */}
      <Rect
        width={PAGE_WIDTH}
        height={PAGE_HEIGHT}
        fill={page.background}
        shadowBlur={8}
        shadowColor="rgba(0,0,0,0.15)"
        shadowOffsetY={2}
      />

      {/* Clipped content area */}
      <Group clipX={0} clipY={0} clipWidth={PAGE_WIDTH} clipHeight={PAGE_HEIGHT}>
        {/* Page elements */}
        {page.elements.map((el) => (
          <PageElement
            key={el.id}
            el={el}
            pageId={page.id}
            isSelected={selectedElementId === el.id}
            onSelect={() => selectElement(el.id)}
            pageIsLocked={isLocked}
          />
        ))}
      </Group>
    </Group>
  );
}

export function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const spreads = useEditorStore((s) => s.spreads);
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex);
  const zoom = useEditorStore((s) => s.zoom);
  const selectElement = useEditorStore((s) => s.selectElement);
  const addElement = useEditorStore((s) => s.addElement);
  const applyLayout = useEditorStore((s) => s.applyLayout);
  const nextSpread = useEditorStore((s) => s.nextSpread);
  const prevSpread = useEditorStore((s) => s.prevSpread);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const activeTemplateName = useEditorStore((s) => s.activeTemplateName);
  const templateLoaded = useEditorStore((s) => s.templateLoaded);
  const currentSpread = spreads[currentSpreadIndex];

  const stageRef = useRef<Konva.Stage>(null);
  const setStageRefStore = useEditorStore((s) => s.setStageRef);

  useEffect(() => {
    if (stageRef.current) {
      setStageRefStore(stageRef.current);
    }
  }, [setStageRefStore, spreads]); 

  // Real-time canvas refresh on state changes
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.batchDraw();
    }
  }, [spreads, useEditorStore((s) => s.previewElement)]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const viewMode = useEditorStore((s) => s.viewMode);
  const setViewMode = useEditorStore((s) => s.setViewMode);
  const [mobilePage, setMobilePage] = useState<"left" | "right">("left");

  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 1024) {
        if (viewMode !== "single") setViewMode("single");
      } else {
        if (viewMode !== "spread") setViewMode("spread");
      }
    };
    
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [viewMode, setViewMode]);

  const isSingle = viewMode === "single";
  const totalWidth = isSingle ? PAGE_WIDTH : (PAGE_WIDTH * 2 + 8);
  const totalHeight = PAGE_HEIGHT;

  const [fitScale, setFitScale] = useState(1);
  
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      const padding = isSingle ? 20 : 40;
      const s = Math.min(
        (containerSize.width - padding) / totalWidth,
        (containerSize.height - padding) / totalHeight
      );
      setFitScale(s);
    }
  }, [containerSize, totalWidth, totalHeight, isSingle]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const scale = (isMobile || isSingle) ? fitScale : (zoom / 100);
  
  const stageWidth = totalWidth * scale;
  const stageHeight = totalHeight * scale;
  const stageX = Math.max(0, (containerSize.width - stageWidth) / 2);
  const stageY = Math.max(0, (containerSize.height - stageHeight) / 2);

  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage() || e.target.getClassName() === "Rect") {
      const clickedOnElement = e.target.parent?.parent !== null && e.target.getClassName() !== "Rect";
      if (!clickedOnElement) {
        selectElement(null);
      }
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!currentSpread) return;

      const stageEl = containerRef.current;
      if (!stageEl) return;

      const rect = stageEl.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      
      const currentTotalWidth = isSingle ? PAGE_WIDTH : (PAGE_WIDTH * 2 + 8);
      const sWidth = currentTotalWidth * scale;
      const sX = Math.max(0, (containerSize.width - sWidth) / 2);
      
      const dropPosInStage = dropX - sX;
      let targetPage = null;

      if (isSingle) {
        targetPage = mobilePage === "left" ? currentSpread.leftPage : currentSpread.rightPage;
      } else {
        if (dropPosInStage >= 0 && dropPosInStage <= (PAGE_WIDTH * scale)) {
          targetPage = currentSpread.leftPage;
        } else if (dropPosInStage > (PAGE_WIDTH * scale + 8 * scale) && dropPosInStage <= sWidth) {
          targetPage = currentSpread.rightPage;
        }
      }

      if (!targetPage || targetPage.isLocked) return;

      const layoutId = e.dataTransfer.getData("application/layout-id");
      if (layoutId) {
        const layout = PAGE_LAYOUTS.find((l) => l.id === layoutId);
        if (layout) {
          const frames = layout.frames.map((frame) => ({
            type: "image" as const,
            x: frame.x * PAGE_WIDTH,
            y: frame.y * PAGE_HEIGHT,
            width: frame.width * PAGE_WIDTH,
            height: frame.height * PAGE_HEIGHT,
          }));
          applyLayout(targetPage.id, frames);
        }
        return;
      }

      const stickerUrl = e.dataTransfer.getData("application/sticker-url");
      if (stickerUrl) {
        addElement(targetPage.id, {
          type: "sticker",
          x: dropPosInStage / scale - 50,
          y: (e.clientY - rect.top - stageY) / scale - 50,
          width: 100,
          height: 100,
          rotation: 0,
          src: stickerUrl,
        });
        toast.success("Sticker added to page!");
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        toast.info("Use the 'Images' panel to upload photos.");
        imageFiles.forEach((file) => {
          const url = URL.createObjectURL(file);
          addElement(targetPage!.id, {
            type: "image",
            x: dropPosInStage / scale - 100,
            y: (e.clientY - rect.top - stageY) / scale - 75,
            width: 200,
            height: 150,
            rotation: 0,
            src: url,
          });
        });
      }
    },
    [currentSpread, scale, containerSize.width, addElement, applyLayout, isSingle, mobilePage, stageY]
  );

  if (!templateLoaded || !currentSpread) {
    return (
      <div ref={containerRef} className="w-full h-full bg-[#e8e8e8] flex items-center justify-center">
        <div className="text-center max-w-md px-8">
           <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto mb-6">
             <LayoutGrid className="w-10 h-10 text-gray-300" />
           </div>
           <h3 className="text-xl font-bold text-gray-700 mb-2">Select a Template</h3>
           <p className="text-gray-400 text-sm">Choose a book template from the panel on the left.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#e8e8e8] overflow-auto relative flex flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {isSingle && (
        <div className="flex justify-center gap-2 p-3 bg-white/40 backdrop-blur-sm z-20">
          <button 
            onClick={() => setMobilePage("left")}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mobilePage === "left" ? "bg-[#2d2d2d] text-white shadow-lg" : "bg-white text-gray-500"}`}
          >
            Left Page
          </button>
          <button 
            onClick={() => setMobilePage("right")}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mobilePage === "right" ? "bg-[#2d2d2d] text-white shadow-lg" : "bg-white text-gray-500"}`}
          >
            Right Page
          </button>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">


        {isPreviewMode && (
          <>
            <button
              onClick={prevSpread}
              disabled={currentSpreadIndex === 0}
              className="absolute left-2 md:left-5 top-1/2 -translate-y-1/2 z-20 text-gray-300 hover:text-gray-600 disabled:opacity-0"
            >
              <ChevronLeft className="w-12 h-12 sm:w-20 sm:h-20" />
            </button>
            <button
              onClick={nextSpread}
              disabled={currentSpreadIndex === spreads.length - 1}
              className="absolute right-2 md:right-5 top-1/2 -translate-y-1/2 z-20 text-gray-300 hover:text-gray-600 disabled:opacity-0"
            >
              <ChevronRight className="w-12 h-12 sm:w-20 sm:h-20" />
            </button>
          </>
        )}

        <div
          style={{
            position: "absolute",
            left: stageX,
            top: stageY,
            width: stageWidth,
            height: stageHeight,
          }}
        >
          <Stage
            ref={stageRef}
            width={stageWidth}
            height={stageHeight}
            scaleX={scale}
            scaleY={scale}
            onClick={handleStageClick}
          >
            <Layer>
              {isSingle ? (
                <PageCanvas
                  page={mobilePage === "left" ? currentSpread.leftPage : currentSpread.rightPage}
                  offsetX={0}
                  isLocked={mobilePage === "left" ? currentSpread.leftPage.isLocked : currentSpread.rightPage.isLocked}
                />
              ) : (
                <>
                  <PageCanvas page={currentSpread.leftPage} offsetX={0} isLocked={currentSpread.leftPage.isLocked} />
                  <Group x={PAGE_WIDTH} y={0}>
                    <Rect width={8} height={PAGE_HEIGHT} fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: 8, y: 0 }} fillLinearGradientColorStops={[0, "rgba(0,0,0,0.15)", 0.5, "rgba(0,0,0,0.05)", 1, "rgba(0,0,0,0.15)"]} />
                  </Group>
                  <PageCanvas page={currentSpread.rightPage} offsetX={PAGE_WIDTH + 8} isLocked={currentSpread.rightPage.isLocked} />
                </>
              )}
            </Layer>
          </Stage>

          {!isPreviewMode && (
            <div className="absolute top-0 w-full pointer-events-none" style={{ height: stageHeight }}>
              {(viewMode === "spread" || mobilePage === "left") && !currentSpread.leftPage.isLocked && (
                <div className="pointer-events-auto contents">
                  <EditorPageTools pageId={currentSpread.leftPage.id} align={isSingle ? "center" : "left"} />
                </div>
              )}
              {(viewMode === "spread" || mobilePage === "right") && !currentSpread.rightPage.isLocked && (
                <div className="pointer-events-auto contents">
                  <EditorPageTools pageId={currentSpread.rightPage.id} align={isSingle ? "center" : "right"} />
                </div>
              )}
            </div>
          )}

          <div className="flex w-full mt-4 text-[#2d2d2d] font-bold text-[10px] uppercase tracking-widest opacity-40">
            {isSingle ? (
              <div className="flex-1 text-center">{mobilePage === "left" ? currentSpread.leftPage.label : currentSpread.rightPage.label}</div>
            ) : (
              <>
                <div className="flex-1 text-center">{currentSpread.leftPage.label}</div>
                <div className="w-[8px]" />
                <div className="flex-1 text-center">{currentSpread.rightPage.label}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { LayoutGrid } from "lucide-react";

"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group, Circle } from "react-konva";
import { Html } from "react-konva-utils";
import { useEditorStore, EditorElement, BookPage } from "@/store/editor-store";
import Konva from "konva";
import { PAGE_LAYOUTS } from "@/lib/layouts";
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid, X, Edit3 } from "lucide-react";
import { EditorPageTools } from "./EditorPageTools";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing-client";

const PAGE_WIDTH = 400;
const PAGE_HEIGHT = 550;

function PageElement({
  el,
  pageId,
  isSelected,
  onSelect,
  pageIsLocked,
  onEditCalendarNote,
}: {
  el: EditorElement;
  pageId: string;
  isSelected: boolean;
  onSelect: () => void;
  pageIsLocked?: boolean;
  onEditCalendarNote?: (elId: string, pageId: string, dateKey: string, initialValue: string) => void;
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
  const isCircle = el.shapeType === "ellipse";

  const commonProps = {
    ref: shapeRef,
    id: el.id, // CRITICAL: Allow floating toolbar to find this node
    name: el.id,
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
      case "sticker":
        return <ImageElement {...commonProps} src={el.src || ""} />;

      case "calendar":
        return <CalendarElement {...commonProps} el={el} pageId={pageId} canInteract={canInteract} isPreviewMode={isPreviewMode} onEditNote={onEditCalendarNote} />;

      case "shape":
        return (
          <Rect
            {...commonProps}
            fill={el.shapeFill || "transparent"}
            stroke={el.stroke || "#333"}
            strokeWidth={el.strokeWidth || 2}
            cornerRadius={isCircle ? Math.min(el.width, el.height) / 2 : 0}
          />
        );

      case "photo-card":
        return <PhotoCardElement {...commonProps} el={el} pageId={pageId} canInteract={canInteract} />;

      default:
        return <Rect {...commonProps} fill="#ccc" stroke="#999" strokeWidth={1} />;
    }
  };

  return (
    <>
      {renderElement()}
      <PhotoCardInput el={el} pageId={pageId} isSelected={isSelected} />
      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
          anchorSize={typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 12}
          anchorCornerRadius={6}
          borderStroke="white"
          borderStrokeWidth={3}
          anchorStroke="rgba(0,0,0,0.2)"
          anchorFill="#ffffff"
          shadowBlur={10}
          shadowColor="rgba(0,0,0,0.3)"
          rotateEnabled={!el.isLocked}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
        />
      )}
      {isEditing && (
        <Group x={el.x} y={el.y} width={el.width} height={el.height} rotation={el.rotation}>
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
                fontFamily: el.fontFamily ? `'${el.fontFamily}', sans-serif` : "Arial",
                color: el.fill || "#000000",
                textAlign: (el.align as any) || "left",
                fontWeight: el.fontStyle?.includes("bold") ? "bold" : "normal",
                fontStyle: el.fontStyle?.includes("italic") ? "italic" : "normal",
                textDecoration: el.fontStyle?.includes("underline") ? "underline" : "none",
                background: "transparent",
                border: "2px solid #3b82f6",
                borderRadius: "4px",
                padding: "4px",
                resize: "none",
                outline: "none",
                lineHeight: "1.2",
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
  if (!image) return <Rect {...props} fill="#e5e7eb" stroke="#d1d5db" strokeWidth={1} />;
  return <KonvaImage {...props} image={image} />;
}

function PhotoCardElement({ el, pageId, canInteract, ...props }: any) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  useEffect(() => {
    if (el.src) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = el.src;
      img.onload = () => setImage(img);
    } else {
      setImage(null);
    }
  }, [el.src]);

  const isCircle = el.shapeType === "ellipse";

  return (
    <Group {...props}>
      {/* Base Card Background (Supports Rectangle and Circle) */}
      {isCircle ? (
        <Circle 
          x={el.width / 2}
          y={el.height / 2}
          radius={el.width / 2}
          fill="transparent" 
          stroke="white"
          strokeWidth={12}
          shadowBlur={10}
          shadowColor="rgba(0,0,0,0.15)"
        />
      ) : (
        <Rect 
          width={el.width} 
          height={el.height} 
          fill="transparent" 
          stroke="white"
          strokeWidth={12}
          shadowBlur={10}
          shadowColor="rgba(0,0,0,0.15)"
        />
      )}

      {/* Image Rendering with optimized Shape-Aware Clipping */}
      {image && (
        <Group clipFunc={(ctx) => {
          ctx.beginPath();
          if (isCircle) {
            ctx.arc(el.width / 2, el.height / 2, el.width / 2, 0, Math.PI * 2);
          } else {
            ctx.roundRect(0, 0, el.width, el.height, 4);
          }
          ctx.closePath();
        }}>
           <KonvaImage 
              image={image} 
              width={el.width} 
              height={el.height}
           />
        </Group>
      )}

      {/* Large Center (+) */}
      {!el.src && (
        <Group x={el.width / 2} y={el.height / 2}>
           <Circle radius={45} fill="rgba(255,255,255,0.05)" stroke="white" strokeWidth={2} opacity={0.6} />
           <Text text="+" fontSize={64} fill="white" x={-20} y={-38} fontFamily="Inter" fontStyle="100" opacity={0.6} />
        </Group>
      )}
    </Group>
  );
}

function PhotoCardInput({ el, pageId, isSelected }: any) {
  const { startUpload, isUploading } = useUploadThing("bookImageUploader");
  const updateElement = useEditorStore((s) => s.updateElement);

  if (!isSelected || el.type !== "photo-card" || el.src) return null;

  return (
    <Html>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}>
        {isUploading && (
           <div style={{ 
              position: 'absolute', top: el.y + el.height/2 - 20, left: el.x + el.width/2 - 20,
              width: 40, height: 40, background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
           }}>
              <div style={{ width: 24, height: 24, border: '3px solid #eee', borderTopColor: '#2d2d2d', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
           </div>
        )}
        <input 
          type="file" 
          accept="image/*"
          style={{ 
            position: 'absolute', top: el.y, left: el.x, width: el.width, height: el.height, 
            opacity: 0, cursor: 'pointer', pointerEvents: 'auto' 
          }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const res = await startUpload([file]);
            if (res?.[0]) {
               updateElement(pageId, el.id, { src: res[0].url });
               toast.success("Picture imported correctly!");
            }
          }}
        />
      </div>
    </Html>
  );
}

function CalendarElement({
  el,
  pageId,
  canInteract,
  isPreviewMode,
  onEditNote,
  ...props
}: {
  el: EditorElement;
  pageId: string;
  canInteract: boolean;
  isPreviewMode: boolean;
  onEditNote?: (elId: string, pageId: string, dateKey: string, initialValue: string) => void;
  [key: string]: any;
}) {
  const settings = el.calendarSettings || { month: 0, year: 2026, data: {} };
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth(settings.month, settings.year) }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth(settings.month, settings.year) }, (_, i) => i);
  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const cellWidth = el.width / 7;
  const headerHeight = 60;
  const subHeaderHeight = 30;
  const gridY = headerHeight + subHeaderHeight;
  const cellHeight = (el.height - gridY) / 6;
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  return (
    <Group {...props} x={el.x} y={el.y} width={el.width} height={el.height} rotation={el.rotation} draggable={canInteract}>
      <Rect width={el.width} height={el.height} fill="transparent" />
      <Text 
        text={months[settings.month]} 
        width={el.width} 
        y={10} 
        align="center" 
        fontSize={36} 
        fontStyle="900" 
        fill="#000" 
        fontFamily="Boogaloo"
        letterSpacing={2}
      />
      {weekDays.map((day, i) => (
        <Text key={day} text={day} x={i * cellWidth} y={headerHeight} width={cellWidth} align="center" fontSize={12} fontStyle="bold" fill="#000" opacity={0.6} />
      ))}
      <Group y={gridY}>
        {days.map((day, i) => {
          const index = i + blanks.length;
          const x = (index % 7) * cellWidth;
          const y = Math.floor(index / 7) * cellHeight;
          const dateKey = `${settings.year}-${String(settings.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const note = settings.data[dateKey] || "";

          return (
            <Group 
              key={day} x={x} y={y}
              onClick={(e) => {
                e.cancelBubble = true;
                if (!isPreviewMode && onEditNote) onEditNote(el.id, pageId, dateKey, note);
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                if (!isPreviewMode && onEditNote) onEditNote(el.id, pageId, dateKey, note);
              }}
            >
              <Rect width={cellWidth} height={cellHeight} fill="rgba(0,0,0,0)" hitStrokeWidth={10} />
              <Text 
                text={day.toString()} 
                width={cellWidth} 
                y={6}
                align="center"
                fontSize={el.fontSize || 16} 
                fill={el.fill || "#000"} 
                fontFamily={el.fontFamily || "Boogaloo"} 
                fontStyle={el.fontStyle?.includes("bold") ? "bold" : "normal"}
                opacity={0.8}
                listening={false}
              />
              {note && (
                <Group y={30} listening={false}>
                  <Text 
                    text={note} 
                    width={cellWidth - 8} 
                    x={4}
                    align="center"
                    fontSize={8} 
                    fill="#000" 
                    fontFamily="Outfit"
                    wrap="char"
                    ellipsis
                  />
                  <Circle x={cellWidth/2} y={15} radius={1.5} fill="#000" opacity={0.3} />
                </Group>
              )}
            </Group>
          );
        })}
      </Group>
    </Group>
  );
}

function PageCanvas({
  page,
  offsetX,
  onEditCalendarNote,
}: {
  page: BookPage;
  offsetX: number;
  onEditCalendarNote?: (elId: string, pageId: string, dateKey: string, initialValue: string) => void;
}) {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (page.background && (page.background.startsWith("http") || page.background.startsWith("data:") || page.background.startsWith("/"))) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = page.background;
      img.onload = () => setBgImage(img);
    } else {
      setBgImage(null);
    }
  }, [page.background]);

  return (
    <Group x={offsetX} y={0}>
      <Rect 
        width={PAGE_WIDTH} 
        height={PAGE_HEIGHT} 
        fill={bgImage ? undefined : page.background} 
        fillPatternImage={bgImage || undefined}
        fillPatternScale={{ 
            x: bgImage ? PAGE_WIDTH / bgImage.width : 1, 
            y: bgImage ? PAGE_HEIGHT / bgImage.height : 1 
        }}
        shadowBlur={8} 
        shadowColor="rgba(0,0,0,0.15)" 
        shadowOffsetY={2} 
      />
      <Group clipX={0} clipY={0} clipWidth={PAGE_WIDTH} clipHeight={PAGE_HEIGHT}>
        {page.elements.map((el) => (
          <PageElement
            key={el.id}
            el={el}
            pageId={page.id}
            isSelected={selectedElementId === el.id}
            onSelect={() => selectElement(el.id)}
            pageIsLocked={page.isLocked}
            onEditCalendarNote={onEditCalendarNote}
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
  const updateElement = useEditorStore((s) => s.updateElement);
  const nextSpread = useEditorStore((s) => s.nextSpread);
  const prevSpread = useEditorStore((s) => s.prevSpread);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const templateLoaded = useEditorStore((s) => s.templateLoaded);
  const currentSpread = spreads[currentSpreadIndex];

  const [editingCalendarNote, setEditingCalendarNote] = useState<{
    elementId: string;
    pageId: string;
    dateKey: string;
    initialValue: string;
    note: string;
  } | null>(null);
  const [calendarEditValue, setCalendarEditValue] = useState("");

  useEffect(() => {
    if (editingCalendarNote) setCalendarEditValue(editingCalendarNote.initialValue);
  }, [editingCalendarNote]);

  const stageRef = useRef<Konva.Stage>(null);
  const setStageRefStore = useEditorStore((s) => s.setStageRef);

  useEffect(() => {
    if (stageRef.current) setStageRefStore(stageRef.current);
  }, [setStageRefStore, spreads]);

  useEffect(() => {
    if (stageRef.current) stageRef.current.batchDraw();
  }, [spreads, useEditorStore((s) => s.previewElement)]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const viewMode = useEditorStore((s) => s.viewMode);
  const [mobilePage, setMobilePage] = useState<"left" | "right">("left");

  const isSingle = viewMode === "single";
  const totalWidth = isSingle ? PAGE_WIDTH : (PAGE_WIDTH * 2 + 8);
  const totalHeight = PAGE_HEIGHT;
  const [fitScale, setFitScale] = useState(1);
  
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      const padding = isSingle ? 20 : 40;
      const s = Math.min((containerSize.width - padding) / totalWidth, (containerSize.height - padding) / totalHeight);
      setFitScale(s);
    }
  }, [containerSize, totalWidth, totalHeight, isSingle]);

  const scale = (typeof window !== 'undefined' && window.innerWidth < 768 || isSingle) ? fitScale : (zoom / 100);
  const stageWidth = totalWidth * scale;
  const stageHeight = totalHeight * scale;
  const stageX = Math.max(0, (containerSize.width - stageWidth) / 2);
  const stageY = Math.max(0, (containerSize.height - stageHeight) / 2);

  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage() || e.target.getClassName() === "Rect") {
      const clickedOnElement = e.target.parent?.parent !== null && e.target.getClassName() !== "Rect";
      if (!clickedOnElement) selectElement(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!currentSpread) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dropX = e.clientX - rect.left;
    const sWidth = totalWidth * scale;
    const sX = Math.max(0, (containerSize.width - sWidth) / 2);
    const dropPosInStage = dropX - sX;
    let targetPage = isSingle ? (mobilePage === "left" ? currentSpread.leftPage : currentSpread.rightPage) : (dropPosInStage <= (PAGE_WIDTH * scale) ? currentSpread.leftPage : currentSpread.rightPage);
    if (!targetPage || targetPage.isLocked) return;

    const stickerUrl = e.dataTransfer.getData("application/sticker-url");
    if (stickerUrl) {
      addElement(targetPage.id, { type: "sticker", x: dropPosInStage / scale - 50, y: (e.clientY - rect.top - stageY) / scale - 50, width: 100, height: 100, rotation: 0, src: stickerUrl });
      toast.success("Sticker added!");
    }
  }, [currentSpread, scale, containerSize.width, addElement, isSingle, mobilePage, stageY, totalWidth]);

  if (!templateLoaded || !currentSpread) return <div ref={containerRef} className="w-full h-full bg-[#e8e8e8]" />;

  return (
    <div ref={containerRef} className="w-full h-full bg-[#f1f1f1] overflow-auto relative flex flex-col custom-scrollbar" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Kalam:wght@300;400;700&family=Poppins:wght@300;400;500;600;700;800;900&family=Luckiest+Guy&family=Caveat:wght@400;700&family=Pacifico&family=Anton&family=Bangers&family=Lobster&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&family=Playfair+Display:wght@400;700&family=Inter:wght@400;700&family=Boogaloo&family=Fredoka+One&family=Baloo+2:wght@400;700&family=Titan+ One&family=Architects+Daughter&family=Patrick+Hand&display=swap');
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; border: 2px solid #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #bbb; }
      `}} />
      {isSingle && (
        <div className="flex justify-center absolute top-4 left-1/2 -translate-x-1/2 z-[30] bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-200 p-1.5 gap-1 scale-90 sm:scale-100">
          <button 
            onClick={() => setMobilePage("left")} 
            className={`px-5 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 ${
              mobilePage === "left" ? "bg-black text-white shadow-md scale-105" : "text-gray-400 hover:text-gray-900"
            }`}
          >
            Left
          </button>
          <button 
            onClick={() => setMobilePage("right")} 
            className={`px-5 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 ${
              mobilePage === "right" ? "bg-black text-white shadow-md scale-105" : "text-gray-400 hover:text-gray-900"
            }`}
          >
            Right
          </button>
        </div>
      )}

      <div className="flex-1 relative">
        {isPreviewMode && (
          <>
            <button onClick={prevSpread} disabled={currentSpreadIndex === 0} className="absolute left-5 top-1/2 -translate-y-1/2 z-20 text-gray-300 hover:text-gray-600 disabled:opacity-0"><ChevronLeft className="w-20 h-20" /></button>
            <button onClick={nextSpread} disabled={currentSpreadIndex === spreads.length - 1} className="absolute right-5 top-1/2 -translate-y-1/2 z-20 text-gray-300 hover:text-gray-600 disabled:opacity-0"><ChevronRight className="w-20 h-20" /></button>
          </>
        )}

        <div style={{ position: "absolute", left: stageX, top: stageY, width: stageWidth, height: stageHeight }}>
          <Stage ref={stageRef} width={stageWidth} height={stageHeight} scaleX={scale} scaleY={scale} onClick={handleStageClick}>
            <Layer>
              {isSingle ? (
                <PageCanvas
                  page={mobilePage === "left" ? currentSpread.leftPage : currentSpread.rightPage}
                  offsetX={0}
                  onEditCalendarNote={(elId, pgId, date, val) => setEditingCalendarNote({ elementId: elId, pageId: pgId, dateKey: date, initialValue: val, note: val })}
                />
              ) : (
                <Group>
                  <PageCanvas 
                    page={currentSpread.leftPage} 
                    offsetX={0} 
                    onEditCalendarNote={(elId, pgId, date, val) => setEditingCalendarNote({ elementId: elId, pageId: pgId, dateKey: date, initialValue: val, note: val })}
                  />
                  <Group x={PAGE_WIDTH} y={0}>
                    <Rect width={8} height={PAGE_HEIGHT} fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: 8, y: 0 }} fillLinearGradientColorStops={[0, "rgba(0,0,0,0.15)", 0.5, "rgba(0,0,0,0.05)", 1, "rgba(0,0,0,0.15)"]} />
                  </Group>
                  <PageCanvas 
                    page={currentSpread.rightPage} 
                    offsetX={PAGE_WIDTH + 8} 
                    onEditCalendarNote={(elId, pgId, date, val) => setEditingCalendarNote({ elementId: elId, pageId: pgId, dateKey: date, initialValue: val, note: val })}
                  />
                </Group>
              )}
            </Layer>
          </Stage>

          {!isPreviewMode && (
            <div className="absolute top-0 w-full pointer-events-none" style={{ height: stageHeight }}>
              {(viewMode === "spread" || mobilePage === "left") && <EditorPageTools pageId={currentSpread.leftPage.id} align={isSingle ? "center" : "left"} />}
              {(viewMode === "spread" || mobilePage === "right") && <EditorPageTools pageId={currentSpread.rightPage.id} align={isSingle ? "center" : "right"} />}
            </div>
          )}

          <div className="flex w-full mt-4 text-[#2d2d2d] font-bold text-[10px] uppercase tracking-widest opacity-40">
            {isSingle ? <div className="flex-1 text-center">{mobilePage === "left" ? currentSpread.leftPage.label : currentSpread.rightPage.label}</div> : <><div className="flex-1 text-center">{currentSpread.leftPage.label}</div><div className="w-[8px]" /><div className="flex-1 text-center">{currentSpread.rightPage.label}</div></>}
          </div>
        </div>
      </div>

      {editingCalendarNote && (
        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            {/* Top Carnival bar */}
            <div className="h-2 bg-gradient-to-r from-[#fbba00] via-[#d22e56] to-[#009d94]" />
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <Calendar className="w-6 h-6 text-[#d22e56]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 leading-none">
                      {editingCalendarNote.dateKey.replace('-', ' ')}
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Calendar Note</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingCalendarNote(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5" />
                  Your Note
                </label>
                <textarea
                  value={editingCalendarNote.note}
                  onChange={(e) => setEditingCalendarNote({ ...editingCalendarNote, note: e.target.value })}
                  className="w-full h-32 p-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-[#009d94]/10 focus:border-[#009d94] outline-none text-xl text-black resize-none transition-all placeholder:text-gray-200 font-handwritten"
                  placeholder="Add something special about this day..."
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setEditingCalendarNote(null)}
                  className="flex-1 h-14 rounded-2xl border-2 border-gray-100 text-gray-900 font-bold hover:bg-gray-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const { elementId, pageId, dateKey, note } = editingCalendarNote;
                    const el = spreads.find(s => s.leftPage.id === pageId || s.rightPage.id === pageId)
                      ?.leftPage.elements.concat(
                        spreads.find(s => s.leftPage.id === pageId || s.rightPage.id === pageId)?.rightPage.elements || []
                      ).find(e => e.id === elementId) as EditorElement;

                    if (el) {
                      const newData = { ...(el.calendarSettings?.data || {}) };
                      if (note.trim()) {
                        newData[dateKey] = note;
                      } else {
                        delete newData[dateKey];
                      }

                      updateElement(pageId, elementId, {
                        calendarSettings: el.calendarSettings ? { 
                          ...el.calendarSettings, 
                          data: newData 
                        } : undefined
                      });
                    }
                    setEditingCalendarNote(null);
                  }}
                  className="flex-[1.5] h-14 rounded-2xl bg-black text-white font-black uppercase tracking-widest text-sm transition-all hover:bg-gray-900 shadow-xl shadow-black/10 active:scale-95"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

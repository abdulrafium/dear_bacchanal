"use client";

import { useRef, useEffect, useState, useCallback, memo } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group, Circle, Line } from "react-konva";
import { Html } from "react-konva-utils";
import { useEditorStore, EditorElement, BookPage, isFullyLockedSpread, isTemplateSpread } from "@/store/editor-store";
import Konva from "konva";
import { PAGE_LAYOUTS } from "@/lib/layouts";
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid, X, Edit3 } from "lucide-react";
import { EditorPageTools } from "./EditorPageTools";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing-client";

const PAGE_WIDTH = 500;
const PAGE_HEIGHT = 500;

const PageElement = memo(function PageElement({
  el,
  pageId,
  isSelected,
  onSelect,
  pageIsLocked,
  onEditCalendarNote,
  safeZoneRight,
}: {
  el: EditorElement;
  pageId: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  pageIsLocked?: boolean;
  onEditCalendarNote?: (elId: string, pageId: string, dateKey: string, initialValue: string) => void;
  safeZoneRight?: number; // right edge of the safe zone (px from page left) for capping textarea width
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
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex);
  const currentSpread = useEditorStore((s) => s.spreads[currentSpreadIndex]);
  const isTemplatePage = isTemplateSpread(currentSpread, isAdmin, currentSpreadIndex);

  const isDropdown = el.type === "text" && el.options && el.options.length > 0;
  const defaultPlaceholder = isDropdown ? "Select..." : "Enter Text";
  const isPlaceholderText = el.type === "text" && (!el.text || el.text === "Enter Text" || el.text === "Your Name" || el.text === "( Your Name )" || el.text === "Insert Your Name" || el.text === "Select...");
  const isFillableElement = isPlaceholderText || el.type === "image" || el.type === "photo-card" || el.type === "checkbox" || el.type === "calendar";

  const canInteract = !isPreviewMode && (!pageIsLocked && !el.isLocked || isAdmin) && (!isTemplatePage || isFillableElement);
  const canMove = !isPreviewMode && (!pageIsLocked && !el.isLocked || isAdmin) && !isTemplatePage;
  const isCircle = el.shapeType === "ellipse";

  const previewElement = useEditorStore((s) => s.previewElement);
  const displayEl = previewElement?.id === el.id ? { ...el, ...previewElement.updates } : el;

  const commonProps = {
    ref: shapeRef,
    id: el.id, // CRITICAL: Allow floating toolbar to find this node
    name: el.id,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation,
    shadowBlur: (displayEl as any)?.shadowBlur,
    shadowColor: (displayEl as any)?.shadowColor,
    shadowOffsetX: (displayEl as any)?.shadowOffsetX,
    shadowOffsetY: (displayEl as any)?.shadowOffsetY,
    draggable: canMove,
    onClick: canInteract ? () => onSelect(el.id) : undefined,
    onTap: canInteract ? () => onSelect(el.id) : undefined,
    onDragEnd: canMove ? handleDragEnd : undefined,
    onTransformEnd: canMove ? handleTransformEnd : undefined,
  };

  const renderElement = () => {
    switch (displayEl.type) {
      case "text": {
        const isDropdown = displayEl.options && displayEl.options.length > 0;
        const defaultPlaceholder = isDropdown ? "Select..." : "Enter Text";
        const isPlaceholderText = !displayEl.text || displayEl.text === "Enter Text" || displayEl.text === "Your Name" || displayEl.text === "( Your Name )" || displayEl.text === "Insert Your Name" || displayEl.text === "Select...";
        const displayFill = displayEl.fill || "#000000";
        return (
          <Text
            {...commonProps}
            width={isDropdown && el.width > 220 ? 220 : el.width}
            text={displayEl.text || defaultPlaceholder}
            fontSize={isDropdown && (displayEl.fontSize || 18) > 20 ? 20 : (displayEl.fontSize || 18)}
            fontFamily={displayEl.fontFamily || "Arial"}
            fill={displayFill}
            opacity={isPlaceholderText ? 0.75 : 1}
            align={displayEl.align || "left"}
            fontStyle={`${displayEl.fontStyle || ""}`.includes("bold") && `${displayEl.fontStyle || ""}`.includes("italic") ? "bold italic" : (`${displayEl.fontStyle || ""}`.includes("bold") ? "bold" : (`${displayEl.fontStyle || ""}`.includes("italic") ? "italic" : "normal"))}
            textDecoration={displayEl.fontStyle?.includes("underline") ? "underline" : "none"}
            padding={8}
            lineHeight={displayEl.lineHeight || 1.2}
            wrap="word"
            height={undefined}
            onClick={() => {
              if (!canInteract) return;
              if (isPlaceholderText || isDropdown) {
                // Single click on placeholder OR dropdown immediately opens edit mode
                setIsEditing(true);
                setEditValue(isPlaceholderText ? "" : (displayEl.text || ""));
              } else {
                // Normal click just selects
                if (commonProps.onClick) (commonProps.onClick as any)();
              }
            }}
            onDblClick={() => {
              if (!canInteract) return;
              setIsEditing(true);
              setEditValue(isPlaceholderText ? "" : (displayEl.text || ""));
            }}
            visible={!isEditing}
          />
        );
      }

      case "image":
      case "sticker":
        return <ImageElement {...commonProps} src={el.src || ""} />;

      case "checkbox": {
        const boxSize = displayEl.fontSize ? displayEl.fontSize : 24;
        const handleToggle = (e: any) => {
          if (isPreviewMode) return;
          updateElement(pageId, el.id, { isChecked: !el.isChecked });
          e.cancelBubble = true;
          if (canInteract && onSelect) onSelect(el.id);
        };
        return (
          <Group
            {...commonProps}
            onClick={handleToggle}
            onTap={handleToggle}
          >
            <Rect
              x={0}
              y={0}
              width={boxSize}
              height={boxSize}
              stroke={displayEl.fill || "#ffffff"}
              strokeWidth={2}
              fill="rgba(255,255,255,0.01)" // Guaranteed hit detection
            />
            {displayEl.isChecked && (
              <Text
                x={0}
                y={0}
                width={boxSize}
                height={boxSize}
                text="✓"
                fontFamily="'Caveat', cursive, sans-serif"
                fontSize={boxSize * 1.2}
                fill={displayEl.fill || "#ffffff"}
                align="center"
                verticalAlign="middle"
                listening={false}
              />
            )}
          </Group>
        );
      }

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
      {isSelected && !isPreviewMode && canMove && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
          anchorSize={8}
          anchorCornerRadius={4}
          anchorStroke="#9f2e2b"
          anchorStrokeWidth={2}
          anchorFill="#ffffff"
          shadowBlur={10}
          shadowColor="rgba(0,0,0,0.3)"
          rotateEnabled={!el.isLocked}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
        />
      )}
      {isEditing && (() => {
        const textareaId = `textarea-edit-${el.id}`;

        // Max width = distance from el.x to the safe zone right edge (don't overflow the dashed boundary)
        const maxWidth = safeZoneRight != null
          ? Math.max(el.width, safeZoneRight - el.x - 8) // 8px inner padding buffer
          : PAGE_WIDTH - el.x - 8;

        // Auto-resize: grows width by measuring widest line via a hidden span,
        // and grows height by reading scrollHeight.
        const autoResize = (node: HTMLTextAreaElement | null) => {
          if (!node) return;
          // Height: shrink to 'auto' first so scrollHeight reflects true content height
          node.style.height = "auto";
          node.style.height = `${Math.max(el.height, node.scrollHeight)}px`;

          // Width: use a hidden span to measure the widest line
          const lines = (node.value || "").split("\n");
          const widestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), "") || (displayEl.text || defaultPlaceholder);
          const span = document.createElement("span");
          Object.assign(span.style, {
            position: "fixed",
            top: "-9999px",
            left: "-9999px",
            visibility: "hidden",
            whiteSpace: "pre",
            fontSize: `${el.fontSize || 18}px`,
            fontFamily: el.fontFamily ? `'${el.fontFamily}', sans-serif` : "Arial",
            fontWeight: el.fontStyle?.includes("bold") ? "bold" : "normal",
            padding: "8px",
          });
          span.textContent = widestLine;
          document.body.appendChild(span);
          const measuredWidth = span.offsetWidth + 24;
          document.body.removeChild(span);
          // Grow up to maxWidth, then wrap (height will grow instead)
          const finalWidth = Math.min(Math.max(el.width, measuredWidth, 220), maxWidth);
          node.style.width = `${finalWidth}px`;
          node.style.minWidth = `${finalWidth}px`;
          // When capped at maxWidth, allow wrapping
          node.style.whiteSpace = measuredWidth >= maxWidth ? "pre-wrap" : "pre";
        };

        return (
          <Group x={el.x} y={el.y} width={el.width} height={el.height} rotation={el.rotation}>
            <Html>
              <style>{`
                #${textareaId}::placeholder { color: ${el.fill || "#000000"}; opacity: 0.75; }
              `}</style>
              {el.options && el.options.length > 0 ? (
                <select
                  id={textareaId}
                  value={editValue}
                  onChange={(e) => {
                    const finalValue = e.target.value;
                    setEditValue(finalValue);
                    setIsEditing(false);
                    
                    let newFontSize = 24; // Start from a good base size
                    if (el.fontSize && el.fontSize > 24) newFontSize = el.fontSize;

                    const span = document.createElement("span");
                    Object.assign(span.style, {
                      position: "fixed",
                      visibility: "hidden",
                      whiteSpace: "nowrap",
                      fontFamily: el.fontFamily ? `'${el.fontFamily}', sans-serif` : "Arial",
                      fontWeight: el.fontStyle?.includes("bold") ? "bold" : "normal",
                      fontSize: `${newFontSize}px`
                    });
                    span.textContent = finalValue;
                    document.body.appendChild(span);
                    
                    const targetWidth = el.width || 250;
                    while (newFontSize > 12) {
                      span.style.fontSize = `${newFontSize}px`;
                      if (span.offsetWidth <= targetWidth) {
                        break;
                      }
                      newFontSize -= 1;
                    }
                    document.body.removeChild(span);

                    updateElement(pageId, el.id, {
                      text: finalValue,
                      fontSize: newFontSize,
                    });
                  }}
                  onBlur={(e) => {
                    setIsEditing(false);
                    const finalValue = editValue.trim() === "" ? (displayEl.text || defaultPlaceholder) : editValue;
                    updateElement(pageId, el.id, {
                      text: finalValue,
                    });
                  }}
                  ref={(node) => {
                    if (node) {
                      node.focus();
                    }
                  }}
                  style={{
                    width: "max-content",
                    maxWidth: `${Math.max(el.width, 150)}px`,
                    fontSize: "13px",
                    fontFamily: el.fontFamily ? `'${el.fontFamily}', sans-serif` : "Arial",
                    color: "#374151", // text-gray-700
                    background: "#f9fafb", // bg-gray-50
                    border: "1px solid #e5e7eb", // border-gray-200
                    padding: "6px 10px",
                    borderRadius: "8px",
                    outline: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <option value="" disabled={!editValue}>
                    {editValue ? "✖ Clear Selection" : "Select an option..."}
                  </option>
                  {el.options.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <textarea
                  id={textareaId}
                  value={editValue}
                  onChange={(e) => {
                    setEditValue(e.target.value);
                    autoResize(e.target);
                  }}
                  placeholder={displayEl.text || defaultPlaceholder}
                  onBlur={(e) => {
                    const node = e.target as HTMLTextAreaElement;
                    setIsEditing(false);
                    const finalValue = editValue.trim() === "" ? (displayEl.text || defaultPlaceholder) : editValue;
                    updateElement(pageId, el.id, {
                      text: finalValue,
                      width: parseInt(node.style.width) || el.width,
                      height: parseInt(node.style.height) || el.height,
                    });
                  }}
                  ref={(node) => {
                    if (node) {
                      node.focus();
                      autoResize(node);
                    }
                  }}
                  style={{
                    width: `${Math.max(el.width, 220)}px`,
                    minWidth: `${Math.max(el.width, 220)}px`,
                    height: `${el.height}px`,
                    fontSize: `${el.fontSize || 18}px`,
                    fontFamily: el.fontFamily ? `'${el.fontFamily}', sans-serif` : "Arial",
                    color: el.fill || "#000000",
                    textAlign: (el.align as any) || "left",
                    fontWeight: el.fontStyle?.includes("bold") ? "bold" : "normal",
                    fontStyle: el.fontStyle?.includes("italic") ? "italic" : "normal",
                    textDecoration: el.fontStyle?.includes("underline") ? "underline" : "none",
                    background: "transparent",
                    border: "none",
                    padding: "8px",
                    resize: "none",
                    outline: "none",
                    lineHeight: el.lineHeight ? String(el.lineHeight) : "1.2",
                    overflow: "hidden",
                    whiteSpace: "pre",
                  }}
                />
              )}
            </Html>
          </Group>
        );
      })()}
    </>
  );
});

const globalImageCache: Record<string, HTMLImageElement> = {};

function getCachedImage(src: string | undefined): HTMLImageElement | null {
  if (!src) return null;
  const img = globalImageCache[src];
  if (img) {
    if (img.complete && img.naturalWidth === 0) {
      delete globalImageCache[src];
      return null;
    }
    return img;
  }
  return null;
}

/** Pre-load ALL image URLs from a spread into the global cache immediately and return a Promise */
export function preloadSpreadImages(spreads: any[]): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  
  const promises: Promise<void>[] = [];

  spreads.forEach((spread) => {
    [spread.leftPage, spread.rightPage].forEach((page) => {
      if (!page) return;
      
      const loadImg = (src: string) => {
        if (!src || getCachedImage(src)) return;
        promises.push(new Promise((resolve) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            globalImageCache[src] = img;
            resolve();
          };
          img.onerror = () => {
            console.warn("Failed to load image (broken state):", src);
            resolve();
          };
          img.src = src;
          setTimeout(() => resolve(), 15000);
        }));
      };

      if (page.background && (page.background.startsWith("http") || page.background.startsWith("data:") || page.background.startsWith("/"))) {
        loadImg(page.background);
      }
      
      (page.elements || []).forEach((el: any) => {
        let src = el.src;
        if (!src) return;
        if (src === '/assets/layer-13.png') src = '/assets/crix2.png';
        if (src.includes('crix2.PNG')) src = src.replace('crix2.PNG', 'crix2.png');
        if (src.includes('historyLayer.PNG')) src = src.replace('historyLayer.PNG', 'historyLayer.png');
        if (src.includes('banner.PNG')) src = src.replace('banner.PNG', 'banner.png');
        loadImg(src);
      });
    });
  });

  return Promise.all(promises).then(() => {});
}

function ImageElement(props: any) {
  // PATCH: Fix massive/blank layer-13.png rendering issue for existing saves
  // Maps uppercase .PNG extensions to lowercase .png to prevent Vercel 404s (Linux is case-sensitive)
  const actualSrc = (() => {
    const s = props.src;
    if (!s) return s;
    if (s === '/assets/layer-13.png') return '/assets/crix2.png';
    if (s.includes('crix2.PNG')) return s.replace('crix2.PNG', 'crix2.png');
    if (s.includes('historyLayer.PNG')) return s.replace('historyLayer.PNG', 'historyLayer.png');
    if (s.includes('banner.PNG')) return s.replace('banner.PNG', 'banner.png');
    return s;
  })();
  
  const [image, setImage] = useState<HTMLImageElement | null>(getCachedImage(actualSrc));
  useEffect(() => {
    if (actualSrc) {
      const cached = getCachedImage(actualSrc);
      if (cached) {
        setImage(cached);
        return;
      }
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = actualSrc;
      img.onload = () => {
        globalImageCache[actualSrc] = img;
        setImage(img);
      };
    }
  }, [actualSrc]);
  if (!image) return <Rect {...props} fill="#e5e7eb" stroke="#d1d5db" strokeWidth={1} />;
  return <KonvaImage {...props} image={image} />;
}

function PhotoCardElement({ el, pageId, canInteract, ...props }: any) {
  const [image, setImage] = useState<HTMLImageElement | null>(getCachedImage(el.src));

  useEffect(() => {
    if (el.src) {
      const cached = getCachedImage(el.src);
      if (cached) {
        setImage(cached);
        return;
      }
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = el.src;
      img.onload = () => {
        globalImageCache[el.src] = img;
        setImage(img);
      };
    } else {
      setImage(null);
    }
  }, [el.src]);

  const isCircle = el.shapeType === "ellipse";

  const handleEmptyClick = (e: any) => {
    const isPreview = useEditorStore.getState().isPreviewMode;
    if (!el.src && !isPreview) {
      e.cancelBubble = true; // prevent default select (we'll handle it)
      useEditorStore.getState().selectElement(el.id);
      useEditorStore.getState().setSidebarPanel("images");
    }
  };

  return (
    <Group {...props}>
      {/* Base Card Background (Supports Rectangle and Circle) */}
      {isCircle ? (
        <Circle
          x={el.width / 2}
          y={el.height / 2}
          radius={el.width / 2}
          fill={el.src ? "transparent" : "rgba(0,0,0,0.1)"}
          stroke="white"
          strokeWidth={12}
          shadowBlur={10}
          shadowColor="rgba(0,0,0,0.15)"
          onClick={handleEmptyClick}
          onTap={handleEmptyClick}
        />
      ) : (
        <Rect
          width={el.width}
          height={el.height}
          fill={el.src ? "transparent" : "rgba(0,0,0,0.1)"}
          stroke="white"
          strokeWidth={12}
          shadowBlur={10}
          shadowColor="rgba(0,0,0,0.15)"
          onClick={handleEmptyClick}
          onTap={handleEmptyClick}
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
        <Group
          x={el.width / 2}
          y={el.height / 2}
          onClick={handleEmptyClick}
          onTap={handleEmptyClick}
        >
          <Circle radius={45} fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth={2} opacity={0.8} />
          <Text text="+" fontSize={64} fill="white" x={-20} y={-38} fontFamily="Inter" fontStyle="100" />
        </Group>
      )}
    </Group>
  );
}

function PhotoCardInput({ el, pageId, isSelected }: any) {
  // We no longer overlay an invisible <input> here because it doesn't map correctly 
  // with canvas scaling and offsets. Users now click the "+" icon to open the images sidebar.
  return null;
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
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cellWidth = el.width / 7;
  const headerHeight = 60;
  const subHeaderHeight = 30;
  const gridY = headerHeight + subHeaderHeight;
  const cellHeight = (el.height - gridY) / 6;
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  return (
    <Group {...props} x={el.x} y={el.y} width={el.width} height={el.height} rotation={el.rotation} draggable={canInteract}>
      <Rect width={el.width} height={el.height} fill="transparent" />
      {!settings.hideTitle && (
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
      )}
      {weekDays.map((day, i) => (
        <Text
          key={day}
          text={day}
          x={i * cellWidth}
          y={headerHeight}
          width={cellWidth}
          align="center"
          fontSize={el.fontSize ? el.fontSize + 4 : 20}
          fontFamily="Caveat"
          fontStyle="bold"
          fill={el.fill || "#000"}
          stroke={el.fill || "#000"}
          strokeWidth={0.8}
          opacity={0.8}
        />
      ))}
      <Group y={gridY}>
        {days.map((day, i) => {
          const index = i + blanks.length;
          const x = (index % 7) * cellWidth;
          const y = Math.floor(index / 7) * cellHeight;
          const dateKey = `${settings.year}-${String(settings.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const fullWeekDays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
          const dayName = fullWeekDays[index % 7];
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
                fontSize={16}
                fontStyle="bold"
                fill="#000"
                opacity={0.6}
                listening={false}
              />
              {note && (
                <Group y={4} x={cellWidth / 2} rotation={-8} listening={false}>
                  <Text
                    text={`${note.trim().toUpperCase()}\n${dayName}`}
                    width={cellWidth * 1.5}
                    offsetX={(cellWidth * 1.5) / 2}
                    align="center"
                    fontSize={11}
                    fill="#fff"
                    stroke="#000"
                    strokeWidth={3}
                    lineJoin="round"
                    fontFamily="Luckiest Guy"
                    lineHeight={1}
                  />
                  <Text
                    text={`${note.trim().toUpperCase()}\n${dayName}`}
                    width={cellWidth * 1.5}
                    offsetX={(cellWidth * 1.5) / 2}
                    align="center"
                    fontSize={11}
                    fill="#fff"
                    fontFamily="Luckiest Guy"
                    lineHeight={1}
                  />
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
  hasShadow = true,
}: {
  page: BookPage;
  offsetX: number;
  onEditCalendarNote?: (elId: string, pageId: string, dateKey: string, initialValue: string) => void;
  hasShadow?: boolean;
}) {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const isGeneratingPdf = useEditorStore((s) => s.isGeneratingPdf);

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(
    getCachedImage(page.background)
  );

  useEffect(() => {
    if (page.background && (page.background.startsWith("http") || page.background.startsWith("data:") || page.background.startsWith("/"))) {
      const cached = getCachedImage(page.background);
      if (cached) {
        setBgImage(cached);
        return;
      }
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = page.background;
      img.onload = () => {
        globalImageCache[page.background!] = img;
        setBgImage(img);
      };
    } else {
      setBgImage(null);
    }
  }, [page.background]);

  return (
    <Group x={offsetX} y={0}>
      <Rect
        x={0}
        width={PAGE_WIDTH}
        height={PAGE_HEIGHT}
        fill={bgImage ? undefined : page.background}
        fillPatternImage={bgImage || undefined}
        fillPatternScale={{
          x: bgImage ? PAGE_WIDTH / bgImage.width : 1,
          y: bgImage ? PAGE_HEIGHT / bgImage.height : 1
        }}
        perfectDrawEnabled={false}
        shadowBlur={(isGeneratingPdf || !hasShadow) ? 0 : 8}
        shadowColor={(isGeneratingPdf || !hasShadow) ? "transparent" : "rgba(0,0,0,0.15)"}
        shadowOffsetY={(isGeneratingPdf || !hasShadow) ? 0 : 2}
      />
      <Group clipX={0} clipY={0} clipWidth={PAGE_WIDTH} clipHeight={PAGE_HEIGHT}>
        {page.elements.map((el) => {
          // Compute safe zone right boundary so textarea doesn't overflow the dashed line
          const _state = useEditorStore.getState();
          const _isCover = _state.currentSpreadIndex === 0;
          const _isLeft = page.id === _state.spreads[_state.currentSpreadIndex]?.leftPage.id;
          let _safeRight: number;
          if (_isCover) {
            _safeRight = _isLeft ? (35.08 + 456.15) : (8.77 + 456.15);
          } else {
            _safeRight = _isLeft ? (PAGE_WIDTH - 5.77) : (PAGE_WIDTH - 5.77);
          }
          return (
            <PageElement
              key={el.id}
              el={el}
              pageId={page.id}
              isSelected={selectedElementId === el.id}
              onSelect={selectElement}
              pageIsLocked={page.isLocked}
              onEditCalendarNote={onEditCalendarNote}
              safeZoneRight={_safeRight}
            />
          );
        })}
        {/* SAFE ZONE OVERLAY */}
        {!isGeneratingPdf && (() => {
          const spreads = useEditorStore.getState().spreads;
          const currentSpreadIndex = useEditorStore.getState().currentSpreadIndex;
          const isCover = currentSpreadIndex === 0;
          const isLeftPage = page.id === spreads[currentSpreadIndex].leftPage.id;

          let safeX = 16;
          let safeY = 16;
          let safeWidth = PAGE_WIDTH - 32;
          let safeHeight = PAGE_HEIGHT - 32;

          if (isCover) {
            // Perfect physical mapping for 570x300mm Cover (Ratio mapped to 1000x500px UI)
            // Left page represents 285mm: 20mm bleed (35.08px), 260mm face (456.15px), 5mm spine (8.77px)
            // Right page represents 285mm: 5mm spine (8.77px), 260mm face (456.15px), 20mm bleed (35.08px)
            // Height represents 300mm: 20mm bleed (33.33px), 260mm face (433.34px), 20mm bleed (33.33px)

            safeY = 33.33;
            safeHeight = 433.34;

            if (isLeftPage) {
              // Left Page (Back Cover)
              safeX = 35.08;
              safeWidth = 456.15;
            } else {
              // Right Page (Front Cover)
              safeX = 8.77;
              safeWidth = 456.15;
            }
          } else {
            // Inner Pages: To make the design perfectly continuous across the spread,
            // we remove the bleed margin in the center so the safe zones touch.
            // 500px = 260mm => 3mm margin = 5.77px
            safeY = 5.77;
            safeHeight = PAGE_HEIGHT - 11.54;

            if (isLeftPage) {
              safeX = 5.77;
              safeWidth = PAGE_WIDTH - 5.77; // Touches the right edge (center of spread)
            } else {
              safeX = 0; // Touches the left edge (center of spread)
              safeWidth = PAGE_WIDTH - 5.77;
            }
          }

          return (
            <Rect
              x={safeX}
              y={safeY}
              width={safeWidth}
              height={safeHeight}
              stroke="#00e5ff"
              strokeWidth={1.5}
              dash={[6, 4]}
              opacity={isCover ? 1 : 0.8}
              listening={false}
            />
          );
        })()}
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
  const isGeneratingPdf = useEditorStore((s) => s.isGeneratingPdf);
  const isAdmin = useEditorStore((s) => s.isAdmin);
  const currentSpread = spreads[currentSpreadIndex];

  const isLockedSpread = isFullyLockedSpread(currentSpread, isAdmin, currentSpreadIndex);
  const isTemplatePage = isTemplateSpread(currentSpread, isAdmin, currentSpreadIndex);

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

  const handleEditCalendarNote = useCallback((elId: string, pgId: string, date: string, val: string) => {
    setEditingCalendarNote({ elementId: elId, pageId: pgId, dateKey: date, initialValue: val, note: val });
  }, []);

  const stageRef = useRef<Konva.Stage>(null);
  const setStageRefStore = useEditorStore((s) => s.setStageRef);

  useEffect(() => {
    if (stageRef.current) setStageRefStore(stageRef.current);
    preloadSpreadImages(spreads); // Pre-load all images for fast rendering
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
  const gap = -1; // -1px overlap so page backgrounds cover the center seam artifact
  const totalWidth = isSingle ? PAGE_WIDTH : (PAGE_WIDTH * 2 + gap);
  const totalHeight = PAGE_HEIGHT;
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      const padding = isSingle ? 40 : 80;
      const s = Math.min((containerSize.width - padding) / totalWidth, (containerSize.height - padding) / totalHeight);
      setFitScale(s);
    }
  }, [containerSize, totalWidth, totalHeight, isSingle]);

  // Always fit to container — zoom adjusts within fit, never causes scroll
  const scale = fitScale * Math.min(1, zoom / 100);
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
    if (!targetPage || targetPage.isLocked || isLockedSpread || isTemplateSpread(currentSpread, isAdmin, currentSpreadIndex)) return;

    const stickerUrl = e.dataTransfer.getData("application/sticker-url");
    if (stickerUrl) {
      addElement(targetPage.id, { type: "sticker", x: dropPosInStage / scale - 50, y: (e.clientY - rect.top - stageY) / scale - 50, width: 100, height: 100, rotation: 0, src: stickerUrl });
      toast.success("Sticker added!");
    }
  }, [currentSpread, scale, containerSize.width, addElement, isSingle, mobilePage, stageY, totalWidth]);

  if (!templateLoaded || !currentSpread) return <div ref={containerRef} className="w-full h-full bg-[#e8e8e8]" />;

  return (
    <div ref={containerRef} className="w-full h-full bg-[#f1f1f1] overflow-hidden relative flex flex-col custom-scrollbar" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <style dangerouslySetInnerHTML={{
        __html: `
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
            className={`px-5 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 ${mobilePage === "left" ? "bg-black text-white shadow-md scale-105" : "text-gray-400 hover:text-gray-900"
              }`}
          >
            Left
          </button>
          <button
            onClick={() => setMobilePage("right")}
            className={`px-5 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 ${mobilePage === "right" ? "bg-black text-white shadow-md scale-105" : "text-gray-400 hover:text-gray-900"
              }`}
          >
            Right
          </button>
        </div>
      )}
      <div className="flex-1 relative overflow-hidden">
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
                  onEditCalendarNote={handleEditCalendarNote}
                  hasShadow={true}
                />
              ) : (
                <Group>
                  {!isGeneratingPdf && (
                    <Rect
                      x={0}
                      y={0}
                      width={PAGE_WIDTH * 2}
                      height={PAGE_HEIGHT}
                      fill="white"
                      shadowBlur={8}
                      shadowColor="rgba(0,0,0,0.15)"
                      shadowOffsetY={2}
                    />
                  )}
                  <PageCanvas
                    page={currentSpread.leftPage}
                    offsetX={0}
                    onEditCalendarNote={handleEditCalendarNote}
                    hasShadow={false}
                  />
                  <PageCanvas
                    page={currentSpread.rightPage}
                    offsetX={PAGE_WIDTH + gap}
                    onEditCalendarNote={handleEditCalendarNote}
                    hasShadow={false}
                  />
                </Group>
              )}
            </Layer>
          </Stage>

          {/* Locked Spread Overlay */}
          {isLockedSpread && !isPreviewMode && (
            <div
              className="absolute top-0 left-0 w-full z-[50]"
              style={{ height: stageHeight, pointerEvents: "all", cursor: "not-allowed" }}
            />
          )}

          {!isPreviewMode && (
            <div className="absolute top-0 w-full pointer-events-none" style={{ height: stageHeight }}>
              {(viewMode === "spread" || mobilePage === "left") && !isLockedSpread && !isTemplatePage && <EditorPageTools pageId={currentSpread.leftPage.id} align={isSingle ? "center" : "left"} />}
              {(viewMode === "spread" || mobilePage === "right") && !isLockedSpread && !isTemplatePage && <EditorPageTools pageId={currentSpread.rightPage.id} align={isSingle ? "center" : "right"} />}
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

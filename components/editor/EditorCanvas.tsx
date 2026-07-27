"use client";

import { useRef, useEffect, useState, useCallback, memo, forwardRef } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group, Circle, Line, Path } from "react-konva";
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
  onSelect,
  pageIsLocked,
  isTemplatePage,
  onEditCalendarNote,
  safeZoneRight,
}: {
  el: EditorElement;
  pageId: string;
  onSelect: (id: string) => void;
  pageIsLocked?: boolean;
  isTemplatePage?: boolean;
  onEditCalendarNote?: (elId: string, pageId: string, dateKey: string, initialValue: string) => void;
  safeZoneRight?: number; // right edge of the safe zone (px from page left) for capping textarea width
}) {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const isSelected = useEditorStore((s) => s.selectedElementId === el.id);
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

  const isDropdown = el.type === "text" && el.options && el.options.length > 0;
  const defaultPlaceholder = isDropdown ? "Select..." : "Enter Text";

  // Name field check (e.g. "Your Name", "(Your name)", "( Your Name )", "Insert Your Name")
  const isNameField = el.type === "text" && (
    (el as any).isNameField ||
    el.text?.toLowerCase().includes("your name") ||
    el.text?.toLowerCase().includes("insert name") ||
    el.text?.toLowerCase().includes("(your name)") ||
    el.text?.toLowerCase().includes("( your name )")
  );

  // A text is a placeholder if it matches default placeholder text, OR if the customer has already edited it
  const isPlaceholderText = el.type === "text" && (
    !el.text || 
    el.text === "Enter Text" || 
    isNameField || 
    el.text === "Select..." || 
    (el as any).customerEdited
  );

  // An "Enter Text" field is a placeholder text field that is NOT the Page 1/2 Name field
  const isEnterTextField = isPlaceholderText && !isNameField;

  // Customers can interact with photo-cards, checkboxes, calendars, dropdowns, and text placeholders (including Name field)
  const isCustomerInteractable = el.type === "photo-card" || el.type === "checkbox" || el.type === "calendar" || isDropdown || isPlaceholderText;
  
  const canInteract = !isPreviewMode && (
    isAdmin || 
    isCustomerInteractable
  );
  
  // Customers can move/resize frames (photo-cards) AND "Enter Text" fields.
  // They CANNOT move or resize checkboxes, calendars, static headers, or the Page 1/2 Name field.
  const isCustomerMovable = el.type === "photo-card" || isEnterTextField;
  const canMove = !isPreviewMode && (
    isAdmin ||
    isCustomerMovable
  );
  
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
    opacity: (displayEl as any)?.opacity ?? 1,
    onClick: canInteract
      ? (e: any) => { e.cancelBubble = true; onSelect(el.id); }
      : (e: any) => { e.cancelBubble = true; onSelect(null as any); },
    onTap: canInteract
      ? (e: any) => { e.cancelBubble = true; onSelect(el.id); }
      : (e: any) => { e.cancelBubble = true; onSelect(null as any); },
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
            // Show I-beam cursor on hover for text elements
            onMouseEnter={(e: any) => {
              if (!canInteract) return;
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = isDropdown ? "pointer" : "text";
            }}
            onMouseLeave={(e: any) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = "default";
            }}
            onClick={(e: any) => {
              if (!canInteract) return;
              e.cancelBubble = true;
              // Always open editor on single click — select the element AND start editing
              onSelect(el.id);
              if (isDropdown) {
                setIsEditing(true);
                setEditValue(displayEl.text || "");
              } else {
                setIsEditing(true);
                setEditValue(isPlaceholderText ? "" : (displayEl.text || ""));
              }
            }}
            onTap={(e: any) => {
              if (!canInteract) return;
              e.cancelBubble = true;
              onSelect(el.id);
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
            fill={!el.shapeFill ? "transparent" : el.shapeFill}
            stroke={el.stroke || "#333"}
            strokeWidth={el.strokeWidth || 2}
            cornerRadius={isCircle ? Math.min(el.width, el.height) / 2 : 0}
          />
        );

      case "photo-card":
        return <PhotoCardElement {...commonProps} el={el} pageId={pageId} canInteract={canInteract} isSelected={isSelected} />;

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
          rotateEnabled={!el.isLocked && el.type !== "photo-card"}
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

                    let newFontSize = 18;
                    if (finalValue) {
                      newFontSize = 24; // Start from a good base size
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
                    }

                    const updatePayload: any = {
                      text: finalValue,
                      fontSize: newFontSize,
                    };
                    if (!isAdmin) updatePayload.customerEdited = true;

                    updateElement(pageId, el.id, updatePayload);
                  }}
                  onBlur={() => {
                    setIsEditing(false);
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
                  <option value="">
                    {editValue ? "✖ Clear Selection (Reset to Select...)" : "Select an option..."}
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
                  placeholder={defaultPlaceholder}
                  onBlur={(e) => {
                    const node = e.target as HTMLTextAreaElement;
                    const finalValue = editValue.trim() === "" ? "" : editValue;
                    setIsEditing(false);
                    
                    const updatePayload: any = {
                      text: finalValue,
                      width: parseInt(node.style.width) || el.width,
                      height: parseInt(node.style.height) || el.height,
                    };
                    
                    if (!isAdmin) updatePayload.customerEdited = true;
                    if (isNameField) updatePayload.isNameField = true;
                    
                    updateElement(pageId, el.id, updatePayload);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      // Escape: discard changes and exit
                      e.preventDefault();
                      setIsEditing(false);
                    }
                    // Ctrl+Enter or Cmd+Enter: confirm and exit
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      (e.target as HTMLTextAreaElement).blur();
                    }
                  }}
                  ref={(node) => {
                    if (node) {
                      node.focus();
                      // Place cursor at end of text
                      const len = node.value.length;
                      node.setSelectionRange(len, len);
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

/** Pre-load image URLs from spreads into the global cache and return a Promise.
 *  Preloads ALL spreads immediately so the loading screen waits for the entire book.
 */
export function preloadSpreadImages(spreads: any[], onProgress?: (progress: number) => void): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  const collectSrcs = (spread: any): string[] => {
    const srcs: string[] = [];
    [spread?.leftPage, spread?.rightPage].forEach((page) => {
      if (!page) return;
      if (page.background && (page.background.startsWith("http") || page.background.startsWith("data:") || page.background.startsWith("/"))) {
        srcs.push(page.background);
      }
      (page.elements || []).forEach((el: any) => {
        let src = el.src;
        if (!src) return;
        if (src === '/assets/layer-13.png') src = '/assets/crix2.png';
        if (src.includes('crix2.PNG')) src = src.replace('crix2.PNG', 'crix2.png');
        if (src.includes('historyLayer.PNG')) src = src.replace('historyLayer.PNG', 'historyLayer.png');
        if (src.includes('banner.PNG')) src = src.replace('banner.PNG', 'banner.png');
        srcs.push(src);
      });
    });
    return srcs;
  };

  const allSrcs = Array.from(new Set(spreads.flatMap(spread => collectSrcs(spread))));
  if (allSrcs.length === 0) {
    if (onProgress) onProgress(100);
    return Promise.resolve();
  }

  let loadedCount = 0;
  const updateProgress = () => {
    loadedCount++;
    const percentage = Math.min(100, Math.round((loadedCount / allSrcs.length) * 100));
    if (onProgress) onProgress(percentage);
  };

  const loadImg = (src: string): Promise<void> => {
    if (!src || getCachedImage(src)) {
      updateProgress();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const img = new window.Image();
      if (src.startsWith("http")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = async () => {
        try {
          await img.decode();
        } catch (e) {
          // Ignore decode errors
        }
        globalImageCache[src] = img;
        updateProgress();
        resolve();
      };
      img.onerror = () => { console.warn("Failed to preload image:", src); updateProgress(); resolve(); };
      img.src = src;
      setTimeout(() => { updateProgress(); resolve(); }, 30000); // 30s timeout fallback
    });
  };

  return (async () => {
    // Increased batch size from 5 to 20 to aggressively load background pages faster
    const batchSize = 20;
    for (let i = 0; i < allSrcs.length; i += batchSize) {
      const batch = allSrcs.slice(i, i + batchSize);
      await Promise.all(batch.map(loadImg));
    }
  })();
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
    if (s.startsWith('blob:')) return "";
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
      if (actualSrc.startsWith("http")) {
        img.crossOrigin = "anonymous";
      }
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

const PhotoCardElement = forwardRef<any, any>(({ el, pageId, canInteract, isSelected, ...props }, ref) => {
  const actualSrc = el.src?.startsWith("blob:") ? "" : el.src;
  const [image, setImage] = useState<HTMLImageElement | null>(getCachedImage(actualSrc));
  const [isLoading, setIsLoading] = useState(false);
  const [isPanningMode, setIsPanningMode] = useState(false);

  useEffect(() => {
    if (!isSelected) {
      setIsPanningMode(false);
    }
  }, [isSelected]);

  useEffect(() => {
    if (actualSrc) {
      const cached = getCachedImage(actualSrc);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        setImage(cached);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setImage(null);
      const img = new window.Image();
      if (actualSrc.startsWith("http")) {
        img.crossOrigin = "anonymous";
      }
      img.src = actualSrc;
      img.onload = () => {
        globalImageCache[actualSrc] = img;
        setImage(img);
        setIsLoading(false);
      };
      img.onerror = () => {
        setIsLoading(false);
      };
    } else {
      setImage(null);
      setIsLoading(false);
    }
  }, [actualSrc]);

  const isCircle = el.shapeType === "ellipse";

  const handleFrameClick = (e: any) => {
    const state = useEditorStore.getState();
    const isPreview = state.isPreviewMode;
    if (!isPreview) {
      e.cancelBubble = true;
      if (state.selectedElementId === el.id) {
        if (isPanningMode) {
          setIsPanningMode(false);
        } else {
          state.selectElement(null);
        }
      } else {
        state.selectElement(el.id);
        setIsPanningMode(false);
        if (state.activeSidebarPanel !== "images") {
          state.setSidebarPanel("images");
        }
      }
    }
  };

  const isGeneratingPdf = useEditorStore((s) => s.isGeneratingPdf);
  if (isGeneratingPdf && !actualSrc) {
    return null;
  }

  const glowColor = "#ffffff";

  return (
    <Group {...props} draggable={props.draggable && !isPanningMode} ref={ref}>
      {/* Base Card Background (Supports Rectangle and Circle) */}
      {isCircle ? (
        <Circle
          x={el.width / 2}
          y={el.height / 2}
          radius={el.width / 2}
          fill={actualSrc ? "transparent" : "rgba(0,0,0,0.1)"}
          stroke={glowColor}
          strokeWidth={isSelected ? 10 : 6}
          shadowBlur={isSelected ? 25 : 10}
          shadowColor={isSelected ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.15)"}
          perfectDrawEnabled={false}
          onClick={handleFrameClick}
          onTap={handleFrameClick}
        />
      ) : (
        <Rect
          width={el.width}
          height={el.height}
          fill={actualSrc ? "transparent" : "rgba(0,0,0,0.1)"}
          stroke={glowColor}
          strokeWidth={isSelected ? 10 : 6}
          shadowBlur={isSelected ? 25 : 10}
          shadowColor={isSelected ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.15)"}
          perfectDrawEnabled={false}
          onClick={handleFrameClick}
          onTap={handleFrameClick}
        />
      )}

      {/* Image Rendering with optimized Shape-Aware Clipping (object-fit: cover) */}
      {image && (() => {
        let drawWidth = el.width;
        let drawHeight = el.height;
        let baseX = 0;
        let baseY = 0;

        const imgRatio = image.width / image.height;
        const frameRatio = el.width / el.height;

        if (imgRatio > frameRatio) {
          // Image is wider than frame (Match height, let width overflow)
          drawHeight = el.height;
          drawWidth = el.height * imgRatio;
          baseX = -(drawWidth - el.width) / 2;
        } else {
          // Image is taller than frame (Match width, let height overflow)
          drawWidth = el.width;
          drawHeight = el.width / imgRatio;
          baseY = -(drawHeight - el.height) / 2;
        }

        const drawX = baseX + (el.cropX || 0);
        const drawY = baseY + (el.cropY || 0);

        return (
          <Group
            clipFunc={(ctx) => {
              ctx.beginPath();
              if (isCircle) {
                ctx.arc(el.width / 2, el.height / 2, el.width / 2, 0, Math.PI * 2);
              } else {
                ctx.roundRect(0, 0, el.width, el.height, 4);
              }
              ctx.closePath();
            }}
            onClick={handleFrameClick}
            onTap={handleFrameClick}
          >
            <KonvaImage
              image={image}
              x={drawX}
              y={drawY}
              width={drawWidth}
              height={drawHeight}
              perfectDrawEnabled={false}
              draggable={canInteract && isPanningMode}
              onDblClick={(e) => {
                if (canInteract) {
                  e.cancelBubble = true;
                  setIsPanningMode(true);
                }
              }}
              onDblTap={(e) => {
                if (canInteract) {
                  e.cancelBubble = true;
                  setIsPanningMode(true);
                }
              }}
              onMouseEnter={(e: any) => {
                if (canInteract && isPanningMode) {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = "move";
                }
              }}
              onMouseLeave={(e: any) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = "default";
              }}
              onDragStart={(e: any) => {
                if (canInteract && isPanningMode) {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = "grabbing";
                }
              }}
              onDragMove={(e) => {
                if (!canInteract || !isPanningMode) return;
                const node = e.target;

                const minX = Math.min(0, el.width - drawWidth);
                const maxX = 0;
                const minY = Math.min(0, el.height - drawHeight);
                const maxY = 0;

                let newX = Math.min(maxX, Math.max(minX, node.x()));
                let newY = Math.min(maxY, Math.max(minY, node.y()));

                node.x(newX);
                node.y(newY);
              }}
              onDragEnd={(e) => {
                if (!canInteract || !isPanningMode) return;

                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = "move";

                const node = e.target;
                const finalCropX = node.x() - baseX;
                const finalCropY = node.y() - baseY;
                useEditorStore.getState().updateElement(pageId, el.id, { cropX: finalCropX, cropY: finalCropY });
              }}
            />
          </Group>
        );
      })()}

      {/* Large Center (+) */}
      {!el.src && !isLoading && (
        <Group
          x={el.width / 2}
          y={el.height / 2}
          onClick={handleFrameClick}
          onTap={handleFrameClick}
        >
          <Circle radius={45} fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth={2} opacity={0.8} />
          <Text text="+" fontSize={64} fill="white" x={-20} y={-38} fontFamily="Inter" fontStyle="100" />
        </Group>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <Group
          x={el.width / 2}
          y={el.height / 2}
        >
          <Circle radius={45} fill="rgba(0,0,0,0.4)" />
          <Text
            text="Loading..."
            fontSize={14}
            fill="white"
            x={-35}
            y={-6}
            fontFamily="Inter"
            fontStyle="bold"
          />
        </Group>
      )}

      {/* On-Canvas Frame Rotate Handle */}
      {isSelected && canInteract && (() => {
        const minDim = Math.min(el.width, el.height);
        const isSmall = minDim < 120;
        const scale = isSmall ? Math.max(0.4, minDim / 120) : 1;
        const offsetDist = 12 * scale;

        // Edge detection to prevent clipping by the page bounds
        let handleX = el.width + offsetDist;
        let handleY = -offsetDist;

        // If near the right edge of the page, keep it top-right but tuck it inside the frame
        if (el.x + el.width + offsetDist + 20 > 500) {
          handleX = el.width - (24 * scale) - offsetDist;
        }
        // If near the top edge of the page, keep it top-right but tuck it inside the frame
        if (el.y - offsetDist - 20 < 0) {
          handleY = offsetDist;
        }

        return (
          <Group
            x={handleX}
            y={handleY}
            draggable
            onDragStart={(e) => {
              e.cancelBubble = true;
              const parent = e.target.getParent();
              if (!parent) return;
              
              const w = el.width;
              const h = el.height;
              const currentRotation = el.rotation || 0;
              const rad = (currentRotation * Math.PI) / 180;
              
              const cx = el.x + (w / 2) * Math.cos(rad) - (h / 2) * Math.sin(rad);
              const cy = el.y + (w / 2) * Math.sin(rad) + (h / 2) * Math.cos(rad);
              
              const absCenter = parent.getAbsoluteTransform().point({ x: w / 2, y: h / 2 });
              const stage = e.target.getStage();
              const pos = stage?.getPointerPosition();
              const startPointerAngle = pos ? Math.atan2(pos.y - absCenter.y, pos.x - absCenter.x) * (180 / Math.PI) : 0;

              e.target.setAttrs({
                dragStartX: handleX,
                dragStartY: handleY,
                initialRotation: currentRotation,
                cx, cy,
                absCenter,
                startPointerAngle
              });
            }}
            onDragMove={(e) => {
              e.cancelBubble = true;
              const stage = e.target.getStage();
              const parent = e.target.getParent();
              if (!stage || !parent) return;

              const pos = stage.getPointerPosition();
              if (!pos) return;

              const attrs = e.target.attrs;
              const { initialRotation, cx, cy, absCenter, startPointerAngle } = attrs;

              const pointerAngle = Math.atan2(pos.y - absCenter.y, pos.x - absCenter.x) * (180 / Math.PI);
              const deltaAngle = pointerAngle - startPointerAngle;
              
              let newRotation = initialRotation + deltaAngle;
              
              const w = el.width;
              const h = el.height;
              const newRad = (newRotation * Math.PI) / 180;
              
              parent.rotation(newRotation);
              
              const newX = cx - (w / 2) * Math.cos(newRad) + (h / 2) * Math.sin(newRad);
              const newY = cy - (w / 2) * Math.sin(newRad) - (h / 2) * Math.cos(newRad);
              parent.x(newX);
              parent.y(newY);

              e.target.x(attrs.dragStartX);
              e.target.y(attrs.dragStartY);
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              const parent = e.target.getParent();
              if (!parent) return;
              
              useEditorStore.getState().updateElement(pageId, el.id, { 
                rotation: parent.rotation(),
                x: parent.x(),
                y: parent.y()
              } as any);
            }}
            onClick={(e) => {
              e.cancelBubble = true;
              const state = useEditorStore.getState();

              const currentRotation = el.rotation || 0;
              const rad = (currentRotation * Math.PI) / 180;
              const w = el.width;
              const h = el.height;

              // 1. Calculate true center
              const cx = el.x + (w / 2) * Math.cos(rad) - (h / 2) * Math.sin(rad);
              const cy = el.y + (w / 2) * Math.sin(rad) + (h / 2) * Math.cos(rad);

              // 2. Rotate by 90 deg
              const newRotation = (currentRotation + 90) % 360;
              const newRad = (newRotation * Math.PI) / 180;

              // 3. Calculate new top-left (x, y) so the center remains exactly the same
              const newX = cx - (w / 2) * Math.cos(newRad) + (h / 2) * Math.sin(newRad);
              const newY = cy - (w / 2) * Math.sin(newRad) - (h / 2) * Math.cos(newRad);

              state.updateElement(pageId, el.id, {
                rotation: newRotation,
                x: newX,
                y: newY,
              } as any);
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              const state = useEditorStore.getState();
              const currentRotation = el.rotation || 0;
              const rad = (currentRotation * Math.PI) / 180;
              const w = el.width;
              const h = el.height;
              const cx = el.x + (w / 2) * Math.cos(rad) - (h / 2) * Math.sin(rad);
              const cy = el.y + (w / 2) * Math.sin(rad) + (h / 2) * Math.cos(rad);
              const newRotation = (currentRotation + 90) % 360;
              const newRad = (newRotation * Math.PI) / 180;
              const newX = cx - (w / 2) * Math.cos(newRad) + (h / 2) * Math.sin(newRad);
              const newY = cy - (w / 2) * Math.sin(newRad) - (h / 2) * Math.cos(newRad);
              state.updateElement(pageId, el.id, {
                rotation: newRotation,
                x: newX,
                y: newY,
              } as any);
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'pointer';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          >
            <Circle radius={16 * scale} fill="#ffffff" stroke="#9f2e2b" strokeWidth={2 * scale} shadowColor="rgba(0,0,0,0.2)" shadowBlur={4 * scale} />
            <Path
              data="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8 M21 3v5h-5"
              stroke="#9f2e2b"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="transparent"
              scale={{ x: 0.8 * scale, y: 0.8 * scale }}
              offset={{ x: 12, y: 12 }}
            />
          </Group>
        );
      })()}
    </Group>
  );
});

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
    <Group {...props} x={el.x} y={el.y} width={el.width} height={el.height} rotation={el.rotation}>
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

          const isCarnivalDays = settings.month === 1 && (day === 16 || day === 17);
          const displayText = isCarnivalDays ? `${note.trim().toUpperCase()}\n${dayName}` : note.trim().toUpperCase();

          return (
            <Group
              key={day} x={x} y={y}
              onClick={(e) => {
                e.cancelBubble = true;
                const isAdminStore = useEditorStore.getState().isAdmin;
                if (isCarnivalDays && !isAdminStore) return; // Prevent customer edits on fixed dates
                if (!isPreviewMode && onEditNote) onEditNote(el.id, pageId, dateKey, note);
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                const isAdminStore = useEditorStore.getState().isAdmin;
                if (isCarnivalDays && !isAdminStore) return; // Prevent customer edits on fixed dates
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
                    text={displayText}
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
                    text={displayText}
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

const PageCanvas = memo(function PageCanvas({
  page,
  offsetX,
  onEditCalendarNote,
  hasShadow = true,
  isTemplatePage = false,
}: {
  page: BookPage;
  offsetX: number;
  onEditCalendarNote?: (elId: string, pageId: string, dateKey: string, initialValue: string) => void;
  hasShadow?: boolean;
  isTemplatePage?: boolean;
}) {
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
      if (page.background.startsWith("http")) {
        img.crossOrigin = "anonymous";
      }
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
        onClick={(e) => {
          e.cancelBubble = true;
          useEditorStore.getState().selectElement(null);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          useEditorStore.getState().selectElement(null);
        }}
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
              onSelect={selectElement}
              pageIsLocked={page.isLocked}
              isTemplatePage={isTemplatePage}
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
});

function CalendarNoteModal({
  noteData,
  onSave,
  onCancel
}: {
  noteData: { elementId: string; pageId: string; dateKey: string; initialValue: string; note: string };
  onSave: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState(noteData.initialValue);

  return (
    <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <div className="h-2 bg-gradient-to-r from-[#fbba00] via-[#d22e56] to-[#009d94]" />

        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                <Calendar className="w-6 h-6 text-[#d22e56]" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 leading-none">
                  {noteData.dateKey.replace('-', ' ')}
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Calendar Note</p>
              </div>
            </div>
            <button
              onClick={onCancel}
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
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-32 p-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-[#009d94]/10 focus:border-[#009d94] outline-none text-xl text-black resize-none transition-all placeholder:text-gray-200 font-handwritten"
              placeholder="Add something special about this day..."
              autoFocus
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 h-14 rounded-2xl border-2 border-gray-100 text-gray-900 font-bold hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(note)}
              className="flex-[1.5] h-14 rounded-2xl bg-black text-white font-black uppercase tracking-widest text-sm transition-all hover:bg-gray-900 shadow-xl shadow-black/10 active:scale-95"
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  // Select only the current spread — avoids re-render when OTHER spreads change
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex);
  const currentSpread = useEditorStore((s) => s.spreads[s.currentSpreadIndex]);
  // Still need spread count for navigation functions (but full array is fetched via getState() to avoid renders)
  const spreadCount = useEditorStore((s) => s.spreads.length);
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
  const previewElement = useEditorStore((s) => s.previewElement);

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
  }, [setStageRefStore]);

  // Only preload images ONCE when the template first loads (not on every keypress/drag)
  useEffect(() => {
    if (templateLoaded && spreadCount > 0) {
      preloadSpreadImages(useEditorStore.getState().spreads);
    }
  }, [templateLoaded, spreadCount]); // intentionally NOT including full spreads to avoid re-running on every edit

  useEffect(() => {
    if (stageRef.current) stageRef.current.batchDraw();
  }, [currentSpread, previewElement]);

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
    const target = e.target;
    const stage = target.getStage();
    // If clicking on the background rect or stage itself
    if (target === stage || target.name() === "background") {
      selectElement(null);
      useEditorStore.getState().setCroppingElement(null);
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
      <div
        className="flex-1 relative overflow-hidden"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            selectElement(null);
          }
        }}
      >
        {isPreviewMode && (
          <>
            <button onClick={prevSpread} disabled={currentSpreadIndex === 0} className="absolute left-5 top-1/2 -translate-y-1/2 z-20 text-gray-300 hover:text-gray-600 disabled:opacity-0"><ChevronLeft className="w-20 h-20" /></button>
            <button onClick={nextSpread} disabled={currentSpreadIndex === spreadCount - 1} className="absolute right-5 top-1/2 -translate-y-1/2 z-20 text-gray-300 hover:text-gray-600 disabled:opacity-0"><ChevronRight className="w-20 h-20" /></button>
          </>
        )}

        <div style={{ position: "absolute", left: stageX, top: stageY, width: stageWidth, height: stageHeight }}>
          <Stage
            ref={stageRef}
            width={stageWidth}
            height={stageHeight}
            scaleX={scale}
            scaleY={scale}
            onClick={handleStageClick}
            onMouseLeave={() => {
              if (stageRef.current) stageRef.current.container().style.cursor = "default";
            }}
          >
            <Layer>
              {isSingle ? (
                <PageCanvas
                  page={mobilePage === "left" ? currentSpread.leftPage : currentSpread.rightPage}
                  offsetX={0}
                  onEditCalendarNote={handleEditCalendarNote}
                  hasShadow={true}
                  isTemplatePage={isTemplatePage}
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
                    isTemplatePage={isTemplatePage}
                  />
                  <PageCanvas
                    page={currentSpread.rightPage}
                    offsetX={PAGE_WIDTH + gap}
                    onEditCalendarNote={handleEditCalendarNote}
                    hasShadow={false}
                    isTemplatePage={isTemplatePage}
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
        <CalendarNoteModal
          noteData={editingCalendarNote}
          onCancel={() => setEditingCalendarNote(null)}
          onSave={(note) => {
            const { elementId, pageId, dateKey } = editingCalendarNote;
            const allSpreads = useEditorStore.getState().spreads;
            const el = allSpreads.find(s => s.leftPage.id === pageId || s.rightPage.id === pageId)
              ?.leftPage.elements.concat(
                allSpreads.find(s => s.leftPage.id === pageId || s.rightPage.id === pageId)?.rightPage.elements || []
              ).find(e => e.id === elementId) as EditorElement;

            if (el) {
              const newData = { ...(el.calendarSettings?.data || {}) };
              if (note.trim()) {
                newData[dateKey] = note;
              } else {
                delete newData[dateKey];
              }

              const updateElement = useEditorStore.getState().updateElement;
              updateElement(pageId, elementId, {
                calendarSettings: el.calendarSettings ? {
                  ...el.calendarSettings,
                  data: newData
                } : undefined
              });
            }
            setEditingCalendarNote(null);
          }}
        />
      )}
    </div>
  );
}

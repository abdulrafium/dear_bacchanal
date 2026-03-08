"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group, Line } from "react-konva";
import { useEditorStore, EditorElement, BookPage } from "@/store/editor-store";
import Konva from "konva";
import { PAGE_LAYOUTS } from "@/lib/layouts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EditorPageTools } from "./EditorPageTools";

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

  const renderElement = () => {
    switch (el.type) {
      case "text":
        return (
          <Text
            {...commonProps}
            text={el.text || "Enter text"}
            fontSize={el.fontSize || 18}
            fontFamily={el.fontFamily || "Arial"}
            fill={el.fill || "#000000"}
            align={el.align || "left"}
            padding={8}
            onDblClick={() => {
              if (!canInteract) return;
              const newText = prompt("Edit text:", el.text || "Enter text");
              if (newText !== null) {
                updateElement(pageId, el.id, { text: newText });
              }
            }}
          />
        );

      case "image":
        return <ImageElement {...commonProps} src={el.src || ""} />;

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
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
          anchorSize={8}
          anchorCornerRadius={2}
          borderStroke="#3b82f6"
          borderStrokeWidth={1.5}
          anchorStroke="#3b82f6"
          anchorFill="#ffffff"
        />
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
        {/* Bleed area indicator */}
        <Rect
          x={BLEED}
          y={BLEED}
          width={PAGE_WIDTH - BLEED * 2}
          height={PAGE_HEIGHT - BLEED * 2}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          dash={[4, 4]}
        />

        {/* Safe margin */}
        <Rect
          x={SAFE_MARGIN}
          y={SAFE_MARGIN}
          width={PAGE_WIDTH - SAFE_MARGIN * 2}
          height={PAGE_HEIGHT - SAFE_MARGIN * 2}
          stroke="#93c5fd"
          strokeWidth={0.5}
          dash={[2, 2]}
        />

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

  const scale = zoom / 100;
  const totalWidth = PAGE_WIDTH * 2 + 8; // 8px spine
  const totalHeight = PAGE_HEIGHT;
  const stageWidth = totalWidth * scale;
  const stageHeight = totalHeight * scale;
  const stageX = Math.max(0, (containerSize.width - stageWidth) / 2);
  const stageY = Math.max(20, (containerSize.height - stageHeight) / 2);

  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage() || e.target.getClassName() === "Rect") {
      const clickedOnElement = e.target.parent?.parent !== null && e.target.getClassName() !== "Rect";
      if (!clickedOnElement) {
        selectElement(null);
      }
    }
  };

  // Handle drops (images or layouts)
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!currentSpread) return;

      const stageEl = containerRef.current;
      if (!stageEl) return;

      // Determine drop target (left or right page)
      const rect = stageEl.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      
      const totalWidth = PAGE_WIDTH * 2 + 8;
      const stageWidth = totalWidth * scale;
      const stageX = Math.max(0, (containerSize.width - stageWidth) / 2);
      
      const dropPosInStage = dropX - stageX;
      let targetPage = null;

      if (dropPosInStage >= 0 && dropPosInStage <= (PAGE_WIDTH * scale)) {
        if (!currentSpread.leftPage.isLocked) targetPage = currentSpread.leftPage;
      } else if (dropPosInStage > (PAGE_WIDTH * scale + 8 * scale) && dropPosInStage <= stageWidth) {
        if (!currentSpread.rightPage.isLocked) targetPage = currentSpread.rightPage;
      }

      if (!targetPage) return; // Drop on locked page or outside page bounds

      // 1. Check if it's a layout drop
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

      // 2. Check if it's an image file drop
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));

      imageFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        addElement(targetPage!.id, {
          type: "image",
          x: 50 + Math.random() * 100,
          y: 50 + Math.random() * 100,
          width: 200,
          height: 150,
          rotation: 0,
          src: url,
        });
      });
    },
    [currentSpread, scale, containerSize.width, addElement, applyLayout]
  );

  // Show empty state if no template loaded
  if (!templateLoaded || !currentSpread) {
    return (
      <div ref={containerRef} className="w-full h-full bg-[#e8e8e8] flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Select a Template</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Choose a book template from the <strong>Templates</strong> panel on the left to start editing your carnival memory book.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#e8e8e8] overflow-auto relative"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Bleed warning - only in edit mode */}
      {!isPreviewMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-[#2d2d2d] text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full" />
            Text in this highlighted area may be cut off in print.
          </div>
        </div>
      )}

      {/* Preview mode large navigation arrows */}
      {isPreviewMode && (
        <>
          <button
            onClick={prevSpread}
            disabled={currentSpreadIndex === 0}
            className="absolute left-10 top-1/2 -translate-y-1/2 z-20 text-gray-300 hover:text-gray-600 disabled:opacity-0 transition-opacity"
          >
            <ChevronLeft className="w-24 h-24" />
          </button>
          
          <button
            onClick={nextSpread}
            disabled={currentSpreadIndex === spreads.length - 1}
            className="absolute right-10 top-1/2 -translate-y-1/2 z-20 text-gray-300 hover:text-gray-600 disabled:opacity-0 transition-opacity"
          >
            <ChevronRight className="w-24 h-24" />
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
          width={stageWidth}
          height={stageHeight}
          scaleX={scale}
          scaleY={scale}
          onClick={handleStageClick}
        >
          <Layer>
            {/* Left Page */}
            <PageCanvas
              page={currentSpread.leftPage}
              offsetX={0}
              isLocked={currentSpread.leftPage.isLocked}
            />

            {/* Spine graphic (creases + text) */}
            <Group x={PAGE_WIDTH} y={0}>
              <Rect
                x={0}
                y={0}
                width={8}
                height={PAGE_HEIGHT}
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: 8, y: 0 }}
                fillLinearGradientColorStops={[
                  0, "rgba(0,0,0,0.15)",
                  0.5, "rgba(0,0,0,0.05)",
                  1, "rgba(0,0,0,0.15)",
                ]}
              />
              {/* Crease Lines */}
              <Line
                points={[1.5, 0, 1.5, PAGE_HEIGHT]}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={0.5}
              />
              <Line
                points={[6.5, 0, 6.5, PAGE_HEIGHT]}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={0.5}
              />
              {/* Spine Text */}
              <Text
                x={4}
                y={PAGE_HEIGHT / 2}
                text={activeTemplateName?.toUpperCase() || "DEAR BACCHANAL"}
                fontSize={4}
                fontFamily="serif"
                fill="rgba(255,255,255,0.8)"
                rotation={90}
                align="center"
                verticalAlign="middle"
                offsetX={activeTemplateName ? (activeTemplateName.length * 2) / 2 : 25} // Approximate centering
                offsetY={0}
              />
            </Group>

            {/* Right Page */}
            <PageCanvas
              page={currentSpread.rightPage}
              offsetX={PAGE_WIDTH + 8}
              isLocked={currentSpread.rightPage.isLocked}
            />
          </Layer>
        </Stage>

        {!isPreviewMode && !currentSpread.leftPage.isLocked && (
          <EditorPageTools pageId={currentSpread.leftPage.id} align="left" />
        )}
        {!isPreviewMode && !currentSpread.rightPage.isLocked && (
          <EditorPageTools pageId={currentSpread.rightPage.id} align="right" />
        )}

        {/* Page Labels underneath */}
        <div className="flex w-full mt-4 text-[#2d2d2d] font-medium text-sm">
          <div className="flex-1 text-center">{currentSpread.leftPage.label}</div>
          <div className="w-[8px]" />
          <div className="flex-1 text-center">{currentSpread.rightPage.label}</div>
        </div>
      </div>
    </div>
  );
}

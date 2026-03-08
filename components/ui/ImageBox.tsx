"use client";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { toast } from "sonner";
import { useBookData } from "@/components/book/BookDataContext";
import { useSession } from "next-auth/react";
import { useAuthModal } from "@/hooks/useAuthModal";

interface ImageBoxProps {
  id: string;
  rotation: string;
  size?: "default" | "large" | "xlarge" | "horizontal" | "vertical" | "tall-vertical" | "portrait" | "portrait-large";
  showWhiteBar?: boolean;
  placeholderText?: string;
  className?: string;
  pageId?: string; // ID of the page this box belongs to (needed for Add Box feature)
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PlusCircle, RotateCw, Move, Trash2, Upload } from "lucide-react";

export const ImageBox: React.FC<ImageBoxProps> = ({
  id,
  rotation: initialRotation,
  size = "default",
  showWhiteBar = true,
  placeholderText,
  className = "",
  pageId
}) => {
  const { data, isReadOnly, updateBoxData, updateImage, addDynamicBox, isPDF } = useBookData();
  const { data: session } = useSession();
  const { openModal } = useAuthModal();
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New states for resizing, rotation, positioning and visibility
  const [dimensions, setDimensions] = useState<{ width?: number; height?: number }>({});
  const [position, setPosition] = useState<{ x?: number; y?: number }>({});
  const [rotation, setRotation] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { startUpload } = useUploadThing("bookImageUploader", {
    onClientUploadComplete: async (files) => {
      if (files && files[0]) {
        const uploadedUrl = files[0].url;

        // Save the URL to MongoDB
        try {
          const response = await fetch("/api/book-images", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageId: id,
              imageUrl: uploadedUrl,
            }),
          });

          if (response.ok) {
            setImage(uploadedUrl);
            updateImage(id, uploadedUrl); // Sync with context for PDF generation
            toast.success("Image uploaded successfully!");
          } else {
            throw new Error("Failed to save image URL");
          }
        } catch (error) {
          console.error("Error saving image URL:", error);
          toast.error("Failed to save image. Please try again.");
        }
      }
      setIsUploading(false);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      toast.error("Upload failed. Please try again.");
      setIsUploading(false);
    },
  });

  // Sync settings with DB/Context
  useEffect(() => {
    // 1. Sync Image
    if (data.images && data.images[id]) {
      setImage(data.images[id]);
    } else if (!isReadOnly) {
      const fetchImage = async () => {
        try {
          const response = await fetch("/api/book-images");
          if (response.ok) {
            const result = await response.json();
            if (result.images && result.images[id]) {
              setImage(result.images[id]);
            }
          }
        } catch (error) {
          console.error("Error fetching image:", error);
        }
      };
      fetchImage();
    }

    // 2. Sync Box Data (Sizing, Position, Rotation & Visibility)
    const boxId = `box-settings-${id}`;

    // Parse rotation string (e.g., "rotate-[-3deg]") to number
    const getInitialRotation = () => {
      if (!initialRotation) return 0;
      const match = initialRotation.match(/rotate-\[(-?\d+)deg\]/);
      return match ? parseInt(match[1]) : 0;
    };

    const applySettings = (settings: any) => {
      if (settings.width) setDimensions(prev => ({ ...prev, width: settings.width }));
      if (settings.height) setDimensions(prev => ({ ...prev, height: settings.height }));
      if (settings.x !== undefined || settings.y !== undefined) {
        setPosition({ x: settings.x, y: settings.y });
      }
      if (settings.rotation !== undefined) {
        setRotation(settings.rotation);
      } else {
        setRotation(getInitialRotation());
      }
      if (settings.isVisible !== undefined) setIsVisible(settings.isVisible);
    };

    // Check boxData first
    if (data.boxData && data.boxData[id]) {
      applySettings(data.boxData[id]);
    }
    // Fallback to textData (important for shared view)
    else if (data.textData && data.textData[boxId]) {
      try {
        const settings = JSON.parse(data.textData[boxId]);
        applySettings(settings);
      } catch (e) {
        console.error("Error parsing box settings from textData:", e);
      }
    }
    // Only fetch if not in read-only and no data found in context
    else if (!isReadOnly) {
      const fetchSettings = async () => {
        try {
          const response = await fetch("/api/book-data");
          if (response.ok) {
            const result = await response.json();
            const fetchedData = result.data || {};
            if (fetchedData[boxId]) {
              try {
                const settings = JSON.parse(fetchedData[boxId]);
                applySettings(settings);
              } catch (e) {
                console.error("Error parsing box settings:", e);
              }
            } else {
              setRotation(getInitialRotation());
            }
          }
        } catch (error) {
          console.error("Error fetching box settings:", error);
          setRotation(getInitialRotation());
        }
      };
      fetchSettings();
    } else {
      setRotation(getInitialRotation());
    }
  }, [id, data.images, data.boxData, data.textData, isReadOnly, initialRotation]);

  // Detect screen size for responsive logic
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // If we are generating a PDF, we want to force desktop layout
      if (isPDF) {
        setIsMobile(false);
        return;
      }
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isPDF]);

  // Determine if we should use absolute positioning
  // Dynamic boxes (from DynamicBoxRenderer) pass 'absolute' or 'md:absolute'
  // Static boxes that have been moved also need to be absolute to not disturb the flow
  const isMoved = position.x !== undefined || position.y !== undefined;
  const isDynamic = id.startsWith('dynamic-');
  const shouldBeAbsolute = (className.includes("absolute") || isMoved || isDynamic);

  const baseStyle: React.CSSProperties = {
    position: shouldBeAbsolute ? 'absolute' : 'relative',
    left: shouldBeAbsolute ? `${position.x || 0}%` : undefined,
    top: shouldBeAbsolute ? `${position.y || 0}%` : undefined,
    transform: `rotate(${rotation}deg)`,
    width: dimensions.width ? `${dimensions.width}px` : undefined,
    height: dimensions.height ? `${dimensions.height}px` : undefined,
    zIndex: (isDragging || isRotating || isResizing) ? 100 : shouldBeAbsolute ? 20 : 1,
    margin: isMobile ? '0 auto' : undefined, // Center in flex column on mobile
  };

  const saveBoxSettings = async (newSettings: any) => {
    if (isReadOnly) return;
    try {
      await fetch("/api/book-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: `box-settings-${id}`,
          value: JSON.stringify({
            ...dimensions,
            ...position,
            rotation,
            isVisible,
            ...newSettings
          }),
        }),
      });
    } catch (error) {
      console.error("Error saving box settings:", error);
    }
  };

  const handleBoxClick = () => {
    if (isReadOnly) return;
    if (!session) {
      openModal("signin");
      return;
    }
    if (!isUploading && !isResizing && !isDragging && !isRotating) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error("Image size must be less than 4MB");
        return;
      }
      setIsUploading(true);
      toast.info("Uploading image...");
      try {
        await startUpload([file]);
      } catch (error) {
        console.error("Error starting upload:", error);
        toast.error("Failed to upload image");
        setIsUploading(false);
      }
    }
  };

  const handleDeleteImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) return;
    try {
      const response = await fetch(`/api/book-images?imageId=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setImage(null);
        updateImage(id, null); // Sync with context
        toast.success("Image deleted successfully!");
      } else {
        throw new Error("Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image. Please try again.");
    }
  };

  const confirmRemoveBox = async () => {
    setIsVisible(false);
    updateBoxData(id, { isVisible: false }); // Update context
    await saveBoxSettings({ isVisible: false });
    toast.success("Box removed");
    setIsRemoveModalOpen(false);
  };

  // Drag Handling
  const startDragging = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Ignore drag if clicked on a button, svg, or input
    if (target.closest('button, input, svg')) return;
    if (isReadOnly || isResizing || isRotating) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);

    const box = containerRef.current;
    if (!box) return;

    // Use the true CSS offsetParent for absolute positioning reference
    const offsetParent = (box as HTMLElement).offsetParent as HTMLElement || document.body;
    const parentRect = offsetParent.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    // Calculate current visual position relative to the parent that CSS will use
    const startX_pct = ((boxRect.left - parentRect.left) / parentRect.width) * 100;
    const startY_pct = ((boxRect.top - parentRect.top) / parentRect.height) * 100;

    // Set position immediately to capture the box in its current spot as it becomes absolute
    setPosition({ x: startX_pct, y: startY_pct });

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    let finalX = startX_pct;
    let finalY = startY_pct;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startMouseX;
      const dy = moveEvent.clientY - startMouseY;

      // Convert pixel delta to percentage delta relative to the offsetParent
      const dxPct = (dx / parentRect.width) * 100;
      const dyPct = (dy / parentRect.height) * 100;

      finalX = startX_pct + dxPct;
      finalY = startY_pct + dyPct;
      setPosition({ x: finalX, y: finalY });
    };

    const onMouseUp = async () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setIsDragging(false);

      updateBoxData(id, { x: finalX, y: finalY });
      await saveBoxSettings({ x: finalX, y: finalY });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Resize Handling
  const startResizing = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;

    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const box = containerRef.current;
    const startWidth = box.offsetWidth;
    const startHeight = box.offsetHeight;

    let currentWidth = startWidth;
    let currentHeight = startHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      currentWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
      currentHeight = Math.max(50, startHeight + (moveEvent.clientY - startY));
      setDimensions({ width: currentWidth, height: currentHeight });
    };

    const onMouseUp = async () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setIsResizing(false);

      setDimensions({ width: currentWidth, height: currentHeight });
      updateBoxData(id, { width: currentWidth, height: currentHeight });
      await saveBoxSettings({ width: currentWidth, height: currentHeight });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Rotation Handling
  const startRotating = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;

    setIsRotating(true);
    const box = containerRef.current;
    const rect = box.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let currentRotation = rotation;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      const degrees = (angle * 180) / Math.PI + 90; // Offset by 90 to match handle position
      currentRotation = degrees;
      setRotation(degrees);
    };

    const onMouseUp = async () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setIsRotating(false);

      updateBoxData(id, { rotation: currentRotation });
      await saveBoxSettings({ rotation: currentRotation });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const getSizeClasses = () => {
    // For PDF generation, use fixed pixel values based on 1920px width
    // This ensures consistent sizing regardless of actual viewport
    if (isPDF) {
      switch (size) {
        case "large":
          return { box: "h-[269px] w-[269px]", bar: "w-[269px]" }; // 14vw of 1920
        case "xlarge":
          return { box: "h-[346px] w-[346px]", bar: "w-[346px]" }; // 18vw of 1920
        case "horizontal":
          return { box: "h-[346px] w-[730px]", bar: "w-[730px]" }; // 18vw x 38vw
        case "vertical":
          return { box: "h-[288px] w-[250px]", bar: "w-[250px]" }; // 15vw x 13vw
        case "tall-vertical":
          return { box: "h-[730px] w-[346px]", bar: "w-[346px]" }; // 38vw x 18vw
        case "portrait":
          return { box: "w-[211px] h-[269px]", bar: "w-[211px]" }; // 11vw x 14vw
        case "portrait-large":
          return { box: "w-[403px] h-[538px]", bar: "w-[403px]" }; // 21vw x 28vw
        default:
          return { box: "h-[211px] w-[211px]", bar: "w-[211px]" }; // 11vw of 1920
      }
    }

    // Normal responsive classes for regular view
    switch (size) {
      case "large":
        return {
          box: "h-56 w-56 sm:h-36 sm:w-36 lg:h-[14vw] lg:w-[14vw]",
          bar: "w-56 sm:w-36 lg:w-[14vw]"
        };
      case "xlarge":
        return {
          box: "h-64 w-64 sm:h-40 sm:w-40 lg:h-[18vw] lg:w-[18vw]",
          bar: "w-64 sm:w-40 lg:w-[18vw]"
        };
      case "horizontal":
        return {
          box: "h-[200px] w-full max-w-[90vw] sm:h-[180px] sm:w-[400px] lg:h-[18vw] lg:w-[38vw]",
          bar: "w-full max-w-[90vw] sm:w-[400px] lg:w-[38vw]"
        };
      case "vertical":
        return {
          box: "h-[220px] w-[180px] sm:h-[160px] sm:w-[140px] lg:h-[15vw] lg:w-[13vw]",
          bar: "w-[180px] sm:w-[140px] lg:w-[13vw]"
        };
      case "tall-vertical":
        return {
          box: "h-[400px] w-[200px] sm:h-[400px] sm:w-[180px] lg:h-[38vw] lg:w-[18vw]",
          bar: "w-[200px] sm:w-[180px] lg:w-[18vw]"
        };
      case "portrait":
        return {
          box: "w-40 h-56 sm:w-28 sm:h-36 lg:w-[11vw] lg:h-[14vw]",
          bar: "w-40 sm:w-28 lg:w-[11vw]"
        };
      case "portrait-large":
        return {
          box: "w-64 h-80 sm:w-56 sm:h-80 lg:w-[21vw] lg:h-[28vw]",
          bar: "w-64 sm:w-56 lg:w-[21vw]"
        };
      default:
        return {
          box: "h-40 w-40 sm:h-28 sm:w-28 lg:h-[11vw] lg:w-[11vw]",
          bar: "w-40 sm:w-28 lg:w-[11vw]"
        };
    }
  };

  const { box: boxSizeClasses, bar: whiteBarSizeClasses } = getSizeClasses();

  if (!isVisible) return null;

  return (
    <>
      {/* 
        GHOST PLACEHOLDER: 
        When a box becomes 'absolute' (it has been moved), it leaves the flex flow.
        We render a transparent copy of the box here to "hold the spot" so neighbors 
        don't jump or reset their layout.
      */}
      {shouldBeAbsolute && (
        <div
          className={`${className} opacity-0 pointer-events-none`}
          style={{
            width: dimensions.width ? `${dimensions.width}px` : undefined,
            height: dimensions.height ? `${dimensions.height}px` : undefined,
          }}
        >
          <div className={boxSizeClasses}></div>
          {showWhiteBar && <div className={isPDF ? "h-[20px]" : "h-[12px] sm:h-[16px] lg:h-[20px]"}></div>}
        </div>
      )}

      <div
        ref={containerRef}
        className={`${className} group select-none transition-shadow`}
        style={{
          ...baseStyle,
          maxWidth: (isMobile && !isPDF) ? '90vw' : undefined,
          maxHeight: (isMobile && !isPDF) ? '80vh' : undefined,
        }}
      >
        <div
          onMouseDown={startDragging}
          className={`${dimensions.width ? 'w-full h-full' : boxSizeClasses} bg-black/45 ${!isReadOnly ? 'cursor-move' : ''} overflow-hidden relative transition-all flex items-center justify-center`}
        >
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : image ? (
            <>
              <Image
                src={image}
                alt="Uploaded"
                fill
                className="w-full h-full object-cover scale-125 pointer-events-none"
                priority
              />
              {!isReadOnly && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBoxClick(); }}
                    className="bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 shadow-lg pointer-events-auto transition-colors"
                    title="Change image"
                  >
                    <PlusCircle className="w-8 h-8" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(e); }}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg pointer-events-auto transition-colors"
                    title="Delete image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-2 w-full h-full text-center relative pointer-events-none">
              {!isReadOnly && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleBoxClick(); }}
                  className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all pointer-events-auto shadow-sm"
                  title="Upload Image"
                >
                  <PlusCircle className="w-7 h-7" />
                </button>
              )}
              {placeholderText && (
                <p className="text-black/60 font-handwritten text-lg sm:text-xl lg:text-2xl font-black">
                  {placeholderText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Add Box Handle */}
        {!isReadOnly && pageId && (
          <button
            onClick={(e) => { e.stopPropagation(); addDynamicBox(pageId); }}
            className="absolute -top-4 -right-4 bg-teal hover:bg-teal-dark text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-30 pointer-events-auto"
            title="Add another box to this page"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        )}

        {/* Rotate Handle */}
        {!isReadOnly && (
          <div
            onMouseDown={startRotating}
            className="absolute -top-8 left-1/2 -translate-x-1/2 cursor-alias bg-white/30 hover:bg-white/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-30"
            title="Rotate Box"
          >
            <RotateCw className="w-4 h-4 text-white" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white/30"></div>
          </div>
        )}

        {/* Resize Handle */}
        {!isReadOnly && (
          <div
            onMouseDown={startResizing}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize bg-black/20 hover:bg-black/50 rounded-tl-md z-30 opacity-0 group-hover:opacity-100"
            title="Resize Box"
          >
            <div className="w-full h-full p-1 flex flex-col items-end justify-end">
              <div className="w-0.5 h-0.5 bg-white mb-0.5 mr-0.5"></div>
              <div className="w-1.5 h-0.5 bg-white mb-0.5 mr-0.5"></div>
              <div className="w-2.5 h-0.5 bg-white mb-0.5 mr-0.5"></div>
            </div>
          </div>
        )}

        {/* White Bar with Remove Button */}
        {showWhiteBar && (
          <div className={`bg-white ${dimensions.width ? 'w-full' : whiteBarSizeClasses} ${isPDF ? 'h-[20px]' : 'h-[12px] sm:h-[16px] lg:h-[20px]'} relative overflow-visible`}>
            {!isReadOnly && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsRemoveModalOpen(true); }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-40 pointer-events-auto"
                title="Remove entire box"
              >
                <Move className="w-3 h-3 rotate-45" /> {/* Using Move rotated as a cross */}
              </button>
            )}
          </div>
        )}

        {!isReadOnly && !isResizing && !isDragging && !isRotating && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        )}
      </div>

      {/* Remove Confirmation Modal */}
      <Dialog open={isRemoveModalOpen} onOpenChange={setIsRemoveModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Box?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this box from the page? This will also delete any custom sizing or positioning.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <button
              onClick={() => setIsRemoveModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmRemoveBox}
              className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Yes, Remove
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

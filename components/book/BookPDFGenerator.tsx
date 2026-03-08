"use client";

import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { Download, Loader2, Send } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useBookData, BookDataProvider } from "./BookDataContext";
import { useUploadThing } from "@/lib/uploadthing-client";

export interface BookPDFGeneratorHandle {
    ship: () => Promise<void>;
    generate: () => Promise<void>;
}

interface BookPDFGeneratorProps {
    pages: React.ReactNode[];
    isPurchased?: boolean;
    hideButton?: boolean;
    onStateChange?: (state: "idle" | "generating" | "shipping") => void;
}

export const BookPDFGenerator = forwardRef<BookPDFGeneratorHandle, BookPDFGeneratorProps>(({ pages, isPurchased = false, hideButton = false, onStateChange }, ref) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isShipping, setIsShipping] = useState(false);
    const { startUpload } = useUploadThing("bookPdfUploader");
    const containerRef = useRef<HTMLDivElement>(null);
    const { data } = useBookData();

    // Use state to force a re-render with the correct aspect ratio dimensions
    const [captureDim, setCaptureDim] = useState({ width: 1920, height: 1080 });

    const embedImages = async (element: HTMLElement) => {
        // 1. Handle <img> tags
        const images = Array.from(element.querySelectorAll("img"));
        for (const img of images) {
            const src = img.currentSrc || img.src;
            if (!src || src.startsWith("data:")) continue;

            try {
                const response = await fetch(src, { mode: "cors", cache: "no-cache" });
                if (!response.ok) throw new Error("Network response was not ok");

                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });

                img.src = base64;
                img.srcset = "";

                await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
            } catch (err) {
                console.warn("Manual embedding failed:", src);
            }
        }

        // 2. Handle background-images safely
        // Use a Tree Walker to avoid huge arrays if deep DOM
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
        let currentNode = walker.nextNode();

        while (currentNode) {
            const el = currentNode as HTMLElement;
            currentNode = walker.nextNode();

            const style = window.getComputedStyle(el);
            const bgImage = style.backgroundImage;

            if (bgImage && bgImage !== "none" && bgImage.startsWith("url(")) {
                const urlMatch = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
                if (urlMatch && urlMatch[1]) {
                    const url = urlMatch[1];
                    if (url.startsWith("data:")) continue;

                    try {
                        const response = await fetch(url, { mode: "cors", cache: "no-cache" });
                        if (!response.ok) continue;
                        const blob = await response.blob();
                        const base64 = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                        el.style.backgroundImage = `url(${base64})`;
                    } catch (err) {
                        console.warn("Manual bg embedding failed:", url);
                    }
                }
            }
        }
    };

    const notifyStateChange = (state: "idle" | "generating" | "shipping") => {
        if (onStateChange) onStateChange(state);
    };

    const handleShip = async () => {
        setIsShipping(true);
        notifyStateChange("shipping");
        try {
            const blob = await generatePDF(true);
            if (!blob || !(blob instanceof Blob)) {
                throw new Error("Failed to generate PDF");
            }

            const file = new File([blob], "book.pdf", { type: "application/pdf" });
            toast.loading("Uploading book...", { id: "shipping-toast" });

            const res = await startUpload([file]);
            if (!res || !res[0]) throw new Error("Upload failed");

            console.log("PDF uploaded successfully:", res[0].url);

            // Save PDF URL to database for future auto-ship
            try {
                const saveResponse = await fetch("/api/save-pdf-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileUrl: res[0].url }),
                });

                const saveResult = await saveResponse.json();

                if (!saveResponse.ok) {
                    console.error("Failed to save PDF URL:", saveResult);
                    toast.error("Warning: PDF saved but URL not stored in database", { id: "shipping-toast" });
                } else {
                    console.log("PDF URL saved to database:", saveResult);
                }
            } catch (saveError) {
                console.error("Error saving PDF URL:", saveError);
                // Continue with shipping even if save fails
            }

            toast.loading("Sending order to printer...", { id: "shipping-toast" });

            const shipRes = await fetch("/api/ship-book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileUrl: res[0].url }),
            });

            if (!shipRes.ok) {
                const err = await shipRes.json();
                throw new Error(err.error || "Shipping failed");
            }

            toast.success("Book sent to print successfully!", { id: "shipping-toast" });

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to ship book", { id: "shipping-toast" });
        } finally {
            setIsShipping(false);
            notifyStateChange("idle");
        }
    };

    useImperativeHandle(ref, () => ({
        ship: handleShip,
        generate: async () => {
            await generatePDF(false);
        },
    }));

    const generatePDF = async (returnBlob = false) => {
        if (!containerRef.current) return;

        setIsGenerating(true);
        notifyStateChange("generating"); const toastId = toast.loading("Measuring layout...");

        try {
            // 1. FIXED DESKTOP ASPECT RATIO (16:9)
            // Always use desktop dimensions for consistent PDF output on all devices
            const targetWidth = 1920;
            const targetHeight = 1080; // Fixed 16:9 aspect ratio for consistency

            // Update container dimensions state
            setCaptureDim({ width: targetWidth, height: targetHeight });

            // Wait for re-render
            await new Promise(r => setTimeout(r, 600));

            const pageElements = Array.from(containerRef.current.querySelectorAll(".page-snapshot-container")) as HTMLElement[];
            const totalPages = pageElements.length;

            if (totalPages === 0) {
                toast.error("Error: No pages found", { id: toastId });
                return;
            }

            await document.fonts.ready;

            let pdf: jsPDF | null = null;

            // Helper function to force desktop styles via inline styles
            const forceDesktopStyles = (element: HTMLElement) => {
                // Walk through all elements and apply desktop styles based on their classes
                const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
                let node = walker.currentNode as HTMLElement;

                while (node) {
                    const classList = node.className;
                    if (typeof classList === 'string') {
                        // Force desktop gaps
                        if (classList.includes('lg:gap-16')) node.style.gap = '4rem';
                        else if (classList.includes('lg:gap-10')) node.style.gap = '2.5rem';
                        else if (classList.includes('lg:gap-8')) node.style.gap = '2rem';
                        else if (classList.includes('lg:gap-6')) node.style.gap = '1.5rem';

                        // Force desktop margins
                        if (classList.includes('lg:mt-56')) node.style.marginTop = '14rem';
                        else if (classList.includes('lg:mt-48')) node.style.marginTop = '12rem';
                        else if (classList.includes('lg:mt-32')) node.style.marginTop = '8rem';

                        // Force desktop padding
                        if (classList.includes('sm:py-0') || classList.includes('lg:py-0')) {
                            node.style.paddingTop = '0';
                            node.style.paddingBottom = '0';
                        }
                        if (classList.includes('lg:px-20')) {
                            node.style.paddingLeft = '5rem';
                            node.style.paddingRight = '5rem';
                        }

                        // Force desktop widths
                        if (classList.includes('lg:w-[200px]')) node.style.width = '200px';
                        if (classList.includes('lg:h-[200px]')) node.style.height = '200px';

                        // Force desktop positioning - CRITICAL FOR PDF ON MOBILE
                        if (classList.includes('lg:absolute')) node.style.position = 'absolute';
                        else if (classList.includes('lg:relative')) node.style.position = 'relative';
                        else if (classList.includes('lg:static')) node.style.position = 'static';
                        else if (classList.includes('lg:fixed')) node.style.position = 'fixed';

                        // ===== PAGE 1 (EigthPage) =====
                        if (classList.includes('lg:text-[5vh]')) node.style.fontSize = '54px';
                        if (classList.includes('lg:text-[20vh]')) node.style.fontSize = '200px';

                        // ===== PAGE 3 (NinthPage) =====
                        if (classList.includes('lg:text-[13vh]')) node.style.fontSize = '130px';
                        if (classList.includes('lg:text-[4vh]')) node.style.fontSize = '43px';

                        // ===== PAGE 9 (ForteenPage) - CRITICAL FOR MOBILE =====
                        if (classList.includes('lg:text-[10vw]')) node.style.fontSize = '192px';
                        if (classList.includes('lg:text-[12vw]')) node.style.fontSize = '230px';
                        if (classList.includes('lg:text-[18vw]')) node.style.fontSize = '345px';
                        if (classList.includes('lg:text-[10vh]')) node.style.fontSize = '108px';
                        if (classList.includes('lg:top-[10vw]')) node.style.top = '192px';
                        if (classList.includes('lg:top-[6vw]')) node.style.top = '115px';
                        if (classList.includes('lg:top-[22vw]')) node.style.top = '422px';
                        if (classList.includes('lg:top-[3vw]')) node.style.top = '58px';
                        if (classList.includes('lg:left-[6vw]')) node.style.left = '115px';
                        if (classList.includes('lg:right-[11vw]')) node.style.right = '211px';
                        if (classList.includes('left-[2vw]')) node.style.left = '38px';
                        if (classList.includes('lg:leading-[10vw]')) node.style.lineHeight = '192px';
                        if (classList.includes('lg:w-[42vw]')) node.style.width = '806px';
                        // Hide mobile-only elements, show desktop-only
                        if (classList.includes('xl:hidden')) node.style.display = 'none';
                        if (classList.includes('hidden') && classList.includes('lg:block')) node.style.display = 'block';
                        if (classList.includes('hidden') && classList.includes('xl:block')) node.style.display = 'block';

                        // ===== PAGE 13 (ForthPage) - SMALLER TEXT =====
                        if (classList.includes('lg:text-[30vh]')) node.style.fontSize = '240px';
                        if (classList.includes('lg:text-[19vh]')) node.style.fontSize = '160px';
                        if (classList.includes('lg:text-[40vh]')) node.style.fontSize = '320px';
                        if (classList.includes('lg:leading-[25vh]')) node.style.lineHeight = '200px';
                        if (classList.includes('lg:text-[3vh]')) node.style.fontSize = '32px';

                        // ===== PAGE 15 (ThirdPage) - BIGGER TEXT =====
                        if (classList.includes('lg:text-[140px]')) node.style.fontSize = '170px';
                        if (classList.includes('lg:text-6xl')) node.style.fontSize = '60px';
                        if (classList.includes('lg:text-xl')) node.style.fontSize = '20px';

                        // ===== PAGE 10 (FifthPage) =====
                        if (classList.includes('lg:text-[12vh]')) node.style.fontSize = '130px';
                        if (classList.includes('lg:leading-[70px]')) node.style.lineHeight = '70px';

                        // ===== PAGE 6 (TwelfthPage) =====
                        if (classList.includes('lg:text-[2vh]')) node.style.fontSize = '21px';

                        // Force desktop flex direction
                        if (classList.includes('xl:flex-row') && classList.includes('flex-col')) {
                            node.style.flexDirection = 'row';
                        }
                        if (classList.includes('lg:flex-row') && classList.includes('flex-col')) {
                            node.style.flexDirection = 'row';
                        }

                        // Force desktop text alignment
                        if (classList.includes('lg:text-left')) node.style.textAlign = 'left';
                        if (classList.includes('lg:text-end')) node.style.textAlign = 'end';
                        if (classList.includes('lg:text-right')) node.style.textAlign = 'right';

                        // Force desktop display
                        if (classList.includes('lg:block') && !classList.includes('hidden')) node.style.display = 'block';

                        // Force xl:w-1/2
                        if (classList.includes('xl:w-1/2')) node.style.width = '50%';

                        // Force min-h-screen
                        if (classList.includes('xl:min-h-screen') || classList.includes('lg:min-h-screen')) {
                            node.style.minHeight = '1080px';
                        }
                    }
                    node = walker.nextNode() as HTMLElement;
                    if (!node) break;
                }
            };

            for (let i = 0; i < totalPages; i++) {
                const pageEl = pageElements[i];
                toast.loading(`Processing page ${i + 1} of ${totalPages}...`, { id: toastId });

                // Apply desktop styles via JavaScript (more reliable than CSS)
                forceDesktopStyles(pageEl);

                // Embed images
                await embedImages(pageEl);

                // Wait for paints
                await new Promise((resolve) => setTimeout(resolve, 1000));

                const dataUrl = await toPng(pageEl, {
                    quality: 1.0,
                    pixelRatio: 1.5,
                    cacheBust: true,
                    backgroundColor: '#FFFFFF',
                    width: targetWidth,
                    height: targetHeight,
                    style: {
                        transform: 'none',
                        margin: '0',
                    }
                });

                // Create PDF Page
                const img = new Image();
                img.src = dataUrl;
                await new Promise((resolve) => { img.onload = resolve; });

                const pdfWidth = targetWidth; // Use consistent PDF point size
                const pdfHeight = targetHeight;
                const orientation = targetWidth > targetHeight ? "l" : "p";

                if (!pdf) {
                    pdf = new jsPDF(orientation, "pt", [pdfWidth, pdfHeight]);
                } else {
                    pdf.addPage([pdfWidth, pdfHeight], orientation);
                }

                pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
            }

            if (pdf) {
                if (returnBlob) {
                    return (pdf as jsPDF).output("blob");
                }
                (pdf as jsPDF).save("carnival-book-premium.pdf");
                toast.success("PDF Downloaded!", { id: toastId });
            }

        } catch (error) {
            console.error("PDF Error:", error);
            toast.error("Failed to generate PDF.", { id: toastId });
        } finally {
            setIsGenerating(false);
            if (!returnBlob) notifyStateChange("idle");
        }
    };

    return (
        <>
            {!hideButton && isPurchased && (
                <>
                    <button
                        onClick={() => generatePDF(false)}
                        disabled={isGenerating}
                        className={`
          flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3
          rounded-full bg-white/10 backdrop-blur-xl border border-white/20
          text-white font-semibold hover:bg-white/20
          transition-all duration-300 active:scale-95
          ${isGenerating ? "opacity-50 cursor-wait" : "hover:scale-105 hover:shadow-lg"}
        `}
                    >
                        {isGenerating ? (
                            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                        <span className="hidden sm:inline text-sm sm:text-base">
                            {isGenerating ? "Generating..." : "Download PDF"}
                        </span>
                    </button>

                    {isPurchased && (
                        <button
                            onClick={async () => {
                                setIsShipping(true);
                                try {
                                    const blob = await generatePDF(true);
                                    if (!blob || !(blob instanceof Blob)) {
                                        throw new Error("Failed to generate PDF");
                                    }

                                    const file = new File([blob], "book.pdf", { type: "application/pdf" });
                                    toast.loading("Uploading book...", { id: "shipping-toast" });

                                    const res = await startUpload([file]);
                                    if (!res || !res[0]) throw new Error("Upload failed");

                                    toast.loading("Sending order to printer...", { id: "shipping-toast" });

                                    const shipRes = await fetch("/api/ship-book", {
                                        method: "POST",
                                        body: JSON.stringify({ fileUrl: res[0].url }),
                                    });

                                    if (!shipRes.ok) {
                                        const err = await shipRes.json();
                                        throw new Error(err.error || "Shipping failed");
                                    }

                                    toast.success("Book sent to print successfully!", { id: "shipping-toast" });

                                } catch (error: any) {
                                    console.error(error);
                                    toast.error(error.message || "Failed to ship book", { id: "shipping-toast" });
                                } finally {
                                    setIsShipping(false);
                                }
                            }}
                            disabled={isGenerating || isShipping}
                            className={`
                        flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3
                        rounded-full bg-[#ff5500] backdrop-blur-xl border border-white/20
                        text-white font-semibold hover:bg-[#ff4400]
                        transition-all duration-300 active:scale-95 ml-4
                        ${(isGenerating || isShipping) ? "opacity-50 cursor-wait" : "hover:scale-105 hover:shadow-lg"}
                    `}
                        >
                            {isShipping ? (
                                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                            )}
                            <span className="hidden sm:inline text-sm sm:text-base">
                                {isShipping ? "Sending..." : "Send to Home"}
                            </span>
                        </button>
                    )}
                </>
            )}


            {/*
                OFF-SCREEN CONTAINER
                - Fixed 16:9 desktop dimensions (1920x1080) for consistent PDF on all devices.
                - Style injection forces desktop layout by overriding responsive breakpoints.
            */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: "-20000px",
                    width: `${captureDim.width}px`,
                    height: `${captureDim.height}px`,
                    zIndex: -1,
                    background: "white",
                    overflow: "hidden"
                }}
            >
                <style>
                    {`
                        /* Force desktop layout - override all responsive breakpoints */
                        .pdf-generation-wrapper .min-h-screen {
                            min-height: 100% !important;
                            height: 100% !important;
                        }
                        .pdf-generation-wrapper .h-screen {
                            height: 100% !important;
                        }

                        /* Force lg: (desktop) styles to always apply */
                        /* Hide mobile-only elements */
                        .pdf-generation-wrapper .lg\\:hidden {
                            display: none !important;
                        }
                        .pdf-generation-wrapper .hidden.lg\\:block,
                        .pdf-generation-wrapper .hidden.lg\\:flex {
                            display: block !important;
                        }
                        .pdf-generation-wrapper .hidden.lg\\:flex {
                            display: flex !important;
                        }

                        /* Force desktop flex directions - include XL */
                        .pdf-generation-wrapper .flex-col.lg\\:flex-row,
                        .pdf-generation-wrapper .flex-col.xl\\:flex-row {
                            flex-direction: row !important;
                        }
                        .pdf-generation-wrapper .flex-col.md\\:flex-row {
                            flex-direction: row !important;
                        }

                        /* Force desktop display - lg:block, xl:block */
                        .pdf-generation-wrapper .lg\\:block,
                        .pdf-generation-wrapper .xl\\:block {
                            display: block !important;
                        }

                        /* Force desktop gaps - comprehensive overrides including XL */
                        .pdf-generation-wrapper [class*="lg\\:gap-"],
                        .pdf-generation-wrapper [class*="xl\\:gap-"] {
                            /* Attempt to reset gap if needed or rely on specific overrides */
                        }
                        .pdf-generation-wrapper [class*="lg\\:gap-16"] { gap: 4rem !important; }
                        .pdf-generation-wrapper [class*="lg\\:gap-10"] { gap: 2.5rem !important; }
                        .pdf-generation-wrapper [class*="lg\\:gap-8"] { gap: 2rem !important; }
                        .pdf-generation-wrapper [class*="lg\\:gap-6"] { gap: 1.5rem !important; }
                        .pdf-generation-wrapper [class*="lg\\:gap-4"] { gap: 1rem !important; }
                        
                        /* XL Gaps */
                        .pdf-generation-wrapper [class*="xl\\:gap-8"] { gap: 2rem !important; }

                        /* Force desktop margins - comprehensive overrides */
                        .pdf-generation-wrapper [class*="lg\\:mt-56"] { margin-top: 14rem !important; }
                        .pdf-generation-wrapper [class*="lg\\:mt-48"] { margin-top: 12rem !important; }
                        .pdf-generation-wrapper [class*="lg\\:mt-32"] { margin-top: 8rem !important; }
                        .pdf-generation-wrapper [class*="lg\\:mt-20"] { margin-top: 5rem !important; }

                        /* Force desktop padding */
                        .pdf-generation-wrapper [class*="lg\\:py-0"],
                        .pdf-generation-wrapper [class*="xl\\:py-0"],
                        .pdf-generation-wrapper [class*="sm\\:py-0"] {
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                        }
                        .pdf-generation-wrapper [class*="lg\\:px-20"] {
                            padding-left: 5rem !important;
                            padding-right: 5rem !important;
                        }
                        .pdf-generation-wrapper [class*="lg\\:px-0"],
                        .pdf-generation-wrapper [class*="xl\\:px-0"] {
                            padding-left: 0 !important;
                            padding-right: 0 !important;
                        }

                        /* Force desktop widths/heights - include XL min-h */
                        .pdf-generation-wrapper [class*="lg\\:w-\\[200px\\]"] { width: 200px !important; }
                        .pdf-generation-wrapper [class*="lg\\:h-\\[200px\\]"] { height: 200px !important; }
                        
                        /* SixthPage XL min-height */
                        .pdf-generation-wrapper [class*="xl\\:min-h-\\[600px\\]"] { min-height: 600px !important; }
                        .pdf-generation-wrapper [class*="xl\\:w-1/2"] { width: 50% !important; }

                        /* Force desktop text alignment */
                        .pdf-generation-wrapper [class*="lg\\:text-left"] { text-align: left !important; }
                        .pdf-generation-wrapper [class*="lg\\:text-right"] { text-align: right !important; }
                        .pdf-generation-wrapper [class*="lg\\:text-end"] { text-align: end !important; }

                        /* Force desktop sizing for ImageBox - using px values based on 1920px container width */

                        /* Size: default (11vw) */
                        .pdf-generation-wrapper .h-40.w-40.sm\\:h-28.sm\\:w-28.lg\\:h-\\[11vw\\].lg\\:w-\\[11vw\\] {
                            height: 211px !important;
                            width: 211px !important;
                        }
                        /* Size: large (14vw) */
                        .pdf-generation-wrapper .h-56.w-56.sm\\:h-36.sm\\:w-36.lg\\:h-\\[14vw\\].lg\\:w-\\[14vw\\] {
                            height: 269px !important;
                            width: 269px !important;
                        }
                        /* Size: xlarge (18vw) */
                        .pdf-generation-wrapper .h-64.w-64.sm\\:h-40.sm\\:w-40.lg\\:h-\\[18vw\\].lg\\:w-\\[18vw\\] {
                            height: 346px !important;
                            width: 346px !important;
                        }
                        /* Box widths */
                        .pdf-generation-wrapper .w-40.sm\\:w-28.lg\\:w-\\[11vw\\] { width: 211px !important; }
                        .pdf-generation-wrapper .w-56.sm\\:w-36.lg\\:w-\\[14vw\\] { width: 269px !important; }
                        .pdf-generation-wrapper .w-64.sm\\:w-40.lg\\:w-\\[18vw\\] { width: 346px !important; }

                        /* Horizontal box - 18vw = 346px, 38vw = 730px */
                        .pdf-generation-wrapper .h-\\[200px\\].w-full.max-w-\\[90vw\\].sm\\:h-\\[180px\\].sm\\:w-\\[400px\\].lg\\:h-\\[18vw\\].lg\\:w-\\[38vw\\] {
                            height: 346px !important;
                            width: 730px !important;
                            max-width: none !important;
                        }

                        /* Vertical boxes - 15vw = 288px, 13vw = 250px */
                        .pdf-generation-wrapper .h-\\[220px\\].w-\\[180px\\].sm\\:h-\\[160px\\].sm\\:w-\\[140px\\].lg\\:h-\\[15vw\\].lg\\:w-\\[13vw\\] {
                            height: 288px !important;
                            width: 250px !important;
                        }
                        /* Tall vertical - 38vw = 730px, 18vw = 346px */
                        .pdf-generation-wrapper .h-\\[400px\\].w-\\[200px\\].sm\\:h-\\[400px\\].sm\\:w-\\[180px\\].lg\\:h-\\[38vw\\].lg\\:w-\\[18vw\\] {
                            height: 730px !important;
                            width: 346px !important;
                        }

                        /* Portrait boxes - 11vw = 211px, 14vw = 269px */
                        .pdf-generation-wrapper .w-40.h-56.sm\\:w-28.sm\\:h-36.lg\\:w-\\[11vw\\].lg\\:h-\\[14vw\\] {
                            width: 211px !important;
                            height: 269px !important;
                        }
                        /* Large portrait - 21vw = 403px, 28vw = 538px */
                        .pdf-generation-wrapper .w-64.h-80.sm\\:w-56.sm\\:h-80.lg\\:w-\\[21vw\\].lg\\:h-\\[28vw\\] {
                            width: 403px !important;
                            height: 538px !important;
                        }

                        /* White bar sizing */
                        .pdf-generation-wrapper .h-\\[12px\\].sm\\:h-\\[16px\\].lg\\:h-\\[20px\\] {
                            height: 20px !important;
                        }

                        /* ForteenPage vw overrides - based on 1920px width */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[10vw\\]"] { font-size: 192px !important; }
                        .pdf-generation-wrapper [class*="lg\\:text-\\[12vw\\]"] { font-size: 230px !important; }
                        .pdf-generation-wrapper [class*="lg\\:text-\\[18vw\\]"] { font-size: 346px !important; }
                        .pdf-generation-wrapper [class*="lg\\:top-\\[10vw\\]"] { top: 192px !important; }
                        .pdf-generation-wrapper [class*="lg\\:top-\\[6vw\\]"] { top: 115px !important; }
                        .pdf-generation-wrapper [class*="lg\\:leading-\\[10vw\\]"] { line-height: 192px !important; }
                        .pdf-generation-wrapper [class*="lg\\:w-\\[42vw\\]"] { width: 806px !important; }
                        .pdf-generation-wrapper [class*="lg\\:left-\\[6vw\\]"] { left: 115px !important; }
                        .pdf-generation-wrapper [class*="lg\\:left-\\[2vw\\]"] { left: 38px !important; }
                        .pdf-generation-wrapper [class*="lg\\:right-\\[11vw\\]"] { right: 211px !important; }
                        .pdf-generation-wrapper [class*="lg\\:top-\\[22vw\\]"] { top: 422px !important; }
                        .pdf-generation-wrapper [class*="lg\\:top-\\[3vw\\]"] { top: 58px !important; }
                        
                        /* Absolute positioning overrides via CSS for SixthPage wrappers */
                        .pdf-generation-wrapper .lg\\:absolute { position: absolute !important; }
                        .pdf-generation-wrapper .lg\\:relative { position: relative !important; }

                        /* Non-prefixed vw classes */
                        .pdf-generation-wrapper [class*="left-\\[2vw\\]"] { left: 38px !important; }

                        /* Force max-width to desktop values */
                        .pdf-generation-wrapper .max-w-\\[90vw\\] { max-width: none !important; }

                        /* Force desktop padding */
                        .pdf-generation-wrapper .px-4 {
                            padding-left: 1rem !important;
                            padding-right: 1rem !important;
                        }
                        .pdf-generation-wrapper .py-10.sm\\:py-0 {
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                        }

                        /* Ensure flex-wrap behaves correctly */
                        .pdf-generation-wrapper .flex-wrap { flex-wrap: wrap !important; }

                        /* --- SPECIFIC PAGE FIXES --- */

                        /* ========== PAGE 1 (EigthPage) - Text cut from right ========== */
                        /* lg:text-[5vh] -> ~54px */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[5vh\\]"] { font-size: 54px !important; }
                        /* lg:text-[20vh] -> ~200px (slightly smaller to prevent overflow) */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[20vh\\]"] { font-size: 200px !important; }
                        /* Ensure xl:min-h-screen works */
                        .pdf-generation-wrapper [class*="xl\\:min-h-screen"] { min-height: 1080px !important; }
                        /* Fix text overflow for EigthPage */
                        .pdf-generation-wrapper .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }

                        /* ========== PAGE 3 (NinthPage) - Heading issue ========== */
                        /* lg:text-[13vh] -> ~130px (slightly smaller for better fit) */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[13vh\\]"] { font-size: 130px !important; }
                        /* lg:text-[4vh] -> ~43px */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[4vh\\]"] { font-size: 43px !important; }
                        /* lg:min-h-[80%] */
                        .pdf-generation-wrapper [class*="lg\\:min-h-\\[80\\%\\]"] { min-height: 80% !important; height: 80% !important; }
                        /* Force flex-row for NinthPage */
                        .pdf-generation-wrapper .flex-col.xl\\:flex-row { flex-direction: row !important; }

                        /* ========== PAGE 6 (TwelfthPage) ========== */
                        /* lg:text-[10vh] -> ~108px */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[10vh\\]"] { font-size: 108px !important; }
                        /* lg:text-[2vh] -> ~21px */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[2vh\\]"] { font-size: 21px !important; }
                        /* Fix height issue - ensure it doesn't overflow wildly */
                        .pdf-generation-wrapper .min-h-\\[50vh\\].xl\\:min-h-screen { min-height: 1080px !important; height: 1080px !important; }

                        /* ========== PAGE 9 (ForteenPage) - Mobile match desktop ========== */
                        /* lg:text-[10vw] -> ~192px (based on 1920 width) */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[10vw\\]"] { font-size: 192px !important; }
                        /* lg:text-[12vw] -> ~230px */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[12vw\\]"] { font-size: 230px !important; }
                        /* lg:text-[18vw] -> ~345px */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[18vw\\]"] { font-size: 345px !important; }
                        /* lg:top-[10vw] -> ~192px */
                        .pdf-generation-wrapper [class*="lg\\:top-\\[10vw\\]"] { top: 192px !important; }
                        /* lg:top-[6vw] -> ~115px */
                        .pdf-generation-wrapper [class*="lg\\:top-\\[6vw\\]"] { top: 115px !important; }
                        /* lg:leading-[10vw] */
                        .pdf-generation-wrapper [class*="lg\\:leading-\\[10vw\\]"] { line-height: 192px !important; }
                        /* lg:w-[42vw] -> ~806px */
                        .pdf-generation-wrapper [class*="lg\\:w-\\[42vw\\]"] { width: 806px !important; }
                        /* lg:left-[2vw] */
                        .pdf-generation-wrapper [class*="left-\\[2vw\\]"] { left: 38px !important; }
                        /* Force desktop layout for ForteenPage on mobile */
                        .pdf-generation-wrapper .hidden.lg\\:block { display: block !important; }
                        .pdf-generation-wrapper .xl\\:hidden { display: none !important; }
                        /* lg:text-end and lg:text-left */
                        .pdf-generation-wrapper [class*="lg\\:text-end"] { text-align: end !important; }
                        .pdf-generation-wrapper [class*="lg\\:text-left"] { text-align: left !important; }
                        /* Force rotate */
                        .pdf-generation-wrapper .rotate-\\[-10deg\\] { transform: rotate(-10deg) !important; }

                        /* ========== PAGE 10 (FifthPage) ========== */
                        /* lg:text-[12vh] -> ~130px */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[12vh\\]"] { font-size: 130px !important; }
                        /* lg:leading-[70px] */
                        .pdf-generation-wrapper [class*="lg\\:leading-\\[70px\\]"] { line-height: 70px !important; }
                        /* lg:min-h-[50%] */
                        .pdf-generation-wrapper [class*="lg\\:min-h-\\[50\\%\\]"] { min-height: 50% !important; }
                        /* lg:min-w-[40%] */
                        .pdf-generation-wrapper [class*="lg\\:min-w-\\[40\\%\\]"] { min-width: 40% !important; }

                        /* ========== PAGE 13 (ForthPage) - Text too big on desktop ========== */
                        /* REDUCED sizes for better fit */
                        /* lg:text-[30vh] -> ~240px (was 324px, now smaller) */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[30vh\\]"] { font-size: 240px !important; }
                        /* lg:text-[19vh] -> ~160px (was 205px, now smaller) */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[19vh\\]"] { font-size: 160px !important; }
                        /* lg:text-[40vh] -> ~320px (was 432px, now smaller) */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[40vh\\]"] { font-size: 320px !important; }
                        /* lg:leading-[25vh] -> ~200px (was 270px, now smaller) */
                        .pdf-generation-wrapper [class*="lg\\:leading-\\[25vh\\]"] { line-height: 200px !important; }
                        /* lg:text-[3vh] -> ~32px */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[3vh\\]"] { font-size: 32px !important; }

                        /* ========== PAGE 14 (SecondPage) ========== */
                        .pdf-generation-wrapper [class*="lg\\:w-\\[200px\\]"] { width: 200px !important; }
                        .pdf-generation-wrapper [class*="lg\\:h-\\[200px\\]"] { height: 200px !important; }

                        /* ========== PAGE 12 (SeventhPage) ========== */
                        .pdf-generation-wrapper [class*="lg\\:gap-10"] { gap: 2.5rem !important; }

                        /* ========== PAGE 15 (ThirdPage) - Text bigger ========== */
                        /* lg:text-[140px] -> 170px (increased) */
                        .pdf-generation-wrapper [class*="lg\\:text-\\[140px\\]"] { font-size: 170px !important; }
                        /* lg:text-6xl -> ~60px (standard) */
                        .pdf-generation-wrapper .lg\\:text-6xl { font-size: 60px !important; }
                        /* lg:text-xl -> 20px */
                        .pdf-generation-wrapper .lg\\:text-xl { font-size: 20px !important; }

                        /* ========== PAGE 16 (FirstPage) ========== */
                        .pdf-generation-wrapper [class*="lg\\:min-h-\\[60\\%\\]"] { min-height: 60% !important; }

                        /* ========== General Fixes ========== */
                        .pdf-generation-wrapper .lg\\:absolute { position: absolute !important; }
                        .pdf-generation-wrapper .lg\\:relative { position: relative !important; }
                        .pdf-generation-wrapper .lg\\:block { display: block !important; }
                        .pdf-generation-wrapper .lg\\:min-h-screen { min-height: 1080px !important; }
                    `}
                </style>

                <div ref={containerRef} className="pdf-generation-wrapper">
                    <BookDataProvider
                        textData={data.textData}
                        images={data.images}
                        boxData={data.boxData}
                        dynamicBoxes={data.dynamicBoxes}
                        isReadOnly={true}
                        isPDF={true} /* FORCE DESKTOP LAYOUT via Context */
                    >
                        {pages.map((page, index) => (
                            <div
                                key={index}
                                className="page-snapshot-container"
                                style={{
                                    width: `${captureDim.width}px`,
                                    height: `${captureDim.height}px`,
                                    position: "relative",
                                    background: "white",
                                    overflow: "hidden"
                                }}
                            >
                                {page}
                            </div>
                        ))}
                    </BookDataProvider>
                </div>
            </div>
        </>
    );
})
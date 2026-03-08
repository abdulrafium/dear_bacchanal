"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Facebook, Twitter, Share2, Check, Loader2, ExternalLink } from "lucide-react";

interface ShareBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareBookModal({ isOpen, onClose }: ShareBookModalProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateShareLink();
    }
  }, [isOpen]);

  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/templates/share", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setShareUrl(data.shareUrl);
        setIsPublic(data.isPublic);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate share link");
      }
    } catch (error) {
      console.error("Error generating share link:", error);
      toast.error("Failed to generate share link");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToTwitter = () => {
    const text = "Check out my Carnival Book! 🎉";
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToWhatsApp = () => {
    const text = `Check out my Carnival Book! 🎉 ${shareUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const togglePrivacy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/templates/share", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublic: !isPublic }),
      });

      if (response.ok) {
        setIsPublic(!isPublic);
        toast.success(
          !isPublic
            ? "Book is now public - anyone with the link can view it"
            : "Book is now private - link is disabled"
        );
      } else {
        toast.error("Failed to update privacy settings");
      }
    } catch (error) {
      toast.error("Failed to update privacy settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[60vh] rounded-[2.5vh] border-[0.2vh] border-border shadow-2xl">
        <DialogHeader className="mb-[2vh]">
          <DialogTitle className="text-[2.5vh] font-bold">Share Your Carnival Book</DialogTitle>
          <DialogDescription className="text-[1.8vh] text-muted-foreground mt-[0.5vh]">
            Share your carnival memories with friends and family
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-[2.4vh] py-[1.5vh]">
          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-[1.6vh] bg-muted/50 rounded-[1.2vh]">
            <div className="flex-1">
              <h3 className="font-semibold text-[1.8vh]">Book Privacy</h3>
              <p className="text-[1.4vh] text-muted-foreground mt-[0.2vh]">
                {isPublic
                  ? "Anyone with the link can view your book"
                  : "Your book is private"}
              </p>
            </div>
            <Button
              variant={isPublic ? "default" : "outline"}
              className="h-[4vh] px-[1.5vh] text-[1.4vh] rounded-[0.8vh]"
              onClick={togglePrivacy}
              disabled={isLoading}
            >
              {isPublic ? "Public" : "Private"}
            </Button>
          </div>

          {/* Share Link */}
          {isGenerating ? (
            <div className="flex items-center justify-center py-[3vh]">
              <Loader2 className="w-[3vh] h-[3vh] animate-spin text-coral" />
            </div>
          ) : shareUrl && isPublic ? (
            <>
              <div className="space-y-[1vh]">
                <label className="text-[1.6vh] font-semibold">Share Link</label>
                <div className="flex gap-[1vh]">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    onClick={(e) => e.currentTarget.select()}
                    className="flex-1 px-[1.5vh] py-[1vh] text-[1.6vh] bg-muted rounded-[1vh] border-[0.1vh] border-border focus:outline-none focus:ring-[0.2vh] focus:ring-coral"
                  />
                  <Button
                    variant="outline"
                    className="w-[4.5vh] h-[4.5vh] flex-shrink-0 rounded-[1vh] border-[0.1vh] p-0 flex items-center justify-center"
                    onClick={copyToClipboard}
                    title="Copy Link"
                  >
                    {isCopied ? (
                      <Check className="w-[2vh] h-[2vh] text-green-500" />
                    ) : (
                      <Copy className="w-[2vh] h-[2vh]" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-[4.5vh] h-[4.5vh] flex-shrink-0 rounded-[1vh] border-[0.1vh] p-0 flex items-center justify-center"
                    onClick={() => window.open(shareUrl, "_blank")}
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-[2vh] h-[2vh]" />
                  </Button>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div className="space-y-[1vh]">
                <label className="text-[1.6vh] font-semibold">Share On</label>
                <div className="grid grid-cols-3 gap-[1.2vh]">
                  <Button
                    variant="outline"
                    onClick={shareToFacebook}
                    className="flex items-center gap-[1vh] h-[5vh] text-[1.6vh] rounded-[1vh] border-[0.1vh]"
                  >
                    <Facebook className="w-[2vh] h-[2vh]" />
                    <span className="hidden sm:inline">Facebook</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={shareToTwitter}
                    className="flex items-center gap-[1vh] h-[5vh] text-[1.6vh] rounded-[1vh] border-[0.1vh]"
                  >
                    <Twitter className="w-[2vh] h-[2vh]" />
                    <span className="hidden sm:inline">Twitter</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={shareToWhatsApp}
                    className="flex items-center gap-[1vh] h-[5vh] text-[1.6vh] rounded-[1vh] border-[0.1vh]"
                  >
                    <Share2 className="w-[2vh] h-[2vh]" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-[4vh] text-muted-foreground">
              <p className="text-[1.6vh]">
                Make your book public to generate a share link
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-[1vh]">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-[4.5vh] px-[2.5vh] text-[1.6vh] rounded-[1vh] border-[0.1vh]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
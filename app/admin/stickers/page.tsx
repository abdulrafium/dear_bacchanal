"use client";

import { useEffect, useState } from "react";
import { generateUploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import { toast } from "sonner";
import { Trash2, Loader2, ImagePlus } from "lucide-react";

const UploadDropzone = generateUploadDropzone<OurFileRouter>();

interface Sticker {
  _id: string;
  url: string;
  name: string;
}

export default function AdminStickersPage() {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch stickers
  useEffect(() => {
    fetchStickers();
  }, []);

  const fetchStickers = async () => {
    try {
      const res = await fetch("/api/admin/stickers");
      if (res.ok) {
        const data = await res.json();
        setStickers(data.stickers);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stickers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sticker?")) return;
    
    try {
      const res = await fetch(`/api/admin/stickers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStickers((prev) => prev.filter((s) => s._id !== id));
        toast.success("Sticker deleted");
      } else {
        toast.error("Failed to delete sticker");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleUploadComplete = async (res: any[]) => {
    if (!res || res.length === 0) return;
    
    toast.success(`${res.length} sticker(s) uploaded successfully!`);
    
    for (const file of res) {
      try {
        await fetch("/api/admin/stickers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: file.url, name: file.name }),
        });
      } catch (err) {
        console.error("Failed to save sticker", file.name);
      }
    }
    
    fetchStickers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Global Stickers Array</h1>
        <p className="text-white/40 text-sm">Upload transparent PNG graphics to allow users to apply them onto pages</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-medium mb-4 flex items-center gap-2">
          <ImagePlus className="w-5 h-5 text-red-500" /> Upload New Stickers
        </h2>
        <div className="bg-[#0f0f0f] rounded-xl border border-white/5 p-4">
          <UploadDropzone
            endpoint="stickerUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error: Error) => {
              toast.error(`Upload failed: ${error.message}`);
            }}
            className="ut-label:text-white ut-allowed-content:text-white/40 ut-button:bg-red-600 ut-button:ut-readying:bg-red-600/50"
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-white font-medium mb-4">Available Stickers ({stickers.length})</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
          </div>
        ) : stickers.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 text-white/40">
            No stickers found. Upload your first pack!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {stickers.map((sticker) => (
              <div key={sticker._id} className="relative group bg-white/5 border border-white/10 rounded-xl aspect-square flex flex-col items-center justify-center p-2 hover:bg-white/10 transition-colors">
                <img 
                  src={sticker.url} 
                  alt={sticker.name} 
                  className="max-w-full max-h-[70%] object-contain"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDelete(sticker._id)}
                    className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg"
                    title="Delete Sticker"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="mt-2 text-[10px] text-white/50 truncate w-full text-center px-1">
                  {sticker.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

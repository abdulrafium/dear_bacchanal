import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const assetsDir = path.join(process.cwd(), "public", "assets");
    
    // Check if directory exists
    if (!fs.existsSync(assetsDir)) {
      return NextResponse.json({ images: [], stickers: [] });
    }

    // Read all files
    const files = fs.readdirSync(assetsDir);
    
    // Filter image files
    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // Map to URLs
    const urls = imageFiles.map(file => `/assets/${file}`);

    // Create unique list
    const uniqueUrls = Array.from(new Set(urls));

    // Return as both images and stickers to be used by both panels
    const items = uniqueUrls.map((url, i) => ({
      _id: `local-${i}`,
      id: `local-${i}`,
      url: url,
      name: path.basename(url, path.extname(url))
    }));

    return NextResponse.json({ 
      images: items,
      stickers: items
    });
  } catch (error) {
    console.error("Error fetching local assets:", error);
    return NextResponse.json({ images: [], stickers: [] }, { status: 500 });
  }
}

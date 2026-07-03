export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// Returns the embed font as base64 so the browser doesn't have to do binary conversion
export async function GET() {
  try {
    const fontPath = path.join(process.cwd(), "public", "embed-font.ttf");
    const fontBuffer = fs.readFileSync(fontPath);
    const fontBase64 = fontBuffer.toString("base64");
    return NextResponse.json({ fontBase64 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

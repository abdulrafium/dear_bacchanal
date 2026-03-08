import { NextRequest, NextResponse } from "next/server";

export function verifyAdminToken(req: NextRequest): boolean {
  const token = req.cookies.get("adminToken")?.value;
  if (!token) return false;

  const tokens = (global as any).__adminTokens || {};
  const tokenData = tokens[token];

  if (!tokenData) return false;
  if (Date.now() > tokenData.expiry) {
    delete tokens[token];
    return false;
  }

  return true;
}

export function adminAuthMiddleware(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null; // null means authenticated, proceed
}

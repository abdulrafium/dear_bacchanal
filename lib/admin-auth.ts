import { NextResponse } from "next/server";
import { getServerAuth } from "./server-auth";

export async function adminAuthMiddleware() {
  const user = await getServerAuth();
  
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  return null; // null means authenticated, proceed
}

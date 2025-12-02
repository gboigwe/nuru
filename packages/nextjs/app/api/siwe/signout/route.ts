/**
 * SIWE Sign Out Endpoint
 *
 * Destroys authenticated session and clears session cookies.
 * Called when user disconnects wallet or logs out.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Clear session cookie
    cookieStore.delete("siwe-session");

    // Clear any remaining nonce
    cookieStore.delete("siwe-nonce");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json({ error: "Sign out failed" }, { status: 500 });
  }
}

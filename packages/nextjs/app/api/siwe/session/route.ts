/**
 * SIWE Session Retrieval Endpoint
 *
 * Returns current authenticated session if valid.
 * Used by Reown AppKit to restore sessions on page reload.
 *
 * @see https://docs.login.xyz/general-information/siwe-overview/session-management
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("siwe-session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    // Parse session data
    const sessionData = JSON.parse(sessionCookie);

    // Check if session is expired
    if (Date.now() > sessionData.expiresAt) {
      // Clear expired session
      cookieStore.delete("siwe-session");
      return NextResponse.json({ session: null }, { status: 200 });
    }

    // Return valid session
    return NextResponse.json(
      {
        session: {
          address: sessionData.address,
          chainId: sessionData.chainId,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Error retrieving session:", error);
    return NextResponse.json({ session: null }, { status: 200 });
  }
}

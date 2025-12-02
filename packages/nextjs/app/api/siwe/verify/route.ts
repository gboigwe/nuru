/**
 * SIWE Message Verification Endpoint
 *
 * Verifies SIWE (Sign-In with Ethereum) message signatures.
 * Creates authenticated sessions for verified users.
 *
 * @see https://docs.login.xyz/general-information/siwe-overview/verify-login
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SiweMessage } from "siwe";

const SESSION_EXPIRY = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json();

    if (!message || !signature) {
      return NextResponse.json({ error: "Message and signature required" }, { status: 400 });
    }

    // Get stored nonce from cookie
    const cookieStore = await cookies();
    const storedNonce = cookieStore.get("siwe-nonce")?.value;

    if (!storedNonce) {
      return NextResponse.json({ error: "Nonce not found or expired" }, { status: 401 });
    }

    // Parse and verify SIWE message
    const siweMessage = new SiweMessage(message);

    // Verify nonce matches
    if (siweMessage.nonce !== storedNonce) {
      return NextResponse.json({ error: "Invalid nonce" }, { status: 401 });
    }

    // Verify signature
    const verificationResult = await siweMessage.verify({ signature });

    if (!verificationResult.success) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Create session data
    const sessionData = {
      address: siweMessage.address,
      chainId: siweMessage.chainId,
      issuedAt: new Date(siweMessage.issuedAt || Date.now()).getTime(),
      expiresAt: Date.now() + SESSION_EXPIRY,
    };

    // Store session in cookie
    cookieStore.set("siwe-session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_EXPIRY / 1000,
      path: "/",
    });

    // Clear used nonce
    cookieStore.delete("siwe-nonce");

    return NextResponse.json(
      {
        success: true,
        address: sessionData.address,
        chainId: sessionData.chainId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error verifying SIWE message:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

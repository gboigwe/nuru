/**
 * SIWE Nonce Generation Endpoint
 *
 * Generates cryptographically secure random nonces for SIWE authentication.
 * Nonces are stored server-side with expiration to prevent replay attacks.
 *
 * @see https://docs.login.xyz/general-information/siwe-overview/nonce-management
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const NONCE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cryptographically secure nonce
 */
function generateNonce(): string {
  return crypto.randomBytes(32).toString("base64");
}

export async function GET() {
  try {
    // Generate secure nonce
    const nonce = generateNonce();
    const expiresAt = Date.now() + NONCE_EXPIRY;

    // Store nonce in cookie (temporary solution - use Redis/DB in production)
    const cookieStore = await cookies();
    cookieStore.set("siwe-nonce", nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: NONCE_EXPIRY / 1000,
      path: "/",
    });

    return NextResponse.json(
      {
        nonce,
        expiresAt,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Error generating nonce:", error);
    return NextResponse.json({ error: "Failed to generate nonce" }, { status: 500 });
  }
}

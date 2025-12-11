/**
 * Filecoin/IPFS Storage API Route
 *
 * Server-side endpoint for storing voice receipts to IPFS/Filecoin
 * Uses Kubo RPC client for direct IPFS interaction
 *
 * POST /api/filecoin/store
 *
 * Request body:
 * - audioData: Base64 encoded audio blob
 * - metadata: Payment metadata (sender, recipient, amount, timestamp)
 *
 * Response:
 * - cid: IPFS Content Identifier
 * - size: File size in bytes
 * - timestamp: Storage timestamp
 */

import { NextRequest, NextResponse } from "next/server";
import { create } from "kubo-rpc-client";

// IPFS/Kubo RPC client configuration
const IPFS_API_URL = process.env.IPFS_API_URL || "https://ipfs.infura.io:5001";
const IPFS_PROJECT_ID = process.env.IPFS_PROJECT_ID;
const IPFS_PROJECT_SECRET = process.env.IPFS_PROJECT_SECRET;

/**
 * Create authenticated IPFS client
 */
function createIPFSClient() {
  const auth =
    IPFS_PROJECT_ID && IPFS_PROJECT_SECRET
      ? `Basic ${Buffer.from(`${IPFS_PROJECT_ID}:${IPFS_PROJECT_SECRET}`).toString("base64")}`
      : undefined;

  return create({
    url: IPFS_API_URL,
    headers: auth
      ? {
          authorization: auth,
        }
      : undefined,
  });
}

/**
 * POST /api/filecoin/store
 * Store voice receipt to IPFS
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { audioData, metadata } = body;

    if (!audioData) {
      return NextResponse.json({ error: "Audio data is required" }, { status: 400 });
    }

    // Decode base64 audio data
    const audioBuffer = Buffer.from(audioData.replace(/^data:audio\/\w+;base64,/, ""), "base64");

    // Create IPFS client
    const ipfs = createIPFSClient();

    // Prepare metadata
    const receiptMetadata = {
      ...metadata,
      storedAt: new Date().toISOString(),
      mimeType: "audio/webm", // or "audio/wav"
      version: "1.0",
    };

    // Store metadata as separate file
    const metadataBuffer = Buffer.from(JSON.stringify(receiptMetadata, null, 2));

    // Add files to IPFS
    const results = await ipfs.addAll([
      {
        path: "voice-receipt.webm",
        content: audioBuffer,
      },
      {
        path: "metadata.json",
        content: metadataBuffer,
      },
    ]);

    // Collect CIDs
    const files = [];
    for await (const result of results) {
      files.push({
        path: result.path,
        cid: result.cid.toString(),
        size: result.size,
      });
    }

    // Get the audio file CID (first file)
    const audioCID = files.find(f => f.path === "voice-receipt.webm")?.cid;
    const metadataCID = files.find(f => f.path === "metadata.json")?.cid;

    if (!audioCID) {
      throw new Error("Failed to get audio CID from IPFS");
    }

    // Pin the content to ensure persistence
    try {
      await ipfs.pin.add(audioCID);
      console.log(`✅ Pinned audio to IPFS: ${audioCID}`);
    } catch (pinError) {
      console.warn("⚠️ Failed to pin content:", pinError);
      // Continue even if pinning fails
    }

    // Return success response
    return NextResponse.json({
      success: true,
      cid: audioCID,
      metadataCid: metadataCID,
      size: files.find(f => f.path === "voice-receipt.webm")?.size || 0,
      timestamp: new Date().toISOString(),
      gateways: [
        `https://ipfs.io/ipfs/${audioCID}`,
        `https://cloudflare-ipfs.com/ipfs/${audioCID}`,
        `https://gateway.pinata.cloud/ipfs/${audioCID}`,
      ],
    });
  } catch (error) {
    console.error("❌ IPFS storage error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to store to IPFS",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/filecoin/store?cid=xxx
 * Retrieve voice receipt from IPFS
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cid = searchParams.get("cid");

    if (!cid) {
      return NextResponse.json({ error: "CID is required" }, { status: 400 });
    }

    // Try fetching from IPFS gateways
    const gateways = [
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `${IPFS_API_URL}/api/v0/cat?arg=${cid}`,
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway, {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (response.ok) {
          const audioBlob = await response.blob();

          return new NextResponse(audioBlob, {
            headers: {
              "Content-Type": "audio/webm",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      } catch (gatewayError) {
        console.warn(`Failed to fetch from gateway: ${gateway}`, gatewayError);
        continue;
      }
    }

    return NextResponse.json({ error: "Failed to retrieve from IPFS" }, { status: 404 });
  } catch (error) {
    console.error("❌ IPFS retrieval error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to retrieve from IPFS",
      },
      { status: 500 },
    );
  }
}

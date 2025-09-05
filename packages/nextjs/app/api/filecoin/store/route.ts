import { NextRequest, NextResponse } from "next/server";
import { RPC_URLS, Synapse } from "@filoz/synapse-sdk";

export async function POST(request: NextRequest) {
  try {
    // Get the service provider private key (server-side only)
    const servicePrivateKey = process.env.FILECOIN_SERVICE_PRIVATE_KEY;

    if (!servicePrivateKey || servicePrivateKey === "your-filecoin-private-key-here") {
      return NextResponse.json(
        {
          success: false,
          error: "Service provider wallet not configured",
        },
        { status: 400 },
      );
    }

    // Parse the request body
    const body = await request.json();
    const { audioBuffer, metadata, test } = body;

    // Handle test requests
    if (test) {
      return NextResponse.json({ success: true, message: "Server configured properly" });
    }

    if (!audioBuffer || !metadata) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing audio data or metadata",
        },
        { status: 400 },
      );
    }

    console.log("Initializing Synapse SDK for server-side storage...");

    // Initialize Synapse SDK with service provider key
    const synapse = await Synapse.create({
      privateKey: servicePrivateKey,
      rpcURL: RPC_URLS.calibration.websocket, // Using testnet
    });

    console.log("Creating storage service...");
    const storage = await synapse.createStorage();

    console.log("Uploading audio to Filecoin...");
    // Convert base64 audio back to buffer
    const audioData = new Uint8Array(Buffer.from(audioBuffer, "base64"));
    const audioUpload = await storage.upload(audioData);

    console.log("Uploading metadata to Filecoin...");
    // Upload enhanced metadata
    const enhancedMetadata = {
      ...metadata,
      uploadTimestamp: Date.now(),
      version: "1.0",
      platform: "VoicePay Africa",
      storage: "Filecoin Synapse SDK",
      network: "calibration",
    };

    const metadataData = new TextEncoder().encode(JSON.stringify(enhancedMetadata, null, 2));
    const metadataUpload = await storage.upload(metadataData);

    const result = {
      success: true,
      pieceCid: audioUpload.pieceCid,
      metadataPieceCid: metadataUpload.pieceCid,
      timestamp: Date.now(),
      retrievalUrl: `https://filecoin-retrieval.synapse.org/${audioUpload.pieceCid}`,
      filecoinProofs: ["PDP proof pending"],
      storageProvider: "Synapse Network Provider",
    };

    console.log("Voice receipt stored on Filecoin successfully:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Server-side Filecoin storage failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Storage operation failed",
      },
      { status: 500 },
    );
  }
}

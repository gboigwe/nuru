import { createPublicClient, http, fallback } from 'viem';
import { base } from 'viem/chains';

export class RPCFallbackProvider {
  private static instance: RPCFallbackProvider;
  private client: any;

  private constructor() {
    // Multiple RPC endpoints for BASE
    const rpcUrls = [
      process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL,
      process.env.NEXT_PUBLIC_QUICKNODE_RPC_URL,
      'https://mainnet.base.org', // Public RPC (fallback)
      'https://base.publicnode.com',
    ].filter(Boolean) as string[];

    // Create fallback transport
    this.client = createPublicClient({
      chain: base,
      transport: fallback(
        rpcUrls.map(url => http(url, {
          timeout: 10000, // 10 second timeout
          retryCount: 2,
          retryDelay: 1000,
        })),
        {
          rank: true, // Automatically rank providers by performance
        }
      ),
    });
  }

  static getInstance(): RPCFallbackProvider {
    if (!RPCFallbackProvider.instance) {
      RPCFallbackProvider.instance = new RPCFallbackProvider();
    }
    return RPCFallbackProvider.instance;
  }

  getClient() {
    return this.client;
  }

  /**
   * Test RPC health
   */
  async checkRPCHealth(): Promise<{
    healthy: number;
    total: number;
    details: Array<{ url: string; status: 'healthy' | 'unhealthy'; latency: number }>;
  }> {
    const rpcUrls = [
      process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL,
      process.env.NEXT_PUBLIC_QUICKNODE_RPC_URL,
      'https://mainnet.base.org',
      'https://base.publicnode.com',
    ].filter(Boolean) as string[];

    const results = await Promise.all(
      rpcUrls.map(async (url) => {
        const start = Date.now();
        try {
          const client = createPublicClient({
            chain: base,
            transport: http(url, { timeout: 5000 }),
          });
          await client.getBlockNumber();
          return {
            url,
            status: 'healthy' as const,
            latency: Date.now() - start,
          };
        } catch {
          return {
            url,
            status: 'unhealthy' as const,
            latency: -1,
          };
        }
      })
    );

    const healthy = results.filter(r => r.status === 'healthy').length;

    return {
      healthy,
      total: rpcUrls.length,
      details: results,
    };
  }
}

export const rpcFallbackProvider = RPCFallbackProvider.getInstance();

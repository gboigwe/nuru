/**
 * The Graph Client Service
 *
 * Client for querying the Nuru Voice Payment subgraph
 * Handles GraphQL requests with error handling and caching
 */

const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  "https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/nuru-voice-payments/version/latest";

/**
 * GraphQL query options
 */
export interface QueryOptions {
  variables?: Record<string, any>;
  cache?: boolean;
  cacheDuration?: number;
}

/**
 * Cache for GraphQL query results
 */
class QueryCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly DEFAULT_DURATION = 30000; // 30 seconds

  get(key: string, duration: number = this.DEFAULT_DURATION): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > duration) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const queryCache = new QueryCache();

/**
 * Execute a GraphQL query against the subgraph
 */
export async function graphQuery<T = any>(
  query: string,
  options: QueryOptions = {},
): Promise<T> {
  const { variables = {}, cache = true, cacheDuration } = options;

  // Generate cache key
  const cacheKey = `${query}:${JSON.stringify(variables)}`;

  // Check cache
  if (cache) {
    const cached = queryCache.get(cacheKey, cacheDuration);
    if (cached) {
      console.log("✅ Cache hit for query");
      return cached;
    }
  }

  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(", ")}`);
    }

    // Cache the result
    if (cache) {
      queryCache.set(cacheKey, result.data);
    }

    return result.data;
  } catch (error) {
    console.error("GraphQL query error:", error);
    throw error;
  }
}

/**
 * Clear the query cache
 */
export function clearCache(): void {
  queryCache.clear();
}

/**
 * Subscription handler (placeholder for future WebSocket subscriptions)
 */
export function graphSubscription(
  query: string,
  callback: (data: any) => void,
  onError?: (error: Error) => void,
): () => void {
  // TODO: Implement GraphQL subscriptions when The Graph supports it
  console.warn("GraphQL subscriptions not yet implemented");

  // Return unsubscribe function
  return () => {
    console.log("Unsubscribed from GraphQL subscription");
  };
}

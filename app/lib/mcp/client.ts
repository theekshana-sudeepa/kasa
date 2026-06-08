import type { MCPToolResult } from './types';

const MCP_ENDPOINT = 'https://mcp.kapruka.com/mcp';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: Record<string, unknown>;
}

interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export class KaprukaMCPClient {
  private sessionId: string | null = null;
  private requestCounter = 0;
  private initialized = false;

  private nextId(): number {
    return ++this.requestCounter;
  }

  private async sendRequest(body: JSONRPCRequest): Promise<JSONRPCResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(MCP_ENDPOINT, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        // Rate limited — back off and retry
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delayMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : BASE_DELAY_MS * Math.pow(2, attempt);
          await this.sleep(delayMs);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(
            `MCP request failed (${response.status}): ${errorText}`
          );
        }

        // Capture session ID from initialization response
        const mcpSessionId = response.headers.get('Mcp-Session-Id');
        if (mcpSessionId) {
          this.sessionId = mcpSessionId;
        }

        // Handle SSE / streaming responses — accumulate events
        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.includes('text/event-stream')) {
          return await this.parseSSEResponse(response);
        }

        const json = (await response.json()) as JSONRPCResponse;
        return json;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't retry on non-retriable errors
        if (
          lastError.message.includes('400') ||
          lastError.message.includes('401') ||
          lastError.message.includes('403') ||
          lastError.message.includes('404')
        ) {
          throw lastError;
        }

        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(BASE_DELAY_MS * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('MCP request failed after retries');
  }

  private async parseSSEResponse(response: Response): Promise<JSONRPCResponse> {
    const text = await response.text();
    const lines = text.split('\n');
    let lastData: string | null = null;

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        lastData = line.slice(6).trim();
      }
    }

    if (lastData) {
      try {
        return JSON.parse(lastData) as JSONRPCResponse;
      } catch {
        // If the accumulated data isn't valid JSON, wrap it
        return {
          jsonrpc: '2.0',
          id: 0,
          result: {
            content: [{ type: 'text', text: lastData }],
          },
        };
      }
    }

    throw new Error('No data received in SSE response');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: this.nextId(),
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: {
          name: 'kasa',
          version: '1.0.0',
        },
      },
    };

    const response = await this.sendRequest(request);

    if (response.error) {
      throw new Error(
        `MCP initialization failed: ${response.error.message}`
      );
    }

    this.initialized = true;
  }

  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult> {
    await this.initialize();

    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: this.nextId(),
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    };

    const response = await this.sendRequest(request);

    if (response.error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              message: response.error.message,
            }),
          },
        ],
        isError: true,
      };
    }

    const result = response.result as MCPToolResult | undefined;

    if (!result || !result.content) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: true, message: 'Empty response from MCP' }),
          },
        ],
        isError: true,
      };
    }

    return result;
  }

  /**
   * Parse the text content of an MCP tool result into a typed object.
   * Falls back to raw text if JSON parsing fails.
   */
  parseResult<T>(result: MCPToolResult): T {
    const textContent = result.content.find((c) => c.type === 'text');
    if (!textContent) {
      throw new Error('No text content in MCP result');
    }

    try {
      return JSON.parse(textContent.text) as T;
    } catch {
      return textContent.text as unknown as T;
    }
  }

  // ── Typed wrapper methods ───────────────────────────────────────────

  async searchProducts(params: {
    query: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    currency?: string;
    in_stock_only?: boolean;
    limit?: number;
  }): Promise<MCPToolResult> {
    return this.callTool('kapruka_search_products', {
      q: params.query,
      ...(params.category && { category: params.category }),
      ...(params.min_price !== undefined && { min_price: params.min_price }),
      ...(params.max_price !== undefined && { max_price: params.max_price }),
      ...(params.currency && { currency: params.currency }),
      in_stock_only: params.in_stock_only ?? true,
      limit: params.limit ?? 10,
    });
  }

  async getProduct(
    productId: string,
    currency?: string
  ): Promise<MCPToolResult> {
    return this.callTool('kapruka_get_product', {
      product_id: productId,
      ...(currency && { currency }),
    });
  }

  async listCategories(): Promise<MCPToolResult> {
    return this.callTool('kapruka_list_categories', {});
  }

  async listDeliveryCities(query: string): Promise<MCPToolResult> {
    return this.callTool('kapruka_list_delivery_cities', {
      query,
    });
  }

  async checkDelivery(
    city: string,
    date: string,
    productId: string
  ): Promise<MCPToolResult> {
    return this.callTool('kapruka_check_delivery', {
      city,
      date,
      product_id: productId,
    });
  }

  async createOrder(params: {
    items: Array<{ product_id: string; quantity: number }>;
    delivery_city: string;
    delivery_date: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    sender_name: string;
    sender_email: string;
    gift_message?: string;
  }): Promise<MCPToolResult> {
    return this.callTool('kapruka_create_order', params);
  }

  async trackOrder(orderNumber: string): Promise<MCPToolResult> {
    return this.callTool('kapruka_track_order', {
      order_number: orderNumber,
    });
  }
}

// ── Singleton instance ──────────────────────────────────────────────────

let clientInstance: KaprukaMCPClient | null = null;

export function getMCPClient(): KaprukaMCPClient {
  if (!clientInstance) {
    clientInstance = new KaprukaMCPClient();
  }
  return clientInstance;
}

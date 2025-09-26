/**
 * WebSocket Client with Auto-Reconnect
 * Handles connection management, auto-reconnection, and message queuing
 */

import { EventEmitter } from 'events';

interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

interface QueuedMessage {
  data: any;
  timestamp: number;
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: QueuedMessage[] = [];
  private isIntentionallyClosed = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(config: WebSocketConfig) {
    super();
    
    this.config = {
      url: config.url,
      protocols: config.protocols || undefined,
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval ?? 5000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? Infinity,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      debug: config.debug ?? false
    } as Required<WebSocketConfig>;
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }

  private async _connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.log('Already connected');
        resolve();
        return;
      }

      this.log(`Connecting to ${this.config.url}...`);
      this.isIntentionallyClosed = false;

      try {
        this.ws = new WebSocket(this.config.url, this.config.protocols);
        
        this.ws.onopen = () => {
          this.log('Connected successfully');
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Process queued messages
          this.processMessageQueue();
          
          this.emit('open');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          this.log('WebSocket error:', error);
          this.emit('error', error);
        };

        this.ws.onclose = (event) => {
          this.handleClose(event);
          if (this.connectionPromise) {
            reject(new Error(`Connection closed: ${event.reason || 'Unknown reason'}`));
            this.connectionPromise = null;
          }
        };
      } catch (error) {
        this.log('Failed to create WebSocket:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });
  }

  /**
   * Send message through WebSocket
   */
  public send(data: any): void {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(message);
        this.log('Message sent:', message);
      } catch (error) {
        this.log('Failed to send message:', error);
        this.queueMessage(data);
      }
    } else {
      this.log('WebSocket not connected, queueing message');
      this.queueMessage(data);
      
      // Try to reconnect if not already attempting
      if (this.config.reconnect && !this.reconnectTimer) {
        this.reconnect();
      }
    }
  }

  /**
   * Close WebSocket connection
   */
  public close(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client closing connection');
      this.ws = null;
    }
    
    this.messageQueue = [];
    this.emit('close', { code: 1000, reason: 'Client closed' });
  }

  /**
   * Get current connection state
   */
  public get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * Check if connected
   */
  public get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        data = event.data;
      }

      // Handle ping/pong for heartbeat
      if (data === 'pong' || (typeof data === 'object' && data.type === 'pong')) {
        this.log('Received pong');
        return;
      }

      this.emit('message', data);
    } catch (error) {
      this.log('Error handling message:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle connection close
   */
  private handleClose(event: CloseEvent): void {
    this.log(`Connection closed: ${event.code} - ${event.reason}`);
    this.stopHeartbeat();
    this.ws = null;
    
    this.emit('close', event);
    
    // Attempt reconnection if enabled and not intentionally closed
    if (this.config.reconnect && !this.isIntentionallyClosed) {
      if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.reconnect();
      } else {
        this.log('Max reconnection attempts reached');
        this.emit('maxReconnectAttemptsReached');
      }
    }
  }

  /**
   * Reconnect to WebSocket server
   */
  private reconnect(): void {
    if (this.reconnectTimer) {
      return; // Already attempting to reconnect
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
      } catch (error) {
        this.log('Reconnection failed:', error);
        // Will trigger another reconnection attempt via onclose handler
      }
    }, delay);
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
          this.log('Sent ping');
        } catch (error) {
          this.log('Failed to send ping:', error);
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(data: any): void {
    this.messageQueue.push({
      data,
      timestamp: Date.now()
    });
    
    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift(); // Remove oldest message
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }

    this.log(`Processing ${this.messageQueue.length} queued messages`);
    
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    messages.forEach(({ data }) => {
      this.send(data);
    });
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args);
    }
  }
}

/**
 * Create WebSocket client singleton
 */
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(url?: string): WebSocketClient {
  if (!wsClient && url) {
    wsClient = new WebSocketClient({
      url,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 50,
      heartbeatInterval: 25000,
      debug: process.env.NODE_ENV === 'development'
    });
  }
  
  if (!wsClient) {
    throw new Error('WebSocket client not initialized. Please provide URL.');
  }
  
  return wsClient;
}

/**
 * Initialize WebSocket connection
 */
export async function initializeWebSocket(url: string): Promise<WebSocketClient> {
  const client = getWebSocketClient(url);
  await client.connect();
  return client;
}

/**
 * Close WebSocket connection
 */
export function closeWebSocket(): void {
  if (wsClient) {
    wsClient.close();
    wsClient = null;
  }
}

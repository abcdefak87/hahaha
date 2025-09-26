// @ts-ignore - socket.io-client types will be installed
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isTabVisible = true;
  private lastLogTime = 0;
  private logDebounceDelay = 5000; // 5 seconds debounce for logs
  private visibilityChangeHandler: (() => void) | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionCount = 0; // Track connection attempts
  private currentUserId: string | null = null;
  private currentUserRole: string | null = null;
  private connectionPromise: Promise<Socket | null> | null = null;

  constructor() {
    // Setup page visibility API handler
    if (typeof document !== 'undefined') {
      this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
      document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    }
  }

  private handleVisibilityChange() {
    const wasVisible = this.isTabVisible;
    this.isTabVisible = !document.hidden;

    if (!wasVisible && this.isTabVisible) {
      // Tab became visible - check connection and reconnect if needed
      this.debugLog('Tab became visible, checking connection...');
      if (!this.socket?.connected && !this.isConnecting) {
        this.debugLog('Tab visible but not connected, attempting reconnect...');
        // Delay reconnect to avoid rapid reconnections
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = setTimeout(() => {
          if (!this.socket?.connected && !this.isConnecting) {
            this.reconnect();
          }
        }, 1000);
      }
    } else if (wasVisible && !this.isTabVisible) {
      // Tab became hidden - stop heartbeat to save resources
      this.debugLog('Tab became hidden, pausing heartbeat...');
      this.stopHeartbeat();
    }
  }

  private debugLog(message: string, data?: any) {
    const now = Date.now();
    // Debounce similar logs
    if (now - this.lastLogTime > this.logDebounceDelay) {
      if (data) {
        console.log(`[WebSocket] ${message}`, data);
      } else {
        console.log(`[WebSocket] ${message}`);
      }
      this.lastLogTime = now;
    }
  }

  connect(userId: string, role: string): Socket | null {
    // If already connected with same user, return existing socket
    if (this.socket?.connected && this.currentUserId === userId) {
      this.debugLog('Already connected with same user, returning existing socket');
      return this.socket;
    }

    // If connecting, wait for the connection to complete
    if (this.isConnecting) {
      this.debugLog('Connection already in progress, returning current socket');
      return this.socket;
    }

    // If different user, disconnect first
    if (this.currentUserId && this.currentUserId !== userId) {
      this.debugLog('Different user detected, disconnecting first');
      this.disconnect();
    }

    this.isConnecting = true;
    this.currentUserId = userId;
    this.currentUserRole = role;
    this.connectionCount++;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
      
      const token = Cookies.get('token');

      // Clean up existing socket before creating new one
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: false, // Changed to false to reuse connections
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 10000,
        autoConnect: true,
        auth: token ? { token } : undefined,
        extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      this.socket.on('connect', () => {
        this.debugLog(`Connected successfully (connection #${this.connectionCount})`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Join user rooms (server derives identity from token)
        this.socket?.emit('join-room');
        
        // Start heartbeat only if tab is visible
        if (this.isTabVisible) {
          this.startHeartbeat();
        }
      });

      this.socket.on('disconnect', (reason) => {
        this.debugLog('Disconnected', { reason });
        this.isConnecting = false;
        this.stopHeartbeat();
        
        // Only auto-reconnect for certain disconnect reasons and if tab is visible
        if (reason === 'io server disconnect' && this.isTabVisible) {
          // Server disconnected, try to reconnect with delay
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
          }
          this.reconnectTimer = setTimeout(() => {
            if (!this.socket?.connected && !this.isConnecting && this.isTabVisible) {
              this.reconnect();
            }
          }, this.reconnectDelay);
        }
      });

      this.socket.on('connect_error', (error) => {
        // Only log errors occasionally to avoid spam
        if (this.reconnectAttempts === 0 || this.reconnectAttempts === this.maxReconnectAttempts - 1) {
          console.error('[WebSocket] Connection error:', error.message);
        }
        this.isConnecting = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('[WebSocket] Max reconnection attempts reached, stopping...');
          this.isConnecting = false;
          this.stopReconnection();
        }
      });

      this.socket.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
        this.isConnecting = false;
      });

      return this.socket;
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.isConnecting = false;
      return null;
    }
  }

  private reconnect() {
    if (!this.isTabVisible || this.isConnecting || this.socket?.connected) {
      return;
    }

    this.debugLog('Attempting to reconnect...');
    if (this.socket) {
      this.socket.connect();
    }
  }

  private stopReconnection() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.io.opts.reconnection = false;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing interval
    
    // Send heartbeat every 25 seconds to prevent timeout
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected && this.isTabVisible) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  disconnect() {
    this.debugLog('Disconnecting WebSocket service');
    this.stopHeartbeat();
    this.stopReconnection();
    
    // Clean up visibility change handler
    if (this.visibilityChangeHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.currentUserId = null;
    this.currentUserRole = null;
    this.connectionPromise = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionInfo(): { userId: string | null; role: string | null; connectionCount: number } {
    return {
      userId: this.currentUserId,
      role: this.currentUserRole,
      connectionCount: this.connectionCount
    };
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Event listeners
  onJobUpdate(callback: (data: any) => void) {
    this.socket?.on('job-update', callback);
  }

  onUserUpdate(callback: (data: any) => void) {
    this.socket?.on('user-update', callback);
  }

  onInventoryUpdate(callback: (data: any) => void) {
    this.socket?.on('inventory-update', callback);
  }

  onSystemNotification(callback: (data: any) => void) {
    this.socket?.on('system-notification', callback);
  }

  onUserNotification(callback: (data: any) => void) {
    this.socket?.on('user-notification', callback);
  }

  onCustomerNotification(callback: (data: any) => void) {
    this.socket?.on('customer-notification', callback);
  }

  onWhatsAppStatusUpdate(callback: (data: any) => void) {
    this.socket?.on('whatsapp-status-update', callback);
  }

  // Remove event listeners
  offJobUpdate(callback: (data: any) => void) {
    this.socket?.off('job-update', callback);
  }

  offUserUpdate(callback: (data: any) => void) {
    this.socket?.off('user-update', callback);
  }

  offInventoryUpdate(callback: (data: any) => void) {
    this.socket?.off('inventory-update', callback);
  }

  offSystemNotification(callback: (data: any) => void) {
    this.socket?.off('system-notification', callback);
  }

  offUserNotification(callback: (data: any) => void) {
    this.socket?.off('user-notification', callback);
  }

  offCustomerNotification(callback: (data: any) => void) {
    this.socket?.off('customer-notification', callback);
  }

  offWhatsAppStatusUpdate(callback: (data: any) => void) {
    this.socket?.off('whatsapp-status-update', callback);
  }
}

export default new WebSocketService();

/**
 * Socket.IO Client with Auto-Reconnect
 * Wrapper for Socket.IO with enhanced reconnection and error handling
 */

import { io, Socket } from 'socket.io-client'
import { EventEmitter } from 'events'
import Cookies from 'js-cookie'

interface SocketConfig {
  url?: string
  userId?: string
  role?: string
  reconnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  debug?: boolean
}

interface QueuedMessage {
  event: string
  data: any
  timestamp: number
}

export class SocketClient extends EventEmitter {
  private socket: Socket | null = null
  private config: SocketConfig
  private messageQueue: QueuedMessage[] = []
  private isIntentionallyClosed = false
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0

  constructor(config: SocketConfig = {}) {
    super()
    
    this.config = {
      url: config.url || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      userId: config.userId,
      role: config.role,
      reconnect: config.reconnect ?? true,
      reconnectAttempts: config.reconnectAttempts ?? 10,
      reconnectDelay: config.reconnectDelay ?? 3000,
      debug: config.debug ?? (process.env.NODE_ENV === 'development')
    }
  }

  /**
   * Connect to Socket.IO server
   */
  public connect(): Socket {
    if (this.socket?.connected) {
      this.log('Already connected')
      return this.socket
    }

    this.log(`Connecting to ${this.config.url}...`)
    this.isIntentionallyClosed = false

    // Get JWT token from cookies
    const token = Cookies.get('token')
    
    if (!token) {
      this.log('No authentication token found')
      this.emit('error', new Error('No authentication token'))
      throw new Error('Authentication token required')
    }

    // Create Socket.IO connection with options
    this.socket = io(this.config.url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.config.reconnectAttempts,
      reconnectionDelay: this.config.reconnectDelay,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      auth: {
        token: token
      },
      query: {
        token: token,
        userId: this.config.userId,
        role: this.config.role
      }
    })

    // Setup event handlers
    this.setupEventHandlers()
    
    return this.socket
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      this.log('Connected successfully')
      this.reconnectAttempts = 0
      this.emit('connected')
      
      // Join user rooms after connection
      if (this.config.userId) {
        this.socket?.emit('join-room', {
          userId: this.config.userId,
          role: this.config.role
        })
        this.log('Joined user rooms')
      }
      
      // Start heartbeat
      this.startHeartbeat()
      
      // Process queued messages
      this.processMessageQueue()
    })

    this.socket.on('disconnect', (reason) => {
      this.log(`Disconnected: ${reason}`)
      this.emit('disconnected', reason)
      
      // Handle reconnection based on disconnect reason
      if (reason === 'io server disconnect') {
        // Server disconnected us, need to manually reconnect
        this.socket?.connect()
      }
    })

    this.socket.on('connect_error', (error) => {
      this.log('Connection error:', error.message)
      this.emit('error', error)
      
      // Implement custom reconnection logic if needed
      if (this.config.reconnect && !this.isIntentionallyClosed) {
        this.handleReconnect()
      }
    })

    this.socket.on('reconnect', (attemptNumber) => {
      this.log(`Reconnected after ${attemptNumber} attempts`)
      this.emit('reconnected', attemptNumber)
    })

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.log(`Reconnection attempt ${attemptNumber}`)
      this.emit('reconnecting', attemptNumber)
    })

    this.socket.on('reconnect_error', (error) => {
      this.log('Reconnection error:', error.message)
      this.emit('reconnect_error', error)
    })

    this.socket.on('reconnect_failed', () => {
      this.log('Reconnection failed')
      this.emit('reconnect_failed')
    })

    // Custom events
    this.socket.on('notification', (data) => {
      this.emit('notification', data)
    })

    this.socket.on('job:update', (data) => {
      this.emit('job:update', data)
    })

    this.socket.on('customer:update', (data) => {
      this.emit('customer:update', data)
    })

    this.socket.on('inventory:update', (data) => {
      this.emit('inventory:update', data)
    })

    this.socket.on('system:notification', (data) => {
      this.emit('system:notification', data)
    })

    this.socket.on('whatsapp:status', (data) => {
      this.emit('whatsapp:status', data)
    })

    // Error handling
    this.socket.on('error', (error) => {
      this.log('Socket error:', error)
      this.emit('error', error)
    })
  }

  /**
   * Handle custom reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectTimer) return

    this.reconnectAttempts++
    
    if (this.reconnectAttempts > (this.config.reconnectAttempts || 10)) {
      this.log('Max reconnection attempts reached')
      this.emit('max_reconnect_attempts')
      return
    }

    const delay = Math.min(
      (this.config.reconnectDelay || 3000) * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    )

    this.log(`Custom reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (!this.isIntentionallyClosed && this.socket) {
        this.socket.connect()
      }
    }, delay)
  }

  /**
   * Send event through Socket.IO
   */
  public sendMessage(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
      this.log(`Emitted event: ${event}`, data)
    } else {
      this.log(`Socket not connected, queueing event: ${event}`)
      this.queueMessage(event, data)
    }
    
    // Emit to EventEmitter for internal handling
    super.emit(event, data)
  }

  /**
   * Listen to Socket.IO events
   */
  public addListener(event: string, callback: (...args: any[]) => void): this {
    if (this.socket) {
      this.socket.on(event, callback)
    }
    // Also add to EventEmitter for internal events
    super.on(event, callback)
    return this
  }

  /**
   * Remove event listener
   */
  public removeListener(event: string, callback?: (...args: any[]) => void): this {
    if (this.socket && callback) {
      this.socket.off(event, callback)
    }
    if (callback) {
      super.off(event, callback)
    }
    return this
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() })
        this.log('Heartbeat sent')
      }
    }, 20000) // Send heartbeat every 20 seconds
  }
  
  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }
  
  /**
   * Disconnect from server
   */
  public disconnect(): void {
    this.isIntentionallyClosed = true
    
    this.stopHeartbeat()
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.messageQueue = []
    this.log('Disconnected from server')
  }

  /**
   * Get connection status
   */
  public get isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * Get socket instance
   */
  public getSocket(): Socket | null {
    return this.socket
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(event: string, data: any): void {
    this.messageQueue.push({
      event,
      data,
      timestamp: Date.now()
    })
    
    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift()
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return

    this.log(`Processing ${this.messageQueue.length} queued messages`)
    
    const messages = [...this.messageQueue]
    this.messageQueue = []
    messages.forEach(({ event, data }) => {
      this.sendMessage(event, data)
    })
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[SocketClient]', ...args)
    }
  }
}

// Singleton instance
let socketClient: SocketClient | null = null

/**
 * Get or create Socket.IO client instance
 */
export function getSocketClient(config?: SocketConfig): SocketClient {
  if (!socketClient) {
    socketClient = new SocketClient(config)
  }
  return socketClient
}

/**
 * Initialize Socket.IO connection
 */
export function initializeSocket(config?: SocketConfig): Socket {
  const client = getSocketClient(config)
  return client.connect()
}

/**
 * Disconnect Socket.IO
 */
export function disconnectSocket(): void {
  if (socketClient) {
    socketClient.disconnect()
    socketClient = null
  }
}

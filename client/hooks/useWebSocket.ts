import { useEffect, useCallback, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../contexts/RealtimeContext'
import websocketService from '../lib/websocket'

interface UseWebSocketOptions {
  autoConnect?: boolean
  debug?: boolean
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = false, debug = false } = options
  const { user } = useAuth()
  const { isConnected } = useRealtime()
  const [connectionInfo, setConnectionInfo] = useState(websocketService.getConnectionInfo())

  useEffect(() => {
    // Update connection info when connection state changes
    const interval = setInterval(() => {
      const info = websocketService.getConnectionInfo()
      setConnectionInfo(info)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Manual connect function (shouldn't be needed in most cases)
  const connect = useCallback(() => {
    if (!user) {
      if (debug) console.warn('[useWebSocket] Cannot connect without user')
      return null
    }

    // Check if already connected
    const currentInfo = websocketService.getConnectionInfo()
    if (websocketService.isConnected() && currentInfo.userId === user.id) {
      if (debug) console.log('[useWebSocket] Already connected')
      return websocketService.getSocket()
    }

    if (debug) console.log('[useWebSocket] Manual connect triggered')
    return websocketService.connect(user.id, user.role)
  }, [user, debug])

  // Add event listener with automatic cleanup
  const addEventListener = useCallback((event: string, callback: (data: any) => void) => {
    const socket = websocketService.getSocket()
    if (!socket) {
      if (debug) console.warn(`[useWebSocket] No socket available for event: ${event}`)
      return () => {}
    }

    socket.on(event, callback)
    if (debug) console.log(`[useWebSocket] Added listener for event: ${event}`)

    // Return cleanup function
    return () => {
      socket.off(event, callback)
      if (debug) console.log(`[useWebSocket] Removed listener for event: ${event}`)
    }
  }, [debug])

  // Emit event
  const emit = useCallback((event: string, data?: any) => {
    const socket = websocketService.getSocket()
    if (!socket?.connected) {
      if (debug) console.warn(`[useWebSocket] Cannot emit ${event} - not connected`)
      return false
    }

    socket.emit(event, data)
    if (debug) console.log(`[useWebSocket] Emitted event: ${event}`, data)
    return true
  }, [debug])

  // Helper functions for common events
  const onJobUpdate = useCallback((callback: (data: any) => void) => {
    return addEventListener('job-update', callback)
  }, [addEventListener])

  const onInventoryUpdate = useCallback((callback: (data: any) => void) => {
    return addEventListener('inventory-update', callback)
  }, [addEventListener])

  const onUserUpdate = useCallback((callback: (data: any) => void) => {
    return addEventListener('user-update', callback)
  }, [addEventListener])

  const onSystemNotification = useCallback((callback: (data: any) => void) => {
    return addEventListener('system-notification', callback)
  }, [addEventListener])

  const onUserNotification = useCallback((callback: (data: any) => void) => {
    return addEventListener('user-notification', callback)
  }, [addEventListener])

  const onCustomerNotification = useCallback((callback: (data: any) => void) => {
    return addEventListener('customer-notification', callback)
  }, [addEventListener])

  const onWhatsAppStatusUpdate = useCallback((callback: (data: any) => void) => {
    return addEventListener('whatsapp-status-update', callback)
  }, [addEventListener])

  return {
    isConnected,
    connectionInfo,
    connect,
    addEventListener,
    emit,
    // Convenience methods
    onJobUpdate,
    onInventoryUpdate,
    onUserUpdate,
    onSystemNotification,
    onUserNotification,
    onCustomerNotification,
    onWhatsAppStatusUpdate,
    // Direct access to service (use sparingly)
    service: websocketService
  }
}

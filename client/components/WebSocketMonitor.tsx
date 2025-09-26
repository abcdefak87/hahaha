import React, { useEffect, useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../contexts/AuthContext'

interface WebSocketMonitorProps {
  show?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function WebSocketMonitor({ show = true, position = 'bottom-right' }: WebSocketMonitorProps) {
  const { user } = useAuth()
  const { isConnected, connectionInfo } = useWebSocket({ debug: false })
  const [events, setEvents] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    // Monitor connection changes
    const logEvent = (event: string) => {
      const timestamp = new Date().toLocaleTimeString()
      setEvents(prev => [`[${timestamp}] ${event}`, ...prev.slice(0, 9)])
    }

    if (isConnected) {
      logEvent(`Connected (User: ${connectionInfo.userId})`)
    }

    return () => {
      if (isConnected) {
        logEvent('Disconnected')
      }
    }
  }, [isConnected, connectionInfo.userId])

  if (!show || !user) return null

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="bg-gray-900 text-white rounded-lg shadow-lg p-3 min-w-[250px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-sm font-medium">
              WebSocket {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {expanded ? '▼' : '▲'}
          </button>
        </div>

        {expanded && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="text-xs space-y-1">
              <div>User ID: {connectionInfo.userId || 'None'}</div>
              <div>Role: {connectionInfo.role || 'None'}</div>
              <div>Connection #: {connectionInfo.connectionCount}</div>
              <div>Status: {isConnected ? '🟢 Active' : '🔴 Inactive'}</div>
            </div>

            {events.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="text-xs font-medium mb-1">Recent Events:</div>
                <div className="text-xs space-y-0.5 max-h-32 overflow-y-auto">
                  {events.map((event, index) => (
                    <div key={index} className="text-gray-400">
                      {event}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-400">
                ⚠️ Single connection managed by RealtimeContext
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WebSocketMonitor

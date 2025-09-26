import React from 'react'
import { formatDistanceToNow } from 'date-fns'

interface CustomerNotificationCardProps {
  notification: {
    id: string
    type: string
    title: string
    message: string
    timestamp: Date
    read: boolean
    data?: any
  }
  onMarkAsRead: (id: string) => void
}

const CustomerNotificationCard: React.FC<CustomerNotificationCardProps> = ({
  notification,
  onMarkAsRead
}) => {
  const getStatusColor = (type: string) => {
    switch (type) {
      case 'customer-notification':
        if (notification.data?.job?.status === 'COMPLETED') return 'bg-green-100 border-green-200'
        if (notification.data?.job?.status === 'IN_PROGRESS') return 'bg-blue-100 border-blue-200'
        if (notification.data?.job?.status === 'ASSIGNED') return 'bg-yellow-100 border-yellow-200'
        return 'bg-gray-100 border-gray-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'customer-notification':
        if (notification.data?.job?.status === 'COMPLETED') return '✅'
        if (notification.data?.job?.status === 'IN_PROGRESS') return '🚀'
        if (notification.data?.job?.status === 'ASSIGNED') return '👨‍🔧'
        return '🎫'
      default:
        return '🔔'
    }
  }

  const getStatusText = (type: string) => {
    switch (type) {
      case 'customer-notification':
        if (notification.data?.job?.status === 'COMPLETED') return 'Selesai'
        if (notification.data?.job?.status === 'IN_PROGRESS') return 'Sedang Dikerjakan'
        if (notification.data?.job?.status === 'ASSIGNED') return 'Diterima Teknisi'
        return 'Update Tiket'
      default:
        return 'Notifikasi'
    }
  }

  return (
    <div 
      className={`p-4 rounded-lg border-l-4 ${getStatusColor(notification.type)} ${
        !notification.read ? 'bg-opacity-80' : 'bg-opacity-50'
      } transition-all duration-200 hover:shadow-md cursor-pointer`}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-2xl">{getStatusIcon(notification.type)}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium ${
              !notification.read ? 'text-gray-900' : 'text-gray-600'
            }`}>
              {notification.title}
            </h4>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              notification.data?.job?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              notification.data?.job?.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
              notification.data?.job?.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {getStatusText(notification.type)}
            </span>
          </div>
          
          <p className={`mt-1 text-sm ${
            !notification.read ? 'text-gray-700' : 'text-gray-500'
          }`}>
            {notification.message}
          </p>
          
          {notification.data?.job && (
            <div className="mt-2 text-xs text-gray-500">
              <p><strong>Tiket:</strong> {notification.data.job.jobNumber}</p>
              {notification.data.job.customer && (
                <p><strong>Pelanggan:</strong> {notification.data.job.customer.name}</p>
              )}
              {notification.data.job.technicians && notification.data.job.technicians.length > 0 && (
                <p><strong>Teknisi:</strong> {
                  notification.data.job.technicians
                    .map((jt: any) => jt.technician?.name)
                    .filter(Boolean)
                    .join(', ')
                }</p>
              )}
            </div>
          )}
          
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(notification.timestamp, { 
                addSuffix: true
              })}
            </span>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerNotificationCard

import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../contexts/RealtimeContext'
import Layout from '../components/Layout'
import CustomerNotificationCard from '../components/CustomerNotificationCard'
import ProtectedRoute from '../components/ProtectedRoute'
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const CustomerNotificationsPage: React.FC = () => {
  const { user } = useAuth()
  const { notifications, markAsRead, clearAll } = useRealtime()
  const [filter, setFilter] = useState<'all' | 'unread' | 'customer'>('all')
  const [isClearing, setIsClearing] = useState(false)

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read
      case 'customer':
        return notification.type === 'customer-notification'
      default:
        return true
    }
  })

  // Sort by timestamp (newest first)
  const sortedNotifications = filteredNotifications.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  )

  const unreadCount = notifications.filter(n => !n.read).length
  const customerNotificationCount = notifications.filter(n => n.type === 'customer-notification').length

  const handleClearAll = async () => {
    setIsClearing(true)
    try {
      clearAll()
    } catch (error) {
      console.error('Error clearing notifications:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleMarkAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markAsRead(notification.id)
      }
    })
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <BellIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Notifikasi
                </h1>
                <p className="mt-2 text-gray-600">
                  Update realtime tentang status tiket dan layanan Anda
                </p>
              </div>
              
              <div className="flex space-x-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Tandai Semua Dibaca
                  </button>
                )}
                
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    disabled={isClearing}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    {isClearing ? 'Menghapus...' : 'Hapus Semua'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BellIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Notifikasi
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {notifications.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {unreadCount}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Belum Dibaca
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {unreadCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🎫</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Update Tiket
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {customerNotificationCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setFilter('all')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Semua ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === 'unread'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Belum Dibaca ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('customer')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === 'customer'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Update Tiket ({customerNotificationCount})
                </button>
              </nav>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {sortedNotifications.length === 0 ? (
              <div className="text-center py-12">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Tidak ada notifikasi
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' 
                    ? 'Belum ada notifikasi yang diterima.'
                    : filter === 'unread'
                    ? 'Semua notifikasi sudah dibaca.'
                    : 'Belum ada update tiket.'
                  }
                </p>
              </div>
            ) : (
              sortedNotifications.map((notification) => (
                <CustomerNotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

export default CustomerNotificationsPage

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { useRealtime } from '../../contexts/RealtimeContext'
import { useRealtimeData } from '../../hooks/useRealtimeData'
import Layout from '../../components/Layout'
import ProtectedRoute from '../../components/ProtectedRoute'
import Breadcrumb from '../../components/Breadcrumb'
import EmptyState from '../../components/EmptyState'
import MobileTableCard from '../../components/MobileTableCard'
import { api } from '../../lib/api'
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Users
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Jobs() {
  const { user } = useAuth()
  const { isConnected } = useRealtime()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)

  // Read query parameters from URL
  useEffect(() => {
    const { category, status, type, search: searchQuery } = router.query
    
    if (category) setCategoryFilter(category as string)
    if (status) setStatusFilter(status as string)
    if (type) setTypeFilter(type as string)
    if (searchQuery) setSearch(searchQuery as string)
  }, [router.query])

  // Real-time data hook
  const endpoint = `/jobs?${new URLSearchParams({
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { type: typeFilter }),
    ...(categoryFilter && { category: categoryFilter }),
    page: page.toString(),
    limit: '10'
  }).toString()}`
  
  const { data: jobsData, total: totalCount, loading: isLoading, setData: setJobsData, refetch } = useRealtimeData<any>({
    endpoint,
    dependencies: [search, statusFilter, typeFilter, categoryFilter, page]
  })

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tiket ini?')) {
      return
    }

    try {
      await api.delete(`/jobs/${jobId}`)
      toast.success('Tiket berhasil dihapus!')
      // Refresh data to reflect changes
      refetch()
    } catch (error: any) {
      console.error('Failed to delete job:', error)
      
      if (error.response?.status === 404) {
        toast.error('Tiket sudah tidak ada atau telah dihapus sebelumnya.')
        // Refresh to sync with server state
        refetch()
      } else {
        toast.error(error.response?.data?.message || 'Gagal menghapus tiket. Silakan coba lagi.')
      }
    }
  }

  // Listen for real-time job updates
  useEffect(() => {
    if (isConnected) {
      // Real-time updates are handled by useRealtimeData hook
      console.log('🔄 Real-time job updates active')
    }
  }, [isConnected])

  const jobs = Array.isArray(jobsData) ? jobsData : []
  const limit = 10
  const totalPages = Math.ceil((totalCount || 0) / limit)

  const getStatusBadge = (status: string) => {
    const badges = {
      OPEN: 'badge-warning',
      ASSIGNED: 'badge-info',
      IN_PROGRESS: 'badge-info',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
    }
    return badges[status as keyof typeof badges] || 'badge-gray'
  }

  const getStatusText = (status: string) => {
    const texts = {
      OPEN: 'Terbuka',
      ASSIGNED: 'Ditugaskan',
      IN_PROGRESS: 'Dikerjakan',
      COMPLETED: 'Selesai',
      CANCELLED: 'Dibatalkan',
    }
    return texts[status as keyof typeof texts] || status
  }

  const getTypeBadge = (type: string, category: string) => {
    if (category === 'PSB') return 'badge-info'
    if (category === 'GANGGUAN') return 'badge-warning'
    return type === 'INSTALLATION' ? 'badge-info' : 'badge-warning'
  }

  const getTypeText = (type: string, category: string) => {
    if (category === 'PSB') return 'PSB'
    if (category === 'GANGGUAN') return 'Gangguan'
    return type === 'INSTALLATION' ? 'Pemasangan' : 'Perbaikan'
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      LOW: 'badge-gray',
      MEDIUM: 'badge-info',
      HIGH: 'badge-warning',
      URGENT: 'badge-danger',
    }
    return badges[priority as keyof typeof badges] || 'badge-gray'
  }

  return (
    <ProtectedRoute>
      <Layout title="Kelola Tiket">
        <div className="space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { name: 'Pekerjaan', href: '/jobs' },
              { name: 'Semua Tiket', current: true }
            ]} 
          />
          {/* Real-time Status Indicator */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                {isConnected ? '🔗 Real-time updates active' : '🔌 Reconnecting...'}
              </span>
            </div>
            <button
              onClick={refetch}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Header Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search and Filters */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="form-input pl-10"
                    placeholder="Cari tiket, pelanggan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                {/* Status Filter */}
                <select
                  className="form-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Semua Status</option>
                  <option value="OPEN">Terbuka</option>
                  <option value="ASSIGNED">Ditugaskan</option>
                  <option value="IN_PROGRESS">Dikerjakan</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </select>
                
                {/* Category Filter */}
                <select
                  className="form-input"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Semua Kategori</option>
                  <option value="PSB">Tiket PSB</option>
                  <option value="GANGGUAN">Tiket Gangguan</option>
                </select>
                
                {/* Type Filter */}
                <select
                  className="form-input"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">Semua Tipe</option>
                  <option value="INSTALLATION">Pemasangan</option>
                  <option value="REPAIR">Perbaikan</option>
                  <option value="PSB">PSB</option>
                  <option value="GANGGUAN">Gangguan</option>
                </select>
              </div>
            </div>
            
            {/* Action Buttons */}
            {user?.role !== 'user' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push('/jobs/create?type=psb')}
                  className="btn btn-outline flex items-center justify-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Buat PSB
                </button>
                <button
                  onClick={() => router.push('/jobs/create?type=gangguan')}
                  className="btn btn-outline flex items-center justify-center"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Buat Gangguan
                </button>
                <button
                  onClick={() => router.push('/jobs/create')}
                  className="btn btn-primary flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Tiket
                </button>
              </div>
            )}
          </div>

          {/* Jobs Table */}
          <div className="table-container">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={FileText}
                  title="Tidak ada tiket ditemukan"
                  description="Belum ada tiket yang sesuai dengan filter pencarian Anda. Coba ubah filter atau buat tiket baru."
                  action={
                    user?.role !== 'user' && (
                      <button
                        onClick={() => router.push('/jobs/create')}
                        className="btn btn-primary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Tiket Baru
                      </button>
                    )
                  }
                  size="sm"
                />
              </div>
            ) : (
              <MobileTableCard
                data={jobs}
                keyField="id"
                columns={[
                  {
                    key: 'jobNumber',
                    label: 'Job',
                    render: (value: any, item: any) => (
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900">
                            {item.jobNumber}
                          </div>
                          <span className={`badge ${getTypeBadge(item.type, item.category)}`}>
                            {getTypeText(item.type, item.category)}
                          </span>
                          <span className={`badge ${getPriorityBadge(item.priority)}`}>
                            {item.priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {item.title}
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'customer',
                    label: 'Pelanggan',
                    render: (value: any, item: any) => (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.customer.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {item.customer.phone}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="truncate max-w-xs">{item.address}</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'technicians',
                    label: 'Teknisi',
                    render: (value: any, item: any) => (
                      <div>
                        {item.technicians.length === 0 ? (
                          <div>
                            <span className="text-sm text-gray-500">Belum ditugaskan</span>
                            <div className="text-xs text-green-600 mt-1">
                              📋 Tersedia (0/1 teknisi)
                            </div>
                          </div>
                        ) : (
                          <div>
                            {item.technicians.map((jt: any, index: number) => (
                              <div key={jt.id} className="text-sm text-gray-900 mb-1">
                                <div className="flex items-center">
                                  <User className="h-4 w-4 mr-1" />
                                  {jt.technician.name}
                                </div>
                              </div>
                            ))}
                            <div className="text-xs text-blue-600 mt-1">
                              🔧 {item.technicians.length}/1 teknisi ditugaskan
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (value: any, item: any) => (
                      <span className={`badge ${getStatusBadge(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    )
                  },
                  {
                    key: 'createdAt',
                    label: 'Tanggal',
                    render: (value: any, item: any) => (
                      <span>{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                    )
                  }
                ]}
                actions={{
                  onView: (item) => router.push(`/jobs/${item.id}`),
                  onEdit: (user?.role === 'admin' || user?.role === 'superadmin') 
                    ? (item) => router.push(`/jobs/${item.id}/edit`)
                    : undefined,
                  onDelete: (user?.role === 'admin' || user?.role === 'superadmin')
                    ? (item) => handleDeleteJob(item.id)
                    : undefined
                }}
              />
            )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="btn-outline disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="btn-outline disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(page - 1) * limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(page * limit, totalCount || 0)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{totalCount || 0}</span>{' '}
                    results
                  </p>
                </div>
                
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                      .map((p, index, array) => (
                        <React.Fragment key={p}>
                          {index > 0 && array[index - 1] !== p - 1 && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => setPage(p)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              p === page
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      ))}
                    
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}


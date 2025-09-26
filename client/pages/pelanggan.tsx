import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import DualCustomerModal from '../components/modals/DualCustomerModal'
import MobileTableCard from '../components/MobileTableCard'
import { api } from '../lib/api'
import { Plus, Search, Edit, Trash2, Calendar, MapPin, Phone, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface Customer {
  id: string
  name: string
  phone: string
  address: string
  createdAt: string
  _count: {
    jobs: number
  }
}

interface EditCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
  onCustomerUpdated: (customer: Customer) => void
}

const EditCustomerModal = ({ isOpen, onClose, customer, onCustomerUpdated }: EditCustomerModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || ''
      })
    } else {
      setFormData({
        name: '',
        phone: '',
        address: ''
      })
    }
  }, [customer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return

    setIsLoading(true)
    try {
      const response = await api.put(`/customers/${customer.id}`, formData)
      toast.success('Pelanggan berhasil diperbarui!')
      onCustomerUpdated(response.data.data.customer)
      onClose()
    } catch (error: any) {
      const message = error.response?.data?.error || 'Gagal memperbarui pelanggan'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !customer) return null

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Edit Pelanggan</h2>
        </div>
        <div className="modal-body">
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Nama *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">No. Telepon *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Alamat *</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="form-input"
                rows={3}
                required
              />
            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            type="submit"
            form="edit-form"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
  onCustomerDeleted: () => void
}

function DeleteConfirmModal({ isOpen, onClose, customer, onCustomerDeleted }: DeleteConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) {
      return
    }

    try {
      await api.delete(`/customers/${customerId}`)
      toast.success('Pelanggan berhasil dihapus')
      // Real-time update will handle the UI refresh automatically
    } catch (error: any) {
      console.error('Error deleting customer:', error)
      const message = error.response?.data?.error || 'Gagal menghapus pelanggan'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !customer) return null

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Konfirmasi Hapus</h2>
        </div>
        
        <div className="modal-body">
          <p className="text-sm text-gray-600">
            Apakah Anda yakin ingin menghapus pelanggan <strong>{customer.name}</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            onClick={() => {
              setIsLoading(true)
              handleDeleteCustomer(customer.id)
              onCustomerDeleted()
              onClose()
            }}
            disabled={isLoading}
            className="btn btn-danger"
          >
            {isLoading ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PelangganPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/customers')
      setCustomers(response.data.data?.customers || [])
    } catch (error: any) {
      console.error('Failed to fetch customers:', error)
      toast.error('Gagal memuat data pelanggan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCustomers()
  }

  const handleCustomerAdded = (newCustomer: Customer) => {
    setShowAddModal(false)
    toast.success('Pelanggan berhasil ditambahkan!')
    fetchCustomers()
  }

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c))
    toast.success('Pelanggan berhasil diperbarui!')
  }

  const handleCustomerDeleted = () => {
    fetchCustomers()
    toast.success('Pelanggan berhasil dihapus!')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Layout title="Pelanggan">
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Pelanggan</h1>
              <p className="text-gray-600">Kelola data pelanggan dan informasi kontak</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              + Tambah Pelanggan
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="card">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Cari nama, telepon, atau alamat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Cari
            </button>
          </form>
        </div>

        {/* Customer List */}
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Daftar Pelanggan
            </h2>
            <p className="text-sm text-gray-600 mt-1">Total {filteredCustomers.length} pelanggan</p>
          </div>

          {loading ? (
            <div className="flex-center h-64">
              <div className="loading-spinner w-12 h-12"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-2 text-lg font-medium text-red-600">Belum ada data pelanggan</div>
              <p className="text-gray-600">Silakan tambahkan pelanggan baru</p>
            </div>
          ) : (
            <>
              <MobileTableCard
                data={filteredCustomers}
                keyField="id"
                columns={[
                  {
                    key: 'name',
                    label: 'Nama',
                    render: (value: any, item: any) => (
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    )
                  },
                  {
                    key: 'phone',
                    label: 'Telepon',
                    render: (value: any, item: any) => (
                      <div className="text-sm text-gray-900">{item.phone}</div>
                    )
                  },
                  {
                    key: 'address',
                    label: 'Alamat',
                    render: (value: any, item: any) => (
                      <div className="text-sm text-gray-900 max-w-xs truncate">{item.address}</div>
                    )
                  },
                  {
                    key: '_count',
                    label: 'Pekerjaan',
                    render: (value: any, item: any) => (
                      <span className="status-online">
                        {item._count.jobs} pekerjaan
                      </span>
                    )
                  },
                  {
                    key: 'createdAt',
                    label: 'Dibuat',
                    render: (value: any, item: any) => (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(item.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    )
                  }
                ]}
                actions={{
                  onEdit: (item) => {
                    setSelectedCustomer(item)
                    setShowEditModal(true)
                  },
                  onDelete: (item) => {
                    setSelectedCustomer(item)
                    setShowDeleteModal(true)
                  }
                }}
              />

              {/* Pagination */}
              {Math.ceil(filteredCustomers.length / itemsPerPage) > 1 && (
                <div className="flex-between mt-6">
                  <div className="text-sm text-gray-700">
                    Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} dari {filteredCustomers.length} pelanggan
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="btn btn-sm btn-outline"
                    >
                      Sebelumnya
                    </button>
                    
                    {Array.from({ length: Math.ceil(filteredCustomers.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`btn btn-sm ${
                          currentPage === page
                            ? 'btn-primary'
                            : 'btn-outline'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredCustomers.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(filteredCustomers.length / itemsPerPage)}
                      className="btn btn-sm btn-outline"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <DualCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCustomerCreated={handleCustomerAdded}
        jobType="NEW_INSTALLATION"
      />

      <EditCustomerModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedCustomer(null)
        }}
        customer={selectedCustomer}
        onCustomerUpdated={handleCustomerUpdated}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedCustomer(null)
        }}
        customer={selectedCustomer}
        onCustomerDeleted={handleCustomerDeleted}
      />
    </Layout>
  )
}


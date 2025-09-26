import React, { useState } from 'react'
import { MoreVertical, Eye, Edit, Trash2, X } from 'lucide-react'

interface MobileTableCardProps {
  data: any[]
  columns: {
    key: string
    label: string
    render?: (value: any, item: any) => React.ReactNode
    hideOnMobile?: boolean
  }[]
  actions?: {
    onView?: (item: any) => void
    onEdit?: (item: any) => void
    onDelete?: (item: any) => void
    customActions?: {
      icon: React.ReactNode
      label: string
      onClick: (item: any) => void
      className?: string
    }[]
  }
  keyField?: string
}

export default function MobileTableCard({ 
  data, 
  columns, 
  actions,
  keyField = 'id' 
}: MobileTableCardProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)

  const toggleActions = (itemId: string) => {
    if (showActionMenu === itemId) {
      setShowActionMenu(null)
    } else {
      setShowActionMenu(itemId)
      setExpandedCard(null)
    }
  }

  const toggleExpand = (itemId: string) => {
    if (expandedCard === itemId) {
      setExpandedCard(null)
    } else {
      setExpandedCard(itemId)
      setShowActionMenu(null)
    }
  }

  return (
    <>
      {/* Mobile Card View - Only visible on mobile */}
      <div className="block lg:hidden space-y-4">
        {data.map((item) => {
          const itemId = item[keyField]
          const isExpanded = expandedCard === itemId
          const isActionMenuOpen = showActionMenu === itemId

          return (
            <div
              key={itemId}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              {/* Main Card Content */}
              <div className="p-4">
                {/* Header with primary info and actions button */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    {/* Display first 2-3 important columns */}
                    {columns.slice(0, 2).map((column) => (
                      <div key={column.key} className="mb-2">
                        {column.render ? (
                          column.render(item[column.key], item)
                        ) : (
                          <div className="text-sm">
                            <span className="font-medium text-gray-500">{column.label}:</span>{' '}
                            <span className="text-gray-900">{item[column.key]}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Actions Button */}
                  {actions && (
                    <div className="relative">
                      <button
                        onClick={() => toggleActions(itemId)}
                        className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                        aria-label="Actions"
                      >
                        {isActionMenuOpen ? (
                          <X className="h-5 w-5 text-gray-600" />
                        ) : (
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        )}
                      </button>

                      {/* Action Menu Dropdown */}
                      {isActionMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          {actions.onView && (
                            <button
                              onClick={() => {
                                actions.onView!(item)
                                setShowActionMenu(null)
                              }}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-200"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                              <span>Lihat Detail</span>
                            </button>
                          )}
                          {actions.onEdit && (
                            <button
                              onClick={() => {
                                actions.onEdit!(item)
                                setShowActionMenu(null)
                              }}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-200"
                            >
                              <Edit className="h-4 w-4 text-green-600" />
                              <span>Edit</span>
                            </button>
                          )}
                          {actions.onDelete && (
                            <button
                              onClick={() => {
                                actions.onDelete!(item)
                                setShowActionMenu(null)
                              }}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-200 border-t border-gray-100"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                              <span className="text-red-600">Hapus</span>
                            </button>
                          )}
                          {actions.customActions?.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                action.onClick(item)
                                setShowActionMenu(null)
                              }}
                              className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-200 ${
                                index === 0 && !actions.onView && !actions.onEdit && !actions.onDelete ? '' : 'border-t border-gray-100'
                              } ${action.className || ''}`}
                            >
                              {action.icon}
                              <span>{action.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Show More/Less Button for additional info */}
                {columns.length > 2 && (
                  <button
                    onClick={() => toggleExpand(itemId)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                  >
                    {isExpanded ? 'Sembunyikan Detail' : 'Lihat Detail'}
                  </button>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 animate-in slide-in-from-top-2">
                    {columns.slice(2).map((column) => {
                      if (column.hideOnMobile) return null
                      return (
                        <div key={column.key} className="text-sm">
                          <span className="font-medium text-gray-500">{column.label}:</span>{' '}
                          {column.render ? (
                            <div className="mt-1">{column.render(item[column.key], item)}</div>
                          ) : (
                            <span className="text-gray-900">{item[column.key]}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table View - Only visible on desktop */}
      <div className="hidden lg:block table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="table-cell-nowrap">
                  {column.label}
                </th>
              ))}
              {actions && (
                <th className="table-cell-center table-cell-nowrap">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item[keyField]} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4">
                    {column.render
                      ? column.render(item[column.key], item)
                      : item[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="table-cell-center">
                    <div className="table-actions">
                      {actions.onView && (
                        <button
                          onClick={() => actions.onView!(item)}
                          className="btn btn-ghost btn-sm"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {actions.onEdit && (
                        <button
                          onClick={() => actions.onEdit!(item)}
                          className="btn btn-ghost btn-sm"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {actions.onDelete && (
                        <button
                          onClick={() => actions.onDelete!(item)}
                          className="btn btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {actions.customActions?.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => action.onClick(item)}
                          className={`btn btn-ghost btn-sm ${action.className || ''}`}
                          title={action.label}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

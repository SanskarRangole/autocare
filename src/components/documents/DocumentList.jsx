import React, { useState, useEffect } from 'react'
import { useVehicles } from '../../context/VehicleContext'
import { useAuth } from '../../context/AuthContext'
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  getDocumentSignedUrl,
} from '../../lib/storage'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { DocumentUploadModal } from './DocumentUploadModal'
import { DocumentRenewalModal } from './DocumentRenewalModal'
import {
  FileText,
  Upload,
  ExternalLink,
  Trash2,
  Lock,
  Search,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { formatDate, getDaysDifference } from '../../lib/utils'

export function DocumentList() {
  const { user } = useAuth()
  const { activeVehicle, loadVehicles } = useVehicles()

  const [documents, setDocuments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [replacingDoc, setReplacingDoc] = useState(null)
  const [renewalModalOpen, setRenewalModalOpen] = useState(false)
  const [renewingDoc, setRenewingDoc] = useState(null)
  const [deletingDoc, setDeletingDoc] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [openingDocId, setOpeningDocId] = useState(null)

  const loadData = async () => {
    if (!activeVehicle) {
      setDocuments([])
      return
    }
    try {
      const data = await getDocuments(activeVehicle.id)
      setDocuments(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeVehicle?.id])

  const handleUploadOrReplace = async (file, meta) => {
    if (!user || !activeVehicle) return

    // If replacing an existing document, delete previous record & file first
    if (meta.replacedDocId) {
      try {
        await deleteDocument(meta.replacedDocId, meta.replacedFilePath)
      } catch (err) {
        console.warn('Could not clean up replaced document:', err)
      }
    }

    if (file) {
      await uploadDocument(user.id, activeVehicle.id, file, meta)
    }
    setReplacingDoc(null)
    await loadData()
  }

  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return
    setIsDeleting(true)
    try {
      await deleteDocument(deletingDoc.id, deletingDoc.file_path)
      setDeletingDoc(null)
      await loadData()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewOrDownload = async (doc) => {
    setOpeningDocId(doc.id)
    try {
      const signedUrl = await getDocumentSignedUrl(doc)
      if (signedUrl && signedUrl !== '#') {
        const win = window.open(signedUrl, '_blank')
        if (!win) {
          const link = document.createElement('a')
          link.href = signedUrl
          link.download = doc.file_name || 'document'
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      } else {
        alert('Document file preview is not available.')
      }
    } catch (err) {
      alert(`Could not retrieve document signed URL: ${err.message}`)
    } finally {
      setOpeningDocId(null)
    }
  }

  if (!activeVehicle) {
    return (
      <EmptyState
        icon={FileText}
        title="No vehicle selected"
        description="Select a vehicle to manage its registration certificates, insurance cards, and repair invoices."
      />
    )
  }

  // Filter & Search
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      filterCategory === 'all' ||
      (filterCategory === 'rc' && doc.type?.includes('Registration')) ||
      (filterCategory === 'insurance' && doc.type?.includes('Insurance')) ||
      (filterCategory === 'puc' && doc.type?.includes('Pollution')) ||
      (filterCategory === 'invoice' && doc.type?.includes('Invoice')) ||
      (filterCategory === 'other' && !['Registration', 'Insurance', 'Pollution', 'Invoice'].some((k) => doc.type?.includes(k)))

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Vehicle Documents
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Private, encrypted storage for RC, insurance policies, emission certificates, and invoices for{' '}
            <span className="font-semibold text-[#0F172A]">{activeVehicle.name}</span>.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setReplacingDoc(null)
            setUploadModalOpen(true)
          }}
        >
          <Upload className="w-4 h-4 mr-1.5" />
          Upload Document
        </Button>
      </div>

      {/* Security Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-between gap-3 text-xs sm:text-sm text-[#1E40AF]">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>
            Documents are encrypted and stored in private buckets. Access is governed via time-limited signed URLs and user-isolated Supabase RLS.
          </span>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by title, policy #, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs sm:text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="flex flex-wrap gap-1 p-1 bg-[#F1F5F9] rounded-2xl border border-[#E2E8F0]">
          {[
            { id: 'all', label: 'All' },
            { id: 'rc', label: 'RC' },
            { id: 'insurance', label: 'Insurance' },
            { id: 'puc', label: 'PUC' },
            { id: 'invoice', label: 'Invoices' },
            { id: 'other', label: 'Other' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterCategory === cat.id
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={searchTerm || filterCategory !== 'all' ? 'No matching documents' : 'No documents uploaded yet'}
          description={
            searchTerm || filterCategory !== 'all'
              ? 'Try modifying your search query or filter category.'
              : `Upload digital copies of your vehicle's Registration Certificate (RC), Insurance policy PDF, or warranty cards for ${activeVehicle.name}.`
          }
          actionLabel={searchTerm || filterCategory !== 'all' ? 'Clear Filters' : 'Upload First Document'}
          onAction={() => {
            if (searchTerm || filterCategory !== 'all') {
              setSearchTerm('')
              setFilterCategory('all')
            } else {
              setUploadModalOpen(true)
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => {
            const daysLeft = getDaysDifference(doc.expiry_date)
            const isExpired = daysLeft !== null && daysLeft < 0
            const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30

            return (
              <Card key={doc.id} hoverable>
                <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-4">
                  {/* Top info */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <Badge variant="neutral" className="text-[11px]">
                        {doc.type}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#0F172A] tracking-tight leading-snug truncate">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-[#64748B] font-mono truncate mt-0.5">
                        {doc.file_name} {doc.file_size ? `• ${(doc.file_size / 1024).toFixed(0)} KB` : ''}
                      </p>
                    </div>

                    {doc.expiry_date && (
                      <div className="pt-1">
                        {isExpired ? (
                          <Badge variant="danger">
                            Expired ({formatDate(doc.expiry_date)})
                          </Badge>
                        ) : isExpiringSoon ? (
                          <Badge variant="warning">
                            Expires in {daysLeft}d ({formatDate(doc.expiry_date)})
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            Valid until {formatDate(doc.expiry_date)}
                          </Badge>
                        )}
                      </div>
                    )}

                    {doc.notes && (
                      <p className="text-xs text-[#475569] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                        {doc.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                    <Button
                      variant="softBlue"
                      size="sm"
                      className="text-xs flex-1"
                      loading={openingDocId === doc.id}
                      onClick={() => handleViewOrDownload(doc)}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>

                    {(isExpired || isExpiringSoon || doc.type.toLowerCase().includes('insurance') || doc.type.toLowerCase().includes('puc')) && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs font-bold px-3 h-8 shadow-xs"
                        onClick={() => {
                          setRenewingDoc(doc)
                          setRenewalModalOpen(true)
                        }}
                      >
                        Renew
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-[#475569]"
                      onClick={() => {
                        setReplacingDoc(doc)
                        setUploadModalOpen(true)
                      }}
                      title="Replace with renewed file"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1 text-[#2563EB]" />
                      Replace
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#DC2626] hover:text-[#991B1B] hover:bg-[#FEF2F2] px-2.5"
                      onClick={() => setDeletingDoc(doc)}
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload & Replace Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false)
          setReplacingDoc(null)
        }}
        onUpload={handleUploadOrReplace}
        vehicleName={activeVehicle.name}
        existingDocument={replacingDoc}
      />

      {/* Document Renewal Modal */}
      <DocumentRenewalModal
        isOpen={renewalModalOpen}
        onClose={() => {
          setRenewalModalOpen(false)
          setRenewingDoc(null)
        }}
        documentItem={renewingDoc}
        docType={renewingDoc?.type || 'Insurance Policy'}
        vehicle={activeVehicle}
        userId={user?.id}
        onSuccess={async () => {
          await loadVehicles()
          await loadData()
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingDoc)}
        onClose={() => setDeletingDoc(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Document ${deletingDoc?.name}?`}
        description="This will permanently delete this document from secure storage. This action cannot be undone."
        loading={isDeleting}
      />
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Calendar, Upload, CheckCircle2, RefreshCw } from 'lucide-react'

export function DocumentUploadModal({
  isOpen,
  onClose,
  onUpload,
  vehicleName = 'Vehicle',
  existingDocument = null,
}) {
  const isReplacing = Boolean(existingDocument)

  const [file, setFile] = useState(null)
  const [meta, setMeta] = useState({
    name: '',
    type: 'Registration Certificate (RC)',
    expiry_date: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (existingDocument) {
      setMeta({
        name: existingDocument.name || '',
        type: existingDocument.type || 'Other',
        expiry_date: existingDocument.expiry_date || '',
        notes: existingDocument.notes || '',
      })
      setFile(null)
    } else {
      setMeta({
        name: '',
        type: 'Registration Certificate (RC)',
        expiry_date: '',
        notes: '',
      })
      setFile(null)
    }
    setError(null)
  }, [existingDocument, isOpen])

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      if (!meta.name) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
        setMeta((prev) => ({ ...prev, name: cleanName }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file && !isReplacing) {
      setError('Please choose a document file to upload.')
      return
    }
    if (!meta.name.trim()) {
      setError('Please provide a document title.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Clean expiry date
      const cleanMeta = {
        ...meta,
        expiry_date: meta.expiry_date || null,
        replacedDocId: existingDocument?.id || null,
        replacedFilePath: existingDocument?.file_path || null,
      }

      await onUpload(file, cleanMeta)
      onClose()
      setFile(null)
    } catch (err) {
      setError(err?.message || 'Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  const hasExpiryField = [
    'Registration Certificate (RC)',
    'Insurance Policy',
    'Pollution Certificate (PUC)',
    'Driving License',
    'Warranty Document',
    'Road Tax Receipt',
  ].includes(meta.type)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReplacing ? `Replace ${existingDocument?.name}` : 'Upload Vehicle Document'}
      description={
        isReplacing
          ? `Upload a renewed copy or updated file for ${vehicleName}.`
          : `Store ownership papers, insurance policies, and bills for ${vehicleName}.`
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium rounded-xl">
            {error}
          </div>
        )}

        {/* File Picker Box */}
        <div className="border-2 border-dashed border-[#CBD5E1] rounded-2xl p-6 text-center bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors cursor-pointer">
          <input
            type="file"
            id="doc-file-upload"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={handleFileChange}
          />
          <label htmlFor="doc-file-upload" className="cursor-pointer block">
            {file ? (
              <div className="flex items-center justify-center gap-2 text-[#059669]">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                <span className="text-xs sm:text-sm font-bold">{file.name}</span>
                <span className="text-[11px] text-[#64748B]">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : isReplacing ? (
              <div>
                <div className="w-10 h-10 mx-auto rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-2">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#17365D] block">
                  Select new replacement file from device
                </span>
                <span className="text-[11px] text-[#64748B] block mt-1">
                  Current file: {existingDocument?.file_name} • PDF, JPEG, or PNG up to 10MB
                </span>
              </div>
            ) : (
              <div>
                <div className="w-10 h-10 mx-auto rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#17365D] block">
                  Click to select file from device
                </span>
                <span className="text-[11px] text-[#64748B] block mt-1">
                  PDF, JPEG, or PNG up to 10MB
                </span>
              </div>
            )}
          </label>
        </div>

        <Input
          label="Document Title"
          placeholder="e.g. Comprehensive Motor Policy 2026 or Pollution Check"
          value={meta.name}
          onChange={(e) => setMeta({ ...meta, name: e.target.value })}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Document Category"
            value={meta.type}
            onChange={(e) => setMeta({ ...meta, type: e.target.value })}
            options={[
              { value: 'Registration Certificate (RC)', label: 'Registration Certificate (RC)' },
              { value: 'Insurance Policy', label: 'Insurance Policy' },
              { value: 'Pollution Certificate (PUC)', label: 'Pollution Certificate (PUC)' },
              { value: 'Driving License', label: 'Driving License' },
              { value: 'Service Invoice', label: 'Service / Repair Invoice' },
              { value: 'Warranty Document', label: 'Warranty / AMC Card' },
              { value: 'Road Tax Receipt', label: 'Road Tax / Permit Receipt' },
              { value: 'Other', label: 'Other Document' },
            ]}
          />

          {hasExpiryField ? (
            <Input
              label="Expiry / Renewal Date"
              type="date"
              value={meta.expiry_date}
              onChange={(e) => setMeta({ ...meta, expiry_date: e.target.value })}
              icon={Calendar}
              hint="AutoCare will alert you before this expires"
            />
          ) : (
            <div className="flex items-center text-xs text-[#64748B] pt-6">
              <span>No expiry tracking required for {meta.type}.</span>
            </div>
          )}
        </div>

        <Input
          label="Notes / Policy Details (Optional)"
          placeholder="e.g. Policy #99214, Broker hotline, coverage details"
          value={meta.notes}
          onChange={(e) => setMeta({ ...meta, notes: e.target.value })}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
          <Button variant="outline" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" loading={loading}>
            {isReplacing ? 'Save Replacement' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

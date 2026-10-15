import React, { useState, useRef } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import {
  Camera,
  Upload,
  Receipt,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Fuel,
  Wrench,
  DollarSign,
  FileText,
  RotateCcw,
} from 'lucide-react'
import { extractTextFromImage } from '../../lib/rcOcrService'
import { parseReceipt } from '../../lib/receiptParser'

export function ReceiptCaptureModal({
  isOpen,
  onClose,
  vehicle = null,
  userId = null,
  onRecordFuel = null,
  onRecordService = null,
  onRecordExpense = null,
  onUploadDocument = null,
  onSuccess = null,
}) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [ocrStatus, setOcrStatus] = useState('idle') // idle | processing | complete | error
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [error, setError] = useState(null)

  const [parsedData, setParsedData] = useState(null)
  const [saveToVault, setSaveToVault] = useState(true)
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef(null)

  const resetState = () => {
    setFile(null)
    setPreviewUrl(null)
    setOcrStatus('idle')
    setProgress(0)
    setProgressText('')
    setError(null)
    setParsedData(null)
    setSaveToVault(true)
    setSaving(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const processImageFile = async (selectedFile) => {
    if (!selectedFile) return
    setError(null)
    setFile(selectedFile)

    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)

    setOcrStatus('processing')
    setProgress(15)
    setProgressText('Preparing optical neural scanner...')

    try {
      const rawText = await extractTextFromImage(selectedFile, ({ status, progress: p }) => {
        if (p) setProgress(Math.round(p * 100))
        if (status === 'recognizing text') {
          setProgressText('Reading totals, liters, rates & merchant details...')
        }
      })

      const extracted = parseReceipt(rawText)
      setParsedData(extracted)
      setOcrStatus('complete')
      setProgress(100)
    } catch (err) {
      console.error('Receipt OCR error:', err)
      setError('Could not scan receipt text. You can still enter details manually.')
      setParsedData(parseReceipt(''))
      setOcrStatus('complete')
    }
  }

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) processImageFile(selected)
  }

  // Sample fuel receipt generator for 1-click browser testing
  const handleLoadSampleReceipt = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 700
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#0F172A'
    ctx.font = 'bold 24px monospace'
    ctx.fillText('INDIAN OIL CORPORATION', 130, 70)

    ctx.font = '16px monospace'
    ctx.fillText('HIGHWAY FUEL STATION #44', 160, 105)
    ctx.fillText('--------------------------------------', 80, 130)

    const todayStr = new Date().toLocaleDateString('en-GB')
    ctx.fillText(`DATE: ${todayStr}   TIME: 14:32`, 80, 165)
    ctx.fillText('PRODUCT: SPEED PETROL', 80, 205)
    ctx.fillText('NOZZLE NO: 03', 80, 240)
    ctx.fillText('--------------------------------------', 80, 275)

    ctx.font = 'bold 20px monospace'
    ctx.fillText('RATE / LTR:   Rs. 102.50', 80, 320)
    ctx.fillText('VOLUME (L):   19.51 LTR', 80, 360)
    ctx.fillText('--------------------------------------', 80, 400)

    ctx.font = 'bold 24px monospace'
    ctx.fillText('TOTAL AMOUNT: Rs. 2000.00', 80, 450)

    ctx.font = '16px monospace'
    ctx.fillText('--------------------------------------', 80, 490)
    ctx.fillText('PAYMENT: FASTAG / UPI', 80, 530)
    ctx.fillText('THANK YOU! VISIT AGAIN', 170, 590)

    canvas.toBlob((blob) => {
      const sampleFile = new File([blob], 'sample_fuel_receipt.png', { type: 'image/png' })
      processImageFile(sampleFile)
    }, 'image/png')
  }

  const handleFieldChange = (field, value) => {
    setParsedData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleConfirmSave = async () => {
    if (!parsedData || !vehicle) return
    const amountNum = Number(parsedData.amount)
    if (!amountNum || amountNum <= 0) {
      setError('Please provide a valid receipt amount greater than 0.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      // 1. Record the financial entry according to classification
      if (parsedData.classification === 'fuel') {
        if (onRecordFuel) {
          await onRecordFuel({
            date: parsedData.date,
            odometer: vehicle.current_odometer || 0,
            litres: Number(parsedData.litres) || 0,
            total_cost: amountNum,
            price_per_litre: Number(parsedData.pricePerUnit) || null,
            fuel_brand: parsedData.merchant || 'Fuel Station',
            notes: `Scanned from receipt: ${parsedData.description}`,
            is_full_tank: Boolean(parsedData.litres > 0),
          })
        }
      } else if (parsedData.classification === 'service') {
        if (onRecordService) {
          await onRecordService({
            date: parsedData.date,
            odometer: vehicle.current_odometer || 0,
            service_type: 'General Maintenance',
            garage: parsedData.merchant || 'Auto Workshop',
            cost: amountNum,
            notes: `Scanned invoice: ${parsedData.description}`,
          })
        }
      } else {
        if (onRecordExpense) {
          await onRecordExpense({
            category: 'Other',
            amount: amountNum,
            date: parsedData.date,
            description: parsedData.description || 'Receipt Expense',
          })
        }
      }

      // 2. Optionally save physical receipt image into Document Vault
      if (saveToVault && file && onUploadDocument && userId) {
        try {
          await onUploadDocument(file, {
            name: `${parsedData.classification === 'fuel' ? 'Fuel Receipt' : 'Invoice'} (${parsedData.date})`,
            type: parsedData.classification === 'service' ? 'Service Invoice' : 'Other',
            notes: `Amount: ${amountNum} - Merchant: ${parsedData.merchant || 'N/A'}`,
          })
        } catch (docErr) {
          console.warn('Failed to archive receipt to document vault:', docErr)
        }
      }

      if (onSuccess) onSuccess()
      handleClose()
    } catch (saveErr) {
      setError(saveErr?.message || 'Failed to record receipt entry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Smart Receipt & Invoice Scanner"
      description="Scan or photograph receipts to automatically extract amounts, litres, and merchant details."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Upload / Capture State */}
        {ocrStatus === 'idle' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[#F8FAFC] hover:bg-[#EFF6FF] group"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center text-[#2563EB] group-hover:scale-105 transition-transform mb-3">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-[#0F172A]">Take Photo or Upload Receipt</h4>
              <p className="text-xs text-[#64748B] mt-1">Supports fuel slips, workshop bills, and toll receipts (JPG, PNG)</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadSampleReceipt}
                className="text-xs font-semibold text-[#1E40AF] bg-[#EFF6FF] border-[#BFDBFE] hover:bg-[#DBEAFE]"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#2563EB]" />
                Try with Sample Fuel Receipt
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: OCR Extraction Progress */}
        {ocrStatus === 'processing' && (
          <div className="p-8 text-center space-y-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center animate-spin">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0F172A]">Analyzing Receipt Data</h4>
              <p className="text-xs text-[#64748B] mt-1">{progressText || 'Extracting financial details...'}</p>
            </div>
            <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className="bg-[#2563EB] h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 3: Verification & Save Screen */}
        {ocrStatus === 'complete' && parsedData && (
          <div className="space-y-4">
            {/* Classification Selector Pill */}
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">Classified As:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'fuel', label: 'Fuel Fill', icon: Fuel },
                  { id: 'service', label: 'Service', icon: Wrench },
                  { id: 'expense', label: 'Expense', icon: DollarSign },
                ].map((type) => {
                  const Icon = type.icon
                  const active = parsedData.classification === type.id
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleFieldChange('classification', type.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                        active
                          ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                          : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#EFF6FF]'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {type.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Extracted Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Total Amount Paid *"
                type="number"
                step="any"
                value={parsedData.amount}
                onChange={(e) => handleFieldChange('amount', e.target.value)}
                required
              />

              <Input
                label="Transaction Date *"
                type="date"
                value={parsedData.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                required
              />
            </div>

            {parsedData.classification === 'fuel' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label="Litres Filled (Optional)"
                  type="number"
                  step="any"
                  placeholder="e.g. 19.5"
                  value={parsedData.litres}
                  onChange={(e) => handleFieldChange('litres', e.target.value)}
                />

                <Input
                  label="Price per Litre (Optional)"
                  type="number"
                  step="any"
                  placeholder="e.g. 102.5"
                  value={parsedData.pricePerUnit}
                  onChange={(e) => handleFieldChange('pricePerUnit', e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Merchant / Garage Name"
                placeholder="e.g. Indian Oil, Shell, Bosch Workshop"
                value={parsedData.merchant}
                onChange={(e) => handleFieldChange('merchant', e.target.value)}
              />

              <Input
                label="Description"
                value={parsedData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
              />
            </div>

            {/* Save to Vault checkbox */}
            {file && (
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToVault}
                  onChange={(e) => setSaveToVault(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2563EB] border-[#CBD5E1] focus:ring-[#2563EB]"
                />
                <span className="text-xs text-[#0F172A] font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                  Save copy of receipt into Vehicle Document Vault
                </span>
              </label>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
              <Button type="button" variant="ghost" size="sm" onClick={resetState}>
                Scan Another
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="md" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleConfirmSave}
                  loading={saving}
                  className="px-6 font-bold"
                >
                  Confirm & Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

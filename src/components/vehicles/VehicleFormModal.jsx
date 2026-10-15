import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  ShieldCheck,
  Gauge,
  Camera,
  Upload,
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Eye,
  Info,
  ChevronRight,
} from 'lucide-react'
import { validateRcFile, preprocessImageForOcr } from '../../lib/rcOcrPreprocess'
import { performRcOcr } from '../../lib/rcOcrService'
import {
  normalizeRegistrationNumber,
  checkDuplicateRegistrationNumber,
} from '../../lib/rcParser'
import { generateSampleRcBlob } from '../../lib/sampleRcGenerator'

const CURRENT_YEAR = new Date().getFullYear()

export function VehicleFormModal({
  isOpen,
  onClose,
  onSave,
  vehicle = null,
  existingVehicles = [],
}) {
  const isEditing = Boolean(vehicle)

  // Registration Mode: 'choose', 'ocr', 'manual'
  const [mode, setMode] = useState('choose')

  // OCR Step: 'upload', 'processing', 'review'
  const [ocrStep, setOcrStep] = useState('upload')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [progress, setProgress] = useState({ percent: 0, status: '', message: '' })
  const [extractionFlags, setExtractionFlags] = useState({})
  const [saveRcToVault, setSaveRcToVault] = useState(true)
  const [showImageFullPreview, setShowImageFullPreview] = useState(false)

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    type: 'car',
    make: '',
    model: '',
    year: CURRENT_YEAR,
    license_plate: '',
    vin: '',
    fuel_type: 'Petrol',
    current_odometer: 0,
    insurance_provider: '',
    insurance_policy_no: '',
    insurance_expiry: '',
    puc_number: '',
    puc_expiry: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const cameraInputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (vehicle) {
      setMode('manual')
      setFormData({
        name: vehicle.name || '',
        type: vehicle.type || 'car',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || CURRENT_YEAR,
        license_plate: vehicle.license_plate || '',
        vin: vehicle.vin || '',
        fuel_type: vehicle.fuel_type || 'Petrol',
        current_odometer: vehicle.current_odometer || 0,
        insurance_provider: vehicle.insurance_provider || '',
        insurance_policy_no: vehicle.insurance_policy_no || '',
        insurance_expiry: vehicle.insurance_expiry || '',
        puc_number: vehicle.puc_number || '',
        puc_expiry: vehicle.puc_expiry || '',
        notes: vehicle.notes || '',
      })
    } else {
      setMode('choose')
      setOcrStep('upload')
      setSelectedFile(null)
      setPreviewUrl('')
      setExtractionFlags({})
      setProgress({ percent: 0, status: '', message: '' })
      setSaveRcToVault(true)
      setFormData({
        name: '',
        type: 'car',
        make: '',
        model: '',
        year: CURRENT_YEAR,
        license_plate: '',
        vin: '',
        fuel_type: 'Petrol',
        current_odometer: 0,
        insurance_provider: '',
        insurance_policy_no: '',
        insurance_expiry: '',
        puc_number: '',
        puc_expiry: '',
        notes: '',
      })
    }
    setError(null)
  }, [vehicle, isOpen])

  // Compute duplicate registration number warning reactively
  const duplicateWarning = useMemo(() => {
    if (!formData.license_plate || existingVehicles.length === 0) return null
    const dup = checkDuplicateRegistrationNumber(
      formData.license_plate,
      existingVehicles,
      vehicle?.id
    )
    if (dup.isDuplicate) {
      return `A vehicle with registration "${dup.duplicateVehicle.license_plate}" (${dup.duplicateVehicle.name}) already exists in your garage.`
    }
    return null
  }, [formData.license_plate, existingVehicles, vehicle?.id])

  const handleChange = (field, value) => {
    let finalValue = value
    if (field === 'license_plate') {
      finalValue = normalizeRegistrationNumber(value)
    }
    setFormData((prev) => ({ ...prev, [field]: finalValue }))
  }

  // Handle Document Selection
  const handleFileSelect = (file) => {
    if (!file) return
    setError(null)

    const validation = validateRcFile(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  // Handle OCR Extraction
  const startExtraction = async (fileToProcess) => {
    const targetFile = fileToProcess || selectedFile
    if (!targetFile) {
      setError('Please select or photograph an RC document first.')
      return
    }

    setOcrStep('processing')
    setError(null)
    setProgress({ percent: 10, status: 'preprocessing', message: 'Optimizing document clarity and contrast...' })

    try {
      // 1. Preprocess image using canvas filters
      const { processedBlob, previewUrl: processedPreview } = await preprocessImageForOcr(targetFile)
      if (processedPreview) {
        setPreviewUrl(processedPreview)
      }

      // 2. Perform OCR via Tesseract Worker
      const result = await performRcOcr(processedBlob, ({ status, progress: p, message }) => {
        setProgress({
          percent: Math.round(p * 100),
          status,
          message,
        })
      })

      const parsed = result?.parsed
      if (!parsed || !parsed.isValid) {
        throw new Error(
          parsed?.error ||
            'Could not reliably detect vehicle fields from this document. Please ensure the document is clear, well-lit, and unblurred, or continue with manual entry.'
        )
      }

      const ext = parsed.extracted
      const flags = {}

      // Populate form data without hallucinating missing values
      const newFormData = {
        name: ext.suggested_name || formData.name,
        type: ext.type.value || 'car',
        make: ext.make.value || '',
        model: ext.model.value || '',
        year: ext.year.value || new Date().getFullYear(),
        license_plate: ext.registration_number.value || '',
        vin: ext.chassis_number.value || '',
        fuel_type: ext.fuel_type.value || 'Petrol',
        current_odometer: formData.current_odometer || 0,
        insurance_provider: '',
        insurance_policy_no: '',
        insurance_expiry: '',
        puc_number: '',
        puc_expiry: '',
        notes: [
          ext.engine_number.value ? `Engine No: ${ext.engine_number.value}` : '',
          ext.owner_name.value ? `Registered Owner: ${ext.owner_name.value}` : '',
          ext.registration_date.value ? `RC Reg Date: ${ext.registration_date.value}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
      }

      // Mark extraction status flags for verification UI
      flags.registration_number = {
        extracted: Boolean(ext.registration_number.value),
        uncertain: ext.registration_number.isUncertain,
      }
      flags.make = { extracted: Boolean(ext.make.value), uncertain: ext.make.isUncertain }
      flags.model = { extracted: Boolean(ext.model.value), uncertain: ext.model.isUncertain }
      flags.year = { extracted: Boolean(ext.year.value), uncertain: ext.year.isUncertain }
      flags.vin = { extracted: Boolean(ext.chassis_number.value), uncertain: ext.chassis_number.isUncertain }
      flags.fuel_type = { extracted: Boolean(ext.fuel_type.value), uncertain: ext.fuel_type.isUncertain }
      flags.type = { extracted: Boolean(ext.type.value), uncertain: ext.type.isUncertain }
      flags.owner_name = { extracted: Boolean(ext.owner_name.value), value: ext.owner_name.value }
      flags.engine_number = { extracted: Boolean(ext.engine_number.value), value: ext.engine_number.value }
      flags.reg_date = { extracted: Boolean(ext.registration_date.value), value: ext.registration_date.value }

      setFormData(newFormData)
      setExtractionFlags(flags)
      setOcrStep('review')
    } catch (err) {
      console.error('OCR Extraction failed:', err)
      setError(err?.message || 'Failed to extract text from document. Please try again or switch to manual entry.')
      setOcrStep('upload')
    }
  }

  // Load and run sample Indian RC for quick testing
  const handleUseSampleRc = async () => {
    setError(null)
    try {
      const sampleFile = await generateSampleRcBlob()
      if (sampleFile) {
        handleFileSelect(sampleFile)
        await startExtraction(sampleFile)
      }
    } catch (err) {
      setError('Could not generate sample RC: ' + (err?.message || err))
    }
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.make.trim() || !formData.model.trim()) {
      setError('Please provide a vehicle nickname, make, and model.')
      return
    }

    if (duplicateWarning) {
      setError('Cannot save: A vehicle with this registration number already exists in your garage.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const vehiclePayload = {
        ...formData,
        year: Number(formData.year) || CURRENT_YEAR,
        current_odometer: Number(formData.current_odometer) || 0,
        insurance_expiry: formData.insurance_expiry ? formData.insurance_expiry : null,
        puc_expiry: formData.puc_expiry ? formData.puc_expiry : null,
        license_plate: formData.license_plate?.trim() || null,
        vin: formData.vin?.trim() || null,
        insurance_provider: formData.insurance_provider?.trim() || null,
        insurance_policy_no: formData.insurance_policy_no?.trim() || null,
        puc_number: formData.puc_number?.trim() || null,
        notes: formData.notes?.trim() || null,
      }

      // If user came via OCR and agreed to save RC document, pass file & consent
      const rcFileToSave = mode === 'ocr' && saveRcToVault && selectedFile ? selectedFile : null

      await onSave(vehiclePayload, rcFileToSave, saveRcToVault)
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to save vehicle details')
    } finally {
      setLoading(false)
    }
  }

  const modalTitle = isEditing
    ? 'Edit Vehicle Profile'
    : mode === 'choose'
    ? 'Add Vehicle to Garage'
    : mode === 'ocr'
    ? ocrStep === 'review'
      ? 'Verify Extracted RC Details'
      : 'Scan Vehicle Registration Certificate (RC)'
    : 'Enter Vehicle Details Manually'

  const modalDescription = isEditing
    ? 'Update your vehicle information, odometer, and compliance dates.'
    : mode === 'choose'
    ? 'Choose your preferred way to register your car, motorcycle or scooter.'
    : mode === 'ocr'
    ? ocrStep === 'review'
      ? 'Review and verify the extracted data before adding the vehicle to your garage.'
      : 'Photograph or upload an Indian RC card to automatically extract vehicle specs.'
    : 'Manually fill in vehicle specifications and compliance records.'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      description={modalDescription}
      maxWidth={mode === 'ocr' && ocrStep === 'review' ? 'max-w-3xl' : 'max-w-xl'}
    >
      {/* ----------------------------------------------------------------- */}
      {/* 1. INITIAL METHOD SELECTION: Scan RC (Recommended) vs Manual Entry */}
      {/* ----------------------------------------------------------------- */}
      {!isEditing && mode === 'choose' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {/* Option A: Scan RC (Recommended) */}
            <button
              type="button"
              onClick={() => {
                setMode('ocr')
                setOcrStep('upload')
              }}
              className="group relative flex flex-col items-start p-5 rounded-2xl bg-gradient-to-b from-[#F0F7FF] to-white border-2 border-[#2563EB] text-left hover:shadow-md transition-all duration-150 focus:outline-none"
            >
              <div className="absolute top-3.5 right-3.5">
                <Badge variant="primary" className="text-[10px] tracking-wide uppercase px-2 py-0.5">
                  Recommended
                </Badge>
              </div>

              <div className="w-11 h-11 rounded-xl bg-[#2563EB] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>

              <h4 className="text-base font-bold text-[#0F172A] flex items-center gap-1.5">
                Scan / Upload RC
              </h4>
              <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
                Photograph or upload your Registration Certificate. Vehicle specs, registration plate,
                and VIN are extracted automatically with instant OCR.
              </p>

              <div className="mt-4 flex items-center text-xs font-semibold text-[#2563EB] group-hover:translate-x-0.5 transition-transform">
                Start smart scan <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </button>

            {/* Option B: Enter Details Manually */}
            <button
              type="button"
              onClick={() => setMode('manual')}
              className="group flex flex-col items-start p-5 rounded-2xl bg-white border border-[#E2E8F0] text-left hover:border-[#94A3B8] hover:bg-[#F8FAFC] transition-all duration-150 focus:outline-none"
            >
              <div className="w-11 h-11 rounded-xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>

              <h4 className="text-base font-bold text-[#0F172A]">
                Enter Details Manually
              </h4>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Type in your vehicle nickname, brand, model, odometer, and compliance dates by hand
                without scanning documents.
              </p>

              <div className="mt-4 flex items-center text-xs font-semibold text-[#475569] group-hover:translate-x-0.5 transition-transform">
                Use standard form <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5 text-xs text-[#64748B]">
            <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
            <span>
              AutoCare never treats OCR text as verified data. You will review and confirm all details
              before anything is saved.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 2. OCR STEP: UPLOAD & EXTRACTION PROGRESS */}
      {/* ----------------------------------------------------------------- */}
      {!isEditing && mode === 'ocr' && ocrStep === 'upload' && (
        <div className="space-y-4">
          {error && (
            <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Hidden file inputs for Camera and File Picker */}
          <input
            type="file"
            ref={cameraInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/jpg"
            capture="environment"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />

          {/* Document Picker Box */}
          {!selectedFile ? (
            <div className="border-2 border-dashed border-[#CBD5E1] rounded-2xl p-6 sm:p-8 text-center bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-3">
                <Camera className="w-6 h-6" />
              </div>

              <h4 className="text-sm font-bold text-[#0F172A]">
                Photograph or Upload Registration Certificate (RC)
              </h4>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                Supports Smart Card RCs, Parivahan digital RCs, and paper certificates in high-contrast JPG or PNG up to 10MB.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-1.5" />
                  Use Camera / Take Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  Browse Device Files
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-center gap-2">
                <span className="text-xs text-[#64748B]">Don't have an RC photo handy?</span>
                <button
                  type="button"
                  onClick={handleUseSampleRc}
                  className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Try with Sample Indian RC
                </button>
              </div>
            </div>
          ) : (
            /* Document Selected Card */
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Selected RC"
                      className="w-16 h-12 object-cover rounded-lg border border-[#CBD5E1] shadow-xs cursor-pointer hover:opacity-90"
                      onClick={() => setShowImageFullPreview(true)}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready for OCR
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl('')
                    }}
                  >
                    Change Image
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Preprocessing will enhance contrast for accurate text recognition.</span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => startExtraction(selectedFile)}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Extract Vehicle Details
                </Button>
              </div>
            </div>
          )}

          {/* Fallback & Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
            >
              ← Back to options
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Skip and enter details manually →
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 3. OCR STEP: EXTRACTION IN PROGRESS INDICATOR */}
      {/* ----------------------------------------------------------------- */}
      {!isEditing && mode === 'ocr' && ocrStep === 'processing' && (
        <div className="py-8 px-4 text-center space-y-5">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-[#DBEAFE] animate-pulse" />
            <div className="w-16 h-16 rounded-full border-4 border-[#2563EB] border-t-transparent animate-spin flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#2563EB]" />
            </div>
          </div>

          <div className="space-y-1.5 max-w-sm mx-auto">
            <h4 className="text-base font-bold text-[#0F172A]">
              Extracting Vehicle Details...
            </h4>
            <p className="text-xs text-[#64748B]">
              {progress.message || 'Scanning document with Tesseract OCR...'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-xs mx-auto space-y-1">
            <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#2563EB] h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, progress.percent)}%` }}
              />
            </div>
            <div className="text-[11px] font-semibold text-[#64748B] text-right">
              {progress.percent}%
            </div>
          </div>

          <p className="text-[11px] text-[#94A3B8]">
            Runs privately on your device. No document is logged or exposed.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOcrStep('upload')}
          >
            Cancel Extraction
          </Button>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 4. OCR STEP: PREFILLED & EDITABLE REVIEW FORM */}
      {/* ----------------------------------------------------------------- */}
      {!isEditing && mode === 'ocr' && ocrStep === 'review' && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-bold rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <div>{duplicateWarning}</div>
            </div>
          )}

          {/* Verification Banner */}
          <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-start gap-2.5 text-xs text-[#1E40AF]">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Extracted Details Ready for Review:</span> Please verify all
              values against your RC. Green tags indicate extracted data; amber tags indicate fields
              requiring manual verification.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Preview Sidebar (Desktop) */}
            {previewUrl && (
              <div className="md:col-span-4 space-y-3">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0F172A] mb-2">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-[#2563EB]" /> Scanned RC
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowImageFullPreview(true)}
                      className="text-[11px] font-semibold text-[#2563EB] hover:underline flex items-center gap-0.5"
                    >
                      <Eye className="w-3 h-3" /> View Large
                    </button>
                  </div>

                  <div
                    className="relative rounded-xl overflow-hidden border border-[#CBD5E1] bg-black/5 aspect-4/3 cursor-pointer group"
                    onClick={() => setShowImageFullPreview(true)}
                  >
                    <img
                      src={previewUrl}
                      alt="Scanned RC Document"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                      <Eye className="w-4 h-4" /> Click to enlarge
                    </div>
                  </div>

                  {/* Quick Metadata Snippet */}
                  {extractionFlags.owner_name?.value && (
                    <div className="mt-2.5 text-[11px] text-[#475569] bg-white p-2 rounded-lg border border-[#E2E8F0]">
                      <span className="font-semibold block text-[#0F172A]">Owner on RC:</span>
                      {extractionFlags.owner_name.value}
                    </div>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setOcrStep('upload')}
                      className="text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Re-scan / Replace
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Right Editable Fields */}
            <div className={previewUrl ? 'md:col-span-8 space-y-4' : 'md:col-span-12 space-y-4'}>
              {/* Row 1: Nickname & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#334155]">
                      Vehicle Nickname <span className="text-[#DC2626]">*</span>
                    </label>
                  </div>
                  <Input
                    placeholder="e.g. Daily Swift or My MT-07"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#334155]">Vehicle Category</label>
                    {extractionFlags.type?.extracted ? (
                      <Badge variant="success" className="text-[10px] py-0 px-1.5">✓ Extracted</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px] py-0 px-1.5">⚠ Verify</Badge>
                    )}
                  </div>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    options={[
                      { value: 'car', label: 'Car / Sedan / Hatchback' },
                      { value: 'suv', label: 'SUV / Crossover' },
                      { value: 'motorcycle', label: 'Motorcycle / Streetbike' },
                      { value: 'scooter', label: 'Scooter / Moped' },
                      { value: 'truck', label: 'Truck / Commercial' },
                      { value: 'van', label: 'Van / Minivan' },
                    ]}
                  />
                </div>
              </div>

              {/* Row 2: Registration Number & VIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#334155]">Registration Number</label>
                    {extractionFlags.registration_number?.extracted && !extractionFlags.registration_number?.uncertain ? (
                      <Badge variant="success" className="text-[10px] py-0 px-1.5">✓ Extracted</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px] py-0 px-1.5">⚠ Please Check</Badge>
                    )}
                  </div>
                  <Input
                    placeholder="e.g. DL 01 AB 1234"
                    value={formData.license_plate}
                    onChange={(e) => handleChange('license_plate', e.target.value)}
                    error={duplicateWarning}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#334155]">Chassis / VIN</label>
                    {extractionFlags.vin?.extracted ? (
                      <Badge variant="success" className="text-[10px] py-0 px-1.5">✓ Extracted</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px] py-0 px-1.5">⚠ Empty</Badge>
                    )}
                  </div>
                  <Input
                    placeholder="17-character VIN"
                    value={formData.vin}
                    onChange={(e) => handleChange('vin', e.target.value)}
                  />
                </div>
              </div>

              {/* Row 3: Make, Model, Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#334155]">
                      Make (Brand) <span className="text-[#DC2626]">*</span>
                    </label>
                    {extractionFlags.make?.extracted ? (
                      <Badge variant="success" className="text-[10px] py-0 px-1.5">✓ Extracted</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px] py-0 px-1.5">⚠ Verify</Badge>
                    )}
                  </div>
                  <Input
                    placeholder="e.g. Maruti Suzuki"
                    value={formData.make}
                    onChange={(e) => handleChange('make', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#334155]">
                      Model <span className="text-[#DC2626]">*</span>
                    </label>
                    {extractionFlags.model?.extracted ? (
                      <Badge variant="success" className="text-[10px] py-0 px-1.5">✓ Extracted</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px] py-0 px-1.5">⚠ Verify</Badge>
                    )}
                  </div>
                  <Input
                    placeholder="e.g. Swift VXI"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#334155]">
                      Model Year <span className="text-[#DC2626]">*</span>
                    </label>
                    {extractionFlags.year?.extracted && !extractionFlags.year?.uncertain ? (
                      <Badge variant="success" className="text-[10px] py-0 px-1.5">✓ Extracted</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px] py-0 px-1.5">⚠ Verify</Badge>
                    )}
                  </div>
                  <Input
                    type="number"
                    min="1950"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Row 4: Fuel & Odometer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#334155]">Fuel Type</label>
                    {extractionFlags.fuel_type?.extracted ? (
                      <Badge variant="success" className="text-[10px] py-0 px-1.5">✓ Extracted</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px] py-0 px-1.5">⚠ Verify</Badge>
                    )}
                  </div>
                  <Select
                    value={formData.fuel_type}
                    onChange={(e) => handleChange('fuel_type', e.target.value)}
                    options={[
                      { value: 'Petrol', label: 'Petrol' },
                      { value: 'Diesel', label: 'Diesel' },
                      { value: 'Electric', label: 'Electric (EV)' },
                      { value: 'Hybrid', label: 'Hybrid' },
                      { value: 'CNG', label: 'CNG' },
                      { value: 'LPG', label: 'LPG' },
                    ]}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#334155]">Current Odometer (km)</label>
                    <span className="text-[10px] text-[#94A3B8]">Manual entry</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 24500"
                    value={formData.current_odometer}
                    onChange={(e) => handleChange('current_odometer', e.target.value)}
                    icon={Gauge}
                  />
                </div>
              </div>

              {/* Row 5: Notes & Specs */}
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Engine & Registration Specs
                </label>
                <Input
                  placeholder="Engine number or additional notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </div>

              {/* Document Storage Consent */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveRcToVault}
                    onChange={(e) => setSaveRcToVault(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#0F172A] block">
                      Save RC document to my private AutoCare Documents vault
                    </span>
                    <span className="text-[#64748B] block mt-0.5">
                      Securely encrypted in your private storage. Only accessible by your verified login.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Confirmation Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setOcrStep('upload')}
              disabled={loading}
            >
              Back to Scanner
            </Button>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setMode('manual')}
                disabled={loading}
              >
                Switch to Manual Form
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                disabled={Boolean(duplicateWarning)}
              >
                Confirm & Register Vehicle
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 5. MANUAL REGISTRATION FORM (Existing & Fallback Flow) */}
      {/* ----------------------------------------------------------------- */}
      {(isEditing || mode === 'manual') && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium rounded-xl">
              {error}
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-bold rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <div>{duplicateWarning}</div>
            </div>
          )}

          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Vehicle Nickname"
              placeholder="e.g. Daily Civic or Stealth MT-07"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />

            <Select
              label="Vehicle Category"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              options={[
                { value: 'car', label: 'Car / Sedan / Hatchback' },
                { value: 'suv', label: 'SUV / Crossover' },
                { value: 'motorcycle', label: 'Motorcycle / Streetbike' },
                { value: 'scooter', label: 'Scooter / Moped' },
                { value: 'truck', label: 'Truck / Pickup' },
                { value: 'van', label: 'Van / Minivan' },
              ]}
            />
          </div>

          {/* Specs: Make, Model, Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Make (Brand)"
              placeholder="e.g. Honda, Yamaha"
              value={formData.make}
              onChange={(e) => handleChange('make', e.target.value)}
              required
            />

            <Input
              label="Model"
              placeholder="e.g. Civic, MT-07"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              required
            />

            <Input
              label="Model Year"
              type="number"
              min="1950"
              max={new Date().getFullYear() + 1}
              placeholder="2023"
              value={formData.year}
              onChange={(e) => handleChange('year', e.target.value)}
              required
            />
          </div>

          {/* Fuel & Odometer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Engine / Fuel Type"
              value={formData.fuel_type}
              onChange={(e) => handleChange('fuel_type', e.target.value)}
              options={[
                { value: 'Petrol', label: 'Petrol / Gasoline' },
                { value: 'Diesel', label: 'Diesel' },
                { value: 'Electric', label: 'Electric (EV)' },
                { value: 'Hybrid', label: 'Hybrid (HEV/PHEV)' },
                { value: 'CNG', label: 'CNG' },
                { value: 'LPG', label: 'LPG' },
              ]}
            />

            <Input
              label="Current Odometer (km)"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 28450"
              value={formData.current_odometer}
              onChange={(e) => handleChange('current_odometer', e.target.value)}
              icon={Gauge}
            />
          </div>

          {/* Registration Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="License Plate Number"
              placeholder="e.g. DL 01 AB 1234"
              value={formData.license_plate}
              onChange={(e) => handleChange('license_plate', e.target.value)}
              error={duplicateWarning}
            />

            <Input
              label="VIN / Chassis Number"
              placeholder="17-character VIN"
              value={formData.vin}
              onChange={(e) => handleChange('vin', e.target.value)}
            />
          </div>

          {/* Compliance Expiries */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              Compliance & Insurance Tracking (Optional)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Insurance Expiry Date"
                type="date"
                value={formData.insurance_expiry}
                onChange={(e) => handleChange('insurance_expiry', e.target.value)}
              />

              <Input
                label="PUC / Emission Expiry Date"
                type="date"
                value={formData.puc_expiry}
                onChange={(e) => handleChange('puc_expiry', e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <Input
            label="Notes / Specs"
            placeholder="e.g. Synthetic oil 0W-20, Michelin Pilot Sport tires"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
          />

          <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setMode('ocr')}
                className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Switch to RC Scanner
              </button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <Button variant="outline" size="md" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                loading={loading}
                disabled={Boolean(duplicateWarning)}
              >
                {isEditing ? 'Save Changes' : 'Register Vehicle'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Full Document Image Preview Modal */}
      {showImageFullPreview && previewUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowImageFullPreview(false)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowImageFullPreview(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewUrl}
              alt="Full Preview"
              className="max-h-[82vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </Modal>
  )
}

/**
 * AutoCare — Image Preprocessing and Validation for RC OCR
 *
 * Provides:
 * - MIME type and size validation
 * - Canvas-based downsampling to optimal OCR dimension (reduces memory & execution time)
 * - Grayscale and contrast sharpening filters for improved character recognition
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
export const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']

export function validateRcFile(file) {
  if (!file) {
    return { valid: false, error: 'Please choose or photograph an RC document.' }
  }

  // Handle PDF rejection gracefully
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return {
      valid: false,
      error: 'Direct PDF parsing is not supported. Please upload a clear JPG or PNG photograph/screenshot of your RC document.',
    }
  }

  // Validate supported image MIME types
  const isSupportedType =
    SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase()) ||
    /\.(jpe?g|png|webp)$/i.test(file.name)

  if (!isSupportedType) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a high-contrast JPG or PNG image.',
    }
  }

  // Size limit check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please upload an image under 10 MB.`,
    }
  }

  return { valid: true, error: null }
}

/**
 * Loads an image file into an HTMLImageElement
 */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image file for OCR preprocessing.'))
    }
    img.src = url
  })
}

/**
 * Preprocesses an image using an HTML5 Canvas:
 * - Scales to max 2000px dimension
 * - Converts to grayscale with enhanced contrast for Indian RC security backgrounds
 */
export async function preprocessImageForOcr(file, options = { contrast: 1.15, maxDimension: 2000 }) {
  // If in non-browser environment (like node/vitest tests), return file directly
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { processedBlob: file, previewUrl: '' }
  }

  try {
    const img = await loadImageFromFile(file)
    let { width, height } = img

    // Compute scaled dimensions
    const maxDim = options.maxDimension || 2000
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width)
        width = maxDim
      } else {
        width = Math.round((width * maxDim) / height)
        height = maxDim
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      return { processedBlob: file, previewUrl: URL.createObjectURL(file) }
    }

    // Draw base image
    ctx.drawImage(img, 0, 0, width, height)

    // Contrast and grayscale adjustment
    const imgData = ctx.getImageData(0, 0, width, height)
    const d = imgData.data
    const contrast = options.contrast || 1.15 // slightly enhance contrast
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

    for (let i = 0; i < d.length; i += 4) {
      // Grayscale luminance
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      // Apply contrast
      const adjusted = factor * (gray - 128) + 128
      const clamped = Math.min(255, Math.max(0, adjusted))

      d[i] = clamped
      d[i + 1] = clamped
      d[i + 2] = clamped
    }
    ctx.putImageData(imgData, 0, 0)

    // Export processed canvas as blob
    const processedBlob = await new Promise((resolve) => {
      canvas.toBlob(
        (b) => resolve(b || file),
        'image/jpeg',
        0.92
      )
    })

    const previewUrl = URL.createObjectURL(processedBlob)

    return { processedBlob, previewUrl }
  } catch (err) {
    // If canvas manipulation fails, fallback safely to original file
    console.warn('Image preprocessing warning, using original file:', err)
    return {
      processedBlob: file,
      previewUrl: typeof URL !== 'undefined' ? URL.createObjectURL(file) : '',
    }
  }
}

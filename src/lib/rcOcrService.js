/**
 * AutoCare — Tesseract.js OCR Service for Vehicle RC Extraction
 *
 * Runs OCR asynchronously in a Web Worker without blocking the React UI thread.
 * Emits fine-grained progress updates.
 * Implements strict privacy protection: NEVER logs personal details to console.
 */

import { createWorker } from 'tesseract.js'
import { parseIndianRc } from './rcParser'

/**
 * Executes OCR on an image (Blob, File, or base64 data URL)
 *
 * @param {Blob|File|string} imageSource
 * @param {Function} [onProgress] - Callback: ({ status, progress, message }) => void
 * @returns {Promise<{ rawText: string, parsed: object }>}
 */
export async function performRcOcr(imageSource, onProgress = () => {}) {
  let worker = null

  try {
    onProgress({
      status: 'initializing',
      progress: 0.2,
      message: 'Initializing OCR engine...',
    })

    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const rawProg = typeof m.progress === 'number' ? m.progress : 0
          const mappedProg = 0.25 + rawProg * 0.65
          onProgress({
            status: 'recognizing',
            progress: Math.min(0.92, Math.max(0.25, mappedProg)),
            message: `Reading text from document (${Math.round(rawProg * 100)}%)...`,
          })
        }
      },
    })

    // Set page segmentation mode for sparse/tabular text (PSM 3 or 6 works well for ID cards/RCs)
    try {
      await worker.setParameters({
        tessedit_pageseg_mode: '3', // Fully automatic page segmentation
        preserve_interword_spaces: '1',
      })
    } catch {
      // Best-effort parameter set
    }

    onProgress({
      status: 'recognizing',
      progress: 0.35,
      message: 'Recognizing text...',
    })

    const { data } = await worker.recognize(imageSource)
    const text = data?.text || ''

    onProgress({
      status: 'parsing',
      progress: 0.95,
      message: 'Extracting vehicle details...',
    })

    if (!text.trim()) {
      throw new Error(
        'No text could be extracted from this image. Please check that the document is well-lit, in focus, and not blurry, or switch to manual entry.'
      )
    }

    // Parse extracted text using Indian RC rules
    const parsed = parseIndianRc(text)

    onProgress({
      status: 'completed',
      progress: 1.0,
      message: 'Extraction completed successfully.',
    })

    return {
      rawText: text,
      parsed,
      ocrConfidence: data?.confidence || 0,
    }
  } catch (error) {
    console.error('OCR processing error:', error?.message || error)
    throw error
  } finally {
    if (worker) {
      try {
        await worker.terminate()
      } catch {
        // Safe worker termination
      }
    }
  }
}

/**
 * General helper to extract raw text from any document or receipt image
 */
export async function extractTextFromImage(imageSource, onProgress = () => {}) {
  const result = await performRcOcr(imageSource, onProgress)
  return result.rawText
}


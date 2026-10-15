import { describe, it, expect } from 'vitest'
import {
  parseReceipt,
  extractDateFromReceipt,
  extractAmountFromReceipt,
  extractLitresFromReceipt,
  extractPricePerUnitFromReceipt,
  extractMerchantFromReceipt,
  classifyReceipt,
} from '../lib/receiptParser'

describe('Receipt OCR Parser Unit Tests', () => {
  it('extracts date in DD/MM/YYYY format correctly', () => {
    const text = 'INDIAN OIL CORP\nDATE: 14/10/2026 18:32\nTOTAL: 1500.00'
    expect(extractDateFromReceipt(text)).toBe('2026-10-14')
  })

  it('extracts date in DD-MM-YYYY format correctly', () => {
    const text = 'HP AUTO CARE\nINVOICE DATE: 05-09-2026\nAMOUNT: 3200'
    expect(extractDateFromReceipt(text)).toBe('2026-09-05')
  })

  it('extracts total amount from fuel receipt', () => {
    const text = 'BHARAT PETROLEUM\nRATE: 96.72\nVOLUME: 10.34 LTR\nTOTAL AMOUNT: Rs. 1000.00\nTHANK YOU'
    expect(extractAmountFromReceipt(text)).toBe(1000)
    expect(extractLitresFromReceipt(text)).toBe(10.34)
    expect(extractPricePerUnitFromReceipt(text)).toBe(96.72)
  })

  it('extracts merchant brand for major fuel stations', () => {
    expect(extractMerchantFromReceipt('WELCOME TO INDIAN OIL DEALER')).toBe('Indian Oil (IOCL)')
    expect(extractMerchantFromReceipt('BPCL HIGHWAY FILL STATION')).toBe('Bharat Petroleum (BPCL)')
    expect(extractMerchantFromReceipt('HPCL AUTO FUELS')).toBe('Hindustan Petroleum (HPCL)')
    expect(extractMerchantFromReceipt('SHELL INDIA MARKETS PVT LTD')).toBe('Shell')
  })

  it('correctly classifies a fuel receipt', () => {
    const text = 'IOCL PUMP NO 4\nPETROL\nQTY: 15.00 LTRS\nRATE: 102.50\nTOTAL: 1537.50'
    const result = parseReceipt(text)
    expect(result.classification).toBe('fuel')
    expect(result.amount).toBe(1537.5)
    expect(result.litres).toBe(15)
    expect(result.pricePerUnit).toBe(102.5)
  })

  it('correctly classifies a service invoice', () => {
    const text = 'MARUTI SERVICE CENTRE\nJOB CARD NO: 4421\nOIL CHANGE & FILTER REPLACEMENT\nLABOUR CHARGES: 850\nPARTS: 1250\nGRAND TOTAL: 2100.00'
    const result = parseReceipt(text)
    expect(result.classification).toBe('service')
    expect(result.amount).toBe(2100)
    expect(result.confidence.hasAmount).toBe(true)
  })

  it('deduces missing price per litre when amount and litres are given', () => {
    const text = 'FUEL FILL\nTOTAL AMOUNT: 2000\nVOLUME: 20.0 LTR'
    const result = parseReceipt(text)
    expect(result.amount).toBe(2000)
    expect(result.litres).toBe(20)
    expect(result.pricePerUnit).toBe(100)
  })

  it('handles empty text gracefully without throwing errors', () => {
    const result = parseReceipt('')
    expect(result.classification).toBe('expense')
    expect(result.amount).toBe('')
    expect(result.confidence.hasAmount).toBe(false)
  })
})

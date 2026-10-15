/**
 * Indian & International Fuel Receipt / Service Invoice Text Parser
 * Extracts structured financial and maintenance data from OCR raw text.
 */

// Common Fuel Brand Keywords
const FUEL_BRANDS = [
  { match: /indian\s*oil|iocl/i, name: 'Indian Oil (IOCL)' },
  { match: /bharat\s*petroleum|bpcl/i, name: 'Bharat Petroleum (BPCL)' },
  { match: /hindustan\s*petroleum|hpcl/i, name: 'Hindustan Petroleum (HPCL)' },
  { match: /shell/i, name: 'Shell' },
  { match: /reliance|jio-bp/i, name: 'Jio-bp / Reliance' },
  { match: /nayara/i, name: 'Nayara Energy' },
  { match: /total\s*energies/i, name: 'TotalEnergies' },
  { match: /chevron|exxon|mobil|texaco|bp|speedway/i, name: 'Fuel Station' },
]

// Common Service / Workshop Keywords
const WORKSHOP_KEYWORDS = [
  /service\s*centre|service\s*center|workshop|garage|automotive|motors/i,
  /authorized\s*dealer|dealership|auto\s*care|repair\s*shop/i,
  /honda|hyundai|maruti|suzuki|tata|toyota|mahindra|kia|ford|volkswagen|skoda|bmw|mercedes/i,
]

/**
 * Normalizes Indian and ISO dates into YYYY-MM-DD
 */
export function extractDateFromReceipt(text) {
  if (!text) return null

  // 1. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = text.match(/\b([0-3]?\d)[/\-.]([0-1]?\d)[/\-.](20\d{2}|\d{2})\b/)
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10)
    let month = parseInt(dmyMatch[2], 10)
    let year = parseInt(dmyMatch[3], 10)
    if (year < 100) year += 2000

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  // 2. YYYY-MM-DD
  const ymdMatch = text.match(/\b(20\d{2})[/\-.]([0-1]?\d)[/\-.]([0-3]?\d)\b/)
  if (ymdMatch) {
    let year = parseInt(ymdMatch[1], 10)
    let month = parseInt(ymdMatch[2], 10)
    let day = parseInt(ymdMatch[3], 10)

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  // 3. Month name: 15 Oct 2026 or Oct 15, 2026
  const monthNameMatch = text.match(/\b([0-3]?\d)\s+([A-Za-z]{3,9})\s+(20\d{2})\b/)
  if (monthNameMatch) {
    const day = parseInt(monthNameMatch[1], 10)
    const monthStr = monthNameMatch[2].toLowerCase()
    const year = parseInt(monthNameMatch[3], 10)
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const monthIdx = months.findIndex((m) => monthStr.startsWith(m))
    if (monthIdx !== -1 && day >= 1 && day <= 31) {
      return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  return null
}

/**
 * Extracts Total Amount from text
 */
export function extractAmountFromReceipt(text) {
  if (!text) return null

  // Patterns with explicit total keywords
  const totalKeywords = [
    /(?:total\s*amount|grand\s*total|net\s*amount|net\s*payable|invoice\s*amount|total\s*sale|amount\s*paid|total)\s*[:=]?\s*(?:rs\.?|inr|₹|\$|€|£)?\s*([\d,]+\.?\d{0,2})/i,
    /(?:rs\.?|inr|₹|\$|€|£)\s*([\d,]+\.?\d{0,2})\s*(?:total|paid|net)/i,
    /(?:sale\s*value|amt|amount)\s*[:=]?\s*(?:rs\.?|inr|₹|\$|€|£)?\s*([\d,]+\.?\d{0,2})/i,
  ]

  for (const regex of totalKeywords) {
    const match = text.match(regex)
    if (match && match[1]) {
      const clean = match[1].replace(/,/g, '')
      const val = parseFloat(clean)
      if (!isNaN(val) && val > 0 && val < 500000) {
        return val
      }
    }
  }

  // Fallback: look for currency symbols followed by a reasonable number
  const currMatch = text.match(/(?:rs\.?|inr|₹|\$)\s*([\d,]+\.?\d{0,2})/i)
  if (currMatch && currMatch[1]) {
    const clean = currMatch[1].replace(/,/g, '')
    const val = parseFloat(clean)
    if (!isNaN(val) && val > 0 && val < 500000) {
      return val
    }
  }

  return null
}

/**
 * Extracts fuel volume (litres)
 */
export function extractLitresFromReceipt(text) {
  if (!text) return null

  const patterns = [
    /(?:volume|vol|qty|quantity|litres|litre|ltrs|ltr)\s*[:=]?\s*([\d,]+\.?\d{0,3})\s*(?:l|ltr|ltrs|litres)?/i,
    /([\d,]+\.?\d{1,3})\s*(?:l|ltr|ltrs|litres)\b/i,
  ]

  for (const regex of patterns) {
    const match = text.match(regex)
    if (match && match[1]) {
      const clean = match[1].replace(/,/g, '')
      const val = parseFloat(clean)
      if (!isNaN(val) && val > 0 && val <= 500) {
        return val
      }
    }
  }

  return null
}

/**
 * Extracts fuel price per unit / rate
 */
export function extractPricePerUnitFromReceipt(text) {
  if (!text) return null

  const patterns = [
    /(?:rate|price|rate\/ltr|price\/l|rate\/l|unit\s*price)\s*[:=]?\s*(?:rs\.?|inr|₹|\$)?\s*([\d,]+\.?\d{0,2})/i,
  ]

  for (const regex of patterns) {
    const match = text.match(regex)
    if (match && match[1]) {
      const clean = match[1].replace(/,/g, '')
      const val = parseFloat(clean)
      if (!isNaN(val) && val > 10 && val < 500) {
        return val
      }
    }
  }

  return null
}

/**
 * Identifies merchant or fuel brand or garage name
 */
export function extractMerchantFromReceipt(text) {
  if (!text) return null

  // 1. Check known fuel brands
  for (const brand of FUEL_BRANDS) {
    if (brand.match.test(text)) {
      return brand.name
    }
  }

  // 2. Check for garage / workshop patterns
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 3)
  for (const line of lines.slice(0, 5)) {
    for (const kw of WORKSHOP_KEYWORDS) {
      if (kw.test(line)) {
        // Return cleaned line as merchant
        return line.replace(/[^\w\s&.-]/g, '').trim()
      }
    }
  }

  // Default to first meaningful line if short
  if (lines.length > 0 && lines[0].length < 40) {
    return lines[0].replace(/[^\w\s&.-]/g, '').trim()
  }

  return null
}

/**
 * Auto-classifies the receipt into 'fuel', 'service', or 'expense'
 */
export function classifyReceipt(text, litres, merchant) {
  const lower = (text || '').toLowerCase()

  // Strong fuel indicators
  if (
    litres ||
    lower.includes('fuel') ||
    lower.includes('petrol') ||
    lower.includes('diesel') ||
    lower.includes('cng') ||
    lower.includes('dispenser') ||
    lower.includes('pump') ||
    lower.includes('nozzle') ||
    (merchant && (merchant.includes('Oil') || merchant.includes('Petroleum') || merchant.includes('Shell')))
  ) {
    return 'fuel'
  }

  // Strong service indicators
  if (
    lower.includes('service') ||
    lower.includes('workshop') ||
    lower.includes('maintenance') ||
    lower.includes('oil change') ||
    lower.includes('brake') ||
    lower.includes('labour') ||
    lower.includes('part no') ||
    lower.includes('spares')
  ) {
    return 'service'
  }

  return 'expense'
}

/**
 * Main parseReceipt function
 */
export function parseReceipt(rawOcrText) {
  const text = rawOcrText || ''
  const date = extractDateFromReceipt(text)
  let amount = extractAmountFromReceipt(text)
  let litres = extractLitresFromReceipt(text)
  let pricePerUnit = extractPricePerUnitFromReceipt(text)
  const merchant = extractMerchantFromReceipt(text)

  // Bidirectional 2-of-3 deduction if one is missing
  if (amount && litres && !pricePerUnit) {
    pricePerUnit = Number((amount / litres).toFixed(2))
  } else if (amount && pricePerUnit && !litres) {
    litres = Number((amount / pricePerUnit).toFixed(2))
  } else if (litres && pricePerUnit && !amount) {
    amount = Number((litres * pricePerUnit).toFixed(2))
  }

  const classification = classifyReceipt(text, litres, merchant)

  return {
    rawText: text,
    classification,
    date: date || new Date().toISOString().split('T')[0],
    amount: amount || '',
    litres: litres || '',
    pricePerUnit: pricePerUnit || '',
    merchant: merchant || '',
    description:
      classification === 'fuel'
        ? `Fuel Fill${litres ? ` (${litres} L)` : ''}${merchant ? ` @ ${merchant}` : ''}`
        : classification === 'service'
        ? `Vehicle Maintenance${merchant ? ` @ ${merchant}` : ''}`
        : `Ownership Expense${merchant ? ` - ${merchant}` : ''}`,
    confidence: {
      hasAmount: Boolean(amount),
      hasDate: Boolean(date),
      hasMerchant: Boolean(merchant),
      hasLitres: Boolean(litres),
    },
  }
}

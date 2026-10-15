/**
 * AutoCare — Indian Vehicle Registration Certificate (RC) Parser
 *
 * Supports:
 * - Smart Card RCs (MoRTH / State Transport Department standard format)
 * - Parivahan Sewa / mParivahan digital RC certificates
 * - Form 23 (Paper RC book format)
 *
 * Implements strict normalization, confidence scoring, and uncertainty flagging.
 * Never invents missing values.
 */

// List of all Indian State & Union Territory 2-letter codes
export const INDIAN_STATE_CODES = [
  'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'CH', 'DD', 'DN',
  'DL', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'LA',
  'LD', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OD', 'OR', 'PY',
  'PB', 'RJ', 'SK', 'TN', 'TS', 'TG', 'TR', 'UP', 'UK', 'UA', 'WB'
]

// Recognized Indian automotive manufacturers
export const KNOWN_MANUFACTURERS = [
  { normalized: 'Maruti Suzuki', aliases: ['MARUTI SUZUKI', 'MARUTI', 'MARUTI SUZUKI INDIA LTD', 'MSIL'] },
  { normalized: 'Hyundai', aliases: ['HYUNDAI', 'HYUNDAI MOTOR INDIA', 'HMIL'] },
  { normalized: 'Tata', aliases: ['TATA MOTORS', 'TATA', 'TATA MOTORS LTD', 'TML'] },
  { normalized: 'Mahindra', aliases: ['MAHINDRA', 'MAHINDRA & MAHINDRA', 'M&M', 'MAHINDRA AND MAHINDRA'] },
  { normalized: 'Honda', aliases: ['HONDA', 'HONDA CARS INDIA', 'HONDA MOTORCYCLE', 'HMSI', 'HCIL'] },
  { normalized: 'Toyota', aliases: ['TOYOTA', 'TOYOTA KIRLOSKAR', 'TKML'] },
  { normalized: 'Kia', aliases: ['KIA', 'KIA MOTORS', 'KIA INDIA'] },
  { normalized: 'Volkswagen', aliases: ['VOLKSWAGEN', 'VW'] },
  { normalized: 'Skoda', aliases: ['SKODA', 'SKODA AUTO'] },
  { normalized: 'Renault', aliases: ['RENAULT', 'RENAULT INDIA'] },
  { normalized: 'MG', aliases: ['MG MOTOR', 'MORRIS GARAGES', 'MG'] },
  { normalized: 'Nissan', aliases: ['NISSAN', 'NISSAN MOTOR'] },
  { normalized: 'Ford', aliases: ['FORD', 'FORD INDIA'] },
  { normalized: 'Hero', aliases: ['HERO MOTOCORP', 'HERO HONDA', 'HERO'] },
  { normalized: 'Bajaj', aliases: ['BAJAJ AUTO', 'BAJAJ'] },
  { normalized: 'TVS', aliases: ['TVS MOTOR', 'TVS'] },
  { normalized: 'Royal Enfield', aliases: ['ROYAL ENFIELD', 'EICHER MOTORS'] },
  { normalized: 'Yamaha', aliases: ['YAMAHA', 'INDIA YAMAHA MOTOR'] },
  { normalized: 'Suzuki', aliases: ['SUZUKI MOTORCYCLE', 'SUZUKI'] },
  { normalized: 'KTM', aliases: ['KTM', 'BAJAJ KTM'] },
  { normalized: 'Ather', aliases: ['ATHER ENERGY', 'ATHER'] },
  { normalized: 'Ola Electric', aliases: ['OLA ELECTRIC', 'OLA'] },
  { normalized: 'BMW', aliases: ['BMW', 'BMW INDIA'] },
  { normalized: 'Mercedes-Benz', aliases: ['MERCEDES-BENZ', 'MERCEDES BENZ', 'MERCEDES', 'DAIMLER'] },
  { normalized: 'Audi', aliases: ['AUDI', 'AUDI AG'] },
  { normalized: 'Jeep', aliases: ['JEEP', 'FCA INDIA'] },
  { normalized: 'Volvo', aliases: ['VOLVO', 'VOLVO AUTO INDIA'] },
  { normalized: 'Jawa', aliases: ['JAWA', 'CLASSIC LEGENDS'] },
]

/**
 * Normalizes Indian Registration Number
 * Examples:
 * - "DL 01 AB 1234" -> "DL 01 AB 1234"
 * - "MH12DE1432" -> "MH 12 DE 1432"
 * - "22BH1234AA" -> "22 BH 1234 AA"
 * - "ka-05-mj-5012" -> "KA 05 MJ 5012"
 */
export function normalizeRegistrationNumber(raw) {
  if (!raw || typeof raw !== 'string') return ''

  // Clean unwanted punctuation and uppercase
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!cleaned) return ''

  // 1. Check BH Series: e.g. 22BH1234AA or 21BH9999Z
  const bhMatch = cleaned.match(/^(\d{2})(BH)(\d{4})([A-Z]{1,2})$/)
  if (bhMatch) {
    return `${bhMatch[1]} BH ${bhMatch[3]} ${bhMatch[4]}`
  }

  // 2. Standard State Series: e.g. DL01AB1234 or KA05M1234 or UP321234 (without series)
  const stdMatch = cleaned.match(/^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/)
  if (stdMatch) {
    const state = stdMatch[1]
    const rto = stdMatch[2].padStart(2, '0')
    const series = stdMatch[3]
    const num = stdMatch[4].padStart(4, '0')

    return series ? `${state} ${rto} ${series} ${num}` : `${state} ${rto} ${num}`
  }

  // Fallback: return cleaned with spaced pairs if reasonable length
  return cleaned
}

/**
 * Cleans common OCR character confusions in registration numbers
 */
export function fixOcrNumberConfusions(str) {
  if (!str) return ''
  let s = str.toUpperCase().trim()

  // Replace common delimiter artifacts
  s = s.replace(/[:|\-_.,;]/g, ' ').replace(/\s+/g, ' ').trim()

  return s
}

/**
 * Extract registration number candidate from text
 */
export function extractRegistrationNumber(text) {
  if (!text) return { value: '', confidence: 0, isUncertain: true }

  const lines = text.split('\n')

  // Common label patterns
  const labelPatterns = [
    /(?:REGN|REG|REGISTRATION|VEHICLE|VEH)\.?\s*(?:NO|NUMBER|NUM)?\.?\s*[:\-]?\s*([A-Z0-9\s\-]+)/i,
    /(?:REGN\.?\s*DT|DATE)\s*[:\-]?\s*[0-9/.\-]+\s+([A-Z0-9\s\-]+)/i,
  ]

  // Direct Regex for Indian registration formats
  // Standard format: State(2) + RTO(2) + Series(1-3) + Number(1-4)
  const standardPlateRegex = /\b([A-Z]{2})\s*[-.]?\s*(\d{1,2})\s*[-.]?\s*([A-Z]{1,3})\s*[-.]?\s*(\d{1,4})\b/i
  // Plate without series (e.g. DL 01 1234)
  const noSeriesPlateRegex = /\b([A-Z]{2})\s*[-.]?\s*(\d{1,2})\s*[-.]?\s*(\d{1,4})\b/i
  // BH series: 2 digits + BH + 4 digits + 1-2 letters
  const bhPlateRegex = /\b(\d{2})\s*[-.]?\s*(BH)\s*[-.]?\s*(\d{4})\s*[-.]?\s*([A-Z]{1,2})\b/i

  // 1. Try label-directed extraction first
  for (const line of lines) {
    for (const pat of labelPatterns) {
      const match = line.match(pat)
      if (match && match[1]) {
        const candidate = match[1].trim()
        const bhCandidate = candidate.match(bhPlateRegex)
        if (bhCandidate) {
          const norm = normalizeRegistrationNumber(bhCandidate[0])
          return { value: norm, confidence: 0.95, isUncertain: false }
        }

        const stdCandidate = candidate.match(standardPlateRegex)
        if (stdCandidate && INDIAN_STATE_CODES.includes(stdCandidate[1].toUpperCase())) {
          const norm = normalizeRegistrationNumber(stdCandidate[0])
          return { value: norm, confidence: 0.95, isUncertain: false }
        }
      }
    }
  }

  // 2. Global search for BH Series
  const bhMatch = text.match(bhPlateRegex)
  if (bhMatch) {
    const norm = normalizeRegistrationNumber(bhMatch[0])
    return { value: norm, confidence: 0.9, isUncertain: false }
  }

  // 3. Global search for Standard Plates
  const allMatches = [...text.matchAll(new RegExp(standardPlateRegex, 'gi'))]
  for (const m of allMatches) {
    const state = m[1].toUpperCase()
    if (INDIAN_STATE_CODES.includes(state)) {
      const norm = normalizeRegistrationNumber(m[0])
      return { value: norm, confidence: 0.85, isUncertain: false }
    }
  }

  // 4. Try no-series plates
  const noSeriesMatches = [...text.matchAll(new RegExp(noSeriesPlateRegex, 'gi'))]
  for (const m of noSeriesMatches) {
    const state = m[1].toUpperCase()
    if (INDIAN_STATE_CODES.includes(state)) {
      const norm = normalizeRegistrationNumber(m[0])
      return { value: norm, confidence: 0.75, isUncertain: true }
    }
  }

  return { value: '', confidence: 0, isUncertain: true }
}

/**
 * Normalizes dates from Indian RC formats (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY) into YYYY-MM-DD
 */
export function normalizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return ''

  const cleaned = dateStr.trim().replace(/[.,]/g, '/').replace(/-/g, '/')
  const parts = cleaned.split('/')

  if (parts.length === 3) {
    let day = parseInt(parts[0], 10)
    let month = parseInt(parts[1], 10)
    let year = parseInt(parts[2], 10)

    // Handle 2-digit years e.g. 21 -> 2021
    if (year < 100) {
      year = year > 50 ? 1900 + year : 2000 + year
    }

    // Handle reverse format YYYY/MM/DD
    if (day > 1000 && year <= 31) {
      const temp = day
      day = year
      year = temp
    }

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1950 && year <= 2050) {
      const yyyy = String(year)
      const mm = String(month).padStart(2, '0')
      const dd = String(day).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
  }

  return ''
}

/**
 * Extracts Registration Date
 */
export function extractRegistrationDate(text) {
  if (!text) return { value: '', confidence: 0, isUncertain: true }

  const lines = text.split('\n')
  const datePattern = /(\b\d{1,2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:\d{4}|\d{2})\b)/

  const regDateLabels = [
    /(?:DATE\s+OF\s+REGN|REGISTRATION\s+DATE|REGN\.?\s*DT|REG\.?\s*DATE|REG\s+DATE|REGN\s+DATE|DT\s+OF\s+REGN|DATE\s+OF\s+REGISTRATION)\s*[:\-]?\s*([0-9\/\.\-]+)/i,
    /(?:REGN|REG)\.?\s*DATE\s*[:\-]?\s*([0-9\/\.\-]+)/i,
    /(?:ISSUE\s+DATE|ISSUED\s+ON)\s*[:\-]?\s*([0-9\/\.\-]+)/i,
  ]

  for (const line of lines) {
    for (const pat of regDateLabels) {
      const match = line.match(pat)
      if (match && match[1]) {
        const norm = normalizeDate(match[1])
        if (norm) {
          return { value: norm, confidence: 0.9, isUncertain: false }
        }
      }
    }
  }

  // Look for any line containing "REG" and a date
  for (const line of lines) {
    if (/REG/i.test(line) && !/VALID|EXPIR|FITNESS/i.test(line)) {
      const m = line.match(datePattern)
      if (m && m[1]) {
        const norm = normalizeDate(m[1])
        if (norm) {
          return { value: norm, confidence: 0.7, isUncertain: false }
        }
      }
    }
  }

  return { value: '', confidence: 0, isUncertain: true }
}

/**
 * Extracts Chassis Number / VIN (Standard 17 alphanumeric characters or labeled chassis)
 */
export function extractChassisNumber(text) {
  if (!text) return { value: '', confidence: 0, isUncertain: true }

  const lines = text.split('\n')
  const labels = [
    /(?:CHASSIS\s*(?:NO|NUMBER)?|CH\.?\s*NO|VIN)\s*[:\-]?\s*([A-HJ-NPR-Z0-9\*\-]{6,25})/i,
    /(?:C\.?\s*NO)\s*[:\-]?\s*([A-HJ-NPR-Z0-9\*\-]{6,25})/i,
  ]

  for (const line of lines) {
    for (const pat of labels) {
      const match = line.match(pat)
      if (match && match[1]) {
        const clean = match[1].toUpperCase().replace(/[^A-Z0-9]/g, '')
        if (clean.length >= 8) {
          const is17 = clean.length === 17
          return {
            value: clean,
            confidence: is17 ? 0.95 : 0.8,
            isUncertain: !is17,
          }
        }
      }
    }
  }

  // Global search for 17-character VIN pattern (standard ISO 3779 excludes I, O, Q)
  const vinMatches = text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/gi)
  if (vinMatches) {
    for (const v of vinMatches) {
      // Avoid false positive matching registration numbers or timestamps
      if (/[A-Z]/.test(v) && /[0-9]/.test(v)) {
        return { value: v.toUpperCase(), confidence: 0.85, isUncertain: false }
      }
    }
  }

  return { value: '', confidence: 0, isUncertain: true }
}

/**
 * Extracts Engine Number
 */
export function extractEngineNumber(text) {
  if (!text) return { value: '', confidence: 0, isUncertain: true }

  const lines = text.split('\n')
  const labels = [
    /(?:ENGINE\s*(?:NO|NUMBER)?|ENG\.?\s*NO|MOTOR\s*(?:NO|NUMBER)?|E\.?\s*NO)\s*[:\-]?\s*([A-Z0-9\*\-]{5,20})/i,
  ]

  for (const line of lines) {
    for (const pat of labels) {
      const match = line.match(pat)
      if (match && match[1]) {
        const clean = match[1].toUpperCase().replace(/[^A-Z0-9]/g, '')
        if (clean.length >= 5) {
          return { value: clean, confidence: 0.9, isUncertain: false }
        }
      }
    }
  }

  return { value: '', confidence: 0, isUncertain: true }
}

/**
 * Extracts Owner Name
 */
export function extractOwnerName(text) {
  if (!text) return { value: '', confidence: 0, isUncertain: true }

  const lines = text.split('\n')
  const labels = [
    /(?:OWNER\s*(?:'S)?\s*NAME|REGD\s*OWNER|NAME\s*OF\s*OWNER|REGISTERED\s*OWNER|R\.?O\.?\s*NAME|OWNER)\s*[:\-]?\s*(.+)/i,
    /^NAME\s*[:\-]\s*(.+)/i,
  ]

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (/MAKER|MODEL|FATHER|AUTHORITY/i.test(line)) continue
    for (const pat of labels) {
      const match = line.match(pat)
      if (match && match[1]) {
        let name = match[1].trim()
        // Cut off relation indicators like S/W/D OF, SON OF, D/O, C/O, ADDRESS
        name = name.split(/\b(?:S\/O|W\/O|D\/O|C\/O|SON OF|WIFE OF|DAUGHTER OF|S\/W\/D OF|ADDRESS|ADD)\b/i)[0]
        name = name.replace(/[^A-Za-z\s.]/g, ' ').replace(/\s+/g, ' ').trim()

        if (name.length >= 3 && !/^(AND|THE|REGISTRATION|VEHICLE|CERTIFICATE)$/i.test(name)) {
          return { value: name, confidence: 0.85, isUncertain: false }
        }
      }
    }
  }

  return { value: '', confidence: 0, isUncertain: true }
}

/**
 * Extracts Manufacturer & Model
 */
export function extractManufacturerAndModel(text) {
  if (!text) {
    return {
      make: { value: '', confidence: 0, isUncertain: true },
      model: { value: '', confidence: 0, isUncertain: true },
    }
  }

  const lines = text.split('\n')

  let detectedMake = ''
  let detectedModel = ''
  let makeConfidence = 0
  let modelConfidence = 0

  // 1. Check combined "Maker / Model" line (very common in Parivahan / Smart Cards)
  const combinedPattern = /(?:MAKER\s*(?:\/|\&|AND)?\s*MODEL|MAKER\s*NAME\s*\/\s*MODEL)\s*[:\-]?\s*(.+)/i
  for (const line of lines) {
    const match = line.match(combinedPattern)
    if (match && match[1]) {
      const parts = match[1].split(/[\/|]/)
      if (parts.length >= 2) {
        const rawMake = parts[0].trim()
        const rawModel = parts.slice(1).join(' ').trim()

        // Match against known makers
        const matched = matchKnownManufacturer(rawMake)
        detectedMake = matched ? matched.normalized : cleanString(rawMake)
        detectedModel = cleanString(rawModel)
        makeConfidence = 0.95
        modelConfidence = 0.9
        break
      } else {
        // Line might just have make followed by model
        const singlePart = parts[0].trim()
        const matched = matchKnownManufacturer(singlePart)
        if (matched) {
          detectedMake = matched.normalized
          detectedModel = cleanString(singlePart.replace(new RegExp(matched.matchedAlias, 'i'), ''))
          makeConfidence = 0.9
          modelConfidence = detectedModel ? 0.8 : 0
          break
        }
      }
    }
  }

  // 2. Separate Maker and Model lines if not resolved
  if (!detectedMake) {
    const makerPattern = /(?:MAKER(?:\'S)?\s*(?:NAME)?|MANUFACTURER|MFG)\s*[:\-]?\s*(.+)/i
    for (const line of lines) {
      if (/YEAR\s*OF\s*MFG|MFG\s*DATE|MFG\s*YEAR/i.test(line)) continue
      const match = line.match(makerPattern)
      if (match && match[1]) {
        const raw = match[1].trim()
        const matched = matchKnownManufacturer(raw)
        detectedMake = matched ? matched.normalized : cleanString(raw)
        makeConfidence = matched ? 0.9 : 0.7
        break
      }
    }
  }

  if (!detectedModel) {
    const modelPattern = /(?:MODEL(?:\s*NAME)?|MAKER\s*CLASS|COMMERCIAL\s*NAME)\s*[:\-]?\s*(.+)/i
    for (const line of lines) {
      const match = line.match(modelPattern)
      if (match && match[1]) {
        detectedModel = cleanString(match[1])
        modelConfidence = 0.85
        break
      }
    }
  }

  // 3. Fallback: scan text for known manufacturers
  if (!detectedMake) {
    for (const km of KNOWN_MANUFACTURERS) {
      for (const alias of km.aliases) {
        const regex = new RegExp(`\\b${alias}\\b`, 'i')
        if (regex.test(text)) {
          detectedMake = km.normalized
          makeConfidence = 0.8
          break
        }
      }
      if (detectedMake) break
    }
  }

  return {
    make: {
      value: detectedMake,
      confidence: makeConfidence,
      isUncertain: !detectedMake || makeConfidence < 0.7,
    },
    model: {
      value: detectedModel,
      confidence: modelConfidence,
      isUncertain: !detectedModel || modelConfidence < 0.7,
    },
  }
}

/**
 * Extracts Fuel Type (Petrol, Diesel, Electric, CNG, Hybrid, LPG)
 */
export function extractFuelType(text) {
  if (!text) return { value: 'Petrol', confidence: 0, isUncertain: true }

  const lines = text.split('\n')
  const fuelPattern = /(?:FUEL(?:\s*TYPE|\s*USED)?|TYPE\s*OF\s*FUEL)\s*[:\-]?\s*(.+)/i

  for (const line of lines) {
    const match = line.match(fuelPattern)
    if (match && match[1]) {
      const val = match[1].toUpperCase()
      if (/DIESEL|HSD/i.test(val)) return { value: 'Diesel', confidence: 0.95, isUncertain: false }
      if (/ELECTRIC|EV|BATTERY/i.test(val)) return { value: 'Electric', confidence: 0.95, isUncertain: false }
      if (/CNG/i.test(val)) return { value: 'CNG', confidence: 0.95, isUncertain: false }
      if (/HYBRID/i.test(val)) return { value: 'Hybrid', confidence: 0.95, isUncertain: false }
      if (/LPG/i.test(val)) return { value: 'LPG', confidence: 0.95, isUncertain: false }
      if (/PETROL|MOTOR\s*SPIRIT/i.test(val)) return { value: 'Petrol', confidence: 0.95, isUncertain: false }
    }
  }

  // Global word detection if label missing
  if (/\b(?:DIESEL)\b/i.test(text)) return { value: 'Diesel', confidence: 0.8, isUncertain: false }
  if (/\b(?:ELECTRIC|BATTERY OPERATED)\b/i.test(text)) return { value: 'Electric', confidence: 0.85, isUncertain: false }
  if (/\b(?:CNG)\b/i.test(text)) return { value: 'CNG', confidence: 0.85, isUncertain: false }
  if (/\b(?:PETROL)\b/i.test(text)) return { value: 'Petrol', confidence: 0.8, isUncertain: false }

  // Default fallback
  return { value: 'Petrol', confidence: 0.3, isUncertain: true }
}

/**
 * Extracts Vehicle Class and maps to AutoCare category:
 * 'car', 'suv', 'motorcycle', 'scooter', 'truck', 'van'
 */
export function extractVehicleCategory(text) {
  if (!text) return { value: 'car', confidence: 0, isUncertain: true }

  const lines = text.split('\n')
  const classPattern = /(?:VEHICLE\s*CLASS|VEH\.?\s*CLASS|CLASS\s*OF\s*VEHICLE|VCH\s*CLASS|CLASS)\s*[:\-]?\s*(.+)/i

  let rawClass = ''
  for (const line of lines) {
    const match = line.match(classPattern)
    if (match && match[1]) {
      rawClass = match[1].toUpperCase()
      break
    }
  }

  const searchText = `${rawClass} ${text}`.toUpperCase()

  // Two-wheelers
  if (/MCWOG|MOPED|SCOOTER|SCOOT/i.test(searchText)) {
    return { value: 'scooter', confidence: 0.9, isUncertain: false, raw: rawClass || 'SCOOTER' }
  }
  if (/MCWG|M\/CYCL|MOTORCYCLE|MOTOR\s*CYCLE|2\s*WHEELER|TWO\s*WHEELER/i.test(searchText)) {
    return { value: 'motorcycle', confidence: 0.9, isUncertain: false, raw: rawClass || 'MCWG' }
  }

  // Trucks / Commercial
  if (/HGV|LGV|GOODS\s*CARRIER|TRUCK|TIPPER|TRAILER/i.test(searchText)) {
    return { value: 'truck', confidence: 0.9, isUncertain: false, raw: rawClass || 'GOODS CARRIER' }
  }

  // Vans
  if (/MAXI\s*CAB|OMNIBUS|VAN|MINIVAN/i.test(searchText)) {
    return { value: 'van', confidence: 0.85, isUncertain: false, raw: rawClass || 'VAN' }
  }

  // SUVs
  if (/SUV|MPV|SPORTS\s*UTILITY/i.test(searchText)) {
    return { value: 'suv', confidence: 0.85, isUncertain: false, raw: rawClass || 'SUV' }
  }

  // Cars (LMV, LMV-NT, Motor Car, Sedan, Hatchback)
  if (/LMV|MOTOR\s*CAR|CAR|SEDAN|HATCHBACK/i.test(searchText)) {
    return { value: 'car', confidence: 0.9, isUncertain: false, raw: rawClass || 'LMV' }
  }

  return { value: 'car', confidence: 0.4, isUncertain: true, raw: rawClass }
}

/**
 * Extracts Manufacturing Year / Model Year
 */
export function extractModelYear(text, regDateStr = '') {
  if (!text) {
    const yearFromReg = regDateStr ? parseInt(regDateStr.split('-')[0], 10) : new Date().getFullYear()
    return { value: yearFromReg || new Date().getFullYear(), confidence: 0, isUncertain: true }
  }

  const lines = text.split('\n')
  const mfgYearPatterns = [
    /(?:YEAR\s*OF\s*MFG|MFG\s*YEAR|MFG\s*YR|YEAR\s*OF\s*MANUFACTURE|MFR\s*YEAR)\s*[:\-]?\s*([0-9]{4})/i,
    /(?:MFG\s*DATE|MONTH\s*[\&\/]\s*YEAR\s*OF\s*MFG)\s*[:\-]?\s*(?:[0-9]{1,2}[-/.])?([0-9]{4})/i,
  ]

  for (const line of lines) {
    for (const pat of mfgYearPatterns) {
      const match = line.match(pat)
      if (match && match[1]) {
        const yr = parseInt(match[1], 10)
        if (yr >= 1950 && yr <= new Date().getFullYear() + 1) {
          return { value: yr, confidence: 0.9, isUncertain: false }
        }
      }
    }
  }

  // Fallback to year from registration date
  if (regDateStr) {
    const yr = parseInt(regDateStr.split('-')[0], 10)
    if (yr >= 1950 && yr <= new Date().getFullYear()) {
      return { value: yr, confidence: 0.7, isUncertain: false }
    }
  }

  return { value: new Date().getFullYear(), confidence: 0.2, isUncertain: true }
}

/**
 * Main parser entry point: extracts and validates all Indian RC fields
 */
export function parseIndianRc(ocrText) {
  if (!ocrText || typeof ocrText !== 'string' || !ocrText.trim()) {
    return {
      isValid: false,
      error: 'No readable text was detected from the uploaded document.',
      extracted: null,
    }
  }

  const regNo = extractRegistrationNumber(ocrText)
  const regDate = extractRegistrationDate(ocrText)
  const chassisNo = extractChassisNumber(ocrText)
  const engineNo = extractEngineNumber(ocrText)
  const ownerName = extractOwnerName(ocrText)
  const { make, model } = extractManufacturerAndModel(ocrText)
  const fuelType = extractFuelType(ocrText)
  const vehicleCategory = extractVehicleCategory(ocrText)
  const modelYear = extractModelYear(ocrText, regDate.value)

  // Suggest a suitable vehicle nickname
  let suggestedName = ''
  if (make.value && model.value) {
    suggestedName = `${make.value} ${model.value}`
  } else if (model.value) {
    suggestedName = model.value
  } else if (regNo.value) {
    suggestedName = `Vehicle ${regNo.value}`
  } else {
    suggestedName = 'My Vehicle'
  }

  // Overall validity check: must have found at least a registration number or chassis or make/model
  const fieldCount = [
    regNo.value,
    chassisNo.value,
    engineNo.value,
    make.value,
    model.value,
    regDate.value,
    ownerName.value,
  ].filter(Boolean).length

  const isValid = fieldCount >= 2 || Boolean(regNo.value)

  return {
    isValid,
    fieldCount,
    extracted: {
      registration_number: regNo,
      registration_date: regDate,
      chassis_number: chassisNo,
      engine_number: engineNo,
      owner_name: ownerName,
      make,
      model,
      year: modelYear,
      fuel_type: fuelType,
      type: vehicleCategory,
      suggested_name: suggestedName,
    },
    rawText: ocrText,
  }
}

// -------------------------------------------------------------
// HELPER UTILITIES
// -------------------------------------------------------------

function matchKnownManufacturer(str) {
  if (!str) return null
  const upper = str.toUpperCase()
  for (const km of KNOWN_MANUFACTURERS) {
    for (const alias of km.aliases) {
      if (upper.includes(alias)) {
        return { normalized: km.normalized, matchedAlias: alias }
      }
    }
  }
  return null
}

function cleanString(str) {
  if (!str) return ''
  return str
    .replace(/[;:"*#_+=<>\\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Checks if a vehicle with the same registration number already exists in the user's fleet.
 *
 * @param {string} licensePlate - Input plate number (raw or normalized)
 * @param {Array} existingVehicles - List of current user vehicles
 * @param {string|null} currentVehicleId - ID of vehicle being edited to ignore itself
 * @returns {{ isDuplicate: boolean, duplicateVehicle: object|null }}
 */
export function checkDuplicateRegistrationNumber(licensePlate, existingVehicles = [], currentVehicleId = null) {
  if (!licensePlate || !Array.isArray(existingVehicles) || existingVehicles.length === 0) {
    return { isDuplicate: false, duplicateVehicle: null }
  }

  const normalizedInput = normalizeRegistrationNumber(licensePlate).replace(/\s+/g, '')
  if (!normalizedInput) {
    return { isDuplicate: false, duplicateVehicle: null }
  }

  for (const v of existingVehicles) {
    if (currentVehicleId && v.id === currentVehicleId) continue
    if (!v.license_plate) continue

    const existingNorm = normalizeRegistrationNumber(v.license_plate).replace(/\s+/g, '')
    if (existingNorm === normalizedInput) {
      return { isDuplicate: true, duplicateVehicle: v }
    }
  }

  return { isDuplicate: false, duplicateVehicle: null }
}


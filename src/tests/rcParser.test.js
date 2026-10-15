import { describe, it, expect } from 'vitest'
import {
  normalizeRegistrationNumber,
  normalizeDate,
  extractRegistrationNumber,
  extractRegistrationDate,
  extractChassisNumber,
  extractEngineNumber,
  extractOwnerName,
  extractManufacturerAndModel,
  extractFuelType,
  extractVehicleCategory,
  extractModelYear,
  parseIndianRc,
  checkDuplicateRegistrationNumber,
} from '../lib/rcParser'
import { validateRcFile } from '../lib/rcOcrPreprocess'

describe('Indian RC Parser - Normalization Utilities', () => {
  it('normalizes standard state registration numbers with various punctuation and spacing', () => {
    expect(normalizeRegistrationNumber('dl01ab1234')).toBe('DL 01 AB 1234')
    expect(normalizeRegistrationNumber('MH-12-DE-1432')).toBe('MH 12 DE 1432')
    expect(normalizeRegistrationNumber('ka.05.mj.5012')).toBe('KA 05 MJ 5012')
    expect(normalizeRegistrationNumber('HR 26 DQ 5551')).toBe('HR 26 DQ 5551')
    expect(normalizeRegistrationNumber('UP32AB1234')).toBe('UP 32 AB 1234')
  })

  it('normalizes Bharat Stage (BH Series) registration numbers', () => {
    expect(normalizeRegistrationNumber('22BH4567AA')).toBe('22 BH 4567 AA')
    expect(normalizeRegistrationNumber('21-BH-1234-Z')).toBe('21 BH 1234 Z')
  })

  it('normalizes Indian date formats (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY) into ISO YYYY-MM-DD', () => {
    expect(normalizeDate('14/08/2021')).toBe('2021-08-14')
    expect(normalizeDate('22-11-2022')).toBe('2022-11-22')
    expect(normalizeDate('05.03.2020')).toBe('2020-03-05')
    expect(normalizeDate('01/10/21')).toBe('2021-10-01')
    expect(normalizeDate('invalid-date')).toBe('')
    expect(normalizeDate(null)).toBe('')
  })
})

describe('Indian RC Layout Parsing - Smart Card Format', () => {
  const smartCardText = `
    TRANSPORT DEPARTMENT GOVERNMENT OF MAHARASHTRA
    REGN. NO: MH 12 DE 1432
    REGN. DT: 14/08/2021
    CHASSIS NO: MA3FBEB1S00123456
    ENGINE NO: K12MN1234567
    NAME: RAJESH KUMAR SHARMA
    S/W/D OF: RAMESH SHARMA
    MAKER: MARUTI SUZUKI INDIA LTD
    MODEL: SWIFT VXI
    VEH. CLASS: LMV
    FUEL: PETROL
    MFG. YR: 2021
  `

  it('correctly parses all fields from Smart Card RC layout', () => {
    const result = parseIndianRc(smartCardText)
    expect(result.isValid).toBe(true)
    expect(result.extracted.registration_number.value).toBe('MH 12 DE 1432')
    expect(result.extracted.registration_number.isUncertain).toBe(false)
    expect(result.extracted.registration_date.value).toBe('2021-08-14')
    expect(result.extracted.chassis_number.value).toBe('MA3FBEB1S00123456')
    expect(result.extracted.engine_number.value).toBe('K12MN1234567')
    expect(result.extracted.owner_name.value).toBe('RAJESH KUMAR SHARMA')
    expect(result.extracted.make.value).toBe('Maruti Suzuki')
    expect(result.extracted.model.value).toBe('SWIFT VXI')
    expect(result.extracted.type.value).toBe('car')
    expect(result.extracted.fuel_type.value).toBe('Petrol')
    expect(result.extracted.year.value).toBe(2021)
  })
})

describe('Indian RC Layout Parsing - Parivahan Digital Format', () => {
  const parivahanText = `
    GOVERNMENT OF INDIA
    MINISTRY OF ROAD TRANSPORT & HIGHWAYS
    CERTIFICATE OF REGISTRATION
    Registration No: DL-01-AB-1234
    Registering Authority: RTO DELHI CENTRAL
    Registration Date: 22-11-2022
    Chassis No: ME4JC4817K8098765
    Engine No: JC48E7209876
    Owner Name: ANANYA IYER
    Maker / Model: HONDA CARS INDIA / CITY 1.5 V MT
    Vehicle Class: Motor Car (LMV)
    Fuel Type: Petrol
    Year of Mfg: 2022
  `

  it('correctly parses combined Maker / Model and Parivahan formatting', () => {
    const result = parseIndianRc(parivahanText)
    expect(result.isValid).toBe(true)
    expect(result.extracted.registration_number.value).toBe('DL 01 AB 1234')
    expect(result.extracted.registration_date.value).toBe('2022-11-22')
    expect(result.extracted.owner_name.value).toBe('ANANYA IYER')
    expect(result.extracted.make.value).toBe('Honda')
    expect(result.extracted.model.value).toBe('CITY 1.5 V MT')
    expect(result.extracted.type.value).toBe('car')
    expect(result.extracted.year.value).toBe(2022)
  })
})

describe('Indian RC Layout Parsing - Two-Wheelers & Commercial Vehicles', () => {
  it('correctly classifies motorcycles (MCWG) and extracts Bajaj details', () => {
    const bikeText = `
      GOVERNMENT OF KARNATAKA
      TRANSPORT DEPARTMENT
      REG NO: KA 05 MJ 5012
      REG DATE: 05/03/2020
      NAME: SURESH PATEL
      MAKER: BAJAJ AUTO LTD
      MODEL: PULSAR 150
      CLASS: MCWG
      FUEL: PETROL
      CHASSIS NO: MD2A11CY8K1234567
      ENGINE NO: DHGBK12345
      MFG: 2020
    `
    const result = parseIndianRc(bikeText)
    expect(result.extracted.registration_number.value).toBe('KA 05 MJ 5012')
    expect(result.extracted.make.value).toBe('Bajaj')
    expect(result.extracted.model.value).toBe('PULSAR 150')
    expect(result.extracted.type.value).toBe('motorcycle')
  })

  it('correctly classifies scooters (MCWOG)', () => {
    const scooterText = `
      REG NO: TN 09 AB 9876
      DATE: 01/10/2021
      OWNER: PRIYA RAMAN
      MAKER: HONDA MOTORCYCLE
      MODEL: ACTIVA 6G
      CLASS: MCWOG
      FUEL: PETROL
      CHASSIS: ME4JF5012L8123456
      ENGINE: JF50E123456
      MFG YR: 2021
    `
    const result = parseIndianRc(scooterText)
    expect(result.extracted.registration_number.value).toBe('TN 09 AB 9876')
    expect(result.extracted.type.value).toBe('scooter')
    expect(result.extracted.model.value).toBe('ACTIVA 6G')
  })

  it('correctly classifies commercial goods carriers (Truck)', () => {
    const truckText = `
      REGN NO: HR 26 DQ 5551
      DT OF REGN: 10-06-2019
      OWNER NAME: BALWINDER SINGH
      MAKER: MAHINDRA & MAHINDRA
      MODEL: BOLERO MAXI TRUCK
      VEHICLE CLASS: GOODS CARRIER
      FUEL: DIESEL
      CHASSIS NO: MA1YA2WCKK1234567
      ENGINE NO: M2DICR12345
      YEAR OF MANUFACTURE: 2019
    `
    const result = parseIndianRc(truckText)
    expect(result.extracted.registration_number.value).toBe('HR 26 DQ 5551')
    expect(result.extracted.type.value).toBe('truck')
    expect(result.extracted.fuel_type.value).toBe('Diesel')
    expect(result.extracted.make.value).toBe('Mahindra')
  })

  it('correctly handles Bharat Series (BH) and Electric vehicle', () => {
    const bhText = `
      BHARAT SERIES REGISTRATION CERTIFICATE
      REGN NO: 22 BH 4567 AA
      DATE OF REGN: 15/01/2023
      NAME: VIKRAMADITYA SINGH
      MAKER / MODEL: TATA MOTORS LTD / NEXON EV MAX
      VEHICLE CLASS: SUV
      FUEL: ELECTRIC
      CHASSIS NO: MAT612345N1234567
      ENGINE NO: 3P654321
      MFG YEAR: 2023
    `
    const result = parseIndianRc(bhText)
    expect(result.extracted.registration_number.value).toBe('22 BH 4567 AA')
    expect(result.extracted.fuel_type.value).toBe('Electric')
    expect(result.extracted.type.value).toBe('suv')
    expect(result.extracted.make.value).toBe('Tata')
  })
})

describe('Indian RC Parser - Uncertainty Handling & Missing Values', () => {
  it('never invents missing fields and flags uncertain fields', () => {
    const sparseText = `
      GOVERNMENT OF UTTAR PRADESH
      REG NO: UP 32 AB 1234
      FUEL: DIESEL
    `
    const result = parseIndianRc(sparseText)
    expect(result.extracted.registration_number.value).toBe('UP 32 AB 1234')
    expect(result.extracted.registration_number.isUncertain).toBe(false)
    expect(result.extracted.fuel_type.value).toBe('Diesel')

    // Missing fields MUST NOT be invented
    expect(result.extracted.chassis_number.value).toBe('')
    expect(result.extracted.chassis_number.isUncertain).toBe(true)
    expect(result.extracted.engine_number.value).toBe('')
    expect(result.extracted.engine_number.isUncertain).toBe(true)
    expect(result.extracted.owner_name.value).toBe('')
    expect(result.extracted.owner_name.isUncertain).toBe(true)
    expect(result.extracted.make.value).toBe('')
    expect(result.extracted.make.isUncertain).toBe(true)
  })

  it('rejects empty, blurry or unreadable text', () => {
    expect(parseIndianRc('').isValid).toBe(false)
    expect(parseIndianRc('   ').isValid).toBe(false)
    expect(parseIndianRc(null).isValid).toBe(false)

    const randomGibberish = 'blurry noise ### @@@ 123 ???'
    const result = parseIndianRc(randomGibberish)
    expect(result.isValid).toBe(false)
  })
})

describe('RC File Validation & Security', () => {
  it('validates supported image formats and rejects PDF with helpful guidance', () => {
    const validJpg = { name: 'rc_front.jpg', type: 'image/jpeg', size: 1024 * 1024 }
    expect(validateRcFile(validJpg).valid).toBe(true)

    const validPng = { name: 'rc_scan.png', type: 'image/png', size: 2 * 1024 * 1024 }
    expect(validateRcFile(validPng).valid).toBe(true)

    const pdfFile = { name: 'rc_document.pdf', type: 'application/pdf', size: 1024 * 1024 }
    const pdfValidation = validateRcFile(pdfFile)
    expect(pdfValidation.valid).toBe(false)
    expect(pdfValidation.error).toContain('Direct PDF parsing is not supported')

    const oversizedFile = { name: 'huge_photo.jpg', type: 'image/jpeg', size: 15 * 1024 * 1024 }
    const sizeValidation = validateRcFile(oversizedFile)
    expect(sizeValidation.valid).toBe(false)
    expect(sizeValidation.error).toContain('File is too large')
  })
})

describe('Duplicate Registration Detection & User Fleet Conflict Handling', () => {
  const existingFleet = [
    { id: 'v1', name: 'City Sedan', license_plate: 'DL 01 AB 1234' },
    { id: 'v2', name: 'Family Nexon', license_plate: 'MH 12 DE 1432' },
    { id: 'v3', name: 'Work Pickup', license_plate: '22 BH 4567 AA' },
  ]

  it('detects duplicate registration regardless of casing, hyphens, or spacing differences', () => {
    // Exact match
    const check1 = checkDuplicateRegistrationNumber('DL 01 AB 1234', existingFleet)
    expect(check1.isDuplicate).toBe(true)
    expect(check1.duplicateVehicle.name).toBe('City Sedan')

    // Case and spacing variation
    const check2 = checkDuplicateRegistrationNumber('dl01ab1234', existingFleet)
    expect(check2.isDuplicate).toBe(true)

    // Hyphen variation
    const check3 = checkDuplicateRegistrationNumber('MH-12-DE-1432', existingFleet)
    expect(check3.isDuplicate).toBe(true)
    expect(check3.duplicateVehicle.id).toBe('v2')

    // BH series variation
    const check4 = checkDuplicateRegistrationNumber('22BH4567AA', existingFleet)
    expect(check4.isDuplicate).toBe(true)
  })

  it('permits non-duplicate plates and ignores vehicle itself during edit', () => {
    // Unique plate
    const checkUnique = checkDuplicateRegistrationNumber('KA 05 MJ 5012', existingFleet)
    expect(checkUnique.isDuplicate).toBe(false)
    expect(checkUnique.duplicateVehicle).toBeNull()

    // Editing same vehicle v1 allows retaining its own plate
    const checkEditSame = checkDuplicateRegistrationNumber('DL 01 AB 1234', existingFleet, 'v1')
    expect(checkEditSame.isDuplicate).toBe(false)

    // Empty or null plate
    expect(checkDuplicateRegistrationNumber('', existingFleet).isDuplicate).toBe(false)
    expect(checkDuplicateRegistrationNumber(null, existingFleet).isDuplicate).toBe(false)
  })
})

describe('Manual Correction & Uncertainty Workflow', () => {
  it('allows user to review and correct partially extracted or uncertain fields', () => {
    // Simulating an OCR output where make was recognized but model was uncertain/missing
    const partialOcr = `
      REG NO: KA 04 EA 9999
      MAKER: TOYOTA KIRLOSKAR
      FUEL: DIESEL
    `
    const parsed = parseIndianRc(partialOcr)
    expect(parsed.extracted.make.value).toBe('Toyota')
    expect(parsed.extracted.model.value).toBe('')
    expect(parsed.extracted.model.isUncertain).toBe(true)

    // Simulating user manual correction before submitting
    const userCorrected = {
      name: 'My Innova Crysta',
      type: parsed.extracted.type.value,
      make: parsed.extracted.make.value,
      model: 'Innova Crysta 2.4 ZX', // User manually supplied missing model
      year: 2021, // User manually supplied missing year
      license_plate: parsed.extracted.registration_number.value,
      fuel_type: parsed.extracted.fuel_type.value,
      vin: 'MBJ11234567890123', // User manually checked physical RC and entered VIN
      current_odometer: 15400,
    }

    expect(userCorrected.make).toBe('Toyota')
    expect(userCorrected.model).toBe('Innova Crysta 2.4 ZX')
    expect(userCorrected.license_plate).toBe('KA 04 EA 9999')
    expect(userCorrected.year).toBe(2021)
  })
})


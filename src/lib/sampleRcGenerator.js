/**
 * AutoCare — Sample Indian RC Image Generator
 *
 * Generates an authentic canvas-rendered smart card RC image
 * for rapid testing and demonstration of the OCR flow without
 * requiring the user to photograph a real document.
 */

export function generateSampleRcBlob() {
  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  canvas.width = 1000
  canvas.height = 630
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Card background - light gradient with subtle security tint
  const bgGrad = ctx.createLinearGradient(0, 0, 1000, 630)
  bgGrad.addColorStop(0, '#F1F5F9')
  bgGrad.addColorStop(0.5, '#E2E8F0')
  bgGrad.addColorStop(1, '#CBD5E1')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, 1000, 630)

  // Card outer border
  ctx.lineWidth = 4
  ctx.strokeStyle = '#94A3B8'
  ctx.strokeRect(10, 10, 980, 610)

  // Header band
  ctx.fillStyle = '#17365D'
  ctx.fillRect(10, 10, 980, 70)

  // Gold emblem placeholder circle
  ctx.fillStyle = '#F59E0B'
  ctx.beginPath()
  ctx.arc(60, 45, 24, 0, Math.PI * 2)
  ctx.fill()

  // Header text
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 22px sans-serif'
  ctx.fillText('TRANSPORT DEPARTMENT - GOVERNMENT OF MAHARASHTRA', 105, 38)
  ctx.font = '14px sans-serif'
  ctx.fillStyle = '#93C5FD'
  ctx.fillText('CERTIFICATE OF REGISTRATION (FORM 23 / SMART CARD)', 105, 62)

  // Chip placeholder (golden contact chip on Indian smart cards)
  ctx.fillStyle = '#FBBF24'
  ctx.fillRect(50, 120, 90, 75)
  ctx.strokeStyle = '#D97706'
  ctx.lineWidth = 2
  ctx.strokeRect(50, 120, 90, 75)
  ctx.fillStyle = '#B45309'
  ctx.font = 'bold 11px sans-serif'
  ctx.fillText('SECURITY CHIP', 55, 162)

  // Registration Plate Display Box
  ctx.fillStyle = '#FEF08A'
  ctx.fillRect(680, 105, 290, 55)
  ctx.strokeStyle = '#0F172A'
  ctx.lineWidth = 3
  ctx.strokeRect(680, 105, 290, 55)

  // "IND" blue band
  ctx.fillStyle = '#1D4ED8'
  ctx.fillRect(680, 105, 35, 55)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('IND', 685, 137)

  // Plate text
  ctx.fillStyle = '#0F172A'
  ctx.font = 'bold 30px monospace'
  ctx.fillText('MH 12 DE 1432', 728, 144)

  // Smart Card Fields
  ctx.fillStyle = '#0F172A'
  ctx.font = 'bold 15px sans-serif'

  const fields = [
    { label: 'REGN. NO:', val: 'MH 12 DE 1432', x: 180, y: 135 },
    { label: 'REGN. DT:', val: '14/08/2021', x: 440, y: 135 },
    { label: 'CHASSIS NO:', val: 'MA3FBEB1S00123456', x: 180, y: 175 },
    { label: 'ENGINE NO:', val: 'K12MN1234567', x: 180, y: 215 },
    { label: 'NAME:', val: 'RAJESH KUMAR SHARMA', x: 50, y: 265 },
    { label: 'S/W/D OF:', val: 'RAMESH SHARMA', x: 50, y: 300 },
    { label: 'MAKER:', val: 'MARUTI SUZUKI INDIA LTD', x: 50, y: 340 },
    { label: 'MODEL:', val: 'SWIFT VXI', x: 50, y: 380 },
    { label: 'VEH. CLASS:', val: 'LMV (MOTOR CAR)', x: 50, y: 420 },
    { label: 'FUEL:', val: 'PETROL', x: 50, y: 460 },
    { label: 'MFG. YR:', val: '2021', x: 320, y: 460 },
    { label: 'SEATING CAP:', val: '5', x: 520, y: 460 },
    { label: 'REGISTERING AUTHORITY:', val: 'RTO PUNE (MH-12)', x: 50, y: 510 },
    { label: 'VALIDITY / FITNESS UPTO:', val: '13/08/2036', x: 50, y: 550 },
  ]

  for (const f of fields) {
    ctx.fillStyle = '#475569'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText(f.label, f.x, f.y)

    const labelWidth = ctx.measureText(f.label).width
    ctx.fillStyle = '#0F172A'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText(f.val, f.x + labelWidth + 8, f.y)
  }

  // Watermark
  ctx.save()
  ctx.rotate(-0.15)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.04)'
  ctx.font = 'bold 80px sans-serif'
  ctx.fillText('GOVT OF INDIA', 200, 380)
  ctx.restore()

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'sample_indian_rc_smart_card.jpg', { type: 'image/jpeg' })
          resolve(file)
        } else {
          resolve(null)
        }
      },
      'image/jpeg',
      0.95
    )
  })
}

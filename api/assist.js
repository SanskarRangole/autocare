import { handleAssistRequest } from '../server/assistService.js'

/**
 * Vercel Serverless Function: /api/assist
 * Secure server-side execution for AutoCare Assist on Vercel.
 */
export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const apiKey = process.env.GEMINI_API_KEY

    const result = await handleAssistRequest({
      ...payload,
      apiKey,
    })

    return res.status(200).json(result)
  } catch (err) {
    console.error('[Vercel API Assist Error]', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

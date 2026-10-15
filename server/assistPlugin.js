import { loadEnv } from 'vite'
import { handleAssistRequest } from './assistService.js'

/**
 * Vite plugin that mounts a secure server-side endpoint at /api/assist.
 * The Gemini API key remains exclusively on the Node server environment.
 */
export function assistVitePlugin() {
  return {
    name: 'autocare-assist-api',
    configureServer(server) {
      server.middlewares.use('/api/assist', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}')
            const env = loadEnv('development', process.cwd(), '')
            const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

            const result = await handleAssistRequest({
              ...payload,
              apiKey,
            })

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err) {
            console.error('[API Assist Server Error]', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }))
          }
        })
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/assist', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}')
            const env = loadEnv('production', process.cwd(), '')
            const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

            const result = await handleAssistRequest({
              ...payload,
              apiKey,
            })

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err) {
            console.error('[API Assist Preview Error]', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }))
          }
        })
      })
    },
  }
}

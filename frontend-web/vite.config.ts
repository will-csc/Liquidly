import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import type { IncomingMessage } from 'http'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const readJsonBody = async (req: IncomingMessage): Promise<Record<string, unknown> | null> => {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  if (chunks.length === 0) return null

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

const browserLogMirrorPlugin = () => ({
  name: 'browser-log-mirror',
  configureServer(server: { middlewares: { use: (path: string, handler: (req: IncomingMessage, res: { statusCode: number; end: (body?: string) => void }) => void | Promise<void>) => void } }) {
    server.middlewares.use('/__client-log', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end('Method Not Allowed')
        return
      }

      const body = await readJsonBody(req)
      const level = typeof body?.consoleMethod === 'string' ? body.consoleMethod.toUpperCase() : 'LOG'
      const label = typeof body?.label === 'string' ? body.label : '[Browser Event]'
      const timestamp = typeof body?.timestamp === 'string' ? body.timestamp : new Date().toISOString()
      const payload = body?.payload ?? null

      console.log(`[Frontend Browser ${level}] ${timestamp} ${label}`, payload)

      res.statusCode = 204
      res.end()
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), browserLogMirrorPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

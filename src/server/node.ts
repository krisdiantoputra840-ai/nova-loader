import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import app from './index'

// Serve built client assets in production
app.use('/*', serveStatic({ root: './dist/client' }))

const port = Number(process.env.PORT) || 3000

console.log(`Server is running at http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})

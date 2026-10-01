import { Hono } from 'hono'

const app = new Hono()

const routes = app.basePath('/api').get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export type AppType = typeof routes
export default app

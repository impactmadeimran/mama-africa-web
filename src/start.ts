import { createMiddleware, createStart } from '@tanstack/react-start'

const DEFAULT_API_TARGET = 'https://mama-africa-api.fly.dev'

function getApiTarget(): string {
  return process.env.VITE_API_PROXY_TARGET ?? DEFAULT_API_TARGET
}

const apiProxyMiddleware = createMiddleware().server(
  async ({ request, pathname, next }) => {
    if (!pathname.startsWith('/api')) {
      return next()
    }

    const backendPath = pathname.replace(/^\/api/, '') || '/'
    const targetUrl = new URL(backendPath, `${getApiTarget().replace(/\/$/, '')}/`)
    targetUrl.search = new URL(request.url).search

    const headers = new Headers(request.headers)
    headers.delete('host')
    headers.delete('connection')

    const init: RequestInit & { duplex?: 'half' } = {
      method: request.method,
      headers,
      redirect: 'manual',
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body
      init.duplex = 'half'
    }

    return fetch(targetUrl, init)
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [apiProxyMiddleware],
}))

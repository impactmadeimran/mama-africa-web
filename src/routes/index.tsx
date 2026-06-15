import { createFileRoute, redirect } from '@tanstack/react-router'
import { authApi } from '#/lib/api'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    try {
      await authApi.me()
      throw redirect({ to: '/dashboard' })
    } catch (e) {
      if (e && typeof e === 'object' && 'to' in e) throw e
      throw redirect({ to: '/login' })
    }
  },
})

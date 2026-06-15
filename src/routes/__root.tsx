import { HeadContent, Scripts, createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { authApi } from '../lib/api'
import type { User } from '../lib/types'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      },
      { title: 'Mama Africa Analytics' },
    ],
  }),
  component: RootLayout,
})

function RootLayout() {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    authApi
      .me()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
  }, [])

  async function logout() {
    await authApi.logout().catch(() => undefined)
    setUser(null)
    navigate({ to: '/login' })
  }

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppHeader user={user} onLogout={logout} />
        <Outlet />
        <BottomNav />
        <Scripts />
      </body>
    </html>
  )
}

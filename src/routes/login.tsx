import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Field } from '#/components/Field'
import { authApi } from '#/lib/api'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await authApi.login(id.trim().toUpperCase(), pin)
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <main className="page">
      <div className="card">
        <div className="card-label">Welcome back</div>
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold">
          Sign in
        </h1>
        {error && <div className="flash-error">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Your Participant ID" hint="Example: P-001. You need this every time you sign in.">
            <input
              className="input"
              placeholder="P-001"
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Your 4-number PIN">
            <input
              className="input"
              placeholder="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          <button type="submit" className="btn-primary">
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-xs leading-relaxed text-[var(--warm-gray)]">
          Forgot your ID or PIN? Contact <strong>PAL</strong> directly to recover it.
        </p>
        <p className="mt-4 text-center text-sm text-[var(--warm-gray)]">
          New vendor?{' '}
          <Link to="/register" className="font-semibold text-[var(--green-deep)]">
            Register
          </Link>
        </p>
      </div>
    </main>
  )
}

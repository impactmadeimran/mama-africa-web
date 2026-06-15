import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Field } from '#/components/Field'
import { authApi } from '#/lib/api'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [vendorType, setVendorType] = useState<'retail' | 'food' | 'format_b'>('retail')
  const [restockFrequency, setRestockFrequency] = useState('week')
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ id: string; pin: string } | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await authApi.register({
        name,
        pin,
        vendorType,
        restockFrequency,
      })
      setCreated({ id: res.user.id, pin: res.pin })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  if (created) {
    return (
      <main className="page">
        <div className="pid-display">
          <div className="text-[0.68rem] font-bold uppercase tracking-wide opacity-65">
            Your Participant ID — write this down
          </div>
          <div className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-wide">
            {created.id}
          </div>
          <p className="mt-2 text-sm opacity-65">
            You will need this ID every time you sign in.
            <br />
            Keep it somewhere safe. Your PIN is <strong>{created.pin}</strong>.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => navigate({ to: '/upload', search: { weekStart: undefined } })}>
          <span aria-hidden>📸</span>
          <span>Upload your first week</span>
        </button>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="text-center" style={{ padding: '24px 0 18px' }}>
        <div className="text-5xl">🌱</div>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--green-deep)]">
          Welcome!
        </h1>
        <p className="mt-2 text-sm text-[var(--warm-gray)]">
          Set up your account in 2 minutes.
          <br />
          Your records will be kept safe.
        </p>
      </div>

      <div className="card bg-[var(--green-pale)]" style={{ borderColor: 'var(--green-light)' }}>
        <div className="card-label text-[var(--green-deep)]">How this works</div>
        <div className="onboard-step">
          <div className="onboard-num">1</div>
          <div className="text-2xl">📸</div>
          <div className="text-sm leading-snug">
            <strong className="block">Take a photo of your record book</strong>
            Once a week, photograph your sales and costs pages.
          </div>
        </div>
        <div className="onboard-step">
          <div className="onboard-num">2</div>
          <div className="text-2xl">⏳</div>
          <div className="text-sm leading-snug">
            <strong className="block">We read it for you</strong>
            Our system reads the numbers from your photo. Takes about 2 minutes.
          </div>
        </div>
        <div className="onboard-step">
          <div className="onboard-num">3</div>
          <div className="text-2xl">📊</div>
          <div className="text-sm leading-snug">
            <strong className="block">See your results</strong>
            Find out how much money you made, what is working, and what to do next.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-label">New vendor</div>
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold">
          Register
        </h1>
        {error && <div className="flash-error">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Your first name (optional)" hint="Example: Akosua">
            <input
              className="input"
              placeholder="e.g. Akosua"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
            />
          </Field>
          <Field label="Choose a 4-number PIN" hint="Pick four numbers you will remember.">
            <input
              className="input"
              placeholder="e.g. 1234"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              type="password"
              autoComplete="new-password"
              required
            />
          </Field>
          <Field
            label="What do you sell?"
            hint="Packaged goods, cooked food, or bulk/water (Format B)."
          >
            <select
              className="input"
              value={vendorType}
              onChange={(e) => setVendorType(e.target.value as typeof vendorType)}
            >
              <option value="retail">Packaged or pre-made goods (retail)</option>
              <option value="food">Cooked food (rice, stew, banku, etc.)</option>
              <option value="format_b">Bulk / water (Format B)</option>
            </select>
          </Field>
          <Field
            label="How often do you buy supplies?"
            hint="This helps us split your costs correctly across weeks."
          >
            <select
              className="input"
              value={restockFrequency}
              onChange={(e) => setRestockFrequency(e.target.value)}
            >
              <option value="daily">Every day</option>
              <option value="few_days">Every 2–3 days</option>
              <option value="week">Every week</option>
              <option value="2_weeks">Every 2 weeks</option>
              <option value="month">Once a month</option>
            </select>
          </Field>
          <button type="submit" className="btn-primary">
            Create account
          </button>
        </form>
        <p className="mt-4 rounded-[12px] bg-[var(--green-pale)] p-3 text-xs leading-relaxed text-[var(--green-deep)]">
          <strong>After you register, write down your ID.</strong> You will get an ID like P-007.
          You need it to sign in every time.
        </p>
        <p className="mt-4 text-center text-sm text-[var(--warm-gray)]">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-[var(--green-deep)]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

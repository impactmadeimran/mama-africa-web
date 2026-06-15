import type { ReactNode } from 'react'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label className="mb-1.5 block text-sm font-semibold text-[var(--text)]">{label}</label>
      {hint && <p className="mb-1.5 text-xs leading-relaxed text-[var(--warm-gray)]">{hint}</p>}
      {children}
    </div>
  )
}

export function InlineFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 block text-[0.72rem] font-semibold uppercase tracking-wide text-[var(--warm-gray)]">
      {children}
    </span>
  )
}

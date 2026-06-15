import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { askApi } from '#/lib/api'

const BUSINESS_QUESTIONS = [
  'Which product makes me the most money?',
  'Should I stock more of my top seller?',
  'Why did my sales drop last week?',
  'What is my best day of the week?',
  'Am I making enough to cover my costs?',
]

const LEARN_QUESTIONS = [
  'What is the difference between money made and money kept?',
  'Why is it bad to depend on just one product?',
  'What does break-even mean?',
  'How do I know if my business is growing?',
  'What is a good profit margin?',
]

export const Route = createFileRoute('/ask')({
  component: AskPage,
})

function AskPage() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<{ q: string; a: string }[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(sessionStorage.getItem('qa_history') || '[]')
    } catch {
      return []
    }
  })

  async function sendQuestion(q = question) {
    const trimmed = q.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    setAnswer('')
    try {
      const res = await askApi.ask(trimmed)
      setAnswer(res.answer)
      const next = [...history, { q: trimmed, a: res.answer }]
      setHistory(next)
      sessionStorage.setItem('qa_history', JSON.stringify(next))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && document.activeElement?.id === 'qa-input') {
        e.preventDefault()
        void sendQuestion()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <main className="page">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--green-deep)]">
        Ask Your Advisor
      </h1>
      <p className="mb-4 text-sm text-[var(--warm-gray)]">
        Ask about your money, your products, or anything about running a business. Your advisor
        uses your real sales data to answer.
      </p>

      <div className="card">
        <div className="qa-input-box">
          <textarea
            id="qa-input"
            className="qa-input"
            placeholder="Type your question here..."
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button type="button" className="qa-send" onClick={() => void sendQuestion()}>
            <span>Ask</span>
            <span aria-hidden>→</span>
          </button>
          <div className="clear-both" />
        </div>
        {loading && <p className="text-sm text-[var(--warm-gray)]">⏳ Getting your answer...</p>}
        {error && <div className="flash-error">{error}</div>}
        {answer && <div className="qa-answer mt-3">{answer}</div>}
      </div>

      <div className="section-head">About your business</div>
      <div className="card">
        {BUSINESS_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            className="block w-full border-b border-[var(--border)] py-3 text-left text-sm font-semibold text-[var(--green-deep)] last:border-0"
            onClick={() => {
              setQuestion(q)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="section-head">Learn about business</div>
      <div className="card">
        {LEARN_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            className="block w-full border-b border-[var(--border)] py-3 text-left text-sm last:border-0"
            onClick={() => {
              setQuestion(q)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <>
          <div className="section-head">Earlier questions</div>
          {[...history].reverse().map((item, i) => (
            <div key={i} className="card opacity-85">
              <div className="card-label">Your question</div>
              <div className="mb-2 text-sm font-semibold">{item.q}</div>
              <div className="qa-answer">{item.a}</div>
            </div>
          ))}
        </>
      )}
    </main>
  )
}

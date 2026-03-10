import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Send, Sparkles, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: number
}

type AiReportResponse = { report: string }

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function AiChatModal(props: {
  open: boolean
  onClose: () => void

  contextMode: 'group' | 'student'
  groupId?: string
  studentId?: string
  contextTitle: string
}) {
  const { open, onClose, contextMode, groupId, studentId, contextTitle } = props

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement | null>(null)

  const template = useMemo(() => {
    // маппинг: можно расширять
    return contextMode === 'group' ? 'weekly_group_attendance' : 'student_behavior_patterns'
  }, [contextMode])

  useEffect(() => {
    if (!open) return
    // приветственное сообщение 1 раз при открытии (если чат пуст)
    setMessages((prev) => {
      if (prev.length) return prev
      return [
        {
          id: uid(),
          role: 'assistant',
          createdAt: Date.now(),
          content:
            `Я могу ответить на вопросы по контексту: ${contextTitle}.\n` +
            `Примеры:\n` +
            `• "Какие паттерны прогулов заметны?"\n` +
            `• "Кто в зоне риска и почему?"\n` +
            `• "Что изменилось за последние недели?"`,
        },
      ]
    })
  }, [open, contextTitle])

  useEffect(() => {
    // автоскролл вниз
    if (!open) return
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setError(null)
    setLoading(true)
    setInput('')

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, createdAt: Date.now() }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          group_id: contextMode === 'group' ? groupId : undefined,
          student_id: contextMode === 'student' ? studentId : undefined,
          question: text,
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => null)
        const msg = (j && (j.detail || j.error)) ? (j.detail || j.error) : `Ошибка API (${res.status})`
        throw new Error(msg)
      }

      const data = (await res.json()) as AiReportResponse

      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: data.report || 'Пустой ответ',
        createdAt: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />

      {/* modal */}
      <div className="absolute right-4 top-4 bottom-4 w-[min(720px,calc(100%-2rem))] bg-app-bg border border-app-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-app-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-app-surface border border-app-border">
              <Sparkles size={18} className="text-primary-700" />
            </div>
            <div>
              <div className="text-app-text font-semibold">ИИ-чат по аналитике</div>
              <div className="text-app-muted text-sm">{contextTitle}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-app-surface text-app-muted/90"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 border-b border-app-border text-red-700 bg-red-100">
            {error}
          </div>
        )}

        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={[
                  'max-w-[90%] rounded-2xl px-4 py-3 border',
                  m.role === 'user'
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-app-surface text-app-text border-app-border',
                ].join(' ')}
              >
                <div className="prose max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-2xl px-4 py-3 border bg-app-surface border-app-border text-app-text flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Думаю…</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-app-border">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              className="flex-1 bg-app-surface border border-app-border rounded-xl p-3 text-app-text placeholder:text-app-muted/80 focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none"
              placeholder="Задайте вопрос… (Enter — отправить, Shift+Enter — новая строка)"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || input.trim().length === 0}
              className="px-4 py-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={18} />
              <span className="hidden sm:inline">Отправить</span>
            </button>
          </div>

          <div className="text-app-muted/80 text-xs mt-2">
            Контекст запроса: <span className="text-app-muted/90">{template}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Bot,
  FileDown,
  Plus,
  RotateCcw,
  Send,
  Star,
  StarOff,
  Trash2,
  User,
  Sparkles,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { useAppData } from '../context/AppDataContext'

type Role = 'user' | 'assistant'
type MsgMeta = {
  autoAnalysis?: boolean
  autoPayload?: {
    template: string
    mergedQuestion: string
    contextSnapshot: any
  }
  savedToReports?: boolean
}
type ChatMsg = { id: string; role: Role; text: string; createdAt: string; meta?: MsgMeta }
type Thread = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  pinned?: boolean
  messages: ChatMsg[]
}

const STORAGE_KEY = 'analytics-chat-threads-v2'

const WELCOME: ChatMsg = {
  id: 'welcome',
  role: 'assistant',
  text: 'Здравствуйте, я чат-аналитик. Чем могу помочь?',
  createdAt: new Date().toISOString(),
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function ruLongDate(d: Date) {
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ]
  return `${pad2(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} года`
}

function capFirst(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

function groupLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sd = startOfDay(d).getTime()
  const today = startOfDay(now).getTime()
  const yesterday = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)).getTime()

  if (sd === today) return 'Сегодня'
  if (sd === yesterday) return 'Вчера'

  const diffDays = Math.floor((today - sd) / 86400000)
  if (diffDays >= 2 && diffDays <= 6) {
    return capFirst(d.toLocaleDateString('ru-RU', { weekday: 'long' }))
  }
  return ruLongDate(d)
}

export default function Analytics() {
  const { dashboardFilters, contingentData } = useAppData()
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string>('')

  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // --- persistence
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Thread[]
        if (Array.isArray(parsed) && parsed.length) {
          setThreads(parsed)
          setActiveThreadId(parsed[0]?.id || '')
          return
        }
      } catch {}
    }

    // migrate from v1 if exists
    const rawV1 = localStorage.getItem('analytics-chat-threads-v1')
    if (rawV1) {
      try {
        const parsed = JSON.parse(rawV1) as any[]
        if (Array.isArray(parsed) && parsed.length) {
          const migrated: Thread[] = parsed.map((t) => ({
            id: t.id,
            title: t.title || 'Чат',
            createdAt: t.createdAt || new Date().toISOString(),
            updatedAt: t.updatedAt || t.createdAt || new Date().toISOString(),
            pinned: false,
            messages: Array.isArray(t.messages) && t.messages.length ? t.messages : [WELCOME],
          }))
          setThreads(migrated)
          setActiveThreadId(migrated[0]?.id || '')
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
          return
        }
      } catch {}
    }

    const first: Thread = {
      id: `t-${Date.now()}`,
      title: 'Новый чат',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      messages: [WELCOME],
    }
    setThreads([first])
    setActiveThreadId(first.id)
  }, [])

  useEffect(() => {
    if (threads.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(threads))
  }, [threads])

  const activeThread = useMemo(() => threads.find((t) => t.id === activeThreadId) || null, [threads, activeThreadId])
  const messages = activeThread?.messages?.length ? activeThread.messages : [WELCOME]

  const contingentSummary = useMemo(() => {
    const totalStudents = contingentData.reduce((s, x: any) => s + (x?.totals?.total ?? 0), 0)
    const totalGroups = contingentData.reduce((s, x: any) => s + (x?.groups?.length ?? 0), 0)
    const top = [...contingentData]
      .sort((a: any, b: any) => (b?.totals?.total ?? 0) - (a?.totals?.total ?? 0))
      .slice(0, 5)
      .map((x: any) => `${x.code}: ${x.totals.total}`)
    return { specialties: contingentData.length, totalStudents, totalGroups, top }
  }, [contingentData])

  const buildContextObject = () => {
    const ctx: Record<string, unknown> = {
      charts: {
        dateRangeDays: dashboardFilters.dateRange,
        selectedSubject: dashboardFilters.selectedSubject,
        selectedGroup: dashboardFilters.selectedGroup,
      },
      contingent: contingentData.length
        ? {
            specialties: contingentSummary.specialties,
            totalGroups: contingentSummary.totalGroups,
            totalStudents: contingentSummary.totalStudents,
            topSpecialties: contingentSummary.top,
          }
        : { status: 'not_loaded' },
    }

    return ctx
  }

  const updateThread = (threadId: string, updater: (t: Thread) => Thread) => {
    setThreads((prev) => prev.map((t) => (t.id === threadId ? updater(t) : t)))
  }

  const updateActiveThread = (updater: (t: Thread) => Thread) => {
    if (!activeThreadId) return
    updateThread(activeThreadId, updater)
  }

  const appendMessage = (msg: ChatMsg) => {
    updateActiveThread((t) => ({
      ...t,
      updatedAt: new Date().toISOString(),
      messages: [...(t.messages?.length ? t.messages : [WELCOME]), msg],
    }))
  }

  const createThread = () => {
    const t: Thread = {
      id: `t-${Date.now()}`,
      title: 'Новый чат',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      messages: [WELCOME],
    }
    setThreads((prev) => [t, ...prev])
    setActiveThreadId(t.id)
  }

  const togglePinned = (threadId: string) => {
    updateThread(threadId, (t) => ({ ...t, pinned: !t.pinned, updatedAt: t.updatedAt }))
  }

  const deleteThread = (threadId: string) => {
    const t = threads.find((x) => x.id === threadId)
    const ok = confirm(`Удалить чат?\n\n${t?.title || ''}`)
    if (!ok) return

    setThreads((prev) => prev.filter((x) => x.id !== threadId))

    if (activeThreadId === threadId) {
      const rest = threads.filter((x) => x.id !== threadId).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      setActiveThreadId(rest[0]?.id || '')
    }
  }


  const startRename = (threadId: string, currentTitle: string) => {
    setEditingThreadId(threadId)
    setEditingTitle(currentTitle)
  }

  const submitRename = () => {
    if (!editingThreadId) return
    const next = editingTitle.trim() || 'Чат'
    updateThread(editingThreadId, (t) => ({ ...t, title: next }))
    setEditingThreadId(null)
    setEditingTitle('')
  }

  const cancelRename = () => {
    setEditingThreadId(null)
    setEditingTitle('')
  }

  const callAutoReport = async (payload: { template: string; mergedQuestion: string; contextSnapshot: any }, opts?: { addUserMarker?: boolean }) => {
    if (loading) return
    setLoading(true)

    if (opts?.addUserMarker !== false) {
      appendMessage({
        id: `u-${Date.now()}`,
        role: 'user',
        text: 'Краткий авто-анализ',
        createdAt: new Date().toISOString(),
      })
    }

    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: payload.template, question: payload.mergedQuestion }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || `Ошибка API (${res.status})`)

      appendMessage({
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.report || 'Пустой ответ от ИИ.',
        createdAt: new Date().toISOString(),
        meta: {
          autoAnalysis: true,
          autoPayload: payload,
          savedToReports: false,
        },
      })

      if (activeThread && activeThread.title === 'Новый чат') {
        updateActiveThread((t) => ({ ...t, title: 'Авто-анализ' }))
      }
    } catch (e) {
      appendMessage({
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: `Ошибка: ${e instanceof Error ? e.message : 'неизвестная ошибка'}`,
        createdAt: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const autoShortAnalysis = async () => {
    const autoPrompt =
      'Сформируй короткий аналитический отчёт по текущему контексту. Выдели ключевые наблюдения, риски и 3 практические рекомендации.'

    const contextSnapshot = buildContextObject()
    const contextText = JSON.stringify(contextSnapshot, null, 2)
    const mergedQuestion = `Контекст:\n${contextText}\n\nЗадача:\n${autoPrompt}`

    await callAutoReport({ template: 'department_intake', mergedQuestion, contextSnapshot })
  }

  const regenerateAuto = async (payload: NonNullable<MsgMeta['autoPayload']>) => {
    // Регенерация: повторяем тот же запрос (без “переопределения” контекста)
    await callAutoReport(payload, { addUserMarker: true })
  }

  const saveAsReport = async (msgId: string, msgText: string) => {
    if (!activeThread) return
    try {
      const titleBase = activeThread.title && activeThread.title !== 'Новый чат' ? activeThread.title : 'Авто-анализ'
      const title = `Отчёт: ${titleBase}`.slice(0, 80)

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          template: 'department_intake',
          context_mode: 'group',
          context_id: dashboardFilters.selectedGroup || 'all',
          question: 'Краткий авто-анализ',
          content_md: msgText,
          pinned: false,
          tags: ['chat', 'auto'],
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.detail || `Ошибка сохранения (${res.status})`)

      // пометить сообщение как сохранённое
      updateActiveThread((t) => ({
        ...t,
        messages: t.messages.map((m) => (m.id === msgId ? { ...m, meta: { ...(m.meta || {}), savedToReports: true } } : m)),
      }))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка сохранения')
    }
  }

  const sendManual = async () => {
    if (!question.trim() || loading) return
    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: question.trim(),
      createdAt: new Date().toISOString(),
    }
    appendMessage(userMsg)
    setQuestion('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg.text, context: buildContextObject() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || `Ошибка API (${res.status})`)
      appendMessage({
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.report || 'Пустой ответ от ИИ.',
        createdAt: new Date().toISOString(),
      })

      if (activeThread && activeThread.title === 'Новый чат') {
        updateActiveThread((t) => ({ ...t, title: userMsg.text.slice(0, 32) || 'Чат' }))
      }
    } catch (e) {
      appendMessage({
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: `Ошибка: ${e instanceof Error ? e.message : 'неизвестная ошибка'}`,
        createdAt: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  // --- history panel view model
  const threadsSorted = useMemo(() => {
    return [...threads].sort((a, b) => {
      // pinned first
      const ap = a.pinned ? 1 : 0
      const bp = b.pinned ? 1 : 0
      if (ap !== bp) return bp - ap
      return +new Date(b.updatedAt) - +new Date(a.updatedAt)
    })
  }, [threads])

  const groupedThreads = useMemo(() => {
    const groups = new Map<string, Thread[]>()
    for (const t of threadsSorted) {
      const label = t.pinned ? 'Избранное' : groupLabel(t.updatedAt)
      const arr = groups.get(label) || []
      arr.push(t)
      groups.set(label, arr)
    }
    return Array.from(groups.entries())
  }, [threadsSorted])

  return (
    <div className="h-full min-h-0 flex gap-4">
      {/* Left: history */}
      <aside className="w-72 shrink-0 bg-app-surface border border-app-border rounded-xl overflow-hidden flex flex-col min-h-0">
        <div className="p-3 border-b border-app-border flex items-center justify-between gap-2">
          <div className="text-app-text font-semibold">История</div>
          <button
            onClick={createThread}
            className="px-2.5 py-2 rounded-lg bg-app-surface-strong hover:bg-app-surface-hover text-app-text flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> Новый
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {groupedThreads.map(([label, items]) => (
            <div key={label}>
              <div className="px-2 text-xs text-app-muted mb-1">{label}</div>
              <div className="space-y-1">
                {items.map((t) => {
                  const isActive = t.id === activeThreadId
                  const lastMsg = [...(t.messages || [])].reverse().find((m) => m.role === 'user')
                  return (
                    <div
                      key={t.id}
                      className={`group rounded-lg border ${isActive ? 'border-primary-600 bg-app-bg' : 'border-app-border bg-app-bg/40 hover:bg-app-bg'} p-2`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          {editingThreadId === t.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                autoFocus
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') submitRename()
                                  if (e.key === 'Escape') cancelRename()
                                }}
                                onBlur={submitRename}
                                className="w-full bg-app-surface border border-app-border-strong rounded px-2 py-1 text-sm text-app-text"
                              />
                              <button onMouseDown={(e) => e.preventDefault()} onClick={submitRename} className="p-1 rounded hover:bg-app-surface-strong text-app-muted/90" title="Сохранить название">
                                <Check size={14} />
                              </button>
                              <button onMouseDown={(e) => e.preventDefault()} onClick={cancelRename} className="p-1 rounded hover:bg-app-surface-strong text-app-muted/90" title="Отмена">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActiveThreadId(t.id)}
                              className="w-full text-left"
                              title={t.title}
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <div className="text-sm text-app-text truncate">{t.title}</div>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startRename(t.id, t.title)
                                  }}
                                  className="shrink-0 p-1 rounded hover:bg-app-surface-strong text-app-muted"
                                  title="Переименовать"
                                >
                                  <Pencil size={12} />
                                </span>
                              </div>
                              <div className="text-xs text-app-muted/80 truncate">
                                {lastMsg?.text || '—'}
                              </div>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1 pt-0.5">
                          <button
                            onClick={() => togglePinned(t.id)}
                            className="p-1 rounded-md hover:bg-app-surface-strong text-app-muted/90"
                            title={t.pinned ? 'Убрать из избранного' : 'В избранное'}
                          >
                            {t.pinned ? <Star size={14} /> : <StarOff size={14} />}
                          </button>
                          <button
                            onClick={() => deleteThread(t.id)}
                            className="p-1 rounded-md hover:bg-app-surface-strong text-app-muted/90"
                            title="Удалить чат"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Right: chat */}
      <section className="flex-1 min-w-0 min-h-0 bg-app-surface border border-app-border rounded-xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-app-border flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-app-text font-bold truncate">Чат-аналитика</div>
            <div className="text-xs text-app-muted truncate">
              Период: {dashboardFilters.dateRange} дн. • Предмет: {dashboardFilters.selectedSubject} • Группа: {dashboardFilters.selectedGroup} • Контингент: {contingentData.length ? `${contingentSummary.totalStudents} студ.` : 'не загружен'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && <Bot size={16} className="mt-1 shrink-0" />}

              <div className="max-w-[86%]">
                <div
                  className={`rounded-xl p-3 text-sm ${
                    m.role === 'user' ? 'bg-primary-700 text-white' : 'bg-app-bg border border-app-border text-app-text'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <div className="prose max-w-none prose-p:my-1 prose-headings:mt-0 [&>*:first-child]:mt-0 [&_h1]:mb-1 [&_h2]:mb-1 [&_h3]:mb-1 [&_h4]:mb-1 [&_h5]:mb-1 [&_h6]:mb-1">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  ) : (
                    m.text
                  )}
                </div>

                {/* actions under auto-analysis message */}
                {m.role === 'assistant' && m.meta?.autoAnalysis && m.meta.autoPayload && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => regenerateAuto(m.meta!.autoPayload!)}
                      disabled={loading}
                      className="h-8 px-2.5 rounded-full border border-app-border-strong bg-app-surface hover:bg-app-surface-strong disabled:opacity-50 text-xs text-app-text inline-flex items-center gap-1.5"
                      title="Сгенерировать повторно"
                    >
                      <RotateCcw size={14} /> Повторить
                    </button>
                    <button
                      onClick={() => saveAsReport(m.id, m.text)}
                      disabled={loading || m.meta?.savedToReports}
                      className="h-8 px-2.5 rounded-full border border-app-border-strong bg-app-surface hover:bg-app-surface-strong disabled:opacity-50 text-xs text-app-text inline-flex items-center gap-1.5"
                      title="Сохранить как отчёт"
                    >
                      <FileDown size={14} /> {m.meta?.savedToReports ? 'Сохранено' : 'Сохранить'}
                    </button>
                  </div>
                )}
              </div>

              {m.role === 'user' && <User size={16} className="mt-1 shrink-0" />}
            </div>
          ))}
        </div>

        <div className="border-t border-app-border p-3">
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendManual()
                }
              }}
              placeholder="Сообщение…"
              className="flex-1 bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm text-app-text placeholder:text-app-muted/80 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
            <button
              onClick={autoShortAnalysis}
              disabled={loading}
              className="px-3 py-2 bg-emerald-600 rounded-lg disabled:opacity-50 flex items-center gap-2 text-sm text-app-text"
            >
              <Sparkles size={14} /> Краткий авто-анализ
            </button>
            <button
              onClick={sendManual}
              disabled={loading || !question.trim()}
              className="px-4 py-2 bg-primary-700 rounded-lg disabled:opacity-50 flex items-center gap-2 text-sm text-app-text"
            >
              <Send size={14} /> {loading ? '...' : 'Отправить'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

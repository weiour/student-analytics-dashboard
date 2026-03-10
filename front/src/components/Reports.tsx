import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Search, Star, StarOff, Trash2, Pencil } from 'lucide-react'

type Report = {
  id: string
  created_at: string
  title: string
  template: string
  context_mode: 'group' | 'student'
  context_id: string
  question?: string | null
  content_md: string
  pinned: boolean
  tags: string[]
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])

  return debounced
}

function fmtDate(iso: string) {
  const normalized = /Z|[+\-]\d{2}:\d{2}$/.test(iso)
    ? iso
    : iso + 'Z'

  return new Date(normalized).toLocaleString('ru-RU')
}

export default function Reports() {
  const [items, setItems] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState<string>('') // YYYY-MM-DD
  const [dateTo, setDateTo] = useState<string>('')     // YYYY-MM-DD

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = useMemo(() => items.find(x => x.id === selectedId) || null, [items, selectedId])

  // rename UI
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState<string>('')

  const load = async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    try {
        const params = new URLSearchParams()
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
        if (debouncedDateFrom) params.set('date_from', debouncedDateFrom)
        if (debouncedDateTo) params.set('date_to', debouncedDateTo)

        const res = await fetch(`/api/reports?${params.toString()}`, { signal })
        if (!res.ok) throw new Error(`Ошибка загрузки (${res.status})`)
        const data = (await res.json()) as Report[]

        setItems(data)

        if (selectedId && !data.some(x => x.id === selectedId)) {
        setSelectedId(data[0]?.id ?? null)
        } else if (!selectedId && data[0]) {
        setSelectedId(data[0].id)
        }
    } catch (e) {
        if ((e as any)?.name === 'AbortError') return
        setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
        setLoading(false)
    }
  }

  const togglePinned = async (r: Report) => {
    const res = await fetch(`/api/reports/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !r.pinned }),
    })
    if (!res.ok) return
    await load()
  }

  const startRename = (r: Report) => {
    setRenamingId(r.id)
    setRenameValue(r.title)
  }

  const submitRename = async () => {
    if (!renamingId) return
    const title = renameValue.trim()
    if (!title) return

    const res = await fetch(`/api/reports/${renamingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })

    if (!res.ok) {
      const j = await res.json().catch(() => null)
      alert(j?.detail || `Ошибка переименования (${res.status})`)
      return
    }

    setRenamingId(null)
    setRenameValue('')
    await load()
  }

  const deleteReport = async (r: Report) => {
    const ok = confirm(`Удалить отчёт?\n\n${r.title}`)
    if (!ok) return

    const res = await fetch(`/api/reports/${r.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      alert(j?.detail || `Ошибка удаления (${res.status})`)
      return
    }

    await load()
  }

  const debouncedSearch = useDebouncedValue(search, 400)
  const debouncedDateFrom = useDebouncedValue(dateFrom, 150)
  const debouncedDateTo = useDebouncedValue(dateTo, 150)

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, debouncedDateFrom, debouncedDateTo])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-app-text">Отчёты</h2>
      </div>

      {/* Filters */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4 flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          <label className="block">
            <div className="text-app-muted text-sm mb-1 flex items-center gap-2">
              <Search size={16} /> Поиск
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Название или текст..."
              className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-app-text placeholder:text-app-muted/80 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </label>

          <label className="block">
            <div className="text-app-muted text-sm mb-1">Дата с</div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-app-text focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </label>

          <label className="block">
            <div className="text-app-muted text-sm mb-1">Дата по</div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-app-text focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setSearch('')
              setDateFrom('')
              setDateTo('')
            }}
            className="px-4 py-2 bg-app-surface-strong hover:bg-app-surface-hover text-app-text rounded-lg"
          >
            Сброс
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-app-border text-app-text font-semibold">
            Список ({items.length})
          </div>

          {loading ? (
            <div className="p-4 text-app-muted">Загрузка…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-app-muted">Нет отчётов по фильтрам.</div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {items.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={[
                    'w-full text-left p-4 border-b border-app-border hover:bg-app-surface-strong/60 transition-colors',
                    selectedId === r.id ? 'bg-app-surface-strong/70' : '',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-app-text font-semibold line-clamp-1">{r.title}</div>
                      <div className="text-app-muted text-xs mt-1">
                        {fmtDate(r.created_at)} • {r.context_mode}:{r.context_id}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      <div
                        className="p-2 rounded-lg hover:bg-app-surface-hover"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePinned(r) }}
                        title={r.pinned ? 'Открепить' : 'Закрепить'}
                      >
                        {r.pinned ? <Star size={16} className="text-amber-600" /> : <StarOff size={16} className="text-app-muted/90" />}
                      </div>
                      <div
                        className="p-2 rounded-lg hover:bg-app-surface-hover"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); startRename(r) }}
                        title="Переименовать"
                      >
                        <Pencil size={16} className="text-app-muted/90" />
                      </div>
                      <div
                        className="p-2 rounded-lg hover:bg-app-surface-hover"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteReport(r) }}
                        title="Удалить"
                      >
                        <Trash2 size={16} className="text-red-700" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Viewer */}
        <div className="lg:col-span-2 bg-app-surface border border-app-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-app-border">
            <div className="text-app-text font-semibold">
              {selected ? selected.title : 'Выберите отчёт'}
            </div>
            {selected && (
              <div className="text-app-muted text-xs mt-1">
                {fmtDate(selected.created_at)} • {selected.context_mode}:{selected.context_id} • {selected.template}
              </div>
            )}
          </div>

          {/* rename bar */}
          {renamingId && (
            <div className="p-4 border-b border-app-border bg-app-bg/40">
              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="flex-1 bg-app-bg border border-app-border rounded-lg px-3 py-2 text-app-text focus:outline-none focus:ring-2 focus:ring-primary-600"
                  placeholder="Новое название"
                />
                <div className="flex gap-2">
                  <button
                    onClick={submitRename}
                    className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => { setRenamingId(null); setRenameValue('') }}
                    className="px-4 py-2 bg-app-surface-strong hover:bg-app-surface-hover text-app-text rounded-lg"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-4">
            {selected ? (
              <div className="bg-app-bg border border-app-border rounded-lg p-4 overflow-x-auto">
                <div className="prose max-w-none">
                  <ReactMarkdown>{selected.content_md}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="text-app-muted">Нет выбранного отчёта.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

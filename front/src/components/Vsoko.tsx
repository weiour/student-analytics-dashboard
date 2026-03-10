import { useEffect, useMemo, useState } from 'react'
import MetricCard from './charts/MetricCard'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RCPieChart,
  Pie,
  Cell,
} from 'recharts'
import { parseVsokoExcelFile } from '../utils/vsokoExcelParser'

type Program = { id: string; title: string }
type Option = { id: string; label: string; order_index: number }
type Question = { id: number; text: string; options: Option[] }

type DashboardResp = {
  has_data: boolean
  metrics: { id: string; label: string; value: number | string }[]
  questions: { id: number; text: string; total: number; avg: number | null; series: { name: string; value: number }[] }[]
}

const API = 'http://127.0.0.1:8000'

export default function Vsoko() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [programId, setProgramId] = useState<string>('')
  const [year, setYear] = useState<number>(2026)

  const [mode, setMode] = useState<'dashboard' | 'form'>('dashboard')
  const [dash, setDash] = useState<DashboardResp | null>(null)

  const [page, setPage] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const pageSize = 4

  // форма: answers[questionId][optionId] = count
  const [answers, setAnswers] = useState<Record<number, Record<string, number>>>({})
  const [, setSelectedQ] = useState<number>(1)

  const visibleQuestions = useMemo(() => {
    if (!dash?.questions) return []
    if (showAll) return dash.questions
    const start = page * pageSize
    return dash.questions.slice(start, start + pageSize)
    }, [dash, page, showAll])

  const totalPages = dash?.questions ? Math.ceil(dash.questions.length / pageSize) : 0

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/vsoko/programs`).then(r => r.json()),
      fetch(`${API}/api/vsoko/questions`).then(r => r.json()),
    ]).then(([p, q]) => {
      setPrograms(p)
      setQuestions(q)
      if (p?.[0]?.id) setProgramId(p[0].id)
      if (q?.[0]?.id) setSelectedQ(q[0].id)
    })
  }, [])

  const loadDashboard = async () => {
    if (!programId) return
    const d = await fetch(`${API}/api/vsoko/dashboard/${programId}?year=${year}`).then(r => r.json())
    setDash(d)
  }

  const loadDatasetToForm = async () => {
    if (!programId) return
    const resp = await fetch(`${API}/api/vsoko/datasets?program_id=${programId}&year=${year}`).then(r => r.json())
    const next: Record<number, Record<string, number>> = {}
    for (const q of questions) {
      next[q.id] = {}
      for (const o of (q.options ?? [])) next[q.id][o.id] = 0
    }
    // если уже есть данные — подставим
    if (resp?.answers) {
      for (const [qidStr, arr] of Object.entries(resp.answers)) {
        const qid = Number(qidStr)
        if (!next[qid]) next[qid] = {}
        for (const item of arr as any[]) {
          next[qid][item.option_id] = Number(item.count || 0)
        }
      }
    }
    setAnswers(next)
  }

  useEffect(() => {
    if (mode === 'dashboard') loadDashboard()
    if (mode === 'form') loadDatasetToForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, programId, year, questions.length])

  const save = async () => {
    if (!programId) return
    const payload = {
      program_id: programId,
      year,
      answers: Object.fromEntries(
        Object.entries(answers).map(([qid, optMap]) => ([
          Number(qid),
          Object.entries(optMap).map(([option_id, count]) => ({ option_id, count }))
        ]))
      )
    }

    await fetch(`${API}/api/vsoko/datasets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setMode('dashboard')
  }

  const handleImportVsoko = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !programId) return

    try {
      const parsed = await parseVsokoExcelFile(file)

      const importedAnswers: Record<number, Record<string, number>> = {}

      for (const q of questions) {
        importedAnswers[q.id] = {}

        const importedCounts = parsed[q.id] ?? []

        q.options.forEach((option, index) => {
          importedAnswers[q.id][option.id] = importedCounts[index] ?? 0
        })
      }

      await fetch(`${API}/api/vsoko/datasets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          year,
          answers: Object.fromEntries(
            Object.entries(importedAnswers).map(([qid, optMap]) => ([
              Number(qid),
              Object.entries(optMap).map(([option_id, count]) => ({
                option_id,
                count,
              })),
            ]))
          ),
        }),
      })

      setAnswers(importedAnswers)
      setMode('dashboard')
      event.target.value = ''
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Не удалось импортировать Excel')
      event.target.value = ''
    }
  }

  const handleClearVsoko = async () => {
    const confirmed = window.confirm(
      'Вы уверены, что хотите очистить все введённые данные ВСОКО?'
    )

    if (!confirmed || !programId) return

    const clearedAnswers: Record<number, Record<string, number>> = {}

    for (const q of questions) {
      clearedAnswers[q.id] = {}

      for (const o of q.options ?? []) {
        clearedAnswers[q.id][o.id] = 0
      }
    }

    try {
      await fetch(`${API}/api/vsoko/datasets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          year,
          answers: Object.fromEntries(
            Object.entries(clearedAnswers).map(([qid, optMap]) => ([
              Number(qid),
              Object.entries(optMap).map(([option_id, count]) => ({
                option_id,
                count,
              })),
            ]))
          ),
        }),
      })

      setAnswers(clearedAnswers)
      setMode('dashboard')
    } catch (error) {
      console.error(error)
      alert('Не удалось очистить данные')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="number"
          className="h-10 bg-app-surface border border-app-border rounded-lg px-3 text-app-text w-[120px] shrink-0"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        />

        <select
          className="h-10 bg-app-surface border border-app-border rounded-lg px-3 text-app-text flex-1 min-w-[320px]"
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
        >
          {programs.map(p => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        <div className="flex bg-app-surface border border-app-border rounded-xl p-1 w-fit">
          <button
            className={`h-10 px-4 rounded-lg flex items-center justify-center transition
            ${mode === 'dashboard'
              ? 'bg-primary-700 text-white'
              : 'text-app-text'}
            `}
            onClick={() => setMode('dashboard')}
          >
            Дашборды
          </button>

          <button
            className={`h-10 px-4 rounded-lg flex items-center justify-center transition
            ${mode === 'form'
              ? 'bg-primary-700 text-white'
              : 'text-app-text'}
            `}
            onClick={() => setMode('form')}
          >
            Добавить данные
          </button>
        </div>
      </div>

      {mode === 'dashboard' && (
        <div className="space-y-6">
          {!dash?.has_data ? (
            <div className="bg-app-surface border border-app-border rounded-xl p-6 text-app-text">
              Данных за {year} пока нет. Нажмите «Добавить данные».
            </div>
          ) : (
            <>
              <div className="bg-app-surface border border-app-border rounded-xl p-6">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                
                    <label className="flex items-center gap-2 text-sm text-app-text p-2">
                        <input
                        type="checkbox"
                        checked={showAll}
                        onChange={(e) => {
                            setShowAll(e.target.checked)
                            setPage(0)
                        }}
                        />
                        Показать все 32
                    </label>

                    {!showAll && (
                        <div className="flex items-center gap-2">
                        <button
                            className="px-3 py-1 rounded-md bg-app-surface border border-app-border"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            ←
                        </button>

                        <div className="text-sm text-app-muted/90">
                            {page + 1} / {totalPages}
                        </div>

                        <button
                            className="px-3 py-1 rounded-md bg-app-surface border border-app-border"
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                        >
                            →
                        </button>
                        </div>
                    )}

                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {dash.metrics.map(m => (
                        <MetricCard
                        key={m.id}
                        metric={{
                            id: m.id,
                            label: m.label,
                            value: m.value,
                            trend: 'neutral', // чтобы карточка не пыталась показывать рост/падение
                        }}
                        />
                    ))}
                    {visibleQuestions.map(q => (
                        <VsokoQuestionCard key={q.id} q={q} />
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {mode === 'form' && (
        <div className="space-y-3">
          <div className="bg-app-surface border border-app-border rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-app-text">
              Загрузите Excel-файл ВСОКО для автоматического заполнения формы.
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="px-4 py-2 rounded-lg bg-primary-700 hover:bg-primary-600 text-white cursor-pointer">
                Импорт из Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImportVsoko}
                />
              </label>

              <button
                type="button"
                onClick={handleClearVsoko}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Очистить данные
              </button>
            </div>
          </div>
          {questions.map(q => (
            <div key={q.id} className="bg-app-surface border border-app-border rounded-xl p-6">
              <div className="font-semibold mb-3">{q.id}. {q.text}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {(q.options ?? []).map(o => (
                      <tr key={o.id} className="border-b border-app-border/60">
                        <td className="py-2 pr-3 text-app-text">{o.label}</td>
                        <td className="py-2 w-[140px]">
                          <input
                            type="number"
                            min={0}
                            className="bg-app-bg border border-app-border rounded-md px-2 py-1 w-[120px]"
                            value={answers?.[q.id]?.[o.id] ?? 0}
                            onChange={(e) => {
                              const v = Math.max(0, Number(e.target.value))
                              setAnswers(prev => ({
                                ...prev,
                                [q.id]: { ...(prev[q.id] || {}), [o.id]: v }
                              }))
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <div className="bg-app-surface border border-app-border rounded-xl p-4 flex items-center justify-between">
            <div className="text-app-text">
              Хотите сохранить данные?
            </div>
            <button
              className="px-4 py-2 rounded-lg bg-primary-700 hover:bg-primary-600 text-white"
              onClick={save}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type SeriesItem = { name: string; value: number; percent?: number }

const CHART_COLORS = ['#163f91', '#3d66dd', '#8fafff', '#94a3b8', '#c8d0e0']

function nonZero(series: SeriesItem[]) {
  return series.filter((item) => Number(item.value) > 0)
}

function truncateLabel(value: string, max = 18) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function isScale15(series: SeriesItem[]) {
  const labels = series.map(s => String(s.name).trim())
  return labels.length === 5 && labels.join(',') === '1,2,3,4,5'
}

function VsokoQuestionCard({ q }: any) {
  const raw: SeriesItem[] = q.series || []
  const series = nonZero(raw)              // ✅ убрали нули
  const scale15 = isScale15(raw)           // шкалу определяем по raw, не по series
  const small = series.length <= 4

  const chartType: 'bar' | 'pie' | 'hbar' =
    scale15 ? 'bar' : (small ? 'pie' : 'hbar')

  return (
    <div className="bg-app-surface border border-app-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div
          className="text-sm font-semibold text-app-text leading-snug line-clamp-2"
          title={`${q.id}. ${q.text}`}     // ✅ полный текст по ховеру
        >
          {q.id}. {q.text}
        </div>

        {q.avg != null && (
          <div className="text-xs text-app-muted/90 whitespace-nowrap">
            Сред. зн.: {Number(q.avg).toFixed(2)}
          </div>
        )}
      </div>

      <div className="mt-3 h-[220px]">
        {series.length === 0 ? (
          <div className="h-full flex items-center justify-center text-app-muted text-sm">
            Нет данных
          </div>
        ) : (
          <>
            {chartType === 'pie' && <VsokoDonut data={series} />}
            {chartType === 'bar' && <VsokoBarChart data={series} />}
            {chartType === 'hbar' && <VsokoHBarChart data={series} />}
          </>
        )}
      </div>

      {/* ✅ легенда — только ненулевые */}
      {series.length > 0 && (
        <div className="mt-3 space-y-1 text-sm">
          {series.map((s: SeriesItem) => (
            <div key={String(s.name)} className="flex justify-between gap-3 text-app-text">
              <span className="truncate pr-2" title={String(s.name)}>
                {s.name}
              </span>
              <span className="text-app-muted/90 whitespace-nowrap">
                {s.value}{s.percent != null ? ` (${s.percent}%)` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VsokoBarChart({ data }: { data: SeriesItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.2} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          formatter={(value: any, _name: any, props: any) => {
            const pct = props?.payload?.percent
            const v = pct != null ? `${value} (${pct}%)` : value
            return [v, 'Значение']
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function VsokoHBarChart({ data }: { data: SeriesItem[] }) {
  const prepared = data.map(d => ({ ...d, name: String(d.name) }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={prepared}
        layout="vertical"
        margin={{ top: 10, right: 10, bottom: 10, left: 110 }} // ✅ больше места слева
      >
        <CartesianGrid horizontal={false} strokeOpacity={0.2} />
        <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => truncateLabel(String(v), 18)} // ✅ не ломаем сетку
        />
        <Tooltip
          formatter={(value: any, _name: any, props: any) => {
            const pct = props?.payload?.percent
            return pct != null ? `${value} (${pct}%)` : value
          }}
          labelFormatter={(label) => String(label)} // ✅ в tooltip покажет полный текст
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive={false}>
          {prepared.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function VsokoDonut({ data }: { data: SeriesItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RCPieChart>
        <Tooltip
          formatter={(value: any, _n: any, props: any) => {
            const pct = props?.payload?.percent
            return pct != null ? `${value} (${pct}%)` : value
          }}
          labelFormatter={(label) => String(label)}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={2}
          label={false}          // ✅ убрали подписи вокруг
          labelLine={false}      // ✅ убрали линии
          isAnimationActive={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
      </RCPieChart>
    </ResponsiveContainer>
  )
}
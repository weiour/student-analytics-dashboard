import { useState, useMemo } from 'react'
import { Upload, FileSpreadsheet, Download, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { parseExcelFile } from '../utils/excelParser'
import { ContingentSpecialty } from '../types'
import BarChart from './charts/BarChart'
import PieChart from './charts/PieChart'
import { ChartData } from '../types'
import { useAppData } from '../context/AppDataContext'

const Contingent = () => {
  const [data, setData] = useState<ContingentSpecialty[]>([])
  const { setContingentData } = useAppData()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Пожалуйста, выберите файл Excel (.xlsx или .xls)')
      return
    }

    setLoading(true)
    setError(null)
    setFileName(file.name)

    try {
      const parsedData = await parseExcelFile(file)
      setData(parsedData)
      setContingentData(parsedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке файла')
      console.error('Ошибка парсинга:', err)
    } finally {
      setLoading(false)
    }
  }

  // Подготовка данных для диаграмм
  const specialtyTotalData: ChartData[] = useMemo(() => {
    return data.map((spec) => ({
      name: spec.code,
      value: spec.totals.total,
    }))
  }, [data])

  const budgetDistributionData: ChartData[] = useMemo(() => {
    const totalBudgetRF = data.reduce((sum, spec) => sum + spec.totals.budgetRF, 0)
    const totalContract = data.reduce((sum, spec) => sum + spec.totals.contract, 0)
    const totalRsYa = data.reduce((sum, spec) => sum + spec.totals.rsYa, 0)
    const totalRsYaAGIKI = data.reduce((sum, spec) => sum + spec.totals.rsYaAGIKI, 0)

    return [
      { name: 'Бюджет РФ', value: totalBudgetRF },
      { name: 'Договор', value: totalContract },
      { name: 'РС (Я)', value: totalRsYa },
      { name: 'РС(Я) АГИКИ', value: totalRsYaAGIKI },
    ].filter((item) => item.value > 0)
  }, [data])

  const totalStudents = useMemo(() => {
    return data.reduce((sum, spec) => sum + spec.totals.total, 0)
  }, [data])

  const totalGroups = useMemo(() => {
    return data.reduce((sum, spec) => sum + spec.groups.length, 0)
  }, [data])

  const exportToCSV = () => {
    if (data.length === 0) return

    const csvRows: string[] = []
    csvRows.push('Специальность,Группа,Всего,Бюджет РФ,Договор,РС (Я),РС(Я) АГИКИ,Академ. отпуск')

    data.forEach((spec) => {
      spec.groups.forEach((group) => {
        csvRows.push(
          [
            `"${spec.specialty}"`,
            group.group,
            group.total,
            group.budgetRF,
            group.contract,
            group.rsYa,
            group.rsYaAGIKI,
            group.academicLeave,
          ].join(',')
        )
      })
    })

    const csv = csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `contingent_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-app-text">Контингент студентов</h2>
          <p className="text-app-muted mt-1">Импорт и анализ данных контингента из Excel</p>
        </div>
      </div>

      {/* Загрузка файла */}
      <div className="bg-app-surface rounded-xl p-6 border border-app-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-app-text">Импорт Excel-файла</h3>
          {data.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors"
            >
              <Download size={18} />
              <span>Экспорт CSV</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 px-6 py-3 bg-app-surface-strong hover:bg-app-surface-hover text-app-text rounded-lg cursor-pointer transition-colors">
            <Upload size={20} />
            <span>Выбрать файл Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
          </label>
          {fileName && (
            <div className="flex items-center space-x-2 text-app-muted/90">
              <FileSpreadsheet size={20} />
              <span>{fileName}</span>
            </div>
          )}
        </div>

        {loading && (
          <div className="mt-4 text-app-muted">Загрузка и обработка файла...</div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-rose-600">
            {error}
          </div>
        )}
      </div>

      {/* Метрики */}
      {data.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-app-surface rounded-xl p-6 border border-app-border">
              <div className="text-app-muted text-sm mb-2">Всего студентов</div>
              <div className="text-3xl font-bold text-app-text">{totalStudents}</div>
            </div>
            <div className="bg-app-surface rounded-xl p-6 border border-app-border">
              <div className="text-app-muted text-sm mb-2">Специальностей</div>
              <div className="text-3xl font-bold text-app-text">{data.length}</div>
            </div>
            <div className="bg-app-surface rounded-xl p-6 border border-app-border">
              <div className="text-app-muted text-sm mb-2">Групп</div>
              <div className="text-3xl font-bold text-app-text">{totalGroups}</div>
            </div>
          </div>

          {/* Диаграммы */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-app-surface rounded-xl p-6 border border-app-border">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 size={20} className="text-primary-700" />
                <h3 className="text-xl font-semibold text-app-text">Количество студентов по специальностям</h3>
              </div>
              <BarChart data={specialtyTotalData} />
            </div>

            <div className="bg-app-surface rounded-xl p-6 border border-app-border">
              <div className="flex items-center space-x-2 mb-4">
                <PieChartIcon size={20} className="text-primary-700" />
                <h3 className="text-xl font-semibold text-app-text">Распределение по источникам финансирования</h3>
              </div>
              <PieChart data={budgetDistributionData} />
            </div>
          </div>

          {/* Таблица */}
          <div className="bg-app-surface rounded-xl p-6 border border-app-border">
            <h3 className="text-xl font-semibold text-app-text mb-4">Данные контингента</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-app-border">
                    <th className="text-left py-3 px-4 text-app-muted/90 font-medium">Специальность</th>
                    <th className="text-left py-3 px-4 text-app-muted/90 font-medium">Группа</th>
                    <th className="text-right py-3 px-4 text-app-muted/90 font-medium">Всего</th>
                    <th className="text-right py-3 px-4 text-app-muted/90 font-medium">Бюджет РФ</th>
                    <th className="text-right py-3 px-4 text-app-muted/90 font-medium">Договор</th>
                    <th className="text-right py-3 px-4 text-app-muted/90 font-medium">РС (Я)</th>
                    <th className="text-right py-3 px-4 text-app-muted/90 font-medium">РС(Я) АГИКИ</th>
                    <th className="text-right py-3 px-4 text-app-muted/90 font-medium">Академ. отпуск</th>
                  </tr>
                </thead>
                <tbody>
                  {data.flatMap((specialty, specIdx) => {
                    const totalRows = specialty.groups.length + 1 // группы + строка итого
                    const groupRows = specialty.groups.map((group, groupIdx) => (
                      <tr
                        key={group.id}
                        className="border-b border-app-border hover:bg-app-surface-strong/70 transition-colors"
                      >
                        {groupIdx === 0 && (
                          <td
                            rowSpan={totalRows}
                            className="py-3 px-4 text-app-text font-medium align-top border-r border-app-border"
                          >
                            <div className="font-semibold">{specialty.code}</div>
                            <div className="text-sm text-app-muted mt-1">{specialty.specialty}</div>
                          </td>
                        )}
                        <td className="py-3 px-4 text-app-muted/90">{group.group}</td>
                        <td className="py-3 px-4 text-app-text text-right font-medium">{group.total}</td>
                        <td className="py-3 px-4 text-app-muted/90 text-right">{group.budgetRF}</td>
                        <td className="py-3 px-4 text-app-muted/90 text-right">{group.contract}</td>
                        <td className="py-3 px-4 text-app-muted/90 text-right">{group.rsYa}</td>
                        <td className="py-3 px-4 text-app-muted/90 text-right">{group.rsYaAGIKI}</td>
                        <td className="py-3 px-4 text-app-muted/90 text-right">{group.academicLeave}</td>
                      </tr>
                    ))
                    
                    const totalRow = (
                      <tr key={`total-${specIdx}`} className="bg-app-surface-strong/70 font-semibold border-b-2 border-app-border-strong">
                        <td className="py-3 px-4 text-app-text">
                          Итого
                        </td>
                        <td className="py-3 px-4 text-app-text text-right">{specialty.totals.total}</td>
                        <td className="py-3 px-4 text-app-text text-right">{specialty.totals.budgetRF}</td>
                        <td className="py-3 px-4 text-app-text text-right">{specialty.totals.contract}</td>
                        <td className="py-3 px-4 text-app-text text-right">{specialty.totals.rsYa}</td>
                        <td className="py-3 px-4 text-app-text text-right">{specialty.totals.rsYaAGIKI}</td>
                        <td className="py-3 px-4 text-app-text text-right">{specialty.totals.academicLeave}</td>
                      </tr>
                    )
                    
                    return [...groupRows, totalRow]
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {data.length === 0 && !loading && !error && (
        <div className="bg-app-surface rounded-xl p-12 border border-app-border text-center">
          <FileSpreadsheet size={64} className="mx-auto text-app-muted mb-4" />
          <p className="text-app-muted text-lg">
            Загрузите Excel-файл для отображения данных контингента
          </p>
        </div>
      )}
    </div>
  )
}

export default Contingent


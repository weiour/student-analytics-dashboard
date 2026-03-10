import * as XLSX from 'xlsx'

type ParsedVsokoAnswers = Record<number, number[]>

const SKIP_EXCEL_QUESTIONS = new Set([5, 34, 35])

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function extractQuestionNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const match = String(value).trim().match(/^\d+$/)
  return match ? Number(match[0]) : null
}

function extractCount(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const text = String(value).trim()

  // "12 (34%)" -> 12
  const match = text.match(/^(\d+)/)
  return match ? Number(match[1]) : 0
}

function isQuestionRow(row: unknown[]): boolean {
  const num = extractQuestionNumber(row[0])
  return num !== null && num >= 1 && num <= 35
}

function isAnswersLabelRow(row: unknown[]): boolean {
  return normalizeText(row[1]).startsWith('ответы')
}

function isOptionsLabelRow(row: unknown[]): boolean {
  return normalizeText(row[1]).startsWith('варианты ответов')
}

function trimTrailingZeros(values: number[]): number[] {
  const result = [...values]
  while (result.length > 0 && result[result.length - 1] === 0) {
    result.pop()
  }
  return result
}

function parseStandardAnswersRow(row: unknown[]): number[] {
  // Обычно ответы лежат в колонках C:G
  return trimTrailingZeros(row.slice(2, 7).map(extractCount))
}

function parseDirectNumericRow(row: unknown[]): number[] {
  // Для вопросов вроде №4 и №18 числа лежат в колонках B:G
  return trimTrailingZeros(row.slice(1, 7).map(extractCount))
}

export function parseVsokoExcelFile(file: File): Promise<ParsedVsokoAnswers> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer
        const workbook = XLSX.read(data, { type: 'array' })

        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as unknown[][]

        const result: ParsedVsokoAnswers = {}
        let siteQuestionId = 1

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex] ?? []

          if (!isQuestionRow(row)) continue

          const excelQuestionNumber = extractQuestionNumber(row[0])

          if (excelQuestionNumber === null) continue

          if (SKIP_EXCEL_QUESTIONS.has(excelQuestionNumber)) {
            continue
          }

          const row1 = rows[rowIndex + 1] ?? []
          const row2 = rows[rowIndex + 2] ?? []

          let counts: number[] = []

          // Обычный случай:
          // вопрос -> "Варианты ответов" -> "Ответы"
          if (isOptionsLabelRow(row1) && isAnswersLabelRow(row2)) {
            counts = parseStandardAnswersRow(row2)
          }
          // Специальный случай, как у вопросов 4 и 18:
          // вопрос -> строка с вариантами -> строка с числами
          else {
            counts = parseDirectNumericRow(row2)
          }

          result[siteQuestionId] = counts
          siteQuestionId++
        }

        const parsedCount = Object.keys(result).length

        if (parsedCount !== 32) {
          reject(
            new Error(
              `Ожидалось 32 вопроса после пропуска 5, 34 и 35, но найдено ${parsedCount}.`
            )
          )
          return
        }

        resolve(result)
      } catch (error) {
        reject(
          new Error(
            `Ошибка при парсинге Excel ВСОКО: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        )
      }
    }

    reader.onerror = () => {
      reject(new Error('Ошибка при чтении Excel-файла'))
    }

    reader.readAsArrayBuffer(file)
  })
}
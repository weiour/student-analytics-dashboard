import * as XLSX from 'xlsx'
import { ContingentGroup, ContingentSpecialty } from '../types'

/**
 * Парсит Excel файл и возвращает данные контингента
 */
export const parseExcelFile = (file: File): Promise<ContingentSpecialty[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        
        // Берем первый лист
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Конвертируем в JSON с заголовками
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: null,
          raw: false 
        }) as any[][]

        const specialties = parseContingentData(jsonData)
        resolve(specialties)
      } catch (error) {
        reject(new Error(`Ошибка при парсинге Excel файла: ${error}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Ошибка при чтении файла'))
    }

    reader.readAsBinaryString(file)
  })
}

/**
 * Парсит массив данных из Excel в структурированный формат
 */
const parseContingentData = (data: any[][]): ContingentSpecialty[] => {
  const specialties: ContingentSpecialty[] = []
  let currentSpecialty: ContingentSpecialty | null = null
  let currentCode = ''
  let currentSpecialtyName = ''
  
  // Пропускаем заголовки (первые несколько строк могут быть заголовками)
  let startRow = 0
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i]
    if (row && Array.isArray(row)) {
      const firstCell = String(row[0] || '').trim().toLowerCase()
      const secondCell = String(row[1] || '').trim().toLowerCase()
      // Ищем строку с заголовками таблицы
      if ((firstCell.includes('специальность') || firstCell.includes('направление')) && 
          (secondCell.includes('группа') || secondCell === '')) {
        startRow = i + 1
        break
      }
    }
  }

  for (let i = startRow; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const firstCell = String(row[0] || '').trim()
    const secondCell = String(row[1] || '').trim()
    
    // Пропускаем пустые строки
    if (!firstCell && !secondCell) continue

    // Обнаружение новой специальности (строка с кодом специальности типа 09.03.03 или 53.03.01)
    const codeMatch = firstCell.match(/^(\d{2}\.\d{2}\.\d{2}[.\d]*)/)
    if (codeMatch) {
      // Сохраняем предыдущую специальность, если она есть
      if (currentSpecialty && currentSpecialty.groups.length > 0) {
        specialties.push(currentSpecialty)
      }

      currentCode = codeMatch[1]
      // Извлекаем название специальности (всё после кода)
      currentSpecialtyName = firstCell.replace(codeMatch[0], '').trim()
      // Если название пустое, используем код
      if (!currentSpecialtyName) {
        currentSpecialtyName = currentCode
      }
      
      currentSpecialty = {
        specialty: currentSpecialtyName,
        code: currentCode,
        groups: [],
        totals: {
          total: 0,
          budgetRF: 0,
          contract: 0,
          rsYa: 0,
          rsYaAGIKI: 0,
          academicLeave: 0,
        },
      }
    }
    // Обнаружение строки "Итого" для специальности
    else if (firstCell.toLowerCase().includes('итого') || 
             firstCell.toLowerCase().includes('total') ||
             (firstCell === '' && secondCell.toLowerCase().includes('итого'))) {
      if (currentSpecialty) {
        // Итого может быть в первой или второй колонке
        const totalsRow = secondCell.toLowerCase().includes('итого') ? row.slice(1) : row.slice(2)
        if (totalsRow.length >= 6) {
          currentSpecialty.totals = {
            total: parseNumber(totalsRow[0]) || 0,
            budgetRF: parseNumber(totalsRow[1]) || 0,
            contract: parseNumber(totalsRow[2]) || 0,
            rsYa: parseNumber(totalsRow[3]) || 0,
            rsYaAGIKI: parseNumber(totalsRow[4]) || 0,
            academicLeave: parseNumber(totalsRow[5]) || 0,
          }
        }
      }
    }
    // Обычная строка с группой (есть группа во второй колонке и число в третьей)
    else if (secondCell && currentSpecialty && 
             !firstCell.toLowerCase().includes('итого') && 
             !secondCell.toLowerCase().includes('итого') &&
             (parseNumber(row[2]) !== null || parseNumber(row[3]) !== null)) {
      
      // Группа может быть указана в первой или второй колонке
      const groupName = secondCell || firstCell
      const valuesStartIndex = secondCell ? 2 : 1
      
      const group: ContingentGroup = {
        id: `${currentCode}-${groupName}-${currentSpecialty.groups.length}`,
        specialty: currentSpecialtyName,
        group: groupName,
        total: parseNumber(row[valuesStartIndex]) || 0,
        budgetRF: parseNumber(row[valuesStartIndex + 1]) || 0,
        contract: parseNumber(row[valuesStartIndex + 2]) || 0,
        rsYa: parseNumber(row[valuesStartIndex + 3]) || 0,
        rsYaAGIKI: parseNumber(row[valuesStartIndex + 4]) || 0,
        academicLeave: parseNumber(row[valuesStartIndex + 5]) || 0,
      }
      
      // Добавляем группу только если есть хотя бы одно непустое значение
      if (group.total > 0 || group.budgetRF > 0 || group.contract > 0 || 
          group.rsYa > 0 || group.rsYaAGIKI > 0 || group.academicLeave > 0) {
        currentSpecialty.groups.push(group)
      }
    }
  }

  // Добавляем последнюю специальность
  if (currentSpecialty && currentSpecialty.groups.length > 0) {
    specialties.push(currentSpecialty)
  }

  return specialties
}

/**
 * Парсит число из ячейки Excel (может быть строкой или числом)
 */
const parseNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  const str = String(value).replace(/[^\d.-]/g, '')
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}


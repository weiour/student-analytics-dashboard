import { DataPoint, ChartData, Metric } from '../types'

// Генерация данных по успеваемости студентов по дням
export const generatePerformanceData = (days: number = 30): DataPoint[] => {
  const data: DataPoint[] = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Средний балл за день (от 3.0 до 5.0)
    const avgScore = (Math.random() * 1.5 + 3.5).toFixed(1)
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat(avgScore),
      category: ['Математика', 'Информационные системы', 'Разработка програмных приложений', 'Базы данных'][Math.floor(Math.random() * 4)],
      region: ['ПИ-22', 'ПИ-23', 'ПИ-24', 'ПИ-25'][Math.floor(Math.random() * 4)],
    })
  }
  
  return data
}

export const subjectData: ChartData[] = [
  { name: 'Математика', value: 4.3, color: '#3b82f6' },
  { name: 'Информационные системы', value: 4.1, color: '#10b981' },
  { name: 'Разработка програмных приложений', value: 4.5, color: '#f59e0b' },
  { name: 'Базы данных', value: 3.8, color: '#ef4444' },
  { name: 'Английский', value: 4.2, color: '#8b5cf6' },
]

export const groupData: ChartData[] = [
  { name: 'ПИ-22', value: 4.4, color: '#3b82f6' },
  { name: 'ПИ-23', value: 4.2, color: '#10b981' },
  { name: 'ПИ-24', value: 4.1, color: '#f59e0b' },
  { name: 'ПИ-25', value: 3.9, color: '#ef4444' },
]

// Распределение по оценкам
export const gradeDistribution: ChartData[] = [
  { name: 'Отлично (5)', value: 125, color: '#10b981' },
  { name: 'Хорошо (4)', value: 234, color: '#3b82f6' },
  { name: 'Удовлетворительно (3)', value: 89, color: '#f59e0b' },
  { name: 'Неудовлетворительно (2)', value: 12, color: '#ef4444' },
]

// Метрики успеваемости
export const metrics: Metric[] = [
  {
    id: '1',
    label: 'Средний балл',
    value: '4.23',
    change: 0.15,
    trend: 'up',
  },
  {
    id: '2',
    label: 'Всего студентов',
    value: '456',
    change: 8,
    trend: 'up',
  },
  {
    id: '3',
    label: 'Процент успеваемости',
    value: '94.2%',
    change: 2.1,
    trend: 'up',
  },
  {
    id: '4',
    label: 'Отличников',
    value: '125',
    change: 5,
    trend: 'up',
  },
]

// Данные для таблицы (студенты с оценками)
export const tableData = [
  { id: 1, student: 'Иванов Иван Иванович', group: 'ПИ-22', subject: 'Математика', grade: 5, avgScore: 4.8, semester: 'Осенний 2024' },
  { id: 2, student: 'Петров Петр Петрович', group: 'ПИ-22', subject: 'Информационные системы', grade: 4, avgScore: 4.2, semester: 'Осенний 2024' },
  { id: 3, student: 'Сидоров Сидор Сидорович', group: 'ПИ-23', subject: 'Разработка програмных приложений', grade: 5, avgScore: 4.9, semester: 'Осенний 2024' },
  { id: 4, student: 'Козлова Анна Сергеевна', group: 'ПИ-23', subject: 'Базы данных', grade: 3, avgScore: 3.5, semester: 'Осенний 2024' },
  { id: 5, student: 'Морозов Дмитрий Алексеевич', group: 'ПИ-24', subject: 'Математика', grade: 4, avgScore: 4.1, semester: 'Осенний 2024' },
  { id: 6, student: 'Волкова Елена Викторовна', group: 'ПИ-24', subject: 'Английский', grade: 5, avgScore: 4.7, semester: 'Осенний 2024' },
  { id: 7, student: 'Соколов Алексей Николаевич', group: 'ПИ-24', subject: 'Информационные системы', grade: 4, avgScore: 4.3, semester: 'Осенний 2024' },
  { id: 8, student: 'Лебедева Мария Дмитриевна', group: 'ПИ-25', subject: 'Разработка програмных приложений', grade: 5, avgScore: 4.6, semester: 'Осенний 2024' },
  { id: 9, student: 'Новиков Игорь Владимирович', group: 'ПИ-25', subject: 'Математика', grade: 3, avgScore: 3.8, semester: 'Осенний 2024' },
  { id: 10, student: 'Федорова Ольга Игоревна', group: 'ПИ-25', subject: 'Базы данных', grade: 4, avgScore: 4.0, semester: 'Осенний 2024' },
]


// Хранилище турнира: общий бэкенд на Railway (Express + Postgres), не localStorage —
// все клиенты читают/пишут один и тот же документ через /api/data
import { buildGroupSchedule, buildSeedData } from './seed'
import type { TournamentData } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? ''
const AUTH_KEY = 'avesto-admin-auth'

export async function loadData(): Promise<TournamentData> {
  const res = await fetch(`${API_URL}/api/data`)
  if (res.status === 404) {
    // Сервер ещё пуст (первый деплой) — временно показываем сид из бандла,
    // пока админ не нажмёт «Сбросить к исходным данным» в /admin/settings
    return buildSeedData()
  }
  if (!res.ok) {
    throw new Error('Не удалось загрузить данные турнира с сервера.')
  }
  return (await res.json()) as TournamentData
}

// Бросает исключение, если сервер отклонил сохранение (неверный пароль, сеть недоступна) —
// вызывающий код должен показать это пользователю, а не дать ошибке уйти в необработанный useEffect
export async function saveData(data: TournamentData): Promise<void> {
  const password = sessionStorage.getItem(AUTH_KEY)
  const res = await fetch(`${API_URL}/api/data`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${password ?? ''}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error('Не удалось сохранить данные: сервер отклонил запрос. Попробуйте войти в админку заново.')
  }
}

export function resetToSeed(): TournamentData {
  return buildSeedData()
}

// Пересобирает даты/пары матчей группового этапа, не трогая команды, логотипы
// и игроков — для правок логики календаря без потери уже настроенных данных
export function rebuildGroupSchedule(data: TournamentData): TournamentData {
  return { ...data, matches: buildGroupSchedule() }
}

// Логотипы/фото хранятся в общем документе как base64 — каждое изображение
// сжимается до разумного размера перед сохранением, чтобы не раздувать payload
const MAX_IMAGE_DIMENSION = 400
const IMAGE_QUALITY = 0.85

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(reader.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/webp', IMAGE_QUALITY))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

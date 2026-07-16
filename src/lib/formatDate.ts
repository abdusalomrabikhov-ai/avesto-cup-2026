// Единый формат дат по всему сайту: день/месяц/год
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}.${m}.${y}`
}

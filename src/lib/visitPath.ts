// Динамические сегменты схлопываем: иначе каждая команда/игрок даёт свою
// строку в visit_log, а в статистике интересен раздел, не конкретная карточка
export function normalizeVisitPath(pathname: string): string {
  return pathname.replace(/^\/teams\/.+/, '/teams/:id').replace(/^\/players\/.+/, '/players/:id')
}

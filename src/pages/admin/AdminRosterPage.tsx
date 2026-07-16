import { useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, Trash2 } from 'lucide-react'
import { useTournamentData } from '../../hooks/useTournamentData'
import { useToast } from '../../hooks/useToast'
import { useConfirm } from '../../hooks/useConfirm'
import { fileToBase64 } from '../../data/store'
import { validateCaptainPhone, validatePlayerUniqueness, validateRosterSize } from '../../lib/validate'
import type { Player } from '../../types'

const EMPTY_FORM = {
  fullName: '',
  birthDate: '',
  position: '',
  number: 1,
  photo: null as string | null,
  isCaptain: false,
  phone: '',
}

export function AdminRosterPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const { data, setData } = useTournamentData()
  const showToast = useToast()
  const confirm = useConfirm()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const team = data.teams.find((t) => t.id === teamId)
  const roster = data.players.filter((p) => p.teamId === teamId)
  const rosterSizeError = validateRosterSize(roster)

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError(null)
  }

  const startEdit = (player: Player) => {
    setEditingId(player.id)
    setForm({
      fullName: player.fullName,
      birthDate: player.birthDate,
      position: player.position,
      number: player.number,
      photo: player.photo,
      isCaptain: player.isCaptain,
      phone: player.phone ?? '',
    })
    setError(null)
  }

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return
    const base64 = await fileToBase64(file)
    setForm((f) => ({ ...f, photo: base64 }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!teamId || !form.fullName.trim()) return

    const captainError = validateCaptainPhone(form.isCaptain, form.phone || null)
    if (captainError) {
      setError(captainError)
      return
    }

    const candidate: Player = {
      id: editingId ?? crypto.randomUUID(),
      teamId,
      fullName: form.fullName.trim(),
      birthDate: form.birthDate,
      position: form.position,
      number: form.number,
      photo: form.photo,
      isCaptain: form.isCaptain,
      phone: form.isCaptain ? form.phone || null : null,
    }

    const uniquenessError = validatePlayerUniqueness(candidate, data.players)
    if (uniquenessError) {
      setError(uniquenessError)
      return
    }

    const wasEditing = editingId !== null
    setData((d) => {
      const others = d.players.filter((p) => p.id !== candidate.id)
      // Капитан один на команду
      const withoutOldCaptain = candidate.isCaptain
        ? others.map((p) => (p.teamId === teamId ? { ...p, isCaptain: false, phone: p.isCaptain ? null : p.phone } : p))
        : others
      return { ...d, players: [...withoutOldCaptain, candidate] }
    })
    resetForm()
    showToast(wasEditing ? 'Игрок сохранён' : 'Игрок добавлен')
  }

  const handleDelete = async (playerId: string) => {
    const ok = await confirm({ title: 'Удалить игрока?', description: 'Это действие необратимо.' })
    if (!ok) return
    setData((d) => ({ ...d, players: d.players.filter((p) => p.id !== playerId) }))
  }

  if (!team) {
    return (
      <div>
        <p className="text-slate-400">Команда не найдена.</p>
      </div>
    )
  }

  return (
    <div>
      <Link to="/admin/teams" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4">
        <ArrowLeft className="h-4 w-4" /> К командам
      </Link>

      <h1 className="text-xl font-bold text-white mb-1">Состав: {team.name}</h1>
      <p className={`text-sm mb-4 ${rosterSizeError ? 'text-red-400' : 'text-court-400'}`}>
        {rosterSizeError ?? `Состав корректен (${roster.length} игроков)`}
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800">
          {roster.length === 0 && <p className="p-4 text-slate-500 text-sm">Игроков пока нет.</p>}
          {roster.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-10 w-10 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                {p.photo ? (
                  <img src={p.photo} alt={p.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-slate-500">#{p.number}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-100 truncate flex items-center gap-1.5">
                  {p.fullName}
                  {p.isCaptain && <Star className="h-3.5 w-3.5 text-gold-400" fill="currentColor" />}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  №{p.number} · {p.position || '—'}
                </p>
              </div>
              <button
                onClick={() => startEdit(p)}
                className="min-h-11 text-xs px-2 py-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Изменить
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="min-h-11 min-w-11 flex items-center justify-center rounded-md text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-3 h-fit sticky top-20"
        >
          <h2 className="font-semibold text-white">{editingId ? 'Изменить игрока' : 'Новый игрок'}</h2>
          <input
            placeholder="ФИО"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
            required
          />
          <label className="text-xs text-slate-400 flex flex-col gap-1">
            № приказа
            <input
              type="text"
              value={form.birthDate}
              onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
              className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <input
            placeholder="Должность в компании"
            value={form.position}
            onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
            className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
          />
          <label className="text-xs text-slate-400 flex flex-col gap-1">
            Игровой номер
            <input
              type="number"
              min={0}
              max={99}
              value={form.number}
              onChange={(e) => setForm((f) => ({ ...f, number: Number(e.target.value) }))}
              className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Фото</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoChange(e.target.files?.[0])}
              className="text-xs text-slate-400 w-full"
            />
            {form.photo && (
              <img src={form.photo} alt="preview" className="h-16 w-16 object-cover mt-2 rounded-md" />
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.isCaptain}
              onChange={(e) => setForm((f) => ({ ...f, isCaptain: e.target.checked }))}
            />
            Капитан
          </label>
          {form.isCaptain && (
            <input
              placeholder="Контактный телефон капитана"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
            />
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              className="flex-1 bg-court-500 hover:bg-court-400 text-slate-950 font-semibold rounded-md px-3 py-2 text-sm transition-colors"
            >
              {editingId ? 'Сохранить' : 'Добавить'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

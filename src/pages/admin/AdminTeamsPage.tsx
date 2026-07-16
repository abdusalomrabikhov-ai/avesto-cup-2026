import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ImageUp, Plus, Trash2, Users, X } from 'lucide-react'
import { useTournamentData } from '../../hooks/useTournamentData'
import { useToast } from '../../hooks/useToast'
import { useConfirm } from '../../hooks/useConfirm'
import { fileToBase64 } from '../../data/store'
import { TeamLogo } from '../../components/TeamLogo'
import type { GroupId, Team } from '../../types'

const GROUPS: GroupId[] = ['A', 'B', 'C', 'D']

const EMPTY_FORM = { name: '', company: '', group: 'A' as GroupId, logo: null as string | null }

export function AdminTeamsPage() {
  const { data, setData } = useTournamentData()
  const showToast = useToast()
  const confirm = useConfirm()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const startEdit = (team: Team) => {
    setEditingId(team.id)
    setForm({ name: team.name, company: team.company, group: team.group, logo: team.logo })
  }

  const handleLogoChange = async (file: File | undefined) => {
    if (!file) return
    const base64 = await fileToBase64(file)
    setForm((f) => ({ ...f, logo: base64 }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    const wasEditing = editingId !== null
    setData((d) => {
      if (editingId) {
        return {
          ...d,
          teams: d.teams.map((t) => (t.id === editingId ? { ...t, ...form } : t)),
        }
      }
      const newTeam: Team = { id: crypto.randomUUID(), ...form }
      return { ...d, teams: [...d.teams, newTeam] }
    })
    resetForm()
    showToast(wasEditing ? 'Команда сохранена' : 'Команда добавлена')
  }

  const handleDelete = async (teamId: string) => {
    const ok = await confirm({
      title: 'Удалить команду?',
      description: 'Команда и весь её состав будут удалены безвозвратно.',
    })
    if (!ok) return
    setData((d) => ({
      ...d,
      teams: d.teams.filter((t) => t.id !== teamId),
      players: d.players.filter((p) => p.teamId !== teamId),
    }))
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
      <div>
        <h1 className="text-xl font-bold text-white mb-4">Команды ({data.teams.length})</h1>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800">
          {data.teams.map((team) => {
            const rosterCount = data.players.filter((p) => p.teamId === team.id).length
            return (
              <div key={team.id} className="flex items-center gap-3 px-4 py-3">
                <TeamLogo team={team} size="md" shape="square" className="border-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-100 truncate">{team.name}</p>
                  <p className="text-xs text-slate-500 truncate">Группа {team.group}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    rosterCount >= 5 && rosterCount <= 12 ? 'bg-court-500/15 text-court-400' : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {rosterCount} игроков
                </span>
                <Link
                  to={`/admin/teams/${team.id}/roster`}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Состав"
                >
                  <Users className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => startEdit(team)}
                  className="min-h-11 text-xs px-2 py-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Изменить
                </button>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-md text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-3 h-fit sticky top-20"
      >
        <h2 className="font-semibold text-white flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> {editingId ? 'Изменить команду' : 'Новая команда'}
        </h2>
        <input
          placeholder="Название команды"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
          required
        />
        <input
          placeholder="Компания / подразделение"
          value={form.company}
          onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
        />
        <label className="flex items-center justify-between text-sm text-slate-300">
          Группа
          <select
            value={form.group}
            onChange={(e) => setForm((f) => ({ ...f, group: e.target.value as GroupId }))}
            className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5"
          >
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <div>
          <label className="text-sm text-slate-300 block mb-1.5">Логотип</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleLogoChange(e.target.files?.[0])}
            className="hidden"
          />
          {form.logo ? (
            <div className="flex items-center gap-3">
              <img src={form.logo} alt="preview" className="h-16 w-16 object-contain bg-white rounded-md p-1 border border-slate-800" />
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                >
                  Заменить
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, logo: null }))}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-slate-800 text-red-400/70 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Убрать
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-700 py-6 text-slate-400 hover:border-court-400 hover:text-court-400 transition-colors"
            >
              <ImageUp className="h-5 w-5" />
              <span className="text-xs">Загрузить логотип</span>
            </button>
          )}
        </div>
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
  )
}

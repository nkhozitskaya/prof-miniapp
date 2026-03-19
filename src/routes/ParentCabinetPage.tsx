import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getStoredTelegramToken } from '../lib/storage'
import { parentCreateLinkInvite, parentListChildren, type ChildListItem } from '../lib/api'

function childLabel(c: ChildListItem): string {
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
  return name || c.username || `Ребёнок ${String(c.telegram_user_id)}`
}

export function ParentCabinetPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const token = useMemo(() => getStoredTelegramToken(), [])

  const [invite, setInvite] = useState<{ code: string; expires_at: string } | null>(null)
  const [inviteErr, setInviteErr] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [children, setChildren] = useState<ChildListItem[]>([])
  const [loadingChildren, setLoadingChildren] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true })
      return
    }
    if (!token) {
      // Parent portal requires Telegram auth token (server mode)
      navigate('/child', { replace: true })
      return
    }
    setLoadingChildren(true)
    parentListChildren(token)
      .then(setChildren)
      .catch(() => setChildren([]))
      .finally(() => setLoadingChildren(false))
  }, [navigate, token, user])

  if (!user) return null

  const createInvite = async () => {
    if (!token) return
    setInviteErr(null)
    setCreating(true)
    try {
      const res = await parentCreateLinkInvite(token, { days: 7, maxUses: 1 })
      setInvite({ code: res.code, expires_at: res.expires_at })
    } catch (e) {
      setInviteErr(e instanceof Error ? e.message : 'Не удалось создать код')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold">Родительский кабинет</h1>
          <p className="text-sm text-slate-300">Здесь можно привязать детей и видеть их прогресс.</p>
        </header>

        <section className="bg-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-slate-200">Код привязки ребёнка</h2>
              <p className="text-xs text-slate-400">Ребёнок вводит этот код у себя в кабинете.</p>
            </div>
            <button
              type="button"
              onClick={createInvite}
              disabled={creating || !token}
              className={`px-3 py-2 rounded font-medium transition-colors ${
                creating || !token ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {creating ? 'Создаю...' : 'Создать код'}
            </button>
          </div>

          {inviteErr && <div className="text-sm text-red-300">{inviteErr}</div>}

          {invite && (
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/30 px-3 py-2">
              <div>
                <div className="text-xs text-slate-400">Код</div>
                <div className="text-lg font-semibold tracking-widest">{invite.code}</div>
              </div>
              <div className="text-xs text-slate-400">
                до {new Date(invite.expires_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
          )}
        </section>

        <section className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">Дети</h2>
          {loadingChildren && <p className="text-sm text-slate-400">Загрузка...</p>}
          {!loadingChildren && children.length === 0 && (
            <p className="text-sm text-slate-300">Пока нет привязанных детей.</p>
          )}
          {!loadingChildren && children.length > 0 && (
            <ul className="space-y-2">
              {children.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/parent/child/${c.id}`)}
                    className="w-full text-left rounded-xl border border-slate-700 bg-slate-900/20 hover:bg-slate-900/30 p-3 transition-colors"
                  >
                    <div className="font-medium text-slate-100">{childLabel(c)}</div>
                    <div className="text-xs text-slate-400">ID: {c.id}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}


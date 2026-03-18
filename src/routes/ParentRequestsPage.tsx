import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getStoredTelegramToken } from '../lib/storage'
import { grantEntitlement, updatePurchaseRequest, type PurchaseRequestRow } from '../lib/api'

export function ParentRequestsPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const token = useMemo(() => getStoredTelegramToken(), [])
  const params = useParams()
  const childId = params.childId ?? ''

  const [requests, setRequests] = useState<PurchaseRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true })
      return
    }
    if (!token || !childId) {
      navigate('/parent', { replace: true })
      return
    }
    // Requests are already returned by parent-child-dashboard; for MVP we keep a lightweight page placeholder.
    setLoading(false)
    setRequests([])
  }, [childId, navigate, token, user])

  if (!user) return null

  const approveAndGrant = async (r: PurchaseRequestRow) => {
    if (!token) return
    setError(null)
    try {
      await updatePurchaseRequest(token, r.id, 'approved')
      await grantEntitlement(token, r.child_user_id, r.sku, 'parent_purchase')
      setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: 'approved' } : x)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Запросы покупок</h1>
        <button type="button" className="text-sm text-slate-300 hover:text-white underline" onClick={() => navigate(-1)}>
          Назад
        </button>
      </header>

      {error && <div className="text-sm text-red-300 mb-3">{error}</div>}
      {loading && <p className="text-sm text-slate-400">Загрузка...</p>}

      {!loading && requests.length === 0 && (
        <p className="text-sm text-slate-300">Пока нет запросов. (MVP: появятся после добавления детского запроса.)</p>
      )}

      {!loading && requests.length > 0 && (
        <ul className="space-y-2">
          {requests.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.sku}</div>
                <div className="text-xs text-slate-400">{r.status}</div>
              </div>
              {r.status === 'requested' && (
                <div className="mt-2 flex gap-2">
                  <button className="flex-1 py-2 rounded bg-emerald-500 hover:bg-emerald-600 font-medium text-sm" type="button" onClick={() => approveAndGrant(r)}>
                    Одобрить
                  </button>
                  <button className="flex-1 py-2 rounded bg-slate-700 hover:bg-slate-600 font-medium text-sm" type="button">
                    Отклонить
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


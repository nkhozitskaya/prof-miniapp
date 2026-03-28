import { useState, useEffect, useCallback } from 'react'
import { getUserDiagnosticResults } from './useDiagnostic'
import type { DiagnosticResult, LegacyDiagnosticResult } from '../types'

export function useDiagnosticResults(userId: string | null) {
  const [results, setResults] = useState<(DiagnosticResult | LegacyDiagnosticResult)[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const list = await getUserDiagnosticResults()
      setResults(list)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return { results, loading, refetch: load }
}

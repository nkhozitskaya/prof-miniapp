import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { saveDiagnosticResult } from '../hooks/useDiagnostic'
import { STATIONS, DIAGNOSTIC_INSTRUCTION } from '../data/diagnosticStations'
import { computeDiagnosticResult } from '../utils/diagnosticScore'

const CHOICES_PER_STATION = 2

export const DiagnosticPage = () => {
  const { user } = useUser()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [selectedByStation, setSelectedByStation] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  if (!user) {
    navigate('/auth', { replace: true })
    return null
  }

  const station = STATIONS[step]
  const isLastStep = step === STATIONS.length - 1
  const selected = selectedByStation[station.id] ?? []
  const canProceed = selected.length === CHOICES_PER_STATION

  const toggleOption = (optionId: string) => {
    setSelectedByStation((prev) => {
      const current = prev[station.id] ?? []
      if (current.includes(optionId)) {
        return { ...prev, [station.id]: current.filter((id) => id !== optionId) }
      }
      if (current.length >= CHOICES_PER_STATION) return prev
      return { ...prev, [station.id]: [...current, optionId] }
    })
  }

  const handleNext = async () => {
    if (!canProceed) return
    if (isLastStep) {
      setSubmitting(true)
      const computed = computeDiagnosticResult(user.id, selectedByStation)
      try {
        const save = saveDiagnosticResult({
          subscales: computed.subscales,
          tendencies: computed.tendencies,
          zonesSupport: computed.zonesSupport,
          zonesMiddle: computed.zonesMiddle,
          zonesRisk: computed.zonesRisk,
          riskSignal: computed.riskSignal,
          interpretation: computed.interpretation,
        })
        if (save && typeof (save as Promise<unknown>).then === 'function') {
          await (save as Promise<void>)
        }
        navigate('/profile')
      } catch (e) {
        console.error(e)
        alert('Не удалось сохранить результат. Проверьте интернет и попробуйте снова.')
      } finally {
        setSubmitting(false)
      }
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  /* Высота экрана минус нижнее меню AppLayout (navHeight), чтобы «Далее» всегда было в зоне видимости */
  return (
    <div className="bg-slate-900 text-white px-4 pt-4 pb-2 flex flex-col min-h-0 max-h-[calc(100dvh-4.5rem)] h-[calc(100dvh-4.5rem)]">
      <div className="max-w-xl mx-auto w-full flex flex-col min-h-0 flex-1">
        <header className="flex items-center justify-between shrink-0">
          <button
            type="button"
            className="text-sm text-slate-300 hover:text-white underline"
            onClick={() => navigate('/profile')}
          >
            В ЛК
          </button>
          <span className="text-sm text-slate-400">
            Станция {step + 1} из {STATIONS.length}
          </span>
        </header>

        {step === 0 && (
          <p className="mt-3 text-sm text-slate-300 shrink-0">
            {DIAGNOSTIC_INSTRUCTION}
          </p>
        )}

        <div className="mt-4 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 -mr-1">
          <h2 className="text-lg font-semibold mb-3">{station.title}</h2>
          <p className="text-xs text-slate-400 mb-3">
            Выбери 2 варианта ({selected.length}/2)
          </p>
          <ul className="space-y-2 pb-2">
            {station.options.map((opt) => {
              const isSelected = selected.includes(opt.id)
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => toggleOption(opt.id)}
                    className={`w-full text-left rounded-xl p-3 border-2 transition-colors ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/20 text-white'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600 text-slate-200'
                    }`}
                  >
                    <span className="inline-block w-6 h-6 rounded-full border-2 border-current mr-2 align-middle text-xs leading-none flex items-center justify-center">
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt.text}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="shrink-0 pt-3 mt-2 border-t border-slate-700/80 bg-slate-900 flex gap-2 pb-[env(safe-area-inset-bottom,0px)]">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="py-3 min-h-11 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium text-base"
            >
              Назад
            </button>
          )}
          <button
            type="button"
            disabled={!canProceed || submitting}
            onClick={handleNext}
            className={`flex-1 py-3 min-h-11 rounded-lg font-medium text-base transition-colors ${
              canProceed && !submitting
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-slate-600 cursor-not-allowed text-slate-400'
            }`}
          >
            {submitting
              ? 'Сохранение...'
              : isLastStep
                ? 'Завершить и сохранить в ЛК'
                : 'Далее'}
          </button>
        </div>
      </div>
    </div>
  )
}

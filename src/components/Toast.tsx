import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { cx } from './styles'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }
  return context
}

const ICONS = { success: CheckCircle2, error: XCircle, info: Info }
const TONES = {
  success: 'border-green-200 text-green-600',
  error: 'border-rose-200 text-rose-600',
  info: 'border-indigo-200 text-indigo-600',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((item) => {
          const Icon = ICONS[item.type]
          return (
            <div
              key={item.id}
              className={cx(
                'animate-page pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg',
                TONES[item.type],
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-medium text-ink">{item.message}</p>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

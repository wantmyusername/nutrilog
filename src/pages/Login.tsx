import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Leaf, Lock } from 'lucide-react'
import { useAuth } from '../auth/context'
import { Button, Field } from '../components/ui'
import { inputClass } from '../components/styles'

export function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      await login(username.trim(), password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Usuario o contraseña incorrectos')
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white">
            <Leaf className="h-7 w-7" />
          </span>
          <h1 className="mt-6 text-2xl font-bold text-ink">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-muted">Panel de NutriLog</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          <Field label="Usuario">
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </Field>
          <Field label="Contraseña">
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          <Button type="submit" variant="primary" className="w-full" disabled={sending}>
            <Lock className="h-4 w-4" />
            {sending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}

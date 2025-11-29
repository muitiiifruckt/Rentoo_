import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Form, FormField } from '@/components/Form'

export default function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string>('')

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (data: Record<string, any>) => {
    setLoading(true)
    setError('')
    try {
      await register(data.email, data.name, data.password)
      // Небольшая задержка для обновления состояния AuthContext
      await new Promise(resolve => setTimeout(resolve, 500))
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось зарегистрироваться')
    } finally {
      setLoading(false)
    }
  }

  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Имя',
      type: 'text',
      placeholder: 'Ваше имя',
      required: true,
      min: 1,
      max: 100,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text',
      placeholder: 'your@email.com',
      required: true,
    },
    {
      name: 'password',
      label: 'Пароль',
      type: 'text',
      placeholder: 'Минимум 6 символов',
      required: true,
      min: 6,
      helperText: 'Минимум 6 символов',
      // Note: In a real app, you'd want a proper password input type
    },
  ]

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:px-6 lg:px-8">
      <div className="rounded-medium bg-surface p-8 shadow-card">
        <h1 className="mb-6 text-h1 font-bold text-text-primary">Регистрация</h1>

        {error && (
          <div className="mb-6 rounded-small bg-error/10 border border-error p-4" role="alert">
            <p className="text-body text-error">{error}</p>
          </div>
        )}

        <Form
          fields={fields}
          onSubmit={handleSubmit}
          submitLabel="Зарегистрироваться"
          loading={loading}
        />

        <div className="mt-6 text-center">
          <p className="text-small text-text-secondary">
            Уже есть аккаунт?{' '}
            <Link
              to="/login"
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-small"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


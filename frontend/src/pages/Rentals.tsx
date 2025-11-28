import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { rentalsAPI, Rental } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/Button'

export default function Rentals() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'all' | 'renter' | 'owner'>('all')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    loadRentals()
  }, [isAuthenticated, navigate, role])

  const loadRentals = async () => {
    setLoading(true)
    try {
      const data = await rentalsAPI.getRentals(role)
      setRentals(data)
    } catch (error) {
      console.error('Failed to load rentals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (rentalId: string, confirm: boolean) => {
    try {
      await rentalsAPI.confirmRental(rentalId, confirm)
      loadRentals()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Не удалось обновить заявку')
    }
  }

  const handleComplete = async (rentalId: string) => {
    try {
      await rentalsAPI.completeRental(rentalId)
      loadRentals()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Не удалось завершить аренду')
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Ожидает подтверждения',
      confirmed: 'Подтверждено',
      in_progress: 'В процессе',
      completed: 'Завершено',
      cancelled: 'Отменено',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
      <h1 className="mb-6 text-h1-lg font-bold text-text-primary">Мои аренды</h1>

      {/* Role Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setRole('all')}
          className={`rounded-small px-4 py-2 text-small transition-colors ${
            role === 'all'
              ? 'bg-primary text-white'
              : 'bg-surface text-text-primary hover:bg-background'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setRole('renter')}
          className={`rounded-small px-4 py-2 text-small transition-colors ${
            role === 'renter'
              ? 'bg-primary text-white'
              : 'bg-surface text-text-primary hover:bg-background'
          }`}
        >
          Я арендатор
        </button>
        <button
          onClick={() => setRole('owner')}
          className={`rounded-small px-4 py-2 text-small transition-colors ${
            role === 'owner'
              ? 'bg-primary text-white'
              : 'bg-surface text-text-primary hover:bg-background'
          }`}
        >
          Я владелец
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-medium bg-surface" />
          ))}
        </div>
      ) : rentals.length === 0 ? (
        <div className="rounded-medium bg-surface p-8 text-center">
          <p className="text-body text-text-secondary">У вас пока нет аренд</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental) => (
            <div
              key={rental.id}
              className="rounded-medium bg-surface p-6 shadow-card"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-small px-2 py-1 text-small ${getStatusColor(
                        rental.status
                      )}`}
                    >
                      {getStatusLabel(rental.status)}
                    </span>
                  </div>
                  <p className="text-body text-text-primary">
                    Период: {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                  </p>
                  <p className="text-body font-semibold text-primary">
                    {formatPrice(rental.total_price)}
                  </p>
                </div>

                <div className="flex gap-2">
                  {rental.status === 'pending' && role === 'owner' && (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => handleConfirm(rental.id, true)}
                      >
                        Подтвердить
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleConfirm(rental.id, false)}
                      >
                        Отклонить
                      </Button>
                    </>
                  )}
                  {(rental.status === 'confirmed' || rental.status === 'in_progress') && (
                    <Button
                      variant="primary"
                      onClick={() => handleComplete(rental.id)}
                    >
                      Завершить
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/items/${rental.item_id}`)}
                  >
                    Посмотреть товар
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


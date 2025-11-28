import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Calendar, User, ArrowLeft } from 'lucide-react'
import { Item, itemsAPI, rentalsAPI, usersAPI, User as UserType } from '@/lib/api'
import { formatPrice, formatDate, getImageUrl } from '@/lib/utils'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Form, FormField } from '@/components/Form'

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<Item | null>(null)
  const [owner, setOwner] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRentModal, setShowRentModal] = useState(false)
  const [renting, setRenting] = useState(false)

  useEffect(() => {
    if (!id) return

    loadItem()
  }, [id])

  const loadItem = async () => {
    if (!id) return

    setLoading(true)
    try {
      const itemData = await itemsAPI.getItem(id)
      setItem(itemData)

      // Load owner info
      if (itemData.owner_id) {
        try {
          const ownerData = await usersAPI.getUser(itemData.owner_id)
          setOwner(ownerData)
        } catch (error) {
          console.error('Failed to load owner:', error)
        }
      }
    } catch (error) {
      console.error('Failed to load item:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRent = async (data: Record<string, any>) => {
    if (!item || !id) return

    setRenting(true)
    try {
      await rentalsAPI.createRental({
        item_id: id,
        start_date: data.start_date,
        end_date: data.end_date,
      })
      setShowRentModal(false)
      navigate('/rentals')
      // You could show a success toast here
    } catch (error: any) {
      console.error('Failed to create rental:', error)
      alert(error.response?.data?.detail || 'Не удалось создать заявку на аренду')
    } finally {
      setRenting(false)
    }
  }

  const rentFields: FormField[] = [
    {
      name: 'start_date',
      label: 'Дата начала',
      type: 'date',
      required: true,
    },
    {
      name: 'end_date',
      label: 'Дата окончания',
      type: 'date',
      required: true,
    },
  ]

  if (loading) {
    return (
      <div className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
        <div className="h-96 animate-pulse rounded-medium bg-surface" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
        <div className="rounded-medium bg-surface p-8 text-center">
          <p className="text-body text-text-secondary">Товар не найден</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
            Вернуться на главную
          </Button>
        </div>
      </div>
    )
  }

  const mainImage = item.images && item.images.length > 0 ? item.images[0] : null
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          {mainImage && (
            <div className="aspect-[4/3] overflow-hidden rounded-medium bg-background">
              <img
                src={getImageUrl(mainImage)}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {item.images && item.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {item.images.slice(1, 5).map((image, index) => (
                <div
                  key={index}
                  className="aspect-square overflow-hidden rounded-small bg-background"
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${item.title} ${index + 2}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="mb-2 text-h1-lg font-bold text-text-primary">{item.title}</h1>
            <div className="flex items-center gap-4 text-body text-text-secondary">
              {item.location?.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{item.location.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-medium bg-surface p-6">
            <div className="mb-4">
              <div className="text-h2 font-semibold text-primary">
                {formatPrice(item.price_per_day)}
                <span className="text-body font-normal text-text-secondary"> /день</span>
              </div>
              {item.price_per_week && (
                <div className="text-small text-text-secondary">
                  {formatPrice(item.price_per_week)} /неделя
                </div>
              )}
              {item.price_per_month && (
                <div className="text-small text-text-secondary">
                  {formatPrice(item.price_per_month)} /месяц
                </div>
              )}
            </div>

            {item.status === 'active' && (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setShowRentModal(true)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Арендовать
              </Button>
            )}
          </div>

          {/* Owner */}
          {owner && (
            <div className="rounded-medium bg-surface p-6">
              <h3 className="mb-4 text-h3 font-semibold text-text-primary">Владелец</h3>
              <div className="flex items-center gap-3">
                {owner.avatar_url ? (
                  <img
                    src={getImageUrl(owner.avatar_url)}
                    alt={owner.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                    <User className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <p className="text-body font-medium text-text-primary">{owner.name}</p>
                  <p className="text-small text-text-secondary">{owner.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="rounded-medium bg-surface p-6">
            <h3 className="mb-4 text-h3 font-semibold text-text-primary">Описание</h3>
            <p className="text-body text-text-secondary whitespace-pre-wrap">{item.description}</p>
          </div>

          {/* Parameters */}
          {item.parameters && Object.keys(item.parameters).length > 0 && (
            <div className="rounded-medium bg-surface p-6">
              <h3 className="mb-4 text-h3 font-semibold text-text-primary">Характеристики</h3>
              <dl className="space-y-2">
                {Object.entries(item.parameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-border-subtle pb-2">
                    <dt className="text-small font-medium text-text-secondary">{key}</dt>
                    <dd className="text-small text-text-primary">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Rent Modal */}
      <Modal
        isOpen={showRentModal}
        onClose={() => setShowRentModal(false)}
        title="Арендовать товар"
        size="md"
      >
        <Form
          fields={rentFields}
          onSubmit={handleRent}
          submitLabel="Отправить заявку"
          loading={renting}
          initialData={{
            start_date: today,
            end_date: today,
          }}
        />
      </Modal>
    </div>
  )
}


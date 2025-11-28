import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usersAPI, itemsAPI, Item } from '@/lib/api'
import { ItemCard } from '@/components/ItemCard'
import { Grid } from '@/components/Grid'
import { Button } from '@/components/Button'
import { User } from 'lucide-react'

export default function Profile() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [myItems, setMyItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    loadMyItems()
  }, [isAuthenticated, navigate])

  const loadMyItems = async () => {
    setLoading(true)
    try {
      const data = await itemsAPI.getMyItems()
      console.log('Loaded my items:', data)
      // Double-check normalization
      const normalized = data.map(item => {
        const id = item.id || (item as any)._id
        return { ...item, id: id || '' }
      })
      setMyItems(normalized)
    } catch (error) {
      console.error('Failed to load items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = (item: Item) => {
    console.log('Item clicked:', item)
    console.log('Item ID:', item.id)
    if (!item.id) {
      console.error('Item has no ID!', item)
      alert('Ошибка: товар не имеет ID. Попробуйте обновить страницу.')
      return
    }
    navigate(`/items/${item.id}`)
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8 rounded-medium bg-surface p-6 shadow-card">
        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
              <User className="h-8 w-8" />
            </div>
          )}
          <div>
            <h1 className="text-h1-lg font-bold text-text-primary">{user.name}</h1>
            <p className="text-body text-text-secondary">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-text-primary">Мои товары</h2>
        <Button variant="primary" onClick={() => navigate('/items/new')}>
          Добавить товар
        </Button>
      </div>

      <Grid loading={loading} emptyMessage="У вас пока нет товаров">
        {myItems.map((item) => {
          // Ensure item has an ID before rendering
          const itemId = item.id || (item as any)._id
          if (!itemId) {
            console.error('Item missing ID:', item)
            return null
          }
          return (
            <ItemCard 
              key={itemId} 
              item={{ ...item, id: itemId }} 
              onClick={handleItemClick} 
            />
          )
        })}
      </Grid>
    </div>
  )
}


import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usersAPI, itemsAPI, Item } from '@/lib/api'
import { ItemCard } from '@/components/ItemCard'
import { Grid } from '@/components/Grid'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { User, Trash2 } from 'lucide-react'

export default function Profile() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [myItems, setMyItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (user) {
      loadMyItems()
    }
  }, [isAuthenticated, user, navigate])

  const loadMyItems = async () => {
    setLoading(true)
    try {
      const data = await itemsAPI.getMyItems()
      console.log('Loaded my items:', data)
      // Double-check normalization and filter out items without ID
      const normalized = data.map(item => {
        const id = item.id || (item as any)._id
        return { ...item, id: id ? String(id) : '' }
      }).filter(item => item.id) // Filter out items without ID
      setMyItems(normalized)
    } catch (error) {
      console.error('Failed to load items:', error)
      setMyItems([]) // Set empty array on error
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

  const handleDeleteClick = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation()
    if (!item.id) {
      console.error('Item has no ID!', item)
      alert('Ошибка: товар не имеет ID. Попробуйте обновить страницу.')
      return
    }
    setItemToDelete(item)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !itemToDelete.id) {
      console.error('No item to delete')
      return
    }

    setDeleting(true)
    try {
      console.log('Deleting item:', itemToDelete.id)
      await itemsAPI.deleteItem(itemToDelete.id)
      console.log('Item deleted successfully')
      
      // Remove item from list
      setMyItems((prev) => prev.filter((item) => item.id !== itemToDelete.id))
      
      // Close modal
      setDeleteModalOpen(false)
      setItemToDelete(null)
    } catch (error: any) {
      console.error('Failed to delete item:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Не удалось удалить товар'
      alert(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setItemToDelete(null)
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
        <div className="h-96 animate-pulse rounded-medium bg-surface" />
      </div>
    )
  }

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
            <div key={itemId} className="relative group">
              <ItemCard 
                item={{ ...item, id: itemId }} 
                onClick={handleItemClick} 
              />
              <button
                onClick={(e) => handleDeleteClick(e, { ...item, id: itemId })}
                className="absolute top-2 right-2 z-10 rounded-small bg-error/90 p-2 text-white opacity-0 transition-opacity duration-hover hover:bg-error focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 group-hover:opacity-100"
                aria-label={`Удалить ${item.title}`}
                title="Удалить товар"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </Grid>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        title="Удалить товар"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-body text-text-primary">
            Вы уверены, что хотите удалить товар <strong>"{itemToDelete?.title}"</strong>?
          </p>
          <p className="text-small text-text-secondary">
            Это действие нельзя отменить. Все данные о товаре будут удалены безвозвратно.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleting}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


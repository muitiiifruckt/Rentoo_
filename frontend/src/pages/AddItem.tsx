import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { itemsAPI, categoriesAPI, Category, ItemCreate } from '@/lib/api'
import { Form, FormField } from '@/components/Form'

export default function AddItem() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    loadCategories()
  }, [isAuthenticated, navigate])

  const loadCategories = async () => {
    setCategoriesLoading(true)
    try {
      const data = await categoriesAPI.getCategories()
      console.log('Loaded categories:', data)
      setCategories(data)
      if (data.length === 0) {
        console.warn('No categories found in database')
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
      // Show error to user
      alert('Не удалось загрузить категории. Проверьте подключение к серверу.')
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleSubmit = async (data: Record<string, any>) => {
    setLoading(true)
    try {
      // Upload images first
      const imageFiles = data.images || []
      const imageUrls: string[] = []

      if (imageFiles.length > 0) {
        setUploadingImages(true)
        // For now, we'll create the item first, then upload images
        // In a real app, you might want to upload to a temporary location first
      }

      // Create item
      const itemData: ItemCreate = {
        title: data.title,
        description: data.description,
        category: data.category,
        price_per_day: Number(data.price_per_day),
        price_per_week: data.price_per_week ? Number(data.price_per_week) : undefined,
        price_per_month: data.price_per_month ? Number(data.price_per_month) : undefined,
        location: data.location_address
          ? {
              address: data.location_address,
            }
          : undefined,
        parameters: data.parameters ? JSON.parse(data.parameters) : undefined,
        images: imageUrls,
      }

      const newItem = await itemsAPI.createItem(itemData)

      // Upload images after item creation
      if (imageFiles.length > 0) {
        setUploadingImages(true)
        try {
          for (const file of imageFiles) {
            if (file instanceof File) {
              await itemsAPI.uploadImage(newItem.id, file)
            }
          }
        } catch (error) {
          console.error('Failed to upload some images:', error)
        } finally {
          setUploadingImages(false)
        }
      }

      navigate(`/items/${newItem.id}`)
    } catch (error: any) {
      console.error('Failed to create item:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.slug,
      label: cat.name,
    }))
  }, [categories])

  const fields: FormField[] = useMemo(() => [
    {
      name: 'title',
      label: 'Название',
      type: 'text',
      placeholder: 'Например: Велосипед горный',
      required: true,
      min: 1,
      max: 200,
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      placeholder: 'Опишите ваш товар...',
      required: true,
      helperText: 'Опишите состояние, особенности использования и другие важные детали',
    },
    {
      name: 'category',
      label: 'Категория',
      type: 'select',
      required: true,
      options: categoryOptions,
    },
    {
      name: 'price_per_day',
      label: 'Цена за день (₽)',
      type: 'number',
      placeholder: '0',
      required: true,
      min: 0,
    },
    {
      name: 'price_per_week',
      label: 'Цена за неделю (₽)',
      type: 'number',
      placeholder: 'Опционально',
      min: 0,
    },
    {
      name: 'price_per_month',
      label: 'Цена за месяц (₽)',
      type: 'number',
      placeholder: 'Опционально',
      min: 0,
    },
    {
      name: 'location_address',
      label: 'Адрес',
      type: 'text',
      placeholder: 'Город, улица, дом',
    },
    {
      name: 'images',
      label: 'Фотографии',
      type: 'file',
      accept: 'image/jpeg,image/png,image/webp',
      multiple: true,
      helperText: 'Загрузите фотографии товара (до 10 файлов)',
    },
    {
      name: 'parameters',
      label: 'Характеристики (JSON)',
      type: 'textarea',
      placeholder: '{"размер": "L", "цвет": "синий"}',
      helperText: 'Опционально. Укажите дополнительные характеристики в формате JSON',
    },
  ], [categoryOptions])

  if (categoriesLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 lg:px-8">
        <h1 className="mb-8 text-h1-lg font-bold text-text-primary">Добавить товар</h1>
        <div className="rounded-medium bg-surface p-8 text-center">
          <p className="text-body text-text-secondary">Загрузка категорий...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 lg:px-8">
      <h1 className="mb-8 text-h1-lg font-bold text-text-primary">Добавить товар</h1>
      {categories.length === 0 ? (
        <div className="rounded-medium bg-surface p-8 text-center">
          <p className="mb-4 text-body text-text-secondary">
            Категории не загружены. Пожалуйста, обновите страницу или проверьте подключение к серверу.
          </p>
          <button
            onClick={loadCategories}
            className="rounded-small bg-primary px-4 py-2 text-body text-white hover:bg-primary/90"
          >
            Попробовать снова
          </button>
        </div>
      ) : (
        <Form
          fields={fields}
          onSubmit={handleSubmit}
          submitLabel={uploadingImages ? 'Загрузка изображений...' : 'Создать объявление'}
          loading={loading || uploadingImages}
        />
      )}
    </div>
  )
}


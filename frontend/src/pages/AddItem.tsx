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
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    loadCategories()
  }, [isAuthenticated, navigate])

  const loadCategories = async () => {
    setCategoriesLoading(true)
    setCategoriesError(null)
    try {
      const data = await categoriesAPI.getCategories()
      console.log('Loaded categories:', data)
      setCategories(data)
      if (data.length === 0) {
        console.warn('No categories found in database')
        setCategoriesError('В базе данных нет категорий. Пожалуйста, создайте категории через админ-панель или API.')
      }
    } catch (error: any) {
      console.error('Failed to load categories:', error)
      // Log detailed error for debugging
      let errorMessage = 'Не удалось загрузить категории.'
      
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
        errorMessage = `Ошибка сервера: ${error.response.status}. ${error.response.data?.detail || 'Проверьте подключение к серверу.'}`
      } else if (error.request) {
        console.error('Request made but no response received:', error.request)
        errorMessage = 'Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен на http://localhost:8000'
      } else {
        console.error('Error setting up request:', error.message)
        errorMessage = `Ошибка: ${error.message}`
      }
      
      setCategoriesError(errorMessage)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleSubmit = async (data: Record<string, any>) => {
    setLoading(true)
    try {
      const imageFiles = data.images || []
      const imageUrls: string[] = []

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
        parameters: data.parameters && data.parameters.trim() ? (() => {
          try {
            return JSON.parse(data.parameters)
          } catch (e) {
            console.warn('Invalid JSON in parameters field:', e)
            return undefined
          }
        })() : undefined,
        images: imageUrls,
      }

      const newItem = await itemsAPI.createItem(itemData)
      console.log('Created item response:', newItem)
      
      // Item ID should be normalized by API client
      const itemId = newItem.id
      if (!itemId) {
        console.error('Item ID not found in response:', newItem)
        throw new Error('Не удалось получить ID созданного товара. Попробуйте обновить страницу.')
      }
      
      console.log('Using item ID:', itemId)

      // Upload images after item creation
      if (imageFiles.length > 0 && imageFiles[0] instanceof File) {
        setUploadingImages(true)
        try {
          for (const file of imageFiles) {
            if (file instanceof File) {
              console.log('Uploading image for item:', itemId)
              await itemsAPI.uploadImage(itemId, file)
            }
          }
        } catch (error: any) {
          console.error('Failed to upload some images:', error)
          // Don't throw - images are optional, but show warning
          alert('Товар создан, но не удалось загрузить некоторые изображения. Вы можете добавить их позже.')
        } finally {
          setUploadingImages(false)
        }
      }

      navigate(`/items/${itemId}`)
    } catch (error: any) {
      console.error('Failed to create item:', error)
      // Show user-friendly error message
      const errorMessage = error.response?.data?.detail || error.message || 'Не удалось создать товар'
      alert(errorMessage)
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
      {categories.length === 0 && !categoriesLoading ? (
        <div className="rounded-medium bg-surface p-8 text-center">
          <p className="mb-4 text-body text-text-secondary">
            {categoriesError || 'Категории не загружены. Пожалуйста, обновите страницу или проверьте подключение к серверу.'}
          </p>
          <button
            onClick={loadCategories}
            className="rounded-small bg-primary px-4 py-2 text-body text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Попробовать снова
          </button>
        </div>
      ) : categories.length > 0 ? (
        <Form
          fields={fields}
          onSubmit={handleSubmit}
          submitLabel={uploadingImages ? 'Загрузка изображений...' : 'Создать объявление'}
          loading={loading || uploadingImages}
        />
      ) : null}
    </div>
  )
}


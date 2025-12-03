import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { itemsAPI, categoriesAPI, Category, ItemCreate } from '@/lib/api'
import { Form, FormField } from '@/components/Form'

export default function AddItem() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  useEffect(() => {
    // Ждем, пока AuthContext загрузится (authLoading === false)
    // Не перенаправляем сразу, если еще идет загрузка
    if (authLoading) {
      return
    }
    
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    loadCategories()
  }, [isAuthenticated, navigate, authLoading])

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
    console.log('🚀 [AddItem] handleSubmit called with data:', {
      ...data,
      images: data.images ? (Array.isArray(data.images) ? `${data.images.length} files` : '1 file') : 'no images'
    })
    
    setLoading(true)
    try {
      const imageFiles = data.images || []
      console.log('🚀 [AddItem] Image files from form:', {
        count: imageFiles.length,
        files: imageFiles.map((f: any) => f instanceof File ? {
          name: f.name,
          type: f.type,
          size: f.size
        } : f)
      })
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

      console.log('🚀 [AddItem] Creating item with data:', { ...itemData, images: '[] (empty)' })
      const newItem = await itemsAPI.createItem(itemData)
      console.log('🚀 [AddItem] ✅ Item created, response:', newItem)
      
      // Item ID should be normalized by API client
      const itemId = newItem.id
      if (!itemId) {
        console.error('🚀 [AddItem] ❌ Item ID not found in response:', newItem)
        throw new Error('Не удалось получить ID созданного товара. Попробуйте обновить страницу.')
      }
      
      console.log('🚀 [AddItem] ✅ Using item ID:', itemId)

      // Upload images after item creation
      if (imageFiles.length > 0) {
        console.log('🚀 [AddItem] Starting image upload process...')
        console.log('🚀 [AddItem] First file check:', {
          isFile: imageFiles[0] instanceof File,
          type: typeof imageFiles[0],
          value: imageFiles[0]
        })
        
        if (imageFiles[0] instanceof File) {
          setUploadingImages(true)
          try {
            for (let i = 0; i < imageFiles.length; i++) {
              const file = imageFiles[i]
              if (file instanceof File) {
                console.log(`🚀 [AddItem] Uploading image ${i + 1}/${imageFiles.length}:`, {
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  itemId
                })
                const result = await itemsAPI.uploadImage(itemId, file)
                console.log(`🚀 [AddItem] ✅ Image ${i + 1} uploaded successfully:`, result)
              } else {
                console.warn(`🚀 [AddItem] ⚠️ Skipping non-File object at index ${i}:`, file)
              }
            }
            console.log('🚀 [AddItem] ✅ All images uploaded successfully')
          } catch (error: any) {
            console.error('🚀 [AddItem] ❌ Failed to upload some images:', {
              error,
              message: error.message,
              response: error.response?.data,
              status: error.response?.status
            })
            // Don't throw - images are optional, but show warning
            alert('Товар создан, но не удалось загрузить некоторые изображения. Вы можете добавить их позже.')
          } finally {
            setUploadingImages(false)
          }
        } else {
          console.warn('🚀 [AddItem] ⚠️ First image is not a File instance:', imageFiles[0])
        }
      } else {
        console.log('🚀 [AddItem] No images to upload')
      }

      console.log('🚀 [AddItem] ✅ Navigation to item page:', itemId)
      navigate(`/items/${itemId}`)
    } catch (error: any) {
      console.error('🚀 [AddItem] ❌ Failed to create item:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
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

  // Показываем загрузку, если проверяется авторизация или загружаются категории
  if (authLoading || categoriesLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 lg:px-8">
        <h1 className="mb-8 text-h1-lg font-bold text-text-primary">Добавить товар</h1>
        <div className="rounded-medium bg-surface p-8 text-center">
          <p className="text-body text-text-secondary">
            {authLoading ? 'Проверка авторизации...' : 'Загрузка категорий...'}
          </p>
        </div>
      </div>
    )
  }
  
  // Если не авторизован, не показываем ничего (будет редирект)
  if (!isAuthenticated) {
    return null
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


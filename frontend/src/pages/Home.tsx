import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ItemCard } from '@/components/ItemCard'
import { Grid } from '@/components/Grid'
import { itemsAPI, categoriesAPI, Item, Category, ItemSearch } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFilters, setSearchFilters] = useState<ItemSearch>({
    query: searchParams.get('query') || undefined,
    category: searchParams.get('category') || undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  useEffect(() => {
    // Load categories
    categoriesAPI
      .getCategories()
      .then(setCategories)
      .catch(console.error)

    // Load items
    loadItems()
  }, [])

  useEffect(() => {
    loadItems()
  }, [searchFilters])

  const loadItems = async () => {
    setLoading(true)
    try {
      const data = await itemsAPI.getItems(searchFilters)
      setItems(data)
    } catch (error) {
      console.error('Failed to load items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRent = (item: Item) => {
    navigate(`/items/${item.id}`)
  }

  const handleItemClick = (item: Item) => {
    navigate(`/items/${item.id}`)
  }

  const handleCategoryChange = (category: string) => {
    const newFilters = { ...searchFilters, category: category || undefined }
    setSearchFilters(newFilters)
    navigate(`/?category=${category || ''}`, { replace: true })
  }

  return (
    <div className="mx-auto max-w-container px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-4 text-h1-lg font-bold text-text-primary">Аренда вещей</h1>
        
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange('')}
              className={`rounded-small px-4 py-2 text-small transition-colors ${
                !searchFilters.category
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-primary hover:bg-background'
              }`}
            >
              Все категории
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`rounded-small px-4 py-2 text-small transition-colors ${
                  searchFilters.category === cat.slug
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-primary hover:bg-background'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <Grid loading={loading} emptyMessage="Товары не найдены">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onRent={handleRent}
            onClick={handleItemClick}
          />
        ))}
      </Grid>
    </div>
  )
}


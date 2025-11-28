import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemCard } from '../ItemCard'
import { Item } from '@/lib/api'

const mockItem: Item = {
  id: '1',
  owner_id: 'owner1',
  title: 'Test Item',
  description: 'This is a test item description',
  category: 'electronics',
  price_per_day: 1000,
  images: ['/test-image.jpg'],
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('ItemCard', () => {
  it('renders item information correctly', () => {
    render(<ItemCard item={mockItem} />)
    
    expect(screen.getByText('Test Item')).toBeInTheDocument()
    expect(screen.getByText(/This is a test item description/)).toBeInTheDocument()
    expect(screen.getByText(/1 000 ₽/)).toBeInTheDocument()
    expect(screen.getByText('Арендовать')).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<ItemCard item={mockItem} onClick={handleClick} />)
    
    const card = screen.getByRole('button', { name: /Test Item/ })
    await user.click(card)
    
    expect(handleClick).toHaveBeenCalledWith(mockItem)
  })

  it('calls onRent when rent button is clicked', async () => {
    const user = userEvent.setup()
    const handleRent = vi.fn()
    
    render(<ItemCard item={mockItem} onRent={handleRent} />)
    
    const rentButton = screen.getByRole('button', { name: /Арендовать/ })
    await user.click(rentButton)
    
    expect(handleRent).toHaveBeenCalledWith(mockItem)
  })

  it('does not show rent button for inactive items', () => {
    const inactiveItem = { ...mockItem, status: 'inactive' as const }
    
    render(<ItemCard item={inactiveItem} />)
    
    expect(screen.queryByText('Арендовать')).not.toBeInTheDocument()
  })

  it('shows placeholder when no image is provided', () => {
    const itemWithoutImage = { ...mockItem, images: [] }
    
    render(<ItemCard item={itemWithoutImage} />)
    
    // The placeholder icon should be rendered
    const imageContainer = screen.getByAltText('Test Item').closest('div')
    expect(imageContainer).toBeInTheDocument()
  })

  it('is keyboard accessible', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<ItemCard item={mockItem} onClick={handleClick} />)
    
    const card = screen.getByRole('button', { name: /Test Item/ })
    card.focus()
    await user.keyboard('{Enter}')
    
    expect(handleClick).toHaveBeenCalled()
  })
})


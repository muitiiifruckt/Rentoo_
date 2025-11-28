import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form, FormField } from '../Form'

const mockFields: FormField[] = [
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    required: true,
    min: 1,
    max: 100,
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
  },
  {
    name: 'price',
    label: 'Price',
    type: 'number',
    required: true,
    min: 0,
  },
]

describe('Form', () => {
  it('renders all form fields', () => {
    const handleSubmit = vi.fn()
    
    render(<Form fields={mockFields} onSubmit={handleSubmit} />)
    
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Price')).toBeInTheDocument()
  })

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    
    render(<Form fields={mockFields} onSubmit={handleSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /Сохранить/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/обязательно для заполнения/)).toBeInTheDocument()
    })
    
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('validates minimum length', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    
    render(<Form fields={mockFields} onSubmit={handleSubmit} />)
    
    const titleInput = screen.getByLabelText('Title')
    await user.type(titleInput, '')
    
    const submitButton = screen.getByRole('button', { name: /Сохранить/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/обязательно для заполнения/)).toBeInTheDocument()
    })
  })

  it('validates number fields', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    
    render(<Form fields={mockFields} onSubmit={handleSubmit} />)
    
    const priceInput = screen.getByLabelText('Price')
    await user.type(priceInput, '-10')
    
    const submitButton = screen.getByRole('button', { name: /Сохранить/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Минимальное значение/)).toBeInTheDocument()
    })
  })

  it('calls onSubmit with form data when valid', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn().mockResolvedValue(undefined)
    
    render(<Form fields={mockFields} onSubmit={handleSubmit} />)
    
    await user.type(screen.getByLabelText('Title'), 'Test Title')
    await user.type(screen.getByLabelText('Description'), 'Test Description')
    await user.type(screen.getByLabelText('Price'), '100')
    
    const submitButton = screen.getByRole('button', { name: /Сохранить/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Test Title',
        description: 'Test Description',
        price: 100,
      })
    })
  })

  it('shows loading state', () => {
    const handleSubmit = vi.fn()
    
    render(<Form fields={mockFields} onSubmit={handleSubmit} loading={true} />)
    
    const submitButton = screen.getByRole('button', { name: /Сохранить/ })
    expect(submitButton).toBeDisabled()
  })

  it('clears error when user starts typing', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    
    render(<Form fields={mockFields} onSubmit={handleSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /Сохранить/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/обязательно для заполнения/)).toBeInTheDocument()
    })
    
    const titleInput = screen.getByLabelText('Title')
    await user.type(titleInput, 'Test')
    
    await waitFor(() => {
      expect(screen.queryByText(/обязательно для заполнения/)).not.toBeInTheDocument()
    })
  })
})


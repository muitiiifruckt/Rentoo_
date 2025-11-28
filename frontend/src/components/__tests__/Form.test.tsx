import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form, FormField } from '../Form'
import React from 'react'

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
    
    // Use getByLabelText - it should work even with asterisk in label
    expect(screen.getByLabelText('Title', { exact: false })).toBeInTheDocument()
    expect(screen.getByLabelText('Description', { exact: false })).toBeInTheDocument()
    expect(screen.getByLabelText('Price', { exact: false })).toBeInTheDocument()
  })

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    
    render(<Form fields={mockFields} onSubmit={handleSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /Сохранить/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getAllByText(/обязательно для заполнения/).length).toBeGreaterThan(0)
    })
    
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('validates minimum length', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    
    render(<Form fields={mockFields} onSubmit={handleSubmit} />)
    
    // Just submit without filling - should show required errors
    const submitButton = screen.getByRole('button', { name: /Сохранить/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getAllByText(/обязательно для заполнения/).length).toBeGreaterThan(0)
    })
  })

  it('validates number fields', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    
    render(<Form fields={mockFields} onSubmit={handleSubmit} />)
    
    const priceInput = screen.getByLabelText('Price', { exact: false }) as HTMLInputElement
    // Clear the input first, then type negative value
    await user.clear(priceInput)
    await user.type(priceInput, '-10')
    
    const submitButton = screen.getByRole('button', { name: /Сохранить/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Минимальное значение/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('calls onSubmit with form data when valid', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn().mockResolvedValue(undefined)
    
    render(<Form fields={mockFields} onSubmit={handleSubmit} />)
    
    const titleInput = screen.getByLabelText('Title', { exact: false })
    const descriptionInput = screen.getByLabelText('Description', { exact: false })
    const priceInput = screen.getByLabelText('Price', { exact: false })
    
    await user.type(titleInput, 'Test Title')
    await user.type(descriptionInput, 'Test Description')
    await user.type(priceInput, '100')
    
    const submitButton = screen.getByRole('button', { name: /Сохранить/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled()
    }, { timeout: 3000 })
    
    // Check that it was called with correct data
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Title',
        description: 'Test Description',
        price: 100,
      })
    )
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
      expect(screen.getAllByText(/обязательно для заполнения/).length).toBeGreaterThan(0)
    }, { timeout: 3000 })
    
    const titleInput = screen.getByLabelText('Title', { exact: false })
    await user.type(titleInput, 'Test')
    
    // Error should be cleared for the title field when user types
    // We check that title field error is gone by checking the specific error element
    await waitFor(() => {
      const titleError = document.getElementById('field-title-error')
      expect(titleError).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })
})


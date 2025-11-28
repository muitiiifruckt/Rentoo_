import React, { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

export interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'file' | 'date'
  placeholder?: string
  required?: boolean
  min?: number
  max?: number
  options?: { value: string; label: string }[]
  accept?: string
  multiple?: boolean
  helperText?: string
}

export interface FormProps {
  fields: FormField[]
  onSubmit: (data: Record<string, any>) => Promise<void> | void
  initialData?: Record<string, any>
  submitLabel?: string
  loading?: boolean
  className?: string
}

/**
 * Form component with validation and file upload support
 * 
 * Features:
 * - Client-side validation
 * - File upload with preview
 * - Error handling
 * - Accessible labels and error messages
 * 
 * @param fields - Form field definitions
 * @param onSubmit - Submit handler
 * @param initialData - Initial form values
 * @param submitLabel - Submit button text
 * @param loading - Loading state
 */
export const Form: React.FC<FormProps> = ({
  fields,
  onSubmit,
  initialData = {},
  submitLabel = 'Сохранить',
  loading = false,
  className,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imagePreviews, setImagePreviews] = useState<Record<string, string[]>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement>>({})

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return 'Это поле обязательно для заполнения'
    }

    if (field.type === 'number' && value !== undefined && value !== '') {
      const numValue = Number(value)
      if (isNaN(numValue)) {
        return 'Введите корректное число'
      }
      if (field.min !== undefined && numValue < field.min) {
        return `Минимальное значение: ${field.min}`
      }
      if (field.max !== undefined && numValue > field.max) {
        return `Максимальное значение: ${field.max}`
      }
    }

    if (field.type === 'text' && value && typeof value === 'string') {
      if (field.min && value.length < field.min) {
        return `Минимум ${field.min} символов`
      }
      if (field.max && value.length > field.max) {
        return `Максимум ${field.max} символов`
      }
    }

    return null
  }

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleFileChange = (name: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const field = fields.find((f) => f.name === name)
    
    // Validate file types
    if (field?.accept) {
      const acceptedTypes = field.accept.split(',').map((t) => t.trim())
      const invalidFiles = fileArray.filter(
        (file) => !acceptedTypes.some((type) => file.type.match(type.replace('*', '.*')))
      )
      if (invalidFiles.length > 0) {
        setErrors((prev) => ({
          ...prev,
          [name]: `Недопустимый тип файла. Разрешены: ${field.accept}`,
        }))
        return
      }
    }

    // Create previews for images
    const imageFiles = fileArray.filter((file) => file.type.startsWith('image/'))
    const previews: string[] = []
    
    imageFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        previews.push(result)
        if (previews.length === imageFiles.length) {
          setImagePreviews((prev) => ({ ...prev, [name]: previews }))
        }
      }
      reader.readAsDataURL(file)
    })

    // Store files
    if (field?.multiple) {
      const existingFiles = formData[name] || []
      setFormData((prev) => ({
        ...prev,
        [name]: [...existingFiles, ...fileArray],
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: fileArray[0] }))
      setImagePreviews((prev) => ({ ...prev, [name]: previews.slice(0, 1) }))
    }
  }

  const removeImage = (name: string, index: number) => {
    const field = fields.find((f) => f.name === name)
    if (field?.multiple) {
      const files = formData[name] || []
      const newFiles = files.filter((_: any, i: number) => i !== index)
      setFormData((prev) => ({ ...prev, [name]: newFiles }))
      setImagePreviews((prev) => ({
        ...prev,
        [name]: (prev[name] || []).filter((_: string, i: number) => i !== index),
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: null }))
      setImagePreviews((prev) => ({ ...prev, [name]: [] }))
      if (fileInputRefs.current[name]) {
        fileInputRefs.current[name].value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const newErrors: Record<string, string> = {}
    fields.forEach((field) => {
      const value = formData[field.name]
      const error = validateField(field, value)
      if (error) {
        newErrors[field.name] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Focus first error field
      const firstErrorField = fields.find((f) => newErrors[f.name])
      if (firstErrorField) {
        const input = document.querySelector(`[name="${firstErrorField.name}"]`) as HTMLElement
        input?.focus()
      }
      return
    }

    try {
      await onSubmit(formData)
    } catch (error: any) {
      // Handle server errors
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          // General error
          setErrors({ _general: detail })
        } else if (Array.isArray(detail)) {
          // Field-specific errors
          const fieldErrors: Record<string, string> = {}
          detail.forEach((err: any) => {
            if (err.loc && err.loc.length > 1) {
              fieldErrors[err.loc[1]] = err.msg
            }
          })
          setErrors(fieldErrors)
        }
      }
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.name]
    const error = errors[field.name]
    const fieldId = `field-${field.name}`

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name} className="space-y-1">
            <label htmlFor={fieldId} className="block text-small font-medium text-text-primary">
              {field.label}
              {field.required && <span className="text-error"> *</span>}
            </label>
            <textarea
              id={fieldId}
              name={field.name}
              value={value || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              className={cn(
                'w-full rounded-small border border-border-subtle bg-background px-4 py-2 text-body text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
                error && 'border-error'
              )}
              aria-invalid={!!error}
              aria-describedby={error ? `${fieldId}-error` : field.helperText ? `${fieldId}-helper` : undefined}
            />
            {error && (
              <p id={`${fieldId}-error`} className="text-small text-error" role="alert">
                {error}
              </p>
            )}
            {!error && field.helperText && (
              <p id={`${fieldId}-helper`} className="text-small text-text-secondary">
                {field.helperText}
              </p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.name} className="space-y-1">
            <label htmlFor={fieldId} className="block text-small font-medium text-text-primary">
              {field.label}
              {field.required && <span className="text-error"> *</span>}
            </label>
            <select
              id={fieldId}
              name={field.name}
              value={value || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              className={cn(
                'w-full rounded-small border border-border-subtle bg-background px-4 py-2 text-body text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
                error && 'border-error'
              )}
              aria-invalid={!!error}
              aria-describedby={error ? `${fieldId}-error` : undefined}
            >
              <option value="">Выберите...</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {error && (
              <p id={`${fieldId}-error`} className="text-small text-error" role="alert">
                {error}
              </p>
            )}
          </div>
        )

      case 'file':
        return (
          <div key={field.name} className="space-y-2">
            <label htmlFor={fieldId} className="block text-small font-medium text-text-primary">
              {field.label}
              {field.required && <span className="text-error"> *</span>}
            </label>
            <input
              ref={(el) => {
                if (el) fileInputRefs.current[field.name] = el
              }}
              id={fieldId}
              type="file"
              name={field.name}
              accept={field.accept}
              multiple={field.multiple}
              onChange={(e) => handleFileChange(field.name, e.target.files)}
              className="hidden"
              aria-invalid={!!error}
              aria-describedby={error ? `${fieldId}-error` : undefined}
            />
            <button
              type="button"
              onClick={() => fileInputRefs.current[field.name]?.click()}
              className="flex items-center gap-2 rounded-small border border-border-subtle bg-background px-4 py-2 text-body text-text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <Upload className="h-4 w-4" />
              Загрузить файл
            </button>
            {imagePreviews[field.name] && imagePreviews[field.name].length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {imagePreviews[field.name].map((preview, index) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-small">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(field.name, index)}
                      className="absolute top-1 right-1 rounded-small bg-error p-1 text-white hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2"
                      aria-label="Удалить изображение"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <p id={`${fieldId}-error`} className="text-small text-error" role="alert">
                {error}
              </p>
            )}
          </div>
        )

      case 'date':
        return (
          <div key={field.name} className="space-y-1">
            <label htmlFor={fieldId} className="block text-small font-medium text-text-primary">
              {field.label}
              {field.required && <span className="text-error"> *</span>}
            </label>
            <input
              id={fieldId}
              type="date"
              name={field.name}
              value={value || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              min={field.min?.toString()}
              max={field.max?.toString()}
              className={cn(
                'w-full rounded-small border border-border-subtle bg-background px-4 py-2 text-body text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
                error && 'border-error'
              )}
              aria-invalid={!!error}
              aria-describedby={error ? `${fieldId}-error` : undefined}
            />
            {error && (
              <p id={`${fieldId}-error`} className="text-small text-error" role="alert">
                {error}
              </p>
            )}
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-1">
            <label htmlFor={fieldId} className="block text-small font-medium text-text-primary">
              {field.label}
              {field.required && <span className="text-error"> *</span>}
            </label>
            <input
              id={fieldId}
              type={field.type}
              name={field.name}
              value={value || ''}
              onChange={(e) =>
                handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)
              }
              placeholder={field.placeholder}
              required={field.required}
              min={field.min}
              max={field.max}
              step={field.type === 'number' ? '0.01' : undefined}
              className={cn(
                'w-full rounded-small border border-border-subtle bg-background px-4 py-2 text-body text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
                error && 'border-error'
              )}
              aria-invalid={!!error}
              aria-describedby={error ? `${fieldId}-error` : field.helperText ? `${fieldId}-helper` : undefined}
            />
            {error && (
              <p id={`${fieldId}-error`} className="text-small text-error" role="alert">
                {error}
              </p>
            )}
            {!error && field.helperText && (
              <p id={`${fieldId}-helper`} className="text-small text-text-secondary">
                {field.helperText}
              </p>
            )}
          </div>
        )
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)} noValidate>
      {errors._general && (
        <div className="rounded-small bg-error/10 border border-error p-4" role="alert">
          <p className="text-body text-error">{errors._general}</p>
        </div>
      )}

      {fields.map(renderField)}

      <div className="flex justify-end gap-4">
        <Button type="submit" variant="primary" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}


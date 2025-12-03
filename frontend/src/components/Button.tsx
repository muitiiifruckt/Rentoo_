import { type FC, type ReactNode, type ButtonHTMLAttributes, isValidElement, cloneElement } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger'
  loading?: boolean
  children: ReactNode
  asChild?: boolean
}

/**
 * Button component with multiple variants
 * 
 * @param variant - Button style variant
 * @param loading - Show loading spinner
 * @param children - Button content
 * @param asChild - Render as child element (for Link components)
 */
export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  children,
  asChild = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-small px-4 py-2 text-body font-medium transition-all duration-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80',
    ghost: 'bg-transparent text-text-primary hover:bg-surface active:bg-surface/80',
    outline: 'border-2 border-border-subtle bg-surface text-text-primary hover:bg-background active:bg-background/80',
    danger: 'bg-error text-white hover:bg-error/90 active:bg-error/80',
  }

  const buttonClasses = cn(baseStyles, variants[variant] || variants.primary, className)

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      className: cn(buttonClasses, children.props.className),
      disabled: disabled || loading,
      ...props,
    } as any)
  }

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}


import { type FC, type ReactNode, Children } from 'react'
import { cn } from '@/lib/utils'

export interface GridProps {
  children: ReactNode
  className?: string
  loading?: boolean
  emptyMessage?: string
}

/**
 * Responsive grid component for displaying items
 * 
 * Grid layout:
 * - Mobile: 1 column
 * - Tablet: 2 columns
 * - Desktop: 3 columns
 * - Wide desktop: 4 columns
 * 
 * @param children - Grid items
 * @param loading - Show loading state
 * @param emptyMessage - Message when grid is empty
 */
export const Grid: FC<GridProps> = ({
  children,
  className,
  loading = false,
  emptyMessage = 'Ничего не найдено',
}) => {
  if (loading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-4 sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4',
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-80 animate-pulse rounded-medium bg-surface"
            aria-label="Загрузка..."
          />
        ))}
      </div>
    )
  }

  const childrenArray = Children.toArray(children)

  if (childrenArray.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-medium bg-surface p-8">
        <p className="text-body text-text-secondary">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4',
        className
      )}
      role="list"
    >
      {childrenArray.map((child, index) => (
        <div key={index} role="listitem">
          {child}
        </div>
      ))}
    </div>
  )
}




import React from 'react'
import { MapPin, Calendar } from 'lucide-react'
import { Item } from '@/lib/api'
import { formatPrice, truncateText, getImageUrl, cn } from '@/lib/utils'
import { Button } from './Button'

export interface ItemCardProps {
  item: Item
  onRent?: (item: Item) => void
  onClick?: (item: Item) => void
  className?: string
}

/**
 * ItemCard component for displaying rental items
 * 
 * Features:
 * - Clickable card with hover effects
 * - Lazy-loaded images
 * - Truncated description
 * - Price and location display
 * - Rent button
 * 
 * @param item - Item data to display
 * @param onRent - Callback when rent button is clicked
 * @param onClick - Callback when card is clicked
 */
export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onRent,
  onClick,
  className,
}) => {
  const handleClick = () => {
    onClick?.(item)
  }

  const handleRentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRent?.(item)
  }

  const mainImage = item.images && item.images.length > 0 ? item.images[0] : null

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className={cn(
        'group flex flex-col overflow-hidden rounded-medium bg-surface shadow-card transition-all duration-hover hover:shadow-elevated hover:-translate-y-1',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'cursor-pointer',
        className
      )}
      aria-label={`${item.title} - ${formatPrice(item.price_per_day)} в день`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-background">
        {mainImage ? (
          <img
            src={getImageUrl(mainImage)}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-hover group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-background text-text-secondary">
            <Calendar className="h-12 w-12" />
          </div>
        )}
        {item.status !== 'active' && (
          <div className="absolute top-2 right-2 rounded-small bg-error/90 px-2 py-1 text-small text-white">
            {item.status === 'draft' && 'Черновик'}
            {item.status === 'inactive' && 'Недоступно'}
            {item.status === 'archived' && 'Архив'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 text-h3 font-semibold text-text-primary line-clamp-2">
          {item.title}
        </h3>
        <p className="mb-3 flex-1 text-small text-text-secondary line-clamp-2">
          {truncateText(item.description, 100)}
        </p>

        {/* Price and Location */}
        <div className="mb-3 space-y-1">
          <div className="flex items-center gap-1 text-body font-semibold text-primary">
            {formatPrice(item.price_per_day)}
            <span className="text-small font-normal text-text-secondary">/день</span>
          </div>
          {item.location?.address && (
            <div className="flex items-center gap-1 text-small text-text-secondary">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span className="line-clamp-1">{item.location.address}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {item.status === 'active' && (
          <Button
            variant="primary"
            onClick={handleRentClick}
            className="w-full"
            aria-label={`Арендовать ${item.title}`}
          >
            Арендовать
          </Button>
        )}
      </div>
    </article>
  )
}




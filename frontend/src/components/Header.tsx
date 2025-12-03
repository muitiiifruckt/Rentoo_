import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, User, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from './Button'
import { cn } from '@/lib/utils'

/**
 * Header component with logo, search, and user actions
 * 
 * Features:
 * - Responsive design
 * - Search with suggestions (basic implementation)
 * - User menu
 * - Keyboard accessible
 */
export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?query=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMobileMenuOpen(false)
  }

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileMenuOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface">
      <div className="mx-auto max-w-container px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-h2 font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-small"
            aria-label="Rentoo - Главная"
          >
            Rentoo
          </Link>

          {/* Search - Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden flex-1 max-w-md md:block"
            role="search"
            aria-label="Поиск товаров"
          >
            <div className="relative">
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск товаров..."
                className="w-full rounded-small border border-border-subtle bg-background px-4 py-2 pl-10 text-body text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
                aria-label="Поиск товаров"
              />
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                aria-hidden="true"
              />
            </div>
          </form>

          {/* Actions - Desktop */}
          <nav className="hidden items-center gap-4 md:flex" aria-label="Навигация">
            <Link
              to="/"
              className="text-body text-text-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-small px-2 py-1"
            >
              Товары
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/items/new"
                  className="text-body text-text-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-small px-2 py-1"
                >
                  Добавить товар
                </Link>
                <Link
                  to="/rentals"
                  className="text-body text-text-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-small px-2 py-1"
                >
                  Мои аренды
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-small px-2 py-1 text-body text-text-primary hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Профиль"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden lg:inline">{user?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-small px-2 py-1 text-body text-text-secondary hover:bg-background hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Выйти"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden lg:inline">Выйти</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Войти</Link>
                </Button>
                <Button variant="primary" asChild>
                  <Link to="/register">Регистрация</Link>
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden rounded-small p-2 text-text-primary hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Search */}
        <form
          onSubmit={handleSearch}
          className={cn(
            'md:hidden pb-4 transition-all',
            isMobileMenuOpen ? 'block' : 'hidden'
          )}
          role="search"
        >
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск товаров..."
              className="w-full rounded-small border border-border-subtle bg-background px-4 py-2 pl-10 text-body text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
              aria-label="Поиск товаров"
            />
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
              aria-hidden="true"
            />
          </div>
        </form>

        {/* Mobile Menu */}
        <nav
          className={cn(
            'md:hidden border-t border-border-subtle transition-all',
            isMobileMenuOpen ? 'block' : 'hidden'
          )}
          aria-label="Мобильная навигация"
        >
          <div className="flex flex-col gap-2 py-4">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-small px-4 py-2 text-body text-text-primary hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Товары
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/items/new"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-small px-4 py-2 text-body text-text-primary hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Добавить товар
                </Link>
                <Link
                  to="/rentals"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-small px-4 py-2 text-body text-text-primary hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Мои аренды
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-small px-4 py-2 text-body text-text-primary hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <User className="h-5 w-5" />
                  Профиль
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-small px-4 py-2 text-left text-body text-text-secondary hover:bg-background hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <LogOut className="h-5 w-5" />
                  Выйти
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Войти
                  </Link>
                </Button>
                <Button variant="primary" className="w-full" asChild>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    Регистрация
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}


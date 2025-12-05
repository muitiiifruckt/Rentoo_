import axios, { AxiosInstance } from 'axios'

// Use relative URLs in production (via nginx proxy) or absolute URL if specified
// Empty string means relative URLs, which works with nginx proxy in Docker
// Vite replaces import.meta.env.VITE_API_URL at build time
const API_BASE_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '') 
  ? import.meta.env.VITE_API_URL 
  : ''

// Log API base URL in development (will be removed in production build)
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL || '(relative URLs - using nginx proxy)')
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      // Only redirect if not already on login/register page and not during login attempt
      const currentPath = window.location.pathname
      const isLoginAttempt = error.config?.url?.includes('/api/auth/login')
      if (currentPath !== '/login' && currentPath !== '/register' && !isLoginAttempt) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Types
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface UserCreate {
  email: string
  name: string
  password: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  owner_id: string
  title: string
  description: string
  category: string
  price_per_day: number
  price_per_week?: number
  price_per_month?: number
  location?: {
    address?: string
    lat?: number
    lng?: number
  }
  parameters?: Record<string, any>
  images: string[]
  status: 'draft' | 'active' | 'inactive' | 'archived'
  created_at: string
  updated_at: string
}

export interface ItemCreate {
  title: string
  description: string
  category: string
  price_per_day: number
  price_per_week?: number
  price_per_month?: number
  location?: {
    address?: string
    lat?: number
    lng?: number
  }
  parameters?: Record<string, any>
  images?: string[]
}

export interface ItemSearch {
  query?: string
  category?: string
  min_price?: number
  max_price?: number
  location?: string
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'price'
  sort_order?: 'asc' | 'desc'
}

export interface Rental {
  id: string
  item_id: string
  renter_id: string
  owner_id: string
  start_date: string
  end_date: string
  total_price: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface RentalCreate {
  item_id: string
  start_date: string
  end_date: string
}

export interface Message {
  id: string
  rental_id: string
  sender_id: string
  receiver_id: string
  content: string
  message_type: 'text' | 'image'
  read_at?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  content: string
  read_at?: string
  created_at: string
}

// Auth API
export const authAPI = {
  register: async (data: UserCreate): Promise<User> => {
    const response = await api.post('/api/auth/register', data)
    return response.data
  },

  login: async (data: UserLogin): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/login', data)
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/api/auth/me')
    return response.data
  },
}

// Users API
export const usersAPI = {
  getUser: async (userId: string): Promise<User> => {
    const response = await api.get(`/api/users/${userId}`)
    return response.data
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/api/users/${userId}`, data)
    return response.data
  },
}

// Categories API
export const categoriesAPI = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/api/categories')
    return response.data
  },
}

// Helper function to normalize item data (ensure id field exists)
const normalizeItem = (item: any): Item => {
  // Create a new object to avoid mutation issues
  const normalized = { ...item }
  // Handle both _id and id fields
  if (normalized._id && !normalized.id) {
    normalized.id = String(normalized._id)
  } else if (!normalized.id && normalized._id) {
    normalized.id = String(normalized._id)
  }
  // Ensure id is always a string
  if (normalized.id) {
    normalized.id = String(normalized.id)
  }
  // Normalize owner_id
  if (normalized.owner_id && typeof normalized.owner_id === 'object') {
    normalized.owner_id = String(normalized.owner_id)
  }
  return normalized as Item
}

const normalizeItems = (items: any[]): Item[] => {
  return items.map(normalizeItem)
}

// Helper function to normalize rental data
const normalizeRental = (rental: any): Rental => {
  const normalized = { ...rental }
  // Handle id
  if (!normalized.id && normalized._id) {
    normalized.id = String(normalized._id)
  } else if (normalized.id) {
    normalized.id = String(normalized.id)
  }
  // Handle item_id
  if (!normalized.item_id && normalized.item_id === undefined && normalized.item) {
    normalized.item_id = String(normalized.item.id || normalized.item._id)
  } else if (normalized.item_id && typeof normalized.item_id === 'object') {
    normalized.item_id = String(normalized.item_id)
  }
  // Handle renter_id and owner_id
  if (normalized.renter_id && typeof normalized.renter_id === 'object') {
    normalized.renter_id = String(normalized.renter_id)
  }
  if (normalized.owner_id && typeof normalized.owner_id === 'object') {
    normalized.owner_id = String(normalized.owner_id)
  }
  return normalized as Rental
}

const normalizeRentals = (rentals: any[]): Rental[] => {
  return rentals.map(normalizeRental)
}

// Items API
export const itemsAPI = {
  getItems: async (search?: ItemSearch): Promise<Item[]> => {
    const response = await api.get('/api/items', { params: search })
    return normalizeItems(response.data)
  },

  getItem: async (itemId: string): Promise<Item> => {
    const response = await api.get(`/api/items/${itemId}`)
    return normalizeItem(response.data)
  },

  getMyItems: async (): Promise<Item[]> => {
    const response = await api.get('/api/items/my')
    return normalizeItems(response.data)
  },

  createItem: async (data: ItemCreate): Promise<Item> => {
    const response = await api.post('/api/items', data)
    return normalizeItem(response.data)
  },

  updateItem: async (itemId: string, data: Partial<ItemCreate>): Promise<Item> => {
    const response = await api.put(`/api/items/${itemId}`, data)
    return normalizeItem(response.data)
  },

  deleteItem: async (itemId: string): Promise<void> => {
    await api.delete(`/api/items/${itemId}`)
  },

  uploadImage: async (itemId: string, file: File): Promise<Item> => {
    console.log('📤 [API] uploadImage called:', {
      itemId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      url: `/api/items/${itemId}/images`
    })
    
    const formData = new FormData()
    formData.append('file', file)
    console.log('📤 [API] FormData created, entries:', Array.from(formData.entries()).map(([k, v]) => ({
      key: k,
      value: v instanceof File ? { name: v.name, type: v.type, size: v.size } : v
    })))
    
    try {
      console.log('📤 [API] Sending POST request...')
      const response = await api.post(`/api/items/${itemId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      console.log('📤 [API] ✅ Upload successful, response:', {
        status: response.status,
        data: response.data
      })
      return response.data
    } catch (error: any) {
      console.error('📤 [API] ❌ Upload failed:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      })
      throw error
    }
  },
}

// Rentals API
export const rentalsAPI = {
  getRentals: async (role?: 'all' | 'renter' | 'owner'): Promise<Rental[]> => {
    const response = await api.get('/api/rentals', { params: { role } })
    return normalizeRentals(response.data)
  },

  getRental: async (rentalId: string): Promise<Rental> => {
    const response = await api.get(`/api/rentals/${rentalId}`)
    return normalizeRental(response.data)
  },

  createRental: async (data: RentalCreate): Promise<Rental> => {
    const response = await api.post('/api/rentals', data)
    return normalizeRental(response.data)
  },

  confirmRental: async (rentalId: string, confirm: boolean): Promise<Rental> => {
    const response = await api.put(`/api/rentals/${rentalId}/confirm`, { confirm })
    return normalizeRental(response.data)
  },

  completeRental: async (rentalId: string): Promise<Rental> => {
    const response = await api.put(`/api/rentals/${rentalId}/complete`)
    return response.data
  },
}

// Messages API
export const messagesAPI = {
  getMessages: async (rentalId: string): Promise<Message[]> => {
    const response = await api.get(`/api/messages/rental/${rentalId}`)
    return response.data
  },

  sendMessage: async (data: {
    rental_id: string
    receiver_id: string
    content: string
    message_type?: 'text' | 'image'
  }): Promise<Message> => {
    const response = await api.post('/api/messages', data)
    return response.data
  },

  markAsRead: async (messageId: string): Promise<void> => {
    await api.put(`/api/messages/${messageId}/read`)
  },
}

// Notifications API
export const notificationsAPI = {
  getNotifications: async (unreadOnly?: boolean): Promise<Notification[]> => {
    const response = await api.get('/api/notifications', { params: { unread_only: unreadOnly } })
    return response.data
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.put(`/api/notifications/${notificationId}/read`)
  },
}

export default api


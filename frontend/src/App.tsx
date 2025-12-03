import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Header } from './components/Header'
import Home from './pages/Home'
import ItemDetail from './pages/ItemDetail'
import AddItem from './pages/AddItem'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import Rentals from './pages/Rentals'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="/items/new" element={<AddItem />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/rentals" element={<Rentals />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App




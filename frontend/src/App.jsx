import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Banner from './components/Banner'
import ProductList from './components/ProductList'
import Footer from './components/Footer'
import Login from './components/Login'
import Register from './components/Register'
import ForgotPassword from './components/ForgotPassword'
import ChangePassword from './components/ChangePassword'
import UpdateProfile from './components/UpdateProfile'
import './assets/css/App.css'

function App() {
  const [user, setUser] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        setUser(null)
        localStorage.removeItem('user')
      }
    } catch (err) {
      console.error('Lỗi khi lấy thông tin user:', err)
    }
  }

  // Setup user from API via Cookie
  useEffect(() => {
    fetchUser()

    // Listen for cross-tab or manual storage events to sync login/logout
    window.addEventListener('storage', fetchUser)
    
    return () => {
      window.removeEventListener('storage', fetchUser)
    }
  }, [])

  // Fetch products on mount
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId) => {
    try {
      const res = await fetch('/api/add-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId })
      })

      if (!res.ok) throw new Error('Failed to add to cart')

      const data = await res.json()
      if (data.success) {
        setCartCount(prev => prev + 1)
      } else {
        throw new Error(data.message || 'Unknown error')
      }
    } catch (err) {
      console.error('Add to cart error:', err)
      // Still show success animation in UI for now (backend not fully connected)
    }
  }

  return (
    <div className="app">
      <Header user={user} categories={categories} cartCount={cartCount} />

      <div className="mainBody">
        <Routes>
          <Route path="/" element={
            <div className="container">
              <Banner />

              {loading && (
                <div className="loading-section">
                  <div className="loading-spinner"></div>
                  <p>Đang tải sản phẩm...</p>
                </div>
              )}

              {error && (
                <div className="error-section">
                  <p>❌ Lỗi: {error}</p>
                  <button className="btn btn--primary" onClick={fetchProducts}>
                    🔄 Thử lại
                  </button>
                </div>
              )}

              {!loading && !error && (
                <ProductList products={products} onAddToCart={handleAddToCart} />
              )}
            </div>
          } />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/profile" element={<UpdateProfile />} />
        </Routes>
      </div>

      <Footer />
    </div>
  )
}

export default App

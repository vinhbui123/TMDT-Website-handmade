import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Banner from './components/Banner'
import ProductList from './components/ProductList'
import Footer from './components/Footer'

// --- Các trang của bạn (HEAD) ---
import CartPage from './pages/CartPage'
import Checkout from './pages/Checkout'
import VNPayReturn from './components/VNPayReturn'
import OrderHistory from './pages/OrderHistory'
import ProductDetail from './pages/ProductDetail'
import ShopDashboard from "./pages/ShopDashboard.jsx";

// --- Các trang của Vinh (Incoming) ---
import Login from './components/Login'
import Register from './components/Register'
import ForgotPassword from './components/ForgotPassword'
import ChangePassword from './components/ChangePassword'
import UpdateProfile from './components/UpdateProfile'

import './assets/css/App.css'
import ProductCategoryList from './pages/ProductCategoryList'

function App() {
  const [user, setUser] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 1. Lấy thông tin User (Logic của Vinh)
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

  // 2. Lấy số lượng giỏ hàng (Logic của bạn)
  const updateCartCount = async () => {
    try {
      const res = await fetch('/api/cart')
      if (res.ok) {
        const data = await res.json()
        setCartCount(data.cartCount || 0)
      }
    } catch (err) {
      console.warn("Chưa lấy được số lượng giỏ hàng")
    }
  }

  // 3. Lấy danh sách sản phẩm (Kết hợp cả hai)
  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data = await res.json()

      if (Array.isArray(data)) {
        // Áp dụng tính displayPrice từ bản của bạn
        const processed = data.map(p => ({
          ...p,
          displayPrice: p.discount > 0 ? p.price * (1 - p.discount/100) : p.price
        }))
        setProducts(processed)
      }
    } catch (err) {
      setError(err.message)
      console.error("Lỗi tải sản phẩm:", err)
    } finally {
      setLoading(false)
    }
  }

  // Khởi tạo ứng dụng
  useEffect(() => {
    fetchUser()
    fetchProducts()
    updateCartCount()

    // Đồng bộ khi có thay đổi từ tab khác hoặc sự kiện giỏ hàng
    window.addEventListener('storage', fetchUser)
    window.addEventListener('storage', updateCartCount)
    window.addEventListener('cartUpdated', updateCartCount)

    return () => {
      window.removeEventListener('storage', fetchUser)
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('cartUpdated', updateCartCount)
    }
  }, [])

  // 4. Hàm thêm vào giỏ hàng (Ưu tiên bản đầy đủ của bạn)
  const handleAddToCart = async (productId, quantity = 1) => {
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      })
      const data = await res.json()
      if (data.success) {
        setCartCount(data.cartCount)
      } else {
        alert(data.message || "Lỗi khi thêm vào giỏ hàng")
      }
    } catch (err) {
      console.error('Add to cart error:', err)
      alert("Lỗi kết nối giỏ hàng!")
    }
  }

  return (
      <Router>
        <div className="app">
          <Header user={user} categories={categories} cartCount={cartCount} />

          <main className="mainBody">
            <Routes>
              {/* TRANG CHỦ */}
              <Route path="/" element={
                <div className="container">
                  <Banner />
                  <h2 style={{ textAlign: 'center', margin: '30px 0', color: '#ee4d2d' }}>
                    DANH MỤC SẢN PHẨM HANDMADE
                  </h2>

                  {loading && (
                      <div className="loading-section" style={{textAlign: 'center', padding: '40px'}}>
                        <div className="loading-spinner"></div>
                        <p>Đang tải sản phẩm...</p>
                      </div>
                  )}

                  {error && (
                      <div className="error-section" style={{textAlign: 'center', color: 'red'}}>
                        <p>❌ Lỗi: {error}</p>
                        <button className="btn btn--primary" onClick={fetchProducts}>🔄 Thử lại</button>
                      </div>
                  )}

                  {!loading && !error && (
                      <ProductList products={products} onAddToCart={handleAddToCart} />
                  )}
                </div>
              } />

              {/* CÁC ROUTE AUTH (Của Vinh) */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/profile" element={<UpdateProfile />} />

              {/* CÁC ROUTE CHỨC NĂNG (Của bạn) */}
              <Route path="/cart" element={<CartPage onCartChange={updateCartCount} />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/vnpay-return" element={<VNPayReturn />} />
              <Route path="/order-history" element={<OrderHistory />} />
              <Route path="/product/:id" element={<ProductDetail user={user} updateCartCount={updateCartCount} />} />
              <Route path="/products" element={<ProductCategoryList />} />
                <Route path="/ShopDashBoard" element={<ShopDashboard />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
  )
}

export default App
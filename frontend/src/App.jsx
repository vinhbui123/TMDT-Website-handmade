import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Banner from './components/Banner'
import ProductList from './components/ProductList'
import Footer from './components/Footer'
import CartPage from './pages/CartPage'
import Checkout from './pages/Checkout'
import VNPayReturn from './components/VNPayReturn'
import OrderHistory from './pages/OrderHistory'
import './assets/css/App.css'

function App() {
  const [products, setProducts] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Hàm lấy số lượng giỏ hàng dùng chung
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

  // Hàm lấy danh sách sản phẩm
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      const data = await res.json()

      if (Array.isArray(data)) {
        // Tính giá hiển thị sau khi trừ discount (%) từ dữ liệu thật
        const processed = data.map(p => ({
          ...p,
          displayPrice: p.discount > 0 ? p.price * (1 - p.discount/100) : p.price
        }))
        setProducts(processed)
      }
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    updateCartCount()

    // Lắng nghe các thay đổi từ trang khác để cập nhật Header
    window.addEventListener('storage', updateCartCount)
    window.addEventListener('cartUpdated', updateCartCount)

    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('cartUpdated', updateCartCount)
    }
  }, [])

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
        alert(data.message)
      }
    } catch (err) {
      alert("Lỗi kết nối giỏ hàng!")
    }
  }

  return (
      <Router>
        <div className="app">
          <Header cartCount={cartCount} />
          <main className="mainBody">
            <Routes>
              {/* TRANG CHỦ */}
              <Route path="/" element={
                <div className="container">
                  <Banner />
                  <h2 style={{ textAlign: 'center', margin: '30px 0', color: '#ee4d2d' }}>
                    DANH MỤC SẢN PHẨM HANDMADE
                  </h2>
                  {loading ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải sản phẩm...</div>
                  ) : (
                      <ProductList products={products} onAddToCart={handleAddToCart} />
                  )}
                </div>
              } />

              {/* CÁC TRANG KHÁC */}
              <Route path="/cart" element={<CartPage onCartChange={updateCartCount} />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/vnpay-return" element={<VNPayReturn />} />

              {/* TRANG LỊCH SỬ - Kiểm tra kỹ đường dẫn này */}
              <Route path="/order-history" element={<OrderHistory />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
  )
}

export default App
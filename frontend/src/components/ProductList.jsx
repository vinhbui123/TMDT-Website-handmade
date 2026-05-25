import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../assets/css/ProductList.css'

function formatPrice(price) {
  if (!price) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(Math.round(price)) + 'đ'
}

function ProductList({ products, onAddToCart }) {
  const [addedId, setAddedId] = useState(null)
  const [loadingId, setLoadingId] = useState(null)
  const [quantities, setQuantities] = useState({})

  // Hàm xử lý khi thay đổi số lượng trong ô input
  const handleQtyChange = (productId, value, maxStock) => {
    let qty = parseInt(value)
    if (isNaN(qty) || qty < 1) qty = 1
    if (qty > maxStock) qty = maxStock

    setQuantities(prev => ({
      ...prev,
      [productId]: qty
    }))
  }

  const handleAddToCart = async (e, product) => {
    e.preventDefault()
    e.stopPropagation()

    if (!product || product.quantity <= 0) return

    const selectedQty = quantities[product.id] || 1
    setLoadingId(product.id)

    try {
      if (onAddToCart) {
        await onAddToCart(product.id, selectedQty)
      }
      setAddedId(product.id)
      setTimeout(() => setAddedId(null), 2000)
    } catch (err) {
      console.error('Lỗi thêm giỏ hàng:', err)
      alert('Có lỗi xảy ra khi thêm vào giỏ hàng.')
    } finally {
      setLoadingId(null)
    }
  }

  // LỚP BẢO VỆ: Nếu products không tồn tại hoặc không phải là mảng
  if (!products || !Array.isArray(products) || products.length === 0) {
    return (
        <div className="product-body-container">
          <h3 className="product-section-title">SẢN PHẨM CÓ LƯỢT XEM NHIỀU NHẤT</h3>
          <p style={{ textAlign: 'center', marginTop: '20px' }}>Đang tải sản phẩm hoặc danh sách trống...</p>
        </div>
    )
  }

  return (
    <div className="product-body-container">
      <h3 className="product-section-title">SẢN PHẨM CÓ LƯỢT XEM NHIỀU NHẤT</h3>

        <div className="product-list">
          {products.map((product) => {
            // Tránh lỗi nếu product bị undefined trong mảng
            if (!product) return null;

            const hasDiscount = product.discount && product.discount > 0
            const discountedPrice = hasDiscount
                ? product.price - (product.price * product.discount / 100)
                : product.price

          return (
            <div key={product.id} className="product-box">
              <Link to={`/product/${product.id}`} className="product-link">
                {hasDiscount && (
                    <div className="discount-badge">-{product.discount}%</div>
                )}

                <div className="hinh-sp">
                  <img
                      src={product.img}
                      alt={product.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/200?text=No+Image";
                      }}
                  />
                </div>

                <p className="ten-sp">{product.name}</p>

                <div className="gia-tien">
                  {hasDiscount ? (
                      <>
                        <span className="gia-moi">{formatPrice(discountedPrice)}</span>
                        <span className="gia-cu">{formatPrice(product.price)}</span>
                      </>
                  ) : (
                      <span className="gia-moi">{formatPrice(product.price)}</span>
                  )}
                </div>

                <div className="product-footer">
                  {/* 1. Hiển thị lượt xem từ bên Vinh - giúp giao diện chuyên nghiệp */}
                  <p className="view-count" style={{fontSize: '12px', color: '#666'}}>
                    <i className="fas fa-eye"></i> {product.view || 0}
                  </p>

                  <div className="product-footer-actions" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                    {/* 2. Giữ lại ô nhập số lượng của bạn - cực kỳ quan trọng cho UX */}
                    <div className="qty-input-container" onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}>
                      <input
                          type="number"
                          min="1"
                          max={product.quantity || 1}
                          value={quantities[product.id] || 1}
                          onChange={(e) => handleQtyChange(product.id, e.target.value, product.quantity)}
                          className="product-qty-input"
                          disabled={product.quantity <= 0}
                      />
                    </div>

                    {/* 3. Nút Add to Cart (Gộp logic bảo vệ quantity <= 0) */}
                    <button
                        type="button"
                        className={`add-to-cart ${addedId === product.id ? 'added' : ''}`}
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={loadingId === product.id || product.quantity <= 0}
                    >
                      {loadingId === product.id ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : addedId === product.id ? (
                          <i className="fa-solid fa-check"></i>
                      ) : (
                          <i className="fa-solid fa-cart-plus"></i>
                      )}
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          )
          })}
        </div>

      {/* Cart popup notification */}
      {addedId && (
        <div className="cart-popup show">
          <div className="cart-popup-content">
            <i className="fa-solid fa-check-circle"></i>
            <p>Sản phẩm đã được thêm vào giỏ hàng thành công!</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductList
import { useState } from 'react'
import '../assets/css/ProductList.css'

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(price)) + 'đ'
}

function ProductList({ products, onAddToCart }) {
  const [addedId, setAddedId] = useState(null)
  const [loadingId, setLoadingId] = useState(null)

  const handleAddToCart = async (e, product) => {
    e.preventDefault()
    e.stopPropagation()

    // Assuming 'stock' comes from your Inventory mapping
    if (product.stock <= 0) return

    setLoadingId(product.id)

    try {
      if (onAddToCart) {
        await onAddToCart(product.id)
      }
      setAddedId(product.id)
      setTimeout(() => setAddedId(null), 1000)
    } catch (err) {
      console.error('Lỗi thêm giỏ hàng:', err)
      alert('Có lỗi xảy ra khi thêm vào giỏ hàng.')
    } finally {
      setLoadingId(null)
    }
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <div className="product-body-container">
      <h3 className="product-section-title">SẢN PHẨM CÓ LƯỢT XEM NHIỀU NHẤT</h3>

      <div className="product-list">
        {products.map((product) => {
          const hasDiscount = product.discount && product.discount > 0
          const discountedPrice = hasDiscount
            ? product.price - (product.price * product.discount / 100)
            : product.price

          return (
            <div key={product.id} className="product-box">
              <a href={`/product-detail?id=${product.id}`} className="product-link">
                {hasDiscount && (
                  <div className="discount-badge">-{product.discount}%</div>
                )}

                <div className="hinh-sp">
                  {/* FIX: Prepend '/' to use the absolute path from the public folder.
                    Since your DB has 'images/moc_gau.jpg', this results in '/images/moc_gau.jpg'
                  */}
                  <img
                    src={`/${product.img}`}
                    alt={product.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/200?text=No+Image";
                    }}
                  />
                </div>

                <p className="ten-sp">{product.name}</p>

                <p className="gia-tien">
                  {hasDiscount ? (
                    <>
                      <span className="gia-moi">{formatPrice(discountedPrice)}</span>
                      <span className="gia-cu">{formatPrice(product.price)}</span>
                    </>
                  ) : (
                    <span className="gia-moi">{formatPrice(product.price)}</span>
                  )}
                </p>

                <div className="product-footer">
                  <p className="view-count">
                    <i className="fas fa-eye"></i> {product.view}
                  </p>
                  <button
                    type="button"
                    className={`add-to-cart ${addedId === product.id ? 'added' : ''}`}
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={loadingId === product.id}
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
              </a>
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
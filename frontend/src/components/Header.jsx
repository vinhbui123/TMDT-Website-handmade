import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../assets/css/Header.css'

function Header({ user, categories, cartCount }) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const navigate = useNavigate()

  const handleLogout = async (e) => {
    e.preventDefault()
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (err) {
      console.error('Logout error', err)
    }
    localStorage.removeItem('user')
    // Trigger storage event so App.jsx re-fetches or unsets user
    window.dispatchEvent(new Event('storage'))
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchKeyword.trim()) {
      // TODO: implement search navigation
      console.log('Searching for:', searchKeyword)
    }
  }

  return (
    <header className="mainHeader" id="site-header">
      <div className="mainHeader-center">
        <div className="container-header">
          {/* Logo */}
          <div className="header-logo">
            <a href="/">
              <span className="logo-text">🎨 HandMade</span>
            </a>
          </div>

          {/* Account */}
          <div className="header-account">
            <span className="account-icon">
              {user ? (
                <a href="/profile">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="avatar-img"
                      style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = '/images/default-avatar.png' }}
                    />
                  ) : (
                    <i className="fas fa-user" style={{ fontSize: '36px' }}></i>
                  )}
                </a>
              ) : (
                <a href="/login"><i className="fas fa-user" style={{ fontSize: '36px' }}></i></a>
              )}
            </span>
            <div className="account-info">
              {user ? (
                <>
                  <span className="account-text">
                    Xin chào, {user.firstName} {user.lastName}!
                  </span>
                  <a href="/change-password">
                    <span className="account-menu">Đổi mật khẩu</span>
                  </a>
                  <a href="#" onClick={handleLogout}>
                    <span className="account-menu">
                      Đăng Xuất <i className="fas fa-sign-out-alt"></i>
                    </span>
                  </a>
                </>
              ) : (
                <>
                  <span>Xin Chào khách hàng</span>
                  <span className="account-text">
                    <a href="/login">Đăng Nhập</a> / <a href="/register">Đăng Ký</a>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="header-search">
            <div className="search-box">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm Kiếm Sản Phẩm"
                  required
                />
                <button type="submit"><i className="fas fa-search"></i></button>
              </form>
            </div>
          </div>

          {/* Actions */}
          <div className="header-action">
            <div className="header-cart" onClick={() => window.location.href = '/cart'}>
              <i className="fas fa-cart-shopping"></i>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              <span className="cart-text">Giỏ Hàng</span>
            </div>

            {user && (
              <div className="header-purchase" onClick={() => window.location.href = '/purchase'}>
                <i className="fas fa-receipt"></i>
                <span className="cart-text">Đơn Mua</span>
              </div>
            )}

            {user && user.role === 1 && (
              <a href="/adminProducts" className="admin-btn">
                <i className="fa-solid fa-user-tie"></i> Trang Quản Trị
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="headerMenu">
        <div className="container-menu">
          <ul className="menu">
            <li><a href="/">TRANG CHỦ</a></li>
            <li><a href="/list-product?category=all">SẢN PHẨM</a></li>
            {categories && categories.map((cat) => (
              <li key={cat.id}>
                <a href={`/list-product?category=${cat.id}`}>{cat.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  )
}

export default Header

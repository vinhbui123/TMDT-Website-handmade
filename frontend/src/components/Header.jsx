import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../assets/css/Header.css'

function Header({ user, categories, cartCount }) {
  const navigate = useNavigate()

  // Biến lưu chữ người dùng đang gõ (dùng cho ô input và dropdown)
  const [inputKeyword, setInputKeyword] = useState("");

  // Biến lưu từ khóa chính thức (chỉ đổi khi bấm Enter, dùng cho danh sách chính)
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const searchRef = useRef(null);
  const accountRef = useRef(null);

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

  // Kiểm tra người dùng có bấm ra ngoài thanh tìm kiếm không
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, []);

  // Xử lý Debounce gọi API Gợi ý
  useEffect(() => {
    // Nếu ô tìm kiếm trống, tắt dropdown và xóa gợi ý
    if (!inputKeyword.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Tạo một bộ đếm thời gian (Debounce) 500ms
    const delaySearch = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/products/search?keyword=${inputKeyword}`);
        // Kiểm tra API trả về thành công mới lấy data
        if (res.ok) {
           const data = await res.json();
           setSuggestions(data);
           setShowDropdown(true);
        }
      } catch (error) {
        console.error("Lỗi tải gợi ý", error);
      }
    }, 500); // 500 mili-giây

    // Dọn dẹp: Nếu người dùng gõ tiếp khi chưa hết 500ms, hủy bộ đếm cũ
    return () => clearTimeout(delaySearch);
  }, [inputKeyword]);

  // Hàm xử lý khi bấm nút Tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Ngăn chặn load lại trang
    setShowDropdown(false); // Đóng dropdown đi

    setAppliedKeyword(inputKeyword);
    if (inputKeyword.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(inputKeyword.trim())}`);
    } else {
      navigate('/products');
    }
  };

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

          {/* Search */}
          <div className="header-search">
            <div className="search-box">
              <form ref={searchRef} onSubmit={handleSearchSubmit} style={{ position: "relative" }}>
                <input
                  type="text"
                  value={inputKeyword}
                  onChange={(e) => setInputKeyword(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true)
                  }}
                  placeholder="Tìm kiếm sản phẩm..."
                  required
                />
                <button type="submit"><i className="fas fa-search"></i></button>

                {/* KHUNG DROP DOWN GỢI Ý */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="search-dropdown">
                    {suggestions.map((prod) => (
                      <Link
                        key={prod.id}
                        to={`/product/${prod.id}`}
                        className="search-dropdown-item"
                        onClick={() => setShowDropdown(false)}
                      >
                        <img src={prod.img} alt={prod.name} className="search-dropdown-img"/>
                        <div className="search-dropdown-info">
                          <h6 className="search-dropdown-name">{prod.name}</h6>
                          <span className="search-dropdown-price">{prod.price.toLocaleString()} VNĐ</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Actions */}
          <div className="header-action">
            {/* Seller Dashboard Button */}
            {user && user.role === 2 && (
              <a href="/ShopDashBoard" className="header-role-btn seller-btn" id="seller-dashboard-btn">
                <i className="fa-solid fa-store"></i>
                <span>Kênh Người Bán</span>
              </a>
            )}

            {/* Admin Button */}
            {user && user.role === 1 && (
              <a href="/admin/verify-shop" className="header-role-btn admin-btn">
                <i className="fa-solid fa-user-tie"></i>
                <span>Quản Trị</span>
              </a>
            )}

            {/* Divider */}
            {user && (user.role === 1 || user.role === 2) && (
              <div className="header-divider"></div>
            )}

            {/* Cart */}
            <div className="header-action-item" onClick={() => window.location.href = '/cart'}>
              <div className="action-icon-wrap">
                <i className="fas fa-cart-shopping"></i>
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </div>
              <span className="action-label">Giỏ Hàng</span>
            </div>

            {/* Orders */}
            {user && (
              <div className="header-action-item" onClick={() => window.location.href = '/order-history'}>
                <div className="action-icon-wrap">
                  <i className="fas fa-receipt"></i>
                </div>
                <span className="action-label">Đơn Mua</span>
              </div>
            )}

            {/* Divider */}
            <div className="header-divider"></div>

            {/* Account */}
            <div className="header-account" ref={accountRef}>
              {user ? (
                <>
                  <div
                    className="account-trigger"
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="avatar-img"
                        onError={(e) => { e.target.src = '/images/default-avatar.png' }}
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        <i className="fas fa-user"></i>
                      </div>
                    )}
                    <div className="account-brief">
                      <span className="account-name">{user.firstName} {user.lastName}</span>
                      <i className={`fas fa-chevron-down account-arrow ${showAccountMenu ? 'open' : ''}`}></i>
                    </div>
                  </div>

                  {/* Account Dropdown */}
                  {showAccountMenu && (
                    <div className="account-dropdown">
                      <div className="account-dropdown-header">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt="Avatar"
                            className="dropdown-avatar"
                            onError={(e) => { e.target.src = '/images/default-avatar.png' }}
                          />
                        ) : (
                          <div className="dropdown-avatar-placeholder">
                            <i className="fas fa-user"></i>
                          </div>
                        )}
                        <div>
                          <span className="dropdown-name">{user.firstName} {user.lastName}</span>
                          <span className="dropdown-email">{user.email}</span>
                        </div>
                      </div>
                      <div className="account-dropdown-divider"></div>
                      <a href="/profile" className="account-dropdown-item">
                        <i className="fas fa-user-circle"></i>
                        Tài khoản của tôi
                      </a>
                      <a href="/change-password" className="account-dropdown-item">
                        <i className="fas fa-key"></i>
                        Đổi mật khẩu
                      </a>
                      <div className="account-dropdown-divider"></div>
                      <a href="#" onClick={handleLogout} className="account-dropdown-item logout-item">
                        <i className="fas fa-sign-out-alt"></i>
                        Đăng Xuất
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="account-guest">
                  <a href="/login" className="btn-login">Đăng Nhập</a>
                  <a href="/register" className="btn-register">Đăng Ký</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="headerMenu">
        <div className="container-menu">
          <ul className="menu">
            <li><a href="/">TRANG CHỦ</a></li>
            <li><a href="/products">SẢN PHẨM</a></li>
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

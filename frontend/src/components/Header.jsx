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

  const searchRef = useRef(null);

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
              <form ref={searchRef} onSubmit={handleSearchSubmit} style={{ position: "relative" }}>
                <input
                  type="text"
                  value={inputKeyword}
                  onChange={(e) => setInputKeyword(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true)
                  }}
                  placeholder="Tìm Kiếm Sản Phẩm"
                  required
                />
                <button type="submit"><i className="fas fa-search"></i></button>

                {/* KHUNG DROP DOWN GỢI Ý */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="search-dropdown">
                    {suggestions.map((prod) => (
                      <Link
                        key={prod.id}
                        to={`/product-detail/${prod.id}`}
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
            <div className="header-cart" onClick={() => window.location.href = '/cart'}>
              <i className="fas fa-cart-shopping"></i>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              <span className="cart-text">Giỏ Hàng</span>
            </div>

            {user && (
              <div className="header-purchase" onClick={() => window.location.href = '/order-history'}>
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

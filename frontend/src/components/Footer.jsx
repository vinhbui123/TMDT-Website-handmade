import '../assets/css/Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-content">
            <h3 className="footer-heading">HANDMADE SHOP</h3>
            <p className="footer-desc" style={{ marginBottom: '16px' }}>
              Sản phẩm mang tính thủ công đem đến sự mộc mạc giản dị mang một chất riêng
            </p>
            <ul className="footer-links">
              <li>
                <i className="fa-solid fa-location-dot"></i>
                Stown Thủ Đức, Bình Chiểu, Thủ Đức, TPHCM
              </li>
              <li>
                <i className="fa-solid fa-phone"></i>
                0343 031 030
              </li>
              <li>
                <i className="fa-solid fa-envelope"></i>
                handmadedcraft@gmail.com
              </li>
            </ul>
          </div>

          <div className="footer-content">
            <h3 className="footer-heading">THÔNG TIN</h3>
            <ul className="footer-links">
              <li><a href="/">Trang Chủ</a></li>
              <li><a href="/about">Giới Thiệu</a></li>
              <li><a href="/product">Sản Phẩm</a></li>
              <li><a href="/contact">Liên Hệ</a></li>
            </ul>
          </div>

          <div className="footer-content">
            <h3 className="footer-heading">CHÍNH SÁCH</h3>
            <ul className="footer-links">
              <li><a href="#purchase">Chính sách mua hàng</a></li>
              <li><a href="#privacy">Chính sách bảo mật</a></li>
              <li><a href="#payment">Phương thức thanh toán</a></li>
              <li><a href="#return">Chính sách đổi trả</a></li>
            </ul>
          </div>

          <div className="footer-content">
            <h3 className="footer-heading">LIÊN HỆ</h3>
            <div className="footer-social">
              <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="social-icon">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="social-icon">
                <i className="fa-brands fa-instagram"></i>
              </a>
              <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" className="social-icon">
                <i className="fa-brands fa-tiktok"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="text-copyright">
            Copy Right @ {new Date().getFullYear()} HANDMADE SHOP Powered
          </div>
          <div className="footer-tech">
            <span>React</span>
            <span className="footer-dot"></span>
            <span>Spring Boot</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
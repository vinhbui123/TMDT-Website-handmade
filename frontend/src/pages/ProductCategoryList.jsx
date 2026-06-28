import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getProducts } from "../services/api";
import "../assets/css/ProductCategoryList.css";

function ProductCategoryList() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const keywordFromUrl = searchParams.get('keyword') || null;

  // STATE QUẢN LÝ DỮ LIỆU THỰC
  const [products, setProducts] = useState([]);       // Danh sách sản phẩm thực từ API
  const [loading, setLoading] = useState(true);       // Trạng thái đang tải dữ liệu
  const [error, setError] = useState(null);           // Trạng thái lỗi nếu API sập

  const [sortBy, setSortBy] = useState("default");    // Bộ lọc sắp xếp
  const [currentPage, setCurrentPage] = useState(1);  // Trang hiện tại (Hiển thị UI: 1, 2, 3...)
  const [totalPages, setTotalPages] = useState(1);    // Tổng số trang từ API

  const pageSize = 12; // Số lượng sản phẩm muốn lấy trên 1 trang (để có 2 lượt, mỗi lượt 6 sản phẩm và 1 banner)

  // Cuốn từ điển ánh xạ chính xác Tên tiếng Anh trong DB sang mã màu hiển thị
  const colorPalette = {
    "Red": "#FF3B30",
    "Blue": "#007AFF",
    "Green": "#34C759",
    "Pink": "#FF2D55",
    "Orange": "#FF9500",
    "Gray": "#8E8E93",
    "Brown": "#A27B5C",  // Tone màu nâu ấm handmade
    "Yellow": "#FFCC00",
    "Black": "#1C1C1E",
    "White": "#FFFFFF",
    "Beige": "#E5D9B6"   // Màu be gốm mộc / vải thô
  };

  // STATE LƯU DANH SÁCH MÀU ĐANG CÓ
  const [colorList, setColorList] = useState([]);
  // STATE LƯU MÀU ĐANG CHỌN (null nghĩa là đang chọn "Tất cả")
  const [selectedColor, setSelectedColor] = useState(null);

  // STATE CHO CHẤT LIỆU
  const [materialList, setMaterialList] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // STATE CHO KHOẢNG GIÁ
  const [priceSliderValue, setPriceSliderValue] = useState(500000);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(500000);

  // TẢI DANH SÁCH BỘ LỌC (MÀU SẮC & CHẤT LIỆU)
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Tải danh sách Màu
        const resColors = await fetch("http://localhost:8080/api/colors");
        if (resColors.ok) {
          setColorList(await resColors.json());
        }

        // Tải danh sách Chất liệu
        const resMaterials = await fetch("http://localhost:8080/api/materials");
        if (resMaterials.ok) {
          setMaterialList(await resMaterials.json());
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách bộ lọc từ API:", err);
      }
    };
    fetchFilters();
  }, []);

  // TỰ ĐỘNG GỌI API KHI CURRENT_PAGE HOẶC SORT_BY THAY ĐỔI
  useEffect(() => {
    const fetchApiData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Lưu ý: Backend Spring Boot thường tính trang từ số 0, nên ta truyền (currentPage - 1)
        const data = await getProducts(currentPage - 1, pageSize, sortBy, selectedColor, selectedMaterial, appliedMaxPrice, keywordFromUrl);

        setProducts(data.content || []);     // Đổ mảng sản phẩm vào state
        setTotalPages(data.totalPages || 1); // Đổ tổng số trang vào state để vẽ thanh phân trang
      } catch (err) {
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau!");
      } finally {
        setLoading(false); // Tắt màn hình chờ loading
      }
    };

    fetchApiData();
  }, [currentPage, sortBy, selectedColor, selectedMaterial, appliedMaxPrice, keywordFromUrl]);

  // Hàm xử lý logic chèn Banner quảng cáo sau mỗi 6 sản phẩm
  const renderProductsWithBanners = () => {
    let renderedElements = [];

    products.forEach((product, index) => {
      renderedElements.push(
        <Link key={`prod-${product.id}`} className="handmade-product-card" to={`/product/${product.id}`}>
          <div className="card-image-wrapper">
            {/* Đảm bảo đường dẫn ảnh khớp với thuộc tính trong DB của bạn (ví dụ: product.thumbnail hoặc product.image) */}
            <img
              src={`${product.img}` || "https://placehold.co/300x300?text=No+Image"}
              alt={product.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/300x300?text=No+Image";
              }}
            />
            <button className="wishlist-btn">
              <span className="material-symbols-outlined">favorite</span>
            </button>
          </div>
          <div className="card-info">
            <p className="prod-category">Handmade Craft</p>
            <h4 className="prod-name">{product.name}</h4>
            <div className="prod-rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="material-symbols-outlined star-icon"
                  style={{ fontVariationSettings: `'FILL' ${i < (product.rating || 5) ? 1 : 0}` }}>
                  star
                </span>
              ))}
            </div>
            <p className="prod-price">{(product.price || 0).toLocaleString("vi-VN")}₫</p>
          </div>
        </Link>
      );

      // Cứ sau 6 sản phẩm thì chèn 1 Banner quảng cáo xen kẽ
      if ((index + 1) % 6 === 0) {
        renderedElements.push(
          <div key={`banner-${index}`} className="handmade-shop-adv-banner">
            <div className="banner-text">
              <h3>Bộ Sưu Tập Gốm Mộc Tháng 5</h3>
              <p>Giảm ngay 15% cho các đơn hàng đặt trước tuần này — Khám phá nét đẹp nghệ thuật thủ công.</p>
            </div>
            <button className="banner-action-btn">Xem Ngay</button>
          </div>
        );
      }
    });

    return renderedElements;
  };

  return (
    <div className="shop-handmade-container">
      {/* ================= CỘT TRÁI: BỘ LỌC (SIDEBAR) ================= */}
      <aside className="shop-sidebar">
        {/* Bộ lọc chất liệu */}
        <div className="filter-group">
          <h3 className="filter-title">Chất Liệu</h3>
          <ul className="filter-list">
            {/* Nút chọn Tất cả */}
            <li
              className={selectedMaterial === null ? "active" : ""}
              onClick={() => { setSelectedMaterial(null); setCurrentPage(1); }}
              style={{ cursor: "pointer" }}
            >
              Tất cả chất liệu
            </li>

            {/* Render danh sách chất liệu từ API */}
            {materialList.map((material) => (
              <li
                key={material.id}
                className={selectedMaterial === material.id ? "active" : ""}
                onClick={() => { setSelectedMaterial(material.id); setCurrentPage(1); }}
                style={{
                  cursor: "pointer",
                  display: "flex", 
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                {material.name}
                <span style={{ fontSize: "0.85em", color: "#888" }}>
                  ({material.productCount || 0})
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bộ lọc khoảng giá */}
        <div className="filter-group">
          <h3 className="filter-title">Lọc Theo Giá</h3>
          <div className="price-slider-mock">
            <input 
              type="range" 
              min="0" 
              max="500000"
              step="20000"
              value={priceSliderValue} 
              className="slider" 
              onChange={(e) => setPriceSliderValue(e.target.value)}
              onMouseUp={(e) => { 
                setAppliedMaxPrice(e.target.value);
                setCurrentPage(1);
              }}
              onTouchEnd={(e) => { 
                setAppliedMaxPrice(e.target.value);
                setCurrentPage(1);
              }}
            />
            <div className="price-range-text">
              <span>0₫</span> 
              <span>—</span> 
              {/* Định dạng lại số có dấu chấm hàng nghìn */}
              <span>{Number(priceSliderValue).toLocaleString("vi-VN")}₫</span>
            </div>
          </div>
        </div>

        {/* Bộ lọc màu sắc */}
        <div className="filter-group">
          <h3 className="filter-title">Màu Sắc</h3>
          <div className="color-filter-grid">
            {/* NÚT CHỌN TẤT CẢ MÀU */}
            <button
              className={`color-dot all-color-btn ${selectedColor === null ? "active" : ""}`}
              style={{
                background: "linear-gradient(45deg, #ff3b30, #ff9500, #ffcc00, #34c759, #007aff, #ff2d55)",

                border: selectedColor === null ? "2px solid #333" : "1px solid #e0e0e0",

                transform: selectedColor === null ? "scale(1.15)" : "scale(1)",
                boxShadow: selectedColor === null ? "0 3px 8px rgba(0,0,0,0.2)" : "none",

                color: "#ffffff",
                textShadow: "1px 1px 2px rgba(0,0,0,0.6)",
                fontSize: "9px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onClick={() => { setSelectedColor(null); setCurrentPage(1); }} // Reset về null để lấy tất cả
              title="Tất cả màu"
            >
              ALL
            </button>

            {/* VÒNG LẶP MAP DANH SÁCH MÀU */}
            {colorList.map((color) => {
              const currentHex = colorPalette[color.name] || "#dcdcdc";

              return (
                <button
                  key={color.id}
                  className={`color-dot ${selectedColor === color.id ? "active" : ""}`}
                  style={{
                    backgroundColor: currentHex,

                    border: selectedColor === color.id ? "2px solid #a18a68" : "1px solid #e0e0e0",
                    transform: selectedColor === color.id ? "scale(1.15)" : "scale(1)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => { setSelectedColor(color.id); setCurrentPage(1); }} // Khi click: Đổi màu chọn và reset về trang 1
                  title={color.name}
                ></button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ================= CỘT PHẢI: HIỂN THỊ SẢN PHẨM ================= */}
      <main className="shop-main-content">
        {/* Thanh điều hướng tiện ích phía trên */}
        <div className="shop-top-toolbar">
          <p className="results-count">Hiển thị <strong>{currentPage}</strong> / {totalPages}</p>

          <div className="sort-wrapper">
            <label htmlFor="sort-select">Sắp xếp theo:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="handmade-select"
            >
              <option value="default">Mới nhất</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="name-asc">Tên chữ cái: A - Z</option>
              <option value="name-desc">Tên chữ cái: Z - A</option>
              <option value="rating">Đánh giá cao nhất</option>
            </select>
          </div>
        </div>

        {/* Lưới sản phẩm kèm thuật toán chèn Banner xen kẽ */}
        <div className="products-grid-layout">
          {loading ? (
            <div className="shop-loading-inner" style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px" }}>
              Đang cập nhật danh sách sản phẩm...
            </div>
          ) : error ? (
            /* ĐÃ SỬA: Hiển thị thông báo lỗi bọc gọn gàng ở đây để không làm mất Sidebar bộ lọc */
            <div className="shop-error" style={{ gridColumn: "1/-1", textAlign: "center", color: "#ff3b30", padding: "40px", fontWeight: "bold" }}>
              {error}
            </div>
          ) : products.length > 0 ? (
            renderProductsWithBanners()
          ) : (
            <p style={{ gridColumn: "1/-1", textAlign: "center" }}>Không có sản phẩm nào phù hợp.</p>
          )}
        </div>

        {/* ================= THANH PHÂN TRANG (PAGINATION) ================= */}
        <div className="handmade-pagination">
          <button
            className="pag-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            <span className="material-symbols-outlined">chevron_left</span> Trước
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i + 1}
              className={`pag-number ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            className="pag-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Sau <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default ProductCategoryList;
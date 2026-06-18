import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../assets/css/ProductDetail.css';
import { 
    KeychainCustomizer, 
    GiftComboCustomizer, 
    WoolFlowerCustomizer, 
    AccessoryCustomizer 
} from '../components/CustomizerFields';

const ProductDetail = ({ user, updateCartCount }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [mainImg, setMainImg] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState(null);

    // Lưu toàn bộ thông tin người dùng tùy chỉnh
    const [customData, setCustomData] = useState({});

    // Review form state
    const [rating, setRating] = useState(5);
    const [reviewContent, setReviewContent] = useState('');

    useEffect(() => {
        fetchProductData();
        fetchComments();
    }, [id]);

    const fetchProductData = async () => {
        try {
            const res = await fetch(`/api/products/${id}`);
            if (!res.ok) throw new Error('Không tìm thấy sản phẩm');
            const data = await res.json();
            setProduct(data);
            setMainImg(data.img);
            if (data.colors && data.colors.length > 0) {
                setSelectedColor(data.colors[0]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/products/${id}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (err) {
            console.error('Lỗi tải đánh giá', err);
        }
    };

    const handleAddToCart = async () => {
        try {
            const res = await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, quantity })
            });
            const data = await res.json();
            if (data.success) {
                alert('Thêm vào giỏ hàng thành công!');
                if (updateCartCount) updateCartCount();
                // Trigger event for App.jsx to update count if updateCartCount prop is not passed directly
                window.dispatchEvent(new Event('cartUpdated')); 
            } else {
                alert(data.message || 'Lỗi khi thêm vào giỏ hàng');
            }
        } catch (err) {
            alert('Lỗi kết nối giỏ hàng!');
        }
    };

    const handleBuyNow = async () => {
        await handleAddToCart();
        navigate('/cart');
    };

    // HÀM XỬ LÝ RẼ NHÁNH GIAO DIỆN THEO CHẤT LIỆU
    const renderCustomizerByCategory = () => {
        // Kiểm tra xem sản phẩm có category không
        if (!product?.catalog_id) return null;

        const currentMaterials = product.materials || [];

        switch (product.catalog_id) {
            case 1:     // ID của Móc khóa
                return <KeychainCustomizer customData={customData} setCustomData={setCustomData} materials={currentMaterials} />;
            case 2:     // ID của Combo quà tặng
                return <GiftComboCustomizer customData={customData} setCustomData={setCustomData} />;
            case 3:     // ID của Hoa len
                return <WoolFlowerCustomizer customData={customData} setCustomData={setCustomData} materials={currentMaterials} />;
            case 4:     // ID của Phụ kiện
                return <AccessoryCustomizer product={product} customData={customData} setCustomData={setCustomData} />;
            default:
                return null; // Các loại sản phẩm khác không cần customize
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/products/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, comment: reviewContent })
            });
            if (res.ok) {
                alert('Đánh giá của bạn đã được gửi!');
                setReviewContent('');
                setRating(5);
                fetchComments(); // Reload comments
            } else if (res.status === 401) {
                alert('Vui lòng đăng nhập để đánh giá.');
            } else {
                alert('Lỗi khi gửi đánh giá');
            }
        } catch (err) {
            alert('Lỗi hệ thống');
        }
    };

    if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Đang tải...</div>;
    if (error) return <div style={{textAlign: 'center', padding: '50px', color: 'red'}}>Lỗi: {error}</div>;
    if (!product) return null;

    const discountPrice = product.discount > 0 ? product.price * (1 - product.discount/100) : product.price;

    const averageRating = comments.length > 0 
        ? (comments.reduce((sum, c) => sum + c.rating, 0) / comments.length).toFixed(1)
        : 0;

    return (
        <div className="product-detail-page">
            <div className="flex-box">
                <div className="left">
                    <div className="big-img">
                        <img id="main-img" src={mainImg} alt={product.name} />
                    </div>
                    <div className="image">
                        <div className="small-img">
                            <img src={product.img} onClick={() => setMainImg(product.img)} alt="Product" />
                        </div>
                        {product.subImg && product.subImg.map((img, idx) => (
                            <div className="small-img" key={idx}>
                                <img src={img} onClick={() => setMainImg(img)} alt={`Sub ${idx}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="right">
                    <div className="breadcrumb">
                        <ul>
                            <li><Link to="/">Trang chủ &gt;</Link></li>
                            <li style={{marginLeft: 5}}>Chi tiết sản phẩm</li>
                        </ul>
                    </div>
                    <div className="name">{product.name}</div>
                    
                    <div className="rating-overview-top" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                        <div className="rating-stars" style={{ color: '#f27a24', fontSize: '14px' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <i key={i} className={i <= averageRating ? "fas fa-star" : (i - 0.5 <= averageRating ? "fas fa-star-half-alt" : "far fa-star")}></i>
                            ))}
                        </div>
                        <div className="review-count" style={{ fontSize: '14px', color: '#767676', paddingLeft: '12px', borderLeft: '1px solid #e0e0e0' }}>
                            {comments.length > 0 ? `${comments.length} Đánh Giá` : 'Chưa có đánh giá'}
                        </div>
                    </div>

                    <p className="price">
                        {product.discount > 0 ? (
                            <>
                                {discountPrice.toLocaleString()}đ
                                <span className="old-price" style={{marginLeft: 10}}>{product.price.toLocaleString()}đ</span>
                            </>
                        ) : (
                            `${product.price.toLocaleString()}đ`
                        )}
                    </p>

                    <div className="color-selector">
                        <p>Màu sắc :</p>
                        {product.colors && product.colors.map((color, idx) => (
                            <div 
                                key={idx} 
                                className={`color-item ${selectedColor?.id === color.id ? 'active' : ''}`}
                                onClick={() => setSelectedColor(color)}
                            >
                                {color.name}
                            </div>
                        ))}
                    </div>

                    <div className="quantity">
                        <p>Số lượng :</p>
                        <input 
                            type="number" 
                            min="1" 
                            value={quantity} 
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
                        />
                    </div>
                    
                    <div className="stock-quantity">
                        Kho: {product.quantity}
                    </div>

                    {/* HIỂN THỊ KHU VỰC CUSTOMIZE TÙY LOẠI */}
                    {renderCustomizerByCategory()}

                    <div className="btn-box">
                        <button className="cart-btn" onClick={handleAddToCart}>
                            <i className="fa-solid fa-cart-plus" style={{marginRight: 5}}></i>Thêm Vào Giỏ Hàng
                        </button>
                        <button className="buy-btn" onClick={handleBuyNow}>Mua Ngay</button>
                    </div>
                </div>
            </div>

            <div className="describe-container">
                <h2>MÔ TẢ CHI TIẾT</h2>
                {product.materials && product.materials.length > 0 && (
                    <p className="material">
                        <strong>Chất liệu: </strong>
                        {product.materials.map((m, i) => (
                            <span key={i} className="material-item">{m.name}</span>
                        ))}
                    </p>
                )}
                <p className="description-text">{product.description}</p>
            </div>

            <div className="comment-section">
                <h2>ĐÁNH GIÁ SẢN PHẨM</h2>
                <div className="rating-overview">
                    <div className="rating-number">{averageRating > 0 ? Number(averageRating).toFixed(1) : '0.0'}</div>
                    <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map(i => (
                            <i key={i} className={i <= averageRating ? "fas fa-star" : (i - 0.5 <= averageRating ? "fas fa-star-half-alt" : "far fa-star")}></i>
                        ))}
                    </div>
                    <span className="comment-count">{comments.length} đánh giá</span>
                </div>

                {/* Review Form */}
                <div className="comment-form">
                    <h3>Gửi đánh giá của bạn</h3>
                    <form onSubmit={submitReview}>
                        <div className="rating-select">
                            <label>Chọn số sao:</label>
                            <select value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>
                                <option value="5">5 Sao (Tuyệt vời)</option>
                                <option value="4">4 Sao (Tốt)</option>
                                <option value="3">3 Sao (Bình thường)</option>
                                <option value="2">2 Sao (Kém)</option>
                                <option value="1">1 Sao (Rất kém)</option>
                            </select>
                        </div>
                        <textarea 
                            value={reviewContent} 
                            onChange={(e) => setReviewContent(e.target.value)} 
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..." 
                            required 
                        />
                        <button type="submit" className="submit-comment">Gửi Đánh Giá</button>
                    </form>
                </div>

                <div className="comment-list">
                    {comments.length > 0 ? comments.map((c, idx) => (
                        <div className="comment-item" key={idx}>
                            <div className="comment-header">
                                <span className="comment-user">{c.userName || 'Ẩn danh'}</span>
                                <span className="comment-date">
                                    {new Date(c.createAt).toLocaleDateString('vi-VN')} {new Date(c.createAt).toLocaleTimeString('vi-VN')}
                                </span>
                            </div>
                            <div className="comment-rating">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <i key={i} className={i <= c.rating ? "fas fa-star" : "far fa-star"}></i>
                                ))}
                            </div>
                            <div className="comment-content">{c.comment}</div>
                        </div>
                    )) : (
                        <div className="no-comments">Chưa có đánh giá nào cho sản phẩm này</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;

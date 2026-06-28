import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../assets/css/ProductDetail.css';

const ProductDetail = ({ user, updateCartCount, openChat }) => {
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

    // Dynamic Customize Fields từ DB
    const [customizeFields, setCustomizeFields] = useState([]);

    // Custom Request Modal State
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [customRequestDesc, setCustomRequestDesc] = useState('');
    const [customRequestImgUrl, setCustomRequestImgUrl] = useState('');
    const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);


    useEffect(() => {
        fetchProductData();
        fetchComments();
    }, [id]);

    // Fetch dynamic customize fields khi có product
    useEffect(() => {
        if (!product) return;
        fetch(`/api/products/${product.id}/customize-fields`)
            .then(res => res.ok ? res.json() : [])
            .then(data => setCustomizeFields(Array.isArray(data) ? data : []))
            .catch(() => setCustomizeFields([]));
    }, [product]);

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
            // Nối dữ liệu customData thành chuỗi text
            const customTextArray = Object.entries(customData)
                .filter(([k, v]) => v && v.toString().trim() !== '')
                .map(([k, v]) => {
                    // Tìm label từ customizeFields
                    const fieldId = k.replace('field_', '');
                    const field = customizeFields.find(f => String(f.id) === fieldId);
                    const label = field ? field.fieldLabel : k;
                    return `${label}: ${v}`;
                });
            const customTextString = customTextArray.join(' | ');

            const res = await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    productId: product.id, 
                    quantity,
                    customText: customTextString || null,
                    selectedColor: selectedColor?.name || null
                })
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

    const submitCustomRequest = async (e) => {
        e.preventDefault();
        setIsSubmittingCustom(true);
        try {
            const res = await fetch('/api/custom-requests/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    customText: product.name,
                    description: customRequestDesc,
                    referenceImg: customRequestImgUrl
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                setIsCustomModalOpen(false);
                setCustomRequestDesc('');
                setCustomRequestImgUrl('');
            } else {
                alert(data.message || 'Lỗi gửi yêu cầu');
            }
        } catch (err) {
            alert('Lỗi hệ thống khi gửi yêu cầu');
        } finally {
            setIsSubmittingCustom(false);
        }
    };

    const getCustomSurcharge = () => {
        let surcharge = 0;
        customizeFields.forEach(field => {
            if (field.fieldType === 'select') {
                const selectedValue = customData[`field_${field.id}`];
                if (selectedValue) {
                    const names = field.options ? field.options.split(',').map(o => o.trim()) : [];
                    const prices = field.optionPrices ? field.optionPrices.split(',').map(p => p.trim()) : [];
                    const idx = names.indexOf(selectedValue);
                    if (idx !== -1 && prices[idx]) {
                        surcharge += Number(prices[idx]) || 0;
                    }
                }
            }
        });
        return surcharge;
    };

    // RENDER DYNAMIC CUSTOMIZE FIELDS TỪ DB
    const renderDynamicCustomizeFields = () => {
        if (!customizeFields || customizeFields.length === 0) return null;

        return (
            <div className="customizer-box" style={{ margin: '15px 0', padding: '15px', backgroundColor: '#f9f9f9', border: '1px dashed #c97a3e', borderRadius: '8px' }}>
                {customizeFields.map((field, idx) => (
                    <div key={idx} style={{ marginBottom: idx < customizeFields.length - 1 ? '12px' : 0 }}>
                        <label style={{ fontWeight: 600, fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                            {field.fieldLabel}{field.required && <span style={{color:'red'}}> *</span>}
                        </label>

                        {field.fieldType === 'text' && (
                            <input
                                type="text"
                                placeholder={field.placeholder || ''}
                                maxLength={field.maxLength || undefined}
                                value={customData[`field_${field.id}`] || ''}
                                onChange={(e) => setCustomData({ ...customData, [`field_${field.id}`]: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                            />
                        )}

                        {field.fieldType === 'textarea' && (
                            <textarea
                                placeholder={field.placeholder || ''}
                                rows="2"
                                value={customData[`field_${field.id}`] || ''}
                                onChange={(e) => setCustomData({ ...customData, [`field_${field.id}`]: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', resize: 'vertical' }}
                            />
                        )}

                        {field.fieldType === 'select' && (() => {
                            const names = field.options ? field.options.split(',').map(o => o.trim()) : [];
                            const prices = field.optionPrices ? field.optionPrices.split(',').map(p => p.trim()) : [];
                            return (
                                <select
                                    value={customData[`field_${field.id}`] || ''}
                                    onChange={(e) => setCustomData({ ...customData, [`field_${field.id}`]: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                >
                                    <option value="">-- Chọn --</option>
                                    {names.filter(o => o).map((opt, i) => {
                                        const price = Number(prices[i] || 0);
                                        const priceText = price > 0 ? ` (+${price.toLocaleString()}đ)` : '';
                                        return (
                                            <option key={i} value={opt}>
                                                {opt}{priceText}
                                            </option>
                                        );
                                    })}
                                </select>
                            );
                        })()}
                    </div>
                ))}
            </div>
        );
    };



    if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Đang tải...</div>;
    if (error) return <div style={{textAlign: 'center', padding: '50px', color: 'red'}}>Lỗi: {error}</div>;
    if (!product) return null;

    const surcharge = getCustomSurcharge();
    const baseDiscountPrice = product.discount > 0 ? product.price * (1 - product.discount/100) : product.price;
    const finalPrice = baseDiscountPrice + surcharge;

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
                                {finalPrice.toLocaleString()}đ
                                <span className="old-price" style={{marginLeft: 10}}>{(product.price + surcharge).toLocaleString()}đ</span>
                            </>
                        ) : (
                            `${finalPrice.toLocaleString()}đ`
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

                    {/* HIỂN THỊ KHU VỰC CUSTOMIZE DYNAMIC */}
                    {renderDynamicCustomizeFields()}

                    <div className="btn-box" style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                        <button className="cart-btn" onClick={handleAddToCart} style={{ flex: 1, padding: '12px 0', fontSize: '16px' }}>
                            <i className="fa-solid fa-cart-plus" style={{marginRight: 8}}></i>Thêm Vào Giỏ Hàng
                        </button>
                        <button className="buy-btn" onClick={handleBuyNow} style={{ flex: 1, padding: '12px 0', fontSize: '16px' }}>
                            Mua Ngay
                        </button>
                    </div>

                    {/* Chỉ hiện nút Yêu cầu Thiết kế Riêng nếu sản phẩm có chất liệu đặc biệt */}
                    {(() => {
                        // Map chất liệu đặc biệt hỗ trợ gia công (khắc, sơn, in)
                        const specialMaterialMap = {
                            'gỗ': 'khắc gỗ',
                            'thủy tinh': 'khắc thủy tinh',
                            'kim nhung': 'sơn kim nhung'
                        };
                        const productMaterials = product.materials || [];
                        const matchedSpecials = productMaterials
                            .filter(m => specialMaterialMap[m.name.trim().toLowerCase()])
                            .map(m => specialMaterialMap[m.name.trim().toLowerCase()]);

                        if (matchedSpecials.length === 0) return null;

                        const isSeller = user?.id && String(user.id) === String(product?.shop?.userId || product?.shop?.id || product?.userId || product?.shop_id || product?.id_user);
                        if (isSeller) return null;

                        return (
                            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
                                    Sản phẩm này hỗ trợ thiết kế đặc biệt: <strong>{matchedSpecials.join(', ')}</strong> (có tính phí).
                                </p>
                                <button 
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '8px', 
                                        background: '#fff', border: '1px solid #8B5E34', color: '#8B5E34', 
                                        fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s'
                                    }}
                                    onMouseOver={(e) => { e.target.style.background = '#8B5E34'; e.target.style.color = '#fff'; }}
                                    onMouseOut={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#8B5E34'; }}
                                    onClick={() => setIsCustomModalOpen(true)}
                                >
                                    Yêu Cầu Thiết Kế Riêng (Cần báo giá)
                                </button>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* SHOP INFO SECTION (SHOPEE STYLE) */}
            {product.shop && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 30px', margin: '20px auto', background: '#fff', 
                    borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    maxWidth: '1200px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <img 
                                src={product.shop.shopLogo || 'https://placehold.co/80x80?text=Shop'} 
                                alt={product.shop.shopName} 
                                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80?text=Shop'; }}
                            />
                            {product.shop.status === 1 && (
                                <span style={{
                                    position: 'absolute', bottom: 0, right: 0, background: '#ee4d2d', 
                                    color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold'
                                }}>Mall</span>
                            )}
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#333', fontWeight: '500' }}>{product.shop.shopName}</h3>
                            <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#757575' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <i className="fas fa-star" style={{ color: '#ffce3d' }}></i> Đánh giá: <span style={{ color: '#ee4d2d' }}>{Number(product.shop.rating || 0).toFixed(1)}</span>
                                </span>
                                <span style={{ borderLeft: '1px solid #ddd', paddingLeft: '20px' }}>
                                    Sản phẩm: <span style={{ color: '#ee4d2d' }}>{product.shop.products?.length || 'Đang cập nhật'}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {(!user?.id || String(user.id) !== String(product.shop.userId || product.shop.id || product.userId || product.shop_id || product.id_user)) && (
                            <button 
                                onClick={() => openChat && openChat(product)}
                                style={{ 
                                    padding: '10px 20px', border: '1px solid #ee4d2d', background: '#fff5f3', 
                                    color: '#ee4d2d', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <i className="fas fa-comments"></i> Chat Ngay
                            </button>
                        )}
                        <button 
                            onClick={() => window.location.href = `/shop/${product.shop.id}`}
                            style={{ 
                                padding: '10px 20px', border: '1px solid #e0e0e0', background: '#fff', 
                                color: '#555', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <i className="fas fa-store"></i> Xem Shop
                        </button>
                    </div>
                </div>
            )}

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

            {/* Custom Request Modal */}
            {isCustomModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
                        <h3 style={{ marginTop: 0, color: '#8B5E34' }}>Gửi Yêu Cầu Thiết Kế Riêng</h3>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '20px' }}>
                            Yêu cầu của bạn sẽ được gửi trực tiếp đến Shop. Shop sẽ xem xét vật liệu, công sức và gửi lại Báo giá chính xác nhất cho bạn.
                        </p>
                        <form onSubmit={submitCustomRequest}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Mô tả chi tiết yêu cầu:</label>
                                <textarea 
                                    required
                                    value={customRequestDesc}
                                    onChange={(e) => setCustomRequestDesc(e.target.value)}
                                    placeholder="VD: Tôi muốn khắc thêm logo công ty bằng laser lên mặt gỗ..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '100px', resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Đường dẫn ảnh minh họa (URL) - Nếu có:</label>
                                <input 
                                    type="text"
                                    value={customRequestImgUrl}
                                    onChange={(e) => setCustomRequestImgUrl(e.target.value)}
                                    placeholder="https://..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                                />
                                {customRequestImgUrl && (
                                    <img src={customRequestImgUrl} alt="Preview" style={{ marginTop: '10px', maxHeight: '100px', borderRadius: '8px' }} />
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsCustomModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#eee', cursor: 'pointer' }}>Hủy</button>
                                <button type="submit" disabled={isSubmittingCustom} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#D4A373', color: '#fff', fontWeight: 'bold', cursor: isSubmittingCustom ? 'not-allowed' : 'pointer' }}>
                                    {isSubmittingCustom ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;

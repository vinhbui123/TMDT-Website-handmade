import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductList from '../components/ProductList';
import '../assets/css/ShopPage.css';

const ShopPage = () => {
    const { id } = useParams();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchShopData = async () => {
            try {
                // Fetch shop profile
                const shopRes = await fetch(`/api/shop/profile/${id}`);
                if (!shopRes.ok) throw new Error('Không tìm thấy thông tin Shop');
                const shopData = await shopRes.json();
                setShop(shopData);

                // Fetch shop products
                const prodRes = await fetch(`/api/products/shop/${id}`);
                if (prodRes.ok) {
                    const prodData = await prodRes.json();
                    const processed = prodData.map(p => ({
                        ...p,
                        displayPrice: p.discount > 0 ? p.price * (1 - p.discount/100) : p.price
                    }));
                    setProducts(processed);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchShopData();
    }, [id]);

    const handleAddToCart = async (productId, quantity = 1) => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/cart/add', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ productId, quantity })
            });
            const data = await res.json();
            if (data.success) {
                alert('Thêm vào giỏ hàng thành công!');
                window.dispatchEvent(new Event('cartUpdated')); 
            } else {
                alert(data.message || "Lỗi khi thêm vào giỏ hàng");
            }
        } catch (err) {
            alert("Lỗi kết nối giỏ hàng!");
        }
    };

    if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Đang tải trang Shop...</div>;
    if (error) return <div style={{textAlign: 'center', padding: '50px', color: 'red'}}>Lỗi: {error}</div>;
    if (!shop) return <div style={{textAlign: 'center', padding: '50px'}}>Shop không tồn tại</div>;

    return (
        <div className="shop-page-container">
            {/* Shop Banner Header */}
            <div className="shop-banner">
                <div className="shop-banner-info">
                    <div className="shop-avatar-wrapper">
                        <img 
                            src={shop.shopLogo || 'https://placehold.co/100x100?text=Shop'} 
                            alt={shop.shopName} 
                            className="shop-avatar"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Shop'; }}
                        />
                        {shop.status === 1 && <span className="shop-mall-badge">Mall</span>}
                    </div>
                    <div className="shop-details">
                        <h2>{shop.shopName}</h2>
                        <p className="shop-desc">{shop.description || 'Shop chưa cập nhật mô tả'}</p>
                        
                        <div className="shop-stats">
                            <div className="stat-item">
                                <i className="fas fa-box"></i>
                                <span>Sản phẩm: <strong>{products.length}</strong></span>
                            </div>
                            <div className="stat-item">
                                <i className="fas fa-star" style={{color: '#ffce3d'}}></i>
                                <span>Đánh giá: <strong>{Number(shop.rating || 0).toFixed(1)}</strong></span>
                            </div>
                            <div className="stat-item">
                                <i className="fas fa-map-marker-alt"></i>
                                <span>Địa chỉ: <strong>{shop.shopAddress || 'Đang cập nhật'}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shop Products List */}
            <div className="shop-products-section">
                <div className="section-title">
                    <h3>SẢN PHẨM CỦA SHOP</h3>
                </div>
                {products.length > 0 ? (
                    <ProductList products={products} onAddToCart={handleAddToCart} />
                ) : (
                    <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                        Shop này chưa đăng sản phẩm nào.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopPage;

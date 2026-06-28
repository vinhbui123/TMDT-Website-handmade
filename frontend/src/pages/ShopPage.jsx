import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../assets/css/ShopPage.css';

const ShopPage = () => {
    const { shopId } = useParams();
    const [shopData, setShopData] = useState(null);

    useEffect(() => {
        fetch(`/api/customer/shops/${shopId}`)
            .then(res => res.json())
            .then(data => setShopData(data))
            .catch(err => console.error("Lỗi tải thông tin shop:", err));
    }, [shopId]);

    if (!shopData) return <div className="loading">Đang tải cửa hàng...</div>;

    const { shop, products } = shopData;

    return (
        <div className="shop-page-container">
            {/* Header Shop */}
            <div className="shop-header">
                <div className="shop-info">
                    <h1>{shop.shopName}</h1>
                    <p className="shop-desc">{shop.description}</p>
                    <div className="shop-meta">
                        <span>📍 {shop.shopAddress}</span>
                        <span>⭐ Đánh giá: {shop.rating || "Chưa có"}</span>
                    </div>
                </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="shop-products">
                <h2>Sản phẩm của shop</h2>
                <div className="product-grid">
                    {products.map(p => (
                        <Link to={`/product-detail?id=${p.id}`} key={p.id} className="prod-card">
                            <img src={p.img} alt={p.name} />
                            <div className="prod-info">
                                <h4>{p.name}</h4>
                                <p className="price">{p.price.toLocaleString()}đ</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShopPage;
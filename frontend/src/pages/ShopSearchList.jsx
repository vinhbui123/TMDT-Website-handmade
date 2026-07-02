import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const ShopSearchList = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // Lấy keyword từ URL (nếu có)
    const searchParams = new URLSearchParams(location.search);
    const keyword = searchParams.get('keyword') || '';

    const [searchInput, setSearchInput] = useState(keyword);

    useEffect(() => {
        const fetchShops = async () => {
            setLoading(true);
            try {
                const url = keyword 
                    ? `/api/shop/profile/search?keyword=${encodeURIComponent(keyword)}`
                    : '/api/shop/profile/search';
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setShops(data);
                }
            } catch (err) {
                console.error("Lỗi tải danh sách shop:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchShops();
    }, [keyword]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            window.location.href = `/shops?keyword=${encodeURIComponent(searchInput.trim())}`;
        } else {
            window.location.href = `/shops`;
        }
    };

    return (
        <div className="container" style={{ padding: '40px 20px', minHeight: '60vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#ee4d2d', margin: 0 }}>
                    {keyword ? `Kết quả tìm kiếm gian hàng cho: "${keyword}"` : 'Tất cả Gian Hàng'}
                </h2>
                
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="text" 
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Tìm tên gian hàng..." 
                        style={{ padding: '10px 15px', border: '1px solid #ddd', borderRadius: '4px', width: '250px' }}
                    />
                    <button type="submit" style={{ padding: '10px 20px', background: '#ee4d2d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Tìm kiếm
                    </button>
                </form>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải...</div>
            ) : shops.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {shops.map(shop => (
                        <div key={shop.id} style={{ 
                            border: '1px solid #eee', 
                            borderRadius: '8px', 
                            padding: '20px',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s',
                            cursor: 'pointer',
                            background: '#fff'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <img 
                                src={shop.shopLogo || 'https://placehold.co/100x100?text=Shop'} 
                                alt={shop.shopName}
                                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Shop'; }}
                            />
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>{shop.shopName}</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                                <span><i className="fas fa-star" style={{color: '#ffce3d', marginRight: '5px'}}></i> {Number(shop.rating || 0).toFixed(1)}</span>
                                <span><i className="fas fa-map-marker-alt" style={{marginRight: '5px'}}></i> {shop.shopAddress || 'Đang cập nhật'}</span>
                            </div>
                            <Link to={`/shop/${shop.id}`} style={{ 
                                display: 'inline-block',
                                padding: '8px 20px', 
                                background: 'transparent',
                                color: '#ee4d2d', 
                                border: '1px solid #ee4d2d', 
                                borderRadius: '4px',
                                textDecoration: 'none',
                                fontWeight: '500'
                            }}>
                                Xem Gian Hàng
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', background: '#f9f9f9', borderRadius: '8px' }}>
                    <h3 style={{ color: '#666' }}>Không tìm thấy gian hàng nào phù hợp.</h3>
                </div>
            )}
        </div>
    );
};

export default ShopSearchList;

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../assets/css/ShopDashboard.css';

// 🔥 KHAI BÁO CỔNG BACKEND SERVER CỦA BẠN (Thay đổi nếu bạn chạy cổng khác 8080)
const BACKEND_URL = 'http://localhost:8080';

// Ảnh local dự phòng lấy từ link CDN trực tuyến để tuyệt đối không bị lỗi lặp vòng lặp vô hạn 404
const DEFAULT_LOGO = 'https://picsum.photos/200';

export default function AdminVerifyShop() {
    const [pendingShops, setPendingShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const isAdmin = currentUser?.role === 1;

    const fetchPendingShops = async () => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/shops/pending', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setPendingShops(data);
                }
            } else {
                setError('Không thể lấy danh sách đơn từ Database.');
            }
        } catch (err) {
            setError('Lỗi kết nối máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingShops();
    }, []);

    const handleApprove = async (shopId, shopName) => {
        setMessage('Đang xử lý phê duyệt trên hệ thống...');
        try {
            const res = await fetch(`/api/admin/shops/approve/${shopId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                setMessage(`🎉 Đã duyệt thành công gian hàng "${shopName}" vào Database!`);
                setPendingShops(prev => prev.filter(s => (s.id || s._id) !== shopId));
            } else {
                setMessage('Có lỗi xảy ra từ máy chủ, không thể duyệt đơn.');
            }
        } catch (err) {
            setMessage('Lỗi kết nối, thao tác duyệt thất bại.');
        }
    };

    const handleReject = async (shopId, shopName) => {
        setMessage('Đang xử lý từ chối đơn...');
        try {
            const res = await fetch(`/api/admin/shops/reject/${shopId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                setMessage(`❌ Đã từ chối đơn đăng ký của gian hàng "${shopName}".`);
                setPendingShops(prev => prev.filter(s => (s.id || s._id) !== shopId));
            } else {
                setMessage('Có lỗi xảy ra từ máy chủ, không thể từ chối đơn.');
            }
        } catch (err) {
            setMessage('Lỗi kết nối, thao tác từ chối thất bại.');
        }
    };

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
                <h3>⚠️ Quyền truy cập bị từ chối</h3>
                <p>Bạn không có quyền quản trị Admin.</p>
                <button className="profile-btn" onClick={() => navigate('/')}>Quay về Trang Chủ</button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', backgroundColor: '#f4f6f9', fontFamily: 'Arial, sans-serif' }}>
            {/* SIDEBAR */}
            <aside style={{ width: '260px', backgroundColor: '#2c3e50', color: '#ecf0f1', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 5px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #34495e', backgroundColor: '#1a252f' }}>
                    <h3 style={{ margin: 0, color: '#3498db', fontSize: '18px' }}><i className="fas fa-user-shield" style={{ marginRight: '8px' }}></i>ADMIN PORTAL</h3>
                    <span style={{ fontSize: '12px', color: '#95a5a6' }}>Quản trị hệ thống</span>
                </div>
                <nav style={{ flex: 1, padding: '15px 0' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li style={{ backgroundColor: '#34495e' }}>
                            <Link to="/admin/verify-shop" style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', borderLeft: '4px solid #3498db' }}>
                                <i className="fas fa-store" style={{ width: '25px', color: '#3498db' }}></i> Duyệt Đơn Mở Shop
                                {pendingShops.length > 0 && (
                                    <span style={{ marginLeft: 'auto', backgroundColor: '#e74c3c', color: 'white', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{pendingShops.length}</span>
                                )}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* CONTENT */}
            <main style={{ flex: 1, padding: '30px', boxSizing: 'border-box' }}>
                <div className="shop-dashboard-card" style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div className="shop-dashboard-card-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                        <h2 style={{ color: '#2c3e50', margin: 0, fontSize: '22px' }}>Danh Sách Đơn Đăng Ký Chờ Phê Duyệt</h2>
                    </div>

                    {error && <div style={{ marginBottom: '20px', padding: '12px 15px', backgroundColor: '#fce4d6', color: '#c55a11', borderRadius: '4px' }}>{error}</div>}
                    {message && <div style={{ marginBottom: '20px', padding: '12px 15px', backgroundColor: '#e8f8f5', color: '#27ae60', borderRadius: '4px', fontSize: '14px', fontWeight: '500' }}><i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i> {message}</div>}

                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '30px' }}>Đang kết nối Database...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '12px', color: '#333', fontWeight: '600' }}>Logo</th>
                                    <th style={{ padding: '12px', color: '#333', fontWeight: '600' }}>Tên Cửa Hàng</th>
                                    <th style={{ padding: '12px', color: '#333', fontWeight: '600' }}>Địa Chỉ</th>
                                    <th style={{ padding: '12px', color: '#333', fontWeight: '600' }}>Mô tả kinh doanh</th>
                                    <th style={{ padding: '12px', textAlign: 'center', color: '#333', fontWeight: '600' }}>Thao tác xử lý</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pendingShops.map((shop) => {
                                    const currentId = shop.id || shop._id;

                                    // 🔥 SỬA Ở ĐÂY: Thêm BACKEND_URL vào trước chuỗi dẫn để ép React trỏ sang Server Java 8080 lấy ảnh
                                    const logoSrc = shop.shopLogo ? `${BACKEND_URL}${shop.shopLogo}` : DEFAULT_LOGO;

                                    return (
                                        <tr key={currentId} style={{ borderBottom: '1px solid #dee2e6' }}>
                                            <td style={{ padding: '12px' }}>
                                                <img
                                                    src={logoSrc}
                                                    alt="Logo"
                                                    style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = DEFAULT_LOGO; // Đổi sang ảnh CDN nếu ảnh chính lỗi, chặn đứng lặp vô hạn
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: '12px' }}><strong style={{ color: '#2c3e50' }}>{shop.shopName}</strong></td>
                                            <td style={{ padding: '12px', color: '#555', fontSize: '14px' }}>{shop.shopAddress}</td>
                                            <td style={{ padding: '12px', fontSize: '13px', color: '#666', maxWidth: '300px', wordBreak: 'break-word' }}>{shop.description}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                    <button style={{ padding: '7px 15px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }} onClick={() => handleApprove(currentId, shop.shopName)}><i className="fas fa-check" style={{ marginRight: '4px' }}></i> Duyệt</button>
                                                    <button style={{ padding: '7px 15px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', margin: 0 }} onClick={() => handleReject(currentId, shop.shopName)}><i className="fas fa-times" style={{ marginRight: '4px' }}></i> Từ Chối</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {pendingShops.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#95a5a6', fontStyle: 'italic' }}>Không có đơn đăng ký mở shop nào cần duyệt lúc này. ✨</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
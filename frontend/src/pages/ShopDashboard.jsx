import React, { useState, useEffect } from 'react';
import '../assets/css/ShopDashboard.css';

export default function ShopDashboard() {
    const [activeTab, setActiveTab] = useState('products');

    // --- STATES ---
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [profile, setProfile] = useState({ shopName: '', description: '', phoneNumber: '', shopAddress: '' });
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: 0, discount: 0, catalog_id: 1, description: '', img: '' });
    const [uploading, setUploading] = useState(false);

    // Lấy user đang đăng nhập từ localStorage
    const getUser = () => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    };

    const user = getUser();
    const shopId = user?.id;

    // --- FETCH DATA KHI LOAD ---
    useEffect(() => {
        if (!shopId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Fetch Hồ sơ
        fetch(`/api/shop/profile/me`, { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => setProfile({
                shopName: data.shopName || '',
                description: data.description || '',
                phoneNumber: data.phoneNumber || '',
                shopAddress: data.shopAddress || ''
            }))
            .catch(() => console.log('Không tải được Profile'));

        // Fetch Sản phẩm — lấy sản phẩm của shop hiện tại
        fetch('/api/shop/products', { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => {
                if (Array.isArray(data)) {
                    setProducts(data);
                }
            })
            .catch(() => console.log('Không tải được Products'));

        // Fetch Đơn hàng
        fetch('/api/shop/orders', { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => {
                if (Array.isArray(data)) {
                    setOrders(data);
                }
            })
            .catch(() => console.log('Không tải được Orders'))
            .finally(() => setLoading(false));
    }, [shopId]);

    // --- LOGIC SẢN PHẨM ---
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const data = new FormData();
        data.append('file', file);
        try {
            const res = await fetch('/api/shop/products/upload', {
                method: 'POST',
                credentials: 'include',
                body: data
            });
            const result = await res.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, img: result.url }));
            } else {
                alert(result.message || 'Lỗi tải ảnh');
            }
        } catch (err) { alert('Lỗi tải ảnh'); }
        setUploading(false);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const method = editingProduct ? 'PUT' : 'POST';
        const url = editingProduct ? `/api/shop/products/${editingProduct.id}` : '/api/shop/products';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (res.ok) {
                alert('Lưu sản phẩm thành công!');
                setIsModalOpen(false);
                // Refresh products
                const refreshRes = await fetch('/api/shop/products', { credentials: 'include' });
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    if (Array.isArray(data)) setProducts(data);
                }
            } else {
                alert(result.message || 'Lỗi khi lưu');
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Bạn muốn xóa sản phẩm này?')) return;
        try {
            const res = await fetch(`/api/shop/products/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                setProducts(products.filter(p => p.id !== id));
            }
        } catch (err) { console.error(err); }
    };

    // --- LOGIC ĐƠN HÀNG ---
    const updateOrderStatus = async (id, status) => {
        try {
            await fetch(`/api/shop/orders/${id}/status?status=${status}`, {
                method: 'PUT',
                credentials: 'include'
            });
            setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
        } catch (err) { console.error(err); }
    };

    // --- LOGIC HỒ SƠ ---
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/shop/profile/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(profile)
            });
            if (res.ok) {
                alert('Cập nhật hồ sơ thành công!');
            } else {
                const result = await res.json();
                alert(result.message || 'Lỗi cập nhật hồ sơ');
            }
        } catch (err) { console.error(err); }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 0: return 'Chờ duyệt';
            case 1: return 'Đã duyệt';
            case 2: return 'Đang giao';
            case 3: return 'Hoàn thành';
            case 4: return 'Đã hủy';
            default: return 'Không rõ';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 0: return 'status-pending';
            case 1: return 'status-approved';
            case 2: return 'status-shipping';
            case 3: return 'status-completed';
            case 4: return 'status-cancelled';
            default: return '';
        }
    };

    if (!shopId) {
        return (
            <div className="shop-dashboard">
                <div className="shop-empty">
                    <p>Vui lòng đăng nhập để truy cập Shop Dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="shop-dashboard">
            {/* HEADER */}
            <header className="shop-header">
                <div className="shop-header-inner">
                    <div className="shop-header-title">
                        <h1>{profile.shopName || 'Shop của Bạn'}</h1>
                        <p>Quản lý không gian sáng tạo của bạn</p>
                    </div>
                    <nav className="shop-tab-nav">
                        {['products', 'orders', 'profile'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`shop-tab-btn ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab === 'products' ? '🎨 Sản phẩm' : tab === 'orders' ? '📦 Đơn hàng' : '👤 Hồ sơ'}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* CONTENT */}
            <main className="shop-content">
                {loading ? (
                    <div className="shop-loading">
                        <div className="shop-loading-spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {/* --- TAB SẢN PHẨM --- */}
                        {activeTab === 'products' && (
                            <div className="shop-animate-in">
                                <div className="shop-section-header">
                                    <h2>Kho Sản Phẩm Handmade</h2>
                                    <button
                                        className="btn-primary"
                                        onClick={() => {
                                            setEditingProduct(null);
                                            setFormData({ name: '', price: 0, discount: 0, catalog_id: 1, description: '', img: '' });
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        + Thêm sản phẩm mới
                                    </button>
                                </div>

                                <div className="shop-table-card">
                                    <table className="shop-table">
                                        <thead>
                                            <tr>
                                                <th>Hình ảnh</th>
                                                <th>Tên sản phẩm</th>
                                                <th>Giá bán</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map(p => (
                                                <tr key={p.id}>
                                                    <td>
                                                        <img
                                                            src={p.img || '/placeholder.jpg'}
                                                            className="product-thumb"
                                                            alt={p.name}
                                                        />
                                                    </td>
                                                    <td className="product-name">{p.name}</td>
                                                    <td>
                                                        <span className="product-price">
                                                            {(p.price || 0).toLocaleString('vi-VN')}đ
                                                        </span>
                                                        {p.discount > 0 && (
                                                            <span className="product-discount-badge">-{p.discount}%</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn-edit"
                                                            onClick={() => {
                                                                setEditingProduct(p);
                                                                setFormData(p);
                                                                setIsModalOpen(true);
                                                            }}
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            className="btn-danger"
                                                            onClick={() => handleDeleteProduct(p.id)}
                                                        >
                                                            Xóa
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {products.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="shop-table-empty">
                                                        Chưa có sản phẩm nào. Hãy thêm mới nhé! 🎨
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* --- TAB ĐƠN HÀNG --- */}
                        {activeTab === 'orders' && (
                            <div className="shop-animate-in">
                                <div className="shop-section-header">
                                    <h2>Quản lý Đơn Đặt Hàng</h2>
                                </div>
                                <div className="order-list">
                                    {orders.map(o => (
                                        <div key={o.id} className="order-card">
                                            <div className="order-info">
                                                <h3>Đơn hàng #{o.id}</h3>
                                                <p>Khách hàng: {o.customerName || ('KH #' + o.userId)} • Đặt lúc: {o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                            </div>
                                            <div className="order-actions">
                                                <span className={`status-badge ${getStatusClass(o.status)}`}>
                                                    {getStatusLabel(o.status)}
                                                </span>

                                                {o.status === 0 && (
                                                    <>
                                                        <button className="btn-approve" onClick={() => updateOrderStatus(o.id, 1)}>Duyệt</button>
                                                        <button className="btn-cancel" onClick={() => updateOrderStatus(o.id, 4)}>Hủy</button>
                                                    </>
                                                )}
                                                {o.status === 1 && (
                                                    <button className="btn-ship" onClick={() => updateOrderStatus(o.id, 2)}>Giao hàng</button>
                                                )}
                                                {o.status === 2 && (
                                                    <button className="btn-complete" onClick={() => updateOrderStatus(o.id, 3)}>Đã giao xong</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {orders.length === 0 && (
                                        <div className="shop-empty">Chưa có đơn hàng nào 📦</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- TAB HỒ SƠ --- */}
                        {activeTab === 'profile' && (
                            <div className="shop-animate-in shop-profile-wrapper">
                                <div className="shop-profile-card">
                                    <h2>Thông tin Cửa hàng</h2>
                                    <form onSubmit={handleSaveProfile} className="shop-form">
                                        <div className="shop-form-group">
                                            <label>Tên shop Handmade</label>
                                            <input
                                                type="text"
                                                value={profile.shopName}
                                                onChange={e => setProfile({ ...profile, shopName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="shop-form-group">
                                            <label>Số điện thoại</label>
                                            <input
                                                type="text"
                                                value={profile.phoneNumber}
                                                onChange={e => setProfile({ ...profile, phoneNumber: e.target.value })}
                                            />
                                        </div>
                                        <div className="shop-form-group">
                                            <label>Địa chỉ</label>
                                            <input
                                                type="text"
                                                value={profile.shopAddress}
                                                onChange={e => setProfile({ ...profile, shopAddress: e.target.value })}
                                            />
                                        </div>
                                        <div className="shop-form-group">
                                            <label>Câu chuyện / Mô tả cửa hàng</label>
                                            <textarea
                                                rows="4"
                                                value={profile.description}
                                                onChange={e => setProfile({ ...profile, description: e.target.value })}
                                                placeholder="Chia sẻ tâm huyết về các sản phẩm thủ công của bạn..."
                                            />
                                        </div>
                                        <button type="submit" className="btn-save-profile">
                                            Lưu thay đổi hồ sơ
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* MODAL THÊM/SỬA SẢN PHẨM */}
            {isModalOpen && (
                <div className="shop-modal-overlay">
                    <div className="shop-modal">
                        <div className="shop-modal-header">
                            <h3>{editingProduct ? 'Sửa tác phẩm' : 'Thêm tác phẩm mới'}</h3>
                            <button className="shop-modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSaveProduct} className="shop-modal-body">
                            <div className="shop-form-group">
                                <label>Tên sản phẩm</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="shop-modal-row">
                                <div className="shop-form-group">
                                    <label>Giá (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="shop-form-group">
                                    <label>Giảm giá (%)</label>
                                    <input
                                        type="number"
                                        value={formData.discount}
                                        onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="shop-form-group">
                                <label>Hình ảnh</label>
                                <div className="shop-upload-area">
                                    <label className="shop-upload-btn">
                                        {uploading ? 'Đang tải...' : '📷 Tải ảnh lên'}
                                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                    {formData.img && <span className="shop-upload-success">✓ Đã chọn ảnh</span>}
                                </div>
                            </div>
                            <div className="shop-form-group">
                                <label>Mô tả chi tiết</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="shop-modal-actions">
                                <button type="button" className="btn-modal-cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-modal-save">Lưu Tác Phẩm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
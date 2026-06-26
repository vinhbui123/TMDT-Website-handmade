import React, { useState, useEffect } from 'react';
import '../assets/css/ShopDashboard.css';

export default function ShopDashboard() {
    const [activeTab, setActiveTab] = useState('products');

    // --- STATES ---
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customRequests, setCustomRequests] = useState([]);
    const [profile, setProfile] = useState({ shopName: '', description: '', phoneNumber: '', shopAddress: '' });
    const [loading, setLoading] = useState(true);

    const [allColors, setAllColors] = useState([]);
    const [allMaterials, setAllMaterials] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({ 
        name: '', price: 0, discount: 0, catalog_id: 1, description: '', img: '',
        colors: [], materials: [], subImg: []
    });
    const [uploading, setUploading] = useState(false);

    // STATES Báo giá Custom Request
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [quotingReq, setQuotingReq] = useState(null);
    const [quotePricing, setQuotePricing] = useState({ pricePerLetter: 10000, basePrice: 50000 });

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

        Promise.all([
            fetch(`/api/shop/profile/me`, { credentials: 'include' }).then(res => res.ok ? res.json() : {}),
            fetch('/api/shop/products', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
            fetch('/api/shop/orders', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
            fetch('/api/shop/custom-requests', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
            fetch('/api/colors').then(res => res.ok ? res.json() : []),
            fetch('/api/materials').then(res => res.ok ? res.json() : [])
        ]).then(([profileData, prods, ords, reqs, colors, materials]) => {
            if (profileData.shopName) setProfile(profileData);
            if (Array.isArray(prods)) setProducts(prods);
            if (Array.isArray(ords)) setOrders(ords);
            if (Array.isArray(reqs)) setCustomRequests(reqs);
            if (Array.isArray(colors)) setAllColors(colors);
            if (Array.isArray(materials)) setAllMaterials(materials);
        }).finally(() => setLoading(false));
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

    const handleSubImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setUploading(true);
        
        let uploadedUrls = [];
        for(let file of files) {
            const data = new FormData();
            data.append('file', file);
            try {
                const res = await fetch('/api/shop/products/upload', { method: 'POST', credentials: 'include', body: data });
                const result = await res.json();
                if (result.success) uploadedUrls.push(result.url);
            } catch (err) { console.error(err); }
        }
        setFormData(prev => ({ ...prev, subImg: [...(prev.subImg || []), ...uploadedUrls] }));
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
            const res = await fetch(`/api/shop/products/${id}`, { method: 'DELETE', credentials: 'include' });
            if (res.ok) setProducts(products.filter(p => p.id !== id));
        } catch (err) { console.error(err); }
    };

    // --- LOGIC CUSTOM REQUEST ---
    const calculateQuote = () => {
        const text = quotingReq?.customText || '';
        const lettersCount = text.replace(/\s/g, '').length; // Tính số chữ cái, bỏ qua khoảng trắng
        return (lettersCount * quotePricing.pricePerLetter) + quotePricing.basePrice;
    };

    const handleSendQuote = async () => {
        const finalPrice = calculateQuote();
        try {
            const res = await fetch(`/api/shop/custom-requests/${quotingReq.id}/quote`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ quotedPrice: finalPrice })
            });
            if (res.ok) {
                alert('Gửi báo giá thành công!');
                setIsQuoteModalOpen(false);
                setCustomRequests(customRequests.map(r => r.id === quotingReq.id ? { ...r, status: 1, quotedPrice: finalPrice } : r));
            } else {
                alert('Lỗi gửi báo giá');
            }
        } catch (err) { console.error(err); }
    };

    const openQuoteModal = (req) => {
        setQuotingReq(req);
        setIsQuoteModalOpen(true);
    };

    // --- LOGIC ĐƠN HÀNG ---
    const updateOrderStatus = async (id, status) => {
        try {
            await fetch(`/api/shop/orders/${id}/status?status=${status}`, { method: 'PUT', credentials: 'include' });
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
            if (res.ok) alert('Cập nhật hồ sơ thành công!');
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
                        {['products', 'orders', 'custom_requests', 'profile'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`shop-tab-btn ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab === 'products' ? '🎨 Sản phẩm' : tab === 'orders' ? '📦 Đơn hàng' : tab === 'custom_requests' ? '✨ Yêu cầu Custom' : '👤 Hồ sơ'}
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
                                            setFormData({ name: '', price: 0, discount: 0, catalog_id: 1, description: '', img: '', colors: [], materials: [], subImg: [] });
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
                                                        <img src={p.img || '/placeholder.jpg'} className="product-thumb" alt={p.name} />
                                                    </td>
                                                    <td className="product-name">{p.name}</td>
                                                    <td>
                                                        <span className="product-price">{(p.price || 0).toLocaleString('vi-VN')}đ</span>
                                                        {p.discount > 0 && <span className="product-discount-badge">-{p.discount}%</span>}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn-edit"
                                                            onClick={() => {
                                                                setEditingProduct(p);
                                                                setFormData({
                                                                    ...p,
                                                                    colors: p.colors || [],
                                                                    materials: p.materials || [],
                                                                    subImg: p.subImg || []
                                                                });
                                                                setIsModalOpen(true);
                                                            }}
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button className="btn-danger" onClick={() => handleDeleteProduct(p.id)}>Xóa</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {products.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="shop-table-empty">Chưa có sản phẩm nào. Hãy thêm mới nhé! 🎨</td>
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
                                                <span className={`status-badge ${getStatusClass(o.status)}`}>{getStatusLabel(o.status)}</span>
                                                {o.status === 0 && (
                                                    <>
                                                        <button className="btn-approve" onClick={() => updateOrderStatus(o.id, 1)}>Duyệt</button>
                                                        <button className="btn-cancel" onClick={() => updateOrderStatus(o.id, 4)}>Hủy</button>
                                                    </>
                                                )}
                                                {o.status === 1 && <button className="btn-ship" onClick={() => updateOrderStatus(o.id, 2)}>Giao hàng</button>}
                                                {o.status === 2 && <button className="btn-complete" onClick={() => updateOrderStatus(o.id, 3)}>Đã giao xong</button>}
                                            </div>
                                        </div>
                                    ))}
                                    {orders.length === 0 && <div className="shop-empty">Chưa có đơn hàng nào 📦</div>}
                                </div>
                            </div>
                        )}

                        {/* --- TAB YÊU CẦU CUSTOM --- */}
                        {activeTab === 'custom_requests' && (
                            <div className="shop-animate-in">
                                <div className="shop-section-header">
                                    <h2>Quản lý Yêu Cầu Làm Theo Mẫu (Custom Orders)</h2>
                                </div>
                                <div className="order-list">
                                    {customRequests.map(r => (
                                        <div key={r.id} className="order-card">
                                            <div className="order-info">
                                                <h3>Yêu cầu #{r.id} từ {r.customerName}</h3>
                                                <p><strong>Nội dung:</strong> {r.customText}</p>
                                                <p><strong>Mô tả:</strong> {r.description}</p>
                                                {r.referenceImg && <img src={r.referenceImg} alt="Reference" style={{maxWidth: '100px', borderRadius: '8px'}}/>}
                                            </div>
                                            <div className="order-actions" style={{display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end'}}>
                                                {r.status === 0 && <span className="status-badge status-pending">Chờ báo giá</span>}
                                                {r.status === 1 && <span className="status-badge status-approved">Đã báo giá: {r.quotedPrice?.toLocaleString('vi-VN')}đ</span>}
                                                {r.status === 2 && <span className="status-badge status-completed">Khách đã chốt</span>}
                                                
                                                {r.status === 0 && (
                                                    <button className="btn-primary" onClick={() => openQuoteModal(r)}>Tạo Báo Giá</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {customRequests.length === 0 && <div className="shop-empty">Chưa có yêu cầu custom nào ✨</div>}
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
                                            <label>Tên shop</label>
                                            <input type="text" value={profile.shopName} onChange={e => setProfile({ ...profile, shopName: e.target.value })} required />
                                        </div>
                                        <button type="submit" className="btn-save-profile">Lưu thay đổi hồ sơ</button>
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
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="shop-modal-row">
                                <div className="shop-form-group">
                                    <label>Giá (VNĐ)</label>
                                    <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required />
                                </div>
                                <div className="shop-form-group">
                                    <label>Giảm giá (%)</label>
                                    <input type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })} />
                                </div>
                            </div>

                            {/* ATTRIBUTES: MÀU SẮC & CHẤT LIỆU */}
                            <div className="shop-modal-row">
                                <div className="shop-form-group">
                                    <label>Màu sắc</label>
                                    <div className="checkbox-grid">
                                        {allColors.map(c => (
                                            <label key={c.id} className="checkbox-item">
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.colors.some(fc => fc.id === c.id)}
                                                    onChange={e => {
                                                        const newColors = e.target.checked 
                                                            ? [...formData.colors, c] 
                                                            : formData.colors.filter(fc => fc.id !== c.id);
                                                        setFormData({ ...formData, colors: newColors });
                                                    }}
                                                /> {c.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="shop-form-group">
                                    <label>Chất liệu</label>
                                    <div className="checkbox-grid">
                                        {allMaterials.map(m => (
                                            <label key={m.id} className="checkbox-item">
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.materials.some(fm => fm.id === m.id)}
                                                    onChange={e => {
                                                        const newMat = e.target.checked 
                                                            ? [...formData.materials, m] 
                                                            : formData.materials.filter(fm => fm.id !== m.id);
                                                        setFormData({ ...formData, materials: newMat });
                                                    }}
                                                /> {m.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="shop-form-group">
                                <label>Ảnh chính</label>
                                <div className="shop-upload-area">
                                    <label className="shop-upload-btn">
                                        {uploading ? 'Đang tải...' : 'Tải ảnh chính'}
                                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                    {formData.img && <span className="shop-upload-success">✓ {formData.img}</span>}
                                </div>
                            </div>

                            <div className="shop-form-group">
                                <label>Ảnh phụ (Nhiều ảnh)</label>
                                <div className="shop-upload-area">
                                    <label className="shop-upload-btn">
                                        {uploading ? 'Đang tải...' : 'Tải ảnh phụ'}
                                        <input type="file" accept="image/*" multiple onChange={handleSubImageUpload} />
                                    </label>
                                    <div className="sub-images-preview" style={{display:'flex', gap:'5px', marginTop:'10px'}}>
                                        {formData.subImg?.map((img, i) => (
                                            <img key={i} src={img} alt="sub" style={{width:'50px', height:'50px', objectFit:'cover', borderRadius:'4px'}}/>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="shop-form-group">
                                <label>Mô tả chi tiết</label>
                                <textarea rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="shop-modal-actions">
                                <button type="button" className="btn-modal-cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-modal-save">Lưu Tác Phẩm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL BÁO GIÁ CUSTOM REQUEST */}
            {isQuoteModalOpen && quotingReq && (
                <div className="shop-modal-overlay">
                    <div className="shop-modal" style={{maxWidth: '500px'}}>
                        <div className="shop-modal-header">
                            <h3>Báo giá Custom Order #{quotingReq.id}</h3>
                            <button className="shop-modal-close" onClick={() => setIsQuoteModalOpen(false)}>&times;</button>
                        </div>
                        <div className="shop-modal-body">
                            <div className="quote-preview" style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
                                <p><strong>Nội dung khắc/in:</strong> "{quotingReq.customText}"</p>
                                <p><strong>Số chữ cái (không tính khoảng trắng):</strong> {quotingReq.customText?.replace(/\s/g, '').length || 0} chữ</p>
                            </div>
                            <div className="shop-form-group">
                                <label>Giá nền sản phẩm (VNĐ)</label>
                                <input type="number" value={quotePricing.basePrice} onChange={e => setQuotePricing({...quotePricing, basePrice: Number(e.target.value)})} />
                            </div>
                            <div className="shop-form-group">
                                <label>Giá mỗi chữ cái (VNĐ)</label>
                                <input type="number" value={quotePricing.pricePerLetter} onChange={e => setQuotePricing({...quotePricing, pricePerLetter: Number(e.target.value)})} />
                            </div>
                            
                            <div className="quote-total" style={{textAlign: 'center', marginTop: '20px'}}>
                                <h4 style={{color: '#ff6b6b'}}>Tổng báo giá: {calculateQuote().toLocaleString('vi-VN')}đ</h4>
                            </div>

                            <div className="shop-modal-actions" style={{marginTop: '20px'}}>
                                <button type="button" className="btn-modal-cancel" onClick={() => setIsQuoteModalOpen(false)}>Hủy</button>
                                <button type="button" className="btn-primary" onClick={handleSendQuote}>Gửi Báo Giá Này</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
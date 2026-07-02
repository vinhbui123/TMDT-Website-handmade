import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../assets/css/ShopDashboard.css';

export default function ShopDashboard() {
    const [activeTab, setActiveTab] = useState('products');

    // --- STATES ---
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customRequests, setCustomRequests] = useState([]);
    const [refunds, setRefunds] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [revenueData, setRevenueData] = useState(null);
    const [profile, setProfile] = useState({ shopName: '', description: '', phoneNumber: '', shopAddress: '' });

    // STATES Mã giảm giá
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [couponForm, setCouponForm] = useState({
        code: '', discountType: 'FIXED', discountValue: 0,
        minOrderAmount: 0, maxDiscount: 0, quantity: 100,
        startDate: '', endDate: '', active: true
    });
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

    // STATES Customize Fields
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [customizeProductId, setCustomizeProductId] = useState(null);
    const [customizeProductName, setCustomizeProductName] = useState('');
    const [customizeFields, setCustomizeFields] = useState([]);
    const [savingCustomize, setSavingCustomize] = useState(false);

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
            fetch('/api/shop/reports', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
            fetch('/api/shop/coupons', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
            fetch('/api/shop/revenue', { credentials: 'include' }).then(res => res.ok ? res.json() : null),
            fetch('/api/colors').then(res => res.ok ? res.json() : []),
            fetch('/api/materials').then(res => res.ok ? res.json() : [])
        ]).then(([profileData, prods, ords, reqs, refs, cpns, revData, colors, materials]) => {
            if (profileData.shopName) setProfile(profileData);
            if (Array.isArray(prods)) setProducts(prods);
            if (Array.isArray(ords)) setOrders(ords);
            if (Array.isArray(reqs)) setCustomRequests(reqs);
            if (Array.isArray(refs)) setRefunds(refs);
            if (Array.isArray(cpns)) setCoupons(cpns);
            if (revData) setRevenueData(revData);
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

    const updateRefundStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/shop/reports/${id}/status?status=${status}`, { method: 'PUT', credentials: 'include' });
            if (res.ok) {
                setRefunds(refunds.map(r => r.id === id ? { ...r, status } : r));
            } else {
                const data = await res.json();
                alert(data.message || 'Lỗi cập nhật trạng thái hoàn tiền');
            }
        } catch (err) { console.error(err); }
    };

    // --- LOGIC HỒ SƠ ---
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('shopName', profile.shopName || '');
            if (profile.description) formData.append('description', profile.description);
            if (profile.shopAddress) formData.append('shopAddress', profile.shopAddress);
            if (profile.logoFile) formData.append('file', profile.logoFile);

            const res = await fetch(`/api/shop/profile/me`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setProfile({ ...profile, shopLogo: data.data?.shopLogo || profile.shopLogo, logoFile: null });
                alert('Cập nhật hồ sơ thành công!');
            } else {
                alert('Có lỗi xảy ra khi cập nhật hồ sơ!');
            }
        } catch (err) { console.error(err); }
    };

    const handleUpdateOption = (fieldIdx, optIdx, newName, newPrice) => {
        const arr = [...customizeFields];
        const field = arr[fieldIdx];
        const names = field.options ? field.options.split(',') : [];
        const prices = field.optionPrices ? field.optionPrices.split(',') : [];
        
        while (prices.length < names.length) {
            prices.push('0');
        }
        
        names[optIdx] = newName;
        prices[optIdx] = newPrice ? String(newPrice) : '0';
        
        field.options = names.join(',');
        field.optionPrices = prices.join(',');
        setCustomizeFields(arr);
    };

    const handleAddOption = (fieldIdx) => {
        const arr = [...customizeFields];
        const field = arr[fieldIdx];
        const names = field.options ? field.options.split(',') : [];
        const prices = field.optionPrices ? field.optionPrices.split(',') : [];
        
        names.push('');
        prices.push('0');
        
        field.options = names.join(',');
        field.optionPrices = prices.join(',');
        setCustomizeFields(arr);
    };

    const handleDeleteOption = (fieldIdx, optIdx) => {
        const arr = [...customizeFields];
        const field = arr[fieldIdx];
        const names = field.options ? field.options.split(',') : [];
        const prices = field.optionPrices ? field.optionPrices.split(',') : [];
        
        names.splice(optIdx, 1);
        if (prices.length > optIdx) {
            prices.splice(optIdx, 1);
        }
        
        field.options = names.join(',');
        field.optionPrices = prices.join(',');
        setCustomizeFields(arr);
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
                        {['products', 'orders', 'custom_requests', 'refunds', 'coupons', 'revenue', 'profile'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`shop-tab-btn ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab === 'products' ? 'Sản phẩm' : tab === 'orders' ? 'Đơn hàng' : tab === 'custom_requests' ? 'Yêu cầu Custom' : tab === 'refunds' ? 'Trả hàng / Hoàn tiền' : tab === 'coupons' ? 'Mã giảm giá' : tab === 'revenue' ? 'Báo cáo doanh thu' : 'Hồ sơ'}
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
                                                        <button className="btn-edit"
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
                                                        <button className="btn-primary" style={{marginLeft:'5px', fontSize:'12px', padding:'5px 10px'}} onClick={async () => {
                                                            setCustomizeProductId(p.id);
                                                            setCustomizeProductName(p.name);
                                                            try {
                                                                const res = await fetch(`/api/shop/products/${p.id}/customize-fields`, { credentials: 'include' });
                                                                const data = await res.json();
                                                                setCustomizeFields(Array.isArray(data) ? data : []);
                                                            } catch { setCustomizeFields([]); }
                                                            setIsCustomizeModalOpen(true);
                                                        }}>Customize</button>
                                                        <button className="btn-danger" onClick={() => handleDeleteProduct(p.id)}>Xóa</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {products.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="shop-table-empty">Chưa có sản phẩm nào. Hãy thêm mới nhé!</td>
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
                                                {o.orderDetails && o.orderDetails.length > 0 && (
                                                    <div style={{ marginTop: '10px', background: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
                                                        <h4 style={{ fontSize: '13px', marginBottom: '5px' }}>Sản phẩm:</h4>
                                                        <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px' }}>
                                                            {o.orderDetails.map((item, idx) => (
                                                                <li key={idx} style={{ marginBottom: '5px' }}>
                                                                    <strong>{item.product?.name || `Product #${item.productId}`}</strong> x{item.quantity}
                                                                    {item.selectedColor && <span> - Màu: {item.selectedColor}</span>}
                                                                    {item.customText && <div style={{ color: '#8B5E34', fontStyle: 'italic' }}>Tùy chỉnh: {item.customText}</div>}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
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
                                    {orders.length === 0 && <div className="shop-empty">Chưa có đơn hàng nào</div>}
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
                                    {customRequests.length === 0 && <div className="shop-empty">Chưa có yêu cầu custom nào</div>}
                                </div>
                            </div>
                        )}

                        {/* --- TAB TRẢ HÀNG --- */}
                        {activeTab === 'refunds' && (
                            <div className="shop-animate-in">
                                <div className="shop-section-header">
                                    <h2>Quản lý Yêu cầu Trả hàng / Hoàn tiền</h2>
                                </div>
                                <div className="order-list">
                                    {refunds.map(r => (
                                        <div key={r.id} className="order-card">
                                            <div className="order-info">
                                                <h3>Yêu cầu hoàn tiền Đơn hàng #{r.orderId}</h3>
                                                <p><strong>Lý do:</strong> {
                                                    r.reason === 'NOT_RECEIVED' ? 'Không nhận được hàng' :
                                                    r.reason === 'DAMAGED' ? 'Hàng bị hư hỏng / vỡ' :
                                                    r.reason === 'WRONG_ITEM' ? 'Hàng không đúng mô tả' :
                                                    r.reason === 'WRONG_COLOR' ? 'Hàng sai màu / mẫu' :
                                                    r.reason === 'MISSING_ITEM' ? 'Thiếu hàng / phụ kiện' : 'Lý do khác'
                                                }</p>
                                                <p><strong>Mô tả chi tiết:</strong> {r.description || 'Không có'}</p>
                                                {r.evidenceUrl && (
                                                    <div style={{ marginTop: '10px' }}>
                                                        <a href={`http://localhost:8080${r.evidenceUrl}`} target="_blank" rel="noreferrer">
                                                            <img src={`http://localhost:8080${r.evidenceUrl}`} alt="Bằng chứng" style={{ maxWidth: '120px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }} />
                                                        </a>
                                                        <p style={{ fontSize: '12px', color: '#888' }}>(Bấm vào ảnh để xem lớn)</p>
                                                    </div>
                                                )}
                                                <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>Ngày tạo: {new Date(r.createdAt).toLocaleString('vi-VN')}</p>
                                            </div>
                                            <div className="order-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                                                {r.status === 0 && <span className="status-badge status-pending">Chờ xử lý</span>}
                                                {r.status === 1 && <span className="status-badge status-approved">Đã chấp nhận hoàn tiền</span>}
                                                {r.status === 2 && <span className="status-badge status-cancelled">Đã từ chối</span>}
                                                
                                                {r.status === 0 && (
                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                        <button className="btn-approve" onClick={() => updateRefundStatus(r.id, 1)}>Chấp nhận</button>
                                                        <button className="btn-cancel" onClick={() => updateRefundStatus(r.id, 2)}>Từ chối</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {refunds.length === 0 && <div className="shop-empty">Chưa có yêu cầu hoàn tiền nào</div>}
                                </div>
                            </div>
                        )}

                        {/* --- TAB MÃ GIẢM GIÁ --- */}
                        {activeTab === 'coupons' && (
                            <div className="shop-animate-in">
                                <div className="shop-section-header">
                                    <h2>Quản lý Mã Giảm Giá</h2>
                                    <button className="btn-primary" onClick={() => {
                                        setEditingCoupon(null);
                                        setCouponForm({ code: '', discountType: 'FIXED', discountValue: 0, minOrderAmount: 0, maxDiscount: 0, quantity: 100, startDate: '', endDate: '', active: true });
                                        setIsCouponModalOpen(true);
                                    }}>+ Tạo mã mới</button>
                                </div>
                                <div className="shop-table-card">
                                    <table className="shop-table">
                                        <thead>
                                            <tr>
                                                <th>Mã</th>
                                                <th>Loại giảm</th>
                                                <th>Giá trị</th>
                                                <th>Đơn tối thiểu</th>
                                                <th>Đã dùng / Tổng</th>
                                                <th>Hạn sử dụng</th>
                                                <th>Trạng thái</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {coupons.map(c => (
                                                <tr key={c.id}>
                                                    <td><strong style={{color:'#ee4d2d',letterSpacing:'1px'}}>{c.code}</strong></td>
                                                    <td>{c.discountType === 'PERCENT' ? 'Giảm %' : 'Giảm cố định'}</td>
                                                    <td>{c.discountType === 'PERCENT' ? `${c.discountValue}%` : `${c.discountValue.toLocaleString('vi-VN')}đ`}
                                                        {c.discountType === 'PERCENT' && c.maxDiscount > 0 && <div style={{fontSize:'11px',color:'#888'}}>Tối đa {c.maxDiscount.toLocaleString('vi-VN')}đ</div>}
                                                    </td>
                                                    <td>{c.minOrderAmount > 0 ? `${c.minOrderAmount.toLocaleString('vi-VN')}đ` : 'Không'}</td>
                                                    <td>{c.usedCount} / {c.quantity}</td>
                                                    <td style={{fontSize:'12px'}}>
                                                        {c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : '—'}
                                                        <br/>→ {c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : '—'}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${c.active ? 'status-approved' : 'status-cancelled'}`}>
                                                            {c.active ? 'Đang hoạt động' : 'Đã tắt'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="btn-edit" onClick={() => {
                                                            setEditingCoupon(c);
                                                            setCouponForm({
                                                                code: c.code, discountType: c.discountType, discountValue: c.discountValue,
                                                                minOrderAmount: c.minOrderAmount, maxDiscount: c.maxDiscount, quantity: c.quantity,
                                                                startDate: c.startDate ? c.startDate.substring(0, 16) : '',
                                                                endDate: c.endDate ? c.endDate.substring(0, 16) : '',
                                                                active: c.active
                                                            });
                                                            setIsCouponModalOpen(true);
                                                        }}>Sửa</button>
                                                        <button className="btn-danger" style={{marginLeft:'5px'}} onClick={async () => {
                                                            if (!confirm('Bạn muốn xóa mã ' + c.code + '?')) return;
                                                            const res = await fetch(`/api/shop/coupons/${c.id}`, { method: 'DELETE', credentials: 'include' });
                                                            if (res.ok) setCoupons(coupons.filter(x => x.id !== c.id));
                                                        }}>Xóa</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {coupons.length === 0 && (
                                                <tr><td colSpan="8" className="shop-table-empty">Chưa có mã giảm giá nào. Hãy tạo mới!</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {/* --- TAB BÁO CÁO DOANH THU --- */}
                        {activeTab === 'revenue' && revenueData && (
                            <div className="shop-animate-in">
                                <div className="shop-section-header">
                                    <h2>Báo cáo doanh thu (Đơn đã giao)</h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center', borderTop: '4px solid #52c41a' }}>
                                        <h3 style={{ color: '#666', fontSize: '16px', marginBottom: '10px' }}>Tổng Doanh Thu</h3>
                                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a' }}>{revenueData.totalRevenue.toLocaleString('vi-VN')}đ</div>
                                    </div>
                                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center', borderTop: '4px solid #1890ff' }}>
                                        <h3 style={{ color: '#666', fontSize: '16px', marginBottom: '10px' }}>Tổng Đơn Hàng</h3>
                                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>{revenueData.totalOrders}</div>
                                    </div>
                                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center', borderTop: '4px solid #faad14' }}>
                                        <h3 style={{ color: '#666', fontSize: '16px', marginBottom: '10px' }}>Sản Phẩm Đã Bán</h3>
                                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#faad14' }}>{revenueData.totalProductsSold}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <h3 style={{ marginBottom: '20px', color: '#333' }}>Biểu đồ doanh thu theo tháng</h3>
                                        {revenueData.revenueByMonth.length > 0 ? (
                                            <div style={{ width: '100%', height: '300px' }}>
                                                <ResponsiveContainer>
                                                    <BarChart data={revenueData.revenueByMonth}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis dataKey="name" />
                                                        <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                                                        <Tooltip formatter={(val) => `${val.toLocaleString('vi-VN')}đ`} />
                                                        <Bar dataKey="revenue" fill="#ee4d2d" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', color: '#888', paddingTop: '50px' }}>Chưa có dữ liệu doanh thu</div>
                                        )}
                                    </div>

                                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <h3 style={{ marginBottom: '20px', color: '#333' }}>Top Sản phẩm bán chạy</h3>
                                        {revenueData.topProducts.length > 0 ? (
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                {revenueData.topProducts.map((p, idx) => (
                                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                                        <div style={{ width: '24px', fontWeight: 'bold', color: '#ee4d2d' }}>#{idx + 1}</div>
                                                        <img src={p.img || 'https://placehold.co/40x40'} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', margin: '0 10px' }} alt="" />
                                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{p.name}</div>
                                                            <div style={{ fontSize: '12px', color: '#666' }}>Đã bán: <strong style={{color:'#333'}}>{p.quantity}</strong></div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div style={{ textAlign: 'center', color: '#888', paddingTop: '50px' }}>Chưa có dữ liệu</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB HỒ SƠ --- */}
                        {activeTab === 'profile' && (
                            <div className="shop-animate-in shop-profile-wrapper">
                                <div className="shop-profile-card">
                                    <h2>Thông tin Cửa hàng</h2>
                                    <form onSubmit={handleSaveProfile} className="shop-form">
                                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center' }}>
                                            <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                                                <img 
                                                    src={profile.logoPreview || profile.shopLogo || 'https://placehold.co/100x100?text=Logo'} 
                                                    alt="Shop Logo" 
                                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ee4d2d' }} 
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Logo'; }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Logo Cửa hàng</label>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setProfile({ 
                                                                ...profile, 
                                                                logoFile: file, 
                                                                logoPreview: URL.createObjectURL(file) 
                                                            });
                                                        }
                                                    }}
                                                    style={{ fontSize: '14px' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="shop-form-group">
                                            <label>Tên shop</label>
                                            <input type="text" value={profile.shopName} onChange={e => setProfile({ ...profile, shopName: e.target.value })} required />
                                        </div>
                                        <div className="shop-form-group">
                                            <label>Địa chỉ cửa hàng</label>
                                            <input type="text" value={profile.shopAddress || ''} onChange={e => setProfile({ ...profile, shopAddress: e.target.value })} required />
                                        </div>
                                        <div className="shop-form-group">
                                            <label>Mô tả shop</label>
                                            <textarea rows="4" value={profile.description || ''} onChange={e => setProfile({ ...profile, description: e.target.value })} required />
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

            {/* ===== MODAL QUẢN LÝ CUSTOMIZE FIELDS ===== */}
            {isCustomizeModalOpen && (
                <div className="shop-modal-overlay">
                    <div className="shop-modal" style={{ maxWidth: '650px', padding: 0, overflow: 'hidden' }}>
                        <div className="shop-modal-header" style={{ padding: '20px 24px', background: '#fdfbf7', borderBottom: '1px solid #eae1d5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#5a4031', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-sliders"></i> Tùy chỉnh: {customizeProductName}
                            </h3>
                            <button className="shop-modal-close" onClick={() => setIsCustomizeModalOpen(false)}>×</button>
                        </div>
                        
                        <div className="shop-modal-body" style={{ padding: '24px', maxHeight: '65vh', overflowY: 'auto', background: '#fafaf9' }}>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
                                Thiết lập các thông tin khách hàng cần cung cấp khi mua sản phẩm này.
                            </p>

                            {customizeFields.map((field, idx) => (
                                <div key={idx} style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #e5e7eb' }}>
                                        <strong style={{ fontSize: '14px', color: '#4b5563' }}><i className="fa-solid fa-list-ul" style={{marginRight:'8px', color:'#9ca3af'}}></i>Trường #{idx + 1}</strong>
                                        <button className="btn-danger" style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }} onClick={() => {
                                            setCustomizeFields(prev => prev.filter((_, i) => i !== idx));
                                        }}>
                                            <i className="fa-solid fa-trash-can"></i> Xóa
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="shop-form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', display: 'block' }}>Tên trường hiển thị:</label>
                                            <input type="text" value={field.fieldLabel || ''} placeholder="VD: Ghi chú cho Shop"
                                                onChange={e => { const arr = [...customizeFields]; arr[idx] = { ...arr[idx], fieldLabel: e.target.value }; setCustomizeFields(arr); }}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s' }} 
                                                onFocus={e => e.target.style.borderColor = '#D4A373'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                                        </div>
                                        <div className="shop-form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', display: 'block' }}>Loại nhập liệu:</label>
                                            <select value={field.fieldType || 'text'}
                                                onChange={e => { const arr = [...customizeFields]; arr[idx] = { ...arr[idx], fieldType: e.target.value }; setCustomizeFields(arr); }}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', backgroundColor: '#fff', transition: 'border-color 0.2s' }}
                                                onFocus={e => e.target.style.borderColor = '#D4A373'} onBlur={e => e.target.style.borderColor = '#d1d5db'}>
                                                <option value="text">Ô nhập ngắn (Text)</option>
                                                <option value="textarea">Ô nhập dài (Textarea)</option>
                                                <option value="select">Danh sách chọn (Select)</option>
                                            </select>
                                        </div>
                                        {field.fieldType !== 'select' && (
                                            <div className="shop-form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', display: 'block' }}>Gợi ý (Placeholder):</label>
                                                <input type="text" value={field.placeholder || ''} placeholder="Gợi ý cho khách..."
                                                    onChange={e => { const arr = [...customizeFields]; arr[idx] = { ...arr[idx], placeholder: e.target.value }; setCustomizeFields(arr); }}
                                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s' }}
                                                    onFocus={e => e.target.style.borderColor = '#D4A373'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                                            </div>
                                        )}
                                        {field.fieldType !== 'select' && (
                                            <div className="shop-form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', display: 'block' }}>Max ký tự (Tùy chọn):</label>
                                                <input type="number" value={field.maxLength || ''} placeholder="VD: 10"
                                                    onChange={e => { const arr = [...customizeFields]; arr[idx] = { ...arr[idx], maxLength: e.target.value ? Number(e.target.value) : undefined }; setCustomizeFields(arr); }}
                                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s' }}
                                                    onFocus={e => e.target.style.borderColor = '#D4A373'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                                            </div>
                                        )}
                                    </div>
                                    {field.fieldType === 'select' && (() => {
                                        const names = field.options ? field.options.split(',') : [];
                                        const prices = field.optionPrices ? field.optionPrices.split(',') : [];
                                        return (
                                            <div className="shop-form-group" style={{ marginTop: '12px', marginBottom: 0, padding: '12px', background: '#f3f4f6', borderRadius: '8px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Các lựa chọn & Giá cộng thêm (VNĐ):</label>
                                                {names.map((name, optIdx) => {
                                                    const price = prices[optIdx] || '0';
                                                    return (
                                                        <div key={optIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                                            <input type="text" value={name} placeholder="Tên lựa chọn (VD: Dây chốt vàng)"
                                                                onChange={e => handleUpdateOption(idx, optIdx, e.target.value, price)}
                                                                style={{ flex: 2, padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none' }} />
                                                            <input type="number" value={price === '0' ? '' : price} placeholder="Giá thêm (+đ)"
                                                                onChange={e => handleUpdateOption(idx, optIdx, name, e.target.value)}
                                                                style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none' }} />
                                                            <button type="button" onClick={() => handleDeleteOption(idx, optIdx)}
                                                                style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px', fontSize: '13px', fontWeight: 600 }}>
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                                <button type="button" onClick={() => handleAddOption(idx)}
                                                    style={{ marginTop: '4px', padding: '6px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, color: '#8B5E34' }}>
                                                    + Thêm lựa chọn
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))}

                            <button type="button" 
                                style={{ width: '100%', padding: '12px', border: '2px dashed #D4A373', borderRadius: '12px', background: '#fdfbf7', cursor: 'pointer', color: '#8B5E34', fontWeight: 600, transition: 'all 0.2s' }}
                                onMouseOver={e => { e.target.style.background = '#f5ede3'; }}
                                onMouseOut={e => { e.target.style.background = '#fdfbf7'; }}
                                onClick={() => setCustomizeFields(prev => [...prev, { fieldLabel: '', fieldType: 'text', placeholder: '', options: '', isRequired: false }])}
                            >
                                <i className="fa-solid fa-plus" style={{marginRight: '8px'}}></i> Thêm trường mới
                            </button>
                        </div>

                        <div className="shop-modal-actions" style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #eae1d5', display: 'flex', gap: '12px' }}>
                            <button type="button" className="btn-modal-cancel" onClick={() => setIsCustomizeModalOpen(false)}>Hủy</button>
                            <button type="button" className="btn-primary" disabled={savingCustomize} onClick={async () => {
                                setSavingCustomize(true);
                                try {
                                    const res = await fetch(`/api/shop/products/${customizeProductId}/customize-fields`, {
                                        method: 'POST', credentials: 'include',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(customizeFields)
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        alert('Đã lưu cấu hình tùy chỉnh thành công!');
                                        setIsCustomizeModalOpen(false);
                                    } else {
                                        alert(data.message || 'Lỗi lưu');
                                    }
                                } catch (err) { alert('Lỗi hệ thống'); }
                                setSavingCustomize(false);
                            }}>
                                {savingCustomize ? 'Đang lưu...' : 'Lưu cấu hình'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TẠO/SỬA MÃ GIẢM GIÁ */}
            {isCouponModalOpen && (
                <div className="shop-modal-overlay">
                    <div className="shop-modal" style={{maxWidth: '550px'}}>
                        <div className="shop-modal-header">
                            <h3>{editingCoupon ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá mới'}</h3>
                            <button className="shop-modal-close" onClick={() => setIsCouponModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const method = editingCoupon ? 'PUT' : 'POST';
                            const url = editingCoupon ? `/api/shop/coupons/${editingCoupon.id}` : '/api/shop/coupons';
                            const payload = {
                                ...couponForm,
                                startDate: couponForm.startDate || null,
                                endDate: couponForm.endDate || null
                            };
                            try {
                                const res = await fetch(url, {
                                    method, credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload)
                                });
                                const data = await res.json();
                                if (data.success) {
                                    alert(data.message);
                                    setIsCouponModalOpen(false);
                                    // Refresh coupons
                                    const refreshRes = await fetch('/api/shop/coupons', { credentials: 'include' });
                                    if (refreshRes.ok) {
                                        const refreshed = await refreshRes.json();
                                        if (Array.isArray(refreshed)) setCoupons(refreshed);
                                    }
                                } else {
                                    alert(data.message || 'Lỗi');
                                }
                            } catch (err) { alert('Lỗi hệ thống'); }
                        }} className="shop-modal-body">
                            <div className="shop-form-group">
                                <label>Mã giảm giá (VD: SUMMER50K)</label>
                                <input type="text" value={couponForm.code}
                                    onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                                    required disabled={!!editingCoupon}
                                    style={{letterSpacing:'2px', fontWeight:'bold'}} />
                            </div>
                            <div className="shop-modal-row">
                                <div className="shop-form-group">
                                    <label>Loại giảm giá</label>
                                    <select value={couponForm.discountType}
                                        onChange={e => setCouponForm({...couponForm, discountType: e.target.value})}>
                                        <option value="FIXED">Giảm cố định (VNĐ)</option>
                                        <option value="PERCENT">Giảm theo %</option>
                                    </select>
                                </div>
                                <div className="shop-form-group">
                                    <label>Giá trị giảm {couponForm.discountType === 'PERCENT' ? '(%)' : '(VNĐ)'}</label>
                                    <input type="number" value={couponForm.discountValue}
                                        onChange={e => setCouponForm({...couponForm, discountValue: Number(e.target.value) || 0})} required />
                                </div>
                            </div>
                            <div className="shop-modal-row">
                                <div className="shop-form-group">
                                    <label>Đơn hàng tối thiểu (VNĐ)</label>
                                    <input type="number" value={couponForm.minOrderAmount}
                                        onChange={e => setCouponForm({...couponForm, minOrderAmount: Number(e.target.value) || 0})} />
                                </div>
                                {couponForm.discountType === 'PERCENT' && (
                                    <div className="shop-form-group">
                                        <label>Giảm tối đa (VNĐ)</label>
                                        <input type="number" value={couponForm.maxDiscount}
                                            onChange={e => setCouponForm({...couponForm, maxDiscount: Number(e.target.value) || 0})} />
                                    </div>
                                )}
                            </div>
                            <div className="shop-form-group">
                                <label>Tổng số lượt sử dụng</label>
                                <input type="number" value={couponForm.quantity}
                                    onChange={e => setCouponForm({...couponForm, quantity: Number(e.target.value) || 0})} required />
                            </div>
                            <div className="shop-modal-row">
                                <div className="shop-form-group">
                                    <label>Ngày bắt đầu</label>
                                    <input type="datetime-local" value={couponForm.startDate}
                                        onChange={e => setCouponForm({...couponForm, startDate: e.target.value})} />
                                </div>
                                <div className="shop-form-group">
                                    <label>Ngày hết hạn</label>
                                    <input type="datetime-local" value={couponForm.endDate}
                                        onChange={e => setCouponForm({...couponForm, endDate: e.target.value})} />
                                </div>
                            </div>
                            {editingCoupon && (
                                <div className="shop-form-group">
                                    <label style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                        <input type="checkbox" checked={couponForm.active}
                                            onChange={e => setCouponForm({...couponForm, active: e.target.checked})} />
                                        Đang hoạt động
                                    </label>
                                </div>
                            )}
                            <div className="shop-modal-actions">
                                <button type="button" className="btn-modal-cancel" onClick={() => setIsCouponModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-modal-save">{editingCoupon ? 'Cập nhật' : 'Tạo mã'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
import React, { useState, useEffect } from 'react';

export default function ShopDashboard() {
    const [activeTab, setActiveTab] = useState('products');

    // --- STATES ---
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [profile, setProfile] = useState({ lastName: '', bio: '', phoneNumber: '', address: '' });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: 0, discount: 0, catalogId: 1, description: '', img: '' });
    const [uploading, setUploading] = useState(false);

    // --- FETCH DATA MẪU KHI LOAD ---
    useEffect(() => {
        // Fetch Hồ sơ
        fetch('/api/shop/profile/1').then(res => res.json())
            .then(data => setProfile(data)).catch(() => console.log('Dùng data mẫu Profile'));

        // Fetch Sản phẩm
        fetch('/api/shop/products/owner/1').then(res => res.json())
            .then(data => setProducts(data)).catch(() => console.log('Dùng data mẫu Products'));

        // Fetch Đơn hàng
        fetch('/api/shop/orders').then(res => res.json())
            .then(data => setOrders(data)).catch(() => console.log('Dùng data mẫu Orders'));
    }, []);

    // --- LOGIC SẢN PHẨM ---
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const data = new FormData();
        data.append('file', file);
        try {
            const res = await fetch('/api/shop/products/upload', { method: 'POST', body: data });
            const imgPath = await res.text();
            setFormData({ ...formData, img: imgPath });
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
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert('Lưu sản phẩm thành công!');
                setIsModalOpen(false);
                // Refresh list
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Bạn muốn xóa sản phẩm này?')) return;
        try {
            await fetch(`/api/shop/products/${id}`, { method: 'DELETE' });
            setProducts(products.filter(p => p.id !== id));
        } catch (err) { console.error(err); }
    };

    // --- LOGIC ĐƠN HÀNG ---
    const updateOrderStatus = async (id, status) => {
        try {
            await fetch(`/api/shop/orders/${id}/status?status=${status}`, { method: 'PUT' });
            setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
        } catch (err) { console.error(err); }
    };

    // --- LOGIC HỒ SƠ ---
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/shop/profile/1', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });
            alert('Cập nhật hồ sơ thành công!');
        } catch (err) { console.error(err); }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans text-gray-800">
            {/* HEADER */}
            <header className="bg-white border-b border-[#F0EBE1] shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[#8B5E34]">Shop của {profile.lastName || 'Bạn'}</h1>
                        <p className="text-sm text-gray-500">Quản lý không gian sáng tạo của bạn</p>
                    </div>
                    <nav className="flex space-x-2 bg-[#F9F7F2] p-1 rounded-xl border border-[#F0EBE1]">
                        {['products', 'orders', 'profile'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                    activeTab === tab
                                        ? 'bg-white text-[#8B5E34] shadow-sm border border-[#E8E0D0]'
                                        : 'text-gray-500 hover:text-[#8B5E34]'
                                }`}
                            >
                                {tab === 'products' ? ' Sản phẩm' : tab === 'orders' ? ' Đơn hàng' : ' Hồ sơ'}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* CONTENT */}
            <main className="max-w-6xl mx-auto px-6 py-8">

                {/* --- TAB SẢN PHẨM --- */}
                {activeTab === 'products' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Kho Sản Phẩm Handmade</h2>
                            <button
                                onClick={() => { setEditingProduct(null); setFormData({ name: '', price: 0, discount: 0, catalogId: 1, description: '', img: '' }); setIsModalOpen(true); }}
                                className="bg-[#D4A373] hover:bg-[#C28E5C] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
                            >
                                + Thêm tác phẩm mới
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-[#F0EBE1] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-[#FDFBF7] border-b border-[#F0EBE1] text-sm text-gray-500">
                                <tr>
                                    <th className="p-4 font-semibold">Hình ảnh</th>
                                    <th className="p-4 font-semibold">Tên sản phẩm</th>
                                    <th className="p-4 font-semibold">Giá bán</th>
                                    <th className="p-4 font-semibold text-right">Thao tác</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F0EBE1]">
                                {products.map(p => (
                                    <tr key={p.id} className="hover:bg-[#FDFBF7]/50 transition">
                                        <td className="p-4"><img src={p.img || '/placeholder.jpg'} className="w-16 h-16 object-cover rounded-lg border border-gray-100" alt={p.name}/></td>
                                        <td className="p-4 font-medium text-gray-800">{p.name}</td>
                                        <td className="p-4">
                                            <span className="text-[#8B5E34] font-semibold">{p.price.toLocaleString('vi-VN')}đ</span>
                                            {p.discount > 0 && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-md">-{p.discount}%</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => { setEditingProduct(p); setFormData(p); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700 font-medium mr-4">Sửa</button>
                                            <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:text-red-600 font-medium">Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-400">Chưa có sản phẩm nào. Hãy thêm mới nhé!</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB ĐƠN HÀNG --- */}
                {activeTab === 'orders' && (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Quản lý Đơn Đặt Hàng</h2>
                        {orders.map(o => (
                            <div key={o.id} className="bg-white p-5 rounded-2xl shadow-sm border border-[#F0EBE1] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-gray-800">Đơn hàng #{o.id}</h3>
                                    <p className="text-sm text-gray-500 mt-1">Khách hàng ID: {o.userId} • Đặt lúc: {new Date(o.createAt).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${o.status === 0 ? 'bg-amber-100 text-amber-700' : o.status === 1 ? 'bg-blue-100 text-blue-700' : o.status === 2 ? 'bg-indigo-100 text-indigo-700' : o.status === 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {o.status === 0 ? 'Chờ duyệt' : o.status === 1 ? 'Đã duyệt' : o.status === 2 ? 'Đang giao' : o.status === 3 ? 'Hoàn thành' : 'Đã hủy'}
                  </span>

                                    {o.status === 0 && (
                                        <>
                                            <button onClick={() => updateOrderStatus(o.id, 1)} className="bg-[#D4A373] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#C28E5C]">Duyệt</button>
                                            <button onClick={() => updateOrderStatus(o.id, 4)} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200">Hủy</button>
                                        </>
                                    )}
                                    {o.status === 1 && <button onClick={() => updateOrderStatus(o.id, 2)} className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600">Giao hàng</button>}
                                    {o.status === 2 && <button onClick={() => updateOrderStatus(o.id, 3)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600">Đã giao xong</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- TAB HỒ SƠ --- */}
                {activeTab === 'profile' && (
                    <div className="max-w-2xl mx-auto animate-fade-in">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#F0EBE1]">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Thông tin Cửa hàng</h2>
                            <form onSubmit={handleSaveProfile} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tên shop Handmade</label>
                                    <input type="text" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373] transition-all" required/>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Câu chuyện / Mô tả cửa hàng</label>
                                    <textarea rows="4" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373] transition-all resize-none" placeholder="Chia sẻ tâm huyết về các sản phẩm thủ công của bạn..."/>
                                </div>
                                <button type="submit" className="w-full bg-[#8B5E34] hover:bg-[#734A27] text-white py-3.5 rounded-xl font-bold transition-colors shadow-md">
                                    Lưu thay đổi hồ sơ
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL THÊM/SỬA SẢN PHẨM */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#FDFBF7]">
                            <h3 className="font-bold text-gray-800 text-lg">{editingProduct ? 'Sửa tác phẩm' : 'Thêm tác phẩm mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên sản phẩm</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#D4A373] focus:outline-none" required/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Giá (VNĐ)</label>
                                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#D4A373] focus:outline-none" required/>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Giảm giá (%)</label>
                                    <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#D4A373] focus:outline-none"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Hình ảnh</label>
                                <div className="flex items-center space-x-3">
                                    <label className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors">
                                        {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                    {formData.img && <span className="text-sm text-green-600 font-medium truncate max-w-[200px]">Đã chọn ảnh</span>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả chi tiết</label>
                                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#D4A373] focus:outline-none resize-none"></textarea>
                            </div>
                            <div className="pt-2 flex space-x-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Hủy</button>
                                <button type="submit" className="flex-1 py-3 bg-[#D4A373] text-white rounded-xl font-bold hover:bg-[#C28E5C] transition-colors shadow-md">Lưu Tác Phẩm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
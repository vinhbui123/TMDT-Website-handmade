import React, { useState, useEffect } from 'react';

function AdminApproveShops() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchPendingShops();
    }, []);

    const fetchPendingShops = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/shops/pending', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setShops(data);
            }
        } catch (err) {
            console.error('Lỗi khi lấy danh sách shop:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (shopId, action) => {
        if (!window.confirm(`Bạn có chắc chắn muốn ${action === 'approve' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} shop này?`)) return;

        try {
            const res = await fetch(`/api/admin/shops/${shopId}/${action}`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setMessage(data.message);
                fetchPendingShops(); // Reload list
            } else {
                alert(data.message || 'Có lỗi xảy ra');
            }
        } catch (err) {
            alert('Lỗi kết nối máy chủ');
        }
    };

    if (loading) {
        return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải danh sách...</div>;
    }

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <h2 style={{ color: '#333', marginBottom: '30px', borderBottom: '2px solid #ee4d2d', paddingBottom: '10px' }}>
                <i className="fas fa-clipboard-check" style={{ marginRight: '10px', color: '#ee4d2d' }}></i>
                Quản lý Xét duyệt Người Bán
            </h2>

            {message && (
                <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '8px', background: '#e8f5e9', color: '#2e7d32' }}>
                    {message}
                </div>
            )}

            {shops.length === 0 ? (
                <div style={{ background: '#f9f9f9', padding: '40px', textAlign: 'center', borderRadius: '8px', color: '#666' }}>
                    Không có hồ sơ nào đang chờ duyệt.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {shops.map(shop => (
                        <div key={shop.id} style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', gap: '20px' }}>
                            <div style={{ flex: '0 0 120px' }}>
                                <img src={shop.shopLogo || '/images/default-logo.png'} alt="Logo" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />
                                <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>ID: {shop.id}</div>
                            </div>
                            
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 10px 0', color: '#ee4d2d' }}>{shop.shopName}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                    <div><strong>Người đại diện:</strong> {shop.ownerName || 'N/A'}</div>
                                    <div><strong>Số điện thoại:</strong> {shop.user?.phoneNumber || 'N/A'}</div>
                                    <div><strong>Số CCCD:</strong> {shop.identityCardNumber || 'N/A'}</div>
                                    <div><strong>Mã số thuế:</strong> {shop.taxCode || 'N/A'}</div>
                                    <div style={{ gridColumn: '1 / span 2' }}><strong>Địa chỉ:</strong> {shop.shopAddress || 'N/A'}</div>
                                    <div style={{ gridColumn: '1 / span 2' }}><strong>Mô tả:</strong> {shop.description || 'N/A'}</div>
                                </div>

                                <div>
                                    <strong style={{ display: 'block', marginBottom: '10px' }}>Tài liệu đính kèm (CCCD):</strong>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        {shop.identityCardFront ? (
                                            <a href={shop.identityCardFront} target="_blank" rel="noreferrer">
                                                <img src={shop.identityCardFront} alt="Mặt trước CCCD" style={{ height: '100px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                            </a>
                                        ) : <span>Không có CCCD mặt trước</span>}

                                        {shop.identityCardBack ? (
                                            <a href={shop.identityCardBack} target="_blank" rel="noreferrer">
                                                <img src={shop.identityCardBack} alt="Mặt sau CCCD" style={{ height: '100px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                            </a>
                                        ) : <span>Không có CCCD mặt sau</span>}
                                    </div>
                                </div>
                            </div>

                            <div style={{ flex: '0 0 150px', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                                <button onClick={() => handleAction(shop.id, 'approve')} className="btn" style={{ background: '#2ecc71', color: '#fff', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    <i className="fas fa-check" style={{ marginRight: '5px' }}></i> Phê Duyệt
                                </button>
                                <button onClick={() => handleAction(shop.id, 'reject')} className="btn" style={{ background: '#e74c3c', color: '#fff', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    <i className="fas fa-times" style={{ marginRight: '5px' }}></i> Từ Chối
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminApproveShops;

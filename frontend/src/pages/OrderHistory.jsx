import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{"id":2}');

    useEffect(() => {
        fetch(`/api/orders/history/${user.id}`)
            .then(res => {
                if (!res.ok) throw new Error("Lỗi kết nối server");
                return res.json();
            })
            .then(data => {
                setOrders(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Lỗi fetch:", err);
                setLoading(false);
            });
    }, [user.id]);

    const formatVND = (amount) => new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + 'đ';

    const formatDate = (dateInput) => {
        if (!dateInput) return "---";
        if (Array.isArray(dateInput)) {
            const [y, m, d, hh, mm] = dateInput;
            return `${d}/${m}/${y} ${hh}:${mm < 10 ? '0' + mm : mm}`;
        }
        return new Date(dateInput).toLocaleString('vi-VN');
    };

    if (loading) return <p style={{ textAlign: 'center', padding: '50px' }}>Đang tải lịch sử...</p>;

    return (
        <div style={{ padding: '20px', maxWidth: '850px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <h2 style={{ color: '#ee4d2d', borderBottom: '3px solid #ee4d2d', paddingBottom: '10px', textAlign: 'center' }}>
                📦 LỊCH SỬ ĐƠN HÀNG
            </h2>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
                    <p>Bạn chưa có đơn hàng nào.</p>
                </div>
            ) : (
                orders.map(order => (
                    <div
                        key={order.id}
                        style={{
                            border: '1px solid #ddd', borderRadius: '12px', padding: '20px', marginBottom: '25px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.08)', backgroundColor: '#fff'
                        }}
                    >
                        {/* Header: Chỉ hiện thông tin, không cho click nữa */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Mã đơn: #{order.id}</span>
                            <span style={{ color: '#888' }}>{formatDate(order.createdAt || order.create_at)}</span>
                        </div>

                        {/* Danh sách sản phẩm: Nhấn vào là ra trang Product Detail */}
                        <div style={{ background: '#fdfdfd', borderRadius: '8px' }}>
                            {order.orderDetails && order.orderDetails.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => navigate(`/product-detail?id=${item.product?.id || item.productId}`)}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', padding: '12px',
                                        borderBottom: '1px dashed #eee', cursor: 'pointer', transition: '0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <img
                                            src={item.product?.img}
                                            alt={item.product?.name}
                                            style={{ width: '65px', height: '65px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #eee' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#0056b3', textDecoration: 'underline' }}>
                                                {item.product?.name || `Sản phẩm #${item.productId}`}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>Số lượng: x{item.quantity}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                        {formatVND(item.totalMoney / item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer: Trạng thái và Tổng tiền */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
                            <div>
                                <div style={{ marginBottom: '8px' }}>
                                    Trạng thái:
                                    <span style={{ marginLeft: '10px', fontWeight: 'bold', color: order.status === 1 ? '#20c997' : '#ff6b6b' }}>
                                        {order.status === 0 ? '🕒 Chờ xác nhận' : '✅ Đã giao hàng'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                    💳 {order.paymentTypeId === 1 ? 'Thanh toán tiền mặt' : 'VNPay'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: '#888', fontSize: '0.9rem' }}>Tổng thanh toán:</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ee4d2d' }}>
                                    {formatVND(order.orderDetails?.reduce((sum, i) => sum + i.totalMoney, 0) || 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default OrderHistory;
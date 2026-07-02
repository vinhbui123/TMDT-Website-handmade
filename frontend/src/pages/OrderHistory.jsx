import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/review-modal.css';

const STATUS_MAP = {
    0: { label: '🕒 Chờ xác nhận', color: '#ff9f43' },
    1: { label: '✅ Đã duyệt', color: '#1dd1a1' },
    2: { label: '🚚 Đang giao', color: '#54a0ff' },
    3: { label: 'Hoàn thành', color: '#2ecc71' },
    4: { label: '❌ Đã hủy', color: '#ee5a24' },
};

const REPORT_REASONS = [
    { value: 'NOT_RECEIVED', label: 'Không nhận được hàng' },
    { value: 'DAMAGED', label: 'Hàng bị hư hỏng / vỡ' },
    { value: 'WRONG_ITEM', label: 'Hàng không đúng mô tả' },
    { value: 'WRONG_COLOR', label: 'Hàng sai màu / mẫu' },
    { value: 'MISSING_ITEM', label: 'Thiếu hàng / phụ kiện' },
    { value: 'OTHER', label: 'Lý do khác' },
];

function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reported, setReported] = useState({});        // { orderId: true/false }
    const [reportModal, setReportModal] = useState(null);    // orderId đang mở modal
    const [reportForm, setReportForm] = useState({ reason: '', description: '', evidence: null });
    const [submitting, setSubmitting] = useState(false);
    
    // States cho tính năng đánh giá sản phẩm
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewProduct, setReviewProduct] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewContent, setReviewContent] = useState('');

    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user.id) { setLoading(false); return; }
        fetch(`/api/orders/history/${user.id}`, { credentials: 'include' })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                setOrders(list);

                // Kiểm tra đã báo cáo chưa cho từng đơn hoàn thành
                const delivered = list.filter(o => (o.orderDetails?.[0]?.status ?? o.status) === 3);
                Promise.all(delivered.map(o =>
                    fetch(`/api/orders/${o.id}/report/check`, { credentials: 'include' })
                        .then(r => r.json())
                        .then(d => ({ id: o.id, reported: d.reported }))
                        .catch(() => ({ id: o.id, reported: false }))
                )).then(results => {
                    const map = {};
                    results.forEach(r => { map[r.id] = r.reported; });
                    setReported(map);
                });

                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [user.id]);

    const formatVND = amt => new Intl.NumberFormat('vi-VN').format(Math.round(amt)) + 'đ';

    const formatDate = d => {
        if (!d) return '---';
        if (Array.isArray(d)) {
            const [y, m, dd, hh, mm] = d;
            return `${dd}/${m}/${y} ${hh}:${mm < 10 ? '0' + mm : mm}`;
        }
        return new Date(d).toLocaleString('vi-VN');
    };

    const getStatus = order => {
        const s = order.orderDetails?.[0]?.status ?? order.status ?? 0;
        return STATUS_MAP[s] || { label: 'Không rõ', color: '#888' };
    };

    const openReportModal = (orderId) => {
        setReportForm({ reason: '', description: '', evidence: null });
        setReportModal(orderId);
    };

    const handleSubmitReport = async () => {
        if (!reportForm.reason) {
            alert('Vui lòng chọn lý do trả hàng/hoàn tiền!');
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('reason', reportForm.reason);
            if (reportForm.description) formData.append('description', reportForm.description);
            if (reportForm.evidence) formData.append('evidence', reportForm.evidence);

            const res = await fetch(`/api/orders/${reportModal}/report`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setReported(prev => ({ ...prev, [reportModal]: true }));
                setReportModal(null);
                alert(' ' + data.message);
            } else {
                alert(' ' + data.message);
            }
        } catch {
            alert('Lỗi kết nối, vui lòng thử lại!');
        }
        setSubmitting(false);
    };

    const openReviewModal = (product) => {
        setReviewProduct(product);
        setReviewRating(5);
        setReviewContent('');
        setReviewModalOpen(true);
    };

    const submitProductReview = async () => {
        if (!reviewRating) {
            alert('Vui lòng chọn số sao!');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`/api/products/${reviewProduct.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: reviewRating, comment: reviewContent })
            });
            if (res.ok) {
                alert('Đánh giá của bạn đã được gửi thành công!');
                setReviewModalOpen(false);
            } else if (res.status === 401) {
                alert('Vui lòng đăng nhập để đánh giá.');
            } else {
                alert('Lỗi khi gửi đánh giá');
            }
        } catch (err) {
            alert('Lỗi hệ thống');
        }
        setSubmitting(false);
    };

    if (loading) return <p style={{ textAlign: 'center', padding: '50px' }}>Đang tải lịch sử...</p>;

    return (
        <div style={{ padding: '20px', maxWidth: '850px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <h2 style={{ color: '#ee4d2d', borderBottom: '3px solid #ee4d2d', paddingBottom: '10px', textAlign: 'center' }}>
                LỊCH SỬ ĐƠN HÀNG
            </h2>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
                    <p>Bạn chưa có đơn hàng nào.</p>
                </div>
            ) : (
                orders.map(order => {
                    const orderStatus = order.orderDetails?.[0]?.status ?? order.status ?? 0;
                    const statusInfo = STATUS_MAP[orderStatus] || { label: 'Không rõ', color: '#888' };
                    const isDelivered = orderStatus === 3;
                    const hasReported = reported[order.id];

                    return (
                        <div key={order.id} style={{
                            border: '1px solid #ddd', borderRadius: '12px', padding: '20px',
                            marginBottom: '25px', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', backgroundColor: '#fff'
                        }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Mã đơn: #{order.id}</span>
                                <span style={{ color: '#888' }}>{formatDate(order.createdAt || order.create_at)}</span>
                            </div>

                            {/* Danh sách sản phẩm */}
                            <div style={{ background: '#fdfdfd', borderRadius: '8px' }}>
                                {order.orderDetails && order.orderDetails.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => navigate(`/product-detail?id=${item.product?.id || item.productId}`)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', padding: '12px',
                                            borderBottom: '1px dashed #eee', cursor: 'pointer', transition: '0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
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
                                            {formatVND(item.totalMoney)}
                                            {isDelivered && (
                                                <div style={{ marginTop: '8px' }}>
                                                    <button
                                                        onClick={e => { 
                                                            e.stopPropagation(); 
                                                            openReviewModal(item.product || { id: item.productId, name: `Sản phẩm #${item.productId}` }); 
                                                        }}
                                                        style={{
                                                            padding: '5px 12px', background: 'transparent',
                                                            border: '1.5px solid #ffc107', color: '#ff9800',
                                                            borderRadius: '15px', cursor: 'pointer', fontSize: '0.8rem',
                                                            fontWeight: '600', transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => { e.target.style.background = '#ffc107'; e.target.style.color = '#fff'; e.target.style.borderColor = '#ffc107'; }}
                                                        onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#ff9800'; e.target.style.borderColor = '#ffc107'; }}
                                                    >
                                                        Đánh giá
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                                <div>
                                    <div style={{ marginBottom: '8px' }}>
                                        Trạng thái:
                                        <span style={{ marginLeft: '10px', fontWeight: 'bold', color: statusInfo.color }}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                        {order.paymentTypeId === 1 ? 'Thanh toán tiền mặt' : 'VNPay'}
                                    </div>

                                    {/* Nút báo cáo — chỉ hiện khi Hoàn thành */}
                                    {isDelivered && (
                                        <div style={{ marginTop: '12px' }}>
                                            {hasReported ? (
                                                <span style={{
                                                    display: 'inline-block', padding: '6px 14px',
                                                    background: '#f0f0f0', color: '#888',
                                                    borderRadius: '20px', fontSize: '0.8rem'
                                                }}>
                                                    ✓ Đã yêu cầu Trả hàng/Hoàn tiền
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={e => { e.stopPropagation(); openReportModal(order.id); }}
                                                    style={{
                                                        padding: '7px 18px', background: 'transparent',
                                                        border: '1.5px solid #ee4d2d', color: '#ee4d2d',
                                                        borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem',
                                                        fontWeight: '600', transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => { e.target.style.background = '#ee4d2d'; e.target.style.color = '#fff'; }}
                                                    onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#ee4d2d'; }}
                                                >
                                                    Yêu cầu Trả hàng/Hoàn tiền
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#888', fontSize: '0.9rem' }}>Tổng thanh toán:</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ee4d2d' }}>
                                        {formatVND(order.orderDetails?.reduce((sum, i) => sum + i.totalMoney, 0) || 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {/* ===== MODAL BÁO CÁO ===== */}
            {reportModal && (
                <div
                    onClick={() => setReportModal(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999, backdropFilter: 'blur(4px)'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden'
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #ee4d2d, #ff7043)',
                            padding: '20px 24px', color: '#fff',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Yêu cầu Trả hàng/Hoàn tiền</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '2px' }}>Đơn hàng #{reportModal}</div>
                            </div>
                            <button
                                onClick={() => setReportModal(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                                    width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                                    fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >×</button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px' }}>
                            <p style={{ margin: '0 0 16px', color: '#555', fontSize: '0.9rem' }}>
                                Vui lòng chọn vấn đề bạn gặp phải. Chúng tôi sẽ xem xét và phản hồi trong vòng <strong>24 giờ</strong>.
                            </p>

                            {/* Lý do */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: '600', marginBottom: '10px', color: '#333' }}>Lý do Trả hàng/Hoàn tiền *</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {REPORT_REASONS.map(r => (
                                        <label
                                            key={r.value}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                                                border: `2px solid ${reportForm.reason === r.value ? '#ee4d2d' : '#eee'}`,
                                                background: reportForm.reason === r.value ? '#fff5f3' : '#fafafa',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="reason"
                                                value={r.value}
                                                checked={reportForm.reason === r.value}
                                                onChange={e => setReportForm(prev => ({ ...prev, reason: e.target.value }))}
                                                style={{ accentColor: '#ee4d2d', width: '16px', height: '16px' }}
                                            />
                                            <span style={{ fontSize: '0.9rem', color: '#333' }}>{r.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Mô tả thêm */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#333' }}>Mô tả chi tiết (tùy chọn)</div>
                                <textarea
                                    rows={3}
                                    placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                                    value={reportForm.description}
                                    onChange={e => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: '8px',
                                        border: '1.5px solid #ddd', fontSize: '0.9rem', resize: 'vertical',
                                        outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#ee4d2d'}
                                    onBlur={e => e.target.style.borderColor = '#ddd'}
                                />
                            </div>

                            {/* Bằng chứng */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#333' }}>Hình ảnh bằng chứng (tùy chọn)</div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setReportForm(prev => ({ ...prev, evidence: e.target.files[0] }))}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: '8px',
                                        border: '1.5px solid #ddd', fontSize: '0.9rem',
                                        boxSizing: 'border-box', fontFamily: 'inherit',
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setReportModal(null)}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '8px',
                                        border: '1.5px solid #ddd', background: '#fff',
                                        cursor: 'pointer', fontWeight: '600', color: '#555',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSubmitReport}
                                    disabled={submitting || !reportForm.reason}
                                    style={{
                                        flex: 2, padding: '12px', borderRadius: '8px',
                                        border: 'none',
                                        background: (submitting || !reportForm.reason) ? '#ccc' : 'linear-gradient(135deg, #ee4d2d, #ff7043)',
                                        color: '#fff', cursor: (submitting || !reportForm.reason) ? 'not-allowed' : 'pointer',
                                        fontWeight: '700', fontSize: '0.95rem', transition: 'all 0.2s'
                                    }}
                                >
                                    {submitting ? 'Đang gửi...' : '🚩 Gửi yêu cầu'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL ĐÁNH GIÁ SẢN PHẨM ===== */}
            {reviewModalOpen && (
                <div className="review-modal" style={{ display: 'block' }}>
                    <div className="review-modal-content">
                        <span className="review-close" onClick={() => setReviewModalOpen(false)}>&times;</span>
                        <h3 className="review-modal-title">
                            <i className="fas fa-star"></i> Đánh giá sản phẩm
                        </h3>

                        <div id="review-items-container">
                            {reviewProduct && (
                                <div className="review-product-item">
                                    <img src={reviewProduct.img || ''} alt={reviewProduct.name} />
                                    <div className="review-product-info">
                                        <h4>{reviewProduct.name}</h4>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="review-form-group">
                            <label>Chọn số sao:</label>
                            <div className="star-rating" id="star-rating">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <i
                                        key={star}
                                        className={star <= reviewRating ? "fas fa-star selected" : "far fa-star"}
                                        style={{ color: star <= reviewRating ? '#ffc107' : '#ddd', cursor: 'pointer', transition: '0.2s', margin: '0 2px' }}
                                        onClick={() => setReviewRating(star)}
                                    ></i>
                                ))}
                            </div>
                        </div>

                        <div className="review-form-group">
                            <label htmlFor="review-content">Nhận xét của bạn:</label>
                            <textarea
                                id="review-content"
                                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                                rows="4"
                                value={reviewContent}
                                onChange={(e) => setReviewContent(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="review-actions">
                            <button className="review-cancel-btn" onClick={() => setReviewModalOpen(false)}>Hủy</button>
                            <button className="review-submit-btn" onClick={submitProductReview} disabled={submitting}>
                                <i className="fas fa-paper-plane"></i> {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderHistory;
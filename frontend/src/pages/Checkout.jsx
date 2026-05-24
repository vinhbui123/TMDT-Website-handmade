// File: D:/project_TMDT/frontend/src/pages/Checkout.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CheckoutService from '../services/CheckoutService';
import PaymentGateway from '../services/PaymentGateway';

function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash_on_delivery');

    // 1. Lấy dữ liệu từ CartPage truyền sang
    const selectedProductIds = location.state?.selectedProductIds || [];
    const initialTotalAmount = location.state?.totalAmount || 0;

    const [orderData, setOrderData] = useState({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        totalAmount: initialTotalAmount,
    });

    useEffect(() => {
        if (initialTotalAmount > 0) {
            setOrderData(prev => ({ ...prev, totalAmount: initialTotalAmount }));
        }
    }, [initialTotalAmount]);

    /**
     * HÀM CHÍNH: Xử lý thanh toán
     */
    const handlePayment = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!validateCheckoutForm()) return;
        if (selectedProductIds.length === 0) {
            alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán!');
            return;
        }

        setLoading(true);
        try {
            console.log('📦 Đang gửi yêu cầu tạo đơn hàng...');

            // Chuẩn bị payload khớp với OrderController.java (Cần totalAmount để gọi VNPay)
            const payload = {
                paymentMethod: selectedPaymentMethod,
                totalAmount: orderData.totalAmount,
                customerName: orderData.customerName, // Giữ để sau này nâng cấp DB
                customerPhone: orderData.customerPhone,
                customerAddress: orderData.customerAddress
            };

            // BƯỚC 1: Gọi Service để tạo đơn hàng.
            // Nếu chọn VNPay, Backend sẽ trả về link trong trường 'paymentUrl'
            const result = await CheckoutService.placeOrder(payload, selectedProductIds);

            // BƯỚC 2: Chuyển toàn bộ kết quả từ Backend sang Gateway để bóc tách link điều hướng
            const paymentResult = await PaymentGateway.processPayment(result);

            if (!paymentResult.success) {
                setError(paymentResult.message);
                return;
            }

            // BƯỚC 3: Xử lý chuyển hướng hoặc thông báo thành công
            if (paymentResult.isOnline && paymentResult.redirectUrl) {
                alert('Đang chuyển hướng đến cổng VNPay...');
                window.location.href = paymentResult.redirectUrl;
            } else {
                alert('🎉 Đặt hàng thành công! Chúng tôi sẽ liên hệ bạn sớm nhất.');
                window.dispatchEvent(new Event('storage')); // Cập nhật giỏ hàng trên Header
                navigate('/order-history');
            }

        } catch (err) {
            console.error('🔴 Lỗi Checkout:', err);
            setError(err.message || 'Đã xảy ra lỗi không xác định');
        } finally {
            setLoading(false);
        }
    };

    const validateCheckoutForm = () => {
        if (!orderData.customerName.trim()) { setError('Vui lòng nhập tên khách hàng'); return false; }
        if (!orderData.customerPhone.trim()) { setError('Vui lòng nhập số điện thoại'); return false; }
        if (orderData.customerPhone.trim().length < 10) { setError('Số điện thoại không hợp lệ'); return false; }
        if (!orderData.customerAddress.trim()) { setError('Vui lòng nhập địa chỉ nhận hàng'); return false; }
        return true;
    };

    return (
        <div className="checkout-page container" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', color: '#ee4d2d', marginBottom: '30px', fontWeight: 'bold' }}>
                THÔNG TIN THANH TOÁN
            </h2>

            {error && (
                <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', color: '#ff4d4f', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                    ⚠️ {error}
                </div>
            )}

            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <form onSubmit={handlePayment}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Họ và tên người nhận:</label>
                        <input type="text" className="form-control"
                               value={orderData.customerName}
                               onChange={(e) => setOrderData({...orderData, customerName: e.target.value})}
                               style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} required />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Số điện thoại:</label>
                        <input type="tel" className="form-control"
                               value={orderData.customerPhone}
                               onChange={(e) => setOrderData({...orderData, customerPhone: e.target.value})}
                               style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} required />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Địa chỉ nhận hàng:</label>
                        <textarea className="form-control"
                                  value={orderData.customerAddress}
                                  onChange={(e) => setOrderData({...orderData, customerAddress: e.target.value})}
                                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '100px' }} required />
                    </div>

                    <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '25px' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>Phương thức thanh toán</h4>
                        <div style={{ marginBottom: '12px' }}>
                            <input type="radio" id="cod" name="pm" value="cash_on_delivery"
                                   checked={selectedPaymentMethod === 'cash_on_delivery'}
                                   onChange={(e) => setSelectedPaymentMethod(e.target.value)} />
                            <label htmlFor="cod" style={{ marginLeft: '10px' }}>💵 Thanh toán khi nhận hàng (COD)</label>
                        </div>
                        <div>
                            <input type="radio" id="vnpay" name="pm" value="bank_transfer"
                                   checked={selectedPaymentMethod === 'bank_transfer'}
                                   onChange={(e) => setSelectedPaymentMethod(e.target.value)} />
                            <label htmlFor="vnpay" style={{ marginLeft: '10px' }}>🏦 Thẻ ATM / QR Code (VNPay)</label>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '25px' }}>
                        <span style={{ fontSize: '16px', color: '#666' }}>Tổng thanh toán:</span>
                        <h2 style={{ color: '#ee4d2d', margin: '5px 0 0 0', fontSize: '28px', fontWeight: 'bold' }}>
                            {new Intl.NumberFormat('vi-VN').format(orderData.totalAmount)}đ
                        </h2>
                    </div>

                    <button type="submit" disabled={loading}
                            style={{
                                width: '100%', padding: '16px',
                                background: loading ? '#ccc' : '#ee4d2d',
                                color: '#fff', border: 'none', borderRadius: '8px',
                                fontWeight: 'bold', fontSize: '18px', cursor: loading ? 'not-allowed' : 'pointer'
                            }}>
                        {loading ? '⏳ ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐẶT HÀNG'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Checkout;
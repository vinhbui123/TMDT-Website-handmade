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
        customerAddress: '', // This will be the detailed street address
        totalAmount: initialTotalAmount,
    });

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [shippingFee, setShippingFee] = useState(0);

    // Mã giảm giá
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState('');
    const [couponSuccess, setCouponSuccess] = useState(false);
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    // Lấy danh sách Tỉnh/Thành
    useEffect(() => {
        fetch('/api/ghn/provinces')
            .then(res => res.json())
            .then(data => {
                const filteredProvinces = (Array.isArray(data) ? data : []).filter(p =>
                    !p.ProvinceName.toLowerCase().includes('test') &&
                    !p.ProvinceName.includes('02') &&
                    !p.ProvinceName.includes('03')
                );
                setProvinces(filteredProvinces);
            })
            .catch(err => console.error(err));
    }, []);

    // Lấy Quận/Huyện khi chọn Tỉnh/Thành
    useEffect(() => {
        if (selectedProvince) {
            fetch(`/api/ghn/districts/${selectedProvince}`)
                .then(res => res.json())
                .then(data => {
                    setDistricts(Array.isArray(data) ? data : []);
                    setSelectedDistrict('');
                    setSelectedWard('');
                    setWards([]);
                    setShippingFee(0);
                })
                .catch(err => console.error(err));
        }
    }, [selectedProvince]);

    // Lấy Phường/Xã khi chọn Quận/Huyện
    useEffect(() => {
        if (selectedDistrict) {
            fetch(`/api/ghn/wards/${selectedDistrict}`)
                .then(res => res.json())
                .then(data => {
                    setWards(Array.isArray(data) ? data : []);
                    setSelectedWard('');
                    setShippingFee(0);
                })
                .catch(err => console.error(err));
        }
    }, [selectedDistrict]);

    // Tính phí ship khi chọn Phường/Xã
    useEffect(() => {
        if (selectedDistrict && selectedWard && selectedProductIds.length > 0) {
            fetch('/api/ghn/calculate-fee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toDistrictId: selectedDistrict,
                    toWardCode: selectedWard,
                    selectedProductIds: selectedProductIds
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setShippingFee(data.fee);
                    } else {
                        console.error("Lỗi tính phí:", data.message);
                    }
                })
                .catch(err => console.error(err));
        }
    }, [selectedWard]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                if (res.ok) {
                    const user = await res.json();
                    setOrderData(prev => ({
                        ...prev,
                        customerName: prev.customerName ? prev.customerName : `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                        customerPhone: prev.customerPhone ? prev.customerPhone : (user.phoneNumber || ''),
                        customerAddress: prev.customerAddress ? prev.customerAddress : (user.address || ''),
                    }));
                }
            } catch (err) {
                console.error('Không thể tải thông tin người dùng từ db:', err);
            }
        };

        fetchUserData();

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

            const provName = provinces.find(p => p.ProvinceID == selectedProvince)?.ProvinceName || '';
            const distName = districts.find(d => d.DistrictID == selectedDistrict)?.DistrictName || '';
            const wardName = wards.find(w => w.WardCode == selectedWard)?.WardName || '';
            const fullAddress = `${orderData.customerAddress}, ${wardName}, ${distName}, ${provName}`;

            const payload = {
                paymentMethod: selectedPaymentMethod,
                totalAmount: orderData.totalAmount + shippingFee - couponDiscount,
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                customerAddress: fullAddress, // Full string for DB
                toDistrictId: selectedDistrict, // For GHN
                toWardCode: selectedWard, // For GHN
                shippingFee: shippingFee, // For Order DB
                couponCode: couponSuccess ? couponCode : null // Mã giảm giá
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
                window.location.href = paymentResult.redirectUrl;
            } else {
                alert('Đặt hàng thành công! Chúng tôi sẽ liên hệ bạn sớm nhất.');
                window.dispatchEvent(new Event('storage')); // Cập nhật giỏ hàng trên Header
                navigate('/order-history');
            }

        } catch (err) {
            console.error(' Lỗi Checkout:', err);
            setError(err.message || 'Đã xảy ra lỗi không xác định');
        } finally {
            setLoading(false);
        }
    };

    const validateCheckoutForm = () => {
        if (!orderData.customerName.trim()) { setError('Vui lòng nhập tên khách hàng'); return false; }
        if (!orderData.customerPhone.trim()) { setError('Vui lòng nhập số điện thoại'); return false; }
        if (orderData.customerPhone.trim().length < 10) { setError('Số điện thoại không hợp lệ'); return false; }
        if (!selectedProvince) { setError('Vui lòng chọn Tỉnh/Thành phố'); return false; }
        if (!selectedDistrict) { setError('Vui lòng chọn Quận/Huyện'); return false; }
        if (!selectedWard) { setError('Vui lòng chọn Phường/Xã'); return false; }
        if (!orderData.customerAddress.trim()) { setError('Vui lòng nhập số nhà, tên đường'); return false; }
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
                            onChange={(e) => setOrderData({ ...orderData, customerName: e.target.value })}
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} required />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Số điện thoại:</label>
                        <input type="tel" className="form-control"
                            value={orderData.customerPhone}
                            onChange={(e) => setOrderData({ ...orderData, customerPhone: e.target.value })}
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} required />
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Tỉnh/Thành phố:</label>
                            <select className="form-control" value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} required>
                                <option value="">-- Chọn Tỉnh/Thành --</option>
                                {provinces.map(p => (
                                    <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Quận/Huyện:</label>
                            <select className="form-control" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} required disabled={!selectedProvince}>
                                <option value="">-- Chọn Quận/Huyện --</option>
                                {districts.map(d => (
                                    <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Phường/Xã:</label>
                            <select className="form-control" value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} required disabled={!selectedDistrict}>
                                <option value="">-- Chọn Phường/Xã --</option>
                                {wards.map(w => (
                                    <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Số nhà, Tên đường (Chi tiết):</label>
                        <textarea className="form-control"
                            value={orderData.customerAddress}
                            onChange={(e) => setOrderData({ ...orderData, customerAddress: e.target.value })}
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '80px' }} required
                            placeholder="Ví dụ: Số 10, Ngõ 1, Đường Trần Duy Hưng" />
                    </div>

                    <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '25px' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>Phương thức thanh toán</h4>
                        <div style={{ marginBottom: '12px' }}>
                            <input type="radio" id="cod" name="pm" value="cash_on_delivery"
                                checked={selectedPaymentMethod === 'cash_on_delivery'}
                                onChange={(e) => setSelectedPaymentMethod(e.target.value)} />
                            <label htmlFor="cod" style={{ marginLeft: '10px' }}>Thanh toán khi nhận hàng (COD)</label>
                        </div>
                        <div>
                            <input type="radio" id="vnpay" name="pm" value="bank_transfer"
                                checked={selectedPaymentMethod === 'bank_transfer'}
                                onChange={(e) => setSelectedPaymentMethod(e.target.value)} />
                            <label htmlFor="vnpay" style={{ marginLeft: '10px' }}>Thẻ ATM / QR Code (VNPay)</label>
                        </div>
                    </div>

                    {/* MÃ GIẢM GIÁ */}
                    <div style={{ padding: '20px', background: '#fff8f0', borderRadius: '8px', marginBottom: '25px', border: '1px dashed #ee4d2d' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#ee4d2d' }}>Mã giảm giá</h4>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                type="text" 
                                placeholder="Nhập mã giảm giá..." 
                                value={couponCode}
                                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponMessage(''); }}
                                style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #ddd', letterSpacing: '2px', fontWeight: 'bold', fontSize: '15px' }}
                            />
                            <button 
                                type="button"
                                disabled={applyingCoupon || !couponCode.trim()}
                                onClick={async () => {
                                    setApplyingCoupon(true);
                                    setCouponMessage('');
                                    try {
                                        const res = await fetch('/api/coupons/validate', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            credentials: 'include',
                                            body: JSON.stringify({
                                                code: couponCode,
                                                selectedProductIds: selectedProductIds,
                                                totalAmount: orderData.totalAmount
                                            })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            setCouponDiscount(data.discountAmount);
                                            setCouponSuccess(true);
                                            setCouponMessage(`${data.message} (-${data.discountAmount.toLocaleString('vi-VN')}đ)`);
                                        } else {
                                            setCouponDiscount(0);
                                            setCouponSuccess(false);
                                            setCouponMessage(`${data.message}`);
                                        }
                                    } catch (err) {
                                        setCouponMessage('Lỗi kết nối');
                                    }
                                    setApplyingCoupon(false);
                                }}
                                style={{
                                    padding: '12px 24px', background: '#ee4d2d', color: '#fff',
                                    border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
                                    opacity: (applyingCoupon || !couponCode.trim()) ? 0.6 : 1
                                }}
                            >
                                {applyingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
                            </button>
                        </div>
                        {couponMessage && (
                            <p style={{ marginTop: '10px', fontSize: '14px', color: couponSuccess ? '#52c41a' : '#ff4d4f', fontWeight: '500' }}>
                                {couponMessage}
                            </p>
                        )}
                    </div>

                    <div style={{ textAlign: 'right', borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '30px', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', color: '#666' }}>Tiền hàng:</span>
                            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{new Intl.NumberFormat('vi-VN').format(orderData.totalAmount)}đ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '30px', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', color: '#666' }}>Phí vận chuyển (GHN):</span>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: shippingFee > 0 ? '#ee4d2d' : '#333' }}>
                                {shippingFee > 0 ? new Intl.NumberFormat('vi-VN').format(shippingFee) + 'đ' : '0đ'}
                            </span>
                        </div>
                        {couponDiscount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '30px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '16px', color: '#52c41a' }}>Mã giảm giá:</span>
                                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>-{new Intl.NumberFormat('vi-VN').format(couponDiscount)}đ</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '30px' }}>
                            <span style={{ fontSize: '18px', color: '#666', marginTop: '10px' }}>Tổng thanh toán:</span>
                            <h2 style={{ color: '#ee4d2d', margin: '0', fontSize: '28px', fontWeight: 'bold' }}>
                                {new Intl.NumberFormat('vi-VN').format(Math.max(0, orderData.totalAmount + shippingFee - couponDiscount))}đ
                            </h2>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        style={{
                            width: '100%', padding: '16px',
                            background: loading ? '#ccc' : '#ee4d2d',
                            color: '#fff', border: 'none', borderRadius: '8px',
                            fontWeight: 'bold', fontSize: '18px', cursor: loading ? 'not-allowed' : 'pointer'
                        }}>
                        {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐẶT HÀNG'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Checkout;
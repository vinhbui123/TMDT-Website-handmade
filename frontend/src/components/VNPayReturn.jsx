import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function VNPayReturn() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState(' đang kiểm tra...');

    const responseCode = searchParams.get('vnp_ResponseCode');

    useEffect(() => {
        if (responseCode === '00') {
            setStatus('Thanh toán thành công! Đang chuyển hướng...');

            // 1. Kích hoạt cập nhật lại giỏ hàng (vì đã thanh toán xong)
            window.dispatchEvent(new Event('storage'));

            // 2. SỬA TẠI ĐÂY: Chuyển về trang lịch sử đơn hàng sau 2 giây
            setTimeout(() => {
                navigate('/order-history');
            }, 2000);

        } else {
            setStatus('Thanh toán thất bại hoặc đã bị hủy.');
        }
    }, [responseCode, navigate]);

    return (
        <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh' }}>
            <div style={{
                maxWidth: '500px',
                margin: '0 auto',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                backgroundColor: '#fff'
            }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>
                    {responseCode === '00' ? '✅' : '❌'}
                </div>

                <h2 style={{ color: responseCode === '00' ? '#28a745' : '#dc3545', marginBottom: '10px' }}>
                    {status}
                </h2>

                <p style={{ color: '#666', marginBottom: '30px' }}>
                    Mã giao dịch: <strong>{searchParams.get('vnp_TxnRef')}</strong>
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {/* Nút xem lịch sử luôn hiện để user chủ động bấm */}
                    <button
                        onClick={() => navigate('/order-history')}
                        style={{
                            padding: '12px 24px',
                            cursor: 'pointer',
                            background: '#28a745',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                        }}
                    >
                        Xem đơn hàng của tôi
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '12px 24px',
                            cursor: 'pointer',
                            background: '#eee',
                            color: '#333',
                            border: 'none',
                            borderRadius: '4px'
                        }}
                    >
                        Tiếp tục mua sắm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VNPayReturn;
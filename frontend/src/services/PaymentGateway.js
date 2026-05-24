// File: D:/project_TMDT/frontend/src/services/PaymentGateway.js

class PaymentGateway {
    /**
     * Xử lý kết quả sau khi gọi API đặt hàng (/api/orders/place)
     * @param {Object} responseData - Toàn bộ dữ liệu JSON trả về từ Backend
     */
    async processPayment(responseData) {
        console.log("💳 Đang xử lý phản hồi thanh toán:", responseData);

        // 1. Kiểm tra nếu Backend báo lỗi tạo đơn (ví dụ: hết hàng, sai dữ liệu)
        if (!responseData || responseData.success === false) {
            return {
                success: false,
                message: responseData?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.'
            };
        }

        /**
         * 2. TRƯỜNG HỢP THANH TOÁN VNPAY (Online)
         * Nếu Backend trả về trường 'url' hoặc 'paymentUrl'
         * Lưu ý: Khớp với thuộc tính trong OrderController của ông
         */
        const vnpayUrl = responseData.url || responseData.paymentUrl;

        if (vnpayUrl) {
            console.log("🚀 Phát hiện link VNPay, chuẩn bị chuyển hướng...");
            return {
                success: true,
                isOnline: true,
                redirectUrl: vnpayUrl
            };
        }

        /**
         * 3. TRƯỜNG HỢP COD (Tiền mặt)
         * Nếu thành công nhưng không có link URL
         */
        return {
            success: true,
            isOnline: false,
            message: responseData.message || 'Đặt hàng thành công! Vui lòng thanh toán khi nhận hàng.'
        };
    }

    /**
     * Danh sách phương thức hiển thị tại giao diện Checkout.jsx
     */
    getAvailablePaymentMethods() {
        return [
            { id: 'cash_on_delivery', name: 'Thanh toán khi nhận hàng (COD)' },
            { id: 'bank_transfer', name: 'Thanh toán qua cổng VNPay (ATM / QR Code)' }
        ];
    }
}

export default new PaymentGateway();
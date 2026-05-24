class CheckoutService {
    constructor() {
        this.apiBaseUrl = '/api/orders';
    }

    async placeOrder(orderData, selectedProductIds) {
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : { id: 1 };

            // 2. Chuẩn bị dữ liệu gửi đi
            const payload = {
                userId: parseInt(user.id),
                paymentMethod: orderData.paymentMethod,
                selectedProductIds: selectedProductIds,

                // QUAN TRỌNG: Gửi totalAmount để Backend dùng cho VNPay
                // Vì bảng orders của ông không lưu cột này nên phải lấy từ Frontend
                totalAmount: orderData.totalAmount
            };

            console.log("🚀 Payload gửi lên Backend:", payload);

            const response = await fetch(`${this.apiBaseUrl}/place`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Đặt hàng thất bại');
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('🔴 Lỗi tại CheckoutService:', error.message);
            throw error;
        }
    }
}

export default new CheckoutService();
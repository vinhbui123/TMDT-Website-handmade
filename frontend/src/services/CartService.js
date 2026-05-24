class CartService {
    constructor() {
        this.apiBaseUrl = '/api/cart';
    }

    // 1. Lấy dữ liệu giỏ hàng
    async getCart() {
        try {
            const response = await fetch(this.apiBaseUrl);
            if (!response.ok) throw new Error("Lỗi lấy dữ liệu từ Server");
            const data = await response.json();

            // Khớp với cấu trúc Map.of trong CartController.java
            return {
                success: true,
                items: data.items || [],
                total: data.total || 0,
                cartCount: data.cartCount || 0
            };
        } catch (error) {
            console.error("CartService Error:", error);
            return { success: false, items: [], total: 0, cartCount: 0 };
        }
    }

    // 2. Thêm sản phẩm (Dùng ở trang ProductList - Cộng dồn số lượng)
    async addToCart(productId, quantity = 1) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: parseInt(productId), quantity: parseInt(quantity) })
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: "Không thể kết nối đến máy chủ" };
        }
    }

    // 3. Cập nhật số lượng (Dùng cho nút + / - ở trang CartPage - Ghi đè số lượng)
    async updateQuantity(productId, quantity) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: parseInt(productId), quantity: parseInt(quantity) })
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: "Lỗi cập nhật số lượng" };
        }
    }

    // 4. Xóa một sản phẩm khỏi giỏ hàng
    async removeItem(productId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/remove/${productId}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: "Lỗi khi xóa sản phẩm" };
        }
    }

    // 5. Xóa sạch giỏ hàng
    async clearCart() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/clear`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: "Lỗi khi làm trống giỏ hàng" };
        }
    }
}

export default new CartService();
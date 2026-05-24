package com.project.web_hand_made_cd_web.Model;

import java.io.Serializable;
import java.util.Objects;

public class CartItem implements Serializable {
    private static final long serialVersionUID = 1L;

    private int productId;
    private String productName;
    private String productImage;
    private int price;
    private int quantity;
    private int discount;

    public CartItem() {}

    public CartItem(int productId, String productName, String productImage, int price, int quantity, int discount) {
        this.productId = productId;
        this.productName = productName;
        this.productImage = productImage;
        this.price = price;
        this.quantity = quantity;
        this.discount = discount;
    }

    public int getProductId() { return productId; }
    public void setProductId(int productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getProductImage() { return productImage; }
    public void setProductImage(String productImage) { this.productImage = productImage; }
    public int getPrice() { return price; }
    public void setPrice(int price) { this.price = price; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public int getDiscount() { return discount; }
    public void setDiscount(int discount) { this.discount = discount; }

    // --- CÁC HÀM LOGIC TÍNH TOÁN ---

    // 1. Tính tổng số tiền được giảm giá cho món hàng này (HÀM BẠN HỎI ĐÂY)
    public int getTotalDiscountAmount() {
        if (discount <= 0 || discount >= 100) return 0;
        return (price * discount / 100) * quantity;
    }

    // 2. Tính giá sau khi đã giảm (giá của 1 sản phẩm)
    public int calculateDiscountedPrice() {
        if (discount <= 0 || discount >= 100) return price;
        return price - (price * discount / 100);
    }

    // 3. Tính thành tiền (giá đã giảm * số lượng)
    public int getSubtotal() {
        return calculateDiscountedPrice() * quantity;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CartItem cartItem = (CartItem) o;
        return productId == cartItem.productId;
    }

    @Override
    public int hashCode() {
        return Objects.hash(productId);
    }

    public static CartItemBuilder builder() {
        return new CartItemBuilder();
    }

    public static class CartItemBuilder {
        private int productId;
        private String productName;
        private String productImage;
        private int price;
        private int quantity;
        private int discount;

        public CartItemBuilder productId(int id) { this.productId = id; return this; }
        public CartItemBuilder productName(String name) { this.productName = name; return this; }
        public CartItemBuilder productImage(String img) { this.productImage = img; return this; }
        public CartItemBuilder price(int price) { this.price = price; return this; }
        public CartItemBuilder quantity(int q) { this.quantity = q; return this; }
        public CartItemBuilder discount(int d) { this.discount = d; return this; }

        public CartItem build() {
            return new CartItem(productId, productName, productImage, price, quantity, discount);
        }
    }
}
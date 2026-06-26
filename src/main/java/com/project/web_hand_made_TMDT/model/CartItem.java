package com.project.web_hand_made_TMDT.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class CartItem implements Serializable {
    private static final long serialVersionUID = 1L;

    @EqualsAndHashCode.Include
    private int productId;
    
    private String productName;
    private String productImage;
    private int price;
    private int quantity;
    private int discount;
    
    @EqualsAndHashCode.Include
    private String customText;
    
    @EqualsAndHashCode.Include
    private String selectedColor;

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
}
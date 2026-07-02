package com.project.web_hand_made_TMDT.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "shop_id", nullable = false)
    private int shopId;

    // "FIXED" = giảm cố định VNĐ, "PERCENT" = giảm theo %
    @Column(name = "discount_type", nullable = false, length = 20)
    private String discountType;

    // Giá trị giảm (VD: 50000 cho FIXED, 10 cho PERCENT)
    @Column(name = "discount_value", nullable = false)
    private int discountValue;

    // Đơn hàng tối thiểu để được áp dụng
    @Column(name = "min_order_amount")
    @Builder.Default
    private int minOrderAmount = 0;

    // Giảm tối đa (dùng cho PERCENT, VD: max giảm 100k)
    @Column(name = "max_discount")
    @Builder.Default
    private int maxDiscount = 0;

    // Tổng số lượt sử dụng được
    @Column(name = "quantity")
    @Builder.Default
    private int quantity = 100;

    // Số lượt đã sử dụng
    @Column(name = "used_count")
    @Builder.Default
    private int usedCount = 0;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "is_active")
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Tính số tiền được giảm dựa trên tổng đơn hàng.
     */
    public int calculateDiscount(int orderAmount) {
        if ("PERCENT".equalsIgnoreCase(discountType)) {
            int discount = orderAmount * discountValue / 100;
            // Nếu có max_discount thì cap lại
            if (maxDiscount > 0 && discount > maxDiscount) {
                discount = maxDiscount;
            }
            return discount;
        } else {
            // FIXED: trả về đúng giá trị giảm
            return Math.min(discountValue, orderAmount);
        }
    }
}

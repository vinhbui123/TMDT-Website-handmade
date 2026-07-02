package com.project.web_hand_made_TMDT.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "coupons",
    uniqueConstraints = @UniqueConstraint(columnNames = {"code", "shop_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "shop_id", nullable = false)
    @Builder.Default
    private Integer shopId = 0;

    // "FIXED" = giảm cố định VNĐ, "PERCENT" = giảm theo %
    @Column(name = "discount_type", nullable = false, length = 20)
    private String discountType;

    // Giá trị giảm (VD: 50000 cho FIXED, 10 cho PERCENT)
    @Column(name = "discount_value", nullable = false)
    @Builder.Default
    private Integer discountValue = 0;

    // Đơn hàng tối thiểu để được áp dụng
    @Column(name = "min_order_amount")
    @Builder.Default
    private Integer minOrderAmount = 0;

    // Giảm tối đa (dùng cho PERCENT, VD: max giảm 100k)
    @Column(name = "max_discount")
    @Builder.Default
    private Integer maxDiscount = 0;

    // Tổng số lượt sử dụng được
    @Column(name = "quantity")
    @Builder.Default
    private Integer quantity = 100;

    // Số lượt đã sử dụng
    @Column(name = "used_count")
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    // Boolean dùng wrapper Boolean để tránh lỗi null
    // Dùng @JsonProperty để Jackson map đúng key "active" <-> field "isActive"
    @Column(name = "is_active")
    @Builder.Default
    @JsonProperty("active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getter/setter tường minh cho isActive để tránh xung đột Lombok/Jackson
    public boolean isActive() {
        return isActive != null && isActive;
    }

    public void setActive(boolean active) {
        this.isActive = active;
    }

    /**
     * Tính số tiền được giảm dựa trên tổng đơn hàng.
     */
    public int calculateDiscount(int orderAmount) {
        int dv = (discountValue != null) ? discountValue : 0;
        if ("PERCENT".equalsIgnoreCase(discountType)) {
            int discount = orderAmount * dv / 100;
            int max = (maxDiscount != null) ? maxDiscount : 0;
            if (max > 0 && discount > max) {
                discount = max;
            }
            return discount;
        } else {
            return Math.min(dv, orderAmount);
        }
    }
}

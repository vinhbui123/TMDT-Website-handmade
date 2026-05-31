package com.project.web_hand_made_TMDT.Model;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "order_details")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "order_id")
    private int orderId;

    @Column(name = "product_id")
    private int productId;

    // --- PHẦN QUAN TRỌNG NHẤT: Thêm liên kết tới bảng Product ---
    @ManyToOne
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;
    // Khi có dòng này, JSON trả về sẽ có thêm object "product": { "name": "...", "img": "..." }
    // ----------------------------------------------------------

    private int price;
    private int quantity;

    @Column(name = "total_money")
    private int totalMoney;

    @Column(name = "discount_percentage")
    private int discountPercentage;

    @Column(name = "discount_amount")
    @Builder.Default
    private int discountAmount = 0;

    @Builder.Default
    private int status = 0;

    @Column(name = "date_allocated")
    private LocalDateTime dateAllocated;

    @PrePersist
    protected void onCreate() {
        if (dateAllocated == null) {
            dateAllocated = LocalDateTime.now();
        }
    }
}
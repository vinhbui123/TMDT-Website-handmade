package com.project.web_hand_made_TMDT.model;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "orders")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int status;

    @Column(name = "user_id")
    private int userId;

    @Column(name = "free_shipping")
    private boolean freeShipping;

    @Column(name = "payment_type_id")
    private int paymentTypeId;

    @Column(name = "create_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- PHẦN THÊM MỚI ĐỂ LẤY CHI TIẾT ĐƠN HÀNG ---
    @OneToMany(fetch = FetchType.EAGER) // EAGER để tự động lấy chi tiết sản phẩm khi gọi Order
    @JoinColumn(name = "order_id") // Khớp với cột order_id trong bảng order_details
    private List<OrderDetail> orderDetails;
    // ----------------------------------------------

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
}
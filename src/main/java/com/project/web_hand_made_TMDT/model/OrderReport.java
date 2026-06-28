package com.project.web_hand_made_TMDT.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "order_id", nullable = false)
    private int orderId;

    @Column(name = "user_id", nullable = false)
    private int userId;

    // Lý do báo cáo: WRONG_ITEM, DAMAGED, NOT_RECEIVED, MISSING_ITEM, WRONG_COLOR, OTHER
    @Column(name = "reason", nullable = false)
    private String reason;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

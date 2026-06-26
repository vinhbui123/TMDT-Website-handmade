package com.project.web_hand_made_TMDT.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "custom_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "user_id")
    private int userId;

    @Column(name = "shop_id")
    private int shopId;

    @Column(name = "custom_text", columnDefinition = "TEXT")
    private String customText;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "reference_img")
    private String referenceImg;

    // 0: PENDING (Chờ báo giá), 1: QUOTED (Đã báo giá), 2: ACCEPTED (Khách chốt), 3: REJECTED
    @Column(name = "status")
    private int status;

    @Column(name = "quoted_price")
    private int quotedPrice;

    @Column(name = "created_at")
    private Date createdAt;
}

package com.project.web_hand_made_TMDT.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private ChatRoom chatRoom;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "sender_role")
    private Integer senderRole;

    @Column(name = "type")
    private String type; // "text" or "product"

    @Column(name = "text", columnDefinition = "TEXT")
    private String text;

    @Column(name = "product_info", columnDefinition = "TEXT")
    private String productInfo; // Store JSON string of product info

    @Column(name = "status")
    private String status = "sent";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void setTimestamp() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}

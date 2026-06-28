package com.project.web_hand_made_TMDT.model;

import lombok.Data;

@Data
public class ChatPayload {
    private String roomId;
    private int senderId;
    private String senderName;
    private Integer senderRole;
    private String type; // "text" or "product"
    private String text;
    private String productInfo;
    
    // Room info
    private int customerId;
    private String customerName;
    private String customerAvatar;
    private int shopId;
    private String shopName;
}

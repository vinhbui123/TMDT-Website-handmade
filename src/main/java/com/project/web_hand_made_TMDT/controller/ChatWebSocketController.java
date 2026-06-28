package com.project.web_hand_made_TMDT.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.project.web_hand_made_TMDT.model.ChatMessage;
import com.project.web_hand_made_TMDT.model.ChatPayload;
import com.project.web_hand_made_TMDT.model.ChatRoom;
import com.project.web_hand_made_TMDT.service.ChatService;
import com.project.web_hand_made_TMDT.util.ChatWordFilter;

@Controller
public class ChatWebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    @MessageMapping("/chat.send")
    public void sendMessage(ChatPayload payload) {
        
        ChatRoom roomData = new ChatRoom();
        roomData.setId(payload.getRoomId());
        roomData.setCustomerId(payload.getCustomerId());
        roomData.setCustomerName(payload.getCustomerName());
        roomData.setCustomerAvatar(payload.getCustomerAvatar());
        roomData.setShopId(payload.getShopId());
        roomData.setShopName(payload.getShopName());

        ChatMessage msg = new ChatMessage();
        msg.setSenderId(payload.getSenderId());
        msg.setSenderName(payload.getSenderName());
        msg.setSenderRole(payload.getSenderRole());
        msg.setType(payload.getType());
        msg.setProductInfo(payload.getProductInfo());
        
        // Kiểm tra từ ngữ thô tục (giống tính năng Shopee)
        if (payload.getText() != null && ChatWordFilter.hasBadWords(payload.getText())) {
            // Không lưu vào DB, gửi thông báo lỗi trả lại cho người gửi
            messagingTemplate.convertAndSend("/topic/user/" + payload.getSenderId() + "/errors", 
                "Tin nhắn của bạn chứa từ ngữ vi phạm Tiêu chuẩn cộng đồng và không thể gửi.");
            return;
        }
        
        msg.setText(payload.getText());

        ChatMessage savedMsg = chatService.saveMessage(msg, roomData);

        // Send message to the room topic
        messagingTemplate.convertAndSend("/topic/chat/" + payload.getRoomId(), savedMsg);

        // Trigger room list updates for both users
        // Since we don't know exactly what changed, we tell them to refresh their rooms
        messagingTemplate.convertAndSend("/topic/user/" + payload.getCustomerId() + "/rooms", "update");
        messagingTemplate.convertAndSend("/topic/user/" + payload.getShopId() + "/rooms", "update");
    }
}

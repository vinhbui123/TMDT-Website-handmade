package com.project.web_hand_made_TMDT.controller;

import com.project.web_hand_made_TMDT.model.ChatMessage;
import com.project.web_hand_made_TMDT.model.ChatRoom;
import com.project.web_hand_made_TMDT.model.ChatPayload;
import com.project.web_hand_made_TMDT.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;

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
        msg.setText(payload.getText());
        msg.setProductInfo(payload.getProductInfo());

        ChatMessage savedMsg = chatService.saveMessage(msg, roomData);

        // Send message to the room topic
        messagingTemplate.convertAndSend("/topic/chat/" + payload.getRoomId(), savedMsg);

        // Trigger room list updates for both users
        // Since we don't know exactly what changed, we tell them to refresh their rooms
        messagingTemplate.convertAndSend("/topic/user/" + payload.getCustomerId() + "/rooms", "update");
        messagingTemplate.convertAndSend("/topic/user/" + payload.getShopId() + "/rooms", "update");
    }
}

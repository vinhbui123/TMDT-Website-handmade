package com.project.web_hand_made_TMDT.service;

import com.project.web_hand_made_TMDT.model.ChatMessage;
import com.project.web_hand_made_TMDT.model.ChatRoom;
import com.project.web_hand_made_TMDT.repository.ChatMessageRepository;
import com.project.web_hand_made_TMDT.repository.ChatRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatService {

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    public List<ChatRoom> getRoomsForUser(Long userId) {
        return chatRoomRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    public List<ChatMessage> getMessagesForRoom(String roomId) {
        return chatMessageRepository.findByChatRoomIdOrderByCreatedAtAsc(roomId);
    }

    @Transactional
    public void markMessagesAsSeen(String roomId, Long currentUserId) {
        chatMessageRepository.markMessagesAsSeen(roomId, currentUserId);
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room != null && room.getUnreadCount() > 0) {
            // Need to know if unreadCount was meant for this user.
            // Simplified: reset to 0 when opening room, assuming the person opening it is reading new messages
            room.setUnreadCount(0);
            chatRoomRepository.save(room);
        }
    }

    @Transactional
    public ChatMessage saveMessage(ChatMessage messageRequest, ChatRoom roomData) {
        // 1. Check or Create Room
        ChatRoom room = chatRoomRepository.findById(roomData.getId()).orElse(roomData);
        
        // 2. Update Room Info
        room.setLastMessage(messageRequest.getType().equals("text") ? messageRequest.getText() : "[Sản phẩm] ");
        room.setUnreadCount(room.getUnreadCount() + 1);
        room.setUpdatedAt(java.time.LocalDateTime.now());
        
        // For new room or updated names
        room.setCustomerId(roomData.getCustomerId());
        room.setCustomerName(roomData.getCustomerName());
        room.setCustomerAvatar(roomData.getCustomerAvatar());
        room.setShopId(roomData.getShopId());
        room.setShopName(roomData.getShopName());

        room = chatRoomRepository.save(room);

        // 3. Save Message
        messageRequest.setChatRoom(room);
        return chatMessageRepository.save(messageRequest);
    }
}

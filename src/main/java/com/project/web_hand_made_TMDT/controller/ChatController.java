package com.project.web_hand_made_TMDT.controller;

import com.project.web_hand_made_TMDT.model.ChatMessage;
import com.project.web_hand_made_TMDT.model.ChatRoom;
import com.project.web_hand_made_TMDT.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @GetMapping("/rooms/{userId}")
    public ResponseEntity<List<ChatRoom>> getRooms(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(chatService.getRoomsForUser(userId));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable("roomId") String roomId) {
        return ResponseEntity.ok(chatService.getMessagesForRoom(roomId));
    }

    @PostMapping("/rooms/{roomId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable("roomId") String roomId, @RequestParam("userId") Long userId) {
        chatService.markMessagesAsSeen(roomId, userId);
        return ResponseEntity.ok().build();
    }
}

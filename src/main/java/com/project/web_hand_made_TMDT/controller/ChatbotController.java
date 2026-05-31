package com.project.web_hand_made_TMDT.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.project.web_hand_made_TMDT.Service.ChatbotService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    /**
     * Endpoint nhận tin nhắn từ frontend và trả về response từ AI
     * Request body: { "message": "...", "history": [...] }
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, Object> request) {
        String message = (String) request.get("message");

        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("reply", "Vui lòng nhập câu hỏi của bạn! 😊"));
        }

        @SuppressWarnings("unchecked")
        List<Map<String, String>> history = (List<Map<String, String>>) request.get("history");

        String reply = chatbotService.chat(message.trim(), history);

        return ResponseEntity.ok(Map.of("reply", reply));
    }
}

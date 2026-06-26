package com.project.web_hand_made_TMDT.controller;

import com.project.web_hand_made_TMDT.model.CustomRequest;
import com.project.web_hand_made_TMDT.model.Product;
import com.project.web_hand_made_TMDT.repository.CustomRequestRepository;
import com.project.web_hand_made_TMDT.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import java.util.Date;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/custom-requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserCustomRequestController {

    private final CustomRequestRepository customRequestRepository;
    private final ProductRepository productRepository;

    @PostMapping("/submit")
    public ResponseEntity<?> submitCustomRequest(
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {

        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập để gửi yêu cầu thiết kế riêng"));
        }

        try {
            int productId = Integer.parseInt(payload.get("productId").toString());
            String customText = (String) payload.get("customText");
            String description = (String) payload.get("description");
            String referenceImg = (String) payload.get("referenceImg");

            Optional<Product> productOpt = productRepository.findById(productId);
            if (productOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Sản phẩm không tồn tại"));
            }

            Product product = productOpt.get();
            if (product.getShop() == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Sản phẩm này chưa thuộc về shop nào"));
            }

            int shopId = product.getShop().getId();

            CustomRequest customRequest = CustomRequest.builder()
                    .userId(userId)
                    .shopId(shopId)
                    .customText(customText != null ? customText : product.getName())
                    .description(description)
                    .referenceImg(referenceImg)
                    .status(0) // 0: PENDING
                    .quotedPrice(0)
                    .createdAt(new Date())
                    .build();

            customRequestRepository.save(customRequest);

            return ResponseEntity.ok(Map.of(
                    "success", true, 
                    "message", "Đã gửi yêu cầu báo giá cho Shop thành công! Vui lòng chờ phản hồi."
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Dữ liệu không hợp lệ: " + e.getMessage()));
        }
    }

    private Integer getLoggedInUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        return (Integer) session.getAttribute("userId");
    }
}

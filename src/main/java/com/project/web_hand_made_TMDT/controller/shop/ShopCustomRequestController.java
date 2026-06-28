package com.project.web_hand_made_TMDT.controller.shop;

import com.project.web_hand_made_TMDT.model.CustomRequest;
import com.project.web_hand_made_TMDT.model.Shop;
import com.project.web_hand_made_TMDT.model.User;
import com.project.web_hand_made_TMDT.repository.CustomRequestRepository;
import com.project.web_hand_made_TMDT.repository.ShopRepository;
import com.project.web_hand_made_TMDT.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shop/custom-requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ShopCustomRequestController {

    private final CustomRequestRepository customRequestRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    /**
     * Lấy danh sách yêu cầu custom của shop
     */
    @GetMapping
    public ResponseEntity<?> getShopCustomRequests(HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.ok(List.of()); // Chưa có shop thì không có dữ liệu
        }

        List<CustomRequest> requests = customRequestRepository.findByShopId(shopOpt.get().getId());

        // Lấy thông tin khách hàng
        Set<Integer> userIds = requests.stream()
                .map(CustomRequest::getUserId)
                .collect(Collectors.toSet());

        Map<Integer, String> userNameMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(
                        User::getId,
                        u -> (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "")
                ));

        List<Map<String, Object>> result = requests.stream().map(r -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", r.getId());
            map.put("userId", r.getUserId());
            map.put("customerName", userNameMap.getOrDefault(r.getUserId(), "Khách hàng #" + r.getUserId()));
            map.put("customText", r.getCustomText());
            map.put("description", r.getDescription());
            map.put("referenceImg", r.getReferenceImg());
            map.put("status", r.getStatus());
            map.put("quotedPrice", r.getQuotedPrice());
            map.put("createdAt", r.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Báo giá cho yêu cầu custom
     */
    @PutMapping("/{id}/quote")
    public ResponseEntity<?> quoteCustomRequest(
            @PathVariable int id,
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {

        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Chưa có thông tin shop"));
        }

        Integer quotedPrice = null;
        try {
            quotedPrice = Integer.parseInt(payload.get("quotedPrice").toString());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Giá báo không hợp lệ"));
        }

        if (quotedPrice < 0) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Giá báo không hợp lệ"));
        }

        int updated = customRequestRepository.updateQuote(id, shopOpt.get().getId(), quotedPrice);
        if (updated > 0) {
            return ResponseEntity.ok((Object) Map.of("success", true, "message", "Đã gửi báo giá thành công"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    private Integer getLoggedInUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        return (Integer) session.getAttribute("userId");
    }
}

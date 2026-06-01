package com.project.web_hand_made_TMDT.Controller.Shop;

import com.project.web_hand_made_TMDT.Model.Order;
import com.project.web_hand_made_TMDT.Model.User;
import com.project.web_hand_made_TMDT.Repository.OrderRepository;
import com.project.web_hand_made_TMDT.Repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shop/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ShopOrderController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    /**
     * Lấy danh sách đơn hàng theo userId của shop owner đang đăng nhập.
     * Trả về thêm trường customerName cho mỗi đơn hàng.
     */
    @GetMapping
    public ResponseEntity<?> getShopOrders(HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Vui lòng đăng nhập"
            ));
        }

        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);

        // Thu thập tất cả userId duy nhất từ các đơn hàng
        Set<Integer> userIds = orders.stream()
                .map(Order::getUserId)
                .collect(Collectors.toSet());

        // Lấy tất cả User tương ứng và tạo map id -> tên
        Map<Integer, String> userNameMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(
                        User::getId,
                        u -> (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "")
                ));

        // Map mỗi đơn hàng thành response có thêm customerName
        List<Map<String, Object>> result = orders.stream().map(o -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", o.getId());
            map.put("status", o.getStatus());
            map.put("userId", o.getUserId());
            map.put("customerName", userNameMap.getOrDefault(o.getUserId(), "Khách hàng #" + o.getUserId()));
            map.put("freeShipping", o.isFreeShipping());
            map.put("paymentTypeId", o.getPaymentTypeId());
            map.put("createdAt", o.getCreatedAt());
            map.put("updatedAt", o.getUpdatedAt());
            map.put("orderDetails", o.getOrderDetails());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Cập nhật trạng thái đơn hàng.
     * 0: Chờ duyệt, 1: Đã duyệt, 2: Đang giao, 3: Hoàn thành, 4: Hủy
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable int id,
            @RequestParam int status,
            HttpServletRequest request) {

        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Vui lòng đăng nhập"
            ));
        }

        if (status < 0 || status > 4) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Trạng thái không hợp lệ (0-4)"
            ));
        }

        return orderRepository.findById(id).map(order -> {
            order.setStatus(status);
            orderRepository.save(order);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cập nhật trạng thái thành công"
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Helper: Lấy userId từ session.
     */
    private Integer getLoggedInUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        return (Integer) session.getAttribute("userId");
    }
}
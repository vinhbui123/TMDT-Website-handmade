package com.project.web_hand_made_TMDT.controller.shop;

import com.project.web_hand_made_TMDT.model.Order;
import com.project.web_hand_made_TMDT.model.Shop;
import com.project.web_hand_made_TMDT.model.User;
import com.project.web_hand_made_TMDT.repository.OrderRepository;
import com.project.web_hand_made_TMDT.repository.ShopRepository;
import com.project.web_hand_made_TMDT.repository.UserRepository;
import com.project.web_hand_made_TMDT.repository.OrderDetailRepository;
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
    private final ShopRepository shopRepository;
    private final OrderDetailRepository orderDetailRepository;

    /**
     * Lấy danh sách đơn hàng có chứa sản phẩm của shop hiện tại.
     */
    @GetMapping
    public ResponseEntity<?> getShopOrders(HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.ok(List.of()); // Chưa có shop thì không có đơn hàng
        }

        int shopId = shopOpt.get().getId();

        // Lấy danh sách đơn hàng của shop
        List<Order> orders = orderRepository.findOrdersByShopId(shopId);

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
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable("id") int id,
            @RequestParam("status") int status,
            HttpServletRequest request) {

        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        if (status < 0 || status > 4) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Trạng thái không hợp lệ (0-4)"));
        }

        if (!orderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // Cập nhật status cho orders bằng custom query (tránh conflict với @OneToMany orderDetails)
        orderRepository.updateStatus(id, status);

        // Cập nhật status cho tất cả order details
        orderDetailRepository.updateStatusByOrderId(id, status);

        return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật trạng thái thành công"));
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
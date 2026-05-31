package com.project.web_hand_made_TMDT.Controller.Shop;

import com.project.web_hand_made_TMDT.Model.Order;
import com.project.web_hand_made_TMDT.Repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shop/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ShopOrderController {

    private final OrderRepository orderRepository;

    /**
     * Lấy danh sách đơn hàng theo userId của shop owner đang đăng nhập.
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
        return ResponseEntity.ok(orders);
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
package com.project.web_hand_made_TMDT.controller;

import com.project.web_hand_made_TMDT.model.Order;
import com.project.web_hand_made_TMDT.model.OrderReport;
import com.project.web_hand_made_TMDT.repository.OrderRepository;
import com.project.web_hand_made_TMDT.repository.OrderReportRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class OrderReportController {

    private final OrderReportRepository orderReportRepository;
    private final OrderRepository orderRepository;

    /**
     * Gửi báo cáo sự cố đơn hàng
     * POST /api/orders/{orderId}/report
     */
    @PostMapping("/{orderId}/report")
    public ResponseEntity<?> submitReport(
            @PathVariable("orderId") int orderId,
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {

        // Lấy userId từ session
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }
        int userId = (Integer) session.getAttribute("userId");

        // Kiểm tra đơn hàng tồn tại và thuộc về user này
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Không tìm thấy đơn hàng"));
        }
        Order order = orderOpt.get();
        if (order.getUserId() != userId) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Không có quyền báo cáo đơn hàng này"));
        }

        // Chỉ cho phép báo cáo khi đơn hàng đã Hoàn thành (status = 3)
        if (order.getStatus() != 3) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Chỉ có thể báo cáo đơn hàng đã giao"));
        }

        // Chặn báo cáo trùng (1 user chỉ báo cáo 1 lần / đơn)
        if (orderReportRepository.existsByOrderIdAndUserId(orderId, userId)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Bạn đã báo cáo đơn hàng này rồi"));
        }

        // Validate payload
        String reason = payload.getOrDefault("reason", "").toString().trim();
        String description = payload.getOrDefault("description", "").toString().trim();
        if (reason.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Vui lòng chọn lý do báo cáo"));
        }

        // Lưu báo cáo
        OrderReport report = OrderReport.builder()
                .orderId(orderId)
                .userId(userId)
                .reason(reason)
                .description(description)
                .build();
        orderReportRepository.save(report);

        return ResponseEntity.ok(Map.of("success", true, "message", "Báo cáo đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi trong 24h."));
    }

    /**
     * Kiểm tra xem user đã báo cáo đơn hàng này chưa
     * GET /api/orders/{orderId}/report/check
     */
    @GetMapping("/{orderId}/report/check")
    public ResponseEntity<?> checkReported(
            @PathVariable("orderId") int orderId,
            HttpServletRequest request) {

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            return ResponseEntity.ok(Map.of("reported", false));
        }
        int userId = (Integer) session.getAttribute("userId");
        boolean reported = orderReportRepository.existsByOrderIdAndUserId(orderId, userId);
        return ResponseEntity.ok(Map.of("reported", reported));
    }
}

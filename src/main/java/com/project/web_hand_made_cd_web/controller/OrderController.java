package com.project.web_hand_made_cd_web.controller;

import com.project.web_hand_made_cd_web.Model.Order;
import com.project.web_hand_made_cd_web.Service.OrderService;
import com.project.web_hand_made_cd_web.Service.VNPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class OrderController {

    private final OrderService orderService;
    private final VNPayService vnpayService;

    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        try {
            // 1. Giải nén dữ liệu
            int userId = Integer.parseInt(payload.get("userId").toString());
            String method = (String) payload.get("paymentMethod");

            // Vì bảng 'orders' của ông không lưu tiền, nên ta lấy số tiền từ Frontend gửi lên
            // để truyền sang cho VNPay.
            long totalAmount = Long.parseLong(payload.get("totalAmount").toString());

            @SuppressWarnings("unchecked")
            List<Integer> selectedProductIds = (List<Integer>) payload.get("selectedProductIds");

            // 2. Gọi Service tạo đơn (Chỉ lưu những gì DB ông có)
            Order order = orderService.placeOrder(userId, method, selectedProductIds);

            // 3. Xử lý phản hồi
            if ("bank_transfer".equalsIgnoreCase(method)) {
                String ipAddress = getClientIpAddress(request);

                // Tạo URL thanh toán VNPay bằng số tiền totalAmount lấy từ Payload
                String paymentUrl = vnpayService.createPaymentUrl(order.getId(), totalAmount, ipAddress);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "id", order.getId(), // Để Frontend chuyển hướng
                        "url", paymentUrl,   // Link VNPay
                        "message", "Đang chuyển hướng đến VNPay..."
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "id", order.getId(),
                        "message", "Đặt hàng thành công! Vui lòng thanh toán khi nhận hàng."
                ));
            }

        } catch (Exception e) {
            System.err.println("🔴 Lỗi tại OrderController: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<?> getHistory(@PathVariable int userId) {
        try {
            return ResponseEntity.ok(orderService.getUserOrders(userId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Không thể lấy lịch sử");
        }
    }
}
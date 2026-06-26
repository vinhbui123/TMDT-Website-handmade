package com.project.web_hand_made_TMDT.controller;

import java.io.UnsupportedEncodingException;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.web_hand_made_TMDT.service.VNPayService;
import com.project.web_hand_made_TMDT.config.VNPayConfig;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vnpay")
@RequiredArgsConstructor
// Đảm bảo không có dấu / ở cuối URL origin
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VNPayController {

    private final VNPayService vnpayService;

    /**
     * Tạo URL thanh toán VNPay
     */
    @GetMapping("/create-payment")
    public ResponseEntity<?> createPayment(
            @RequestParam("orderId") long orderId,
            @RequestParam("amount") long amount,
            HttpServletRequest request) {
        try {
            // 1. Lấy IP chuẩn (Đã fix IPv6 trong VNPayConfig mới)
            String ipAddress = VNPayConfig.getIpAddress(request);

            // 2. Tạo URL từ Service (Đã fix lỗi băm %20 và dấu cách)
            String paymentUrl = vnpayService.createPaymentUrl(orderId, amount, ipAddress);

            // 3. Trả về cho React
            return ResponseEntity.ok(Map.of("url", paymentUrl));
        } catch (UnsupportedEncodingException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi tạo link thanh toán: " + e.getMessage()));
        }
    }

    /**
     * Xử lý callback từ VNPay
     * VNPay sẽ gọi về link này: http://localhost:8080/api/vnpay/return
     */
    @GetMapping("/return")
    public ResponseEntity<?> handleVNPayReturn(HttpServletRequest request) {
        try {
            String responseCode = request.getParameter("vnp_ResponseCode");
            String txnRef = request.getParameter("vnp_TxnRef"); // Chuỗi dạng "60_171648..."
            String amount = request.getParameter("vnp_Amount");

            // 1. Tách lấy Order ID thực sự từ chuỗi txnRef
            String orderIdStr = txnRef.split("_")[0];
            long orderId = Long.parseLong(orderIdStr);

            if ("00".equals(responseCode)) {
                // TODO: Hải gọi Service cập nhật Database tại đây
                // Ví dụ: orderService.updatePaymentStatus(orderId, "SUCCESS");

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Thanh toán thành công đơn hàng: " + orderId,
                        "orderId", orderId,
                        "amount", Long.parseLong(amount) / 100 // Chia 100 để về tiền gốc
                ));
            } else {
                // Cập nhật trạng thái đơn hàng là thất bại hoặc đã hủy nếu cần
                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "message", "Thanh toán không thành công",
                        "responseCode", responseCode
                ));
            }
        } catch (NumberFormatException e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
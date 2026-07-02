package com.project.web_hand_made_TMDT.controller;

import com.project.web_hand_made_TMDT.model.CartItem;
import com.project.web_hand_made_TMDT.model.Coupon;
import com.project.web_hand_made_TMDT.model.Product;
import com.project.web_hand_made_TMDT.repository.CouponRepository;
import com.project.web_hand_made_TMDT.repository.ProductRepository;
import com.project.web_hand_made_TMDT.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/coupons")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CouponController {

    private final CouponRepository couponRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;

    public CouponController(CouponRepository couponRepository, ProductRepository productRepository, CartService cartService) {
        this.couponRepository = couponRepository;
        this.productRepository = productRepository;
        this.cartService = cartService;
    }

    /**
     * Validate mã giảm giá cho Buyer tại Checkout.
     * Body: { "code": "SUMMER50K", "selectedProductIds": [1,2,3], "totalAmount": 200000 }
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateCoupon(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        String code = ((String) body.get("code")).trim().toUpperCase();
        int totalAmount = body.get("totalAmount") != null ? Integer.parseInt(body.get("totalAmount").toString()) : 0;
        List<Integer> selectedProductIds = body.get("selectedProductIds") != null
                ? ((List<?>) body.get("selectedProductIds")).stream().map(o -> Integer.parseInt(o.toString())).collect(Collectors.toList())
                : List.of();

        // 1. Tìm mã giảm giá
        Optional<Coupon> couponOpt = couponRepository.findByCode(code);
        if (couponOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Mã giảm giá không tồn tại"));
        }

        Coupon coupon = couponOpt.get();

        // 2. Kiểm tra trạng thái
        if (!coupon.isActive()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Mã giảm giá đã bị vô hiệu hóa"));
        }

        // 3. Kiểm tra thời hạn
        LocalDateTime now = LocalDateTime.now();
        if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Mã giảm giá chưa đến thời gian sử dụng"));
        }
        if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Mã giảm giá đã hết hạn"));
        }

        // 4. Kiểm tra số lượt sử dụng
        if (coupon.getUsedCount() >= coupon.getQuantity()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Mã giảm giá đã hết lượt sử dụng"));
        }

        // 5. Kiểm tra sản phẩm có thuộc shop tạo mã không
        boolean belongsToShop = false;
        for (Integer productId : selectedProductIds) {
            Optional<Product> productOpt = productRepository.findById(productId);
            if (productOpt.isPresent() && productOpt.get().getShop() != null
                    && productOpt.get().getShop().getId() == coupon.getShopId()) {
                belongsToShop = true;
                break;
            }
        }
        if (!belongsToShop) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Mã giảm giá không áp dụng cho sản phẩm của shop này"));
        }

        // 6. Kiểm tra đơn hàng tối thiểu
        if (totalAmount < coupon.getMinOrderAmount()) {
            return ResponseEntity.ok(Map.of("success", false, "message",
                    "Đơn hàng tối thiểu " + String.format("%,d", coupon.getMinOrderAmount()) + "đ để áp dụng mã này"));
        }

        // 7. Tính số tiền giảm
        int discountAmount = coupon.calculateDiscount(totalAmount);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", "Áp dụng mã giảm giá thành công!");
        result.put("discountAmount", discountAmount);
        result.put("couponCode", coupon.getCode());
        result.put("discountType", coupon.getDiscountType());
        result.put("discountValue", coupon.getDiscountValue());

        return ResponseEntity.ok(result);
    }

    private Integer getLoggedInUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        return (Integer) session.getAttribute("userId");
    }
}

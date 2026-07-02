package com.project.web_hand_made_TMDT.controller.shop;

import com.project.web_hand_made_TMDT.model.Coupon;
import com.project.web_hand_made_TMDT.model.Shop;
import com.project.web_hand_made_TMDT.repository.CouponRepository;
import com.project.web_hand_made_TMDT.repository.ShopRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/shop/coupons")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ShopCouponController {

    private final CouponRepository couponRepository;
    private final ShopRepository shopRepository;

    public ShopCouponController(CouponRepository couponRepository, ShopRepository shopRepository) {
        this.couponRepository = couponRepository;
        this.shopRepository = shopRepository;
    }

    /**
     * Lấy danh sách mã giảm giá của shop.
     */
    @GetMapping
    public ResponseEntity<?> getShopCoupons(HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Coupon> coupons = couponRepository.findByShopIdOrderByCreatedAtDesc(shopOpt.get().getId());
        return ResponseEntity.ok(coupons);
    }

    /**
     * Tạo mã giảm giá mới.
     */
    @PostMapping
    public ResponseEntity<?> createCoupon(@RequestBody Coupon coupon, HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Bạn chưa có shop"));
        }

        // Chuẩn hóa mã giảm giá: viết hoa, loại bỏ khoảng trắng
        String code = coupon.getCode().trim().toUpperCase();
        coupon.setCode(code);

        // Kiểm tra mã đã tồn tại trong cùng shop chưa
        if (couponRepository.existsByCodeAndShopId(code, shopOpt.get().getId())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Shop của bạn đã có mã giảm giá này rồi"));
        }

        coupon.setShopId(shopOpt.get().getId());
        coupon.setUsedCount(0);
        coupon.setMinOrderAmount(coupon.getMinOrderAmount() != null ? coupon.getMinOrderAmount() : 0);
        coupon.setMaxDiscount(coupon.getMaxDiscount() != null ? coupon.getMaxDiscount() : 0);
        coupon.setQuantity(coupon.getQuantity() != null ? coupon.getQuantity() : 100);
        couponRepository.save(coupon);

        return ResponseEntity.ok(Map.of("success", true, "message", "Tạo mã giảm giá thành công"));
    }

    /**
     * Sửa mã giảm giá.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCoupon(@PathVariable("id") int id, @RequestBody Coupon updated, HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Bạn chưa có shop"));
        }

        Optional<Coupon> couponOpt = couponRepository.findById(id);
        if (couponOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Coupon coupon = couponOpt.get();

        // Verify ownership
        if (!java.util.Objects.equals(coupon.getShopId(), shopOpt.get().getId())) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Không có quyền chỉnh sửa"));
        }

        coupon.setDiscountType(updated.getDiscountType());
        coupon.setDiscountValue(updated.getDiscountValue());
        coupon.setMinOrderAmount(updated.getMinOrderAmount() != null ? updated.getMinOrderAmount() : 0);
        coupon.setMaxDiscount(updated.getMaxDiscount() != null ? updated.getMaxDiscount() : 0);
        coupon.setQuantity(updated.getQuantity() != null ? updated.getQuantity() : coupon.getQuantity());
        coupon.setStartDate(updated.getStartDate());
        coupon.setEndDate(updated.getEndDate());
        coupon.setActive(updated.isActive());

        couponRepository.save(coupon);
        return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật mã giảm giá thành công"));
    }

    /**
     * Xóa mã giảm giá.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCoupon(@PathVariable("id") int id, HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Bạn chưa có shop"));
        }

        Optional<Coupon> couponOpt = couponRepository.findById(id);
        if (couponOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (!java.util.Objects.equals(couponOpt.get().getShopId(), shopOpt.get().getId())) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Không có quyền xóa"));
        }

        couponRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa mã giảm giá"));
    }

    private Integer getLoggedInUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        return (Integer) session.getAttribute("userId");
    }
}

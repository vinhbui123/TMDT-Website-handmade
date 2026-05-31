package com.project.web_hand_made_TMDT.Controller.Shop;

import com.project.web_hand_made_TMDT.Model.User;
import com.project.web_hand_made_TMDT.Repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import java.util.Map;

@RestController
@RequestMapping("/api/shop/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ShopProfileController {

    private final UserRepository userRepository;

    /**
     * Lấy thông tin shop profile theo shopId.
     */
    @GetMapping("/{shopId}")
    public ResponseEntity<?> getShopProfile(@PathVariable int shopId) {
        return userRepository.findById(shopId)
                .map(user -> ResponseEntity.ok((Object) user))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Cập nhật tên và mô tả shop.
     * Chỉ cho phép chủ shop (user đang đăng nhập) cập nhật profile của mình.
     */
    @PutMapping("/{shopId}")
    public ResponseEntity<?> updateShopProfile(
            @PathVariable int shopId,
            @RequestBody User shopDetails,
            HttpServletRequest request) {

        Integer loggedInUserId = getLoggedInUserId(request);
        if (loggedInUserId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Vui lòng đăng nhập"
            ));
        }

        // Chỉ cho phép chủ shop cập nhật profile của chính mình
        if (loggedInUserId != shopId) {
            return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "Không có quyền cập nhật profile của người khác"
            ));
        }

        return userRepository.findById(shopId).map(shop -> {
            if (shopDetails.getLastName() != null) {
                shop.setLastName(shopDetails.getLastName());
            }
            if (shopDetails.getBio() != null) {
                shop.setBio(shopDetails.getBio());
            }
            if (shopDetails.getPhoneNumber() != null) {
                shop.setPhoneNumber(shopDetails.getPhoneNumber());
            }
            if (shopDetails.getAddress() != null) {
                shop.setAddress(shopDetails.getAddress());
            }

            User savedShop = userRepository.save(shop);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", savedShop
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
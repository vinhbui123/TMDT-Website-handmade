package com.project.web_hand_made_TMDT.controller.shop;

import com.project.web_hand_made_TMDT.model.Shop;
import com.project.web_hand_made_TMDT.repository.ShopRepository;
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

    private final ShopRepository shopRepository;

    /**
     * Lấy thông tin shop profile của user đang đăng nhập.
     * Cung cấp userId, trả về thông tin Shop của user đó.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyShopProfile(HttpServletRequest request) {
        Integer loggedInUserId = getLoggedInUserId(request);
        if (loggedInUserId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        return shopRepository.findByUserId(loggedInUserId)
                .map(shop -> ResponseEntity.ok((Object) shop))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Lấy thông tin shop profile theo shopId.
     */
    @GetMapping("/{shopId}")
    public ResponseEntity<?> getShopProfile(@PathVariable int shopId) {
        return shopRepository.findById(shopId)
                .map(shop -> ResponseEntity.ok((Object) shop))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Cập nhật thông tin shop.
     * Nếu user chưa có shop thì tạo mới.
     */
    @PutMapping("/me")
    public ResponseEntity<?> updateShopProfile(
            @RequestBody Shop shopDetails,
            HttpServletRequest request) {

        Integer loggedInUserId = getLoggedInUserId(request);
        if (loggedInUserId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Shop shop = shopRepository.findByUserId(loggedInUserId).orElseGet(() -> {
            Shop newShop = new Shop();
            // Assign the user reference.
            com.project.web_hand_made_TMDT.model.User user = new com.project.web_hand_made_TMDT.model.User();
            user.setId(loggedInUserId);
            newShop.setUser(user);
            return newShop;
        });

        if (shopDetails.getShopName() != null) shop.setShopName(shopDetails.getShopName());
        if (shopDetails.getDescription() != null) shop.setDescription(shopDetails.getDescription());
        if (shopDetails.getShopAddress() != null) shop.setShopAddress(shopDetails.getShopAddress());
        if (shopDetails.getShopLogo() != null) shop.setShopLogo(shopDetails.getShopLogo());

        Shop savedShop = shopRepository.save(shop);
        return ResponseEntity.ok(Map.of("success", true, "data", savedShop));
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
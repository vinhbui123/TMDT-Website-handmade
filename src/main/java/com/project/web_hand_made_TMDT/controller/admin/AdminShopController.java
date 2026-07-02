package com.project.web_hand_made_TMDT.controller.admin;

import com.project.web_hand_made_TMDT.model.Shop;
import com.project.web_hand_made_TMDT.model.User;
import com.project.web_hand_made_TMDT.repository.ShopRepository;
import com.project.web_hand_made_TMDT.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/shops")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AdminShopController {

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    private boolean isAdmin(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return false;
        Integer role = (Integer) session.getAttribute("role");
        return role != null && role == 1; // 1 is Admin
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingShops(HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Forbidden"));
        }
        // Lấy tất cả shops có status = 0 (Pending)
        List<Shop> pendingShops = shopRepository.findAll().stream()
                .filter(s -> s.getStatus() != null && s.getStatus() == 0)
                .toList();
        return ResponseEntity.ok(pendingShops);
    }

    @PostMapping("/{shopId}/approve")
    public ResponseEntity<?> approveShop(@PathVariable("shopId") int shopId, HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Forbidden"));
        }

        Optional<Shop> shopOpt = shopRepository.findById(shopId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Shop shop = shopOpt.get();
        shop.setStatus(1); // 1 = Approved
        shopRepository.save(shop);

        // Nâng cấp user role lên 2 (Seller)
        if (shop.getUser() != null) {
            User user = shop.getUser();
            user.setRole(2);
            userRepository.save(user);
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Đã phê duyệt shop thành công"));
    }

    @PostMapping("/{shopId}/reject")
    public ResponseEntity<?> rejectShop(@PathVariable("shopId") int shopId, HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Forbidden"));
        }

        Optional<Shop> shopOpt = shopRepository.findById(shopId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Shop shop = shopOpt.get();
        shop.setStatus(2); // 2 = Rejected
        shopRepository.save(shop);

        return ResponseEntity.ok(Map.of("success", true, "message", "Đã từ chối shop"));
    }
}

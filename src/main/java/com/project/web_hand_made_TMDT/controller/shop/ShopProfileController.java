package com.project.web_hand_made_TMDT.controller.shop;

import com.project.web_hand_made_TMDT.model.Shop;
import com.project.web_hand_made_TMDT.repository.ShopRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
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
    public ResponseEntity<?> getShopProfile(@PathVariable("shopId") int shopId) {
        return shopRepository.findById(shopId)
                .map(shop -> ResponseEntity.ok((Object) shop))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Cập nhật thông tin shop.
     * Nếu user chưa có shop thì tạo mới.
     */
    private static final String UPLOAD_DIR = "uploads/images/logos/";

    @PostMapping("/me")
    public ResponseEntity<?> updateShopProfile(
            @RequestParam("shopName") String shopName,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "shopAddress", required = false) String shopAddress,
            @RequestParam(value = "file", required = false) MultipartFile file,
            HttpServletRequest request) {

        Integer loggedInUserId = getLoggedInUserId(request);
        if (loggedInUserId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Shop shop = shopRepository.findByUserId(loggedInUserId).orElseGet(() -> {
            Shop newShop = new Shop();
            com.project.web_hand_made_TMDT.model.User user = new com.project.web_hand_made_TMDT.model.User();
            user.setId(loggedInUserId);
            newShop.setUser(user);
            return newShop;
        });

        if (shopName != null) shop.setShopName(shopName);
        if (description != null) shop.setDescription(description);
        if (shopAddress != null) shop.setShopAddress(shopAddress);

        try {
            if (file != null && !file.isEmpty()) {
                File directory = new File(UPLOAD_DIR);
                if (!directory.exists()) {
                    directory.mkdirs();
                }
                String originalFileName = file.getOriginalFilename();
                String fileExtension = "";
                if (originalFileName != null && originalFileName.contains(".")) {
                    fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
                }
                String newFileName = UUID.randomUUID().toString() + fileExtension;
                Path path = Paths.get(UPLOAD_DIR + newFileName);
                Files.write(path, file.getBytes());
                shop.setShopLogo("/images/logos/" + newFileName);
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Lỗi tải ảnh: " + e.getMessage()));
        }

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
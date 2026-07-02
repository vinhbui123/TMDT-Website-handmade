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
    private static final String UPLOAD_DIR_DOCS = "uploads/images/documents/";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final java.util.Set<String> ALLOWED_CONTENT_TYPES = java.util.Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    @PostMapping("/me")
    public ResponseEntity<?> updateShopProfile(
            @RequestParam("shopName") String shopName,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "shopAddress", required = false) String shopAddress,
            @RequestParam(value = "ownerName", required = false) String ownerName,
            @RequestParam(value = "identityCardNumber", required = false) String identityCardNumber,
            @RequestParam(value = "taxCode", required = false) String taxCode,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "identityCardFront", required = false) MultipartFile identityCardFront,
            @RequestParam(value = "identityCardBack", required = false) MultipartFile identityCardBack,
            HttpServletRequest request) {

        Integer loggedInUserId = getLoggedInUserId(request);
        if (loggedInUserId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        // === VALIDATION ===
        if (shopName == null || shopName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tên shop không được để trống."));
        }
        if (shopAddress == null || shopAddress.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Địa chỉ shop không được để trống."));
        }
        if (ownerName == null || ownerName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Họ tên chủ shop không được để trống."));
        }
        if (identityCardNumber != null && !identityCardNumber.trim().isEmpty()) {
            if (!identityCardNumber.trim().matches("\\d{12}")) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Số CCCD phải gồm đúng 12 chữ số."));
            }
        }

        // Validate file uploads (MIME type + size)
        String fileError = validateFile(file, "Logo");
        if (fileError != null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", fileError));
        fileError = validateFile(identityCardFront, "Ảnh CCCD mặt trước");
        if (fileError != null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", fileError));
        fileError = validateFile(identityCardBack, "Ảnh CCCD mặt sau");
        if (fileError != null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", fileError));

        Shop shop = shopRepository.findByUserId(loggedInUserId).orElseGet(() -> {
            Shop newShop = new Shop();
            com.project.web_hand_made_TMDT.model.User user = new com.project.web_hand_made_TMDT.model.User();
            user.setId(loggedInUserId);
            newShop.setUser(user);
            return newShop;
        });

        if (shopName != null) shop.setShopName(shopName.trim());
        if (description != null) shop.setDescription(description.trim());
        if (shopAddress != null) shop.setShopAddress(shopAddress.trim());
        if (ownerName != null) shop.setOwnerName(ownerName.trim());
        if (identityCardNumber != null) shop.setIdentityCardNumber(identityCardNumber.trim());
        if (taxCode != null) shop.setTaxCode(taxCode.trim());
        
        // Reset status to Pending (0) whenever updating profile for approval
        if (shop.getStatus() == null || shop.getStatus() == 2 || shop.getStatus() == 0) {
            shop.setStatus(0);
        }

        try {
            if (file != null && !file.isEmpty()) {
                shop.setShopLogo(saveFile(file, UPLOAD_DIR));
            }
            if (identityCardFront != null && !identityCardFront.isEmpty()) {
                shop.setIdentityCardFront(saveFile(identityCardFront, UPLOAD_DIR_DOCS));
            }
            if (identityCardBack != null && !identityCardBack.isEmpty()) {
                shop.setIdentityCardBack(saveFile(identityCardBack, UPLOAD_DIR_DOCS));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Lỗi tải ảnh: " + e.getMessage()));
        }

        Shop savedShop = shopRepository.save(shop);
        return ResponseEntity.ok(Map.of("success", true, "data", savedShop, "message", "Hồ sơ của bạn đã được gửi và đang chờ Admin duyệt."));
    }

    private String validateFile(MultipartFile file, String fieldName) {
        if (file == null || file.isEmpty()) return null;
        if (file.getSize() > MAX_FILE_SIZE) {
            return fieldName + " vượt quá kích thước tối đa 5MB.";
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            return fieldName + " phải là file ảnh (JPEG, PNG, GIF, WebP).";
        }
        return null;
    }

    private String saveFile(MultipartFile file, String uploadDir) throws Exception {
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String newFileName = UUID.randomUUID().toString() + fileExtension;
        Path path = Paths.get(uploadDir + newFileName);
        Files.write(path, file.getBytes());
        return "/" + uploadDir.replace("uploads/", "") + newFileName;
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
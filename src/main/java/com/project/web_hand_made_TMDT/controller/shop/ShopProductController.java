package com.project.web_hand_made_TMDT.controller.shop;

import com.project.web_hand_made_TMDT.model.Product;
import com.project.web_hand_made_TMDT.model.Shop;
import com.project.web_hand_made_TMDT.repository.ProductRepository;
import com.project.web_hand_made_TMDT.repository.ShopRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/shop/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ShopProductController {

    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;

    @Value("${file.upload-dir:src/main/resources/static/images/}")
    private String uploadDir;

    /**
     * Lấy danh sách sản phẩm theo shop hiện tại.
     */
    @GetMapping
    public ResponseEntity<?> getProductsByShop(HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.ok(List.of()); // Chưa có shop thì trả về mảng rỗng
        }

        List<Product> products = productRepository.findByShopId(shopOpt.get().getId());
        return ResponseEntity.ok(products);
    }

    /**
     * Lấy danh sách sản phẩm theo catalog_id.
     */
    @GetMapping("/catalog/{catalogId}")
    public ResponseEntity<?> getProductsByCatalog(@PathVariable int catalogId) {
        List<Product> products = productRepository.findByCatalogId(catalogId);
        return ResponseEntity.ok(products);
    }

    /**
     * Tạo sản phẩm mới.
     */
    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product product, HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Vui lòng tạo thông tin Shop trước khi đăng sản phẩm"));
        }

        try {
            product.setShop(shopOpt.get());
            Product saved = productRepository.save(product);
            return ResponseEntity.ok(Map.of("success", true, "data", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Lỗi tạo sản phẩm: " + e.getMessage()));
        }
    }

    /**
     * Cập nhật sản phẩm theo ID.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable int id,
            @RequestBody Product details,
            HttpServletRequest request) {

        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Chưa có thông tin shop"));
        }

        return productRepository.findById(id).map(product -> {
            // Kiểm tra xem sản phẩm có thuộc về shop này không
            if (product.getShop() == null || product.getShop().getId() != shopOpt.get().getId()) {
                 throw new RuntimeException("Không có quyền sửa sản phẩm này");
            }

            product.setName(details.getName());
            product.setPrice(details.getPrice());
            product.setDiscount(details.getDiscount());
            product.setDescription(details.getDescription());
            product.setCatalog_id(details.getCatalog_id());
            if (details.getImg() != null) {
                product.setImg(details.getImg());
            }
            Product saved = productRepository.save(product);
            return ResponseEntity.ok((Object) Map.of("success", true, "data", saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Xóa sản phẩm theo ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable int id, HttpServletRequest request) {
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        Optional<Shop> shopOpt = shopRepository.findByUserId(userId);
        if (shopOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Chưa có thông tin shop"));
        }

        return productRepository.findById(id).map(product -> {
            if (product.getShop() == null || product.getShop().getId() != shopOpt.get().getId()) {
                throw new RuntimeException("Không có quyền xóa sản phẩm này");
            }
            productRepository.delete(product);
            return ResponseEntity.ok((Object) Map.of("success", true, "message", "Đã xóa sản phẩm"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Upload ảnh sản phẩm.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {

        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập"));
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "File trống"));
        }

        try {
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String fileName = UUID.randomUUID() + "_" + (originalFilename != null ? originalFilename : "upload");
            Path path = Paths.get(uploadDir, fileName);
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

            return ResponseEntity.ok(Map.of("success", true, "url", "/images/" + fileName));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Lỗi upload: " + e.getMessage()));
        }
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
package com.project.web_hand_made_cd_web.controller;

import com.project.web_hand_made_cd_web.model.Product;
import com.project.web_hand_made_cd_web.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shop/products")
@CrossOrigin(origins = "*")
public class ShopProductController {

    @Autowired
    private ProductRepository productRepository;

    private final String UPLOAD_DIR = "src/main/resources/static/images/";

    @GetMapping("/owner/{shopId}")
    public List<Product> getProductsByShop(@PathVariable int shopId) {
        // Cần có hàm findByShopId trong ProductRepository
        return productRepository.findByShopId(shopId);
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        return ResponseEntity.ok(productRepository.save(product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable int id, @RequestBody Product details) {
        return productRepository.findById(id).map(product -> {
            product.setName(details.getName());
            product.setPrice(details.getPrice());
            product.setDiscount(details.getDiscount());
            product.setDescription(details.getDescription());
            product.setCatalogId(details.getCatalogId());
            if (details.getImg() != null) product.setImg(details.getImg());
            return ResponseEntity.ok(productRepository.save(product));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable int id) {
        return productRepository.findById(id).map(product -> {
            productRepository.delete(product);
            return ResponseEntity.ok().body("Đã xóa sản phẩm");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) dir.mkdirs();

            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path path = Paths.get(UPLOAD_DIR + fileName);
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

            return ResponseEntity.ok("/images/" + fileName);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Lỗi upload: " + e.getMessage());
        }
    }
}
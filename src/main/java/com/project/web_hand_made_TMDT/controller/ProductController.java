package com.project.web_hand_made_TMDT.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.web_hand_made_TMDT.dto.ProductDTO;
import com.project.web_hand_made_TMDT.model.Comment;
import com.project.web_hand_made_TMDT.model.Product;
import com.project.web_hand_made_TMDT.model.User;
import com.project.web_hand_made_TMDT.repository.ProductCustomizeFieldRepository;
import com.project.web_hand_made_TMDT.repository.UserRepository;
import com.project.web_hand_made_TMDT.service.ProductService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;
    private final ProductCustomizeFieldRepository customizeFieldRepository;

    @GetMapping("/products")
    public List<Product> getProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/products/page")
    public Page<ProductDTO> getProductsPage(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "12") int size,
            @RequestParam(value = "sort", defaultValue = "default") String sort,
            @RequestParam(value = "colorId", required = false) Integer colorId,
            @RequestParam(value = "materialId", required = false) Integer materialId,
            @RequestParam(value = "maxPrice", required = false) Integer maxPrice,
            @RequestParam(value = "keyword", required = false) String keyword) {
        return productService.getProductsPaginated(page, size, sort, colorId, materialId, maxPrice, keyword);
    }

    @GetMapping("/products/search")
    public List<ProductDTO> searchProducts(
            @RequestParam("keyword") String keyword) {

        return productService.searchProducts(keyword);
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable("id") int id) {
        Product product = productService.getProductById(id);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(product);
    }

    @GetMapping("/products/{id}/comments")
    public ResponseEntity<List<Map<String, Object>>> getProductComments(@PathVariable("id") int id) {
        List<Comment> comments = productService.getCommentsByProductId(id);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Comment c : comments) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("userId", c.getUserId());
            map.put("rating", c.getRating());
            map.put("comment", c.getComment());
            map.put("createAt", c.getCreateAt());
            
            // Lấy tên user
            if (c.getUserId() != null) {
                User u = userRepository.findById(c.getUserId()).orElse(null);
                if (u != null) {
                    map.put("userName", u.getFirstName() + " " + u.getLastName());
                }
            }
            result.add(map);
        }
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/products/{id}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable("id") int id,
            @RequestBody Map<String, Object> payload,
            HttpSession session) {

        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập"));
        }

        try {
            int rating = Integer.parseInt(payload.get("rating").toString());
            String comment = (String) payload.get("comment");

            productService.addComment(id, userId, rating, comment);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/products/{id}/customize-fields")
    public ResponseEntity<?> getProductCustomizeFields(@PathVariable("id") int id) {
        return ResponseEntity.ok(customizeFieldRepository.findByProductIdOrderBySortOrderAsc(id));
    }

    @GetMapping("/products/shop/{shopId}")
    public ResponseEntity<List<ProductDTO>> getProductsByShopId(@PathVariable("shopId") int shopId) {
        List<ProductDTO> products = productService.getProductsByShopId(shopId);
        return ResponseEntity.ok(products);
    }
}

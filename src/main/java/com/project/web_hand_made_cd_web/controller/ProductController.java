package com.project.web_hand_made_cd_web.controller;

import com.project.web_hand_made_cd_web.Dto.ProductDTO;
import com.project.web_hand_made_cd_web.Model.Product;
import com.project.web_hand_made_cd_web.Service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.web_hand_made_cd_web.Model.Comment;
import com.project.web_hand_made_cd_web.Model.User;
import com.project.web_hand_made_cd_web.Repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;

    @GetMapping("/products")
    public List<Product> getProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/products/page")
    public Page<ProductDTO> getProductsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "default") String sort,
            @RequestParam(required = false) Integer colorId,
            @RequestParam(required = false) Integer materialId,
            @RequestParam(required = false) Integer maxPrice
    ) {
        return productService.getProductsPaginated(page, size, sort, colorId, materialId, maxPrice);
    }

    @GetMapping("/products/search")
    public List<ProductDTO> searchProducts(
            @RequestParam String keyword) {

        return productService.searchProducts(keyword);
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable int id) {
        Product product = productService.getProductById(id);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(product);
    }

    @GetMapping("/products/{id}/comments")
    public ResponseEntity<List<Map<String, Object>>> getProductComments(@PathVariable int id) {
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
            @PathVariable int id,
            @RequestBody Map<String, Object> payload,
            HttpSession session) {

        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập"));
        }

        try {
            int rating = Integer.parseInt(payload.get("rating").toString());
            String comment = (String) payload.get("comment");

            productService.addComment(id, user.getId(), rating, comment);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

package com.project.web_hand_made_cd_web.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.project.web_hand_made_cd_web.Model.Product;
import com.project.web_hand_made_cd_web.Model.Comment;
import com.project.web_hand_made_cd_web.Model.User;
import com.project.web_hand_made_cd_web.Service.ProductService;
import jakarta.servlet.http.HttpSession;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class ProductController {

    private final ProductService productService;

    @GetMapping("/products")
    public List<Product> getProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable int id) {
        Product product = productService.getProductById(id);
        if (product != null) {
            return ResponseEntity.ok(product);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/products/{id}/comments")
    public ResponseEntity<List<Comment>> getCommentsByProductId(@PathVariable int id) {
        List<Comment> comments = productService.getCommentsByProductId(id);
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/products/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable int id, @RequestBody Comment comment, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(401).body("{\"message\": \"Vui lòng đăng nhập để đánh giá.\"}");
        }

        comment.setUserId(user.getId());
        comment.setProductId(id);
        
        Comment savedComment = productService.addComment(comment);
        return ResponseEntity.ok(savedComment);
    }
}

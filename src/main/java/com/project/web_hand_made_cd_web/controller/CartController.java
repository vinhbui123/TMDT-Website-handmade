package com.project.web_hand_made_cd_web.controller;

import com.project.web_hand_made_cd_web.Model.Cart;
import com.project.web_hand_made_cd_web.Service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
// Đảm bảo port 5001 hoặc 5173 khớp với React của bạn
@CrossOrigin(origins = "http://localhost:5001", allowCredentials = "true")
public class CartController {
    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    // 1. Thêm sản phẩm vào giỏ hàng
    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody Map<String, Object> request) {
        try {
            int productId = Integer.parseInt(request.get("productId").toString());
            int quantity = Integer.parseInt(request.getOrDefault("quantity", 1).toString());

            Cart cart = cartService.addProductToCart(productId, quantity);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "cartCount", cart.getTotalQuantity() // Trả về tổng số lượng (ví dụ: 2 táo + 1 cam = 3)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 2. Lấy thông tin giỏ hàng hiện tại
    @GetMapping
    public ResponseEntity<?> getCart() {
        try {
            Cart cart = cartService.getCart();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "items", cart.getItems(),
                    "total", cart.calculateTotal(),
                    "cartCount", cart.getTotalQuantity()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 3. Xóa sạch giỏ hàng (Hàm bạn cần đây)
    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart() {
        try {
            cartService.clearCart();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã xóa toàn bộ giỏ hàng",
                    "cartCount", 0
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    @PostMapping("/update")
    public ResponseEntity<?> updateCart(@RequestBody Map<String, Object> request) {
        try {
            int productId = Integer.parseInt(request.get("productId").toString());
            int quantity = Integer.parseInt(request.get("quantity").toString());

            // Gọi hàm updateProductQuantity đã có sẵn trong CartService.java của bạn
            Cart cart = cartService.updateProductQuantity(productId, quantity);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "cartCount", cart.getTotalQuantity(),
                    "total", cart.calculateTotal()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<?> removeItem(@PathVariable int productId) {
        try {
            Cart cart = cartService.removeProductFromCart(productId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "cartCount", cart.getTotalQuantity()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false));
        }
    }
}
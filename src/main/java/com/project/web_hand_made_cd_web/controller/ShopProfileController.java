package com.project.web_hand_made_cd_web.controller;

import com.project.web_hand_made_cd_web.model.User;
import com.project.web_hand_made_cd_web.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shop/profile")
@CrossOrigin(origins = "*")
public class ShopProfileController {

    @Autowired
    private UserRepository userRepository;

    // Lấy thông tin shop (Giả sử id của chủ shop đang đăng nhập là 1)
    @GetMapping("/{shopId}")
    public ResponseEntity<User> getShopProfile(@PathVariable int shopId) {
        return userRepository.findById(shopId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Cập nhật tên và mô tả shop
    @PutMapping("/{shopId}")
    public ResponseEntity<User> updateShopProfile(@PathVariable int shopId, @RequestBody User shopDetails) {
        return userRepository.findById(shopId).map(shop -> {
            shop.setLastName(shopDetails.getLastName()); // Tên hiển thị của Shop
            shop.setBio(shopDetails.getBio());           // Mô tả shop
            shop.setPhoneNumber(shopDetails.getPhoneNumber());
            shop.setAddress(shopDetails.getAddress());
            return ResponseEntity.ok(userRepository.save(shop));
        }).orElse(ResponseEntity.notFound().build());
    }
}
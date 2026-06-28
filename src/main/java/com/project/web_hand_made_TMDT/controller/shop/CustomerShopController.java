package com.project.web_hand_made_TMDT.controller;

import com.project.web_hand_made_TMDT.repository.ShopRepository;
import com.project.web_hand_made_TMDT.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/shops")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CustomerShopController {

    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;

    @GetMapping("/{shopId}")
    public ResponseEntity<?> getShopDetails(@PathVariable int shopId) {
        return shopRepository.findById(shopId)
            .map(shop -> ResponseEntity.ok(Map.of(
                "shop", shop,
                "products", productRepository.findByShopId(shopId)
            )))
            .orElse(ResponseEntity.notFound().build());
    }
}
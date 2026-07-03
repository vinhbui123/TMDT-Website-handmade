package com.project.web_hand_made_TMDT.controller;

import com.project.web_hand_made_TMDT.model.Cart;
import com.project.web_hand_made_TMDT.model.CartItem;
import com.project.web_hand_made_TMDT.model.Product;
import com.project.web_hand_made_TMDT.repository.ProductRepository;
import com.project.web_hand_made_TMDT.service.CartService;
import com.project.web_hand_made_TMDT.service.GHNService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ghn")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class GHNController {

    private final GHNService ghnService;
    private final CartService cartService;
    private final ProductRepository productRepository;

    @GetMapping("/provinces")
    public ResponseEntity<?> getProvinces() {
        Object data = ghnService.getProvinces();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/districts/{provinceId}")
    public ResponseEntity<?> getDistricts(@PathVariable("provinceId") int provinceId) {
        Object data = ghnService.getDistricts(provinceId);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/wards/{districtId}")
    public ResponseEntity<?> getWards(@PathVariable("districtId") int districtId) {
        Object data = ghnService.getWards(districtId);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/calculate-fee")
    public ResponseEntity<?> calculateFee(@RequestBody Map<String, Object> payload) {
        try {
            int toDistrictId = Integer.parseInt(payload.get("toDistrictId").toString());
            String toWardCode = payload.get("toWardCode").toString();
            
            @SuppressWarnings("unchecked")
            List<Integer> selectedProductIds = (List<Integer>) payload.get("selectedProductIds");

            Cart cart = cartService.getCart();
            List<CartItem> itemsToOrder = cart.getItems().stream()
                    .filter(item -> selectedProductIds.contains(item.getProductId()))
                    .collect(Collectors.toList());

            int totalWeight = 0;
            int orderLength = 1;
            int orderWidth = 1;
            int orderHeight = 0;
            int totalOrderValue = 0;

            List<Map<String, Object>> ghnItems = new ArrayList<>();
            // Track the shop to resolve from_district_id
            String shopAddress = null;

            for (CartItem item : itemsToOrder) {
                Product product = productRepository.findById(item.getProductId()).orElse(null);
                if (product != null) {
                    // Grab shop address from the first product's shop
                    if (shopAddress == null && product.getShop() != null && product.getShop().getShopAddress() != null) {
                        shopAddress = product.getShop().getShopAddress();
                    }

                    // Default sizes since Product doesn't have them yet
                    int w = 500; 
                    int length = 20; 
                    int width = 15; 
                    int height = 10; 

                    totalWeight += (w * item.getQuantity());
                    
                    if (length > orderLength) orderLength = length;
                    if (width > orderWidth) orderWidth = width;
                    orderHeight += (height * item.getQuantity());

                    totalOrderValue += item.getSubtotal();

                    Map<String, Object> itemObj = new HashMap<>();
                    itemObj.put("name", product.getName());
                    itemObj.put("quantity", item.getQuantity());
                    itemObj.put("weight", w);
                    itemObj.put("length", length);
                    itemObj.put("width", width);
                    itemObj.put("height", height);
                    ghnItems.add(itemObj);
                }
            }

            // Resolve from_district_id dynamically from shop address
            int fromDistrictId = ghnService.resolveDistrictIdFromAddress(shopAddress);

            int fee = ghnService.calculateFee(fromDistrictId, toDistrictId, toWardCode, totalWeight, orderLength, orderWidth, orderHeight, totalOrderValue, ghnItems);
            
            return ResponseEntity.ok(Map.of("success", true, "fee", fee));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}

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

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class ProductController {

    private final ProductService productService;

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
}

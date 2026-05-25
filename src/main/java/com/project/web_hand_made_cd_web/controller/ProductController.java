package com.project.web_hand_made_cd_web.controller;

import java.util.List;

import com.project.web_hand_made_cd_web.Dto.ProductDTO;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.web_hand_made_cd_web.Model.Product;
import com.project.web_hand_made_cd_web.Service.ProductService;

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

    @GetMapping("/products/search")
    public List<ProductDTO> searchProducts(
            @RequestParam String keyword) {

        return productService.searchProducts(keyword);
    }
}

package com.project.web_hand_made_cd_web.Service;

import com.project.web_hand_made_cd_web.Dto.ColorDTO;
import com.project.web_hand_made_cd_web.Dto.MaterialDTO;
import com.project.web_hand_made_cd_web.Dto.ProductDTO;
import com.project.web_hand_made_cd_web.Model.Product;
import com.project.web_hand_made_cd_web.Repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(int id) {
        return productRepository.findById(id).orElse(null);
    }

    public List<Product> getByCategory(int categoryId) {
        return productRepository.findByCatalogId(categoryId);
    }

    public void increaseView(int productId) {
        productRepository.incrementViewCount(productId);
    }

    public List<ProductDTO> searchProducts(String keyword) {
        List<Product> products = productRepository.searchByName(keyword);

        return products.stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<Product> getTopViewed(int limit) {
        return productRepository.findTopByOrderByViewDesc(PageRequest.of(0, limit));
    }

    public List<Product> getProductsByPage(int page, int size) {
        return productRepository.findAll(PageRequest.of(page, size)).getContent();
    }

    public long getTotalCount() {
        return productRepository.count();
    }

    public List<Product> getInStock() {
        return productRepository.findInStock();
    }

    public List<Product> getTopRated() {
        return productRepository.findTopRated();
    }

    private ProductDTO convertToDTO(Product product) {

        ProductDTO dto = new ProductDTO();

        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setImg(product.getImg());
        dto.setPrice(product.getPrice());
        dto.setDiscount(product.getDiscount());
        dto.setRating(product.getAverageRating());

        dto.setColors(
                product.getColors().stream().map(color -> {

                    ColorDTO colorDTO = new ColorDTO();

                    colorDTO.setId(color.getId());
                    colorDTO.setName(color.getName());

                    return colorDTO;

                }).toList()
        );

        dto.setMaterials(
                product.getMaterials().stream().map(material -> {

                    MaterialDTO materialDTO = new MaterialDTO();

                    materialDTO.setId(material.getId());
                    materialDTO.setName(material.getName());

                    return materialDTO;

                }).toList()
        );

        return dto;
    }
}
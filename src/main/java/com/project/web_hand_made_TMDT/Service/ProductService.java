package com.project.web_hand_made_TMDT.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.project.web_hand_made_TMDT.Dto.ColorDTO;
import com.project.web_hand_made_TMDT.Dto.MaterialDTO;
import com.project.web_hand_made_TMDT.Dto.ProductDTO;
import com.project.web_hand_made_TMDT.Model.Comment;
import com.project.web_hand_made_TMDT.Model.Product;
import com.project.web_hand_made_TMDT.Repository.CommentRepository;
import com.project.web_hand_made_TMDT.Repository.ProductRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CommentRepository commentRepository;

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

    public Page<ProductDTO> getProductsPaginated(int page, int size, String sort, Integer colorId, Integer materialId, Integer maxPrice) {
        // Mặc định sắp xếp theo ID giảm dần (Sản phẩm mới nhất)
        Sort sortOrder = Sort.by("id").descending();

        // Kiểm tra chuỗi 'sort' truyền từ frontend để đổi cách sắp xếp
        if ("price-asc".equals(sort)) {
            sortOrder = Sort.by("price").ascending();   // Giá tăng dần
        } else if ("price-desc".equals(sort)) {
            sortOrder = Sort.by("price").descending();  // Giá giảm dần
        } else if ("rating".equals(sort)) {
            // Vì averageRating là trường @Formula nên Hibernate tự hiểu và sort trong SQL được luôn!
            sortOrder = Sort.by("averageRating").descending(); // Đánh giá cao nhất
        } else if ("name-asc".equals(sort)) {
            sortOrder = Sort.by("name").ascending();    // Tên từ A đến Z
        } else if ("name-desc".equals(sort)) {
            sortOrder = Sort.by("name").descending();   // Tên từ Z đến A
        }

        // Khởi tạo đối tượng Pageable
        Pageable pageable = PageRequest.of(page, size, sortOrder);

        Integer filterColor = (colorId != null && colorId > 0) ? colorId : null;
        Integer filterMaterial = (materialId != null && materialId > 0) ? materialId : null;
        Integer filterMaxPrice = (maxPrice != null && maxPrice > 0) ? maxPrice : null;

        // Lấy Page<Product> từ Database
        Page<Product> productPage = productRepository.findByMultiFilters(filterColor, filterMaterial, filterMaxPrice, pageable);

        return productPage.map(this::convertToDTO);
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

    public List<Comment> getCommentsByProductId(int productId) {
        return commentRepository.findByProductIdOrderByCreateAtDesc(productId);
    }

    public Comment addComment(int productId, int userId, int rating, String commentContent) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));
            
        Comment comment = new Comment();
        comment.setProduct(product);
        comment.setUserId(userId);
        comment.setRating(rating);
        comment.setComment(commentContent);
        comment.setCreateAt(java.time.LocalDateTime.now());
        comment.setUpdatedAt(java.time.LocalDateTime.now());
        
        return commentRepository.save(comment);
    }
}
package com.project.web_hand_made_cd_web.Repository;

import com.project.web_hand_made_cd_web.Model.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> { // Changed String to Integer

    // Replacement for getByCategory
    @Query("SELECT p FROM Product p WHERE p.catalog_id = :catId")
    List<Product> findByCatalogId(@Param("catId") int catalogId);

    // Replacement for searchProducts (with random order)
    @Query(value = "SELECT * FROM products WHERE name LIKE CONCAT('%', :keyword, '%') ORDER BY RAND()", nativeQuery = true)
    List<Product> searchByNameNative(@Param("keyword") String keyword);

    // Replacement for getProductsInStock
    @Query("SELECT p FROM Product p JOIN Inventory i ON p.id = i.productId WHERE i.quantity > 0")
    List<Product> findInStock();

    // Replacement for getProductViewest
    List<Product> findTopByOrderByViewDesc(Pageable pageable);

    // Replacement for getProductsViewedAbove
    List<Product> findByViewGreaterThanEqualOrderByViewDesc(int minView);

    // Replacement for increaseView
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.view = p.view + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") int productId);

    // Replacement for getTopRatedProducts (Native Query due to complex AVG)
    @Query(value = "SELECT p.* FROM products p " +
            "JOIN comments c ON p.id = c.product_id " +
            "GROUP BY p.id " +
            "HAVING AVG(c.rating) > 4 " +
            "ORDER BY AVG(c.rating) DESC", nativeQuery = true)
    List<Product> findTopRated();
}
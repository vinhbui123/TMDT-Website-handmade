package com.project.web_hand_made_TMDT.repository;

import com.project.web_hand_made_TMDT.model.ProductCustomizeField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductCustomizeFieldRepository extends JpaRepository<ProductCustomizeField, Integer> {
    List<ProductCustomizeField> findByProductIdOrderBySortOrderAsc(int productId);
    void deleteByProductId(int productId);
}

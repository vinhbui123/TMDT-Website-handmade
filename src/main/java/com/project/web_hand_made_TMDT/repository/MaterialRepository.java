package com.project.web_hand_made_TMDT.repository;

import jakarta.persistence.Tuple;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.project.web_hand_made_TMDT.dto.MaterialDTO;
import com.project.web_hand_made_TMDT.model.Material;

import java.util.List;
import java.util.stream.Collectors;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Integer> {

    @Query(value = "SELECT m.id AS id, m.name AS name, COUNT(pm.product_id) AS productCount " +
            "FROM materials m " +
            "LEFT JOIN product_materials pm ON m.id = pm.material_id " +
            "GROUP BY m.id, m.name",
            nativeQuery = true)
    List<Tuple> _internalFindAllWithProductCount(); // Đặt tên ẩn để dùng nội bộ

    default List<MaterialDTO> findAllWithProductCount() {
        List<Tuple> rawData = _internalFindAllWithProductCount();

        return rawData.stream().map(tuple -> {
            MaterialDTO dto = new MaterialDTO();

            dto.setId(tuple.get("id", Integer.class));
            dto.setName(tuple.get("name", String.class));

            Object countObj = tuple.get("productCount");
            dto.setProductCount(countObj != null ? ((Number) countObj).intValue() : 0);

            return dto;
        }).collect(Collectors.toList());
    }
}
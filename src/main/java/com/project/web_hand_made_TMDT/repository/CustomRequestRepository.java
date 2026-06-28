package com.project.web_hand_made_TMDT.repository;

import com.project.web_hand_made_TMDT.model.CustomRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CustomRequestRepository extends JpaRepository<CustomRequest, Integer> {
    List<CustomRequest> findByShopId(int shopId);
    List<CustomRequest> findByUserId(int userId);

    @Modifying
    @Transactional
    @Query("UPDATE CustomRequest c SET c.quotedPrice = :quotedPrice, c.status = 1 WHERE c.id = :id AND c.shopId = :shopId")
    int updateQuote(@Param("id") int id, @Param("shopId") int shopId, @Param("quotedPrice") int quotedPrice);
}

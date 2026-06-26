package com.project.web_hand_made_TMDT.repository;

import com.project.web_hand_made_TMDT.model.CustomRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomRequestRepository extends JpaRepository<CustomRequest, Integer> {
    List<CustomRequest> findByShopId(int shopId);
    List<CustomRequest> findByUserId(int userId);
}

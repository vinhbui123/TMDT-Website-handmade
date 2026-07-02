package com.project.web_hand_made_TMDT.repository;

import com.project.web_hand_made_TMDT.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Integer> {
    Optional<Coupon> findByCode(String code);
    List<Coupon> findByShopIdOrderByCreatedAtDesc(int shopId);
    boolean existsByCode(String code);
}

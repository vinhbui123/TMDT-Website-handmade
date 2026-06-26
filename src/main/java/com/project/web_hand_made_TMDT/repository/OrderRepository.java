package com.project.web_hand_made_TMDT.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.web_hand_made_TMDT.model.Order;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByUserIdOrderByCreatedAtDesc(int userId);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.orderDetails od JOIN od.product p WHERE p.shop.id = :shopId ORDER BY o.createdAt DESC")
    List<Order> findOrdersByShopId(@Param("shopId") int shopId);
}
package com.project.web_hand_made_TMDT.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.web_hand_made_TMDT.Model.Order;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByUserIdOrderByCreatedAtDesc(int userId);
}
package com.project.web_hand_made_TMDT.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.web_hand_made_TMDT.model.OrderDetail;

import java.util.List;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {
    List<OrderDetail> findByOrderId(int orderId);
}
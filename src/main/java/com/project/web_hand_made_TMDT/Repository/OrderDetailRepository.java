package com.project.web_hand_made_TMDT.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.web_hand_made_TMDT.Model.OrderDetail;

import java.util.List;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {
    List<OrderDetail> findByOrderId(int orderId);
}
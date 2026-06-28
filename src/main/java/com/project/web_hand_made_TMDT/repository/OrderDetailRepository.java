package com.project.web_hand_made_TMDT.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.project.web_hand_made_TMDT.model.OrderDetail;

import java.util.List;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {
    List<OrderDetail> findByOrderId(int orderId);

    @Modifying
    @Transactional
    @Query("UPDATE OrderDetail od SET od.status = :status WHERE od.orderId = :orderId")
    void updateStatusByOrderId(@Param("orderId") int orderId, @Param("status") int status);
}
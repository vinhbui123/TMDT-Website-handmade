package com.project.web_hand_made_TMDT.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.web_hand_made_TMDT.model.OrderReport;

@Repository
public interface OrderReportRepository extends JpaRepository<OrderReport, Integer> {
    List<OrderReport> findByOrderId(int orderId);
    Optional<OrderReport> findByOrderIdAndUserId(int orderId, int userId);
    boolean existsByOrderIdAndUserId(int orderId, int userId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT r FROM OrderReport r, Order o JOIN o.orderDetails od JOIN od.product p WHERE r.orderId = o.id AND p.shop.id = :shopId ORDER BY r.createdAt DESC")
    List<OrderReport> findByShopId(@org.springframework.data.repository.query.Param("shopId") int shopId);
}

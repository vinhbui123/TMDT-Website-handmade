package com.project.web_hand_made_TMDT.repository;

import com.project.web_hand_made_TMDT.model.OrderReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderReportRepository extends JpaRepository<OrderReport, Integer> {
    List<OrderReport> findByOrderId(int orderId);
    Optional<OrderReport> findByOrderIdAndUserId(int orderId, int userId);
    boolean existsByOrderIdAndUserId(int orderId, int userId);
}
